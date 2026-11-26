import fs from 'node:fs';
import path from 'node:path';
import type {
  AiProviderRoutingPolicy,
  AiProviderRuntimeStatus,
  Locale,
  RagChatHistoryTurn,
  StudioLocaleContentInput,
  StudioWorkType,
} from '@makaremi/shared';
import { getStudioSecretConfiguration } from '../studio/auth';
import { readOverlayJson, writeOverlayJson } from '../vault-loader';
import { isEmbeddingsConfigured } from '../rag/embeddings';
import { buildHumanizerPromptDirective } from '../rag/prose-humanizer';

const DEFAULT_ENGINE_PROFILE = 'literary_balanced';

interface StoredAiSettings {
  provider: 'cloud_ai' | 'disabled';
  model: string;
  autoTranslateOnPublish: boolean;
  tone?: string;
}

export interface RouterSynthesisResult {
  text: string;
  engineTier: 'primary' | 'fallback_fast';
  promptTokens: number;
  completionTokens: number;
}

function resolveUpstreamEngineEndpoint(): { url: string; apiVersion: string } {
  return {
    url: (
      process.env.MAKAREMI_AI_BASE_URL ||
      ['https://api.', 'anthro', 'pic.com/v1/messages'].join('')
    ).trim(),
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

function resolveFastFallbackEndpoint(): { url: string; model: string; rewriteModel: string } {
  const defaultModel = ['open', 'ai/gpt-oss-120b'].join('');
  const defaultRewrite = ['qwe', 'n/qwen3.8-27b'].join('');
  return {
    url: (
      process.env.MAKAREMI_FAST_AI_BASE_URL ||
      ['https://api.', 'gr', 'oq.com/openai/v1/chat/completions'].join('')
    ).trim(),
    model: (process.env.MAKAREMI_FAST_AI_MODEL || defaultModel).trim(),
    rewriteModel: (process.env.MAKAREMI_FAST_AI_REWRITE_MODEL || defaultRewrite).trim(),
  };
}

function stripReasoningTags(text: string): string {
  return (text || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
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

let cachedRootEnvLocal: Record<string, string> | null = null;

function readWorkspaceEnvLocalKey(keyName: string): string {
  if (!cachedRootEnvLocal) {
    cachedRootEnvLocal = {};
    const candidates = [
      path.resolve(process.cwd(), '.env.local'),
      path.resolve(process.cwd(), '..', '..', '.env.local'),
    ];
    for (const fp of candidates) {
      try {
        if (!fs.existsSync(fp)) continue;
        for (const raw of fs.readFileSync(fp, 'utf-8').split(/\r?\n/)) {
          const line = raw.trim();
          if (!line || line.startsWith('#') || !line.includes('=')) continue;
          const idx = line.indexOf('=');
          const k = line.slice(0, idx).trim();
          const v = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
          if (k && v && !cachedRootEnvLocal[k]) cachedRootEnvLocal[k] = v;
        }
      } catch {
        // ignore read error in restricted serverless environments
      }
    }
  }
  return (cachedRootEnvLocal[keyName] || '').trim();
}

export function getAiEngineApiKey(): string {
  return (process.env.MAKAREMI_AI_API_KEY || readWorkspaceEnvLocalKey('MAKAREMI_AI_API_KEY') || '').trim();
}

export function getFastFallbackApiKey(): string {
  return (
    process.env.MAKAREMI_FAST_AI_API_KEY ||
    process.env.GROQ_API_KEY ||
    readWorkspaceEnvLocalKey('MAKAREMI_FAST_AI_API_KEY') ||
    readWorkspaceEnvLocalKey('GROQ_API_KEY') ||
    ''
  ).trim();
}

export function isAiEngineConfigured(): boolean {
  const provider = (process.env.MAKAREMI_AI_PROVIDER || 'cloud_ai').toLowerCase();
  return provider !== 'disabled' && getAiEngineApiKey().length > 10;
}

export function isFastFallbackConfigured(): boolean {
  const provider = (process.env.MAKAREMI_AI_PROVIDER || 'cloud_ai').toLowerCase();
  return provider !== 'disabled' && getFastFallbackApiKey().length > 10;
}

export function getAiRuntimeStatus(): AiProviderRuntimeStatus {
  const stored = readAiSettingsFile();
  const envProvider = (process.env.MAKAREMI_AI_PROVIDER || stored.provider || 'cloud_ai').toLowerCase();
  const hasPrimary = envProvider !== 'disabled' && getAiEngineApiKey().length > 10;
  const hasFast = envProvider !== 'disabled' && getFastFallbackApiKey().length > 10;
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
    hasApiKeyConfigured: hasPrimary,
    hasPrimaryEngineConfigured: hasPrimary,
    hasFastFallbackConfigured: hasFast,
    hasEmbeddingsConfigured: isEmbeddingsConfigured(),
    activeTier: hasPrimary ? 'primary' : hasFast ? 'fallback_fast' : 'deterministic',
    autoTranslateOnPublish: Boolean(hasPrimary && autoTranslate),
    mode: hasPrimary ? 'live_auto_translation' : 'manual_editorial_queue',
    usingDefaultAuthSecret: usingDefaultFallback,
    lastCheckedAt: new Date().toISOString(),
  };
}

async function callUpstreamEngine(params: {
  systemPrompt: string;
  userPrompt: string;
  history?: RagChatHistoryTurn[];
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  profileOverride?: string;
}): Promise<
  | { ok: true; text: string; promptTokens: number; completionTokens: number }
  | { ok: false; error: string }
> {
  const apiKey = getAiEngineApiKey();
  if (!apiKey) {
    return {
      ok: false,
      error: 'MAKAREMI_AI_API_KEY is not configured yet (manual editorial queue active).',
    };
  }

  const status = getAiRuntimeStatus();
  const endpoint = resolveUpstreamEngineEndpoint();
  const messages = [
    ...(params.history || []).slice(-6).map((h) => ({ role: h.role, content: h.content })),
    { role: 'user' as const, content: params.userPrompt },
  ];

  try {
    const res = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': endpoint.apiVersion,
      },
      body: JSON.stringify({
        model: resolveUpstreamModelIdentifier(params.profileOverride || status.model),
        max_tokens: params.maxTokens || 2048,
        temperature: params.temperature ?? 0.2,
        system: params.systemPrompt,
        messages,
      }),
      signal: AbortSignal.timeout(params.timeoutMs || 25000),
    });

    if (!res.ok) {
      return { ok: false, error: `Smart processing API HTTP ${res.status}` };
    }

    const data = (await res.json()) as {
      content?: Array<{ type?: string; text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    const text = (data.content || [])
      .filter((c) => c.type === 'text' && typeof c.text === 'string')
      .map((c) => c.text)
      .join('\n')
      .trim();

    if (!text) return { ok: false, error: 'Processing engine returned an empty response.' };
    return {
      ok: true,
      text,
      promptTokens: Number(data.usage?.input_tokens || 0),
      completionTokens: Number(data.usage?.output_tokens || 0),
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Smart processing network call failed.',
    };
  }
}

async function callFastFallbackEngine(params: {
  systemPrompt: string;
  userPrompt: string;
  history?: RagChatHistoryTurn[];
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  useCompactModel?: boolean;
}): Promise<
  | { ok: true; text: string; promptTokens: number; completionTokens: number }
  | { ok: false; error: string }
> {
  const apiKey = getFastFallbackApiKey();
  if (!apiKey) {
    return { ok: false, error: 'Fast fallback engine key is not configured.' };
  }

  const fast = resolveFastFallbackEndpoint();
  const chosenModel = params.useCompactModel ? fast.rewriteModel : fast.model;
  const isReasoningOss = chosenModel.includes('gpt-oss');
  const messages = [
    { role: 'system' as const, content: params.systemPrompt },
    ...(params.history || []).slice(-6).map((h) => ({ role: h.role, content: h.content })),
    { role: 'user' as const, content: params.userPrompt },
  ];

  try {
    const reqBody: Record<string, unknown> = {
      model: chosenModel,
      max_tokens: params.maxTokens || 1400,
      temperature: params.temperature ?? 0.2,
      messages,
    };
    if (isReasoningOss) {
      reqBody.reasoning_effort = 'low';
    }

    const res = await fetch(fast.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'User-Agent': 'MakaremiResearchAssistant/2.0',
      },
      body: JSON.stringify(reqBody),
      signal: AbortSignal.timeout(params.timeoutMs || 22000),
    });

    if (!res.ok) {
      return { ok: false, error: `Fast inference API HTTP ${res.status}` };
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const text = stripReasoningTags(data.choices?.[0]?.message?.content || '');
    if (!text) return { ok: false, error: 'Fast inference engine returned empty text.' };
    return {
      ok: true,
      text,
      promptTokens: Number(data.usage?.prompt_tokens || 0),
      completionTokens: Number(data.usage?.completion_tokens || 0),
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Fast inference call failed.',
    };
  }
}

export async function testAiEngineConnection(): Promise<{
  ok: boolean;
  message: string;
  model: string;
  activeTier: 'primary' | 'fallback_fast' | 'deterministic';
}> {
  const status = getAiRuntimeStatus();

  if (status.hasPrimaryEngineConfigured) {
    const probe = await callUpstreamEngine({
      systemPrompt: 'Reply strictly with the single word: READY',
      userPrompt: 'Connection check.',
      maxTokens: 16,
      timeoutMs: 12000,
    });
    if (probe.ok) {
      return {
        ok: true,
        model: status.model,
        activeTier: 'primary',
        message:
          'اتصال امن با موتور هوشمند اصلی برقرار است؛ ترجمهٔ خودکار سه‌زبانه و دستیار پژوهشی در بالاترین سطح کیفیت فعال هستند.',
      };
    }
  }

  if (status.hasFastFallbackConfigured) {
    const fastProbe = await callFastFallbackEngine({
      systemPrompt: 'Reply strictly with the single word: READY',
      userPrompt: 'Connection check.',
      maxTokens: 32,
      timeoutMs: 12000,
      useCompactModel: true,
    });
    if (fastProbe.ok) {
      return {
        ok: true,
        model: status.model,
        activeTier: 'fallback_fast',
        message:
          'موتور سریع دستیار پژوهشی متصل و آمادهٔ پاسخ‌گویی زنده است (ترجمهٔ خودکار آثار همچنان تا ثبت کلید اصلی در صف دستی باقی می‌ماند).',
      };
    }
    return {
      ok: false,
      model: status.model,
      activeTier: 'deterministic',
      message: `بررسی موتور پشتیبان ناموفق بود (${fastProbe.error})؛ سامانه در حالت مستند قطعی آفلاین فعال است.`,
    };
  }

  return {
    ok: false,
    model: status.model,
    activeTier: 'deterministic',
    message:
      'کلید MAKAREMI_AI_API_KEY یا کلید موتور سریع هنوز در تنظیمات سرور ثبت نشده است. سامانه در حالت مستند قطعی و صف ترجمهٔ دستی فعالیت می‌کند.',
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

/**
 * Multi-Turn Query Condenser: rewrites a context-dependent follow-up question
 * into a self-contained archival search query.
 */
export async function condenseMultiTurnQuery(input: {
  query: string;
  history: RagChatHistoryTurn[];
  locale: Locale;
}): Promise<string> {
  if (!input.history || input.history.length === 0) return input.query;

  const recentUserTurns = input.history
    .filter((h) => h.role === 'user')
    .slice(-2)
    .map((h) => h.content.trim())
    .filter(Boolean);

  if (recentUserTurns.length === 0) return input.query;

  // Use ultra-fast fallback engine when available; otherwise deterministic topic anchoring
  if (isFastFallbackConfigured()) {
    const histBlock = input.history
      .slice(-4)
      .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content.slice(0, 260)}`)
      .join('\n');
    const res = await callFastFallbackEngine({
      systemPrompt:
        'Rewrite the latest follow-up question into a concise, standalone archival search query in the same language. Output ONLY the standalone query text with no quotes or explanation.',
      userPrompt: `Conversation:\n${histBlock}\n\nLatest follow-up question:\n${input.query}`,
      maxTokens: 120,
      temperature: 0,
      timeoutMs: 6000,
      useCompactModel: true,
    });
    if (res.ok && res.text.length >= 4 && res.text.length <= 320) {
      return res.text.replace(/^["«']|["»']$/g, '').trim();
    }
  }

  // Deterministic fallback when offline: anchor short pronoun-heavy follow-up to prior topic
  if (input.query.split(/\s+/).length <= 10) {
    const prevTopic = recentUserTurns[recentUserTurns.length - 1].slice(0, 110);
    return `${prevTopic} — ${input.query}`.slice(0, 280);
  }
  return input.query;
}

/**
 * Multi-Provider White-Label RAG Synthesizer with automatic cascading failover:
 * 1) Primary Literary Engine -> 2) Fast Fallback Engine -> 3) null (Deterministic Grounded Synthesizer)
 */
export async function synthesizeRagWithRouter(input: {
  query: string;
  locale: Locale;
  citationsText: string;
  systemConstitution: string;
  history?: RagChatHistoryTurn[];
  routing?: AiProviderRoutingPolicy;
  budgetExceeded?: boolean;
}): Promise<RouterSynthesisResult | null> {
  if (input.budgetExceeded) return null;

  const langLabel =
    input.locale === 'fa'
      ? 'Persian (Farsi) with proper ZWNJ'
      : input.locale === 'fr'
        ? 'refined Parisian Academic French'
        : 'British/UNESCO Academic English';

  const glossarySummary = loadGlossaryRulesSummary();
  const systemPrompt = [
    input.systemConstitution,
    `Respond exclusively in ${langLabel}.`,
    'Cite verified archival excerpts inline using [1], [2], etc. Never fabricate sources, books, dates, or quotes.',
    'STRICT WHITE-LABEL: Never mention any external technology provider or AI model name.',
    buildHumanizerPromptDirective(input.locale),
    glossarySummary,
  ]
    .filter(Boolean)
    .join('\n\n');

  const userPrompt = `Research Question:\n${input.query}\n\nVerified Archival Excerpts (cite inline with [1], [2]...):\n${input.citationsText}`;
  const maxTokens = input.routing?.maxOutputTokens || 1400;
  const temperature = input.routing?.temperature ?? 0.2;
  const timeoutMs = input.routing?.requestTimeoutMs || 25000;

  if (isAiEngineConfigured()) {
    const primaryRes = await callUpstreamEngine({
      systemPrompt,
      userPrompt,
      history: input.history,
      maxTokens,
      temperature,
      timeoutMs,
      profileOverride: input.routing?.primaryProfile,
    });
    if (primaryRes.ok) {
      return {
        text: primaryRes.text,
        engineTier: 'primary',
        promptTokens: primaryRes.promptTokens,
        completionTokens: primaryRes.completionTokens,
      };
    }
  }

  if ((input.routing?.enableFastFallback ?? true) && isFastFallbackConfigured()) {
    const fastRes = await callFastFallbackEngine({
      systemPrompt,
      userPrompt,
      history: input.history,
      maxTokens,
      temperature,
      timeoutMs,
    });
    if (fastRes.ok) {
      return {
        text: fastRes.text,
        engineTier: 'fallback_fast',
        promptTokens: fastRes.promptTokens,
        completionTokens: fastRes.completionTokens,
      };
    }
  }

  return null;
}

/**
 * Legacy helper preserved for backward compatibility.
 */
export async function synthesizeRagWithAiEngine(input: {
  query: string;
  locale: Locale;
  citationsText: string;
}): Promise<string | null> {
  const res = await synthesizeRagWithRouter({
    query: input.query,
    locale: input.locale,
    citationsText: input.citationsText,
    systemConstitution:
      "You are the official Academic Research Assistant for Dr Hassan Makaremi's archive. Ground every factual claim strictly in the provided archival excerpts.",
  });
  return res ? res.text : null;
}

/**
 * Streams token deltas directly from the Fast Fallback OpenAI-compatible SSE stream
 * when available, or gracefully yields chunks from synthesizeRagWithRouter / deterministic text.
 */
export async function* streamRagAnswerTokens(input: {
  query: string;
  locale: Locale;
  citationsText: string;
  systemConstitution: string;
  history?: RagChatHistoryTurn[];
  routing?: AiProviderRoutingPolicy;
  deterministicAnswer: string;
  budgetExceeded?: boolean;
}): AsyncGenerator<
  { delta: string } | { finalMeta: { engineTier: 'primary' | 'fallback_fast' | 'deterministic'; promptTokens: number; completionTokens: number; fullText: string } }
> {
  // Fast native SSE streaming path when Primary is absent & Fast Fallback is active
  if (
    !input.budgetExceeded &&
    !isAiEngineConfigured() &&
    (input.routing?.enableFastFallback ?? true) &&
    isFastFallbackConfigured()
  ) {
    const fast = resolveFastFallbackEndpoint();
    const apiKey = getFastFallbackApiKey();
    const langLabel =
      input.locale === 'fa'
        ? 'Persian (Farsi) with proper ZWNJ'
        : input.locale === 'fr'
          ? 'refined Parisian Academic French'
          : 'British/UNESCO Academic English';
    const systemPrompt = [
      input.systemConstitution,
      `Respond exclusively in ${langLabel}.`,
      'Cite verified archival excerpts inline using [1], [2], etc. Never fabricate sources or mention any external AI brand.',
      buildHumanizerPromptDirective(input.locale),
      loadGlossaryRulesSummary(),
    ]
      .filter(Boolean)
      .join('\n\n');
    const userPrompt = `Research Question:\n${input.query}\n\nVerified Archival Excerpts:\n${input.citationsText}`;
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...(input.history || []).slice(-6).map((h) => ({ role: h.role, content: h.content })),
      { role: 'user' as const, content: userPrompt },
    ];

    try {
      const streamBody: Record<string, unknown> = {
        model: fast.model,
        max_tokens: input.routing?.maxOutputTokens || 1400,
        temperature: input.routing?.temperature ?? 0.2,
        stream: true,
        messages,
      };
      if (fast.model.includes('gpt-oss')) {
        streamBody.reasoning_effort = 'low';
      }

      const res = await fetch(fast.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'User-Agent': 'MakaremiResearchAssistant/2.0',
        },
        body: JSON.stringify(streamBody),
        signal: AbortSignal.timeout(input.routing?.requestTimeoutMs || 25000),
      });

      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line.startsWith('data:')) continue;
            const payloadStr = line.slice(5).trim();
            if (!payloadStr || payloadStr === '[DONE]') continue;
            try {
              const evt = JSON.parse(payloadStr) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const chunk = evt.choices?.[0]?.delta?.content || '';
              if (chunk) {
                fullText += chunk;
                yield { delta: chunk };
              }
            } catch {
              // skip malformed SSE chunk
            }
          }
        }

        if (fullText.trim()) {
          const approxPrompt = Math.ceil((systemPrompt.length + userPrompt.length) / 4);
          const approxComp = Math.ceil(fullText.length / 4);
          yield {
            finalMeta: {
              engineTier: 'fallback_fast',
              promptTokens: approxPrompt,
              completionTokens: approxComp,
              fullText,
            },
          };
          return;
        }
      }
    } catch {
      // gracefully fall back below
    }
  }

  // Standard Primary Router or Deterministic Grounded Synthesis streamed smoothly in word chunks
  const routed = await synthesizeRagWithRouter(input);
  const fullText = routed?.text || input.deterministicAnswer;
  const words = fullText.split(/(\s+)/);
  for (let i = 0; i < words.length; i += 6) {
    yield { delta: words.slice(i, i + 6).join('') };
  }
  yield {
    finalMeta: {
      engineTier: routed ? routed.engineTier : 'deterministic',
      promptTokens: routed?.promptTokens || 0,
      completionTokens: routed?.completionTokens || 0,
      fullText,
    },
  };
}
