-- =============================================================================
-- MAKAREMI-CORE-2026: French-Law Compliant E-Commerce & Provenance Schema
-- Ready for Neon Postgres (Vercel Marketplace) or Self-Hosted PostgreSQL 17
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS commerce_invoice_seq START 1;

CREATE TABLE IF NOT EXISTS commerce_orders (
  id UUID PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'pending_payment', 'awaiting_sepa_transfer', 'paid',
    'fulfilled', 'withdrawal_requested', 'refunded', 'cancelled'
  )),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe_card', 'stripe_alma', 'sepa_wire')),
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  locale TEXT NOT NULL CHECK (locale IN ('fa', 'fr', 'en')),
  customer_json JSONB NOT NULL,
  quote_json JSONB NOT NULL,
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
);

CREATE TABLE IF NOT EXISTS commerce_certificates (
  certificate_id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL REFERENCES commerce_orders(order_number) ON DELETE RESTRICT,
  invoice_number TEXT NOT NULL,
  sku TEXT NOT NULL,
  artwork_slug TEXT NOT NULL,
  plate_image_id INTEGER,
  kind TEXT NOT NULL CHECK (kind IN ('original_artwork', 'fine_art_print')),
  buyer_name TEXT NOT NULL,
  canonical_sha256 TEXT NOT NULL,
  signature_ed25519 TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commerce_withdrawals (
  id UUID PRIMARY KEY,
  reference_code TEXT UNIQUE NOT NULL,
  order_number TEXT NOT NULL,
  customer_full_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL CHECK (status IN ('received', 'approved', 'refunded', 'excluded_by_law')),
  legal_basis_note_fr TEXT NOT NULL,
  receipt_email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commerce_orders_status ON commerce_orders(status);
CREATE INDEX IF NOT EXISTS idx_commerce_orders_created ON commerce_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commerce_withdrawals_order ON commerce_withdrawals(order_number);
