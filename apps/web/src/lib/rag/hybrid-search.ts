import crypto from 'node:crypto';
import type { ContentPillar, Locale } from '@makaremi/shared';
import { normalizePersianText } from '@/lib/etl/persian-normalizer';
import { chunkDocument, type SemanticChunk } from './chunker';
import {
  FALLBACK_ARTICLES,
  FALLBACK_BOOKS,
  FALLBACK_VIDEOS,
  FALLBACK_POEMS,
  FALLBACK_EXHIBITIONS,
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
  'از', 'به', 'در', 'با', 'که', 'این', 'آن', 'برای', 'را', 'است', 'شد', 'شدن', 'کرد', 'کردن', 'یک', 'تا', 'بر', 'او', 'ما', 'شما', 'آنها',
  // French
  'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'en', 'dans', 'pour', 'sur', 'qui', 'que', 'est', 'sont', 'avec', 'par',
  // English
  'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'that', 'this',
]);

export function tokenizeText(text: string): string[] {
  const normalized = normalizePersianText(text.toLowerCase(), { enforceZwnj: false });
  return normalized
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

// -----------------------------------------------------------------------------
// Deterministic 384-Dimensional Concept Vectorizer
// -----------------------------------------------------------------------------
const CONCEPT_DIMENSIONS = 384;

// Key concept anchors for high-fidelity semantic representation
const CONCEPT_ANCHORS: string[] = [
  'روانکاوی', 'لکان', 'فروید', 'ناخودآگاه', 'دگرشنیدن', 'سوژه', 'دال', 'استعاره پدری', 'نام پدر', 'سایکوز', 'روانپریشی', 'رواننژندی',
  'état limite', 'psychanalyse', 'inconscient', 'nom-du-père', 'écoute', 'sujet', 'signifiant', 'psychose', 'névrose',
  'psychoanalysis', 'unconscious', 'lacan', 'freud', 'father', 'listening', 'differently', 'borderline',
  'سرزمین فرهنگی ایران', 'گذار', 'سکولاریسم', 'دموکراسی', 'توسعه', 'شاهنامه', 'حافظ', 'هویت', 'فرهنگ', 'تاریخ',
  'terre culturelle', 'iran', 'transition', 'démocratie', 'laïcité', 'hafez', 'erdowsi',
  'cultural territory', 'secularism', 'democracy', 'transition', 'identity',
  'دادخواهی', 'کشتار ۶۷', 'خاوران', 'حقوق بشر', 'زندان', 'مادران خاوران', 'ایران تریبونال', 'عدالت انتقالی', 'lddhi', 'fidh', 'سوگ سیاسی',
  'justice transitionnelle', 'droits de l homme', 'deuil politique', 'khavaran', 'massacre 1988',
  'transitional justice', 'human rights', 'political mourning', 'tribunal',
  'خوشنویسی', 'خط', 'نقاشی', 'بوم', 'رنگ', 'نمایشگاه', 'مسکو', 'پومپادور', 'هنر معاصر', 'فرم',
  'calligraphie', 'peinture', 'art contemporain', 'moscou', 'exposition',
  'calligraphy', 'painting', 'contemporary art', 'moscow', 'exhibition',
  'cnrs', '۳۹۵۴', '3954', '۳۷۵۵', '3755', 'پژوهش', 'recherche', 'science',
];

export function computeDeterministicConceptVector(text: string): number[] {
  const vector = new Array<number>(CONCEPT_DIMENSIONS).fill(0);
  const tokens = tokenizeText(text);
  if (tokens.length === 0) return vector;

  // 1. Semantic Anchor Projection
  CONCEPT_ANCHORS.forEach((anchor, anchorIdx) => {
    const dimIdx = anchorIdx % CONCEPT_DIMENSIONS;
    const anchorTokens = tokenizeText(anchor);
    let matchCount = 0;

    for (const t of tokens) {
      if (anchorTokens.includes(t) || anchor.includes(t)) {
        matchCount++;
      }
    }

    if (matchCount > 0) {
      vector[dimIdx] += matchCount * 2.0;
    }
  });

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
// Corpus Chunks Builder
// -----------------------------------------------------------------------------
let cachedChunks: SemanticChunk[] | null = null;

export function buildCorpusChunks(): SemanticChunk[] {
  if (cachedChunks) return cachedChunks;

  const allChunks: SemanticChunk[] = [];

  // 1. Articles
  for (const art of FALLBACK_ARTICLES) {
    for (const t of art.translations || []) {
      const loc = (t.languages_code.slice(0, 2)) as Locale;
      const pillarSlug =
        art.pillar === 'psychoanalysis'
          ? (loc === 'fr' ? 'psychanalyse' : 'psychoanalysis')
          : art.pillar === 'art_calligraphy'
          ? 'art'
          : art.pillar === 'cultural_strategy'
          ? 'strategy'
          : 'human-rights';

      const chunks = chunkDocument({
        documentId: art.id,
        documentType: 'article',
        pillar: art.pillar,
        locale: loc,
        title: t.title,
        url: `https://makaremi.com/${loc}/${pillarSlug}/articles/${art.slug}`,
        content: `${t.title}\n\n${t.executive_summary}\n\n${t.body_markdown}`,
      });
      allChunks.push(...chunks);
    }
  }

  // 2. Books
  for (const book of FALLBACK_BOOKS) {
    for (const t of book.translations || []) {
      const loc = (t.languages_code.slice(0, 2)) as Locale;
      const content = `${t.title}\n${t.subtitle || ''}\n\n${t.synopsis}\n\n${t.table_of_contents_markdown || ''}\n\n${t.sample_chapter_markdown || ''}`;
      const chunks = chunkDocument({
        documentId: book.id,
        documentType: 'book',
        pillar: book.pillar,
        locale: loc,
        title: t.title,
        url: `https://makaremi.com/${loc}/books/${book.slug}`,
        content,
      });
      allChunks.push(...chunks);
    }
  }

  // 3. Video Speeches
  for (const sp of FALLBACK_VIDEOS) {
    for (const t of sp.translations || []) {
      const loc = (t.languages_code.slice(0, 2)) as Locale;
      const content = `${t.title}\n\n${t.description}\n\n${t.transcript_markdown || ''}`;
      const chunks = chunkDocument({
        documentId: sp.id,
        documentType: 'speech',
        pillar: sp.pillar,
        locale: loc,
        title: t.title,
        url: `https://makaremi.com/${loc}/speeches/${sp.slug}`,
        content,
      });
      allChunks.push(...chunks);
    }
  }

  // 4. Poems
  for (const p of FALLBACK_POEMS) {
    for (const t of p.translations || []) {
      const loc = (t.languages_code.slice(0, 2)) as Locale;
      const stanzaContent = t.verses?.map((v) => `${v.hemistich_a} / ${v.hemistich_b || ''}`).join('\n') || '';
      const content = `${t.title}\n\n${t.commentary_markdown || ''}\n\n${stanzaContent}`;
      const chunks = chunkDocument({
        documentId: p.id,
        documentType: 'poem',
        pillar: 'art_calligraphy',
        locale: loc,
        title: t.title,
        url: `https://makaremi.com/${loc}/art/poems/${p.slug}`,
        content,
      });
      allChunks.push(...chunks);
    }
  }

  // 5. Exhibitions
  for (const ex of FALLBACK_EXHIBITIONS) {
    for (const t of ex.translations || []) {
      const loc = (t.languages_code.slice(0, 2)) as Locale;
      const content = `${t.title}\n\n${t.curatorial_statement_markdown || ''}\n\nVenue: ${ex.venue_name}, ${ex.venue_city}`;
      const chunks = chunkDocument({
        documentId: ex.id,
        documentType: 'exhibition',
        pillar: 'art_calligraphy',
        locale: loc,
        title: t.title,
        url: `https://makaremi.com/${loc}/exhibitions/${ex.slug}`,
        content,
      });
      allChunks.push(...chunks);
    }
  }

  // 6. Lacanian Glossary
  for (const g of FALLBACK_GLOSSARY) {
    for (const loc of ['fa', 'fr', 'en'] as Locale[]) {
      const title = loc === 'fa' ? g.term_fa : loc === 'fr' ? g.term_fr : g.term_en;
      const def = loc === 'fa' ? g.conceptual_definition_fa : loc === 'fr' ? (g.conceptual_definition_fr || g.conceptual_definition_fa) : (g.conceptual_definition_en || g.conceptual_definition_fa);
      const content = `${title}\n\n${def}\n\nPersian: ${g.term_fa}\nFrench: ${g.term_fr}\nEnglish: ${g.term_en}`;
      const chunks = chunkDocument({
        documentId: g.id,
        documentType: 'glossary',
        pillar: g.pillar,
        locale: loc,
        title,
        url: `https://makaremi.com/${loc}/glossary#${encodeURIComponent(g.id)}`,
        content,
      });
      allChunks.push(...chunks);
    }
  }

  // Precompute vectors for all chunks
  for (const chunk of allChunks) {
    chunk.vector = computeDeterministicConceptVector(chunk.content);
  }

  cachedChunks = allChunks;
  return cachedChunks;
}

// -----------------------------------------------------------------------------
// BM25 Inverted Index & Scoring
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

  // Calculate avgdl & document term frequencies
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

  const avgdl = totalDocLen / N;
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

      // IDF
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      const tf = termCounts.get(qt) || 0;

      // BM25 TF formula
      const numerator = tf * (k1 + 1);
      const denominator = tf + k1 * (1 - b + (b * docLen) / avgdl);
      score += idf * (numerator / denominator);
    }

    // Exact phrase bonus if raw query appears in title or content
    const normalizedContent = normalizePersianText(chunk.content.toLowerCase(), { enforceZwnj: false });
    if (normalizedContent.includes(normalizedRawQuery)) {
      score += 4.0;
    }
    if (normalizePersianText(chunk.title.toLowerCase(), { enforceZwnj: false }).includes(normalizedRawQuery)) {
      score += 6.0;
    }

    scores.set(chunk.id, score);
  }

  return scores;
}

// -----------------------------------------------------------------------------
// Hybrid Search Execution (BM25 + Vector + Reciprocal Rank Fusion)
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
  const allCorpusChunks = buildCorpusChunks();

  // Filter chunks by locale, pillar, and type if specified
  const filteredChunks = allCorpusChunks.filter((chunk) => {
    if (locale && chunk.locale !== locale) return false;
    if (pillar !== 'all' && chunk.pillar !== pillar) return false;
    if (type !== 'all' && chunk.documentType !== type) return false;
    return true;
  });

  if (filteredChunks.length === 0) return [];

  // 1. BM25 Lexical Scoring
  const queryTokens = tokenizeText(rawQuery);
  const bm25ScoreMap = scoreBM25(queryTokens, filteredChunks, rawQuery);

  // Sort by BM25 rank
  const bm25Ranked = [...filteredChunks].sort((a, b) => {
    const sA = bm25ScoreMap.get(a.id) || 0;
    const sB = bm25ScoreMap.get(b.id) || 0;
    return sB - sA;
  });

  // 2. Vector Semantic Scoring
  const queryVector = computeDeterministicConceptVector(rawQuery);
  const vectorScoreMap = new Map<string, number>();

  for (const chunk of filteredChunks) {
    const sim = cosineSimilarity(queryVector, chunk.vector || []);
    vectorScoreMap.set(chunk.id, sim);
  }

  // Sort by Vector rank
  const vectorRanked = [...filteredChunks].sort((a, b) => {
    const sA = vectorScoreMap.get(a.id) || 0;
    const sB = vectorScoreMap.get(b.id) || 0;
    return sB - sA;
  });

  // 3. Reciprocal Rank Fusion (RRF: k = 60)
  const rrfScoreMap = new Map<string, number>();
  const k = 60;

  bm25Ranked.forEach((chunk, rank) => {
    const current = rrfScoreMap.get(chunk.id) || 0;
    rrfScoreMap.set(chunk.id, current + 1.0 / (k + rank + 1));
  });

  vectorRanked.forEach((chunk, rank) => {
    const current = rrfScoreMap.get(chunk.id) || 0;
    rrfScoreMap.set(chunk.id, current + 1.0 / (k + rank + 1));
  });

  // 4. Glossary Boosting (1.5x boost for queries with Lacanian terminology)
  const isGlossaryTermQuery = FALLBACK_GLOSSARY.some((g) => {
    const normalizedQ = rawQuery.toLowerCase();
    return (
      normalizedQ.includes(g.term_fa.toLowerCase()) ||
      normalizedQ.includes(g.term_fr.toLowerCase()) ||
      normalizedQ.includes(g.term_en.toLowerCase())
    );
  });

  // Assemble and sort final items
  const results: SearchResultItem[] = filteredChunks.map((chunk) => {
    let rrf = rrfScoreMap.get(chunk.id) || 0;
    const bm25 = bm25ScoreMap.get(chunk.id) || 0;
    const vector = vectorScoreMap.get(chunk.id) || 0;

    let boosted = false;
    if (isGlossaryTermQuery && (chunk.documentType === 'glossary' || chunk.pillar === 'psychoanalysis')) {
      rrf *= 1.5;
      boosted = true;
    }

    // Extract relevant snippet (~200 chars around first query match)
    const content = chunk.content;
    let snippetStart = 0;
    for (const qt of queryTokens) {
      const idx = content.toLowerCase().indexOf(qt.toLowerCase());
      if (idx !== -1) {
        snippetStart = Math.max(0, idx - 40);
        break;
      }
    }
    const snippet = (snippetStart > 0 ? '...' : '') + content.slice(snippetStart, snippetStart + 220) + '...';

    return {
      id: chunk.id,
      documentId: chunk.documentId,
      documentType: chunk.documentType,
      pillar: chunk.pillar,
      locale: chunk.locale,
      title: chunk.title,
      url: chunk.url,
      snippet: snippet.replace(/\n+/g, ' '),
      content: chunk.content,
      content_sha256: chunk.content_sha256,
      score: rrf,
      bm25Score: bm25,
      vectorScore: vector,
      rrfScore: rrf,
      glossaryBoosted: boosted,
    };
  });

  // Sort descending by score
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
}
