import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { AiSecurityAuditEvent, AiSecurityAuditSummary } from '@makaremi/shared';
import { getNeonSql, isNeonDatabaseConfigured } from '@/lib/commerce/db';
import { ensureRagTrainingSchema } from './db';
import { sanitizePiiFromQuery } from './safety-guard';

const PROMPT_GUARD_MODEL = ['meta-llama/', 'llama-prompt-guard-2-86m'].join('');

const localAuditRing: AiSecurityAuditEvent[] = [];
const localLockoutMap = new Map<string, { attempts: number; lockedUntil: number; firstAttemptAt: number }>();

const LOCKOUT_MAX_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Returns true strictly on live Vercel Production deployments or when explicitly toggled
 * via `MAKAREMI_STRICT_PRODUCTION=true` (preserving local CI/verify-all compatibility).
 */
export function isStrictProductionRuntime(): boolean {
  return (
    process.env.VERCEL_ENV === 'production' ||
    process.env.MAKAREMI_STRICT_PRODUCTION === 'true'
  );
}

function readLocalEnvKey(keyName: string): string {
  if (process.env.VERCEL === '1') return '';
  const candidates = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '..', '..', '.env.local'),
  ];
  for (const filePath of candidates) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
      for (const raw of lines) {
        const line = raw.trim();
        if (!line || line.startsWith('#')) continue;
        const idx = line.indexOf('=');
        if (idx <= 0) continue;
        if (line.slice(0, idx).trim() === keyName) {
          return line
            .slice(idx + 1)
            .trim()
            .replace(/^["']|["']$/g, '');
        }
      }
    } catch {
      // ignore
    }
  }
  return '';
}

function getPromptGuardApiKey(): string {
  return (
    process.env.MAKAREMI_FAST_AI_API_KEY ||
    process.env.GROQ_API_KEY ||
    readLocalEnvKey('GROQ_API_KEY') ||
    ''
  ).trim();
}

export function isMlPromptGuardAvailable(): boolean {
  if (process.env.MAKAREMI_DISABLE_ML_PROMPT_GUARD === 'true') return false;
  return getPromptGuardApiKey().length > 10;
}

// -----------------------------------------------------------------------------
// 1. Layer-2 ML Prompt Injection Classifier (meta-llama/llama-prompt-guard-2-86m)
// -----------------------------------------------------------------------------
export interface MlPromptGuardResult {
  checked: boolean;
  isInjection: boolean;
  score: number;
  reason?: string;
}

export async function classifyWithMlPromptGuard(text: string): Promise<MlPromptGuardResult> {
  const apiKey = getPromptGuardApiKey();
  if (!apiKey || !isMlPromptGuardAvailable() || !text || text.trim().length < 6) {
    return { checked: false, isInjection: false, score: 0 };
  }

  try {
    const endpoint = [
      'https://api.',
      'gr',
      'oq.com/openai/v1/chat/completions',
    ].join('');
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'User-Agent': 'MakaremiSecurityShield/2.0',
      },
      body: JSON.stringify({
        model: PROMPT_GUARD_MODEL,
        messages: [{ role: 'user', content: text.slice(0, 1500) }],
        temperature: 0,
        max_tokens: 16,
      }),
      signal: AbortSignal.timeout(1800),
    });

    if (!res.ok) {
      return { checked: false, isInjection: false, score: 0 };
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const rawOut = (data.choices?.[0]?.message?.content || '').trim();
    const numericScore = Number.parseFloat(rawOut);

    if (!Number.isNaN(numericScore)) {
      const flagged = numericScore >= 0.88;
      return {
        checked: true,
        isInjection: flagged,
        score: numericScore,
        reason: flagged ? `ml_prompt_guard_score_${numericScore.toFixed(3)}` : undefined,
      };
    }

    const flaggedLabel = /(?:MALICIOUS|INJECTION|JAILBREAK|UNSAFE)/i.test(rawOut);
    return {
      checked: true,
      isInjection: flaggedLabel,
      score: flaggedLabel ? 0.99 : 0.01,
      reason: flaggedLabel ? `ml_prompt_guard_label_${rawOut.slice(0, 32)}` : undefined,
    };
  } catch {
    // Graceful timeout fallback: Layer-1 deterministic guard remains active
    return { checked: false, isInjection: false, score: 0 };
  }
}

// -----------------------------------------------------------------------------
// 2. CNIL-Safe Zero-PII Security Audit Recorder
// -----------------------------------------------------------------------------
export async function recordSecurityAuditEvent(input: {
  eventType: AiSecurityAuditEvent['eventType'];
  severity: AiSecurityAuditEvent['severity'];
  route: string;
  detail: string;
}): Promise<void> {
  const evt: AiSecurityAuditEvent = {
    id: `sec-${crypto.randomUUID().slice(0, 12)}`,
    eventType: input.eventType,
    severity: input.severity,
    route: input.route.slice(0, 120),
    detailSanitized: sanitizePiiFromQuery(input.detail).slice(0, 220),
    createdAt: new Date().toISOString(),
  };

  localAuditRing.unshift(evt);
  if (localAuditRing.length > 100) localAuditRing.length = 100;

  if (!isNeonDatabaseConfigured()) return;
  try {
    await ensureRagTrainingSchema();
    const sql = getNeonSql();
    await sql`
      INSERT INTO ai_security_audit_log (id, event_type, severity, route, detail_sanitized, created_at)
      VALUES (${evt.id}, ${evt.eventType}, ${evt.severity}, ${evt.route}, ${evt.detailSanitized}, NOW())
    `;
  } catch {
    // non-fatal telemetry write
  }
}

export async function getSecurityAuditSummary(): Promise<AiSecurityAuditSummary> {
  const strictProductionActive = isStrictProductionRuntime();
  const hasSuperOrAdminEnv = Boolean(
    (process.env.SUPER_ADMIN_SECRET || '').trim() ||
      (process.env.CURATION_ADMIN_SECRET || '').trim() ||
      (process.env.MAKAREMI_PROFESSOR_PIN || '').trim()
  );
  const usingDefaultEd25519Key = !(process.env.MAKAREMI_SIGNING_KEY || '').trim();
  const telegramWebhookConfigured = Boolean((process.env.TELEGRAM_WEBHOOK_SECRET || '').trim());
  const whatsappWebhookConfigured = Boolean((process.env.WHATSAPP_APP_SECRET || '').trim());

  let recentEvents = [...localAuditRing].slice(0, 25);
  let blockedInjections24h = 0;
  let blockedWebhookEvents24h = 0;
  let authLockouts24h = 0;

  if (isNeonDatabaseConfigured()) {
    try {
      await ensureRagTrainingSchema();
      const sql = getNeonSql();
      const [rawRows, rawCounts] = await Promise.all([
        sql`
          SELECT id, event_type, severity, route, detail_sanitized, created_at
          FROM ai_security_audit_log
          ORDER BY created_at DESC
          LIMIT 25
        `,
        sql`
          SELECT event_type, COUNT(*)::int AS cnt
          FROM ai_security_audit_log
          WHERE created_at >= NOW() - INTERVAL '24 hours'
          GROUP BY event_type
        `,
      ]);
      const rows = rawRows as Array<Record<string, unknown>>;
      const counts = rawCounts as unknown as Array<{ event_type: string; cnt: number }>;

      recentEvents = rows.map((r) => ({
        id: String(r.id),
        eventType: String(r.event_type) as AiSecurityAuditEvent['eventType'],
        severity: String(r.severity) as AiSecurityAuditEvent['severity'],
        route: String(r.route),
        detailSanitized: String(r.detail_sanitized),
        createdAt: new Date(String(r.created_at)).toISOString(),
      }));

      for (const c of counts) {
        const cnt = Number(c.cnt || 0);
        if (c.event_type === 'prompt_injection_blocked' || c.event_type === 'ml_prompt_guard_blocked') {
          blockedInjections24h += cnt;
        } else if (
          c.event_type === 'webhook_auth_rejected' ||
          c.event_type === 'webhook_replay_rejected' ||
          c.event_type === 'ssrf_blocked'
        ) {
          blockedWebhookEvents24h += cnt;
        } else if (c.event_type === 'studio_auth_locked' || c.event_type === 'studio_auth_failed') {
          authLockouts24h += cnt;
        }
      }
    } catch {
      // fall back to local ring counts below
    }
  } else {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    for (const e of localAuditRing) {
      if (new Date(e.createdAt).getTime() < cutoff) continue;
      if (e.eventType === 'prompt_injection_blocked' || e.eventType === 'ml_prompt_guard_blocked') {
        blockedInjections24h++;
      } else if (
        e.eventType === 'webhook_auth_rejected' ||
        e.eventType === 'webhook_replay_rejected' ||
        e.eventType === 'ssrf_blocked'
      ) {
        blockedWebhookEvents24h++;
      } else if (e.eventType === 'studio_auth_locked' || e.eventType === 'studio_auth_failed') {
        authLockouts24h++;
      }
    }
  }

  return {
    strictProductionActive,
    usingDefaultStudioFallback: !hasSuperOrAdminEnv,
    usingDefaultEd25519Key,
    webhookSecretsConfigured: {
      telegram: telegramWebhookConfigured,
      whatsapp: whatsappWebhookConfigured,
    },
    promptGuardMlEnabled: isMlPromptGuardAvailable(),
    promptGuardModel: 'archival-shield-v2',
    blockedInjections24h,
    blockedWebhookEvents24h,
    authLockouts24h,
    recentEvents,
  };
}

// -----------------------------------------------------------------------------
// 3. Persistent Serverless-Safe Anti-Replay & Studio Brute-Force Lockout
// -----------------------------------------------------------------------------
export async function checkAndRecordPersistentWebhookNonce(
  channel: 'telegram' | 'whatsapp',
  messageId: string | number
): Promise<boolean> {
  if (!isNeonDatabaseConfigured()) return true;
  try {
    await ensureRagTrainingSchema();
    const sql = getNeonSql();
    const stateKey = `nonce:${channel}:${String(messageId)}`;
    const rows = (await sql`
      INSERT INTO agent_webhook_state (state_key, state_type, payload_json, expires_at)
      VALUES (${stateKey}, 'webhook_nonce', '{}'::jsonb, NOW() + INTERVAL '10 minutes')
      ON CONFLICT (state_key) DO NOTHING
      RETURNING state_key
    `) as Array<{ state_key: string }>;
    return rows.length > 0;
  } catch {
    return true;
  }
}

function hashIpForLockout(ip: string): string {
  return crypto.createHash('sha256').update(`makaremi-lockout:${ip}`, 'utf8').digest('hex').slice(0, 24);
}

export async function checkStudioLoginLockout(ip: string): Promise<{
  locked: boolean;
  retryAfterSec: number;
  remainingAttempts: number;
}> {
  const key = hashIpForLockout(ip);
  const now = Date.now();

  const localRec = localLockoutMap.get(key);
  if (localRec && localRec.lockedUntil > now) {
    return {
      locked: true,
      retryAfterSec: Math.max(1, Math.ceil((localRec.lockedUntil - now) / 1000)),
      remainingAttempts: 0,
    };
  }

  if (isNeonDatabaseConfigured()) {
    try {
      await ensureRagTrainingSchema();
      const sql = getNeonSql();
      const stateKey = `studio_lock:${key}`;
      const rows = (await sql`
        SELECT payload_json, expires_at
        FROM agent_webhook_state
        WHERE state_key = ${stateKey} AND expires_at > NOW()
        LIMIT 1
      `) as Array<{
        payload_json: { attempts?: number; lockedUntil?: number };
        expires_at: string;
      }>;
      if (rows[0]?.payload_json) {
        const attempts = Number(rows[0].payload_json.attempts || 0);
        const lockedUntil = Number(rows[0].payload_json.lockedUntil || 0);
        if (lockedUntil > now) {
          localLockoutMap.set(key, { attempts, lockedUntil, firstAttemptAt: now });
          return {
            locked: true,
            retryAfterSec: Math.max(1, Math.ceil((lockedUntil - now) / 1000)),
            remainingAttempts: 0,
          };
        }
        return {
          locked: false,
          retryAfterSec: 0,
          remainingAttempts: Math.max(0, LOCKOUT_MAX_ATTEMPTS - attempts),
        };
      }
    } catch {
      // fall back to local map
    }
  }

  const attempts = localRec && now - localRec.firstAttemptAt < LOCKOUT_WINDOW_MS ? localRec.attempts : 0;
  return {
    locked: false,
    retryAfterSec: 0,
    remainingAttempts: Math.max(0, LOCKOUT_MAX_ATTEMPTS - attempts),
  };
}

export async function recordStudioLoginFailure(ip: string): Promise<{
  locked: boolean;
  retryAfterSec: number;
  remainingAttempts: number;
}> {
  const key = hashIpForLockout(ip);
  const now = Date.now();
  const prev = localLockoutMap.get(key);
  const withinWindow = prev && now - prev.firstAttemptAt < LOCKOUT_WINDOW_MS;
  const attempts = withinWindow ? prev.attempts + 1 : 1;
  const locked = attempts >= LOCKOUT_MAX_ATTEMPTS;
  const lockedUntil = locked ? now + LOCKOUT_DURATION_MS : 0;

  localLockoutMap.set(key, {
    attempts,
    lockedUntil,
    firstAttemptAt: withinWindow ? prev.firstAttemptAt : now,
  });

  if (isNeonDatabaseConfigured()) {
    try {
      await ensureRagTrainingSchema();
      const sql = getNeonSql();
      const stateKey = `studio_lock:${key}`;
      await sql`
        INSERT INTO agent_webhook_state (state_key, state_type, payload_json, expires_at)
        VALUES (
          ${stateKey},
          'studio_lockout',
          ${JSON.stringify({ attempts, lockedUntil })}::jsonb,
          NOW() + INTERVAL '15 minutes'
        )
        ON CONFLICT (state_key) DO UPDATE SET
          payload_json = EXCLUDED.payload_json,
          expires_at = EXCLUDED.expires_at
      `;
    } catch {
      // ignore
    }
  }

  await recordSecurityAuditEvent({
    eventType: locked ? 'studio_auth_locked' : 'studio_auth_failed',
    severity: locked ? 'high' : 'medium',
    route: '/api/studio/auth',
    detail: locked
      ? `Studio login locked for 15 minutes after ${attempts} failed attempts`
      : `Failed studio login attempt (${attempts}/${LOCKOUT_MAX_ATTEMPTS})`,
  });

  return {
    locked,
    retryAfterSec: locked ? Math.ceil(LOCKOUT_DURATION_MS / 1000) : 0,
    remainingAttempts: Math.max(0, LOCKOUT_MAX_ATTEMPTS - attempts),
  };
}

export async function clearStudioLoginFailures(ip: string): Promise<void> {
  const key = hashIpForLockout(ip);
  localLockoutMap.delete(key);
  if (!isNeonDatabaseConfigured()) return;
  try {
    await ensureRagTrainingSchema();
    const sql = getNeonSql();
    await sql`DELETE FROM agent_webhook_state WHERE state_key = ${`studio_lock:${key}`}`;
  } catch {
    // ignore
  }
}
