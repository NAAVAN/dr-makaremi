import crypto from 'node:crypto';
import type {
  AiConceptEdge,
  AiEvalRunSummary,
  AiFeedbackEvent,
  AiGlossaryTermExtended,
  AiGoldenQaItem,
  AiPersonaVersion,
  AiQueryTelemetryRecord,
  AiTrainingDocument,
  AiTrainingTelemetryOverview,
  ContentPillar,
  Locale,
} from '@makaremi/shared';
import { getNeonSql, isNeonDatabaseConfigured } from '@/lib/commerce/db';
import { readOverlayJson, writeOverlayJson } from '@/lib/vault-loader';
import { buildCanonicalString, computeCanonicalSha256, signWithEd25519 } from '@/lib/crypto';
import { countWords, normalizePersianText } from '@/lib/etl/persian-normalizer';
import { ensureRagTrainingSchema, getEmbeddedChunkCount, getRagStorageMode, isRagPgvectorReady } from './db';
import { sanitizePiiFromQuery } from './safety-guard';
import {
  bumpKnowledgeBaseVersion,
  registerKbVersionChangeListener,
} from '@/lib/studio/neon-cms-store';

const GOLDEN_QA_FILE = 'ai-training-golden-qa.json';
const PERSONA_FILE = 'ai-training-personas.json';
const GLOSSARY_EXT_FILE = 'glossary-extended.json';
const GLOSSARY_OVERRIDE_FILE = 'ai-training-glossary-overrides.json';
const TRAINING_DOCS_FILE = 'ai-training-documents.json';
const TELEMETRY_FILE = 'ai-training-telemetry.json';
const FEEDBACK_FILE = 'ai-training-feedback.json';
const EVAL_RUNS_FILE = 'ai-training-eval-runs.json';

interface GlossaryFileSchema {
  version?: string;
  updatedAt?: string;
  terms: AiGlossaryTermExtended[];
  edges: AiConceptEdge[];
}

const gTrain = globalThis as unknown as {
  __makaremiTrainingListeners?: Set<() => void>;
};
const trainingListeners = (gTrain.__makaremiTrainingListeners ??= new Set<() => void>());

export function registerTrainingInvalidationListener(fn: () => void): void {
  trainingListeners.add(fn);
}

registerKbVersionChangeListener(() => {
  cachedSyncSnapshot = null;
});

function notifyTrainingUpdated(eventSummary = 'training_updated', slug = 'training'): void {
  cachedSyncSnapshot = null;
  for (const fn of trainingListeners) {
    try {
      fn();
    } catch {
      // ignore listener errors
    }
  }
  void bumpKnowledgeBaseVersion(eventSummary, 'ai_training', slug).catch(() => undefined);
}

// -----------------------------------------------------------------------------
// Authoritative Default Master Constitution (Signed & Versioned)
// -----------------------------------------------------------------------------
function buildDefaultPersonaVersion(): AiPersonaVersion {
  const fa = [
    'شما دستیار پژوهشی رسمی آرشیو آثار، مقالات، کتاب‌ها، شعرها، تابلوهای خوشنویسی و سخنرانی‌های استاد دکتر حسن مکارمی (روان‌کاو بالینی لکانی مقیم پاریس، حافظ‌پژوه، خوشنویس معاصر و مدافع حقوق بشر) هستید.',
    '۱. وفاداری مطلق به اسناد (Zero-Hallucination): هر ادعا، تاریخ، عدد و نقل‌قول را صرفاً بر پایهٔ گزیده‌های مستندِ ارائه‌شده بنویسید و در پایان جملات با نشانگر [1]، [2] و... ارجاع دهید. هرگز کتاب، سخنرانی، نقل‌قول یا سالی خارج از اسناد نسازید.',
    '۲. لحن و دقت واژگانی: با نثر فرهیخته، علمی، دقیق و محترمانه پاسخ دهید و اصطلاحات قفل‌شدهٔ استاد (دگرشنیدن، عملیات نام پدر، حالت مرزی، گره بورومه‌ای، سرزمین فرهنگی ایران، دادخواهی) را عیناً رعایت کنید.',
    '۳. تفکیک پژوهش از درمان بالینی: این سامانه صرفاً مرجع پژوهشی و آرشیوی است؛ هرگز تشخیص پزشکی، نسخهٔ دارویی یا روان‌درمانی فردی ارائه ندهید.',
    '۴. برچسب‌سفید مطلق: هرگز به نام هیچ شرکت فناوری یا نام مدل هوش مصنوعی خارجی اشاره نکنید.',
    '۵. منابع میان‌زبانی: اگر بهترین سند به زبان دیگری از آرشیو (مثلاً سخنرانی فارسی یا مقالهٔ فرانسوی) است، محتوای آن را با امانت به زبان پرسشگر تبیین کنید و زبان مبدأ سند را یادآور شوید.',
    '۶. نثر طبیعی و انسانی (Humanizer علمی): مستقیم وارد اصل پاسخ شوید؛ از کلیشه‌های ماشینی («شایان ذکر است»، «نه تنها X بلکه Y»، جملات پایانی شعارگونه، ایموجی تزئینی و مقدمه‌چینی‌های چت‌باتی) بپرهیزید و با نثر روان، روشن و وقار علمی پاسخ دهید.',
  ].join('\n');

  const fr = [
    "Vous êtes l'assistant de recherche académique officiel des archives du Dr Hassan Makaremi (psychanalyste clinicien lacanien établi à Paris, chercheur, calligraphe contemporain, spécialiste de Hafez et défenseur des droits humains).",
    "1. Ancrage strict sans hallucination : Fondez chaque affirmation exclusivement sur les extraits vérifiés fournis et citez-les dans le texte avec [1], [2], etc. N'inventez jamais d'ouvrage, de date ni de citation.",
    "2. Précision terminologique : Respectez le français académique parisien et la terminologie consacrée (Écouter autrement, Opération Nom-du-Père, État limite, Nœud borroméen, Terre culturelle de l'Iran, Dadkhahi).",
    "3. Limite déontologique : Cet outil est strictement académique et archivistique ; ne formulez jamais de diagnostic médical ni de psychothérapie personnalisée.",
    "4. Marque blanche absolue : Ne mentionnez jamais aucun fournisseur technique ni nom de modèle externe.",
    "5. Prose humaine et sobre (Humanizer) : Répondez directement sans formules de chatbot, sans clichés (« il convient de souligner », « ce n'est pas seulement X mais Y »), sans émojis ni tirets cadratins excessifs.",
  ].join('\n');

  const en = [
    "You are the official Academic Research Assistant for Dr. Hassan Makaremi's trilingual archive (Paris-based Lacanian clinical psychoanalyst, author, contemporary Persian calligrapher, Hafez scholar, and human-rights advocate).",
    '1. Strict zero-hallucination grounding: Base every factual claim strictly on the verified archival excerpts provided, citing them inline as [1], [2], etc. Never fabricate books, dates, statistics, or quotations.',
    '2. British/UNESCO Academic English & Locked Terms: Use British spelling (analyse, psychoanalyse, colour, centre, catalogue, programme) and preserve canonical terms (Listening Differently, Operation of the Name-of-the-Father, Borderline State, Borromean Knot, Cultural Realm of Iran, Dadkhahi).',
    '3. Clinical ethics boundary: Maintain strict scholarly framing; never issue medical diagnoses, prescriptions, or personal therapy.',
    '4. Strict white-label integrity: Never mention any external technology vendor or model brand name.',
    '5. Natural human scholarly prose (Humanizer): Start directly with the answer; avoid chatbot wrappers, "not just X, but Y" contrasts, forced triads, em-dash overuse, bold-label bullet spam, and stock AI buzzwords (delve, tapestry, testament, pivotal).',
  ].join('\n');

  const canonical = buildCanonicalString({
    slug: 'ai-persona-v1',
    locale: 'fa',
    title: 'منشور معرفتی پایه (نسخه ۱)',
    body_markdown: `${fa}\n\n${fr}\n\n${en}`,
    published_at: '2026-11-26T00:00:00.000Z',
  });

  return {
    versionId: 1,
    label: 'منشور معرفتی پایه استاد دکتر حسن مکارمی (نسخه ۱)',
    isActive: true,
    systemConstitutionFa: fa,
    systemConstitutionFr: fr,
    systemConstitutionEn: en,
    clinicalBoundaryPolicy: {
      enableCrisisDetection: true,
      blockMedicalDiagnosis: true,
      appendDisclaimerOnClinicalQueries: true,
      helplineFrance: '3114 (Numéro national de prévention du suicide — 24h/24, 7j/7, gratuit) · Urgences : 15 / 112',
      helplineIran: '۱۴۸۰ (صدای مشاور بهزیستی) · ۱۲۳ (اورژانس اجتماعی) · ۱۱۵ (اورژانس پزشکی)',
      helplineInternationalUrl: 'https://findahelpline.com',
    },
    citationPolicy: {
      requireInlineAnchors: true,
      minGroundingConfidence: 0.35,
      maxCitationsPerAnswer: 5,
      allowCrossLingualSources: true,
      enforceStrictWhiteLabel: true,
    },
    providerRouting: {
      primaryProfile: 'literary_balanced',
      enableFastFallback: true,
      enableDeterministicFallback: true,
      requestTimeoutMs: 25000,
      maxOutputTokens: 1400,
      temperature: 0.2,
    },
    monthlyTokenBudget: 5_000_000,
    signatureEd25519: signWithEd25519(canonical),
    createdAt: '2026-11-26T00:00:00.000Z',
  };
}

// -----------------------------------------------------------------------------
// Authoritative Default Golden Q&A Seed (Signed with Ed25519)
// -----------------------------------------------------------------------------
function makeSignedGoldenQa(input: {
  id: string;
  locale: Locale;
  pillar: ContentPillar;
  questionCanonical: string;
  questionVariants: string[];
  answerMarkdown: string;
  linkedUrls: string[];
  priorityBoost?: number;
}): AiGoldenQaItem {
  const now = '2026-11-26T00:00:00.000Z';
  const canonical = buildCanonicalString({
    slug: `golden-qa-${input.id}`,
    locale: input.locale,
    title: input.questionCanonical,
    body_markdown: input.answerMarkdown,
    published_at: now,
  });
  return {
    id: input.id,
    locale: input.locale,
    pillar: input.pillar,
    questionCanonical: input.questionCanonical,
    questionVariants: input.questionVariants,
    answerMarkdown: input.answerMarkdown,
    linkedUrls: input.linkedUrls,
    priorityBoost: input.priorityBoost ?? 1.85,
    status: 'published',
    contentSha256: computeCanonicalSha256(canonical),
    signatureEd25519: signWithEd25519(canonical),
    createdBy: 'professor_seed',
    createdAt: now,
    updatedAt: now,
  };
}

const DEFAULT_GOLDEN_QA: AiGoldenQaItem[] = [
  makeSignedGoldenQa({
    id: 'gqa-cnrs-science-fa',
    locale: 'fa',
    pillar: 'psychoanalysis',
    questionCanonical: 'دیدگاه دکتر حسن مکارمی دربارهٔ علم بودن روان‌کاوی و آمار CNRS چیست؟',
    questionVariants: [
      'آیا روان‌کاوی علم است؟',
      'آمار ۳۹۵۴ پژوهش CNRS در آثار دکتر مکارمی',
      'پاسخ دکتر مکارمی به نقد علمی بودن روان‌کاوی',
    ],
    answerMarkdown:
      'در مقالهٔ مستند «آیا روان‌کاوی یک علم است؟»، دکتر حسن مکارمی تصریح می‌کند که روان‌کاوی به علوم تجربی اثبات‌گرا تقلیل نمی‌یابد، بلکه علمِ سوژهٔ ساختاریافته همچون زبان است. ایشان به پیمایش مرکز ملی پژوهش‌های علمی فرانسه (CNRS) استناد می‌کنند که **۳٬۹۵۴ پروژهٔ پژوهشی روان‌کاوی** را مستند کرده است: **۳٬۷۵۵ پروژه** دارای رویکرد میان‌رشته‌ای، **۱۸۴ پروژه** صرفاً بالینی و **۱۵ پروژه** در حوزهٔ زبان‌شناسی هستند.',
    linkedUrls: ['/fa/psychoanalysis/articles/is-psychoanalysis-a-science'],
  }),
  makeSignedGoldenQa({
    id: 'gqa-listening-differently-fa',
    locale: 'fa',
    pillar: 'psychoanalysis',
    questionCanonical: 'مفهوم «دگرشنیدن» (Écouter autrement) در آثار دکتر مکارمی به چه معناست؟',
    questionVariants: [
      'دگرشنیدن چیست؟',
      'تفاوت دگرشنیدن با گوش دادن عادی',
      'روش دگرشنیدن در حافظ و کلینیک',
    ],
    answerMarkdown:
      '«دگرشنیدن» (در فرانسه: *Écouter autrement* و در انگلیسی: *Listening Differently*) رویکرد بالینی و هرمنوتیک ویژهٔ دکتر حسن مکارمی است. در این روش، شنونده از شنیدنِ سطحی و پیش‌داورانهٔ پیام آگاهانه فراتر می‌رود و به شکاف‌های کلام، لغزش‌ها، سکوت‌ها و زنجیرهٔ دال‌های ناخودآگاه گوش می‌سپارد؛ روشی که هم در اتاق روان‌کاوی و هم در بازخوانی دیوان حافظ («حافظ با حافظ») و تحلیل جامعهٔ ایرانی به کار می‌رود.',
    linkedUrls: ['/fa/psychoanalysis/articles/is-psychoanalysis-a-science', '/fa/books/hafez-par-hafez'],
  }),
  makeSignedGoldenQa({
    id: 'gqa-cultural-realm-fa',
    locale: 'fa',
    pillar: 'cultural_strategy',
    questionCanonical: 'منظور دکتر مکارمی از «سرزمین فرهنگی ایران» چیست؟',
    questionVariants: [
      'سرزمین فرهنگی ایران چه تفاوتی با مرزهای سیاسی دارد؟',
      'تبیین ایران فرهنگی و رنگین‌کمان اقوام',
    ],
    answerMarkdown:
      '«سرزمین فرهنگی ایران» (*Terre culturelle de l’Iran*) مفهومی تمدنی و راهبردی در اندیشهٔ دکتر حسن مکارمی است که فراتر از مرزهای سیاسی معاصر (پس از عهدنامه‌های گلستان و ترکمانچای) بر پیوند تاریخی اقوام، زبان و ادبیات مشترک (شاهنامه و حافظ)، تساهل و همزیستی رنگین‌کمان هویتی مردمان ایران استوار است و بستر گذار خشونت‌پرهیز به مردم‌سالاری سکولار به شمار می‌رود.',
    linkedUrls: ['/fa/strategy/articles/cultural-land-of-iran-strategy'],
  }),
  makeSignedGoldenQa({
    id: 'gqa-dadkhahi-khavaran-fa',
    locale: 'fa',
    pillar: 'human_rights_dadkhahi',
    questionCanonical: 'جایگاه دادخواهی و یادمان خاوران در عدالت انتقالی از دیدگاه دکتر مکارمی چیست؟',
    questionVariants: [
      'تفاوت دادخواهی با انتقام‌جویی چیست؟',
      'نقش مادران خاوران و کشتار ۶۷ در سوگ سیاسی',
    ],
    answerMarkdown:
      'دکتر حسن مکارمی دادخواهی (*Dadkhahi / Quête de justice*) را نه انتقام‌جویی، بلکه حرکتی اخلاقی، حقوقی و نمادین برای حقیقت‌یابی، ثبت حافظهٔ قربانیان کشتار ۱۳۶۷ و یادمان خاوران، پایان مصونیت از مجازات و تحقق عدالت انتقالی می‌داند. در نگاه روان‌کاوانهٔ ایشان، کارِ سوگ سیاسی از تکرار کور تروما و خشونت در ایران آینده جلوگیری می‌کند.',
    linkedUrls: ['/fa/human-rights/speeches/khavaran-justice-session'],
  }),
  makeSignedGoldenQa({
    id: 'gqa-atelier-authenticity-fa',
    locale: 'fa',
    pillar: 'art_calligraphy',
    questionCanonical: 'نحوهٔ خرید آثار اصل خوشنویسی، کتاب‌ها و بررسی گواهی اصالت Décret Marcus چگونه است؟',
    questionVariants: [
      'چطور تابلو اصل یا چاپ موزه‌ای دکتر مکارمی را تهیه کنم؟',
      'گواهی اصالت آثار دکتر مکارمی و امضای Ed25519 چیست؟',
    ],
    answerMarkdown:
      'آثار اصل خوشنویسی، چاپ‌های موزه‌ای شماره‌دار (Fine Art) و کتاب‌های دکتر حسن مکارمی مستقیماً از طریق بخش رسمی «فروشگاه و آتلیهٔ پاریس» در همین وب‌سایت عرضه می‌شوند. تمامی آثار اصل و چاپ‌های شماره‌دار مطابق قانون **Décret Marcus** فرانسه دارای گواهی اصالت رسمی همراه با امضای رمزنگاری‌شدهٔ **Ed25519** هستند که کد هر گواهی در صفحهٔ استعلام عمومی اصالت قابل راستی‌آزمایی است.',
    linkedUrls: ['/fa/shop', '/fa/gallery'],
  }),
  makeSignedGoldenQa({
    id: 'gqa-etat-limite-fr',
    locale: 'fr',
    pillar: 'psychoanalysis',
    questionCanonical: "Comment le Dr Hassan Makaremi définit-il l'État limite en psychanalyse lacanienne ?",
    questionVariants: [
      "Définition clinique de l'État limite",
      'Différence entre état limite, névrose et psychose selon Dr Makaremi',
    ],
    answerMarkdown:
      "Dans son étude clinique « État limite : un concept psychanalytique ? », le Dr Hassan Makaremi analyse l'État limite non comme une étiquette psychiatrique statique, mais comme une position structurale instable située entre névrose et psychose, marquée par une fragilité du nouage borroméen (Réel, Symbolique, Imaginaire) et de la métaphore paternelle (Opération Nom-du-Père). L'écoute clinique (*Écouter autrement*) des failles discursives demeure essentielle.",
    linkedUrls: ['/fr/psychanalyse/articles/etat-limite-concept-psychanalytique'],
  }),
];

// -----------------------------------------------------------------------------
// Synchronous Snapshot for Fast In-Memory Hybrid Search Indexing
// -----------------------------------------------------------------------------
export interface SyncTrainingSnapshot {
  persona: AiPersonaVersion;
  goldenQa: AiGoldenQaItem[];
  glossaryTerms: AiGlossaryTermExtended[];
  conceptEdges: AiConceptEdge[];
  trainingDocuments: AiTrainingDocument[];
}

let cachedSyncSnapshot: SyncTrainingSnapshot | null = null;
let neonOverlayMemory: {
  persona?: AiPersonaVersion;
  goldenQa?: AiGoldenQaItem[];
  glossaryTerms?: AiGlossaryTermExtended[];
  conceptEdges?: AiConceptEdge[];
  trainingDocuments?: AiTrainingDocument[];
} = {};

function loadBaseGlossaryFile(): GlossaryFileSchema {
  const data = readOverlayJson<GlossaryFileSchema>(GLOSSARY_EXT_FILE, {
    terms: [],
    edges: [],
  });
  const now = '2026-11-26T00:00:00.000Z';
  const terms = (data.terms || []).map((t) => ({
    ...t,
    aliases: Array.isArray(t.aliases) ? t.aliases : [],
    linked_sources: Array.isArray(t.linked_sources) ? t.linked_sources : [],
    is_locked_translation: Boolean(t.is_locked_translation),
    created_at: t.created_at || now,
    updated_at: t.updated_at || now,
  }));
  return {
    version: data.version || '2.0.0',
    updatedAt: data.updatedAt || now,
    terms,
    edges: Array.isArray(data.edges) ? data.edges : [],
  };
}

export function getSyncTrainingSnapshot(): SyncTrainingSnapshot {
  if (cachedSyncSnapshot) return cachedSyncSnapshot;

  const baseGlossary = loadBaseGlossaryFile();
  const glossaryOverride = readOverlayJson<{
    terms?: AiGlossaryTermExtended[];
    edges?: AiConceptEdge[];
  }>(GLOSSARY_OVERRIDE_FILE, {});

  const termMap = new Map<string, AiGlossaryTermExtended>();
  for (const t of baseGlossary.terms) termMap.set(t.id, t);
  for (const t of glossaryOverride.terms || []) termMap.set(t.id, t);
  for (const t of neonOverlayMemory.glossaryTerms || []) termMap.set(t.id, t);

  const edgeMap = new Map<string, AiConceptEdge>();
  for (const e of [...baseGlossary.edges, ...(glossaryOverride.edges || []), ...(neonOverlayMemory.conceptEdges || [])]) {
    edgeMap.set(`${e.sourceTermId}|${e.targetTermId}|${e.relationType}`, e);
  }

  const localPersonas = readOverlayJson<AiPersonaVersion[]>(PERSONA_FILE, []);
  const activeLocalPersona = localPersonas.find((p) => p.isActive) || localPersonas[0] || buildDefaultPersonaVersion();

  const localGolden = readOverlayJson<AiGoldenQaItem[]>(GOLDEN_QA_FILE, []);
  const goldenMap = new Map<string, AiGoldenQaItem>();
  for (const g of DEFAULT_GOLDEN_QA) goldenMap.set(g.id, g);
  for (const g of localGolden) goldenMap.set(g.id, g);
  for (const g of neonOverlayMemory.goldenQa || []) goldenMap.set(g.id, g);

  const localDocs = readOverlayJson<AiTrainingDocument[]>(TRAINING_DOCS_FILE, []);
  const docsMap = new Map<string, AiTrainingDocument>();
  for (const d of localDocs) docsMap.set(d.id, d);
  for (const d of neonOverlayMemory.trainingDocuments || []) docsMap.set(d.id, d);

  cachedSyncSnapshot = {
    persona: neonOverlayMemory.persona || activeLocalPersona,
    goldenQa: Array.from(goldenMap.values()).filter((g) => g.status !== 'archived'),
    glossaryTerms: Array.from(termMap.values()),
    conceptEdges: Array.from(edgeMap.values()),
    trainingDocuments: Array.from(docsMap.values()).filter((d) => d.status === 'indexed'),
  };

  return cachedSyncSnapshot;
}

// -----------------------------------------------------------------------------
// Async Hydration from Neon Postgres (called on Studio & RAG calls)
// -----------------------------------------------------------------------------
let lastNeonSyncAt = 0;

export async function hydrateTrainingFromNeonIfNeeded(force = false): Promise<void> {
  if (!isNeonDatabaseConfigured()) return;
  if (!force && Date.now() - lastNeonSyncAt < 25_000) return;

  try {
    await ensureRagTrainingSchema();
    const sql = getNeonSql();

    const [personaRows, qaRows, termRows, edgeRows, docRows] = await Promise.all([
      sql`SELECT * FROM ai_persona_versions WHERE is_active = TRUE ORDER BY version_id DESC LIMIT 1`,
      sql`SELECT * FROM ai_golden_qa ORDER BY updated_at DESC`,
      sql`SELECT * FROM ai_glossary_terms ORDER BY updated_at DESC`,
      sql`SELECT * FROM ai_concept_edges ORDER BY id ASC`,
      sql`SELECT * FROM ai_training_documents WHERE status = 'indexed' ORDER BY updated_at DESC`,
    ]);

    const pRow = (personaRows as Array<Record<string, unknown>>)[0];
    if (pRow) {
      neonOverlayMemory.persona = {
        versionId: Number(pRow.version_id),
        label: String(pRow.label),
        isActive: Boolean(pRow.is_active),
        systemConstitutionFa: String(pRow.system_constitution_fa),
        systemConstitutionFr: String(pRow.system_constitution_fr),
        systemConstitutionEn: String(pRow.system_constitution_en),
        clinicalBoundaryPolicy: pRow.clinical_boundary_policy as AiPersonaVersion['clinicalBoundaryPolicy'],
        citationPolicy: pRow.citation_policy as AiPersonaVersion['citationPolicy'],
        providerRouting: pRow.provider_routing_json as AiPersonaVersion['providerRouting'],
        monthlyTokenBudget: Number(pRow.monthly_token_budget || 5_000_000),
        signatureEd25519: String(pRow.signature_ed25519),
        createdAt: new Date(String(pRow.created_at)).toISOString(),
      };
    }

    neonOverlayMemory.goldenQa = (qaRows as Array<Record<string, unknown>>).map((r) => ({
      id: String(r.id),
      locale: String(r.locale) as Locale,
      pillar: String(r.pillar) as ContentPillar,
      questionCanonical: String(r.question_canonical),
      questionVariants: Array.isArray(r.question_variants) ? (r.question_variants as string[]) : [],
      answerMarkdown: String(r.answer_markdown),
      linkedUrls: Array.isArray(r.linked_urls) ? (r.linked_urls as string[]) : [],
      priorityBoost: Number(r.priority_boost || 1.8),
      status: String(r.status) as AiGoldenQaItem['status'],
      contentSha256: String(r.content_sha256),
      signatureEd25519: String(r.signature_ed25519),
      createdBy: String(r.created_by || 'professor'),
      createdAt: new Date(String(r.created_at)).toISOString(),
      updatedAt: new Date(String(r.updated_at)).toISOString(),
    }));

    neonOverlayMemory.glossaryTerms = (termRows as Array<Record<string, unknown>>).map((r) => ({
      id: String(r.id),
      term_fa: String(r.term_fa),
      term_fr: String(r.term_fr),
      term_en: String(r.term_en),
      aliases: Array.isArray(r.aliases_json) ? (r.aliases_json as string[]) : [],
      conceptual_definition_fa: String(r.definition_fa),
      conceptual_definition_fr: String(r.definition_fr || ''),
      conceptual_definition_en: String(r.definition_en || ''),
      pillar: String(r.pillar) as ContentPillar,
      linked_sources: Array.isArray(r.linked_sources_json) ? (r.linked_sources_json as string[]) : [],
      is_locked_translation: Boolean(r.is_locked_translation),
      created_at: new Date(String(r.updated_at)).toISOString(),
      updated_at: new Date(String(r.updated_at)).toISOString(),
    }));

    neonOverlayMemory.conceptEdges = (edgeRows as Array<Record<string, unknown>>).map((r) => ({
      id: Number(r.id),
      sourceTermId: String(r.source_term_id),
      targetTermId: String(r.target_term_id),
      relationType: String(r.relation_type) as AiConceptEdge['relationType'],
      noteFa: r.note_fa ? String(r.note_fa) : undefined,
    }));

    neonOverlayMemory.trainingDocuments = (docRows as Array<Record<string, unknown>>).map((r) => ({
      id: String(r.id),
      slug: String(r.slug),
      title: String(r.title),
      sourceFormat: String(r.source_format) as AiTrainingDocument['sourceFormat'],
      locale: String(r.locale) as Locale,
      pillar: String(r.pillar) as ContentPillar,
      bodyMarkdown: String(r.body_markdown),
      wordCount: Number(r.word_count || 0),
      chunkCount: Number(r.chunk_count || 0),
      status: String(r.status) as AiTrainingDocument['status'],
      contentSha256: String(r.content_sha256),
      signatureEd25519: String(r.signature_ed25519),
      createdAt: new Date(String(r.created_at)).toISOString(),
      updatedAt: new Date(String(r.updated_at)).toISOString(),
    }));

    lastNeonSyncAt = Date.now();
    cachedSyncSnapshot = null;
  } catch {
    // Gracefully stay on local snapshot if Neon temporarily unreachable
  }
}

// -----------------------------------------------------------------------------
// 1. Persona / Master Constitution CRUD
// -----------------------------------------------------------------------------
export async function listPersonaVersions(): Promise<AiPersonaVersion[]> {
  if (isNeonDatabaseConfigured()) {
    try {
      await ensureRagTrainingSchema();
      const sql = getNeonSql();
      const rows = (await sql`SELECT * FROM ai_persona_versions ORDER BY version_id DESC LIMIT 20`) as Array<
        Record<string, unknown>
      >;
      if (rows.length > 0) {
        return rows.map((pRow) => ({
          versionId: Number(pRow.version_id),
          label: String(pRow.label),
          isActive: Boolean(pRow.is_active),
          systemConstitutionFa: String(pRow.system_constitution_fa),
          systemConstitutionFr: String(pRow.system_constitution_fr),
          systemConstitutionEn: String(pRow.system_constitution_en),
          clinicalBoundaryPolicy: pRow.clinical_boundary_policy as AiPersonaVersion['clinicalBoundaryPolicy'],
          citationPolicy: pRow.citation_policy as AiPersonaVersion['citationPolicy'],
          providerRouting: pRow.provider_routing_json as AiPersonaVersion['providerRouting'],
          monthlyTokenBudget: Number(pRow.monthly_token_budget || 5_000_000),
          signatureEd25519: String(pRow.signature_ed25519),
          createdAt: new Date(String(pRow.created_at)).toISOString(),
        }));
      }
    } catch {
      // fall through
    }
  }
  const local = readOverlayJson<AiPersonaVersion[]>(PERSONA_FILE, []);
  return local.length > 0 ? local : [buildDefaultPersonaVersion()];
}

export async function getActivePersonaVersion(): Promise<AiPersonaVersion> {
  await hydrateTrainingFromNeonIfNeeded();
  return getSyncTrainingSnapshot().persona;
}

export async function saveNewPersonaVersion(input: {
  label: string;
  systemConstitutionFa: string;
  systemConstitutionFr: string;
  systemConstitutionEn: string;
  clinicalBoundaryPolicy?: Partial<AiPersonaVersion['clinicalBoundaryPolicy']>;
  citationPolicy?: Partial<AiPersonaVersion['citationPolicy']>;
  providerRouting?: Partial<AiPersonaVersion['providerRouting']>;
  monthlyTokenBudget?: number;
}): Promise<AiPersonaVersion> {
  const current = await getActivePersonaVersion();
  const now = new Date().toISOString();
  const mergedClinical = { ...current.clinicalBoundaryPolicy, ...(input.clinicalBoundaryPolicy || {}) };
  const mergedCitation = { ...current.citationPolicy, ...(input.citationPolicy || {}) };
  const mergedRouting = { ...current.providerRouting, ...(input.providerRouting || {}) };
  const budget = Math.max(100_000, Number(input.monthlyTokenBudget || current.monthlyTokenBudget));

  const canonical = buildCanonicalString({
    slug: `ai-persona-${now}`,
    locale: 'fa',
    title: input.label,
    body_markdown: `${input.systemConstitutionFa}\n\n${input.systemConstitutionFr}\n\n${input.systemConstitutionEn}`,
    published_at: now,
  });
  const signature = signWithEd25519(canonical);

  if (isNeonDatabaseConfigured()) {
    await ensureRagTrainingSchema();
    const sql = getNeonSql();
    await sql`UPDATE ai_persona_versions SET is_active = FALSE WHERE is_active = TRUE`;
    const rows = (await sql`
      INSERT INTO ai_persona_versions (
        label, is_active, system_constitution_fa, system_constitution_fr, system_constitution_en,
        clinical_boundary_policy, citation_policy, provider_routing_json, monthly_token_budget, signature_ed25519
      )
      VALUES (
        ${input.label}, TRUE, ${input.systemConstitutionFa}, ${input.systemConstitutionFr}, ${input.systemConstitutionEn},
        ${JSON.stringify(mergedClinical)}::jsonb, ${JSON.stringify(mergedCitation)}::jsonb,
        ${JSON.stringify(mergedRouting)}::jsonb, ${budget}, ${signature}
      )
      RETURNING version_id, created_at
    `) as Array<{ version_id: number; created_at: string }>;

    const created: AiPersonaVersion = {
      versionId: Number(rows[0]?.version_id || current.versionId + 1),
      label: input.label,
      isActive: true,
      systemConstitutionFa: input.systemConstitutionFa,
      systemConstitutionFr: input.systemConstitutionFr,
      systemConstitutionEn: input.systemConstitutionEn,
      clinicalBoundaryPolicy: mergedClinical,
      citationPolicy: mergedCitation,
      providerRouting: mergedRouting,
      monthlyTokenBudget: budget,
      signatureEd25519: signature,
      createdAt: new Date(String(rows[0]?.created_at || now)).toISOString(),
    };
    neonOverlayMemory.persona = created;
    notifyTrainingUpdated();
    return created;
  }

  const existing = await listPersonaVersions();
  const nextVersionId = Math.max(...existing.map((p) => p.versionId), 0) + 1;
  const created: AiPersonaVersion = {
    versionId: nextVersionId,
    label: input.label,
    isActive: true,
    systemConstitutionFa: input.systemConstitutionFa,
    systemConstitutionFr: input.systemConstitutionFr,
    systemConstitutionEn: input.systemConstitutionEn,
    clinicalBoundaryPolicy: mergedClinical,
    citationPolicy: mergedCitation,
    providerRouting: mergedRouting,
    monthlyTokenBudget: budget,
    signatureEd25519: signature,
    createdAt: now,
  };
  const updatedList = [created, ...existing.map((p) => ({ ...p, isActive: false }))].slice(0, 20);
  writeOverlayJson(PERSONA_FILE, updatedList);
  notifyTrainingUpdated();
  return created;
}

export async function activatePersonaVersion(versionId: number): Promise<AiPersonaVersion | null> {
  if (isNeonDatabaseConfigured()) {
    await ensureRagTrainingSchema();
    const sql = getNeonSql();
    const existing = (await sql`SELECT * FROM ai_persona_versions WHERE version_id = ${versionId} LIMIT 1`) as Array<
      Record<string, unknown>
    >;
    if (!existing.length) return null;
    await sql`UPDATE ai_persona_versions SET is_active = FALSE`;
    await sql`UPDATE ai_persona_versions SET is_active = TRUE WHERE version_id = ${versionId}`;
    await hydrateTrainingFromNeonIfNeeded(true);
    notifyTrainingUpdated();
    return getSyncTrainingSnapshot().persona;
  }

  const list = await listPersonaVersions();
  const target = list.find((p) => p.versionId === versionId);
  if (!target) return null;
  const next = list.map((p) => ({ ...p, isActive: p.versionId === versionId }));
  writeOverlayJson(PERSONA_FILE, next);
  notifyTrainingUpdated();
  return { ...target, isActive: true };
}

// -----------------------------------------------------------------------------
// 2. Golden Q&A CRUD
// -----------------------------------------------------------------------------
export async function listGoldenQaItems(): Promise<AiGoldenQaItem[]> {
  await hydrateTrainingFromNeonIfNeeded();
  return getSyncTrainingSnapshot().goldenQa;
}

export async function upsertGoldenQaItem(input: {
  id?: string;
  locale: Locale;
  pillar: ContentPillar;
  questionCanonical: string;
  questionVariants?: string[];
  answerMarkdown: string;
  linkedUrls?: string[];
  priorityBoost?: number;
  status?: 'draft' | 'published' | 'archived';
  createdBy?: string;
}): Promise<AiGoldenQaItem> {
  const now = new Date().toISOString();
  const id = input.id?.trim() || `gqa-${crypto.randomUUID().slice(0, 12)}`;
  const cleanQ =
    input.locale === 'fa' ? normalizePersianText(input.questionCanonical.trim()) : input.questionCanonical.trim();
  const cleanA =
    input.locale === 'fa' ? normalizePersianText(input.answerMarkdown.trim()) : input.answerMarkdown.trim();
  const variants = (input.questionVariants || []).map((v) => v.trim()).filter(Boolean);
  const urls = (input.linkedUrls || []).map((u) => u.trim()).filter(Boolean);
  const boost = Math.min(2.5, Math.max(1.0, Number(input.priorityBoost ?? 1.85)));
  const status = input.status || 'published';

  const canonical = buildCanonicalString({
    slug: `golden-qa-${id}`,
    locale: input.locale,
    title: cleanQ,
    body_markdown: cleanA,
    published_at: now,
  });
  const item: AiGoldenQaItem = {
    id,
    locale: input.locale,
    pillar: input.pillar,
    questionCanonical: cleanQ,
    questionVariants: variants,
    answerMarkdown: cleanA,
    linkedUrls: urls,
    priorityBoost: boost,
    status,
    contentSha256: computeCanonicalSha256(canonical),
    signatureEd25519: signWithEd25519(canonical),
    createdBy: input.createdBy || 'professor',
    createdAt: now,
    updatedAt: now,
  };

  if (isNeonDatabaseConfigured()) {
    await ensureRagTrainingSchema();
    const sql = getNeonSql();
    await sql`
      INSERT INTO ai_golden_qa (
        id, locale, pillar, question_canonical, question_variants, answer_markdown,
        linked_urls, priority_boost, status, content_sha256, signature_ed25519, created_by, updated_at
      )
      VALUES (
        ${item.id}, ${item.locale}, ${item.pillar}, ${item.questionCanonical},
        ${JSON.stringify(item.questionVariants)}::jsonb, ${item.answerMarkdown},
        ${JSON.stringify(item.linkedUrls)}::jsonb, ${item.priorityBoost}, ${item.status},
        ${item.contentSha256}, ${item.signatureEd25519}, ${item.createdBy}, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        locale = EXCLUDED.locale,
        pillar = EXCLUDED.pillar,
        question_canonical = EXCLUDED.question_canonical,
        question_variants = EXCLUDED.question_variants,
        answer_markdown = EXCLUDED.answer_markdown,
        linked_urls = EXCLUDED.linked_urls,
        priority_boost = EXCLUDED.priority_boost,
        status = EXCLUDED.status,
        content_sha256 = EXCLUDED.content_sha256,
        signature_ed25519 = EXCLUDED.signature_ed25519,
        updated_at = NOW()
    `;
    await hydrateTrainingFromNeonIfNeeded(true);
    notifyTrainingUpdated();
    return item;
  }

  const local = readOverlayJson<AiGoldenQaItem[]>(GOLDEN_QA_FILE, []);
  const filtered = local.filter((g) => g.id !== item.id);
  writeOverlayJson(GOLDEN_QA_FILE, [item, ...filtered]);
  notifyTrainingUpdated();
  return item;
}

export async function deleteGoldenQaItem(id: string): Promise<boolean> {
  if (isNeonDatabaseConfigured()) {
    await ensureRagTrainingSchema();
    const sql = getNeonSql();
    await sql`UPDATE ai_golden_qa SET status = 'archived', updated_at = NOW() WHERE id = ${id}`;
    await hydrateTrainingFromNeonIfNeeded(true);
    notifyTrainingUpdated();
    return true;
  }
  const local = readOverlayJson<AiGoldenQaItem[]>(GOLDEN_QA_FILE, []);
  const existing = local.find((g) => g.id === id) || DEFAULT_GOLDEN_QA.find((g) => g.id === id);
  if (!existing) return false;
  const archived: AiGoldenQaItem = { ...existing, status: 'archived', updatedAt: new Date().toISOString() };
  writeOverlayJson(GOLDEN_QA_FILE, [archived, ...local.filter((g) => g.id !== id)]);
  notifyTrainingUpdated();
  return true;
}

// -----------------------------------------------------------------------------
// 3. Living Glossary & Concept Graph CRUD
// -----------------------------------------------------------------------------
export async function listLivingGlossaryAndEdges(): Promise<{
  terms: AiGlossaryTermExtended[];
  edges: AiConceptEdge[];
}> {
  await hydrateTrainingFromNeonIfNeeded();
  const snap = getSyncTrainingSnapshot();
  return { terms: snap.glossaryTerms, edges: snap.conceptEdges };
}

export async function upsertGlossaryTerm(input: {
  id?: string;
  term_fa: string;
  term_fr: string;
  term_en: string;
  aliases?: string[];
  conceptual_definition_fa: string;
  conceptual_definition_fr?: string;
  conceptual_definition_en?: string;
  pillar: ContentPillar;
  linked_sources?: string[];
  is_locked_translation?: boolean;
}): Promise<AiGlossaryTermExtended> {
  const now = new Date().toISOString();
  const id = input.id?.trim() || `g-custom-${crypto.randomUUID().slice(0, 10)}`;
  const item: AiGlossaryTermExtended = {
    id,
    term_fa: normalizePersianText(input.term_fa.trim()),
    term_fr: input.term_fr.trim(),
    term_en: input.term_en.trim(),
    aliases: (input.aliases || []).map((a) => a.trim()).filter(Boolean),
    conceptual_definition_fa: normalizePersianText(input.conceptual_definition_fa.trim()),
    conceptual_definition_fr: (input.conceptual_definition_fr || '').trim(),
    conceptual_definition_en: (input.conceptual_definition_en || '').trim(),
    pillar: input.pillar,
    linked_sources: (input.linked_sources || []).map((s) => s.trim()).filter(Boolean),
    is_locked_translation: Boolean(input.is_locked_translation),
    created_at: now,
    updated_at: now,
  };

  if (isNeonDatabaseConfigured()) {
    await ensureRagTrainingSchema();
    const sql = getNeonSql();
    await sql`
      INSERT INTO ai_glossary_terms (
        id, term_fa, term_fr, term_en, aliases_json,
        definition_fa, definition_fr, definition_en, pillar,
        linked_sources_json, is_locked_translation, updated_at
      )
      VALUES (
        ${item.id}, ${item.term_fa}, ${item.term_fr}, ${item.term_en},
        ${JSON.stringify(item.aliases)}::jsonb,
        ${item.conceptual_definition_fa}, ${item.conceptual_definition_fr}, ${item.conceptual_definition_en},
        ${item.pillar}, ${JSON.stringify(item.linked_sources)}::jsonb,
        ${item.is_locked_translation}, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        term_fa = EXCLUDED.term_fa,
        term_fr = EXCLUDED.term_fr,
        term_en = EXCLUDED.term_en,
        aliases_json = EXCLUDED.aliases_json,
        definition_fa = EXCLUDED.definition_fa,
        definition_fr = EXCLUDED.definition_fr,
        definition_en = EXCLUDED.definition_en,
        pillar = EXCLUDED.pillar,
        linked_sources_json = EXCLUDED.linked_sources_json,
        is_locked_translation = EXCLUDED.is_locked_translation,
        updated_at = NOW()
    `;
    await hydrateTrainingFromNeonIfNeeded(true);
    notifyTrainingUpdated();
    return item;
  }

  const override = readOverlayJson<{ terms?: AiGlossaryTermExtended[]; edges?: AiConceptEdge[] }>(
    GLOSSARY_OVERRIDE_FILE,
    {}
  );
  const terms = [item, ...(override.terms || []).filter((t) => t.id !== item.id)];
  writeOverlayJson(GLOSSARY_OVERRIDE_FILE, { ...override, terms });
  notifyTrainingUpdated();
  return item;
}

export async function upsertConceptEdge(edge: AiConceptEdge): Promise<AiConceptEdge> {
  if (isNeonDatabaseConfigured()) {
    await ensureRagTrainingSchema();
    const sql = getNeonSql();
    await sql`
      INSERT INTO ai_concept_edges (source_term_id, target_term_id, relation_type, note_fa)
      VALUES (${edge.sourceTermId}, ${edge.targetTermId}, ${edge.relationType}, ${edge.noteFa || null})
      ON CONFLICT (source_term_id, target_term_id, relation_type) DO UPDATE SET
        note_fa = EXCLUDED.note_fa
    `;
    await hydrateTrainingFromNeonIfNeeded(true);
    notifyTrainingUpdated();
    return edge;
  }

  const override = readOverlayJson<{ terms?: AiGlossaryTermExtended[]; edges?: AiConceptEdge[] }>(
    GLOSSARY_OVERRIDE_FILE,
    {}
  );
  const key = `${edge.sourceTermId}|${edge.targetTermId}|${edge.relationType}`;
  const filtered = (override.edges || []).filter(
    (e) => `${e.sourceTermId}|${e.targetTermId}|${e.relationType}` !== key
  );
  writeOverlayJson(GLOSSARY_OVERRIDE_FILE, { ...override, edges: [...filtered, edge] });
  notifyTrainingUpdated();
  return edge;
}

// -----------------------------------------------------------------------------
// 4. Unstructured Training Documents Ingestor CRUD
// -----------------------------------------------------------------------------
export async function listTrainingDocuments(): Promise<AiTrainingDocument[]> {
  await hydrateTrainingFromNeonIfNeeded();
  return getSyncTrainingSnapshot().trainingDocuments;
}

export async function ingestTrainingDocument(input: {
  title: string;
  sourceFormat: AiTrainingDocument['sourceFormat'];
  locale: Locale;
  pillar: ContentPillar;
  bodyMarkdown: string;
}): Promise<AiTrainingDocument> {
  const now = new Date().toISOString();
  const id = `tdoc-${crypto.randomUUID().slice(0, 12)}`;
  const cleanTitle = input.locale === 'fa' ? normalizePersianText(input.title.trim()) : input.title.trim();
  const cleanBody =
    input.locale === 'fa' ? normalizePersianText(input.bodyMarkdown.trim()) : input.bodyMarkdown.trim();
  const wc = countWords(cleanBody);
  const chunkCount = Math.max(1, Math.ceil(wc / 320));
  const slugBase = cleanTitle
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 48);
  const slug = `${slugBase || 'seminar-note'}-${id.slice(-6)}`;

  const canonical = buildCanonicalString({
    slug,
    locale: input.locale,
    title: cleanTitle,
    body_markdown: cleanBody,
    published_at: now,
  });

  const doc: AiTrainingDocument = {
    id,
    slug,
    title: cleanTitle,
    sourceFormat: input.sourceFormat,
    locale: input.locale,
    pillar: input.pillar,
    bodyMarkdown: cleanBody,
    wordCount: wc,
    chunkCount,
    status: 'indexed',
    contentSha256: computeCanonicalSha256(canonical),
    signatureEd25519: signWithEd25519(canonical),
    createdAt: now,
    updatedAt: now,
  };

  if (isNeonDatabaseConfigured()) {
    await ensureRagTrainingSchema();
    const sql = getNeonSql();
    await sql`
      INSERT INTO ai_training_documents (
        id, slug, title, source_format, locale, pillar, body_markdown,
        word_count, chunk_count, status, content_sha256, signature_ed25519
      )
      VALUES (
        ${doc.id}, ${doc.slug}, ${doc.title}, ${doc.sourceFormat}, ${doc.locale}, ${doc.pillar},
        ${doc.bodyMarkdown}, ${doc.wordCount}, ${doc.chunkCount}, ${doc.status},
        ${doc.contentSha256}, ${doc.signatureEd25519}
      )
    `;
    await hydrateTrainingFromNeonIfNeeded(true);
    notifyTrainingUpdated();
    return doc;
  }

  const local = readOverlayJson<AiTrainingDocument[]>(TRAINING_DOCS_FILE, []);
  writeOverlayJson(TRAINING_DOCS_FILE, [doc, ...local]);
  notifyTrainingUpdated();
  return doc;
}

export async function deleteTrainingDocument(id: string): Promise<boolean> {
  if (isNeonDatabaseConfigured()) {
    await ensureRagTrainingSchema();
    const sql = getNeonSql();
    await sql`UPDATE ai_training_documents SET status = 'archived', updated_at = NOW() WHERE id = ${id}`;
    await hydrateTrainingFromNeonIfNeeded(true);
    notifyTrainingUpdated();
    return true;
  }
  const local = readOverlayJson<AiTrainingDocument[]>(TRAINING_DOCS_FILE, []);
  writeOverlayJson(
    TRAINING_DOCS_FILE,
    local.filter((d) => d.id !== id)
  );
  notifyTrainingUpdated();
  return true;
}

// -----------------------------------------------------------------------------
// 5. Privacy-Preserving Telemetry, Knowledge Gaps & Feedback
// -----------------------------------------------------------------------------
export function computeDailyAnonymousSessionHash(seed: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return crypto.createHash('sha256').update(`${day}|${seed}|makaremi-cnil-anon`).digest('hex').slice(0, 24);
}

export async function recordQueryTelemetry(input: {
  sessionSeed: string;
  locale: Locale;
  pillarFilter?: string;
  rawQuery: string;
  topScore: number;
  citationCount: number;
  engineTier: AiQueryTelemetryRecord['engineTier'];
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
  resolvedGoldenQaId?: string | null;
}): Promise<AiQueryTelemetryRecord> {
  const now = new Date().toISOString();
  const isGap = input.citationCount === 0 || (input.topScore < 0.022 && !input.resolvedGoldenQaId);
  const record: AiQueryTelemetryRecord = {
    id: crypto.randomUUID(),
    sessionHash: computeDailyAnonymousSessionHash(input.sessionSeed),
    locale: input.locale,
    pillarFilter: input.pillarFilter || 'all',
    querySanitized: sanitizePiiFromQuery(input.rawQuery),
    topScore: Number(input.topScore.toFixed(4)),
    citationCount: input.citationCount,
    isKnowledgeGap: isGap,
    engineTier: input.engineTier,
    latencyMs: Math.max(0, Math.round(input.latencyMs)),
    promptTokens: Math.max(0, Math.round(input.promptTokens || 0)),
    completionTokens: Math.max(0, Math.round(input.completionTokens || 0)),
    resolvedGoldenQaId: input.resolvedGoldenQaId || null,
    createdAt: now,
  };

  if (isNeonDatabaseConfigured()) {
    try {
      await ensureRagTrainingSchema();
      const sql = getNeonSql();
      await sql`
        INSERT INTO ai_query_telemetry (
          id, session_hash, locale, pillar_filter, query_sanitized,
          top_score, citation_count, is_knowledge_gap, engine_tier,
          latency_ms, prompt_tokens, completion_tokens, resolved_golden_qa_id
        )
        VALUES (
          ${record.id}, ${record.sessionHash}, ${record.locale}, ${record.pillarFilter}, ${record.querySanitized},
          ${record.topScore}, ${record.citationCount}, ${record.isKnowledgeGap}, ${record.engineTier},
          ${record.latencyMs}, ${record.promptTokens}, ${record.completionTokens}, ${record.resolvedGoldenQaId}
        )
      `;
      return record;
    } catch {
      // fall through to local overlay
    }
  }

  const local = readOverlayJson<AiQueryTelemetryRecord[]>(TELEMETRY_FILE, []);
  writeOverlayJson(TELEMETRY_FILE, [record, ...local].slice(0, 250));
  return record;
}

export async function recordFeedbackEvent(input: {
  telemetryId?: string | null;
  queryPreview?: string;
  locale?: Locale;
  rating: -1 | 1;
  issueCategory?: AiFeedbackEvent['issueCategory'];
  userNote?: string;
}): Promise<AiFeedbackEvent> {
  const now = new Date().toISOString();
  const event: AiFeedbackEvent = {
    id: crypto.randomUUID(),
    telemetryId: input.telemetryId || null,
    queryPreview: input.queryPreview ? sanitizePiiFromQuery(input.queryPreview) : undefined,
    locale: input.locale || 'fa',
    rating: input.rating,
    issueCategory: input.issueCategory,
    userNote: input.userNote ? sanitizePiiFromQuery(input.userNote) : undefined,
    triagedStatus: 'open',
    createdAt: now,
  };

  if (isNeonDatabaseConfigured()) {
    try {
      await ensureRagTrainingSchema();
      const sql = getNeonSql();
      await sql`
        INSERT INTO ai_feedback_events (
          id, telemetry_id, query_preview, locale, rating, issue_category, user_note, triaged_status
        )
        VALUES (
          ${event.id}, ${event.telemetryId}, ${event.queryPreview || null}, ${event.locale || 'fa'},
          ${event.rating}, ${event.issueCategory || null}, ${event.userNote || null}, 'open'
        )
      `;
      return event;
    } catch {
      // fall through
    }
  }

  const local = readOverlayJson<AiFeedbackEvent[]>(FEEDBACK_FILE, []);
  writeOverlayJson(FEEDBACK_FILE, [event, ...local].slice(0, 200));
  return event;
}

export async function updateFeedbackTriageStatus(
  id: string,
  status: AiFeedbackEvent['triagedStatus']
): Promise<boolean> {
  if (isNeonDatabaseConfigured()) {
    await ensureRagTrainingSchema();
    const sql = getNeonSql();
    await sql`UPDATE ai_feedback_events SET triaged_status = ${status} WHERE id = ${id}`;
    return true;
  }
  const local = readOverlayJson<AiFeedbackEvent[]>(FEEDBACK_FILE, []);
  writeOverlayJson(
    FEEDBACK_FILE,
    local.map((f) => (f.id === id ? { ...f, triagedStatus: status } : f))
  );
  return true;
}

export async function getMonthlyTokensUsed(): Promise<number> {
  const monthStart = `${new Date().toISOString().slice(0, 7)}-01T00:00:00.000Z`;
  if (isNeonDatabaseConfigured()) {
    try {
      await ensureRagTrainingSchema();
      const sql = getNeonSql();
      const rows = (await sql`
        SELECT COALESCE(SUM(prompt_tokens + completion_tokens), 0)::bigint AS total
        FROM ai_query_telemetry
        WHERE created_at >= ${monthStart}::timestamptz
      `) as Array<{ total: string | number }>;
      return Number(rows[0]?.total || 0);
    } catch {
      return 0;
    }
  }
  const local = readOverlayJson<AiQueryTelemetryRecord[]>(TELEMETRY_FILE, []);
  return local
    .filter((r) => r.createdAt >= monthStart)
    .reduce((acc, r) => acc + (r.promptTokens || 0) + (r.completionTokens || 0), 0);
}

// -----------------------------------------------------------------------------
// 6. Eval Run Persistence & Unified Telemetry Overview
// -----------------------------------------------------------------------------
export async function saveEvalRunSummary(summary: AiEvalRunSummary): Promise<AiEvalRunSummary> {
  if (isNeonDatabaseConfigured()) {
    try {
      await ensureRagTrainingSchema();
      const sql = getNeonSql();
      await sql`
        INSERT INTO ai_eval_runs (
          id, persona_version_id, engine_profile, total_cases, passed_cases,
          recall_at_5, mrr, citation_faithfulness, refusal_accuracy,
          crisis_safety_rate, white_label_leaks, report_json
        )
        VALUES (
          ${summary.id}, ${summary.personaVersionId}, ${summary.engineProfile},
          ${summary.totalCases}, ${summary.passedCases},
          ${summary.recallAt5}, ${summary.mrr}, ${summary.citationFaithfulness},
          ${summary.refusalAccuracy}, ${summary.crisisSafetyRate},
          ${summary.whiteLabelLeaks}, ${JSON.stringify(summary.cases)}::jsonb
        )
      `;
      return summary;
    } catch {
      // fall through
    }
  }

  const local = readOverlayJson<AiEvalRunSummary[]>(EVAL_RUNS_FILE, []);
  writeOverlayJson(EVAL_RUNS_FILE, [summary, ...local].slice(0, 15));
  return summary;
}

export async function getLatestEvalRun(): Promise<AiEvalRunSummary | null> {
  if (isNeonDatabaseConfigured()) {
    try {
      await ensureRagTrainingSchema();
      const sql = getNeonSql();
      const rows = (await sql`SELECT * FROM ai_eval_runs ORDER BY created_at DESC LIMIT 1`) as Array<
        Record<string, unknown>
      >;
      const r = rows[0];
      if (r) {
        return {
          id: String(r.id),
          personaVersionId: Number(r.persona_version_id),
          engineProfile: String(r.engine_profile),
          totalCases: Number(r.total_cases),
          passedCases: Number(r.passed_cases),
          recallAt5: Number(r.recall_at_5),
          mrr: Number(r.mrr),
          citationFaithfulness: Number(r.citation_faithfulness),
          refusalAccuracy: Number(r.refusal_accuracy),
          crisisSafetyRate: Number(r.crisis_safety_rate),
          whiteLabelLeaks: Number(r.white_label_leaks),
          cases: Array.isArray(r.report_json) ? (r.report_json as AiEvalRunSummary['cases']) : [],
          createdAt: new Date(String(r.created_at)).toISOString(),
        };
      }
    } catch {
      // fall through
    }
  }
  const local = readOverlayJson<AiEvalRunSummary[]>(EVAL_RUNS_FILE, []);
  return local[0] || null;
}

export async function getTrainingTelemetryOverview(): Promise<AiTrainingTelemetryOverview> {
  const persona = await getActivePersonaVersion();
  const [embeddedCount, monthlyTokens, latestEval] = await Promise.all([
    getEmbeddedChunkCount(),
    getMonthlyTokensUsed(),
    getLatestEvalRun(),
  ]);

  if (isNeonDatabaseConfigured()) {
    try {
      await ensureRagTrainingSchema();
      const sql = getNeonSql();
      const [countsRows, gapRows, fbCountRows, fbRows] = await Promise.all([
        sql`
          SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE is_knowledge_gap = TRUE)::int AS gaps
          FROM ai_query_telemetry
        `,
        sql`
          SELECT * FROM ai_query_telemetry
          WHERE is_knowledge_gap = TRUE
          ORDER BY created_at DESC
          LIMIT 25
        `,
        sql`
          SELECT
            COUNT(*) FILTER (WHERE rating = 1)::int AS pos,
            COUNT(*) FILTER (WHERE rating = -1)::int AS neg
          FROM ai_feedback_events
        `,
        sql`
          SELECT * FROM ai_feedback_events
          ORDER BY created_at DESC
          LIMIT 25
        `,
      ]);

      const cRow = (countsRows as Array<{ total: number; gaps: number }>)[0] || { total: 0, gaps: 0 };
      const fRow = (fbCountRows as Array<{ pos: number; neg: number }>)[0] || { pos: 0, neg: 0 };

      return {
        storageMode: 'neon_postgres',
        pgvectorAvailable: isRagPgvectorReady(),
        embeddedChunkCount: embeddedCount,
        totalQueries: Number(cRow.total || 0),
        knowledgeGapCount: Number(cRow.gaps || 0),
        positiveFeedbackCount: Number(fRow.pos || 0),
        negativeFeedbackCount: Number(fRow.neg || 0),
        monthlyTokensUsed: monthlyTokens,
        monthlyTokenBudget: persona.monthlyTokenBudget,
        recentKnowledgeGaps: (gapRows as Array<Record<string, unknown>>).map((r) => ({
          id: String(r.id),
          sessionHash: String(r.session_hash),
          locale: String(r.locale) as Locale,
          pillarFilter: String(r.pillar_filter || 'all'),
          querySanitized: String(r.query_sanitized),
          topScore: Number(r.top_score || 0),
          citationCount: Number(r.citation_count || 0),
          isKnowledgeGap: Boolean(r.is_knowledge_gap),
          engineTier: String(r.engine_tier) as AiQueryTelemetryRecord['engineTier'],
          latencyMs: Number(r.latency_ms || 0),
          promptTokens: Number(r.prompt_tokens || 0),
          completionTokens: Number(r.completion_tokens || 0),
          resolvedGoldenQaId: r.resolved_golden_qa_id ? String(r.resolved_golden_qa_id) : null,
          createdAt: new Date(String(r.created_at)).toISOString(),
        })),
        recentFeedback: (fbRows as Array<Record<string, unknown>>).map((r) => ({
          id: String(r.id),
          telemetryId: r.telemetry_id ? String(r.telemetry_id) : null,
          queryPreview: r.query_preview ? String(r.query_preview) : undefined,
          locale: (r.locale ? String(r.locale) : 'fa') as Locale,
          rating: Number(r.rating) === 1 ? 1 : -1,
          issueCategory: r.issue_category ? (String(r.issue_category) as AiFeedbackEvent['issueCategory']) : undefined,
          userNote: r.user_note ? String(r.user_note) : undefined,
          triagedStatus: String(r.triaged_status || 'open') as AiFeedbackEvent['triagedStatus'],
          createdAt: new Date(String(r.created_at)).toISOString(),
        })),
        latestEvalRun: latestEval,
      };
    } catch {
      // fall through
    }
  }

  const telemetry = readOverlayJson<AiQueryTelemetryRecord[]>(TELEMETRY_FILE, []);
  const feedback = readOverlayJson<AiFeedbackEvent[]>(FEEDBACK_FILE, []);
  return {
    storageMode: getRagStorageMode(),
    pgvectorAvailable: isRagPgvectorReady(),
    embeddedChunkCount: embeddedCount,
    totalQueries: telemetry.length,
    knowledgeGapCount: telemetry.filter((t) => t.isKnowledgeGap).length,
    positiveFeedbackCount: feedback.filter((f) => f.rating === 1).length,
    negativeFeedbackCount: feedback.filter((f) => f.rating === -1).length,
    monthlyTokensUsed: monthlyTokens,
    monthlyTokenBudget: persona.monthlyTokenBudget,
    recentKnowledgeGaps: telemetry.filter((t) => t.isKnowledgeGap).slice(0, 25),
    recentFeedback: feedback.slice(0, 25),
    latestEvalRun: latestEval,
  };
}
