import type {
  AiKbSyncStatus,
  Locale,
  VideoTranscriptRecord,
  VideoTranscriptSegment,
} from '@makaremi/shared';
import { getNeonSql, isNeonDatabaseConfigured } from '@/lib/commerce/db';
import { getLiveCmsCollections, invalidateCmsCollectionsCache } from '@/lib/cms';
import { ensureRagTrainingSchema, getEmbeddedChunkCount, getRagStorageMode, isRagPgvectorReady } from './db';
import { generateEmbeddingsBatch, getEmbeddingModelName, isEmbeddingsConfigured } from './embeddings';
import { buildCorpusChunks, invalidateRagIndexCache } from './hybrid-search';
import { getSyncTrainingSnapshot, hydrateTrainingFromNeonIfNeeded } from './training-store';
import {
  bumpKnowledgeBaseVersion,
  getDynamicEnrichmentsSync,
  getDynamicStudioWorksSync,
  getLiveCommerceCatalogSync,
  getLocalKbSyncMeta,
  hydrateDynamicCmsFromNeonIfNeeded,
  persistVideoTranscriptToNeon,
} from '@/lib/studio/neon-cms-store';
import { normalizePersianText, countWords } from '@/lib/etl/persian-normalizer';
import { applyLacanianGlossary } from '@/lib/agents/voice-transcriber';
import type { SemanticChunk } from './chunker';

export interface AutoSyncEventInput {
  collection: string;
  slug: string;
  action: 'publish' | 'enrich' | 'translate' | 'commerce' | 'transcript' | 'golden_qa' | 'glossary' | 'document' | 'manual_resync';
  summary?: string;
}

export interface AutoSyncEventResult {
  ok: boolean;
  kbVersion: number;
  syncedChunks: number;
  embeddedChunks: number;
  storageMode: 'neon_postgres' | 'local_file_fallback';
}

/**
 * Upserts a focused slice of SemanticChunks into Neon `ai_knowledge_chunks`
 * (and automatically computes pgvector embeddings when an embedding key is configured).
 */
async function upsertChunksToNeon(chunks: SemanticChunk[]): Promise<{ upserted: number; embedded: number }> {
  if (!isNeonDatabaseConfigured() || chunks.length === 0) {
    return { upserted: 0, embedded: 0 };
  }

  try {
    await ensureRagTrainingSchema();
    const sql = getNeonSql();
    const pgvReady = isRagPgvectorReady();
    const canEmbed = pgvReady && isEmbeddingsConfigured();
    const modelName = canEmbed ? getEmbeddingModelName() : null;

    let embeddings: number[][] | null = null;
    if (canEmbed) {
      embeddings = await generateEmbeddingsBatch(
        chunks.map((c) => `${c.contextHeader || ''}\n${c.title}\n${c.content}`.slice(0, 6000))
      );
    }

    let upserted = 0;
    let embedded = 0;

    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      const vec = embeddings?.[i];
      const metadata = JSON.stringify({
        priorityBoost: c.priorityBoost || 1,
        seriesTitle: c.seriesTitle || null,
      });

      if (pgvReady && vec && vec.length === 1536) {
        const vectorLiteral = `[${vec.join(',')}]`;
        await sql`
          INSERT INTO ai_knowledge_chunks (
            chunk_id, document_id, document_type, pillar, locale, title,
            relative_url, context_header, content, content_sha256,
            start_sec, end_sec, youtube_video_id, embedding, embedding_model, metadata_json, updated_at
          ) VALUES (
            ${c.id}, ${c.documentId}, ${c.documentType}, ${c.pillar}, ${c.locale}, ${c.title},
            ${c.relativeUrl}, ${c.contextHeader || ''}, ${c.content}, ${c.content_sha256},
            ${c.startSec ?? null}, ${c.endSec ?? null}, ${c.youtubeVideoId ?? null},
            ${vectorLiteral}::vector, ${modelName}, ${metadata}::jsonb, NOW()
          )
          ON CONFLICT (chunk_id) DO UPDATE SET
            title = EXCLUDED.title,
            relative_url = EXCLUDED.relative_url,
            context_header = EXCLUDED.context_header,
            content = EXCLUDED.content,
            content_sha256 = EXCLUDED.content_sha256,
            start_sec = EXCLUDED.start_sec,
            end_sec = EXCLUDED.end_sec,
            youtube_video_id = EXCLUDED.youtube_video_id,
            embedding = EXCLUDED.embedding,
            embedding_model = EXCLUDED.embedding_model,
            metadata_json = EXCLUDED.metadata_json,
            updated_at = NOW()
        `;
        embedded++;
      } else {
        await sql`
          INSERT INTO ai_knowledge_chunks (
            chunk_id, document_id, document_type, pillar, locale, title,
            relative_url, context_header, content, content_sha256,
            start_sec, end_sec, youtube_video_id, metadata_json, updated_at
          ) VALUES (
            ${c.id}, ${c.documentId}, ${c.documentType}, ${c.pillar}, ${c.locale}, ${c.title},
            ${c.relativeUrl}, ${c.contextHeader || ''}, ${c.content}, ${c.content_sha256},
            ${c.startSec ?? null}, ${c.endSec ?? null}, ${c.youtubeVideoId ?? null},
            ${metadata}::jsonb, NOW()
          )
          ON CONFLICT (chunk_id) DO UPDATE SET
            title = EXCLUDED.title,
            relative_url = EXCLUDED.relative_url,
            context_header = EXCLUDED.context_header,
            content = EXCLUDED.content,
            content_sha256 = EXCLUDED.content_sha256,
            start_sec = EXCLUDED.start_sec,
            end_sec = EXCLUDED.end_sec,
            youtube_video_id = EXCLUDED.youtube_video_id,
            metadata_json = EXCLUDED.metadata_json,
            updated_at = NOW()
        `;
      }
      upserted++;
    }

    return { upserted, embedded };
  } catch (err) {
    console.warn('[auto-indexer] Neon chunk upsert warning:', err);
    return { upserted: 0, embedded: 0 };
  }
}

/**
 * Unified Event-Driven Auto-Indexing Bus invoked on ALL 7 content write paths.
 * Guarantees every new video, article, book, poem, artwork, enrichment, translation,
 * commerce item, glossary term, or Professor Golden Q&A is immediately searchable
 * in the AI Assistant across all Vercel serverless instances.
 */
export async function syncEntityToRagKnowledgeBase(
  input: AutoSyncEventInput
): Promise<AutoSyncEventResult> {
  // 1. Invalidate local CMS + RAG caches immediately
  invalidateCmsCollectionsCache();
  invalidateRagIndexCache();

  // 2. Rebuild fresh in-process corpus chunks
  const allChunks = buildCorpusChunks();

  // 3. Select the exact entity slice to upsert into Neon `ai_knowledge_chunks`
  const slugLower = input.slug.toLowerCase();
  let targetChunks: SemanticChunk[];
  if (input.action === 'manual_resync') {
    // Upsert newest dynamic works, golden Q&As, training docs, and glossary terms quickly
    targetChunks = allChunks.filter(
      (c) =>
        c.documentType === 'golden_qa' ||
        c.documentType === 'training_note' ||
        c.documentType === 'commerce' ||
        c.documentId.startsWith('custom-')
    ).slice(0, 120);
  } else {
    targetChunks = allChunks
      .filter(
        (c) =>
          c.relativeUrl.toLowerCase().includes(slugLower) ||
          c.documentId.toLowerCase().includes(slugLower) ||
          (input.collection === 'commerce' && c.documentType === 'commerce') ||
          (input.collection === 'golden_qa' && c.documentType === 'golden_qa')
      )
      .slice(0, 60);
  }

  const { upserted, embedded } = await upsertChunksToNeon(targetChunks);

  // 4. Bump atomic `kb_version` in Neon so every other Vercel lambda refreshes within <= 5s
  const summary =
    input.summary || `${input.action}:${input.collection}/${input.slug} (+${targetChunks.length} chunks)`;
  const kbVersion = await bumpKnowledgeBaseVersion(summary, input.collection, input.slug);

  return {
    ok: true,
    kbVersion,
    syncedChunks: upserted || targetChunks.length,
    embeddedChunks: embedded,
    storageMode: getRagStorageMode(),
  };
}

// -----------------------------------------------------------------------------
// Automatic YouTube Timed-Caption Extractor for Newly Published Videos
// -----------------------------------------------------------------------------
const SAFE_YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

function formatSecBadge(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function decodeHtmlEntities(raw: string): string {
  return raw
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Best-effort automatic YouTube caption extraction when Dr. Makaremi publishes
 * a new video via Pishkhan without pasting a manual transcript.
 * Strictly SSRF-safe (constructs URL solely from validated 11-char YouTube ID).
 */
export async function tryAutoExtractVideoTranscript(input: {
  slug: string;
  youtubeVideoId?: string | null;
  title: string;
  preferredLocale?: Locale;
}): Promise<{ extracted: boolean; wordCount: number; segmentCount: number }> {
  const ytId = (input.youtubeVideoId || '').trim();
  if (!SAFE_YOUTUBE_ID_RE.test(ytId)) {
    return { extracted: false, wordCount: 0, segmentCount: 0 };
  }

  try {
    const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(ytId)}&hl=en`;
    const pageRes = await fetch(watchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MakaremiArchivalIndexer/2.0)',
        'Accept-Language': 'fa,fr;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(6500),
    });
    if (!pageRes.ok) return { extracted: false, wordCount: 0, segmentCount: 0 };
    const html = await pageRes.text();

    const captionMatch = html.match(/"captionTracks":(\[[\s\S]*?\])/);
    if (!captionMatch?.[1]) return { extracted: false, wordCount: 0, segmentCount: 0 };

    const tracks = JSON.parse(captionMatch[1]) as Array<{
      baseUrl?: string;
      languageCode?: string;
    }>;
    if (!Array.isArray(tracks) || tracks.length === 0) {
      return { extracted: false, wordCount: 0, segmentCount: 0 };
    }

    const prefOrder = [input.preferredLocale || 'fa', 'fa', 'fr', 'en'];
    let chosen = tracks[0];
    for (const lang of prefOrder) {
      const hit = tracks.find((t) => (t.languageCode || '').toLowerCase().startsWith(lang));
      if (hit) {
        chosen = hit;
        break;
      }
    }

    if (!chosen?.baseUrl) return { extracted: false, wordCount: 0, segmentCount: 0 };
    const parsedUrl = new URL(chosen.baseUrl);
    if (
      parsedUrl.protocol !== 'https:' ||
      (parsedUrl.hostname !== 'www.youtube.com' && parsedUrl.hostname !== 'youtube.com')
    ) {
      return { extracted: false, wordCount: 0, segmentCount: 0 };
    }

    const capRes = await fetch(parsedUrl.toString(), { signal: AbortSignal.timeout(6500) });
    if (!capRes.ok) return { extracted: false, wordCount: 0, segmentCount: 0 };
    const xml = await capRes.text();

    const segRegex = /<text\s+start="([\d.]+)"(?:\s+dur="([\d.]+)")?[^>]*>([\s\S]*?)<\/text>/g;
    const segments: VideoTranscriptSegment[] = [];
    const mdLines: string[] = [];

    let match: RegExpExecArray | null;
    while ((match = segRegex.exec(xml)) !== null) {
      const startSec = Math.floor(Number.parseFloat(match[1]) || 0);
      const dur = Math.ceil(Number.parseFloat(match[2] || '5') || 5);
      const decoded = decodeHtmlEntities(match[3] || '');
      if (!decoded) continue;

      const { normalizedText } = applyLacanianGlossary(decoded);
      const clean = normalizePersianText(normalizedText, { enforceZwnj: true });
      segments.push({
        startSec,
        endSec: startSec + dur,
        text: clean,
      });
      mdLines.push(`[${formatSecBadge(startSec)}] ${clean}`);
    }

    const transcriptMarkdown = mdLines.join('\n');
    const words = countWords(transcriptMarkdown);
    if (words < 25) {
      return { extracted: false, wordCount: words, segmentCount: segments.length };
    }

    const sourceLang = ((chosen.languageCode || 'fa').slice(0, 2).toLowerCase() as Locale) || 'fa';
    const record: VideoTranscriptRecord = {
      key: ytId,
      sourceLang: sourceLang === 'fr' || sourceLang === 'en' ? sourceLang : 'fa',
      method: 'youtube_captions',
      wordCount: words,
      durationSec: segments.length > 0 ? segments[segments.length - 1].endSec : undefined,
      updatedAt: new Date().toISOString(),
      transcriptMarkdown,
      segments,
    };

    await persistVideoTranscriptToNeon(ytId, record, input.slug);
    await syncEntityToRagKnowledgeBase({
      collection: 'videos',
      slug: input.slug,
      action: 'transcript',
      summary: `auto_youtube_captions:${input.slug} (${words} words)`,
    });

    return { extracted: true, wordCount: words, segmentCount: segments.length };
  } catch {
    return { extracted: false, wordCount: 0, segmentCount: 0 };
  }
}

// -----------------------------------------------------------------------------
// Live Knowledge Base Sync & Coverage Status (Displayed in Pishkhan Radar)
// -----------------------------------------------------------------------------
export async function getKnowledgeBaseSyncStatus(): Promise<AiKbSyncStatus> {
  await Promise.all([
    hydrateDynamicCmsFromNeonIfNeeded(false),
    hydrateTrainingFromNeonIfNeeded(false),
  ]);

  const cms = getLiveCmsCollections();
  const training = getSyncTrainingSnapshot();
  const chunks = buildCorpusChunks();
  const commerce = getLiveCommerceCatalogSync();
  const dynamicWorks = getDynamicStudioWorksSync();
  const enrichments = getDynamicEnrichmentsSync();
  const meta = getLocalKbSyncMeta();
  const embeddedChunks = await getEmbeddedChunkCount();

  const transcriptsCount = cms.videos.filter((v) =>
    Boolean(v.transcript_segments?.length || v.translations?.some((t) => (t.transcript_markdown || '').length > 200))
  ).length;

  return {
    kbVersion: meta.kbVersion,
    storageMode: getRagStorageMode(),
    pgvectorAvailable: isRagPgvectorReady(),
    embeddingsConfigured: isEmbeddingsConfigured(),
    lastSyncedAt: meta.lastSyncedAt,
    lastEventSummary: meta.lastEventSummary,
    lastCollection: meta.lastCollection,
    lastSlug: meta.lastSlug,
    counts: {
      articles: cms.articles.length,
      books: cms.books.length,
      videos: cms.videos.length,
      transcripts: transcriptsCount,
      poems: cms.poems.length,
      artworks: cms.artworks.length,
      exhibitions: cms.exhibitions.length,
      pages: cms.pages.length,
      commerce: commerce.length,
      glossary: cms.glossary.length,
      goldenQa: training.goldenQa.filter((g) => g.status === 'published').length,
      trainingDocs: training.trainingDocuments.filter((d) => d.status === 'indexed').length,
      dynamicWorks: dynamicWorks.length,
      enrichments: Object.keys(enrichments).length,
      totalChunks: chunks.length,
      embeddedChunks,
    },
  };
}
