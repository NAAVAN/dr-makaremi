import crypto from 'node:crypto';
import type { ContentPillar, Locale } from '@makaremi/shared';
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
}

/**
 * Splits document content into semantic chunks respecting paragraph and sentence boundaries.
 * Target chunk size: 250 - 450 words with ~50 words overlap.
 */
export function chunkDocument(doc: ChunkDocumentInput): SemanticChunk[] {
  const text = doc.content.trim();
  if (!text) return [];

  // If text is short (< 300 words), emit single chunk
  if (countWords(text) <= 300) {
    const sha = crypto.createHash('sha256').update(text, 'utf-8').digest('hex');
    return [
      {
        id: `${doc.documentId}_chunk_0`,
        documentId: doc.documentId,
        documentType: doc.documentType,
        pillar: doc.pillar,
        locale: doc.locale,
        title: doc.title,
        url: doc.url,
        sectionIndex: 0,
        content: text,
        content_sha256: sha,
      },
    ];
  }

  // Split by natural paragraph breaks
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: SemanticChunk[] = [];
  let currentWords: string[] = [];
  let sectionIndex = 0;

  for (const para of paragraphs) {
    const paraWords = para.split(/\s+/).filter(Boolean);

    // If current chunk + this paragraph <= 400 words, accumulate
    if (currentWords.length + paraWords.length <= 400) {
      currentWords.push(...paraWords);
    } else {
      // If current chunk already has > 150 words, flush it
      if (currentWords.length >= 150) {
        const chunkText = currentWords.join(' ');
        const sha = crypto.createHash('sha256').update(chunkText, 'utf-8').digest('hex');
        chunks.push({
          id: `${doc.documentId}_chunk_${sectionIndex++}`,
          documentId: doc.documentId,
          documentType: doc.documentType,
          pillar: doc.pillar,
          locale: doc.locale,
          title: doc.title,
          url: doc.url,
          sectionIndex: sectionIndex - 1,
          content: chunkText,
          content_sha256: sha,
        });

        // 50-word overlap for contextual continuity
        const overlap = currentWords.slice(-50);
        currentWords = [...overlap, ...paraWords];
      } else {
        currentWords.push(...paraWords);
      }
    }
  }

  // Flush remaining words
  if (currentWords.length > 0) {
    const chunkText = currentWords.join(' ');
    const sha = crypto.createHash('sha256').update(chunkText, 'utf-8').digest('hex');
    chunks.push({
      id: `${doc.documentId}_chunk_${sectionIndex++}`,
      documentId: doc.documentId,
      documentType: doc.documentType,
      pillar: doc.pillar,
      locale: doc.locale,
      title: doc.title,
      url: doc.url,
      sectionIndex: sectionIndex - 1,
      content: chunkText,
      content_sha256: sha,
    });
  }

  return chunks;
}
