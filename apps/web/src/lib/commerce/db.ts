import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

export interface NeonStorageStatus {
  mode: 'neon_postgres' | 'local_file_fallback';
  configured: boolean;
  providerLabel: string;
  regionHint: string | null;
  healthy?: boolean;
}

function getRawDatabaseUrl(): string {
  return (
    process.env.DATABASE_URL_POOLED ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    ''
  ).trim();
}

export function isNeonDatabaseConfigured(): boolean {
  const url = getRawDatabaseUrl();
  return url.startsWith('postgres://') || url.startsWith('postgresql://');
}

export function getNeonStorageStatus(): NeonStorageStatus {
  const url = getRawDatabaseUrl();
  if (!isNeonDatabaseConfigured()) {
    return {
      mode: 'local_file_fallback',
      configured: false,
      providerLabel: 'Local / Preview Runtime Fallback (Awaiting DATABASE_URL)',
      regionHint: null,
    };
  }

  let regionHint: string | null = null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const match = host.match(/\b(eu-[a-z0-9-]+|us-[a-z0-9-]+|ap-[a-z0-9-]+)\b/);
    if (match) regionHint = match[1];
  } catch {
    // ignore malformed parse
  }

  return {
    mode: 'neon_postgres',
    configured: true,
    providerLabel: regionHint
      ? `Neon Serverless Postgres (${regionHint})`
      : 'Neon Serverless Postgres',
    regionHint,
  };
}

let cachedSql: NeonQueryFunction<false, false> | null = null;
let cachedUrl = '';

/**
 * Lazy-initialized Neon serverless client (build-time safe, no Proxy wrappers).
 */
export function getNeonSql(): NeonQueryFunction<false, false> {
  const url = getRawDatabaseUrl();
  if (!url) {
    throw new Error('DATABASE_URL is not configured');
  }
  if (!cachedSql || cachedUrl !== url) {
    cachedSql = neon(url);
    cachedUrl = url;
  }
  return cachedSql;
}

let schemaReadyPromise: Promise<void> | null = null;

/**
 * Idempotently bootstraps all French e-commerce, provenance, and Pishkhan tables
 * on first runtime query after Neon Postgres is connected in Vercel.
 */
export async function ensureCommerceSchema(): Promise<void> {
  if (!isNeonDatabaseConfigured()) return;
  if (schemaReadyPromise) return schemaReadyPromise;

  schemaReadyPromise = (async () => {
    const sql = getNeonSql();

    await sql`CREATE SEQUENCE IF NOT EXISTS commerce_invoice_seq START 1`;

    await sql`
      CREATE TABLE IF NOT EXISTS commerce_settings (
        key TEXT PRIMARY KEY,
        value_json JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS commerce_orders (
        id UUID PRIMARY KEY,
        order_number TEXT UNIQUE NOT NULL,
        invoice_number TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        stripe_session_id TEXT,
        stripe_payment_intent_id TEXT,
        locale TEXT NOT NULL,
        customer_json JSONB NOT NULL,
        quote_json JSONB NOT NULL,
        certificate_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
        download_tokens_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        artiste_auteur_total_cents INTEGER NOT NULL DEFAULT 0,
        commercial_bic_total_cents INTEGER NOT NULL DEFAULT 0,
        shipping_cents INTEGER NOT NULL DEFAULT 0,
        tax_cents INTEGER NOT NULL DEFAULT 0,
        total_cents INTEGER NOT NULL,
        loi_darcos_applied BOOLEAN NOT NULL DEFAULT FALSE,
        cgv_accepted_at TIMESTAMPTZ NOT NULL,
        digital_withdrawal_waived_at TIMESTAMPTZ,
        custom_order_waived_at TIMESTAMPTZ,
        paid_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS commerce_unique_locks (
        sku TEXT PRIMARY KEY,
        order_id UUID NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('reserved', 'sold')),
        expires_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS commerce_certificates (
        certificate_id TEXT PRIMARY KEY,
        order_number TEXT NOT NULL,
        invoice_number TEXT NOT NULL,
        sku TEXT NOT NULL,
        artwork_slug TEXT NOT NULL,
        plate_image_id INTEGER,
        kind TEXT NOT NULL,
        buyer_name TEXT NOT NULL,
        canonical_sha256 TEXT NOT NULL,
        signature_ed25519 TEXT NOT NULL,
        payload_json JSONB NOT NULL,
        issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS commerce_withdrawals (
        id UUID PRIMARY KEY,
        reference_code TEXT UNIQUE NOT NULL,
        order_number TEXT NOT NULL,
        customer_full_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        reason TEXT,
        status TEXT NOT NULL,
        legal_basis_note_fr TEXT NOT NULL,
        receipt_email_sent BOOLEAN NOT NULL DEFAULT FALSE,
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_commerce_orders_status ON commerce_orders(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_commerce_orders_created ON commerce_orders(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_commerce_orders_stripe ON commerce_orders(stripe_session_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_commerce_withdrawals_order ON commerce_withdrawals(order_number)`;
  })().catch((err) => {
    schemaReadyPromise = null;
    throw err;
  });

  return schemaReadyPromise;
}

export async function checkNeonConnectionHealth(): Promise<NeonStorageStatus> {
  const base = getNeonStorageStatus();
  if (!base.configured) {
    return { ...base, healthy: true };
  }
  try {
    await ensureCommerceSchema();
    const sql = getNeonSql();
    await sql`SELECT 1 AS ok`;
    return { ...base, healthy: true };
  } catch {
    return { ...base, healthy: false };
  }
}
