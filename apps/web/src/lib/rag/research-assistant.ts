import type {
  ContentPillar,
  Locale,
  RagChatHistoryTurn,
  RagDocumentType,
} from '@makaremi/shared';
import { executeHybridSearch, type SearchResultItem } from './hybrid-search';
import {
  condenseMultiTurnQuery,
  streamRagAnswerTokens,
  synthesizeRagWithRouter,
} from '@/lib/ai/provider-adapter';
import { assessQuerySafety } from './safety-guard';
import { verifyGeneratedAnswer } from './grounding-verifier';
import {
  getActivePersonaVersion,
  getMonthlyTokensUsed,
  recordQueryTelemetry,
} from './training-store';
import { enqueueAndDispatchProfessorEscalation } from './professor-escalation';
import {
  classifyWithMlPromptGuard,
  recordSecurityAuditEvent,
} from './security-audit';

export interface RagCitation {
  id: string;
  title: string;
  documentType: string;
  pillar: string;
  url: string;
  relativeUrl: string;
  sourceLocale?: Locale;
  isCrossLingual?: boolean;
  isGoldenQa?: boolean;
  quote: string;
  content_sha256: string;
  startSec?: number;
  endSec?: number;
  timestampLabel?: string;
  score: number;
}

function formatTimestampBadge(sec?: number): string | undefined {
  if (sec === undefined || sec === null || sec < 0) return undefined;
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export interface RagResponse {
  answer: string;
  locale: Locale;
  citations: RagCitation[];
  suggestedFollowUps: string[];
  telemetryId?: string;
  groundingScore?: number;
  engineTier?: 'primary' | 'fallback_fast' | 'deterministic' | 'crisis_guard';
  rewrittenQuery?: string;
  safetyMode?: 'normal' | 'clinical_boundary' | 'crisis_helpline';
}

export interface AskAssistantOptions {
  query: string;
  locale?: Locale;
  history?: RagChatHistoryTurn[];
  pillar?: ContentPillar | 'all';
  type?: RagDocumentType | 'all';
  sessionSeed?: string;
  skipTelemetry?: boolean;
  forceDeterministic?: boolean;
}

function selectPersonaConstitution(
  locale: Locale,
  persona: Awaited<ReturnType<typeof getActivePersonaVersion>>
): string {
  if (locale === 'fr') return persona.systemConstitutionFr;
  if (locale === 'en') return persona.systemConstitutionEn;
  return persona.systemConstitutionFa;
}

/**
 * Deterministic Grounded Knowledge Synthesizer
 * Formulates a direct, zero-hallucination academic synthesis strictly grounded in retrieved chunks.
 */
function synthesizeGroundedAnswer(
  query: string,
  locale: Locale,
  citations: RagCitation[],
  results: SearchResultItem[]
): { answer: string; suggestedFollowUps: string[] } {
  if (results.length === 0) {
    if (locale === 'fr') {
      return {
        answer: `Aucune information directement vérifiable n'a été trouvée dans les archives officielles du Dr Hassan Makaremi pour la requête : « ${query} ». Pour préserver l'intégrité de la recherche, aucune hypothèse non documentée n'est formulée.`,
        suggestedFollowUps: [
          'Quels sont les concepts majeurs du séminaire lacanien ?',
          "Comment le Dr Makaremi définit-il l'État limite ?",
          'Quelle est la démarche de la calligraphie contemporaine ?',
        ],
      };
    }
    if (locale === 'en') {
      return {
        answer: `No directly verifiable document was identified in Dr. Hassan Makaremi's official archives matching the query: "${query}". To ensure zero hallucination, no ungrounded claims are generated.`,
        suggestedFollowUps: [
          'What is the concept of Listening Differently in clinical psychoanalysis?',
          'What are the 3,954 CNRS psychoanalysis research projects cited by Dr. Makaremi?',
          'What is the strategy for democratic transition in Iran?',
        ],
      };
    }
    return {
      answer: `هیچ سند مستندی در آرشیو رسمی و آثار منتشرشده دکتر حسن مکارمی منطبق با پرسش «${query}» یافت نشد. به منظور صیانت از اعتبار پژوهشی و جلوگیری از توهم اطلاعاتی، پاسخی فراتر از اسناد آرشیو ارائه نمی‌شود.`,
      suggestedFollowUps: [
        'دیدگاه دکتر مکارمی درباره علم بودن روان‌کاوی چیست؟',
        'مفهوم دگرشنیدن چگونه در روان‌کاوی بالینی به کار می‌رود؟',
        'نقش دادخواهی و یادمان خاوران در عدالت انتقالی چیست؟',
      ],
    };
  }

  const topDoc = results[0];
  const quotesList = citations
    .map((c, i) => {
      const tsSuffix = c.timestampLabel ? ` — ⏱ ${c.timestampLabel}` : '';
      return `[${i + 1}] «${c.quote}» (${c.title}${tsSuffix})`;
    })
    .join('\n\n');

  // If the top hit is a Professor-approved Golden Q&A with strong lexical match, lead with its authoritative answer
  if (topDoc.isGoldenQa && topDoc.bm25Score >= 10) {
    const cleanBody = topDoc.content.split(/\n\n/).slice(1).join('\n\n').trim() || topDoc.snippet;
    const answer = `${cleanBody} [1]\n\n${quotesList}`;
    return {
      answer,
      suggestedFollowUps: buildContextualFollowUps(locale, topDoc.pillar),
    };
  }

  if (locale === 'fr') {
    const answer = `Dans les écrits et conférences du Dr Hassan Makaremi, notamment dans *${topDoc.title}* [1], cette question est abordée ainsi :\n\n${topDoc.snippet}\n\nExtraits vérifiés des archives :\n\n${quotesList}`;
    return {
      answer,
      suggestedFollowUps: buildContextualFollowUps('fr', topDoc.pillar),
    };
  }

  if (locale === 'en') {
    const answer = `In Dr. Hassan Makaremi's published writings and lectures, particularly *${topDoc.title}* [1], this subject is addressed directly:\n\n${topDoc.snippet}\n\nRelevant archival passages:\n\n${quotesList}`;
    return {
      answer,
      suggestedFollowUps: buildContextualFollowUps('en', topDoc.pillar),
    };
  }

  const answer = `در آثار و سخنرانی‌های منتشرشدهٔ دکتر حسن مکارمی، به‌ویژه در «${topDoc.title}» [1]، این مبحث چنین تبیین شده است:\n\n${topDoc.snippet}\n\nگزیدهٔ منابع مستند در آرشیو:\n\n${quotesList}`;
  return {
    answer,
    suggestedFollowUps: buildContextualFollowUps('fa', topDoc.pillar),
  };
}

function buildContextualFollowUps(locale: Locale, pillar: ContentPillar): string[] {
  if (locale === 'fr') {
    if (pillar === 'art_calligraphy') {
      return [
        "Quelles expositions majeures (UNESCO, Moscou, Pompadour) retracent l'œuvre calligraphique ?",
        "Comment vérifier un certificat d'authenticité Décret Marcus ?",
        'Quel dialogue existe entre la poésie de Hafez et le geste calligraphique ?',
      ];
    }
    return [
      'Comment approfondir ce concept dans le Séminaire III de Jacques Lacan ?',
      'Quelles conférences vidéo du Dr Makaremi abordent ce thème ?',
      "Comment s'articule cette analyse avec la Terre culturelle de l'Iran ?",
    ];
  }
  if (locale === 'en') {
    if (pillar === 'art_calligraphy') {
      return [
        'Which international exhibitions (UNESCO, Moscow, Pompadour) showcased these calligraphy works?',
        'How are Décret Marcus authenticity certificates verified?',
        'How does Listening Differently connect to Hafez and visual calligraphy?',
      ];
    }
    return [
      'How does this concept connect to the Operation of the Name-of-the-Father?',
      'Which video lectures by Dr. Makaremi address this subject?',
      'How does this framework relate to transitional justice and Dadkhahi in Iran?',
    ];
  }
  if (pillar === 'art_calligraphy') {
    return [
      'نمایشگاه‌های شاخص خوشنویسی دکتر مکارمی در یونسکو، مسکو و پومپادور کدام‌اند؟',
      'نحوهٔ دریافت و راستی‌آزمایی گواهی اصالت Décret Marcus چگونه است؟',
      'پیوند شعر حافظ و دگرشنیدن با خط-نقاشی معاصر چیست؟',
    ];
  }
  if (pillar === 'human_rights_dadkhahi') {
    return [
      'تفاوت دادخواهی و عدالت انتقالی با انتقام‌جویی از دیدگاه دکتر مکارمی چیست؟',
      'سخنرانی‌های استاد دربارهٔ جایگاه زنان و فردیت چه نکاتی را مطرح می‌کنند؟',
      'نقش سوگ سیاسی در گذار صلح‌آمیز ایران چیست؟',
    ];
  }
  return [
    'چگونه مفهوم «عملیات نام پدر» و «گره بورومه‌ای» در این زمینه نقش‌آفرینی می‌کند؟',
    'روش «دگرشنیدن» در بازخوانی این موضوع و غزلیات حافظ چه چشم‌اندازی می‌گشاید؟',
    'کدام سخنرانی‌های ویدیویی دکتر مکارمی به این مبحث پرداخته‌اند؟',
  ];
}

function buildCitationsPayload(results: SearchResultItem[]): RagCitation[] {
  return results.map((res) => {
    const cleanQuote = (res.snippet || res.content.slice(0, 200)).replace(/\n+/g, ' ').trim();
    return {
      id: res.id,
      title: res.title,
      documentType: res.documentType,
      pillar: res.pillar,
      url: res.url,
      relativeUrl: res.relativeUrl,
      sourceLocale: res.sourceLocale,
      isCrossLingual: res.isCrossLingual,
      isGoldenQa: res.isGoldenQa,
      quote: cleanQuote,
      content_sha256: res.content_sha256,
      startSec: res.startSec,
      endSec: res.endSec,
      timestampLabel: formatTimestampBadge(res.startSec),
      score: Number(res.score.toFixed(4)),
    };
  });
}

function buildCitationsPromptText(results: SearchResultItem[]): string {
  return results
    .map((res, idx) => {
      const ts = formatTimestampBadge(res.startSec);
      const langNote = res.isCrossLingual && res.sourceLocale ? ` | Original language: ${res.sourceLocale.toUpperCase()}` : '';
      const goldenNote = res.isGoldenQa ? ' [PROFESSOR VERIFIED CANONICAL ANSWER]' : '';
      const passage = res.content.slice(0, 1000).replace(/\s+/g, ' ').trim();
      return `[${idx + 1}] Title: ${res.title}${ts ? ` (Video timestamp: ${ts})` : ''}${goldenNote}\nType: ${res.documentType}${langNote}\nPassage: ${passage}\nURL: ${res.url}`;
    })
    .join('\n\n');
}

/**
 * Shared Retrieval & Safety Pre-Flight used by both standard JSON (/api/rag)
 * and SSE Streaming (/api/rag/stream) endpoints.
 */
export async function prepareResearchAssistantContext(options: AskAssistantOptions) {
  const startedAt = Date.now();
  const { query, locale = 'fa', history = [], pillar = 'all', type = 'all' } = options;

  const persona = await getActivePersonaVersion();
  const safety = assessQuerySafety(query, locale, persona.clinicalBoundaryPolicy, history);

  if (safety.isPromptInjection) {
    void recordSecurityAuditEvent({
      eventType: 'prompt_injection_blocked',
      severity: 'high',
      route: '/api/rag',
      detail: `Layer-1 blocked (${safety.injectionPattern || 'pattern'}): ${query.slice(0, 120)}`,
    });
    throw new Error(
      `PROMPT_INJECTION_DETECTED: Malicious adversarial instruction detected (${safety.injectionPattern}). Request rejected.`
    );
  }

  // Layer-2 ML Prompt Injection Classifier (meta-llama/llama-prompt-guard-2-86m)
  if (!options.forceDeterministic && !safety.isPersonalCrisis) {
    const mlInput = [
      query,
      ...history
        .filter((h) => h.role === 'user')
        .slice(-2)
        .map((h) => h.content),
    ].join('\n');
    const mlGuard = await classifyWithMlPromptGuard(mlInput);
    if (mlGuard.isInjection) {
      void recordSecurityAuditEvent({
        eventType: 'ml_prompt_guard_blocked',
        severity: 'high',
        route: '/api/rag',
        detail: `Layer-2 ML Prompt Guard blocked (${mlGuard.reason || 'high_risk'}): ${query.slice(0, 120)}`,
      });
      throw new Error(
        `PROMPT_INJECTION_DETECTED: Adversarial instruction blocked by semantic security guard (${mlGuard.reason || 'ml_guard'}).`
      );
    }
  }

  if (safety.isPersonalCrisis && safety.crisisResponse) {
    let telemetryId: string | undefined;
    if (!options.skipTelemetry) {
      const t = await recordQueryTelemetry({
        sessionSeed: options.sessionSeed || 'anonymous',
        locale,
        pillarFilter: pillar,
        rawQuery: '[clinical-crisis-helpline-triggered]',
        topScore: 1,
        citationCount: 0,
        engineTier: 'crisis_guard',
        latencyMs: Date.now() - startedAt,
      }).catch(() => undefined);
      telemetryId = t?.id;
    }

    return {
      shortCircuitResponse: {
        answer: safety.crisisResponse,
        locale,
        citations: [],
        suggestedFollowUps: [],
        telemetryId,
        groundingScore: 1.0,
        engineTier: 'crisis_guard' as const,
        safetyMode: 'crisis_helpline' as const,
      },
      persona,
      safety,
      startedAt,
      searchQuery: query,
      results: [] as SearchResultItem[],
      citations: [] as RagCitation[],
      deterministic: { answer: safety.crisisResponse, suggestedFollowUps: [] as string[] },
      citationsText: '',
      budgetExceeded: false,
    };
  }

  const searchQuery =
    history.length > 0 && !options.forceDeterministic
      ? await condenseMultiTurnQuery({ query, history, locale })
      : query;

  const maxCitations = Math.min(8, Math.max(3, persona.citationPolicy.maxCitationsPerAnswer || 5));
  const results = await executeHybridSearch({
    q: searchQuery,
    locale,
    pillar,
    type,
    limit: maxCitations,
    allowCrossLingual: persona.citationPolicy.allowCrossLingualSources ?? true,
  });

  // Strict Out-of-Scope / Zero-Hallucination Refusal Gate:
  // Refuse when non-generic subject terms fail corpus or single-document co-occurrence grounding
  const topCandidate = results[0];
  const nonGenericTotal = topCandidate?.nonGenericTermCount ?? 0;
  const corpusHits = topCandidate?.nonGenericCorpusHits ?? 0;
  const maxDocTermMatches = results.reduce((m, r) => Math.max(m, r.matchedQueryTerms || 0), 0);
  const anyGlossaryMatch = results.some((r) => r.glossaryBoosted);

  const isClearlyOutOfScope =
    results.length === 0 ||
    (!anyGlossaryMatch &&
      nonGenericTotal >= 3 &&
      (corpusHits / nonGenericTotal < 0.56 ||
        (nonGenericTotal >= 4 && maxDocTermMatches / nonGenericTotal < 0.36)));

  const groundedResults = isClearlyOutOfScope
    ? []
    : results.filter((r) => r.bm25Score > 0.5 || r.vectorScore >= 0.48);

  const citations = buildCitationsPayload(groundedResults);
  const deterministic = synthesizeGroundedAnswer(query, locale, citations, groundedResults);
  const citationsText = buildCitationsPromptText(groundedResults);

  const monthlyUsed = options.forceDeterministic ? 0 : await getMonthlyTokensUsed().catch(() => 0);
  const budgetExceeded = monthlyUsed >= persona.monthlyTokenBudget;

  return {
    shortCircuitResponse: null,
    persona,
    safety,
    startedAt,
    searchQuery,
    results: groundedResults,
    citations,
    deterministic,
    citationsText,
    budgetExceeded,
  };
}

/**
 * Ask Dr. Hassan Makaremi's Research Assistant (Standard JSON Response)
 */
export async function askResearchAssistant(options: AskAssistantOptions): Promise<RagResponse> {
  const ctx = await prepareResearchAssistantContext(options);
  if (ctx.shortCircuitResponse) return ctx.shortCircuitResponse;

  const locale = options.locale || 'fa';
  let rawAnswer = ctx.deterministic.answer;
  let engineTier: RagResponse['engineTier'] = 'deterministic';
  let promptTokens = 0;
  let completionTokens = 0;

  if (ctx.results.length > 0 && !options.forceDeterministic) {
    const routed = await synthesizeRagWithRouter({
      query: options.query,
      locale,
      citationsText: ctx.citationsText,
      systemConstitution: selectPersonaConstitution(locale, ctx.persona),
      history: options.history,
      routing: ctx.persona.providerRouting,
      budgetExceeded: ctx.budgetExceeded,
    });
    if (routed) {
      rawAnswer = routed.text;
      engineTier = routed.engineTier;
      promptTokens = routed.promptTokens;
      completionTokens = routed.completionTokens;
    }
  }

  const verified = verifyGeneratedAnswer({
    answer: rawAnswer,
    citations: ctx.citations,
    locale,
    needsClinicalDisclaimer: ctx.safety.needsClinicalDisclaimer,
  });

  const resolvedGoldenId = ctx.results.find((r) => r.isGoldenQa)?.documentId.replace(/^golden_qa_/, '') || null;
  let telemetryId: string | undefined;
  if (!options.skipTelemetry) {
    const tel = await recordQueryTelemetry({
      sessionSeed: options.sessionSeed || 'anonymous',
      locale,
      pillarFilter: options.pillar || 'all',
      rawQuery: options.query,
      topScore: ctx.results[0]?.score || 0,
      citationCount: ctx.citations.length,
      engineTier,
      latencyMs: Date.now() - ctx.startedAt,
      promptTokens,
      completionTokens,
      resolvedGoldenQaId: resolvedGoldenId,
    }).catch(() => undefined);
    telemetryId = tel?.id;

    // Auto-escalate genuine knowledge gaps to Professor's Telegram/WhatsApp & Pishkhan Queue
    const topScore = ctx.results[0]?.score || 0;
    if (
      !options.forceDeterministic &&
      !ctx.safety.isPersonalCrisis &&
      (ctx.citations.length === 0 || topScore < 0.25)
    ) {
      void enqueueAndDispatchProfessorEscalation({
        questionText: options.query,
        locale,
        pillar: options.pillar && options.pillar !== 'all' ? options.pillar : 'psychoanalysis',
        contextSummary: `تعداد منابع یافت‌شده: ${ctx.citations.length} | امتیاز: ${topScore.toFixed(3)}`,
      }).catch(() => undefined);
    }
  }

  return {
    answer: verified.verifiedAnswer,
    locale,
    citations: ctx.citations,
    suggestedFollowUps: ctx.deterministic.suggestedFollowUps,
    telemetryId,
    groundingScore: verified.groundingScore,
    engineTier,
    rewrittenQuery: ctx.searchQuery !== options.query ? ctx.searchQuery : undefined,
    safetyMode: ctx.safety.needsClinicalDisclaimer ? 'clinical_boundary' : 'normal',
  };
}

/**
 * Streaming SSE generator for /api/rag/stream
 */
export async function* streamResearchAssistant(options: AskAssistantOptions): AsyncGenerator<
  | { event: 'metadata'; data: { citations: RagCitation[]; safetyMode: RagResponse['safetyMode']; rewrittenQuery?: string } }
  | { event: 'token'; data: { delta: string } }
  | { event: 'done'; data: RagResponse }
> {
  const ctx = await prepareResearchAssistantContext(options);
  const locale = options.locale || 'fa';

  if (ctx.shortCircuitResponse) {
    yield {
      event: 'metadata',
      data: { citations: [], safetyMode: 'crisis_helpline' },
    };
    yield { event: 'token', data: { delta: ctx.shortCircuitResponse.answer } };
    yield { event: 'done', data: ctx.shortCircuitResponse };
    return;
  }

  const safetyMode: RagResponse['safetyMode'] = ctx.safety.needsClinicalDisclaimer
    ? 'clinical_boundary'
    : 'normal';

  yield {
    event: 'metadata',
    data: {
      citations: ctx.citations,
      safetyMode,
      rewrittenQuery: ctx.searchQuery !== options.query ? ctx.searchQuery : undefined,
    },
  };

  if (ctx.results.length === 0) {
    const verified = verifyGeneratedAnswer({
      answer: ctx.deterministic.answer,
      citations: [],
      locale,
      needsClinicalDisclaimer: ctx.safety.needsClinicalDisclaimer,
    });
    yield { event: 'token', data: { delta: verified.verifiedAnswer } };
    const tel = !options.skipTelemetry
      ? await recordQueryTelemetry({
        sessionSeed: options.sessionSeed || 'anonymous',
        locale,
        pillarFilter: options.pillar || 'all',
        rawQuery: options.query,
        topScore: 0,
        citationCount: 0,
        engineTier: 'deterministic',
        latencyMs: Date.now() - ctx.startedAt,
      }).catch(() => undefined)
      : undefined;

    if (!options.skipTelemetry && !options.forceDeterministic && !ctx.safety.isPersonalCrisis) {
      void enqueueAndDispatchProfessorEscalation({
        questionText: options.query,
        locale,
        pillar: options.pillar && options.pillar !== 'all' ? options.pillar : 'psychoanalysis',
        contextSummary: 'پرسش استریمی بدون سند متناظر در آرشیو فعلی',
      }).catch(() => undefined);
    }
    yield {
      event: 'done',
      data: {
        answer: verified.verifiedAnswer,
        locale,
        citations: [],
        suggestedFollowUps: ctx.deterministic.suggestedFollowUps,
        telemetryId: tel?.id,
        groundingScore: verified.groundingScore,
        engineTier: 'deterministic',
        safetyMode,
      },
    };
    return;
  }

  let finalText = ctx.deterministic.answer;
  let engineTier: 'primary' | 'fallback_fast' | 'deterministic' = 'deterministic';
  let promptTokens = 0;
  let completionTokens = 0;

  for await (const chunk of streamRagAnswerTokens({
    query: options.query,
    locale,
    citationsText: ctx.citationsText,
    systemConstitution: selectPersonaConstitution(locale, ctx.persona),
    history: options.history,
    routing: ctx.persona.providerRouting,
    deterministicAnswer: ctx.deterministic.answer,
    budgetExceeded: ctx.budgetExceeded,
  })) {
    if ('delta' in chunk) {
      yield { event: 'token', data: { delta: chunk.delta } };
    } else if ('finalMeta' in chunk) {
      finalText = chunk.finalMeta.fullText;
      engineTier = chunk.finalMeta.engineTier;
      promptTokens = chunk.finalMeta.promptTokens;
      completionTokens = chunk.finalMeta.completionTokens;
    }
  }

  const verified = verifyGeneratedAnswer({
    answer: finalText,
    citations: ctx.citations,
    locale,
    needsClinicalDisclaimer: ctx.safety.needsClinicalDisclaimer,
  });

  const resolvedGoldenId = ctx.results.find((r) => r.isGoldenQa)?.documentId.replace(/^golden_qa_/, '') || null;
  const tel = !options.skipTelemetry
    ? await recordQueryTelemetry({
      sessionSeed: options.sessionSeed || 'anonymous',
      locale,
      pillarFilter: options.pillar || 'all',
      rawQuery: options.query,
      topScore: ctx.results[0]?.score || 0,
      citationCount: ctx.citations.length,
      engineTier,
      latencyMs: Date.now() - ctx.startedAt,
      promptTokens,
      completionTokens,
      resolvedGoldenQaId: resolvedGoldenId,
    }).catch(() => undefined)
    : undefined;

  yield {
    event: 'done',
    data: {
      answer: verified.verifiedAnswer,
      locale,
      citations: ctx.citations,
      suggestedFollowUps: ctx.deterministic.suggestedFollowUps,
      telemetryId: tel?.id,
      groundingScore: verified.groundingScore,
      engineTier,
      rewrittenQuery: ctx.searchQuery !== options.query ? ctx.searchQuery : undefined,
      safetyMode,
    },
  };
}
