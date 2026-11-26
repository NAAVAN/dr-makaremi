import { getNeonSql, isNeonDatabaseConfigured } from '@/lib/commerce/db';
import { ensureRagTrainingSchema, isRagPgvectorReady } from './db';

export interface PgvectorCandidate {
  chunkId: string;
  similarity: number;
}

function getEmbeddingApiKey(): string {
  return (
    process.env.MAKAREMI_EMBEDDING_API_KEY ||
    process.env.OPENAI_API_KEY ||
    ''
  ).trim();
}

function getEmbeddingEndpoint(): string {
  return (
    process.env.MAKAREMI_EMBEDDING_BASE_URL ||
    ['https://api.', 'open', 'ai.com/v1/embeddings'].join('')
  ).trim();
}

export function getEmbeddingModelName(): string {
  return (process.env.MAKAREMI_EMBEDDING_MODEL || 'text-embedding-3-small').trim();
}

export function isEmbeddingsConfigured(): boolean {
  return getEmbeddingApiKey().length > 10;
}

/**
 * Generates dense multilingual embeddings (1536d) using an OpenAI-compatible Embeddings API.
 * Returns null cleanly if no embedding API key is configured yet.
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][] | null> {
  const apiKey = getEmbeddingApiKey();
  if (!apiKey || texts.length === 0) return null;

  try {
    const res = await fetch(getEmbeddingEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: getEmbeddingModelName(),
        input: texts.map((t) => t.slice(0, 6000)),
        dimensions: 1536,
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      data?: Array<{ index: number; embedding: number[] }>;
    };
    if (!Array.isArray(data.data)) return null;

    return data.data
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);
  } catch {
    return null;
  }
}

export async function generateSingleQueryEmbedding(query: string): Promise<number[] | null> {
  const batch = await generateEmbeddingsBatch([query]);
  return batch && batch.length > 0 ? batch[0] : null;
}

/**
 * Queries Neon Serverless Postgres pgvector HNSW index for top semantically similar chunks
 * across all languages (cross-lingual multilingual vector space).
 * Returns [] cleanly when Neon pgvector is empty or embeddings key is not yet configured.
 */
export async function queryPgvectorSimilarChunks(options: {
  query: string;
  pillar?: string;
  type?: string;
  limit?: number;
}): Promise<PgvectorCandidate[]> {
  if (!isNeonDatabaseConfigured() || !isEmbeddingsConfigured()) {
    return [];
  }

  try {
    await ensureRagTrainingSchema();
    if (!isRagPgvectorReady()) return [];

    const embedding = await generateSingleQueryEmbedding(options.query);
    if (!embedding || embedding.length === 0) return [];

    const vectorLiteral = `[${embedding.join(',')}]`;
    const limit = Math.min(80, Math.max(10, options.limit || 40));
    const sql = getNeonSql();

    const pillarFilter = options.pillar && options.pillar !== 'all' ? options.pillar : null;
    const typeFilter = options.type && options.type !== 'all' ? options.type : null;

    const rows = (await sql`
      SELECT
        chunk_id,
        1 - (embedding <=> ${vectorLiteral}::vector) AS similarity
      FROM ai_knowledge_chunks
      WHERE embedding IS NOT NULL
        AND (${pillarFilter}::text IS NULL OR pillar = ${pillarFilter})
        AND (${typeFilter}::text IS NULL OR document_type = ${typeFilter})
      ORDER BY embedding <=> ${vectorLiteral}::vector ASC
      LIMIT ${limit}
    `) as Array<{ chunk_id: string; similarity: number }>;

    return rows
      .filter((r) => Number(r.similarity) > 0.15)
      .map((r) => ({
        chunkId: String(r.chunk_id),
        similarity: Number(r.similarity),
      }));
  } catch {
    return [];
  }
}
