import crypto from 'node:crypto';
import type { ContentPillar, Locale } from '@makaremi/shared';
import { normalizePersianText } from '@/lib/etl/persian-normalizer';
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

export interface SearchResultItem {
  id: string;
  documentId: string;
  documentType: string;
  pillar: ContentPillar;
  locale: Locale;
  title: string;
  url: string;
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
}

export interface HybridSearchQuery {
  q: string;
  locale?: Locale;
  pillar?: ContentPillar | 'all';
  type?: 'all' | 'book' | 'article' | 'speech' | 'poem' | 'exhibition' | 'glossary';
  limit?: number;
}

// -----------------------------------------------------------------------------
// Tokenizer & Stopwords for BM25 (FA, FR, EN)
// -----------------------------------------------------------------------------
const STOPWORDS = new Set([
  // Persian
  'از', 'به', 'در', 'با', 'که', 'این', 'آن', 'برای', 'را', 'است', 'شد', 'شدن', 'کرد', 'کردن', 'یک', 'تا', 'بر', 'او', 'ما', 'شما', 'آنها', 'هم', 'یا', 'اما', 'ولی', 'اگر',
  // French
  'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'en', 'dans', 'pour', 'sur', 'qui', 'que', 'est', 'sont', 'avec', 'par', 'aux', 'ce', 'cette',
  // English
  'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'that', 'this', 'it', 'as',
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
// Deterministic 384-Dimensional Concept Vectorizer
// -----------------------------------------------------------------------------
const CONCEPT_DIMENSIONS = 384;

const CONCEPT_ANCHORS: string[] = [
  'روانکاوی', 'روانکاوی بالینی', 'لکان', 'فروید', 'ناخودآگاه', 'دگرشنیدن', 'سوژه', 'دال', 'استعاره پدری', 'نام پدر', 'سایکوز', 'روانپریشی', 'رواننژندی', 'فورکلوژن', 'تورس', 'گره بورومه‌ای', 'آسیب‌شناسی ازهم‌گسستگی', 'در روانپژوهی', 'نگاه روانکاو',
  'état limite', 'psychanalyse', 'inconscient', 'nom-du-père', 'écoute', 'sujet', 'signifiant', 'psychose', 'névrose', 'forclusion', 'tore', 'nœud borroméen',
  'psychoanalysis', 'unconscious', 'lacan', 'freud', 'father', 'listening', 'differently', 'borderline', 'foreclosure', 'torus',
  'سرزمین فرهنگی ایران', 'گذار', 'گذار دموکراتیک', 'سکولاریسم', 'دموکراسی', 'توسعه', 'شاهنامه', 'حافظ', 'حافظ‌پژوهی', 'صدای سخن عشق', 'هویت', 'فرهنگ', 'تاریخ', 'رنگین‌کمان',
  'terre culturelle', 'iran', 'transition', 'démocratie', 'laïcité', 'hafez', 'ferdowsi', 'arc-en-ciel',
  'cultural territory', 'secularism', 'democracy', 'transition', 'identity', 'hafez',
  'دادخواهی', 'کشتار ۶۷', 'خاوران', 'حقوق بشر', 'زندان', 'مادران خاوران', 'ایران تریبونال', 'عدالت انتقالی', 'lddhi', 'fidh', 'سوگ سیاسی', 'اعدام',
  'justice transitionnelle', 'droits de l homme', 'deuil politique', 'khavaran', 'massacre 1988',
  'transitional justice', 'human rights', 'political mourning', 'tribunal',
  'خوشنویسی', 'خط', 'نقاشی', 'بوم', 'رنگ', 'نمایشگاه', 'مسکو', 'پومپادور', 'یونسکو', 'هنر معاصر', 'فرم', 'نستعلیق',
  'calligraphie', 'peinture', 'art contemporain', 'moscou', 'exposition', 'unesco',
  'calligraphy', 'painting', 'contemporary art', 'moscow', 'exhibition', 'unesco',
  'cnrs', '۳۹۵۴', '3954', '۳۷۵۵', '3755', 'پژوهش', 'recherche', 'science',
];

const PRECOMPUTED_ANCHOR_TOKENS = CONCEPT_ANCHORS.map((a) => ({
  raw: a,
  tokens: new Set(tokenizeText(a)),
}));

export function computeDeterministicConceptVector(text: string, preTokenized?: string[]): number[] {
  const vector = new Array<number>(CONCEPT_DIMENSIONS).fill(0);
  const tokens = preTokenized || tokenizeText(text);
  if (tokens.length === 0) return vector;

  // 1. Semantic Anchor Projection
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

  // 2. Hash-based semantic distributed projection for arbitrary terms
  for (const token of tokens) {
    const hash = crypto.createHash('md5').update(token).digest('hex');
    const idx1 = parseInt(hash.slice(0, 4), 16) % CONCEPT_DIMENSIONS;
    const idx2 = parseInt(hash.slice(4, 8), 16) % CONCEPT_DIMENSIONS;
    const sign = parseInt(hash.slice(8, 9), 16) % 2 === 0 ? 1 : -1;

    vector[idx1] += sign * 0.5;
    vector[idx2] += -sign * 0.5;
  }

  // 3. L2 Normalization
  let norm = 0;
  for (let i = 0; i < CONCEPT_DIMENSIONS; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < CONCEPT_DIMENSIONS; i++) {
      vector[i] /= norm;
    }
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
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

// -----------------------------------------------------------------------------
// Precomputed Inverted BM25 + Vector Corpus Index (Sub-30ms Retrieval!)
// -----------------------------------------------------------------------------
interface PrecomputedCorpusIndex {
  chunks: SemanticChunk[];
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

function buildPrecomputedCorpusIndex(): PrecomputedCorpusIndex {
  if (cachedIndex) return cachedIndex;

  const { articles, books, videos, poems, exhibitions, glossary } = getLiveCmsCollections();
  const allChunks: SemanticChunk[] = [];

  // 1. Articles
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

      allChunks.push(
        ...chunkDocument({
          documentId: art.id,
          documentType: 'article',
          pillar: art.pillar,
          locale: loc,
          title: t.title,
          url: `https://makaremi.com/${loc}/${pillarSlug}/articles/${art.slug}`,
          content: `${t.title}\n\n${t.executive_summary}\n\n${t.body_markdown}`,
        })
      );
    }
  }

  // 2. Books
  for (const book of books) {
    for (const t of book.translations || []) {
      const loc = t.languages_code.slice(0, 2) as Locale;
      const content = `${t.title}\n${t.subtitle || ''}\n\n${t.synopsis}\n\n${t.table_of_contents_markdown || ''}\n\n${t.sample_chapter_markdown || ''}`;
      allChunks.push(
        ...chunkDocument({
          documentId: book.id,
          documentType: 'book',
          pillar: book.pillar,
          locale: loc,
          title: t.title,
          url: `https://makaremi.com/${loc}/books/${book.slug}`,
          content,
        })
      );
    }
  }

  // 3. Video Speeches (Deduplicated by youtube_video_id + Timed Chunking with ?t=sec!)
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
      const hasTimed =
        Boolean(sp.transcript_segments?.length) ||
        /\[\d{1,2}:\d{2}/.test(t.transcript_markdown || '');

      if (hasTimed && t.transcript_markdown) {
        allChunks.push(
          ...chunkTimedTranscript({
            documentId: sp.id,
            pillar: sp.pillar,
            locale: loc,
            title: t.title,
            baseUrl: `https://makaremi.com/${loc}/${speechPath}`,
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
            url: `https://makaremi.com/${loc}/${speechPath}`,
            content,
            youtubeVideoId: ytId || undefined,
            seriesTitle: sp.series_slug || undefined,
          })
        );
      }
    }
  }

  // 4. Poems
  for (const p of poems) {
    for (const t of p.translations || []) {
      const loc = t.languages_code.slice(0, 2) as Locale;
      const stanzaContent = t.verses?.map((v) => `${v.hemistich_a} / ${v.hemistich_b || ''}`).join('\n') || '';
      const content = `${t.title}\n\n${t.commentary_markdown || ''}\n\n${stanzaContent}`;
      allChunks.push(
        ...chunkDocument({
          documentId: p.id,
          documentType: 'poem',
          pillar: 'art_calligraphy',
          locale: loc,
          title: t.title,
          url: `https://makaremi.com/${loc}/poetry/poems/${p.slug}`,
          content,
        })
      );
    }
  }

  // 5. Exhibitions
  for (const ex of exhibitions) {
    for (const t of ex.translations || []) {
      const loc = t.languages_code.slice(0, 2) as Locale;
      const content = `${t.title}\n\n${t.curatorial_statement_markdown || ''}\n\nVenue: ${ex.venue_name}, ${ex.venue_city}`;
      allChunks.push(
        ...chunkDocument({
          documentId: ex.id,
          documentType: 'exhibition',
          pillar: 'art_calligraphy',
          locale: loc,
          title: t.title,
          url: `https://makaremi.com/${loc}/art/exhibitions/${ex.slug}`,
          content,
        })
      );
    }
  }

  // 6. Lacanian Glossary
  for (const g of glossary) {
    for (const loc of ['fa', 'fr', 'en'] as Locale[]) {
      const title = loc === 'fa' ? g.term_fa : loc === 'fr' ? g.term_fr : g.term_en;
      const def =
        loc === 'fa'
          ? g.conceptual_definition_fa
          : loc === 'fr'
            ? g.conceptual_definition_fr || g.conceptual_definition_fa
            : g.conceptual_definition_en || g.conceptual_definition_fa;
      const content = `${title}\n\n${def}\n\nPersian: ${g.term_fa}\nFrench: ${g.term_fr}\nEnglish: ${g.term_en}`;
      allChunks.push(
        ...chunkDocument({
          documentId: g.id,
          documentType: 'glossary',
          pillar: g.pillar,
          locale: loc,
          title,
          url: `https://makaremi.com/${loc}/glossary#${encodeURIComponent(g.id)}`,
          content,
        })
      );
    }
  }

  // Precompute Inverted BM25 Postings + Normalized Strings + Concept Vectors ONCE
  const postings = new Map<string, Array<{ idx: number; tf: number }>>();
  const docLens: number[] = new Array(allChunks.length);
  const normalizedTitles: string[] = new Array(allChunks.length);
  const normalizedContents: string[] = new Array(allChunks.length);
  let totalLen = 0;

  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i];
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
// BM25 Standalone Scorer (kept for direct tests & compatibility)
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
  const normalizedRawQuery = normalizePersianText(rawQuery.toLowerCase(), { enforceZwnj: false });

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

    const normalizedContent = normalizePersianText(chunk.content.toLowerCase(), { enforceZwnj: false });
    if (normalizedContent.includes(normalizedRawQuery)) score += 4.0;
    if (normalizePersianText(chunk.title.toLowerCase(), { enforceZwnj: false }).includes(normalizedRawQuery)) {
      score += 6.0;
    }

    scores.set(chunk.id, score);
  }

  return scores;
}

// -----------------------------------------------------------------------------
// Fast Precomputed Hybrid Search Execution (Inverted BM25 + Vector + RRF)
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
  } = query;

  if (!q || !q.trim()) return [];

  const rawQuery = q.trim();
  const index = buildPrecomputedCorpusIndex();
  const { chunks, docLens, avgdl, postings, normalizedTitles, normalizedContents } = index;

  // Build eligible index mask once
  const eligibleIndices: number[] = [];
  const eligibleSet = new Set<number>();
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    if (locale && c.locale !== locale) continue;
    if (pillar !== 'all' && c.pillar !== pillar) continue;
    if (type !== 'all' && c.documentType !== type) continue;
    eligibleIndices.push(i);
    eligibleSet.add(i);
  }

  if (eligibleIndices.length === 0) return [];

  // 1. O(query_terms * postings) Inverted BM25 Lexical Scoring
  const queryTokens = tokenizeText(rawQuery);
  const normalizedRawQuery = normalizeForPhraseMatch(rawQuery);
  const bm25Scores = new Map<number, number>();
  const k1 = 1.2;
  const b = 0.55;
  const N = eligibleIndices.length;

  const uniqueQueryTokens = Array.from(new Set(queryTokens));
  for (const qt of uniqueQueryTokens) {
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
      const docLen = docLens[p.idx];
      const delta = idf * ((p.tf * (k1 + 1)) / (p.tf + k1 * (1 - b + (b * docLen) / avgdl)));
      bm25Scores.set(p.idx, (bm25Scores.get(p.idx) || 0) + delta);
    }
  }

  // Exact phrase & title coverage bonuses (punctuation/ZWNJ-insensitive, length-neutral)
  if (normalizedRawQuery.length >= 2) {
    for (const idx of eligibleIndices) {
      let bonus = 0;
      const normTitle = normalizedTitles[idx];
      const normContent = normalizedContents[idx];
      if (normTitle.includes(normalizedRawQuery)) bonus += 8.0;
      if (normContent.includes(normalizedRawQuery)) bonus += 6.5;

      // Length-neutral title token coverage bonus so rich 350-word lecture transcripts
      // matching a title are not outranked by short 40-word article stubs
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

  // 2. Vector Semantic Scoring
  const queryVector = computeDeterministicConceptVector(rawQuery, queryTokens);
  const vectorScores = new Map<number, number>();
  for (const idx of eligibleIndices) {
    vectorScores.set(idx, cosineSimilarity(queryVector, chunks[idx].vector || []));
  }

  // Only rank candidates with genuine lexical or semantic signal
  const bm25Candidates = eligibleIndices.filter((idx) => (bm25Scores.get(idx) || 0) > 0);
  const bm25Ranked = bm25Candidates.sort(
    (a, bIdx) => (bm25Scores.get(bIdx) || 0) - (bm25Scores.get(a) || 0)
  );
  const vectorCandidates = eligibleIndices.filter((idx) => (vectorScores.get(idx) || 0) > 0.05);
  const vectorRanked = vectorCandidates.sort(
    (a, bIdx) => (vectorScores.get(bIdx) || 0) - (vectorScores.get(a) || 0)
  );

  // 3. Weighted Reciprocal Rank Fusion (BM25 precision + Concept Vector + Normalized BM25 Margin)
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

  // 4. Glossary Boosting (1.5x boost for queries with Lacanian terminology)
  const isGlossaryTermQuery = FALLBACK_GLOSSARY.some((g) => {
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
    if (isGlossaryTermQuery && (chunk.documentType === 'glossary' || chunk.pillar === 'psychoanalysis')) {
      rrf *= 1.5;
      boosted = true;
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

    results.push({
      id: chunk.id,
      documentId: chunk.documentId,
      documentType: chunk.documentType,
      pillar: chunk.pillar,
      locale: chunk.locale,
      title: chunk.title,
      url: chunk.url,
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
    });
  }

  results.sort((a, bIdx) => bIdx.score - a.score);

  // Per-document diversity cap (max 2 chunks per source document in primary top-K)
  const diversified: SearchResultItem[] = [];
  const perDocCount = new Map<string, number>();
  for (const item of results) {
    const count = perDocCount.get(item.documentId) || 0;
    if (count >= 2) continue;
    perDocCount.set(item.documentId, count + 1);
    diversified.push(item);
    if (diversified.length >= limit) break;
  }

  return diversified.length > 0 ? diversified : results.slice(0, limit);
}
