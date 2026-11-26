import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { CommerceCatalogItem } from '@makaremi/shared';
import { isStudioRequestAuthorized } from '@/lib/studio/auth';
import {
  deleteCommerceCatalogItem,
  getAuthenticityCertificates,
  getCommerceCatalog,
  getCommerceLegalConfig,
  getCommerceOrders,
  getCommerceWithdrawals,
  saveCommerceLegalConfig,
  updateCommerceOrderStatus,
  upsertCommerceCatalogItem,
} from '@/lib/commerce/store';
import { COMMERCE_KIND_PRESETS, buildSuggestedSku } from '@/lib/commerce/presets';
import { getStripeRuntimeMode } from '@/lib/commerce/stripe';
import { isTransactionalEmailConfigured } from '@/lib/commerce/email';
import { checkNeonConnectionHealth } from '@/lib/commerce/db';
import { setLiveCommerceCatalogMirror } from '@/lib/studio/neon-cms-store';
import { syncEntityToRagKnowledgeBase } from '@/lib/rag/auto-indexer';

const LocalizedTextSchema = z.object({
  fa: z.string().trim().min(1).max(320),
  fr: z.string().trim().min(1).max(320),
  en: z.string().trim().min(1).max(320),
});

const OptionalLocalizedTextSchema = z
  .object({
    fa: z.string().trim().max(500).default(''),
    fr: z.string().trim().max(500).default(''),
    en: z.string().trim().max(500).default(''),
  })
  .nullable()
  .optional();

const CollectionEnum = z.enum(['artworks', 'books', 'poems', 'videos', 'patronage']);
const KindEnum = z.enum([
  'original_artwork',
  'fine_art_print',
  'book_physical_signed',
  'book_digital_ebook',
  'commission_inquiry',
  'patronage_edition',
]);
const AvailabilityEnum = z.enum([
  'available',
  'reserved',
  'sold',
  'inquiry_only',
  'external_publisher',
  'not_for_sale',
]);
const LegalBucketEnum = z.enum(['artiste_auteur', 'commercial_bic']);
const VatRateEnum = z.union([z.literal(0), z.literal(550), z.literal(2000)]);

const UpdateLegalConfigSchema = z.object({
  action: z.literal('update_legal_config'),
  patch: z.object({
    tradeName: z.string().trim().max(180).optional(),
    siret: z.string().trim().max(64).optional(),
    apeCode: z.string().trim().max(120).optional(),
    urssafArtisteAuteurRef: z.string().trim().max(160).optional(),
    addressLine1: z.string().trim().max(220).optional(),
    postalCodeCity: z.string().trim().max(120).optional(),
    email: z.string().trim().email().max(160).optional(),
    phone: z.string().trim().max(80).optional(),
    taxMode: z.enum(['franchise_en_base', 'tva_active']).optional(),
    vatNumber: z.string().trim().max(40).nullable().optional(),
    franchiseMentionFr: z.string().trim().max(200).optional(),
    mediatorName: z.string().trim().max(200).optional(),
    mediatorUrl: z.string().trim().max(240).optional(),
    mediatorAddress: z.string().trim().max(200).optional(),
    sepaAccountHolder: z.string().trim().max(160).optional(),
    sepaIban: z.string().trim().max(80).optional(),
    sepaBic: z.string().trim().max(40).optional(),
    sepaBankName: z.string().trim().max(120).optional(),
    sepaRecommendedThresholdEurCents: z.number().int().min(10000).max(5000000).optional(),
    eInvoicingPlatformName: z.string().trim().max(220).optional(),
  }),
});

const CreateCatalogItemSchema = z.object({
  sku: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{3,80}$/, 'کد SKU فقط می‌تواند شامل حروف انگلیسی، عدد، خط تیره و زیرخط باشد.')
    .optional(),
  collection: CollectionEnum,
  slug: z.string().trim().min(2).max(160),
  plateImageId: z.number().int().positive().nullable().optional(),
  imageUrl: z.string().trim().max(600).nullable().optional(),
  kind: KindEnum,
  legalBucket: LegalBucketEnum.optional(),
  availability: AvailabilityEnum.default('available'),
  priceEurCents: z.number().int().min(100).max(50000000).nullable(),
  vatRateBasisPoints: VatRateEnum.optional(),
  editionSize: z.number().int().min(1).max(10000).nullable().optional(),
  editionRemaining: z.number().int().min(0).max(10000).nullable().optional(),
  title: LocalizedTextSchema,
  subtitle: OptionalLocalizedTextSchema,
  description: OptionalLocalizedTextSchema,
  dimensionsCm: z.string().trim().max(100).nullable().optional(),
  medium: OptionalLocalizedTextSchema,
  weightGrams: z.number().int().min(10).max(100000).nullable().optional(),
  framed: z.boolean().optional(),
  paperOrSupport: z.string().trim().max(160).nullable().optional(),
  signedByArtist: z.boolean().optional(),
  numberedEdition: z.boolean().optional(),
  digitalAssetKey: z.string().trim().max(500).nullable().optional(),
  externalPublisherUrl: z.string().trim().max(500).nullable().optional(),
  externalPublisherLabel: z.string().trim().max(160).nullable().optional(),
  requiresWithdrawalWaiver: z.boolean().optional(),
  hsCode: z.string().trim().min(4).max(20).optional(),
  featured: z.boolean().optional(),
  year: z.number().int().min(1950).max(2100).nullable().optional(),
});

const UpsertCatalogSchema = z.object({
  action: z.literal('upsert_catalog_item'),
  sku: z.string().trim().min(2).max(80),
  collection: CollectionEnum.optional(),
  slug: z.string().trim().min(2).max(160).optional(),
  plateImageId: z.number().int().positive().nullable().optional(),
  imageUrl: z.string().trim().max(600).nullable().optional(),
  kind: KindEnum.optional(),
  legalBucket: LegalBucketEnum.optional(),
  availability: AvailabilityEnum,
  priceEurCents: z.number().int().min(100).max(50000000).nullable(),
  vatRateBasisPoints: VatRateEnum.optional(),
  editionSize: z.number().int().min(1).max(10000).nullable().optional(),
  editionRemaining: z.number().int().min(0).max(10000).nullable().optional(),
  title: LocalizedTextSchema.optional(),
  subtitle: OptionalLocalizedTextSchema,
  description: OptionalLocalizedTextSchema,
  dimensionsCm: z.string().trim().max(100).nullable().optional(),
  medium: OptionalLocalizedTextSchema,
  weightGrams: z.number().int().min(10).max(100000).nullable().optional(),
  framed: z.boolean().optional(),
  paperOrSupport: z.string().trim().max(160).nullable().optional(),
  signedByArtist: z.boolean().optional(),
  numberedEdition: z.boolean().optional(),
  digitalAssetKey: z.string().trim().max(500).nullable().optional(),
  externalPublisherUrl: z.string().trim().max(500).nullable().optional(),
  externalPublisherLabel: z.string().trim().max(160).nullable().optional(),
  requiresWithdrawalWaiver: z.boolean().optional(),
  hsCode: z.string().trim().min(4).max(20).optional(),
  featured: z.boolean().optional(),
  year: z.number().int().min(1950).max(2100).nullable().optional(),
});

const DeleteCatalogSchema = z.object({
  action: z.literal('delete_catalog_item'),
  sku: z.string().trim().min(2).max(80),
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

function normalizeOptionalLocalized(
  raw: { fa: string; fr: string; en: string } | null | undefined
): { fa: string; fr: string; en: string } | null {
  if (!raw) return null;
  const fa = raw.fa.trim();
  const fr = raw.fr.trim();
  const en = raw.en.trim();
  if (!fa && !fr && !en) return null;
  const fallback = fa || fr || en;
  return {
    fa: fa || fallback,
    fr: fr || en || fallback,
    en: en || fr || fallback,
  };
}

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

export async function POST(request: NextRequest) {
  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const raw = await request.json();
    const parsed = CreateCatalogItemSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'اطلاعات اثر جدید کامل یا معتبر نیست.', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const d = parsed.data;
    if (d.availability === 'available' && d.priceEurCents === null) {
      return NextResponse.json(
        { ok: false, error: 'برای آثار «قابل تملک (فعال)»، وارد کردن قیمت به یورو الزامی است.' },
        { status: 400 }
      );
    }

    const existingCatalog = await getCommerceCatalog();
    const existingSkus = new Set(existingCatalog.map((c) => c.sku.toUpperCase()));
    const preset = COMMERCE_KIND_PRESETS[d.kind];

    const finalSku = (
      d.sku?.toUpperCase() ||
      buildSuggestedSku({
        collection: d.collection,
        slug: d.slug,
        kind: d.kind,
        plateImageId: d.plateImageId ?? null,
        dimensionsCm: d.dimensionsCm ?? preset.defaultDimensionsCm,
        existingSkus,
      })
    ).trim();

    if (existingSkus.has(finalSku)) {
      return NextResponse.json(
        { ok: false, error: `کد SKU «${finalSku}» قبلاً در کاتالوگ ثبت شده است. لطفاً کد دیگری انتخاب کنید.` },
        { status: 409 }
      );
    }

    const resolvedEditionSize =
      d.kind === 'original_artwork'
        ? 1
        : d.editionSize !== undefined
          ? d.editionSize
          : preset.defaultEditionSize;

    const resolvedEditionRemaining =
      d.kind === 'original_artwork'
        ? d.availability === 'sold'
          ? 0
          : 1
        : d.editionRemaining !== undefined
          ? d.editionRemaining
          : resolvedEditionSize;

    const cleanMedium = normalizeOptionalLocalized(d.medium);
    const hasPhysicalSpecs = Boolean(
      d.dimensionsCm || cleanMedium || d.weightGrams || d.paperOrSupport || d.framed !== undefined || d.signedByArtist !== undefined
    );

    const newItem: CommerceCatalogItem = {
      sku: finalSku,
      collection: d.collection,
      slug: d.slug,
      plateImageId: d.plateImageId ?? null,
      imageUrl: d.imageUrl || null,
      kind: d.kind,
      legalBucket: d.legalBucket || preset.legalBucket,
      availability: d.availability,
      priceEurCents: d.priceEurCents,
      vatRateBasisPoints: d.vatRateBasisPoints ?? preset.vatRateBasisPoints,
      editionSize: resolvedEditionSize,
      editionRemaining: resolvedEditionRemaining,
      title: d.title,
      subtitle: normalizeOptionalLocalized(d.subtitle),
      description: normalizeOptionalLocalized(d.description),
      physicalSpecs: hasPhysicalSpecs
        ? {
            dimensionsCm: d.dimensionsCm ?? null,
            medium: cleanMedium,
            weightGrams: d.weightGrams ?? preset.defaultWeightGrams,
            framed: d.framed ?? false,
            paperOrSupport: d.paperOrSupport ?? null,
            signedByArtist: d.signedByArtist ?? preset.signedByArtist,
            numberedEdition: d.numberedEdition ?? preset.numberedEdition,
          }
        : null,
      digitalAssetKey: d.digitalAssetKey || null,
      externalPublisherUrl: d.externalPublisherUrl || null,
      externalPublisherLabel: d.externalPublisherLabel || null,
      requiresWithdrawalWaiver: d.requiresWithdrawalWaiver ?? preset.requiresWithdrawalWaiver,
      hsCode: d.hsCode || preset.hsCode,
      featured: d.featured ?? false,
      year: d.year ?? null,
      updatedAt: new Date().toISOString(),
    };

    const updatedCatalog = await upsertCommerceCatalogItem(newItem);
    setLiveCommerceCatalogMirror(updatedCatalog);
    await syncEntityToRagKnowledgeBase({
      collection: 'commerce',
      slug: finalSku,
      action: 'commerce',
      summary: `commerce_create:${finalSku}`,
    }).catch(() => undefined);
    const created = updatedCatalog.find((c) => c.sku === finalSku) || newItem;

    return NextResponse.json(
      { ok: true, item: created, catalog: updatedCatalog },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'ثبت اثر جدید ناموفق بود.' },
      { status: 500 }
    );
  }
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
      const d = parsed.data;
      if (d.availability === 'available' && d.priceEurCents === null) {
        return NextResponse.json(
          { ok: false, error: 'برای وضعیت «قابل تملک (فعال)»، وارد کردن قیمت به یورو الزامی است.' },
          { status: 400 }
        );
      }

      const catalog = await getCommerceCatalog();
      const existing = catalog.find((c) => c.sku === d.sku);
      if (!existing) {
        return NextResponse.json({ ok: false, error: 'SKU not found' }, { status: 404 });
      }

      const nextKind = d.kind ?? existing.kind;
      const preset = COMMERCE_KIND_PRESETS[nextKind];
      const nextMedium =
        d.medium !== undefined ? normalizeOptionalLocalized(d.medium) : existing.physicalSpecs?.medium;

      const updatedItem: CommerceCatalogItem = {
        ...existing,
        collection: d.collection ?? existing.collection,
        slug: d.slug ?? existing.slug,
        plateImageId: d.plateImageId !== undefined ? d.plateImageId : existing.plateImageId,
        // If plate changed and no explicit imageUrl was passed, clear cached imageUrl so hydration picks the new plate
        imageUrl:
          d.imageUrl !== undefined
            ? d.imageUrl
            : d.plateImageId !== undefined && d.plateImageId !== existing.plateImageId
              ? null
              : existing.imageUrl,
        kind: nextKind,
        legalBucket: d.legalBucket ?? existing.legalBucket,
        availability: d.availability,
        priceEurCents: d.priceEurCents,
        vatRateBasisPoints: d.vatRateBasisPoints ?? existing.vatRateBasisPoints,
        editionSize:
          nextKind === 'original_artwork'
            ? 1
            : d.editionSize !== undefined
              ? d.editionSize
              : existing.editionSize,
        editionRemaining:
          nextKind === 'original_artwork'
            ? d.availability === 'sold'
              ? 0
              : 1
            : d.editionRemaining !== undefined
              ? d.editionRemaining
              : existing.editionRemaining,
        title: d.title ?? existing.title,
        subtitle:
          d.subtitle !== undefined ? normalizeOptionalLocalized(d.subtitle) : existing.subtitle,
        description:
          d.description !== undefined
            ? normalizeOptionalLocalized(d.description)
            : existing.description,
        physicalSpecs: {
          ...(existing.physicalSpecs || {}),
          dimensionsCm:
            d.dimensionsCm !== undefined ? d.dimensionsCm : existing.physicalSpecs?.dimensionsCm,
          medium: nextMedium,
          weightGrams:
            d.weightGrams !== undefined ? d.weightGrams : existing.physicalSpecs?.weightGrams,
          framed: d.framed !== undefined ? d.framed : existing.physicalSpecs?.framed,
          paperOrSupport:
            d.paperOrSupport !== undefined
              ? d.paperOrSupport
              : existing.physicalSpecs?.paperOrSupport,
          signedByArtist:
            d.signedByArtist !== undefined
              ? d.signedByArtist
              : existing.physicalSpecs?.signedByArtist ?? preset.signedByArtist,
          numberedEdition:
            d.numberedEdition !== undefined
              ? d.numberedEdition
              : existing.physicalSpecs?.numberedEdition ?? preset.numberedEdition,
        },
        digitalAssetKey:
          d.digitalAssetKey !== undefined ? d.digitalAssetKey : existing.digitalAssetKey,
        externalPublisherUrl:
          d.externalPublisherUrl !== undefined
            ? d.externalPublisherUrl
            : existing.externalPublisherUrl,
        externalPublisherLabel:
          d.externalPublisherLabel !== undefined
            ? d.externalPublisherLabel
            : existing.externalPublisherLabel,
        requiresWithdrawalWaiver:
          d.requiresWithdrawalWaiver !== undefined
            ? d.requiresWithdrawalWaiver
            : existing.requiresWithdrawalWaiver,
        hsCode: d.hsCode ?? existing.hsCode,
        featured: d.featured !== undefined ? d.featured : existing.featured,
        year: d.year !== undefined ? d.year : existing.year,
        updatedAt: new Date().toISOString(),
      };

      const updatedCatalog = await upsertCommerceCatalogItem(updatedItem);
      setLiveCommerceCatalogMirror(updatedCatalog);
      await syncEntityToRagKnowledgeBase({
        collection: 'commerce',
        slug: d.sku,
        action: 'commerce',
        summary: `commerce_upsert:${d.sku}`,
      }).catch(() => undefined);
      return NextResponse.json({ ok: true, catalog: updatedCatalog });
    }

    if (action === 'delete_catalog_item') {
      const parsed = DeleteCatalogSchema.safeParse(raw);
      if (!parsed.success) {
        return NextResponse.json({ ok: false, error: 'Invalid SKU for deletion' }, { status: 400 });
      }
      const updatedCatalog = await deleteCommerceCatalogItem(parsed.data.sku);
      setLiveCommerceCatalogMirror(updatedCatalog);
      await syncEntityToRagKnowledgeBase({
        collection: 'commerce',
        slug: parsed.data.sku,
        action: 'commerce',
        summary: `commerce_delete:${parsed.data.sku}`,
      }).catch(() => undefined);
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

export async function DELETE(request: NextRequest) {
  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sku = request.nextUrl.searchParams.get('sku')?.trim() || '';
    if (!sku) {
      return NextResponse.json({ ok: false, error: 'Missing sku parameter' }, { status: 400 });
    }
    const updatedCatalog = await deleteCommerceCatalogItem(sku);
    setLiveCommerceCatalogMirror(updatedCatalog);
    await syncEntityToRagKnowledgeBase({
      collection: 'commerce',
      slug: sku,
      action: 'commerce',
      summary: `commerce_delete:${sku}`,
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, catalog: updatedCatalog });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Delete failed' },
      { status: 500 }
    );
  }
}
