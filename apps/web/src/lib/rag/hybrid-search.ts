import crypto from 'node:crypto';
import type {
  CommerceCatalogItem,
  ContentPillar,
  Locale,
  RagDocumentType,
} from '@makaremi/shared';
import { normalizePersianText } from '@/lib/etl/persian-normalizer';
import { readCommerceJson } from '@/lib/vault-loader';
import {
  chunkDocument,
  chunkTimedTranscript,
  type SemanticChunk,
} from './chunker';
import {
  getLiveCmsCollections,
  registerCmsInvalidationListener,
  FALLBACK_GLOSSARY,
} from '@/lib/cms';
import {
  getSyncTrainingSnapshot,
  hydrateTrainingFromNeonIfNeeded,
  registerTrainingInvalidationListener,
} from './training-store';
import { queryPgvectorSimilarChunks } from './embeddings';

export interface SearchResultItem {
  id: string;
  documentId: string;
  documentType: RagDocumentType;
  pillar: ContentPillar;
  locale: Locale;
  sourceLocale?: Locale;
  isCrossLingual?: boolean;
  isGoldenQa?: boolean;
  title: string;
  url: string;
  relativeUrl: string;
  contextHeader?: string;
  snippet: string;
  content: string;
  content_sha256: string;
  startSec?: number;
  endSec?: number;
  score: number;
  bm25Score: number;
  vectorScore: number;
  rrfScore: number;
  glossaryBoosted: boolean;
  matchedQueryTerms?: number;
  nonGenericTermCount?: number;
  nonGenericCorpusHits?: number;
}

export interface HybridSearchQuery {
  q: string;
  locale?: Locale;
  pillar?: ContentPillar | 'all';
  type?: 'all' | RagDocumentType;
  limit?: number;
  allowCrossLingual?: boolean;
}

// -----------------------------------------------------------------------------
// Tokenizer & Stopwords for BM25 (FA, FR, EN)
// -----------------------------------------------------------------------------
const STOPWORDS = new Set([
  // Persian
  'از', 'به', 'در', 'با', 'که', 'این', 'آن', 'برای', 'را', 'است', 'شد', 'شدن', 'کرد', 'کردن', 'یک', 'تا', 'بر', 'او', 'ما', 'شما', 'آنها', 'هم', 'یا', 'اما', 'ولی', 'اگر', 'چیست', 'چگونه', 'کدام', 'است؟', 'دارد',
  // French
  'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'en', 'dans', 'pour', 'sur', 'qui', 'que', 'est', 'sont', 'avec', 'par', 'aux', 'ce', 'cette', 'quel', 'quelle', 'comment',
  // English
  'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'that', 'this', 'it', 'as', 'what', 'how', 'does', 'do',
]);

export function normalizeForPhraseMatch(text: string): string {
  const normalized = normalizePersianText(text.toLowerCase(), { enforceZwnj: false });
  return normalized
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeText(text: string): string[] {
  return normalizeForPhraseMatch(text)
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

// -----------------------------------------------------------------------------
// Deterministic 384-Dimensional Concept Vectorizer (Zero-Latency Local Baseline)
// -----------------------------------------------------------------------------
const CONCEPT_DIMENSIONS = 384;

const CONCEPT_ANCHORS: string[] = [
  'روانکاوی', 'روانکاوی بالینی', 'لکان', 'فروید', 'ناخودآگاه', 'دگرشنیدن', 'سوژه', 'دال', 'استعاره پدری', 'نام پدر', 'سایکوز', 'روانپریشی', 'رواننژندی', 'فورکلوژن', 'تورس', 'گره بورومه‌ای', 'آسیب‌شناسی ازهم‌گسستگی', 'در روانپژوهی', 'نگاه روانکاو', 'دولتو', 'ژرار پومیه', 'اضطراب', 'مرگ', 'خودکشی',
  'état limite', 'psychanalyse', 'inconscient', 'nom-du-père', 'écoute', 'sujet', 'signifiant', 'psychose', 'névrose', 'forclusion', 'tore', 'nœud borroméen', 'dolto', 'pommier', 'angoisse', 'mort',
  'psychoanalysis', 'unconscious', 'lacan', 'freud', 'father', 'listening', 'differently', 'borderline', 'foreclosure', 'torus', 'borromean', 'anxiety', 'death',
  'سرزمین فرهنگی ایران', 'گذار', 'گذار دموکراتیک', 'سکولاریسم', 'دموکراسی', 'توسعه', 'شاهنامه', 'حافظ', 'حافظ‌پژوهی', 'صدای سخن عشق', 'هویت', 'فرهنگ', 'تاریخ', 'رنگین‌کمان', 'مطلوب ممکن', 'نوکیسه', 'خودی غیرخودی', 'رندی', 'تساهل',
  'terre culturelle', 'iran', 'transition', 'démocratie', 'laïcité', 'hafez', 'ferdowsi', 'arc-en-ciel', 'tolérance',
  'cultural territory', 'cultural realm', 'secularism', 'democracy', 'transition', 'identity', 'hafez', 'ferdowsi', 'tolerance',
  'دادخواهی', 'کشتار ۶۷', 'خاوران', 'حقوق بشر', 'زندان', 'مادران خاوران', 'ایران تریبونال', 'عدالت انتقالی', 'lddhi', 'fidh', 'سوگ سیاسی', 'اعدام', 'جایگاه زنان', 'ما و ما',
  'justice transitionnelle', 'droits de l homme', 'deuil politique', 'khavaran', 'massacre 1988', 'peine de mort', 'femmes',
  'transitional justice', 'human rights', 'political mourning', 'tribunal', 'death penalty', 'women', 'dadkhahi',
  'خوشنویسی', 'خط', 'نقاشی', 'بوم', 'رنگ', 'نمایشگاه', 'مسکو', 'پومپادور', 'یونسکو', 'هنر معاصر', 'فرم', 'نستعلیق', 'جای پای زمان', 'فروشگاه', 'گواهی اصالت', 'دکره مارکوس',
  'calligraphie', 'peinture', 'art contemporain', 'moscou', 'exposition', 'unesco', 'décret marcus', 'certificat', 'atelier',
  'calligraphy', 'painting', 'contemporary art', 'moscow', 'exhibition', 'unesco', 'authenticity', 'certificate', 'shop',
  'cnrs', '۳۹۵۴', '3954', '۳۷۵۵', '3755', 'پژوهش', 'recherche', 'science', 'بیوگرافی', 'سوربن', 'biographie', 'biography', 'sorbonne',
];

const PRECOMPUTED_ANCHOR_TOKENS = CONCEPT_ANCHORS.map((a) => ({
  raw: a,
  tokens: new Set(tokenizeText(a)),
}));

export function computeDeterministicConceptVector(text: string, preTokenized?: string[]): number[] {
  const vector = new Array<number>(CONCEPT_DIMENSIONS).fill(0);
  const tokens = preTokenized || tokenizeText(text);
  if (tokens.length === 0) return vector;

  for (let anchorIdx = 0; anchorIdx < PRECOMPUTED_ANCHOR_TOKENS.length; anchorIdx++) {
    const dimIdx = anchorIdx % CONCEPT_DIMENSIONS;
    const anchor = PRECOMPUTED_ANCHOR_TOKENS[anchorIdx];
    let matchCount = 0;
    for (const t of tokens) {
      if (anchor.tokens.has(t) || anchor.raw.includes(t)) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      vector[dimIdx] += matchCount * 2.0;
    }
  }

  for (const token of tokens) {
    const hash = crypto.createHash('md5').update(token).digest('hex');
    const idx1 = parseInt(hash.slice(0, 4), 16) % CONCEPT_DIMENSIONS;
    const idx2 = parseInt(hash.slice(4, 8), 16) % CONCEPT_DIMENSIONS;
    const sign = parseInt(hash.slice(8, 9), 16) % 2 === 0 ? 1 : -1;
    vector[idx1] += sign * 0.5;
    vector[idx2] += -sign * 0.5;
  }

  let norm = 0;
  for (let i = 0; i < CONCEPT_DIMENSIONS; i++) norm += vector[i] * vector[i];
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < CONCEPT_DIMENSIONS; i++) vector[i] /= norm;
  }
  return vector;
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

// -----------------------------------------------------------------------------
// Precomputed Inverted BM25 + Concept Graph Corpus Index (All 11 Sources!)
// -----------------------------------------------------------------------------
interface PrecomputedCorpusIndex {
  chunks: SemanticChunk[];
  chunkIdToIndex: Map<string, number>;
  docLens: number[];
  avgdl: number;
  postings: Map<string, Array<{ idx: number; tf: number }>>;
  normalizedTitles: string[];
  normalizedContents: string[];
}

let cachedIndex: PrecomputedCorpusIndex | null = null;

export function invalidateRagIndexCache(): void {
  cachedIndex = null;
}

registerCmsInvalidationListener(invalidateRagIndexCache);
registerTrainingInvalidationListener(invalidateRagIndexCache);

function inferPagePillar(group: string): ContentPillar {
  if (group === 'references') return 'human_rights_dadkhahi';
  if (group === 'conferences') return 'psychoanalysis';
  if (group === 'publications') return 'art_calligraphy';
  return 'cultural_strategy';
}

function buildPrecomputedCorpusIndex(): PrecomputedCorpusIndex {
  if (cachedIndex) return cachedIndex;

  const { articles, books, videos, poems, exhibitions, artworks, pages, glossary } =
    getLiveCmsCollections();
  const training = getSyncTrainingSnapshot();
  const allChunks: SemanticChunk[] = [];

  // 1. Articles (404+)
  for (const art of articles) {
    for (const t of art.translations || []) {
      const loc = t.languages_code.slice(0, 2) as Locale;
      const pillarSlug =
        art.pillar === 'psychoanalysis'
          ? loc === 'fr'
            ? 'psychanalyse'
            : 'psychoanalysis'
          : art.pillar === 'art_calligraphy'
            ? 'art'
            : art.pillar === 'cultural_strategy'
              ? 'strategy'
              : 'human-rights';
      const rel = `/${loc}/${pillarSlug}/articles/${art.slug}`;

      allChunks.push(
        ...chunkDocument({
          documentId: art.id,
          documentType: 'article',
          pillar: art.pillar,
          locale: loc,
          title: t.title,
          url: `https://makaremi.com${rel}`,
          relativeUrl: rel,
          contextHeader: `[مقاله پژوهشی | ${art.pillar} | ${loc.toUpperCase()}]`,
          content: `${t.title}\n\n${t.executive_summary}\n\n${t.body_markdown}`,
        })
      );
    }
  }

  // 2. Books (25)
  for (const book of books) {
    for (const t of book.translations || []) {
      const loc = t.languages_code.slice(0, 2) as Locale;
      const rel = `/${loc}/books/${book.slug}`;
      const content = `${t.title}\n${t.subtitle || ''}\n\n${t.synopsis}\n\n${t.table_of_contents_markdown || ''}\n\n${t.sample_chapter_markdown || ''}`;
      allChunks.push(
        ...chunkDocument({
          documentId: book.id,
          documentType: 'book',
          pillar: book.pillar,
          locale: loc,
          title: t.title,
          url: `https://makaremi.com${rel}`,
          relativeUrl: rel,
          contextHeader: `[کتاب | ${book.publication_year || ''} | ${loc.toUpperCase()}]`,
          content,
        })
      );
    }
  }

  // 3. Video Speeches (Deduplicated + Timed ?t=sec Deep-Links)
  const seenYoutubeIds = new Set<string>();
  for (const sp of videos) {
    if (sp.slug === '5668') continue;
    const ytId = sp.youtube_video_id?.trim();
    if (ytId) {
      if (sp.canonical_video_slug && sp.canonical_video_slug !== sp.slug) {
        continue;
      }
      if (seenYoutubeIds.has(ytId)) continue;
      seenYoutubeIds.add(ytId);
    }

    const speechPath =
      sp.pillar === 'human_rights_dadkhahi'
        ? `human-rights/speeches/${sp.slug}`
        : `media/videos/${sp.slug}`;

    for (const t of sp.translations || []) {
      const loc = t.languages_code.slice(0, 2) as Locale;
      const rel = `/${loc}/${speechPath}`;
      const hasTimed =
        Boolean(sp.transcript_segments?.length) ||
        /\[\d{1,2}:\d{2}/.test(t.transcript_markdown || '');
      const ctxHeader = `[سخنرانی ویدیویی | ${sp.pillar} | ${sp.series_slug || 'general'} | ${loc.toUpperCase()}]`;

      if (hasTimed && t.transcript_markdown) {
        allChunks.push(
          ...chunkTimedTranscript({
            documentId: sp.id,
            pillar: sp.pillar,
            locale: loc,
            title: t.title,
            baseUrl: `https://makaremi.com${rel}`,
            relativeBaseUrl: rel,
            contextHeader: ctxHeader,
            youtubeVideoId: ytId || undefined,
            seriesTitle: sp.series_slug || undefined,
            description: t.description,
            transcriptMarkdown: t.transcript_markdown,
            segments: sp.transcript_segments,
          })
        );
      } else {
        const content = `${t.title}\n\n${t.description || ''}\n\n${t.transcript_markdown || ''}`;
        allChunks.push(
          ...chunkDocument({
            documentId: sp.id,
            documentType: 'speech',
            pillar: sp.pillar,
            locale: loc,
            title: t.title,
            url: `https://makaremi.com${rel}`,
            relativeUrl: rel,
            contextHeader: ctxHeader,
            content,
            youtubeVideoId: ytId || undefined,
            seriesTitle: sp.series_slug || undefined,
          })
        );
      }
    }
  }

  // 4. Poems (300)
  for (const p of poems) {
    for (const t of p.translations || []) {
      const loc = t.languages_code.slice(0, 2) as Locale;
      const rel = `/${loc}/poetry/poems/${p.slug}`;
      const stanzaContent =
        t.verses?.map((v) => `${v.hemistich_a} / ${v.hemistich_b || ''}`).join('\n') || '';
      const content = `${t.title}\n\n${t.commentary_markdown || ''}\n\n${stanzaContent}`;
      allChunks.push(
        ...chunkDocument({
          documentId: p.id,
          documentType: 'poem',
          pillar: 'art_calligraphy',
          locale: loc,
          title: t.title,
          url: `https://makaremi.com${rel}`,
          relativeUrl: rel,
          contextHeader: `[شعر | ${loc.toUpperCase()}]`,
          content,
        })
      );
    }
  }

  // 5. Exhibitions (27)
  for (const ex of exhibitions) {
    for (const t of ex.translations || []) {
      const loc = t.languages_code.slice(0, 2) as Locale;
      const rel = `/${loc}/art/exhibitions/${ex.slug}`;
      const content = `${t.title}\n\n${t.curatorial_statement_markdown || ''}\n\nVenue: ${ex.venue_name}, ${ex.venue_city}`;
      allChunks.push(
        ...chunkDocument({
          documentId: ex.id,
          documentType: 'exhibition',
          pillar: 'art_calligraphy',
          locale: loc,
          title: t.title,
          url: `https://makaremi.com${rel}`,
          relativeUrl: rel,
          contextHeader: `[نمایشگاه هنری | ${ex.venue_city || ''} | ${loc.toUpperCase()}]`,
          content,
        })
      );
    }
  }

  // 6. Archival Reference Pages (25 pages / ~71,709 words: Biography, Sorbonne/CNRS CV, Interviews, References)
  for (const pg of pages) {
    const pillar = inferPagePillar(pg.group);
    for (const t of pg.translations || []) {
      const loc = t.languages_code.slice(0, 2) as Locale;
      const rel = `/${loc}/about/${pg.slug}`;
      const content = `${t.title}\n\n${t.excerpt || ''}\n\n${t.body_markdown || ''}`;
      allChunks.push(
        ...chunkDocument({
          documentId: pg.id,
          documentType: 'page',
          pillar,
          locale: loc,
          title: t.title,
          url: `https://makaremi.com${rel}`,
          relativeUrl: rel,
          contextHeader: `[صفحه مرجع | ${pg.group} | ${loc.toUpperCase()}]`,
          content,
        })
      );
    }
  }

  // 7. Artworks & Calligraphy Series (29 series / 856 museum plates)
  for (const aw of artworks) {
    const plateCount = aw.gallery_images?.length || 1;
    const plateCaptions = (aw.gallery_images || [])
      .slice(0, 12)
      .map((img) => img.title || img.alt || '')
      .filter(Boolean)
      .join(' · ');
    for (const t of aw.translations || []) {
      const loc = t.languages_code.slice(0, 2) as Locale;
      const rel = `/${loc}/gallery`;
      const metaSummary =
        loc === 'fa'
          ? `مجموعه خوشنویسی و نقاشی معاصر (${aw.artform}) — سال ${aw.year || ''}، تکنیک: ${aw.medium || ''}، ابعاد: ${aw.dimensions || 'مجموعه‌ای'}، شامل ${plateCount} پلیت هنری.`
          : loc === 'fr'
            ? `Série de calligraphie contemporaine (${aw.artform}) — ${aw.year || ''}, technique : ${aw.medium || ''}, dimensions : ${aw.dimensions || 'série'}, ${plateCount} planches.`
            : `Contemporary calligraphy series (${aw.artform}) — ${aw.year || ''}, medium: ${aw.medium || ''}, dimensions: ${aw.dimensions || 'series'}, ${plateCount} museum plates.`;
      const content = `${t.title}\n\n${metaSummary}\n\n${t.description_markdown || ''}\n\n${t.curator_critique_markdown || ''}\n\n${plateCaptions}`;
      allChunks.push(
        ...chunkDocument({
          documentId: aw.id,
          documentType: 'artwork',
          pillar: 'art_calligraphy',
          locale: loc,
          title: t.title,
          url: `https://makaremi.com${rel}`,
          relativeUrl: rel,
          contextHeader: `[اثر هنری / خوشنویسی | ${aw.year || ''} | ${plateCount} پلیت]`,
          content,
        })
      );
    }
  }

  // 8. Official Paris Atelier & Editions Commerce Catalog (18 authenticated SKUs)
  const commerceCatalog = readCommerceJson<CommerceCatalogItem[]>('catalog.json', []);
  for (const sku of commerceCatalog) {
    if (sku.availability === 'not_for_sale') continue;
    const priceEur =
      typeof sku.priceEurCents === 'number'
        ? (sku.priceEurCents / 100).toLocaleString('en-US')
        : null;
    const dimensions = sku.physicalSpecs?.dimensionsCm || null;
    for (const loc of ['fa', 'fr', 'en'] as Locale[]) {
      const title = sku.title?.[loc] || sku.title?.fa || sku.sku;
      const desc = sku.description?.[loc] || sku.subtitle?.[loc] || '';
      const rel = `/${loc}/shop`;
      const details =
        loc === 'fa'
          ? `کد اثر: ${sku.sku} | نوع: ${sku.kind} | قیمت رسمی آتلیه پاریس: ${priceEur ? `${priceEur} یورو` : 'استعلامی'} | ابعاد: ${dimensions || 'استاندارد'} | وضعیت: ${sku.availability} | اصالت: گواهی Décret Marcus با امضای رمزنگاری Ed25519.`
          : loc === 'fr'
            ? `Référence : ${sku.sku} | Catégorie : ${sku.kind} | Tarif officiel Atelier Paris : ${priceEur ? `${priceEur} €` : 'Sur demande'} | Dimensions : ${dimensions || 'standard'} | Certificat d'authenticité Décret Marcus signé Ed25519.`
            : `SKU: ${sku.sku} | Category: ${sku.kind} | Official Paris Atelier price: ${priceEur ? `€${priceEur}` : 'On inquiry'} | Dimensions: ${dimensions || 'standard'} | Décret Marcus Certificate of Authenticity signed via Ed25519.`;
      allChunks.push(
        ...chunkDocument({
          documentId: `commerce_${sku.sku}`,
          documentType: 'commerce',
          pillar: 'art_calligraphy',
          locale: loc,
          title,
          url: `https://makaremi.com${rel}`,
          relativeUrl: rel,
          contextHeader: `[فروشگاه و آتلیه رسمی پاریس | ${sku.sku}]`,
          content: `${title}\n\n${details}\n\n${desc}`,
        })
      );
    }
  }

  // 9. Living Trilingual Glossary (66+ terms + aliases)
  const activeGlossary = glossary.length > 0 ? glossary : FALLBACK_GLOSSARY;
  for (const g of activeGlossary) {
    const aliasesText = Array.isArray(g.aliases) && g.aliases.length > 0 ? `\nAliases: ${g.aliases.join(', ')}` : '';
    for (const loc of ['fa', 'fr', 'en'] as Locale[]) {
      const title = loc === 'fa' ? g.term_fa : loc === 'fr' ? g.term_fr : g.term_en;
      const def =
        loc === 'fa'
          ? g.conceptual_definition_fa
          : loc === 'fr'
            ? g.conceptual_definition_fr || g.conceptual_definition_fa
            : g.conceptual_definition_en || g.conceptual_definition_fa;
      const rel = `/${loc}/glossary#${encodeURIComponent(g.id)}`;
      const content = `${title}\n\n${def}\n\nPersian: ${g.term_fa}\nFrench: ${g.term_fr}\nEnglish: ${g.term_en}${aliasesText}`;
      allChunks.push(
        ...chunkDocument({
          documentId: g.id,
          documentType: 'glossary',
          pillar: g.pillar,
          locale: loc,
          title,
          url: `https://makaremi.com${rel}`,
          relativeUrl: rel,
          contextHeader: `[واژه‌نامه تخصصی | ${g.pillar}]`,
          content,
        })
      );
    }
  }

  // 10. Professor's Verified Golden Q&A Bank (Priority-boosted & Ed25519-signed!)
  for (const gqa of training.goldenQa) {
    if (gqa.status !== 'published') continue;
    const primaryLink = gqa.linkedUrls[0] || `/${gqa.locale}/assistant`;
    const rel = primaryLink.startsWith('/') ? primaryLink : `/${gqa.locale}/assistant`;
    const variantsText = gqa.questionVariants.length > 0 ? `\n\nپرسش‌های هم‌معنی: ${gqa.questionVariants.join(' | ')}` : '';
    allChunks.push(
      ...chunkDocument({
        documentId: `golden_qa_${gqa.id}`,
        documentType: 'golden_qa',
        pillar: gqa.pillar,
        locale: gqa.locale,
        title: gqa.questionCanonical,
        url: `https://makaremi.com${rel}`,
        relativeUrl: rel,
        contextHeader: `[پاسخ طلایی مصوب استاد | ${gqa.pillar}]`,
        content: `${gqa.questionCanonical}${variantsText}\n\n${gqa.answerMarkdown}`,
        priorityBoost: gqa.priorityBoost,
      })
    );
  }

  // 11. Professor's Uploaded Training Documents (Seminars, PDFs, DOCX, Notes)
  for (const doc of training.trainingDocuments) {
    if (doc.status !== 'indexed') continue;
    const rel = `/${doc.locale}/assistant`;
    allChunks.push(
      ...chunkDocument({
        documentId: `training_doc_${doc.id}`,
        documentType: 'training_note',
        pillar: doc.pillar,
        locale: doc.locale,
        title: doc.title,
        url: `https://makaremi.com${rel}`,
        relativeUrl: rel,
        contextHeader: `[سند آموزشی پیشخوان | ${doc.sourceFormat} | ${doc.pillar}]`,
        content: `${doc.title}\n\n${doc.bodyMarkdown}`,
        priorityBoost: 1.25,
      })
    );
  }

  // Precompute Inverted BM25 Postings + Normalized Strings + Concept Vectors ONCE
  const postings = new Map<string, Array<{ idx: number; tf: number }>>();
  const chunkIdToIndex = new Map<string, number>();
  const docLens: number[] = new Array(allChunks.length);
  const normalizedTitles: string[] = new Array(allChunks.length);
  const normalizedContents: string[] = new Array(allChunks.length);
  let totalLen = 0;

  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i];
    chunkIdToIndex.set(chunk.id, i);
    const normTitle = normalizeForPhraseMatch(chunk.title);
    const normContent = normalizeForPhraseMatch(chunk.content);
    normalizedTitles[i] = normTitle;
    normalizedContents[i] = normContent;

    const tokens = normContent
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOPWORDS.has(w));

    docLens[i] = tokens.length;
    totalLen += tokens.length;
    chunk.vector = computeDeterministicConceptVector(chunk.content, tokens);

    const tfMap = new Map<string, number>();
    for (const t of tokens) {
      tfMap.set(t, (tfMap.get(t) || 0) + 1);
    }
    for (const [term, tf] of tfMap.entries()) {
      let list = postings.get(term);
      if (!list) {
        list = [];
        postings.set(term, list);
      }
      list.push({ idx: i, tf });
    }
  }

  cachedIndex = {
    chunks: allChunks,
    chunkIdToIndex,
    docLens,
    avgdl: allChunks.length > 0 ? totalLen / allChunks.length : 1,
    postings,
    normalizedTitles,
    normalizedContents,
  };

  return cachedIndex;
}

export function buildCorpusChunks(): SemanticChunk[] {
  return buildPrecomputedCorpusIndex().chunks;
}

// -----------------------------------------------------------------------------
// Cross-Lingual Concept Graph Query Expansion (FA <-> FR <-> EN + 1-hop Edges)
// -----------------------------------------------------------------------------
function expandQueryViaConceptGraph(rawQuery: string): {
  matchedGlossary: boolean;
  matchedPillar: ContentPillar | null;
  expansionTokens: string[];
  matchedTermIds: string[];
} {
  const normQ = normalizeForPhraseMatch(rawQuery);
  const snap = getSyncTrainingSnapshot();
  const terms = snap.glossaryTerms;
  const edges = snap.conceptEdges;

  const matchedIds = new Set<string>();
  const expansionTokens = new Set<string>();
  let matchedPillar: ContentPillar | null = null;

  const BIO_INTENT_RE = /(?:بیوگرافی|زندگی[\u200c\s]?نامه|شرح\s+حال|کارنامه|سوربن|biographie|biography|sorbonne|parcours)/i;

  for (const term of terms) {
    // Do not treat generic author mentions ("دکتر مکارمی") as a glossary match unless biography is asked
    if (term.id === 'g6000000-0000-0000-0000-000000000062' && !BIO_INTENT_RE.test(rawQuery)) {
      continue;
    }
    const forms = [term.term_fa, term.term_fr, term.term_en, ...(term.aliases || [])]
      .map((f) => normalizeForPhraseMatch(f))
      .filter((f) => f.length >= 3);

    const hit = forms.some((f) => normQ.includes(f));
    if (hit) {
      matchedIds.add(term.id);
      if (!matchedPillar) matchedPillar = term.pillar;
      // Add cross-lingual canonical equivalents into expansion token set
      for (const eq of [term.term_fa, term.term_fr, term.term_en]) {
        for (const tok of tokenizeText(eq)) expansionTokens.add(tok);
      }
    }
  }

  // 1-hop semantic graph expansion (gentle weighting during BM25 scoring)
  if (matchedIds.size > 0) {
    const termById = new Map(terms.map((t) => [t.id, t]));
    for (const edge of edges) {
      let neighborId: string | null = null;
      if (matchedIds.has(edge.sourceTermId)) neighborId = edge.targetTermId;
      else if (matchedIds.has(edge.targetTermId)) neighborId = edge.sourceTermId;
      if (!neighborId || matchedIds.has(neighborId)) continue;
      const neighbor = termById.get(neighborId);
      if (neighbor) {
        for (const tok of tokenizeText(neighbor.term_fa)) expansionTokens.add(tok);
      }
    }
  }

  return {
    matchedGlossary: matchedIds.size > 0,
    matchedPillar,
    expansionTokens: Array.from(expansionTokens).slice(0, 16),
    matchedTermIds: Array.from(matchedIds),
  };
}

// -----------------------------------------------------------------------------
// BM25 Standalone Scorer (kept for direct unit tests & compatibility)
// -----------------------------------------------------------------------------
export function scoreBM25(
  queryTokens: string[],
  chunks: SemanticChunk[],
  rawQuery: string
): Map<string, number> {
  const scores = new Map<string, number>();
  const k1 = 1.2;
  const b = 0.75;
  const N = chunks.length;

  if (N === 0 || queryTokens.length === 0) return scores;

  let totalDocLen = 0;
  const docTokensMap = new Map<string, string[]>();
  const docFrequencies = new Map<string, number>();

  for (const chunk of chunks) {
    const tokens = tokenizeText(chunk.content);
    docTokensMap.set(chunk.id, tokens);
    totalDocLen += tokens.length;

    const uniqueTokens = new Set(tokens);
    for (const t of uniqueTokens) {
      docFrequencies.set(t, (docFrequencies.get(t) || 0) + 1);
    }
  }

  const avgdl = totalDocLen / N || 1;
  const normalizedRawQuery = normalizeForPhraseMatch(rawQuery);

  for (const chunk of chunks) {
    const tokens = docTokensMap.get(chunk.id) || [];
    const docLen = tokens.length;
    let score = 0;

    const termCounts = new Map<string, number>();
    for (const t of tokens) {
      termCounts.set(t, (termCounts.get(t) || 0) + 1);
    }

    for (const qt of queryTokens) {
      const df = docFrequencies.get(qt) || 0;
      if (df === 0) continue;
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      const tf = termCounts.get(qt) || 0;
      score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * docLen) / avgdl)));
    }

    const normalizedContent = normalizeForPhraseMatch(chunk.content);
    if (normalizedContent.includes(normalizedRawQuery)) score += 4.0;
    if (normalizeForPhraseMatch(chunk.title).includes(normalizedRawQuery)) {
      score += 6.0;
    }

    scores.set(chunk.id, score);
  }

  return scores;
}

// -----------------------------------------------------------------------------
// 4-Way Hybrid Search Execution (Golden QA + BM25 + Concept Graph + pgvector)
// -----------------------------------------------------------------------------
export async function executeHybridSearch(
  query: HybridSearchQuery
): Promise<SearchResultItem[]> {
  const {
    q,
    locale,
    pillar = 'all',
    type = 'all',
    limit = 10,
    allowCrossLingual = true,
  } = query;

  if (!q || !q.trim()) return [];

  await hydrateTrainingFromNeonIfNeeded();

  const rawQuery = q.trim();
  const index = buildPrecomputedCorpusIndex();
  const { chunks, chunkIdToIndex, docLens, avgdl, postings, normalizedTitles, normalizedContents } = index;

  // Build eligible index mask (supports cross-lingual retrieval when enabled!)
  const eligibleIndices: number[] = [];
  const eligibleSet = new Set<number>();
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    if (locale && !allowCrossLingual && c.locale !== locale) continue;
    if (pillar !== 'all' && c.pillar !== pillar) continue;
    if (type !== 'all' && c.documentType !== type) continue;
    eligibleIndices.push(i);
    eligibleSet.add(i);
  }

  if (eligibleIndices.length === 0) return [];

  // Concept Graph & Cross-Lingual Expansion
  const graphExpansion = expandQueryViaConceptGraph(rawQuery);
  const queryTokens = tokenizeText(rawQuery);
  const uniqueQueryTokens = Array.from(new Set(queryTokens));
  const expansionOnlyTokens = graphExpansion.expansionTokens.filter((t) => !uniqueQueryTokens.includes(t));

  // 1. O(query_terms * postings) Inverted BM25 Lexical Scoring + Cross-Lingual Expansion
  const normalizedRawQuery = normalizeForPhraseMatch(rawQuery);
  const bm25Scores = new Map<number, number>();
  const k1 = 1.2;
  const b = 0.55;
  const N = eligibleIndices.length;

  const scoreTermList = (terms: string[], weight: number) => {
    for (const qt of terms) {
      const list = postings.get(qt);
      if (!list) continue;
      let df = 0;
      for (const p of list) {
        if (eligibleSet.has(p.idx)) df++;
      }
      if (df === 0) continue;

      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      for (const p of list) {
        if (!eligibleSet.has(p.idx)) continue;
        // Length floor prevents tiny 15-word glossary cards from unfairly dominating 300-word lectures
        const docLen = Math.max(docLens[p.idx], 45);
        const delta = weight * idf * ((p.tf * (k1 + 1)) / (p.tf + k1 * (1 - b + (b * docLen) / avgdl)));
        bm25Scores.set(p.idx, (bm25Scores.get(p.idx) || 0) + delta);
      }
    }
  };

  // Compute corpus-level coverage of non-generic content terms for Zero-Hallucination refusal accuracy
  const GENERIC_QUERY_TERMS = new Set([
    'دکتر', 'حسن', 'مکارمی', 'آقای', 'استاد', 'آیا', 'کتاب', 'کتابی', 'مقاله', 'مقاله‌ای', 'سخنرانی', 'سال', 'نام', 'نوشته', 'گفته', 'توضیح', 'معرفی', 'درباره', 'مورد', 'چند', 'چقدر', 'کدام', 'می‌گوید', 'میگوید',
    'dr', 'hassan', 'makaremi', 'selon', 'livre', 'article', 'année', 'quel', 'quelle', 'quelles', 'quels', 'dans', 'sur', 'les', 'des', 'une', 'est', 'sont', 'dit', 'parle', 'recette',
    'doctor', 'book', 'wrote', 'written', 'year', 'about', 'tell', 'explain', 'define', 'provide', 'exact', 'what', 'which', 'where', 'when', 'does', 'say', 'recipe', 'score',
  ]);
  const nonGenericTokens = uniqueQueryTokens.filter((t) => !GENERIC_QUERY_TERMS.has(t) && t.length >= 2);
  let nonGenericCorpusHits = 0;
  for (const t of nonGenericTokens) {
    const list = postings.get(t);
    if (list && list.some((p) => eligibleSet.has(p.idx))) {
      nonGenericCorpusHits++;
    }
  }

  scoreTermList(uniqueQueryTokens, 1.0);
  if (expansionOnlyTokens.length > 0 && graphExpansion.matchedTermIds.length <= 2) {
    scoreTermList(expansionOnlyTokens, 0.34);
  }

  // Exact phrase & title coverage bonuses (punctuation/ZWNJ-insensitive, length-neutral)
  if (normalizedRawQuery.length >= 2) {
    for (const idx of eligibleIndices) {
      let bonus = 0;
      const normTitle = normalizedTitles[idx];
      const normContent = normalizedContents[idx];
      if (normTitle.includes(normalizedRawQuery)) bonus += 8.0;
      if (normContent.includes(normalizedRawQuery)) bonus += 6.5;

      if (uniqueQueryTokens.length >= 2 && normTitle.length > 0) {
        let titleHits = 0;
        for (const qt of uniqueQueryTokens) {
          if (normTitle.includes(qt)) titleHits++;
        }
        const coverage = titleHits / uniqueQueryTokens.length;
        if (coverage >= 0.6) {
          bonus += 4.5 * coverage;
        }
      }

      if (bonus > 0) {
        bm25Scores.set(idx, (bm25Scores.get(idx) || 0) + bonus);
      }
    }
  }

  // 2. Local Concept Vector Scoring + Optional Neon pgvector HNSW Blending
  const queryVector = computeDeterministicConceptVector(rawQuery, [...uniqueQueryTokens, ...expansionOnlyTokens]);
  const vectorScores = new Map<number, number>();
  for (const idx of eligibleIndices) {
    vectorScores.set(idx, cosineSimilarity(queryVector, chunks[idx].vector || []));
  }

  const pgvCandidates = await queryPgvectorSimilarChunks({
    query: rawQuery,
    pillar,
    type,
    limit: 40,
  });

  // Only rank candidates with genuine lexical or semantic signal
  const bm25Candidates = eligibleIndices.filter((idx) => (bm25Scores.get(idx) || 0) > 0);
  const bm25Ranked = bm25Candidates.sort(
    (a, bIdx) => (bm25Scores.get(bIdx) || 0) - (bm25Scores.get(a) || 0)
  );
  const vectorCandidates = eligibleIndices.filter((idx) => (vectorScores.get(idx) || 0) > 0.05);
  const vectorRanked = vectorCandidates.sort(
    (a, bIdx) => (vectorScores.get(bIdx) || 0) - (vectorScores.get(a) || 0)
  );

  // 3. Weighted Reciprocal Rank Fusion (BM25 + Local Concept Vector + Neon pgvector)
  const rrfMap = new Map<number, number>();
  const rrfK = 60;
  const bm25Cap = Math.min(bm25Ranked.length, Math.max(150, limit * 12));
  const vecCap = Math.min(vectorRanked.length, Math.max(120, limit * 10));
  const maxBm25 = bm25Ranked.length > 0 ? bm25Scores.get(bm25Ranked[0]) || 1 : 1;

  for (let rank = 0; rank < bm25Cap; rank++) {
    const idxB = bm25Ranked[rank];
    const bm25Val = bm25Scores.get(idxB) || 0;
    const magnitudeBoost = 0.018 * (bm25Val / maxBm25);
    rrfMap.set(idxB, (rrfMap.get(idxB) || 0) + 1.65 / (rrfK + rank + 1) + magnitudeBoost);
  }
  for (let rank = 0; rank < vecCap; rank++) {
    const idxV = vectorRanked[rank];
    rrfMap.set(idxV, (rrfMap.get(idxV) || 0) + 0.75 / (rrfK + rank + 1));
  }
  if (pgvCandidates.length > 0) {
    pgvCandidates.forEach((cand, rank) => {
      const idx = chunkIdToIndex.get(cand.chunkId);
      if (idx !== undefined && eligibleSet.has(idx)) {
        vectorScores.set(idx, Math.max(vectorScores.get(idx) || 0, cand.similarity));
        rrfMap.set(idx, (rrfMap.get(idx) || 0) + 1.4 / (rrfK + rank + 1));
      }
    });
  }

  // 4. Glossary Boosting, Locale Affinity & Professor Golden Q&A Priority
  const isGlossaryTermQuery =
    graphExpansion.matchedGlossary ||
    FALLBACK_GLOSSARY.some((g) => {
      const normalizedQ = rawQuery.toLowerCase();
      return (
        normalizedQ.includes(g.term_fa.toLowerCase()) ||
        normalizedQ.includes(g.term_fr.toLowerCase()) ||
        normalizedQ.includes(g.term_en.toLowerCase())
      );
    });

  const results: SearchResultItem[] = [];
  for (const [idx, baseRrf] of rrfMap.entries()) {
    const chunk = chunks[idx];
    let rrf = baseRrf;
    let boosted = false;

    if (
      isGlossaryTermQuery &&
      (chunk.documentType === 'glossary' ||
        chunk.pillar === 'psychoanalysis' ||
        (graphExpansion.matchedPillar && chunk.pillar === graphExpansion.matchedPillar))
    ) {
      rrf *= 1.5;
      boosted = true;
    }

    // Same-locale affinity so primary locale leads while cross-lingual speeches stay discoverable
    if (locale) {
      if (chunk.locale === locale) {
        rrf *= 1.28;
      } else if ((bm25Scores.get(idx) || 0) <= 0) {
        // Require lexical/expansion/pgvector hit before surfacing a cross-lingual chunk
        continue;
      }
    }

    // Professor-approved Golden Q&A priority boost (only when lexically matched!)
    if (chunk.priorityBoost && chunk.priorityBoost > 1 && (bm25Scores.get(idx) || 0) > 2.5) {
      rrf *= Math.min(2.2, chunk.priorityBoost);
    }

    const content = chunk.content;
    let snippetStart = 0;
    const lowerContent = content.toLowerCase();
    const informativeTokens = [...uniqueQueryTokens].sort((a, bLen) => bLen.length - a.length);
    for (const qt of informativeTokens) {
      const pos = lowerContent.indexOf(qt.toLowerCase());
      if (pos !== -1) {
        snippetStart = Math.max(0, pos - 50);
        break;
      }
    }
    const snippet =
      (snippetStart > 0 ? '...' : '') +
      content.slice(snippetStart, snippetStart + 240).replace(/\n+/g, ' ') +
      (snippetStart + 240 < content.length ? '...' : '');

    let matchedQueryTerms = 0;
    const normDocText = normalizedContents[idx];
    for (const t of nonGenericTokens) {
      if (normDocText.includes(t)) matchedQueryTerms++;
    }

    results.push({
      id: chunk.id,
      documentId: chunk.documentId,
      documentType: chunk.documentType,
      pillar: chunk.pillar,
      locale: chunk.locale,
      sourceLocale: chunk.locale,
      isCrossLingual: Boolean(locale && chunk.locale !== locale),
      isGoldenQa: chunk.documentType === 'golden_qa',
      title: chunk.title,
      url: chunk.url,
      relativeUrl: chunk.relativeUrl,
      contextHeader: chunk.contextHeader,
      snippet,
      content: chunk.content,
      content_sha256: chunk.content_sha256,
      startSec: chunk.startSec,
      endSec: chunk.endSec,
      score: rrf,
      bm25Score: bm25Scores.get(idx) || 0,
      vectorScore: vectorScores.get(idx) || 0,
      rrfScore: rrf,
      glossaryBoosted: boosted,
      matchedQueryTerms,
      nonGenericTermCount: nonGenericTokens.length,
      nonGenericCorpusHits,
    });
  }

  results.sort((a, bIdx) => bIdx.score - a.score);

  // Per-document & balanced document-type diversity cap in top-K
  const diversified: SearchResultItem[] = [];
  const perDocCount = new Map<string, number>();
  const perTypeCount = new Map<string, number>();
  const enforceTypeBalance = type === 'all' && limit <= 8;

  for (const item of results) {
    const docCnt = perDocCount.get(item.documentId) || 0;
    if (docCnt >= 2) continue;

    if (enforceTypeBalance) {
      const tCnt = perTypeCount.get(item.documentType) || 0;
      if (item.documentType === 'glossary' && tCnt >= 1) continue;
      if (item.documentType === 'article' && tCnt >= 3) continue;
    }

    perDocCount.set(item.documentId, docCnt + 1);
    perTypeCount.set(item.documentType, (perTypeCount.get(item.documentType) || 0) + 1);
    diversified.push(item);
    if (diversified.length >= limit) break;
  }

  // Backfill if strict type balance left fewer than limit
  if (diversified.length < limit) {
    const pickedIds = new Set(diversified.map((d) => d.id));
    for (const item of results) {
      if (pickedIds.has(item.id)) continue;
      const docCnt = perDocCount.get(item.documentId) || 0;
      if (docCnt >= 2) continue;
      perDocCount.set(item.documentId, docCnt + 1);
      diversified.push(item);
      if (diversified.length >= limit) break;
    }
  }

  return diversified.length > 0 ? diversified : results.slice(0, limit);
}
