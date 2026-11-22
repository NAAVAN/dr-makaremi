import fs from 'node:fs';
import path from 'node:path';
import type {
  AiProviderRuntimeStatus,
  Locale,
  StudioLocaleContentInput,
  StudioWorkType,
} from '@makaremi/shared';
import { getStudioSecretConfiguration } from '../studio/auth';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_CLAUDE_MODEL = 'claude-sonnet-4-5';

interface StoredAiSettings {
  provider: 'anthropic' | 'disabled';
  model: string;
  autoTranslateOnPublish: boolean;
  tone?: string;
}

function resolveOverlayFile(filename: string): string {
  const candidates = [
    path.resolve(process.cwd(), 'packages', 'shared', 'src', 'data', 'curator-overlays', filename),
    path.resolve(process.cwd(), '..', '..', 'packages', 'shared', 'src', 'data', 'curator-overlays', filename),
    path.resolve(process.cwd(), '..', 'packages', 'shared', 'src', 'data', 'curator-overlays', filename),
  ];
  for (const p of candidates) {
    if (fs.existsSync(path.dirname(p))) return p;
  }
  return candidates[0];
}

function readAiSettingsFile(): StoredAiSettings {
  try {
    const fp = resolveOverlayFile('ai-settings.json');
    if (fs.existsSync(fp)) {
      return JSON.parse(fs.readFileSync(fp, 'utf-8')) as StoredAiSettings;
    }
  } catch {
    // ignore read error
  }
  return {
    provider: 'anthropic',
    model: DEFAULT_CLAUDE_MODEL,
    autoTranslateOnPublish: false,
  };
}

export function saveAiSettingsFile(patch: Partial<StoredAiSettings>): StoredAiSettings {
  const current = readAiSettingsFile();
  const next: StoredAiSettings = { ...current, ...patch };
  const fp = resolveOverlayFile('ai-settings.json');
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, JSON.stringify(next, null, 2), 'utf-8');
  return next;
}

function loadGlossaryRulesSummary(): string {
  try {
    const overlayPath = resolveOverlayFile('ai-settings.json');
    const glossaryPath = path.resolve(path.dirname(overlayPath), '..', 'glossary-lock.json');
    if (!fs.existsSync(glossaryPath)) return '';
    const parsed = JSON.parse(fs.readFileSync(glossaryPath, 'utf-8')) as {
      locked_terms?: Array<{ fa?: string; fr?: string; en?: string }>;
      british_english_rules?: { spelling_map?: Record<string, string> };
    };
    const terms = (parsed.locked_terms || [])
      .slice(0, 20)
      .map((t) => `- FA: ${t.fa || ''} | FR: ${t.fr || ''} | EN: ${t.en || ''}`)
      .join('\n');
    const ukMap = Object.entries(parsed.british_english_rules?.spelling_map || {})
      .slice(0, 12)
      .map(([us, uk]) => `${us}->${uk}`)
      .join(', ');
    return `Locked Terminology:\n${terms}\nBritish/UNESCO English Spelling Rules: ${ukMap}`;
  } catch {
    return '';
  }
}

export function getAnthropicApiKey(): string {
  return (process.env.ANTHROPIC_API_KEY || process.env.MAKAREMI_AI_API_KEY || '').trim();
}

export function isAnthropicConfigured(): boolean {
  const provider = (process.env.MAKAREMI_AI_PROVIDER || 'anthropic').toLowerCase();
  return provider === 'anthropic' && getAnthropicApiKey().length > 10;
}

export function getAiRuntimeStatus(): AiProviderRuntimeStatus {
  const stored = readAiSettingsFile();
  const envProvider = (process.env.MAKAREMI_AI_PROVIDER || stored.provider || 'anthropic').toLowerCase();
  const apiKey = getAnthropicApiKey();
  const hasKey = envProvider === 'anthropic' && apiKey.length > 10;
  const envAuto = process.env.MAKAREMI_AI_AUTO_TRANSLATE;
  const autoTranslate =
    envAuto === 'true'
      ? true
      : envAuto === 'false'
        ? stored.autoTranslateOnPublish
        : stored.autoTranslateOnPublish;
  const { usingDefaultFallback } = getStudioSecretConfiguration();

  return {
    provider: envProvider === 'disabled' ? 'disabled' : 'anthropic',
    model: process.env.MAKAREMI_AI_MODEL || stored.model || DEFAULT_CLAUDE_MODEL,
    hasApiKeyConfigured: hasKey,
    autoTranslateOnPublish: Boolean(hasKey && autoTranslate),
    mode: hasKey ? 'anthropic_live_auto' : 'manual_antigravity_queue',
    usingDefaultAuthSecret: usingDefaultFallback,
    lastCheckedAt: new Date().toISOString(),
  };
}

async function callAnthropicMessages(params: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return {
      ok: false,
      error: 'ANTHROPIC_API_KEY is not configured yet (manual Antigravity queue mode active).',
    };
  }

  const status = getAiRuntimeStatus();
  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: status.model,
        max_tokens: params.maxTokens || 4096,
        temperature: 0.2,
        system: params.systemPrompt,
        messages: [{ role: 'user', content: params.userPrompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      return { ok: false, error: `Anthropic API HTTP ${res.status}: ${errText.slice(0, 240)}` };
    }

    const data = (await res.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const text = (data.content || [])
      .filter((c) => c.type === 'text' && typeof c.text === 'string')
      .map((c) => c.text)
      .join('\n')
      .trim();

    if (!text) return { ok: false, error: 'Anthropic API returned an empty response.' };
    return { ok: true, text };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Anthropic network call failed.',
    };
  }
}

export async function testAnthropicConnection(): Promise<{
  ok: boolean;
  message: string;
  model: string;
}> {
  const status = getAiRuntimeStatus();
  if (!status.hasApiKeyConfigured) {
    return {
      ok: false,
      model: status.model,
      message:
        'کلید ANTHROPIC_API_KEY هنوز در فایل .env سرور تنظیم نشده است. سیستم هم‌اکنون در حالت ترجمه دستی و صف آنتی‌گرویتی فعالیت می‌کند.',
    };
  }

  const probe = await callAnthropicMessages({
    systemPrompt: 'Reply strictly with the single word: READY',
    userPrompt: 'Connection check.',
    maxTokens: 16,
  });

  if (!probe.ok) {
    return { ok: false, model: status.model, message: probe.error };
  }
  return {
    ok: true,
    model: status.model,
    message: `اتصال زنده با Anthropic (${status.model}) برقرار است و آماده ترجمه ادبی و دستیار هوشمند می‌باشد.`,
  };
}

export async function translateWorkWithClaude(input: {
  workType: StudioWorkType;
  originalLocale: Locale;
  targetLocale: Locale;
  source: StudioLocaleContentInput;
}): Promise<{ ok: true; translation: StudioLocaleContentInput } | { ok: false; error: string }> {
  const glossary = loadGlossaryRulesSummary();
  const systemPrompt = [
    'You are the dedicated scholarly literary translator for Dr Hassan Makaremi (Lacanian clinical psychoanalyst, modern Persian calligrapher, Hafez scholar, Sorbonne researcher, and human-rights thinker).',
    'Output ONLY valid JSON matching the exact schema requested, with no markdown fences or extra commentary.',
    'For English output, strictly follow British/UNESCO International Academic English spelling (modernisation, psychoanalyse, colour, centre, catalogue, programme).',
    'For Persian output, preserve natural literary Persian with proper ZWNJ (نیم‌فاصله).',
    'For French output, preserve refined Parisian academic French.',
    'For poems, maintain exact 1-to-1 line_index alignment with hemistich_a and optional hemistich_b.',
    glossary,
  ]
    .filter(Boolean)
    .join('\n\n');

  const userPrompt = `Translate the following ${input.workType} from ${input.originalLocale} to ${input.targetLocale}.
Return ONLY JSON with keys: title, subtitle, summary, body_markdown, commentary_markdown, verses (array of { line_index, hemistich_a, hemistich_b } when source has verses).
Source JSON:
${JSON.stringify(input.source)}`;

  const res = await callAnthropicMessages({
    systemPrompt,
    userPrompt,
    maxTokens: 4096,
  });

  if (!res.ok) return res;

  try {
    const cleaned = res.text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleaned) as Partial<StudioLocaleContentInput>;
    return {
      ok: true,
      translation: {
        languages_code:
          input.targetLocale === 'fa' ? 'fa-IR' : input.targetLocale === 'fr' ? 'fr-FR' : 'en',
        title: (parsed.title || input.source.title).trim(),
        subtitle: parsed.subtitle,
        summary: parsed.summary,
        body_markdown: parsed.body_markdown,
        commentary_markdown: parsed.commentary_markdown,
        verses: Array.isArray(parsed.verses) ? parsed.verses : undefined,
      },
    };
  } catch {
    return { ok: false, error: 'Failed to parse Anthropic JSON translation output.' };
  }
}

export async function synthesizeRagWithClaude(input: {
  query: string;
  locale: Locale;
  citationsText: string;
}): Promise<string | null> {
  if (!isAnthropicConfigured()) return null;

  const langLabel =
    input.locale === 'fa' ? 'Persian (Farsi)' : input.locale === 'fr' ? 'French' : 'British Academic English';

  const res = await callAnthropicMessages({
    systemPrompt: [
      `You are the official Academic Research Assistant for Dr Hassan Makaremi's archive.`,
      `Respond exclusively in ${langLabel}.`,
      'Ground every factual claim strictly in the provided archival excerpts. Never fabricate books, dates, or quotes outside the provided excerpts.',
    ].join(' '),
    userPrompt: `Question: ${input.query}\n\nVerified Archival Excerpts:\n${input.citationsText}`,
    maxTokens: 1200,
  });

  return res.ok ? res.text : null;
}
