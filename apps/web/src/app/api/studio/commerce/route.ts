import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isStudioRequestAuthorized } from '@/lib/studio/auth';
import {
  getAuthenticityCertificates,
  getCommerceCatalog,
  getCommerceLegalConfig,
  getCommerceOrders,
  getCommerceWithdrawals,
  saveCommerceLegalConfig,
  updateCommerceOrderStatus,
  upsertCommerceCatalogItem,
} from '@/lib/commerce/store';
import { getStripeRuntimeMode } from '@/lib/commerce/stripe';
import { isTransactionalEmailConfigured } from '@/lib/commerce/email';
import { checkNeonConnectionHealth } from '@/lib/commerce/db';

const UpdateLegalConfigSchema = z.object({
  action: z.literal('update_legal_config'),
  patch: z.object({
    siret: z.string().trim().max(64).optional(),
    apeCode: z.string().trim().max(120).optional(),
    urssafArtisteAuteurRef: z.string().trim().max(160).optional(),
    addressLine1: z.string().trim().max(220).optional(),
    postalCodeCity: z.string().trim().max(120).optional(),
    email: z.string().trim().email().max(160).optional(),
    phone: z.string().trim().max(80).optional(),
    taxMode: z.enum(['franchise_en_base', 'tva_active']).optional(),
    vatNumber: z.string().trim().max(40).nullable().optional(),
    mediatorName: z.string().trim().max(200).optional(),
    mediatorAddress: z.string().trim().max(200).optional(),
    sepaAccountHolder: z.string().trim().max(160).optional(),
    sepaIban: z.string().trim().max(80).optional(),
    sepaBic: z.string().trim().max(40).optional(),
    sepaBankName: z.string().trim().max(120).optional(),
    sepaRecommendedThresholdEurCents: z.number().int().min(10000).max(5000000).optional(),
  }),
});

const UpsertCatalogSchema = z.object({
  action: z.literal('upsert_catalog_item'),
  sku: z.string().trim().min(2).max(80),
  availability: z.enum(['available', 'reserved', 'sold', 'inquiry_only', 'external_publisher', 'not_for_sale']),
  priceEurCents: z.number().int().min(100).max(50000000).nullable(),
  editionRemaining: z.number().int().min(0).max(10000).nullable().optional(),
  dimensionsCm: z.string().trim().max(80).nullable().optional(),
});

const UpdateOrderStatusSchema = z.object({
  action: z.literal('update_order_status'),
  orderId: z.string().trim().min(4).max(80),
  status: z.enum([
    'pending_payment',
    'awaiting_sepa_transfer',
    'paid',
    'fulfilled',
    'withdrawal_requested',
    'refunded',
    'cancelled',
  ]),
});

export async function GET(request: NextRequest) {
  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const [legalConfig, catalog, orders, withdrawals, certificates, storageStatus] = await Promise.all([
    getCommerceLegalConfig(),
    getCommerceCatalog(),
    getCommerceOrders(),
    getCommerceWithdrawals(),
    getAuthenticityCertificates(),
    checkNeonConnectionHealth(),
  ]);

  const paidOrders = orders.filter((o) => o.status === 'paid' || o.status === 'fulfilled');
  const totalArtisteAuteurCents = paidOrders.reduce((s, o) => s + o.quote.artisteAuteurTotalCents, 0);
  const totalCommercialBicCents = paidOrders.reduce((s, o) => s + o.quote.commercialBicTotalCents, 0);

  return NextResponse.json(
    {
      ok: true,
      legalConfig,
      catalog,
      orders,
      withdrawals,
      certificates,
      storageStatus,
      stripeMode: getStripeRuntimeMode(),
      emailConfigured: isTransactionalEmailConfigured(),
      stats: {
        totalCatalogItems: catalog.length,
        availableCount: catalog.filter((c) => c.availability === 'available').length,
        totalOrders: orders.length,
        paidOrdersCount: paidOrders.length,
        pendingSepaCount: orders.filter((o) => o.status === 'awaiting_sepa_transfer').length,
        totalArtisteAuteurCents,
        totalCommercialBicCents,
        withdrawalCount: withdrawals.length,
        certificateCount: certificates.length,
      },
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function PATCH(request: NextRequest) {
  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const raw = await request.json();
    const action = raw?.action;

    if (action === 'update_legal_config') {
      const parsed = UpdateLegalConfigSchema.safeParse(raw);
      if (!parsed.success) {
        return NextResponse.json(
          { ok: false, error: 'Invalid legal configuration', issues: parsed.error.issues },
          { status: 400 }
        );
      }
      const updated = await saveCommerceLegalConfig(parsed.data.patch);
      return NextResponse.json({ ok: true, legalConfig: updated });
    }

    if (action === 'upsert_catalog_item') {
      const parsed = UpsertCatalogSchema.safeParse(raw);
      if (!parsed.success) {
        return NextResponse.json(
          { ok: false, error: 'Invalid catalog update', issues: parsed.error.issues },
          { status: 400 }
        );
      }
      const catalog = await getCommerceCatalog();
      const existing = catalog.find((c) => c.sku === parsed.data.sku);
      if (!existing) {
        return NextResponse.json({ ok: false, error: 'SKU not found' }, { status: 404 });
      }
      const updatedCatalog = await upsertCommerceCatalogItem({
        ...existing,
        availability: parsed.data.availability,
        priceEurCents: parsed.data.priceEurCents,
        editionRemaining:
          parsed.data.editionRemaining !== undefined
            ? parsed.data.editionRemaining
            : existing.editionRemaining,
        physicalSpecs:
          parsed.data.dimensionsCm !== undefined
            ? {
                ...(existing.physicalSpecs || {}),
                dimensionsCm: parsed.data.dimensionsCm,
              }
            : existing.physicalSpecs,
      });
      return NextResponse.json({ ok: true, catalog: updatedCatalog });
    }

    if (action === 'update_order_status') {
      const parsed = UpdateOrderStatusSchema.safeParse(raw);
      if (!parsed.success) {
        return NextResponse.json(
          { ok: false, error: 'Invalid order status payload', issues: parsed.error.issues },
          { status: 400 }
        );
      }
      const updatedOrder = await updateCommerceOrderStatus(parsed.data.orderId, parsed.data.status);
      if (!updatedOrder) {
        return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ ok: true, order: updatedOrder });
    }

    return NextResponse.json({ ok: false, error: 'Unsupported action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Update failed' },
      { status: 500 }
    );
  }
}
