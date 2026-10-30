import crypto from 'node:crypto';

// -----------------------------------------------------------------------------
// Default Deterministic Configuration (CI/CD & Local Fallbacks)
// -----------------------------------------------------------------------------
export const TELEGRAM_WEBHOOK_SECRET =
  process.env.TELEGRAM_WEBHOOK_SECRET || 'makaremi-tg-secret-2026';

export const WHATSAPP_APP_SECRET =
  process.env.WHATSAPP_APP_SECRET || 'makaremi-wa-secret-2026';

export const WHATSAPP_VERIFY_TOKEN =
  process.env.WHATSAPP_VERIFY_TOKEN || 'makaremi-wa-verify-2026';

export const TELEGRAM_PROFESSOR_USER_ID =
  process.env.TELEGRAM_PROFESSOR_USER_ID || '19501329';

export const WHATSAPP_PROFESSOR_PHONE =
  process.env.WHATSAPP_PROFESSOR_PHONE || '+33619501329';

// -----------------------------------------------------------------------------
// 1. Webhook Signature & Secret Verification (Timing-Attack Immune)
// -----------------------------------------------------------------------------

/**
 * Constant-time comparison of Telegram Bot secret token header.
 * Hashes both strings with SHA-256 prior to timingSafeEqual to guarantee identical lengths.
 */
export function verifyTelegramSecretToken(
  receivedToken: string | null | undefined,
  expectedSecret: string = TELEGRAM_WEBHOOK_SECRET
): boolean {
  if (!receivedToken || !expectedSecret) return false;

  const a = crypto.createHash('sha256').update(String(receivedToken), 'utf-8').digest();
  const b = crypto.createHash('sha256').update(String(expectedSecret), 'utf-8').digest();
  return crypto.timingSafeEqual(a, b);
}

/**
 * Constant-time comparison of WhatsApp Business API HMAC-SHA256 signature (`X-Hub-Signature-256`).
 */
export function verifyWhatsAppSignature(
  rawBody: Buffer | string,
  signatureHeader: string | null | undefined,
  appSecret: string = WHATSAPP_APP_SECRET
): boolean {
  if (!signatureHeader || !appSecret) return false;

  const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf-8');
  const computedHashHex = crypto
    .createHmac('sha256', appSecret)
    .update(bodyBuffer)
    .digest('hex');

  const expectedSignature = `sha256=${computedHashHex}`;

  const a = crypto.createHash('sha256').update(String(signatureHeader), 'utf-8').digest();
  const b = crypto.createHash('sha256').update(expectedSignature, 'utf-8').digest();

  return crypto.timingSafeEqual(a, b);
}

// -----------------------------------------------------------------------------
// 2. Strict Whitelist Verification for Dr. Makaremi
// -----------------------------------------------------------------------------

export function isAuthorizedProfessorTelegram(userId: number | string | undefined): boolean {
  if (!userId) return false;
  return String(userId).trim() === TELEGRAM_PROFESSOR_USER_ID.trim();
}

export function isAuthorizedProfessorWhatsApp(phone: string | undefined): boolean {
  if (!phone) return false;
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  const cleanTarget = WHATSAPP_PROFESSOR_PHONE.replace(/[\s\-\(\)]/g, '');
  return cleanPhone === cleanTarget || cleanPhone.endsWith(cleanTarget.replace('+', ''));
}

// -----------------------------------------------------------------------------
// 3. Anti-Replay Guard (Bounded Nonce Cache + Timestamp Window)
// -----------------------------------------------------------------------------

const REPLAY_WINDOW_MS = 300_000; // 300 seconds (5 minutes)
const MAX_PROCESSED_IDS = 10_000;
const processedMessageIds = new Map<string, number>();

function pruneOldIds(now: number) {
  if (processedMessageIds.size < MAX_PROCESSED_IDS) return;
  for (const [id, timestamp] of processedMessageIds.entries()) {
    if (now - timestamp > REPLAY_WINDOW_MS) {
      processedMessageIds.delete(id);
    }
  }
}

/**
 * Validates message novelty and freshness.
 * Rejects duplicate IDs or timestamps older than 300s relative to server time.
 */
export function validateAntiReplay(
  id: string | number,
  timestampSecOrMs: number
): { valid: boolean; reason?: string } {
  const now = Date.now();
  pruneOldIds(now);

  const key = String(id);
  if (processedMessageIds.has(key)) {
    return { valid: false, reason: 'Duplicate message ID detected (Replay attack prevention)' };
  }

  // Convert seconds to milliseconds if timestamp is in Unix seconds
  const messageTimeMs =
    timestampSecOrMs < 10_000_000_000 ? timestampSecOrMs * 1000 : timestampSecOrMs;

  const diffMs = Math.abs(now - messageTimeMs);
  if (diffMs > REPLAY_WINDOW_MS) {
    return {
      valid: false,
      reason: `Message timestamp outside acceptable window (${Math.round(diffMs / 1000)}s diff > 300s)`,
    };
  }

  processedMessageIds.set(key, now);
  return { valid: true };
}

// -----------------------------------------------------------------------------
// 4. Two-Factor Publish Challenge (3-Attempt Lockout + Timing-Safe Verification)
// -----------------------------------------------------------------------------

interface PublishChallengeRecord {
  pin: string;
  expiresAt: number;
  attempts: number;
}

const activeChallenges = new Map<string, PublishChallengeRecord>();
const CHALLENGE_TTL_MS = 180_000; // 3 minutes

export function createPublishChallenge(sessionId: string): { pin: string; expiresAt: number } {
  const pin = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = Date.now() + CHALLENGE_TTL_MS;

  activeChallenges.set(sessionId, {
    pin,
    expiresAt,
    attempts: 0,
  });

  return { pin, expiresAt };
}

export function getPublishChallenge(sessionId: string): PublishChallengeRecord | undefined {
  const challenge = activeChallenges.get(sessionId);
  if (!challenge) return undefined;
  if (Date.now() > challenge.expiresAt) {
    activeChallenges.delete(sessionId);
    return undefined;
  }
  return challenge;
}

export function revokePublishChallenge(sessionId: string): void {
  activeChallenges.delete(sessionId);
}

export interface VerifyChallengeResult {
  valid: boolean;
  error?: string;
  attemptsLeft?: number;
  revoked?: boolean;
}

/**
 * Constant-time verification of 2FA PIN challenge with 3-attempt brute-force lockout.
 */
export function verifyPublishChallenge(
  sessionId: string,
  submittedPin: string | null | undefined
): VerifyChallengeResult {
  const challenge = activeChallenges.get(sessionId);

  if (!challenge) {
    return { valid: false, error: 'No active publish challenge found. Please initiate a new draft.' };
  }

  if (Date.now() > challenge.expiresAt) {
    activeChallenges.delete(sessionId);
    return { valid: false, error: 'Publish challenge has expired (3 minutes limit). Please request a new PIN.' };
  }

  challenge.attempts += 1;

  if (!submittedPin || typeof submittedPin !== 'string') {
    if (challenge.attempts >= 3) {
      activeChallenges.delete(sessionId);
      return { valid: false, error: 'Maximum attempts exceeded (3/3). Challenge revoked.', revoked: true };
    }
    return {
      valid: false,
      error: 'Missing PIN parameter.',
      attemptsLeft: 3 - challenge.attempts,
    };
  }

  // Timing-safe comparison of PIN using SHA-256
  const cleanSubmitted = submittedPin.trim();
  const a = crypto.createHash('sha256').update(cleanSubmitted, 'utf-8').digest();
  const b = crypto.createHash('sha256').update(challenge.pin, 'utf-8').digest();

  const isMatch = crypto.timingSafeEqual(a, b);

  if (isMatch) {
    // Single-use: delete immediately upon successful verification
    activeChallenges.delete(sessionId);
    return { valid: true };
  }

  // Failed match
  if (challenge.attempts >= 3) {
    activeChallenges.delete(sessionId);
    return {
      valid: false,
      error: 'Maximum PIN verification attempts exceeded (3/3). Challenge revoked.',
      revoked: true,
      attemptsLeft: 0,
    };
  }

  return {
    valid: false,
    error: `Incorrect PIN. Remaining attempts: ${3 - challenge.attempts}`,
    attemptsLeft: 3 - challenge.attempts,
  };
}

// -----------------------------------------------------------------------------
// 5. Indirect Prompt Injection & HTML/XSS Guards
// -----------------------------------------------------------------------------

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const FORBIDDEN_PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /system\s*prompt\s*override/i,
  /you\s+are\s+now\s+in\s+developer\s+mode/i,
  /delete\s+all\s+(posts|articles|database)/i,
  /drop\s+table/i,
  /reveal\s+(secret|api_key|token|private\s+key)/i,
  /دستورات\s+قبلی\s+را\s+نادیده\s+بگیر/i,
  /تمام\s+مقالات\s+را\s+پاک\s+کن/i,
];

export function sanitizeAndCheckPromptInjection(rawContent: string): {
  isSafe: boolean;
  sanitized: string;
  rejectionReason?: string;
} {
  for (const pattern of FORBIDDEN_PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(rawContent)) {
      return {
        isSafe: false,
        sanitized: '',
        rejectionReason: 'Security Alert: Indirect prompt injection vector detected in comment body',
      };
    }
  }

  // Strip raw HTML / XSS attempts
  const safeText = escapeHtml(rawContent.trim());
  return { isSafe: true, sanitized: safeText };
}
