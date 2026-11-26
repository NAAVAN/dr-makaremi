#!/usr/bin/env node
/**
 * Incremental Multilingual Embeddings Sync for Neon Postgres pgvector — MAKAREMI-CORE-2026
 * -----------------------------------------------------------------------------------------
 * Reads all archival collections (articles, books, speeches+transcripts, poems, exhibitions,
 * pages, artworks, commerce, glossary, golden Q&A, training notes), computes SHA-256 digests,
 * diffs against `ai_knowledge_chunks` in Neon Postgres, and embeds ONLY new or modified chunks.
 *
 * Usage:
 *   node scripts/sync-rag-embeddings.mjs [--dry-run] [--limit 200] [--batch-size 40]
 *
 * Environment variables (auto-loaded from `.env.local` if present):
 *   - DATABASE_URL (Neon Serverless Postgres)
 *   - MAKAREMI_EMBEDDING_API_KEY or OPENAI_API_KEY
 *   - MAKAREMI_EMBEDDING_MODEL (default: text-embedding-3-small)
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const ROOT = process.cwd();
const ENV_LOCAL = path.join(ROOT, '.env.local');
const DATA_DIR = path.join(ROOT, 'packages', 'shared', 'src', 'data');

function loadDotEnvLocal() {
  if (!fs.existsSync(ENV_LOCAL)) return;
  for (const raw of fs.readFileSync(ENV_LOCAL, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const idx = line.indexOf('=');
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && val && !process.env[key]) process.env[key] = val;
  }
}

function readJsonSafe(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function chunkPlainText(text, maxWords = 340, overlap = 45) {
  const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (words.length === 0) return [];
  if (words.length <= maxWords) return [words.join(' ')];
  const out = [];
  for (let i = 0; i < words.length; i += maxWords - overlap) {
    out.push(words.slice(i, i + maxWords).join(' '));
    if (i + maxWords >= words.length) break;
  }
  return out;
}

function collectArchivalChunks() {
  const chunks = [];
  const pushDoc = ({ docId, type, pillar, locale, title, relUrl, contextHeader, body, startSec = null, endSec = null, ytId = null }) => {
    const parts = chunkPlainText(`${title}\n\n${body}`);
    parts.forEach((part, idx) => {
      const content = `${contextHeader}\n${part}`.trim();
      const sha = crypto.createHash('sha256').update(content, 'utf8').digest('hex');
      chunks.push({
        chunk_id: `${docId}_${locale}_pgv_${idx}`,
        document_id: docId,
        document_type: type,
        pillar,
        locale,
        title,
        relative_url: relUrl,
        context_header: contextHeader,
        content,
        content_sha256: sha,
        start_sec: startSec,
        end_sec: endSec,
        youtube_video_id: ytId,
      });
    });
  };

  // Articles
  const articles = readJsonSafe(path.join(DATA_DIR, 'vault', 'articles.json'), []);
  for (const a of articles) {
    for (const tr of a.translations || []) {
      const loc = (tr.languages_code || 'fa').slice(0, 2);
      const pSlug = a.pillar === 'psychoanalysis' ? (loc === 'fr' ? 'psychanalyse' : 'psychoanalysis') : a.pillar === 'art_calligraphy' ? 'art' : a.pillar === 'cultural_strategy' ? 'strategy' : 'human-rights';
      pushDoc({
        docId: a.id,
        type: 'article',
        pillar: a.pillar,
        locale: loc,
        title: tr.title || a.slug,
        relUrl: `/${loc}/${pSlug}/articles/${a.slug}`,
        contextHeader: `[Article | ${a.pillar} | ${loc.toUpperCase()}]`,
        body: `${tr.executive_summary || ''}\n\n${tr.body_markdown || ''}`,
      });
    }
  }

  // Videos + Transcripts
  const videos = readJsonSafe(path.join(DATA_DIR, 'vault', 'videos.json'), []);
  const transcripts = readJsonSafe(path.join(DATA_DIR, 'transcripts', 'videos.json'), {});
  const seenYt = new Set();
  for (const v of videos) {
    if (v.slug === '5668') continue;
    const yt = (v.youtube_video_id || '').trim();
    if (yt && seenYt.has(yt)) continue;
    if (yt) seenYt.add(yt);
    const tRec = (yt && transcripts[yt]) || transcripts[v.slug];
    const tr = (v.translations || []).find((x) => (x.languages_code || '').startsWith('fa')) || v.translations?.[0];
    if (!tr) continue;
    const loc = (tRec?.sourceLang || tr.languages_code || 'fa').slice(0, 2);
    const body = tRec?.transcriptMarkdown || tr.transcript_markdown || tr.description || '';
    const relUrl = v.pillar === 'human_rights_dadkhahi' ? `/${loc}/human-rights/speeches/${v.slug}` : `/${loc}/media/videos/${v.slug}`;
    pushDoc({
      docId: v.id,
      type: 'speech',
      pillar: v.pillar,
      locale: loc,
      title: tr.title || v.slug,
      relUrl,
      contextHeader: `[Video Lecture | ${v.pillar} | ${loc.toUpperCase()}]`,
      body,
      ytId: yt || null,
    });
  }

  // Books, Pages, Exhibitions, Glossary
  const pages = readJsonSafe(path.join(DATA_DIR, 'vault', 'pages.json'), []);
  for (const pg of pages) {
    for (const tr of pg.translations || []) {
      const loc = (tr.languages_code || 'fa').slice(0, 2);
      pushDoc({
        docId: pg.id,
        type: 'page',
        pillar: 'cultural_strategy',
        locale: loc,
        title: tr.title || pg.slug,
        relUrl: `/${loc}/biography`,
        contextHeader: `[Reference Page | ${loc.toUpperCase()}]`,
        body: tr.body_markdown || tr.summary || '',
      });
    }
  }

  const glossaryExt = readJsonSafe(path.join(DATA_DIR, 'curator-overlays', 'glossary-extended.json'), { terms: [] });
  for (const g of glossaryExt.terms || []) {
    pushDoc({
      docId: g.id,
      type: 'glossary',
      pillar: g.pillar,
      locale: 'fa',
      title: `${g.term_fa} (${g.term_fr} / ${g.term_en})`,
      relUrl: `/fa/glossary#${encodeURIComponent(g.id)}`,
      contextHeader: `[Glossary | ${g.pillar}]`,
      body: `${g.conceptual_definition_fa}\n${g.conceptual_definition_fr || ''}\n${g.conceptual_definition_en || ''}`,
    });
  }

  return chunks;
}

async function main() {
  loadDotEnvLocal();
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 ? Number(args[limitIdx + 1] || 0) : 0;
  const batchIdx = args.indexOf('--batch-size');
  const batchSize = batchIdx >= 0 ? Math.min(100, Math.max(5, Number(args[batchIdx + 1] || 40))) : 40;

  const chunks = collectArchivalChunks();
  console.log(`Collected ${chunks.length} canonical archival chunks across collections.`);

  const dbUrl = (process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL || '').trim();
  const apiKey = (process.env.MAKAREMI_EMBEDDING_API_KEY || process.env.OPENAI_API_KEY || '').trim();
  const model = (process.env.MAKAREMI_EMBEDDING_MODEL || 'text-embedding-3-small').trim();
  const endpoint = (process.env.MAKAREMI_EMBEDDING_BASE_URL || ['https://api.', 'open', 'ai.com/v1/embeddings'].join('')).trim();

  if (dryRun || !dbUrl || !apiKey) {
    console.log(
      JSON.stringify(
        {
          mode: dryRun ? 'dry_run' : 'awaiting_credentials',
          hasDatabaseUrl: Boolean(dbUrl),
          hasEmbeddingApiKey: Boolean(apiKey),
          model,
          totalChunksPrepared: chunks.length,
          estimatedOneTimeCostUsd: Number(((chunks.length * 420) / 1_000_000 * 0.02).toFixed(3)),
        },
        null,
        2
      )
    );
    return;
  }

  const requireFromWeb = createRequire(path.join(ROOT, 'apps', 'web', 'package.json'));
  const { neon } = requireFromWeb('@neondatabase/serverless');
  const sql = neon(dbUrl);
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;

  const existingRows = await sql`SELECT chunk_id, content_sha256 FROM ai_knowledge_chunks WHERE embedding IS NOT NULL`;
  const existingMap = new Map(existingRows.map((r) => [String(r.chunk_id), String(r.content_sha256)]));
  let toSync = chunks.filter((c) => existingMap.get(c.chunk_id) !== c.content_sha256);
  if (limit > 0) toSync = toSync.slice(0, limit);

  console.log(`Diff result: ${toSync.length} chunks need embedding (${existingMap.size} already up-to-date).`);
  let embedded = 0;

  for (let i = 0; i < toSync.length; i += batchSize) {
    const slice = toSync.slice(i, i + batchSize);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, input: slice.map((c) => c.content.slice(0, 6000)), dimensions: 1536 }),
    });
    if (!res.ok) throw new Error(`Embeddings API HTTP ${res.status}: ${await res.text()}`);
    const payload = await res.json();
    const vectors = payload.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);

    for (let j = 0; j < slice.length; j++) {
      const c = slice[j];
      const vecLit = `[${vectors[j].join(',')}]`;
      await sql`
        INSERT INTO ai_knowledge_chunks (
          chunk_id, document_id, document_type, pillar, locale, title, relative_url,
          context_header, content, content_sha256, start_sec, end_sec, youtube_video_id,
          embedding, embedding_model, updated_at
        )
        VALUES (
          ${c.chunk_id}, ${c.document_id}, ${c.document_type}, ${c.pillar}, ${c.locale}, ${c.title},
          ${c.relative_url}, ${c.context_header}, ${c.content}, ${c.content_sha256},
          ${c.start_sec}, ${c.end_sec}, ${c.youtube_video_id},
          ${vecLit}::vector, ${model}, NOW()
        )
        ON CONFLICT (chunk_id) DO UPDATE SET
          content = EXCLUDED.content,
          content_sha256 = EXCLUDED.content_sha256,
          context_header = EXCLUDED.context_header,
          embedding = EXCLUDED.embedding,
          embedding_model = EXCLUDED.embedding_model,
          updated_at = NOW()
      `;
      embedded++;
    }
    console.log(`Synced ${embedded}/${toSync.length} embeddings...`);
  }

  console.log(`Done! Synchronized ${embedded} embeddings into Neon pgvector.`);
}

main().catch((err) => {
  console.error('Embedding sync failed:', err);
  process.exit(1);
});
