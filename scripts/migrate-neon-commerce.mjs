#!/usr/bin/env node
/**
 * Explicit idempotent Neon Postgres migration script for MAKAREMI-CORE-2026 Commerce.
 * Usage:
 *   DATABASE_URL="postgresql://..." pnpm db:migrate:commerce
 *   (or after `vercel env pull .env.local --yes`)
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

function loadEnvFileIfPresent(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

async function main() {
  const root = process.cwd();
  loadEnvFileIfPresent(path.join(root, '.env.local'));
  loadEnvFileIfPresent(path.join(root, '.env'));

  const dbUrl = (process.env.DATABASE_URL || process.env.POSTGRES_URL || '').trim();
  if (!dbUrl || (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://'))) {
    console.error('ERROR: DATABASE_URL is not set. Provision Neon in Vercel Marketplace and run `vercel env pull .env.local --yes` first.');
    process.exit(1);
  }

  const req = createRequire(path.join(root, 'apps', 'web', 'package.json'));
  const { neon } = req('@neondatabase/serverless');
  const sql = neon(dbUrl);

  const migrationPath = path.join(root, 'infra', 'postgres', 'migrations', '002_commerce.sql');
  const sqlText = fs.readFileSync(migrationPath, 'utf8');
  const statements = sqlText
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.replace(/^--.*$/gm, '').trim())
    .filter(Boolean);

  console.log(`Executing ${statements.length} idempotent statements from 002_commerce.sql...`);
  for (const stmt of statements) {
    await sql.query(stmt);
  }

  const check = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name LIKE 'commerce_%'
    ORDER BY table_name
  `;
  console.log('Verified Neon Postgres commerce tables:', check.map((r) => r.table_name).join(', '));
}

main().catch((err) => {
  console.error('Migration failed:', err?.message || err);
  process.exit(1);
});
