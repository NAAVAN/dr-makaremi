import crypto from 'node:crypto';
import type { ContentPillar, Locale, VideoTranscriptSegment } from '@makaremi/shared';
import { countWords } from '@/lib/etl/persian-normalizer';

export interface SemanticChunk {
  id: string;
  documentId: string;
  documentType: 'book' | 'article' | 'speech' | 'poem' | 'exhibition' | 'glossary';
  pillar: ContentPillar;
  locale: Locale;
  title: string;
  url: string;
  sectionIndex: number;
  content: string;
  content_sha256: string;
  startSec?: number;
  endSec?: number;
  youtubeVideoId?: string;
  seriesTitle?: string;
  vector?: number[];
}

export interface ChunkDocumentInput {
  documentId: string;
  documentType: 'book' | 'article' | 'speech' | 'poem' | 'exhibition' | 'glossary';
  pillar: ContentPillar;
  locale: Locale;
  title: string;
  url: string;
  content: string;
  youtubeVideoId?: string;
  seriesTitle?: string;
}

export interface ChunkTimedTranscriptInput {
  documentId: string;
  pillar: ContentPillar;
  locale: Locale;
  title: string;
  baseUrl: string;
  youtubeVideoId?: string;
  seriesTitle?: string;
  description?: string | null;
  transcriptMarkdown?: string | null;
  segments?: VideoTranscriptSegment[];
}

const TIMESTAMP_LINE_RE = /^\*\*\[(\d{1,2}:\d{2}(?::\d{2})?)\]\*\*\s*([\s\S]*)$/;
const PLAIN_STAMP_LINE_RE = /^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*([\s\S]*)$/;

function parseStampToSeconds(stamp: string): number {
  const parts = stamp.split(':').map((n) => Number(n));
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function buildDeepTimedUrl(baseUrl: string, startSec?: number): string {
  if (startSec === undefined || startSec <= 0) return baseUrl;
  const sep = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${sep}t=${Math.floor(startSec)}`;
}

/**
 * Splits document content into semantic chunks respecting paragraph and sentence boundaries.
 * Target chunk size: 250 - 450 words with ~50 words overlap.
 */
export function chunkDocument(doc: ChunkDocumentInput): SemanticChunk[] {
  const text = doc.content.trim();
  if (!text) return [];

  if (countWords(text) <= 300) {
    const sha = crypto.createHash('sha256').update(text, 'utf-8').digest('hex');
    return [
      {
        id: `${doc.documentId}_${doc.locale}_chunk_0`,
        documentId: doc.documentId,
        documentType: doc.documentType,
        pillar: doc.pillar,
        locale: doc.locale,
        title: doc.title,
        url: doc.url,
        sectionIndex: 0,
        content: text,
        content_sha256: sha,
        youtubeVideoId: doc.youtubeVideoId,
        seriesTitle: doc.seriesTitle,
      },
    ];
  }

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const chunks: SemanticChunk[] = [];
  let currentWords: string[] = [];
  let sectionIndex = 0;

  for (const para of paragraphs) {
    const paraWords = para.split(/\s+/).filter(Boolean);

    if (currentWords.length + paraWords.length <= 400) {
      currentWords.push(...paraWords);
    } else if (currentWords.length >= 150) {
      const chunkText = currentWords.join(' ');
      const sha = crypto.createHash('sha256').update(chunkText, 'utf-8').digest('hex');
      chunks.push({
        id: `${doc.documentId}_${doc.locale}_chunk_${sectionIndex}`,
        documentId: doc.documentId,
        documentType: doc.documentType,
        pillar: doc.pillar,
        locale: doc.locale,
        title: doc.title,
        url: doc.url,
        sectionIndex,
        content: chunkText,
        content_sha256: sha,
        youtubeVideoId: doc.youtubeVideoId,
        seriesTitle: doc.seriesTitle,
      });
      sectionIndex++;
      const overlap = currentWords.slice(-50);
      currentWords = [...overlap, ...paraWords];
    } else {
      currentWords.push(...paraWords);
    }
  }

  if (currentWords.length > 0) {
    const chunkText = currentWords.join(' ');
    const sha = crypto.createHash('sha256').update(chunkText, 'utf-8').digest('hex');
    chunks.push({
      id: `${doc.documentId}_${doc.locale}_chunk_${sectionIndex}`,
      documentId: doc.documentId,
      documentType: doc.documentType,
      pillar: doc.pillar,
      locale: doc.locale,
      title: doc.title,
      url: doc.url,
      sectionIndex,
      content: chunkText,
      content_sha256: sha,
      youtubeVideoId: doc.youtubeVideoId,
      seriesTitle: doc.seriesTitle,
    });
  }

  return chunks;
}

/**
 * Splits a timed video speech transcript (from segments or **[MM:SS]** markdown) into
 * 250–380 word overlapping semantic chunks carrying exact `startSec` / `endSec` deep-links (?t=sec).
 */
export function chunkTimedTranscript(input: ChunkTimedTranscriptInput): SemanticChunk[] {
  const headerPrefix = [input.title, input.description].filter(Boolean).join('\n\n').trim();
  const rawMd = (input.transcriptMarkdown || '').trim();

  // Build normalized timed units either from explicit segments or markdown timestamp blocks
  const timedUnits: Array<{ startSec: number; endSec: number; text: string }> = [];

  if (rawMd) {
    const paras = rawMd
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    for (const para of paras) {
      const m = para.match(TIMESTAMP_LINE_RE) || para.match(PLAIN_STAMP_LINE_RE);
      if (m) {
        const sec = parseStampToSeconds(m[1]);
        timedUnits.push({ startSec: sec, endSec: sec + 45, text: m[2].trim() });
      }
    }
  }

  if (timedUnits.length === 0 && input.segments && input.segments.length > 0) {
    for (const seg of input.segments) {
      if (seg.text?.trim()) {
        timedUnits.push({
          startSec: seg.startSec,
          endSec: seg.endSec,
          text: seg.text.trim(),
        });
      }
    }
  }

  // Fallback to standard untimed semantic chunking if no timestamps are available
  if (timedUnits.length === 0) {
    const combined = [headerPrefix, rawMd].filter(Boolean).join('\n\n');
    return chunkDocument({
      documentId: input.documentId,
      documentType: 'speech',
      pillar: input.pillar,
      locale: input.locale,
      title: input.title,
      url: input.baseUrl,
      content: combined,
      youtubeVideoId: input.youtubeVideoId,
      seriesTitle: input.seriesTitle,
    });
  }

  const chunks: SemanticChunk[] = [];
  let bucket: Array<{ startSec: number; endSec: number; text: string; words: string[] }> = [];
  let bucketWordCount = 0;
  let sectionIndex = 0;

  const flushBucket = () => {
    if (bucket.length === 0) return;
    const startSec = Math.floor(bucket[0].startSec);
    const endSec = Math.ceil(bucket[bucket.length - 1].endSec);
    const bodyText = bucket.map((b) => b.text).join(' ').trim();
    const content = sectionIndex === 0 && headerPrefix ? `${headerPrefix}\n\n${bodyText}` : `${input.title}\n\n${bodyText}`;
    const sha = crypto.createHash('sha256').update(content, 'utf-8').digest('hex');

    chunks.push({
      id: `${input.documentId}_${input.locale}_tchunk_${sectionIndex}`,
      documentId: input.documentId,
      documentType: 'speech',
      pillar: input.pillar,
      locale: input.locale,
      title: input.title,
      url: buildDeepTimedUrl(input.baseUrl, startSec),
      sectionIndex,
      content,
      content_sha256: sha,
      startSec,
      endSec,
      youtubeVideoId: input.youtubeVideoId,
      seriesTitle: input.seriesTitle,
    });
    sectionIndex++;
  };

  for (const unit of timedUnits) {
    const words = unit.text.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;

    if (bucketWordCount + words.length > 360 && bucketWordCount >= 180) {
      flushBucket();
      // Keep last unit (~50 words) for smooth contextual overlap
      const lastUnit = bucket[bucket.length - 1];
      bucket = lastUnit ? [lastUnit] : [];
      bucketWordCount = lastUnit ? lastUnit.words.length : 0;
    }

    bucket.push({ ...unit, words });
    bucketWordCount += words.length;
  }

  flushBucket();
  return chunks;
}
