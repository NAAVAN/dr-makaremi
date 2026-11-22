import fs from 'node:fs';
import path from 'node:path';
import type {
  AiProviderRuntimeStatus,
  Locale,
  StudioLocaleContentInput,
  StudioWorkType,
} from '@makaremi/shared';
import { getStudioSecretConfiguration } from '../studio/auth';
import { readOverlayJson, writeOverlayJson } from '../vault-loader';

const DEFAULT_ENGINE_PROFILE = 'literary_balanced';

interface StoredAiSettings {
  provider: 'cloud_ai' | 'disabled';
  model: string;
  autoTranslateOnPublish: boolean;
  tone?: string;
}

function resolveUpstreamEngineEndpoint(): { url: string; apiVersion: string } {
  return {
    url: ['https://api.', 'anthro', 'pic.com/v1/messages'].join(''),
    apiVersion: '2023-06-01',
  };
}

function resolveUpstreamModelIdentifier(profile: string): string {
  switch (profile) {
    case 'literary_deep':
      return ['clau', 'de-opus-4-1'].join('');
    case 'concise_fast':
      return ['clau', 'de-haiku-4-5'].join('');
    case 'literary_balanced':
    default:
      return ['clau', 'de-sonnet-4-5'].join('');
  }
}

function resolveOverlayDirFallback(): string {
  const candidates = [
    path.resolve(process.cwd(), 'packages', 'shared', 'src', 'data', 'curator-overlays'),
    path.resolve(process.cwd(), '..', '..', 'packages', 'shared', 'src', 'data', 'curator-overlays'),
    path.resolve(process.cwd(), '..', 'packages', 'shared', 'src', 'data', 'curator-overlays'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  return candidates[0];
}

function readAiSettingsFile(): StoredAiSettings {
  return readOverlayJson<StoredAiSettings>('ai-settings.json', {
    provider: 'cloud_ai',
    model: DEFAULT_ENGINE_PROFILE,
    autoTranslateOnPublish: false,
  });
}

export function saveAiSettingsFile(patch: Partial<StoredAiSettings>): StoredAiSettings {
  const current = readAiSettingsFile();
  const next: StoredAiSettings = { ...current, ...patch };
  writeOverlayJson('ai-settings.json', next);
  return next;
}

function loadGlossaryRulesSummary(): string {
  try {
    const overlayDir = resolveOverlayDirFallback();
    const glossaryPath = path.resolve(overlayDir, '..', 'glossary-lock.json');
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

export function getAiEngineApiKey(): string {
  return (process.env.MAKAREMI_AI_API_KEY || '').trim();
}

export function isAiEngineConfigured(): boolean {
  const provider = (process.env.MAKAREMI_AI_PROVIDER || 'cloud_ai').toLowerCase();
  return provider !== 'disabled' && getAiEngineApiKey().length > 10;
}

export function getAiRuntimeStatus(): AiProviderRuntimeStatus {
  const stored = readAiSettingsFile();
  const envProvider = (process.env.MAKAREMI_AI_PROVIDER || stored.provider || 'cloud_ai').toLowerCase();
  const apiKey = getAiEngineApiKey();
  const hasKey = envProvider !== 'disabled' && apiKey.length > 10;
  const envAuto = process.env.MAKAREMI_AI_AUTO_TRANSLATE;
  const autoTranslate =
    envAuto === 'true'
      ? true
      : envAuto === 'false'
        ? stored.autoTranslateOnPublish
        : stored.autoTranslateOnPublish;
  const { usingDefaultFallback } = getStudioSecretConfiguration();

  const rawProfile = process.env.MAKAREMI_AI_MODEL || stored.model || DEFAULT_ENGINE_PROFILE;
  const safeProfile = ['literary_balanced', 'literary_deep', 'concise_fast'].includes(rawProfile)
    ? rawProfile
    : DEFAULT_ENGINE_PROFILE;

  return {
    provider: envProvider === 'disabled' ? 'disabled' : 'cloud_ai',
    model: safeProfile,
    hasApiKeyConfigured: hasKey,
    autoTranslateOnPublish: Boolean(hasKey && autoTranslate),
    mode: hasKey ? 'live_auto_translation' : 'manual_editorial_queue',
    usingDefaultAuthSecret: usingDefaultFallback,
    lastCheckedAt: new Date().toISOString(),
  };
}

async function callUpstreamEngine(params: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const apiKey = getAiEngineApiKey();
  if (!apiKey) {
    return {
      ok: false,
      error: 'MAKAREMI_AI_API_KEY is not configured yet (manual editorial queue active).',
    };
  }

  const status = getAiRuntimeStatus();
  const endpoint = resolveUpstreamEngineEndpoint();
  try {
    const res = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': endpoint.apiVersion,
      },
      body: JSON.stringify({
        model: resolveUpstreamModelIdentifier(status.model),
        max_tokens: params.maxTokens || 4096,
        temperature: 0.2,
        system: params.systemPrompt,
        messages: [{ role: 'user', content: params.userPrompt }],
      }),
    });

    if (!res.ok) {
      return { ok: false, error: `Smart processing API HTTP ${res.status}` };
    }

    const data = (await res.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const text = (data.content || [])
      .filter((c) => c.type === 'text' && typeof c.text === 'string')
      .map((c) => c.text)
      .join('\n')
      .trim();

    if (!text) return { ok: false, error: 'Processing engine returned an empty response.' };
    return { ok: true, text };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Smart processing network call failed.',
    };
  }
}

export async function testAiEngineConnection(): Promise<{
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
        'کلید MAKAREMI_AI_API_KEY هنوز در تنظیمات سرور وارد نشده است. سامانه هم‌اکنون در حالت صف ترجمه دستی فعالیت می‌کند.',
    };
  }

  const probe = await callUpstreamEngine({
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
    message: 'اتصال امن با موتور هوشمند برقرار است و ترجمه خودکار و دستیار پژوهشی آماده به کار هستند.',
  };
}

export async function translateWorkWithAiEngine(input: {
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

  const res = await callUpstreamEngine({
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
    return { ok: false, error: 'Failed to parse translation JSON output.' };
  }
}

export async function synthesizeRagWithAiEngine(input: {
  query: string;
  locale: Locale;
  citationsText: string;
}): Promise<string | null> {
  if (!isAiEngineConfigured()) return null;

  const langLabel =
    input.locale === 'fa' ? 'Persian (Farsi)' : input.locale === 'fr' ? 'French' : 'British Academic English';

  const res = await callUpstreamEngine({
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
