import crypto from 'node:crypto';
import type { CommerceOrder } from '@makaremi/shared';
import { timingSafeCompare } from '@/lib/crypto';
import { ALLOWED_SHIPPING_COUNTRIES } from './rules';

export function isStripeConfigured(): boolean {
  const key = (process.env.STRIPE_SECRET_KEY || '').trim();
  return key.startsWith('sk_test_') || key.startsWith('sk_live_');
}

export function getStripeRuntimeMode(): 'live' | 'test' | 'unconfigured' {
  const key = (process.env.STRIPE_SECRET_KEY || '').trim();
  if (key.startsWith('sk_live_')) return 'live';
  if (key.startsWith('sk_test_')) return 'test';
  return 'unconfigured';
}

/**
 * Creates a Stripe France Hosted Checkout Session via Stripe's official REST API
 * (zero extra npm dependencies, PCI-DSS SAQ-A compliant).
 * Supports Cartes Bancaires (CB) co-badging via `card`, Apple Pay, Google Pay,
 * and French Alma 2x/3x/4x installments when requested & eligible.
 */
export async function createStripeCheckoutSession(input: {
  order: CommerceOrder;
  origin: string;
}): Promise<{ id: string; url: string }> {
  const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  const { order, origin } = input;
  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('client_reference_id', order.orderNumber);
  params.set('customer_email', order.customer.email);
  params.set('locale', order.locale === 'fr' ? 'fr' : 'en');
  params.set(
    'success_url',
    `${origin}/${order.locale}/shop/checkout/success?order=${encodeURIComponent(order.orderNumber)}&session_id={CHECKOUT_SESSION_ID}`
  );
  params.set(
    'cancel_url',
    `${origin}/${order.locale}/shop/checkout/cancel?order=${encodeURIComponent(order.orderNumber)}`
  );

  // Payment methods: CB + Visa/Mastercard (+ Alma BNPL in FR/EU when selected)
  if (order.paymentMethod === 'stripe_alma') {
    params.append('payment_method_types[]', 'alma');
    params.append('payment_method_types[]', 'card');
  } else {
    params.append('payment_method_types[]', 'card');
  }

  // Session expires in 30 minutes to match unique artwork stock reservation lock
  const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60;
  params.set('expires_at', String(expiresAt));

  // Metadata for webhook reconciliation & French dual-bucket accounting
  params.set('metadata[order_id]', order.id);
  params.set('metadata[order_number]', order.orderNumber);
  params.set('metadata[invoice_number]', order.invoiceNumber);
  params.set('metadata[tax_mode]', order.quote.taxMode);
  params.set('metadata[loi_darcos_applied]', String(order.quote.loiDarcosApplied));

  // Line items
  order.quote.lines.forEach((line, idx) => {
    params.set(`line_items[${idx}][price_data][currency]`, 'eur');
    params.set(`line_items[${idx}][price_data][unit_amount]`, String(line.unitPriceCents));
    params.set(
      `line_items[${idx}][price_data][product_data][name]`,
      line.title[order.locale] || line.title.fr
    );
    params.set(
      `line_items[${idx}][price_data][product_data][description]`,
      `${line.sku} • ${order.quote.taxNoticeFr}`
    );
    params.set(`line_items[${idx}][quantity]`, String(line.quantity));
  });

  // Explicit shipping line item (preserves exact Loi Darcos €3.00 compliance)
  if (order.quote.shippingCents > 0) {
    const shipIdx = order.quote.lines.length;
    params.set(`line_items[${shipIdx}][price_data][currency]`, 'eur');
    params.set(`line_items[${shipIdx}][price_data][unit_amount]`, String(order.quote.shippingCents));
    params.set(
      `line_items[${shipIdx}][price_data][product_data][name]`,
      order.quote.loiDarcosApplied
        ? 'Frais de port livre — Tarif minimal légal (Loi Darcos)'
        : order.quote.hasOriginalArtwork
          ? 'Expédition assurée caisse muséale (Paris)'
          : 'Expédition suivie depuis Paris'
    );
    params.set(`line_items[${shipIdx}][quantity]`, '1');
  }

  // Allowed shipping countries (excludes sanctioned destinations strictly)
  if (order.quote.hasPhysicalGoods) {
    ALLOWED_SHIPPING_COUNTRIES.forEach((country, idx) => {
      params.set(`shipping_address_collection[allowed_countries][${idx}]`, country.code);
    });
  }

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': `mkm-checkout-${order.id}`,
    },
    body: params.toString(),
  });

  const data = (await res.json()) as { id?: string; url?: string; error?: { message?: string } };
  if (!res.ok || !data.id || !data.url) {
    throw new Error(data.error?.message || `Stripe Checkout API failed (${res.status})`);
  }

  return { id: data.id, url: data.url };
}

/**
 * Cryptographically verifies Stripe's `Stripe-Signature` webhook header (HMAC-SHA256)
 * with 5-minute replay window protection and timing-safe comparison.
 */
export function verifyStripeWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string
): boolean {
  if (!signatureHeader || !webhookSecret) return false;
  const parts = signatureHeader.split(',').map((p) => p.trim());
  let timestamp = '';
  const v1Sigs: string[] = [];

  for (const part of parts) {
    const [k, v] = part.split('=');
    if (k === 't' && v) timestamp = v;
    if (k === 'v1' && v) v1Sigs.push(v);
  }

  if (!timestamp || v1Sigs.length === 0) return false;
  const tsNum = Number(timestamp);
  if (!Number.isFinite(tsNum) || Math.abs(Math.floor(Date.now() / 1000) - tsNum) > 300) {
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  return v1Sigs.some((sig) => timingSafeCompare(sig, expected));
}
