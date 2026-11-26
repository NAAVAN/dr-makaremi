import {
  getNeonSql,
  getNeonStorageStatus,
  isNeonDatabaseConfigured,
} from '@/lib/commerce/db';

let ragSchemaReadyPromise: Promise<void> | null = null;
let pgvectorEnabledFlag = false;

export function isRagPgvectorReady(): boolean {
  return pgvectorEnabledFlag;
}

export function getRagStorageMode(): 'neon_postgres' | 'local_file_fallback' {
  return isNeonDatabaseConfigured() ? 'neon_postgres' : 'local_file_fallback';
}

export function getRagStorageMeta() {
  const neonStatus = getNeonStorageStatus();
  return {
    ...neonStatus,
    pgvectorAvailable: pgvectorEnabledFlag,
  };
}

/**
 * Idempotently bootstraps all AI Training, Knowledge Graph, Telemetry,
 * Evaluation, and pgvector tables in Neon Serverless Postgres.
 * Gracefully degrades if pgvector extension is unavailable while keeping
 * all relational training tables 100% operational.
 */
export async function ensureRagTrainingSchema(): Promise<void> {
  if (!isNeonDatabaseConfigured()) return;
  if (ragSchemaReadyPromise) return ragSchemaReadyPromise;

  ragSchemaReadyPromise = (async () => {
    const sql = getNeonSql();

    // 1. Best-effort enable pgvector & pg_trgm extensions natively supported by Neon
    try {
      await sql`CREATE EXTENSION IF NOT EXISTS vector`;
      pgvectorEnabledFlag = true;
    } catch {
      pgvectorEnabledFlag = false;
    }

    try {
      await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;
    } catch {
      // ignore if extension permissions are restricted
    }

    // 2. Unified Knowledge Chunks table (with vector(1536) when pgvector is enabled)
    if (pgvectorEnabledFlag) {
      await sql`
        CREATE TABLE IF NOT EXISTS ai_knowledge_chunks (
          chunk_id TEXT PRIMARY KEY,
          document_id TEXT NOT NULL,
          document_type TEXT NOT NULL,
          pillar TEXT NOT NULL,
          locale TEXT NOT NULL,
          title TEXT NOT NULL,
          relative_url TEXT NOT NULL,
          context_header TEXT NOT NULL DEFAULT '',
          content TEXT NOT NULL,
          content_sha256 TEXT NOT NULL,
          start_sec INTEGER,
          end_sec INTEGER,
          youtube_video_id TEXT,
          embedding vector(1536),
          embedding_model TEXT,
          metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      try {
        await sql`
          CREATE INDEX IF NOT EXISTS idx_ai_chunks_embedding_hnsw
          ON ai_knowledge_chunks USING hnsw (embedding vector_cosine_ops)
        `;
      } catch {
        // Fallback if HNSW not built on empty or older pgvector
      }
    } else {
      await sql`
        CREATE TABLE IF NOT EXISTS ai_knowledge_chunks (
          chunk_id TEXT PRIMARY KEY,
          document_id TEXT NOT NULL,
          document_type TEXT NOT NULL,
          pillar TEXT NOT NULL,
          locale TEXT NOT NULL,
          title TEXT NOT NULL,
          relative_url TEXT NOT NULL,
          context_header TEXT NOT NULL DEFAULT '',
          content TEXT NOT NULL,
          content_sha256 TEXT NOT NULL,
          start_sec INTEGER,
          end_sec INTEGER,
          youtube_video_id TEXT,
          embedding_json JSONB,
          embedding_model TEXT,
          metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
    }

    await sql`CREATE INDEX IF NOT EXISTS idx_ai_chunks_filter ON ai_knowledge_chunks (locale, pillar, document_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_chunks_sha ON ai_knowledge_chunks (content_sha256)`;

    // 3. Professor's Golden Q&A Bank
    await sql`
      CREATE TABLE IF NOT EXISTS ai_golden_qa (
        id TEXT PRIMARY KEY,
        locale TEXT NOT NULL,
        pillar TEXT NOT NULL,
        question_canonical TEXT NOT NULL,
        question_variants JSONB NOT NULL DEFAULT '[]'::jsonb,
        answer_markdown TEXT NOT NULL,
        linked_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
        priority_boost REAL NOT NULL DEFAULT 1.8,
        status TEXT NOT NULL DEFAULT 'published',
        content_sha256 TEXT NOT NULL,
        signature_ed25519 TEXT NOT NULL,
        created_by TEXT NOT NULL DEFAULT 'professor',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // 4. Versioned Master Constitution & Persona Policy
    await sql`
      CREATE TABLE IF NOT EXISTS ai_persona_versions (
        version_id SERIAL PRIMARY KEY,
        label TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT FALSE,
        system_constitution_fa TEXT NOT NULL,
        system_constitution_fr TEXT NOT NULL,
        system_constitution_en TEXT NOT NULL,
        clinical_boundary_policy JSONB NOT NULL,
        citation_policy JSONB NOT NULL,
        provider_routing_json JSONB NOT NULL,
        monthly_token_budget INTEGER NOT NULL DEFAULT 5000000,
        signature_ed25519 TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // 5. Living Glossary & Concept Graph
    await sql`
      CREATE TABLE IF NOT EXISTS ai_glossary_terms (
        id TEXT PRIMARY KEY,
        term_fa TEXT NOT NULL,
        term_fr TEXT NOT NULL,
        term_en TEXT NOT NULL,
        aliases_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        definition_fa TEXT NOT NULL,
        definition_fr TEXT NOT NULL DEFAULT '',
        definition_en TEXT NOT NULL DEFAULT '',
        pillar TEXT NOT NULL,
        linked_sources_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        is_locked_translation BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS ai_concept_edges (
        id SERIAL PRIMARY KEY,
        source_term_id TEXT NOT NULL,
        target_term_id TEXT NOT NULL,
        relation_type TEXT NOT NULL,
        note_fa TEXT,
        UNIQUE(source_term_id, target_term_id, relation_type)
      )
    `;

    // 6. Unstructured Training Documents uploaded via Pishkhan
    await sql`
      CREATE TABLE IF NOT EXISTS ai_training_documents (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        source_format TEXT NOT NULL,
        locale TEXT NOT NULL,
        pillar TEXT NOT NULL,
        body_markdown TEXT NOT NULL,
        word_count INTEGER NOT NULL,
        chunk_count INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'indexed',
        content_sha256 TEXT NOT NULL,
        signature_ed25519 TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // 7. Anonymized CNIL-compliant Query Telemetry & Knowledge Gaps
    await sql`
      CREATE TABLE IF NOT EXISTS ai_query_telemetry (
        id TEXT PRIMARY KEY,
        session_hash TEXT NOT NULL,
        locale TEXT NOT NULL,
        pillar_filter TEXT NOT NULL DEFAULT 'all',
        query_sanitized TEXT NOT NULL,
        top_score REAL NOT NULL,
        citation_count INTEGER NOT NULL,
        is_knowledge_gap BOOLEAN NOT NULL DEFAULT FALSE,
        engine_tier TEXT NOT NULL,
        latency_ms INTEGER NOT NULL,
        prompt_tokens INTEGER NOT NULL DEFAULT 0,
        completion_tokens INTEGER NOT NULL DEFAULT 0,
        resolved_golden_qa_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_telemetry_created ON ai_query_telemetry (created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ai_telemetry_gaps ON ai_query_telemetry (is_knowledge_gap, created_at DESC)`;

    // 8. User Feedback & Triage Queue
    await sql`
      CREATE TABLE IF NOT EXISTS ai_feedback_events (
        id TEXT PRIMARY KEY,
        telemetry_id TEXT,
        query_preview TEXT,
        locale TEXT,
        rating SMALLINT NOT NULL,
        issue_category TEXT,
        user_note TEXT,
        triaged_status TEXT NOT NULL DEFAULT 'open',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // 9. Golden Eval Run Scorecard History
    await sql`
      CREATE TABLE IF NOT EXISTS ai_eval_runs (
        id TEXT PRIMARY KEY,
        persona_version_id INTEGER NOT NULL DEFAULT 1,
        engine_profile TEXT NOT NULL,
        total_cases INTEGER NOT NULL,
        passed_cases INTEGER NOT NULL,
        recall_at_5 REAL NOT NULL,
        mrr REAL NOT NULL,
        citation_faithfulness REAL NOT NULL,
        refusal_accuracy REAL NOT NULL,
        crisis_safety_rate REAL NOT NULL,
        white_label_leaks INTEGER NOT NULL,
        report_json JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
  })().catch((err) => {
    ragSchemaReadyPromise = null;
    throw err;
  });

  return ragSchemaReadyPromise;
}

export async function getEmbeddedChunkCount(): Promise<number> {
  if (!isNeonDatabaseConfigured()) return 0;
  try {
    await ensureRagTrainingSchema();
    if (!pgvectorEnabledFlag) return 0;
    const sql = getNeonSql();
    const rows = (await sql`SELECT COUNT(*)::int AS cnt FROM ai_knowledge_chunks WHERE embedding IS NOT NULL`) as Array<{
      cnt: number;
    }>;
    return Number(rows?.[0]?.cnt || 0);
  } catch {
    return 0;
  }
}
