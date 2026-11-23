'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Scale,
  Receipt,
  Download,
  CheckCircle2,
  ShieldCheck,
  Landmark,
  RotateCcw,
  Save,
  RefreshCw,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Image as ImageIcon,
  Star,
  AlertCircle,
  X,
} from 'lucide-react';
import type {
  ArtworkAuthenticityCertificate,
  CommerceArchiveOptionsPayload,
  CommerceAvailability,
  CommerceCatalogItem,
  CommerceLegalConfig,
  CommerceOrder,
  CommerceProductKind,
  CommerceWithdrawalRequest,
  LegalEntityBucket,
} from '@makaremi/shared';
import { formatEur } from '@/lib/commerce/rules';
import {
  COMMERCE_AVAILABILITY_OPTIONS,
  COMMERCE_DIMENSION_PRESETS,
  COMMERCE_KIND_LIST,
  COMMERCE_KIND_PRESETS,
  COMMERCE_MEDIUM_PRESETS,
} from '@/lib/commerce/presets';
import { AccessibleListbox, type ListboxOption } from './AccessibleListbox';
import { StudioCommerceAddDrawer } from './StudioCommerceAddDrawer';

interface StudioCommercePayload {
  legalConfig: CommerceLegalConfig;
  catalog: CommerceCatalogItem[];
  orders: CommerceOrder[];
  withdrawals: CommerceWithdrawalRequest[];
  certificates: ArtworkAuthenticityCertificate[];
  storageStatus?: {
    mode: 'neon_postgres' | 'local_file_fallback';
    configured: boolean;
    providerLabel: string;
    regionHint: string | null;
    healthy?: boolean;
  };
  stripeMode: 'live' | 'test' | 'unconfigured';
  emailConfigured: boolean;
  stats: {
    totalCatalogItems: number;
    availableCount: number;
    totalOrders: number;
    paidOrdersCount: number;
    pendingSepaCount: number;
    totalArtisteAuteurCents: number;
    totalCommercialBicCents: number;
    withdrawalCount: number;
    certificateCount: number;
  };
}

interface FullEditDraft {
  titleFa: string;
  titleFr: string;
  titleEn: string;
  subtitleFa: string;
  subtitleFr: string;
  subtitleEn: string;
  kind: CommerceProductKind;
  legalBucket: LegalEntityBucket;
  vatRateBasisPoints: 0 | 550 | 2000;
  hsCode: string;
  editionSize: string;
  editionRemaining: string;
  plateImageId: string;
  mediumPresetKey: string;
  customMediumFa: string;
  customMediumFr: string;
  customMediumEn: string;
  digitalAssetKey: string;
  externalPublisherUrl: string;
  year: string;
  weightGrams: string;
  featured: boolean;
  framed: boolean;
  signedByArtist: boolean;
  requiresWithdrawalWaiver: boolean;
}

function buildFullEditDraft(item: CommerceCatalogItem): FullEditDraft {
  const matchedMedium = COMMERCE_MEDIUM_PRESETS.find(
    (m) => m.key !== '__custom__' && item.physicalSpecs?.medium?.fa && m.medium.fa === item.physicalSpecs.medium.fa
  );
  return {
    titleFa: item.title.fa,
    titleFr: item.title.fr,
    titleEn: item.title.en,
    subtitleFa: item.subtitle?.fa || '',
    subtitleFr: item.subtitle?.fr || '',
    subtitleEn: item.subtitle?.en || '',
    kind: item.kind,
    legalBucket: item.legalBucket,
    vatRateBasisPoints: item.vatRateBasisPoints,
    hsCode: item.hsCode,
    editionSize: item.editionSize != null ? String(item.editionSize) : '',
    editionRemaining: item.editionRemaining != null ? String(item.editionRemaining) : '',
    plateImageId: item.plateImageId != null ? String(item.plateImageId) : '',
    mediumPresetKey: matchedMedium ? matchedMedium.key : item.physicalSpecs?.medium?.fa ? '__custom__' : COMMERCE_KIND_PRESETS[item.kind].defaultMediumKey,
    customMediumFa: item.physicalSpecs?.medium?.fa || '',
    customMediumFr: item.physicalSpecs?.medium?.fr || '',
    customMediumEn: item.physicalSpecs?.medium?.en || '',
    digitalAssetKey: item.digitalAssetKey || '',
    externalPublisherUrl: item.externalPublisherUrl || '',
    year: item.year != null ? String(item.year) : '',
    weightGrams: item.physicalSpecs?.weightGrams != null ? String(item.physicalSpecs.weightGrams) : '',
    featured: Boolean(item.featured),
    framed: Boolean(item.physicalSpecs?.framed),
    signedByArtist: item.physicalSpecs?.signedByArtist ?? true,
    requiresWithdrawalWaiver: Boolean(item.requiresWithdrawalWaiver),
  };
}

export function StudioCommercePanel() {
  const [data, setData] = useState<StudioCommercePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'catalog' | 'orders' | 'legal' | 'accounting'>('catalog');
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [savingSku, setSavingSku] = useState<string | null>(null);
  const [deletingSku, setDeletingSku] = useState<string | null>(null);
  const [confirmDeleteSku, setConfirmDeleteSku] = useState<string | null>(null);
  const [savingLegal, setSavingLegal] = useState(false);

  // Add New Work Drawer + Archive Options (lazy loaded for cascading dropdowns)
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [archiveOptions, setArchiveOptions] = useState<CommerceArchiveOptionsPayload | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);

  // Catalog search & dropdown filters
  const [catalogQuery, setCatalogQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');

  // Inline quick-edit drafts keyed by SKU
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [availDrafts, setAvailDrafts] = useState<Record<string, CommerceAvailability>>({});
  const [dimDrafts, setDimDrafts] = useState<Record<string, string>>({});

  // Expanded full-edit row state
  const [expandedSku, setExpandedSku] = useState<string | null>(null);
  const [fullDraft, setFullDraft] = useState<FullEditDraft | null>(null);

  // Editable legal config form
  const [legalDraft, setLegalDraft] = useState<Partial<CommerceLegalConfig>>({});
  const [sepaThresholdEur, setSepaThresholdEur] = useState<string>('2500');

  const syncDraftsFromCatalog = useCallback((catalog: CommerceCatalogItem[]) => {
    const pMap: Record<string, string> = {};
    const aMap: Record<string, CommerceAvailability> = {};
    const dMap: Record<string, string> = {};
    for (const item of catalog) {
      pMap[item.sku] = item.priceEurCents !== null ? String(item.priceEurCents / 100) : '';
      aMap[item.sku] = item.availability;
      dMap[item.sku] = item.physicalSpecs?.dimensionsCm || '';
    }
    setPriceDrafts(pMap);
    setAvailDrafts(aMap);
    setDimDrafts(dMap);
  }, []);

  const loadArchiveOptions = useCallback(async () => {
    if (archiveOptions || archiveLoading) return;
    setArchiveLoading(true);
    try {
      const res = await fetch('/api/studio/commerce/archive-options', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.ok) {
        setArchiveOptions({
          counts: json.counts,
          artworks: json.artworks,
          books: json.books,
          poems: json.poems,
          videos: json.videos,
        });
      }
    } catch {
      // Non-fatal: user can retry
    } finally {
      setArchiveLoading(false);
    }
  }, [archiveOptions, archiveLoading]);

  const loadCommerce = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/studio/commerce', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.ok) {
        setData(json);
        setLegalDraft(json.legalConfig || {});
        setSepaThresholdEur(
          String(Math.round((json.legalConfig?.sepaRecommendedThresholdEurCents || 250000) / 100))
        );
        syncDraftsFromCatalog(json.catalog as CommerceCatalogItem[]);
      }
    } catch {
      setFeedback({ kind: 'err', text: 'خطا در بارگذاری اطلاعات فروشگاه پیشخوان.' });
    } finally {
      setLoading(false);
    }
  }, [syncDraftsFromCatalog]);

  useEffect(() => {
    loadCommerce();
  }, [loadCommerce]);

  // Prefetch archive dropdown options quietly once commerce payload is ready
  useEffect(() => {
    if (data && !archiveOptions && !archiveLoading) {
      loadArchiveOptions();
    }
  }, [data, archiveOptions, archiveLoading, loadArchiveOptions]);

  const openAddDrawer = () => {
    setSubTab('catalog');
    setAddDrawerOpen(true);
    setExpandedSku(null);
    setFeedback(null);
    if (!archiveOptions) {
      loadArchiveOptions();
    }
  };

  const toggleFullEdit = (item: CommerceCatalogItem) => {
    if (expandedSku === item.sku) {
      setExpandedSku(null);
      setFullDraft(null);
    } else {
      setExpandedSku(item.sku);
      setFullDraft(buildFullEditDraft(item));
      setConfirmDeleteSku(null);
      if (!archiveOptions) {
        loadArchiveOptions();
      }
    }
  };

  const handleSaveSku = async (item: CommerceCatalogItem, includeFullDraft = false) => {
    setSavingSku(item.sku);
    setFeedback(null);
    const rawPrice = (priceDrafts[item.sku] || '').trim();
    const numericEur = rawPrice === '' ? null : Math.round(Number(rawPrice) * 100);
    const nextAvail = availDrafts[item.sku] || item.availability;

    if (nextAvail === 'available' && (numericEur === null || !Number.isFinite(numericEur) || numericEur < 100)) {
      setFeedback({ kind: 'err', text: 'برای وضعیت «قابل تملک (فعال)»، وارد کردن مبلغ معتبر (حداقل ۱ یورو) الزامی است.' });
      setSavingSku(null);
      return;
    }
    if (numericEur !== null && (!Number.isFinite(numericEur) || numericEur < 100)) {
      setFeedback({ kind: 'err', text: 'مبلغ یورو نامعتبر است (حداقل ۱ یورو یا فیلد خالی برای استعلام).' });
      setSavingSku(null);
      return;
    }

    const body: Record<string, unknown> = {
      action: 'upsert_catalog_item',
      sku: item.sku,
      availability: nextAvail,
      priceEurCents: numericEur,
      dimensionsCm: (dimDrafts[item.sku] || '').trim() || null,
    };

    if (includeFullDraft && fullDraft && expandedSku === item.sku) {
      const mediumPreset = COMMERCE_MEDIUM_PRESETS.find((m) => m.key === fullDraft.mediumPresetKey);
      const resolvedMedium =
        fullDraft.mediumPresetKey === '__custom__'
          ? fullDraft.customMediumFa.trim()
            ? {
                fa: fullDraft.customMediumFa.trim(),
                fr: fullDraft.customMediumFr.trim() || fullDraft.customMediumFa.trim(),
                en: fullDraft.customMediumEn.trim() || fullDraft.customMediumFr.trim() || fullDraft.customMediumFa.trim(),
              }
            : null
          : mediumPreset?.medium.fa
            ? mediumPreset.medium
            : null;

      Object.assign(body, {
        title: {
          fa: fullDraft.titleFa.trim() || item.title.fa,
          fr: fullDraft.titleFr.trim() || item.title.fr,
          en: fullDraft.titleEn.trim() || item.title.en,
        },
        subtitle:
          fullDraft.subtitleFa.trim() || fullDraft.subtitleFr.trim() || fullDraft.subtitleEn.trim()
            ? {
                fa: fullDraft.subtitleFa.trim(),
                fr: fullDraft.subtitleFr.trim(),
                en: fullDraft.subtitleEn.trim(),
              }
            : null,
        kind: fullDraft.kind,
        legalBucket: fullDraft.legalBucket,
        vatRateBasisPoints: fullDraft.vatRateBasisPoints,
        hsCode: fullDraft.hsCode.trim() || item.hsCode,
        editionSize: fullDraft.editionSize.trim() ? Number(fullDraft.editionSize) : null,
        editionRemaining: fullDraft.editionRemaining.trim() ? Number(fullDraft.editionRemaining) : null,
        plateImageId: fullDraft.plateImageId.trim() ? Number(fullDraft.plateImageId) : null,
        medium: resolvedMedium,
        digitalAssetKey: fullDraft.digitalAssetKey.trim() || null,
        externalPublisherUrl: fullDraft.externalPublisherUrl.trim() || null,
        year: fullDraft.year.trim() ? Number(fullDraft.year) : null,
        weightGrams: fullDraft.weightGrams.trim() ? Number(fullDraft.weightGrams) : null,
        featured: fullDraft.featured,
        framed: fullDraft.framed,
        signedByArtist: fullDraft.signedByArtist,
        requiresWithdrawalWaiver: fullDraft.requiresWithdrawalWaiver,
      });
    }

    try {
      const res = await fetch('/api/studio/commerce', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setFeedback({ kind: 'err', text: json.error || 'ذخیره تغییر ناموفق بود.' });
      } else {
        setFeedback({
          kind: 'ok',
          text: `تغییرات اثر ${item.sku} با موفقیت ذخیره و در فروشگاه زنده اعمال شد.`,
        });
        if (includeFullDraft) {
          setExpandedSku(null);
          setFullDraft(null);
        }
        await loadCommerce();
      }
    } catch {
      setFeedback({ kind: 'err', text: 'خطای ارتباط با سرور.' });
    } finally {
      setSavingSku(null);
    }
  };

  const handleDeleteSku = async (skuToRemove: string) => {
    setDeletingSku(skuToRemove);
    setFeedback(null);
    try {
      const res = await fetch(`/api/studio/commerce?sku=${encodeURIComponent(skuToRemove)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setFeedback({ kind: 'err', text: json.error || 'حذف اثر از فروشگاه ناموفق بود.' });
      } else {
        setConfirmDeleteSku(null);
        if (expandedSku === skuToRemove) {
          setExpandedSku(null);
          setFullDraft(null);
        }
        setFeedback({
          kind: 'ok',
          text: `اثر ${skuToRemove} از فهرست فروشگاه حذف شد (سفارش‌ها و گواهی‌های اصالت پیشین بدون تغییر حفظ می‌شوند).`,
        });
        await loadCommerce();
      }
    } catch {
      setFeedback({ kind: 'err', text: 'خطای ارتباط با سرور هنگام حذف.' });
    } finally {
      setDeletingSku(null);
    }
  };

  const handleSaveLegal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLegal(true);
    setFeedback(null);
    const parsedThresholdCents = Math.max(
      10000,
      Math.min(5000000, Math.round((Number(sepaThresholdEur) || 2500) * 100))
    );
    try {
      const res = await fetch('/api/studio/commerce', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_legal_config',
          patch: {
            tradeName: legalDraft.tradeName,
            siret: legalDraft.siret,
            apeCode: legalDraft.apeCode,
            urssafArtisteAuteurRef: legalDraft.urssafArtisteAuteurRef,
            addressLine1: legalDraft.addressLine1,
            postalCodeCity: legalDraft.postalCodeCity,
            email: legalDraft.email,
            phone: legalDraft.phone,
            taxMode: legalDraft.taxMode,
            vatNumber: legalDraft.vatNumber || null,
            mediatorName: legalDraft.mediatorName,
            mediatorUrl: legalDraft.mediatorUrl,
            mediatorAddress: legalDraft.mediatorAddress,
            sepaAccountHolder: legalDraft.sepaAccountHolder,
            sepaIban: legalDraft.sepaIban,
            sepaBic: legalDraft.sepaBic,
            sepaBankName: legalDraft.sepaBankName,
            sepaRecommendedThresholdEurCents: parsedThresholdCents,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setFeedback({ kind: 'err', text: json.error || 'ذخیره تنظیمات حقوقی ناموفق بود.' });
      } else {
        setFeedback({
          kind: 'ok',
          text: 'مشخصات حقوقی فرانسه (SIRET، TVA، میانجی و حساب SEPA) ذخیره و در کل صفحات قانونی و فاکتورها اعمال شد.',
        });
        await loadCommerce();
      }
    } catch {
      setFeedback({ kind: 'err', text: 'خطای ارتباط با سرور.' });
    } finally {
      setSavingLegal(false);
    }
  };

  const handleOrderStatus = async (orderId: string, status: CommerceOrder['status']) => {
    setFeedback(null);
    try {
      const res = await fetch('/api/studio/commerce', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_order_status',
          orderId,
          status,
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setFeedback({
          kind: 'ok',
          text:
            status === 'paid'
              ? 'واریز تأیید شد؛ فاکتور نهایی و گواهی اصالت رمزنگاری‌شده Ed25519 به‌صورت خودکار صادر گردید.'
              : 'وضعیت سفارش به‌روزرسانی شد.',
        });
        await loadCommerce();
      } else {
        setFeedback({ kind: 'err', text: json.error || 'خطا در تغییر وضعیت سفارش.' });
      }
    } catch {
      setFeedback({ kind: 'err', text: 'خطا در ارتباط با سرور.' });
    }
  };

  // Filtered catalog list
  const filteredCatalog = useMemo(() => {
    if (!data) return [];
    const q = catalogQuery.trim().toLowerCase();
    return data.catalog.filter((item) => {
      if (kindFilter !== 'all' && item.kind !== kindFilter) return false;
      if (availabilityFilter !== 'all' && item.availability !== availabilityFilter) return false;
      if (q) {
        const hay = `${item.sku} ${item.slug} ${item.title.fa} ${item.title.fr} ${item.title.en} ${item.physicalSpecs?.dimensionsCm || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, catalogQuery, kindFilter, availabilityFilter]);

  const kindFilterOptions: ListboxOption<string>[] = useMemo(
    () => [
      { value: 'all', label: 'همه انواع آثار', badge: String(data?.catalog.length || 0) },
      ...COMMERCE_KIND_LIST.map((k) => ({
        value: k.kind,
        label: k.shortLabelFa,
        badge: String((data?.catalog || []).filter((c) => c.kind === k.kind).length),
      })),
    ],
    [data]
  );

  const availFilterOptions: ListboxOption<string>[] = useMemo(
    () => [
      { value: 'all', label: 'همه وضعیت‌ها', badge: String(data?.catalog.length || 0) },
      ...COMMERCE_AVAILABILITY_OPTIONS.map((a) => ({
        value: a.value,
        label: a.labelFa,
        badge: String((data?.catalog || []).filter((c) => c.availability === a.value).length),
      })),
    ],
    [data]
  );

  const inlineAvailabilityOptions: ListboxOption<CommerceAvailability>[] = useMemo(
    () =>
      COMMERCE_AVAILABILITY_OPTIONS.map((a) => ({
        value: a.value,
        label: a.labelFa,
        badge: a.badge,
      })),
    []
  );

  const artworkPlatesBySlug = useMemo(() => {
    const map = new Map<string, Array<{ id: number; title: string; imageUrl: string }>>();
    for (const art of archiveOptions?.artworks || []) {
      if (art.plates && art.plates.length > 0) {
        map.set(art.slug, art.plates);
      }
    }
    return map;
  }, [archiveOptions]);

  if (loading || !data) {
    return (
      <div className="p-8 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-center text-sm text-[var(--foreground-muted)]">
        در حال بارگذاری میز مدیریت فروشگاه و مقررات فرانسه...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Header Row (BiDi-Safe RTL Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-1">
          <span className="text-xs text-[var(--foreground-muted)]">آثار فعال در فروشگاه</span>
          <p className="text-2xl font-black text-[var(--foreground)] font-mono tabular-nums">
            <span dir="ltr" className="inline-block">
              {data.stats.availableCount} / {data.stats.totalCatalogItems}
            </span>
          </p>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
            تابلو اصل، چاپ فاخر و کتاب
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-1">
          <span className="text-xs text-[var(--foreground-muted)]">سفارش‌ها و واریزهای SEPA</span>
          <p className="text-2xl font-black text-[var(--foreground)] font-mono tabular-nums flex items-baseline gap-2">
            <span dir="ltr">{data.stats.totalOrders}</span>
            <span className="text-xs font-sans font-bold text-[var(--foreground-muted)]">سفارش ثبت‌شده</span>
          </p>
          <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold block">
            در انتظار SEPA: {data.stats.pendingSepaCount} • گواهی اصالت: {data.stats.certificateCount}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-1">
          <span className="text-xs text-[var(--foreground-muted)]">درآمد هنرمند-مؤلف (URSSAF)</span>
          <p className="text-2xl font-black text-[var(--primary)] font-mono tabular-nums">
            <span dir="ltr" className="inline-block">
              {formatEur(data.stats.totalArtisteAuteurCents, 'fr')}
            </span>
          </p>
          <span className="text-[11px] text-[var(--foreground-muted)] block">
            سقف معافیت TVA:{' '}
            <span dir="ltr" className="font-mono font-bold">
              50 000 €
            </span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-1">
          <span className="text-xs text-[var(--foreground-muted)]">دیتابیس دائمی و درگاه پرداخت</span>
          <p className="text-sm font-black text-[var(--foreground)]">
            {data.storageStatus?.mode === 'neon_postgres' ? (
              <span className="text-emerald-700 dark:text-emerald-400">
                Neon Postgres متصل ({data.storageStatus.regionHint || 'EU'})
              </span>
            ) : (
              <span>حالت پیش‌نمایش محلی (آماده Neon)</span>
            )}
          </p>
          <span className="text-[11px] text-[var(--foreground-muted)] block">
            درگاه Stripe: {data.stripeMode === 'live' ? 'زنده' : data.stripeMode === 'test' ? 'تست' : 'آماده اتصال (SEPA فعال)'} • TVA:{' '}
            {data.legalConfig.taxMode === 'franchise_en_base' ? 'معاف 293 B' : 'فعال'}
          </span>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 ${
            feedback.kind === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-500/10 border-red-500/35 text-red-700 dark:text-red-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.kind === 'ok' ? (
              <CheckCircle2 size={16} className="shrink-0" />
            ) : (
              <AlertCircle size={16} className="shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            aria-label="بستن پیام"
            onClick={() => setFeedback(null)}
            className="p-1 opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Sub-navigation + Prominent Add New Work CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'catalog', label: `کاتالوگ و قیمت‌گذاری (${data.stats.totalCatalogItems})`, icon: ShoppingBag },
              { id: 'orders', label: `سفارش‌ها و انصراف‌ها (${data.stats.totalOrders})`, icon: Landmark },
              { id: 'legal', label: 'تنظیمات حقوقی فرانسه (SIRET / SEPA / TVA)', icon: Scale },
              { id: 'accounting', label: 'دفتر درآمد (Livre de recettes)', icon: Receipt },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            const active = subTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSubTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'bg-[var(--surface-card)] border-[var(--border-subtle)] text-[var(--foreground)] hover:border-[var(--primary)]'
                }`}
              >
                <Icon size={15} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openAddDrawer}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-sm transition-colors cursor-pointer"
          >
            <Plus size={15} />
            <span>افزودن اثر جدید به فروشگاه</span>
          </button>

          <button
            type="button"
            onClick={loadCommerce}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs font-bold hover:border-[var(--primary)] cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>بروزرسانی</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CATALOG & PRICING */}
      {subTab === 'catalog' && (
        <div className="space-y-4">
          {/* Cascading Dropdown Add-New-Work Drawer */}
          {addDrawerOpen && (
            <StudioCommerceAddDrawer
              archiveOptions={archiveOptions}
              archiveLoading={archiveLoading}
              existingCatalog={data.catalog}
              onClose={() => setAddDrawerOpen(false)}
              onCreated={(created, updatedCatalog) => {
                setAddDrawerOpen(false);
                setFeedback({
                  kind: 'ok',
                  text: `اثر جدید «${created.title.fa}» (${created.sku}) با موفقیت به فروشگاه زنده افزوده شد.`,
                });
                setData((prev) =>
                  prev
                    ? {
                        ...prev,
                        catalog: updatedCatalog,
                        stats: {
                          ...prev.stats,
                          totalCatalogItems: updatedCatalog.length,
                          availableCount: updatedCatalog.filter((c) => c.availability === 'available').length,
                        },
                      }
                    : prev
                );
                syncDraftsFromCatalog(updatedCatalog);
              }}
            />
          )}

          {/* Filter & Search Bar for Catalog */}
          <div className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-5">
              <label className="block text-[10px] font-bold text-[var(--foreground-muted)] mb-1">
                جستجو در کاتالوگ فروشگاه
              </label>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute top-1/2 -translate-y-1/2 start-3 text-[var(--foreground-muted)] pointer-events-none"
                />
                <input
                  type="search"
                  value={catalogQuery}
                  onChange={(e) => setCatalogQuery(e.target.value)}
                  placeholder="نام اثر، عنوان فرانسوی، ابعاد یا کد SKU..."
                  className="w-full min-h-[38px] ps-9 pe-3 py-1.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs focus:outline-none focus:border-[var(--primary)]"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <AccessibleListbox
                label="فیلتر نوع اثر"
                compact
                value={kindFilter}
                options={kindFilterOptions}
                onChange={setKindFilter}
              />
            </div>

            <div className="md:col-span-3">
              <AccessibleListbox
                label="فیلتر وضعیت موجودی"
                compact
                value={availabilityFilter}
                options={availFilterOptions}
                onChange={setAvailabilityFilter}
              />
            </div>

            <div className="md:col-span-1 text-center md:text-end pb-1.5">
              <span className="text-[11px] font-bold text-[var(--foreground-muted)] whitespace-nowrap">
                {filteredCatalog.length} از {data.catalog.length}
              </span>
            </div>
          </div>

          {/* Catalog Items List */}
          {filteredCatalog.length === 0 ? (
            <div className="p-10 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-center space-y-3">
              <p className="text-xs font-bold text-[var(--foreground-muted)]">
                اثری مطابق فیلتر فعلی یافت نشد.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCatalogQuery('');
                  setKindFilter('all');
                  setAvailabilityFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs font-bold hover:border-[var(--primary)] cursor-pointer"
              >
                پاک کردن فیلترها
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCatalog.map((item) => {
                const isExpanded = expandedSku === item.sku && fullDraft !== null;
                const seriesPlates = item.collection === 'artworks' ? artworkPlatesBySlug.get(item.slug) || [] : [];

                return (
                  <div
                    key={item.sku}
                    className={`rounded-2xl bg-[var(--surface-card)] border transition-colors ${
                      isExpanded ? 'border-[var(--primary)] shadow-md' : 'border-[var(--border-subtle)]'
                    }`}
                  >
                    {/* Main Quick-Edit Row */}
                    <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                      {/* Thumbnail + Titles & Badges */}
                      <div className="lg:col-span-5 flex items-start gap-3 min-w-0">
                        <div className="w-16 h-16 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] overflow-hidden shrink-0 flex items-center justify-center">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.title.fa}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon size={20} className="text-[var(--foreground-muted)]" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                            <span
                              dir="ltr"
                              className="px-2 py-0.5 rounded bg-[var(--surface-sunken)] font-mono font-bold text-[var(--primary)]"
                            >
                              {item.sku}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold">
                              {item.legalBucket === 'artiste_auteur' ? 'URSSAF هنرمند-مؤلف' : 'بازتولید/تجاری BIC'}
                            </span>
                            <span dir="ltr" className="font-mono text-[var(--foreground-muted)]">
                              HS: {item.hsCode}
                            </span>
                            {item.editionSize && item.editionSize > 1 && (
                              <span
                                dir="ltr"
                                className="px-1.5 py-0.5 rounded bg-[var(--surface-sunken)] font-mono text-[var(--foreground-muted)]"
                              >
                                {item.editionRemaining ?? item.editionSize}/{item.editionSize}
                              </span>
                            )}
                            {item.featured && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold">
                                <Star size={10} />
                                <span>ویژه</span>
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-[var(--foreground)] leading-snug">
                            {item.title.fa}
                          </p>
                          <p dir="ltr" className="text-[11px] text-[var(--foreground-muted)] text-end truncate">
                            {item.title.fr}
                          </p>
                        </div>
                      </div>

                      {/* Price (LTR) */}
                      <div className="lg:col-span-2">
                        <label className="block text-[10px] font-bold text-[var(--foreground-muted)] mb-1">
                          قیمت (یورو €)
                        </label>
                        <input
                          type="number"
                          dir="ltr"
                          step="0.5"
                          min="1"
                          value={priceDrafts[item.sku] ?? ''}
                          onChange={(e) => setPriceDrafts((prev) => ({ ...prev, [item.sku]: e.target.value }))}
                          className="w-full min-h-[38px] px-3 py-1.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs font-mono text-left focus:outline-none focus:border-[var(--primary)]"
                        />
                      </div>

                      {/* Dimensions (LTR — Fixes reversed "cm 100 × 70"!) */}
                      <div className="lg:col-span-2">
                        <label className="block text-[10px] font-bold text-[var(--foreground-muted)] mb-1">
                          ابعاد (مثلاً <span dir="ltr" className="font-mono">70 × 100 cm</span>)
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          value={dimDrafts[item.sku] ?? ''}
                          onChange={(e) => setDimDrafts((prev) => ({ ...prev, [item.sku]: e.target.value }))}
                          placeholder="50 × 70 cm"
                          className="w-full min-h-[38px] px-3 py-1.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs font-mono text-left focus:outline-none focus:border-[var(--primary)]"
                        />
                      </div>

                      {/* Availability Dropdown (AccessibleListbox) */}
                      <div className="lg:col-span-2">
                        <AccessibleListbox
                          label="وضعیت موجودی"
                          compact
                          value={availDrafts[item.sku] || item.availability}
                          options={inlineAvailabilityOptions}
                          onChange={(nextVal) =>
                            setAvailDrafts((prev) => ({ ...prev, [item.sku]: nextVal }))
                          }
                        />
                      </div>

                      {/* Row Actions: Quick Save + Full Edit + Delete */}
                      <div className="lg:col-span-1 flex lg:flex-col items-stretch gap-1.5 justify-end">
                        <button
                          type="button"
                          disabled={savingSku === item.sku}
                          onClick={() => handleSaveSku(item, false)}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold disabled:opacity-50 cursor-pointer"
                        >
                          <Save size={13} />
                          <span>ذخیره</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title="ویرایش کامل جزئیات، عناوین سه‌زبانه و تابلو"
                            onClick={() => toggleFullEdit(item)}
                            className={`flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer ${
                              isExpanded
                                ? 'bg-[var(--primary-light)] border-[var(--primary)] text-[var(--primary)]'
                                : 'bg-[var(--surface-sunken)] border-[var(--border-subtle)] text-[var(--foreground-muted)] hover:border-[var(--primary)] hover:text-[var(--foreground)]'
                            }`}
                          >
                            <SlidersHorizontal size={12} />
                            <span>تنظیمات</span>
                          </button>

                          <button
                            type="button"
                            title="حذف از فروشگاه"
                            onClick={() =>
                              setConfirmDeleteSku((cur) => (cur === item.sku ? null : item.sku))
                            }
                            className="p-1.5 rounded-lg bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--foreground-muted)] hover:border-red-500/60 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Inline 2-Step Delete Confirmation */}
                    {confirmDeleteSku === item.sku && (
                      <div className="px-4 py-3 bg-red-500/5 border-t border-red-500/25 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-red-700 dark:text-red-400">
                          آیا از حذف «{item.title.fa}» از فهرست فروشگاه اطمینان دارید؟ (اثر در آرشیو اصلی دست‌نخورده می‌ماند)
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteSku(null)}
                            className="px-3 py-1.5 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] font-bold cursor-pointer"
                          >
                            انصراف
                          </button>
                          <button
                            type="button"
                            disabled={deletingSku === item.sku}
                            onClick={() => handleDeleteSku(item.sku)}
                            className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold disabled:opacity-50 cursor-pointer"
                          >
                            {deletingSku === item.sku ? 'در حال حذف...' : 'بله، حذف از فروشگاه'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Expanded Full-Edit Drawer */}
                    {isExpanded && fullDraft && (
                      <div className="p-5 bg-[var(--surface-sunken)]/55 border-t border-[var(--border-subtle)] space-y-4 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-black text-sm text-[var(--foreground)]">
                            ویرایش کامل اثر — <span dir="ltr" className="font-mono text-[var(--primary)]">{item.sku}</span>
                          </h3>
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedSku(null);
                              setFullDraft(null);
                            }}
                            className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] font-bold cursor-pointer"
                          >
                            بستن
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-bold mb-1">عنوان فارسی (FA)</label>
                            <input
                              type="text"
                              value={fullDraft.titleFa}
                              onChange={(e) => setFullDraft({ ...fullDraft, titleFa: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)]"
                            />
                          </div>
                          <div>
                            <label className="block font-bold mb-1">عنوان فرانسوی (FR)</label>
                            <input
                              type="text"
                              dir="ltr"
                              value={fullDraft.titleFr}
                              onChange={(e) => setFullDraft({ ...fullDraft, titleFr: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-left"
                            />
                          </div>
                          <div>
                            <label className="block font-bold mb-1">عنوان انگلیسی (EN)</label>
                            <input
                              type="text"
                              dir="ltr"
                              value={fullDraft.titleEn}
                              onChange={(e) => setFullDraft({ ...fullDraft, titleEn: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-left"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-bold mb-1">زیرعنوان فارسی</label>
                            <input
                              type="text"
                              value={fullDraft.subtitleFa}
                              onChange={(e) => setFullDraft({ ...fullDraft, subtitleFa: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)]"
                            />
                          </div>
                          <div>
                            <label className="block font-bold mb-1">زیرعنوان فرانسوی</label>
                            <input
                              type="text"
                              dir="ltr"
                              value={fullDraft.subtitleFr}
                              onChange={(e) => setFullDraft({ ...fullDraft, subtitleFr: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-left"
                            />
                          </div>
                          <div>
                            <label className="block font-bold mb-1">زیرعنوان انگلیسی</label>
                            <input
                              type="text"
                              dir="ltr"
                              value={fullDraft.subtitleEn}
                              onChange={(e) => setFullDraft({ ...fullDraft, subtitleEn: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-left"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <AccessibleListbox
                            label="نوع عرضه"
                            compact
                            value={fullDraft.kind}
                            options={COMMERCE_KIND_LIST.map((k) => ({
                              value: k.kind,
                              label: k.shortLabelFa,
                              badge: k.badge,
                            }))}
                            onChange={(nextKind) => {
                              const pr = COMMERCE_KIND_PRESETS[nextKind];
                              setFullDraft({
                                ...fullDraft,
                                kind: nextKind,
                                legalBucket: pr.legalBucket,
                                vatRateBasisPoints: pr.vatRateBasisPoints,
                                hsCode: pr.hsCode,
                                requiresWithdrawalWaiver: pr.requiresWithdrawalWaiver,
                              });
                            }}
                          />

                          <AccessibleListbox
                            label="رژیم حسابداری فرانسه"
                            compact
                            value={fullDraft.legalBucket}
                            options={[
                              { value: 'artiste_auteur', label: 'URSSAF هنرمند-مؤلف' },
                              { value: 'commercial_bic', label: 'بازتولید/تجاری BIC' },
                            ]}
                            onChange={(v) => setFullDraft({ ...fullDraft, legalBucket: v })}
                          />

                          <AccessibleListbox
                            label="ابعاد آماده (پر کردن سریع)"
                            compact
                            value={
                              COMMERCE_DIMENSION_PRESETS.some((p) => p.value === (dimDrafts[item.sku] || ''))
                                ? dimDrafts[item.sku]
                                : '__custom__'
                            }
                            options={COMMERCE_DIMENSION_PRESETS.map((p) => ({
                              value: p.value,
                              label: p.labelFa,
                            }))}
                            onChange={(val) => {
                              if (val === '__none__') {
                                setDimDrafts((prev) => ({ ...prev, [item.sku]: '' }));
                              } else if (val !== '__custom__') {
                                setDimDrafts((prev) => ({ ...prev, [item.sku]: val }));
                              }
                            }}
                          />

                          <AccessibleListbox
                            label="تکنیک / مدیوم"
                            compact
                            value={fullDraft.mediumPresetKey}
                            options={COMMERCE_MEDIUM_PRESETS.map((m) => ({
                              value: m.key,
                              label: m.labelFa,
                            }))}
                            onChange={(v) => setFullDraft({ ...fullDraft, mediumPresetKey: v })}
                          />
                        </div>

                        {seriesPlates.length > 0 && (
                          <AccessibleListbox
                            label={`تغییر تابلوی متصل از مجموعه (${seriesPlates.length} تابلو)`}
                            compact
                            searchable
                            searchPlaceholder="جستجوی شماره تابلو..."
                            value={fullDraft.plateImageId}
                            options={seriesPlates.map((pl, idx) => ({
                              value: String(pl.id),
                              label: `تابلوی شماره ${idx + 1} — ${pl.title}`,
                              badge: `ID ${pl.id}`,
                              thumbnail: pl.imageUrl,
                            }))}
                            onChange={(v) => setFullDraft({ ...fullDraft, plateImageId: v })}
                          />
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <div>
                            <label className="block font-bold mb-1">تیراژ کل</label>
                            <input
                              type="number"
                              dir="ltr"
                              min="1"
                              disabled={fullDraft.kind === 'original_artwork'}
                              value={fullDraft.kind === 'original_artwork' ? '1' : fullDraft.editionSize}
                              onChange={(e) => setFullDraft({ ...fullDraft, editionSize: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] font-mono text-left disabled:opacity-60"
                            />
                          </div>
                          <div>
                            <label className="block font-bold mb-1">باقی‌مانده</label>
                            <input
                              type="number"
                              dir="ltr"
                              min="0"
                              disabled={fullDraft.kind === 'original_artwork'}
                              value={fullDraft.kind === 'original_artwork' ? '1' : fullDraft.editionRemaining}
                              onChange={(e) => setFullDraft({ ...fullDraft, editionRemaining: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] font-mono text-left disabled:opacity-60"
                            />
                          </div>
                          <div>
                            <label className="block font-bold mb-1">کد گمرکی HS</label>
                            <input
                              type="text"
                              dir="ltr"
                              value={fullDraft.hsCode}
                              onChange={(e) => setFullDraft({ ...fullDraft, hsCode: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] font-mono text-left"
                            />
                          </div>
                          <div>
                            <label className="block font-bold mb-1">سال</label>
                            <input
                              type="number"
                              dir="ltr"
                              value={fullDraft.year}
                              onChange={(e) => setFullDraft({ ...fullDraft, year: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] font-mono text-left"
                            />
                          </div>
                          <div>
                            <label className="block font-bold mb-1">وزن (گرم)</label>
                            <input
                              type="number"
                              dir="ltr"
                              value={fullDraft.weightGrams}
                              onChange={(e) => setFullDraft({ ...fullDraft, weightGrams: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] font-mono text-left"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold mb-1">فایل دیجیتال (PDF / Blob Key)</label>
                            <input
                              type="text"
                              dir="ltr"
                              value={fullDraft.digitalAssetKey}
                              onChange={(e) => setFullDraft({ ...fullDraft, digitalAssetKey: e.target.value })}
                              placeholder="https://... یا شناسه فایل"
                              className="w-full px-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] font-mono text-left"
                            />
                          </div>
                          <div>
                            <label className="block font-bold mb-1">پیوند ناشر بیرونی (اختیاری)</label>
                            <input
                              type="url"
                              dir="ltr"
                              value={fullDraft.externalPublisherUrl}
                              onChange={(e) => setFullDraft({ ...fullDraft, externalPublisherUrl: e.target.value })}
                              placeholder="https://..."
                              className="w-full px-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] font-mono text-left"
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border-subtle)]">
                          <div className="flex flex-wrap items-center gap-4 font-bold">
                            <label className="inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={fullDraft.featured}
                                onChange={(e) => setFullDraft({ ...fullDraft, featured: e.target.checked })}
                              />
                              <span>اثر ویژه</span>
                            </label>
                            <label className="inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={fullDraft.signedByArtist}
                                onChange={(e) => setFullDraft({ ...fullDraft, signedByArtist: e.target.checked })}
                              />
                              <span>امضای استاد</span>
                            </label>
                            <label className="inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={fullDraft.framed}
                                onChange={(e) => setFullDraft({ ...fullDraft, framed: e.target.checked })}
                              />
                              <span>قاب‌دار</span>
                            </label>
                            <label className="inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={fullDraft.requiresWithdrawalWaiver}
                                onChange={(e) =>
                                  setFullDraft({ ...fullDraft, requiresWithdrawalWaiver: e.target.checked })
                                }
                              />
                              <span>استثنای انصراف L221-28</span>
                            </label>
                          </div>

                          <button
                            type="button"
                            disabled={savingSku === item.sku}
                            onClick={() => handleSaveSku(item, true)}
                            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-black disabled:opacity-50 cursor-pointer"
                          >
                            <Save size={14} />
                            <span>{savingSku === item.sku ? 'در حال ذخیره...' : 'ذخیره تمام جزئیات اثر'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ORDERS & WITHDRAWALS */}
      {subTab === 'orders' && (
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-base font-black text-[var(--foreground)]">سفارش‌های ثبت‌شده و صدور گواهی اصالت</h2>
            {data.orders.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-center text-xs text-[var(--foreground-muted)]">
                هنوز سفارشی ثبت نشده است. به‌محض ثبت سفارش از فروشگاه یا صفحات آثار، در اینجا ظاهر می‌شود.
              </div>
            ) : (
              data.orders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-5 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span dir="ltr" className="font-mono font-black text-[var(--primary)]">
                        {ord.orderNumber}
                      </span>
                      <span dir="ltr" className="font-mono text-[var(--foreground-muted)]">
                        {ord.invoiceNumber}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[var(--surface-sunken)] font-bold">
                        {ord.status}
                      </span>
                      <span dir="ltr" className="font-mono font-black">
                        {formatEur(ord.quote.totalCents, 'fr')}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {ord.status === 'awaiting_sepa_transfer' && (
                        <button
                          type="button"
                          onClick={() => handleOrderStatus(ord.id, 'paid')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                        >
                          <ShieldCheck size={14} />
                          <span>تأیید واریز SEPA و صدور گواهی Ed25519</span>
                        </button>
                      )}
                      {ord.status === 'paid' && (
                        <button
                          type="button"
                          onClick={() => handleOrderStatus(ord.id, 'fulfilled')}
                          className="px-3 py-1.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold cursor-pointer"
                        >
                          ثبت ارسال مرسوله
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[var(--foreground-muted)]">
                    <div>
                      <strong className="text-[var(--foreground)]">خریدار:</strong> {ord.customer.fullName} (
                      <span dir="ltr" className="font-mono">
                        {ord.customer.email}
                      </span>
                      ) — {ord.customer.countryCode}
                    </div>
                    <div>
                      <strong className="text-[var(--foreground)]">تفکیک حسابداری:</strong>{' '}
                      URSSAF:{' '}
                      <span dir="ltr" className="font-mono">
                        {formatEur(ord.quote.artisteAuteurTotalCents, 'fr')}
                      </span>{' '}
                      | BIC:{' '}
                      <span dir="ltr" className="font-mono">
                        {formatEur(ord.quote.commercialBicTotalCents, 'fr')}
                      </span>
                    </div>
                  </div>

                  {ord.certificateIds.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">گواهی اصالت:</span>
                      {ord.certificateIds.map((cid) => (
                        <Link
                          key={cid}
                          href={`/fa/verify/${cid}`}
                          target="_blank"
                          dir="ltr"
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-bold hover:underline"
                        >
                          {cid}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-[var(--foreground)] flex items-center gap-2">
              <RotateCcw size={16} className="text-amber-600" />
              <span>درخواست‌های قانونی انصراف ۱۴ روزه (قانون ۱۹ ژوئن ۲۰۲۶)</span>
            </h2>
            {data.withdrawals.length === 0 ? (
              <p className="text-xs text-[var(--foreground-muted)]">درخواستی ثبت نشده است.</p>
            ) : (
              data.withdrawals.map((w) => (
                <div key={w.id} className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/30 text-xs space-y-1">
                  <div className="flex flex-wrap justify-between gap-2 font-mono font-bold">
                    <span dir="ltr">
                      {w.referenceCode} • {w.orderNumber}
                    </span>
                    <span dir="ltr">{w.confirmedAt}</span>
                  </div>
                  <p>
                    {w.customerFullName} (
                    <span dir="ltr" className="font-mono">
                      {w.customerEmail}
                    </span>
                    ) — وضعیت: {w.status}
                  </p>
                </div>
              ))
            )}
          </section>
        </div>
      )}

      {/* TAB 3: FRENCH LEGAL CONFIG */}
      {subTab === 'legal' && (
        <form
          onSubmit={handleSaveLegal}
          className="p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-5"
        >
          <div className="space-y-1 border-b border-[var(--border-subtle)] pb-3">
            <h2 className="text-base font-black text-[var(--foreground)]">
              پیکربندی هویت حقوقی، مالیات (TVA) و حساب بانکی SEPA در فرانسه
            </h2>
            <p className="text-xs text-[var(--foreground-muted)]">
              اطلاعات ثبت‌شده در اینجا بلافاصله در صفحات Mentions légales، شرایط فروش (CGV)، پیش‌فاکتورهای SEPA و دفتر درآمد اعمال می‌شود.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="block font-bold">نام تجاری آتلیه و انتشارات</label>
              <input
                type="text"
                dir="ltr"
                value={legalDraft.tradeName || ''}
                onChange={(e) => setLegalDraft((p) => ({ ...p, tradeName: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-left"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold">شماره SIRET (۱۴ رقم فرانسه)</label>
              <input
                type="text"
                dir="ltr"
                value={legalDraft.siret || ''}
                onChange={(e) => setLegalDraft((p) => ({ ...p, siret: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] font-mono text-left"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold">کد فعالیت (APE / NAF)</label>
              <input
                type="text"
                dir="ltr"
                value={legalDraft.apeCode || ''}
                onChange={(e) => setLegalDraft((p) => ({ ...p, apeCode: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] font-mono text-left"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold">مرجع URSSAF Artiste-Auteur</label>
              <input
                type="text"
                dir="ltr"
                value={legalDraft.urssafArtisteAuteurRef || ''}
                onChange={(e) => setLegalDraft((p) => ({ ...p, urssafArtisteAuteurRef: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-left"
              />
            </div>

            <div>
              <AccessibleListbox
                label="رژیم مالیات بر ارزش افزوده (TVA)"
                compact
                value={(legalDraft.taxMode || 'franchise_en_base') as CommerceLegalConfig['taxMode']}
                options={[
                  {
                    value: 'franchise_en_base',
                    label: 'معافیت اولیه TVA — Franchise en base (Art. 293 B CGI)',
                    badge: '۰٪ TVA',
                  },
                  {
                    value: 'tva_active',
                    label: 'TVA فعال فرانسه (۵.۵٪ آثار اصل و کتاب / ۲۰٪ چاپ بازتولید)',
                    badge: 'TVA فعال',
                  },
                ]}
                onChange={(v) => setLegalDraft((p) => ({ ...p, taxMode: v }))}
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold">
                شماره TVA Intracommunautaire {legalDraft.taxMode === 'tva_active' ? '(الزامی در حالت فعال)' : '(اختیاری)'}
              </label>
              <input
                type="text"
                dir="ltr"
                placeholder="FRXX123456789"
                value={legalDraft.vatNumber || ''}
                onChange={(e) => setLegalDraft((p) => ({ ...p, vatNumber: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] font-mono text-left"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold">نشانی رسمی پاریس</label>
              <input
                type="text"
                dir="ltr"
                value={legalDraft.addressLine1 || ''}
                onChange={(e) => setLegalDraft((p) => ({ ...p, addressLine1: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-left"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold">کد پستی و شهر</label>
              <input
                type="text"
                dir="ltr"
                value={legalDraft.postalCodeCity || ''}
                onChange={(e) => setLegalDraft((p) => ({ ...p, postalCodeCity: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-left"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold">ایمیل رسمی تماس و فاکتور</label>
              <input
                type="email"
                dir="ltr"
                value={legalDraft.email || ''}
                onChange={(e) => setLegalDraft((p) => ({ ...p, email: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] font-mono text-left"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold">تلفن یا شیوه تماس رسمی</label>
              <input
                type="text"
                dir="ltr"
                value={legalDraft.phone || ''}
                onChange={(e) => setLegalDraft((p) => ({ ...p, phone: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-left"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold">نام صاحب حساب SEPA</label>
              <input
                type="text"
                dir="ltr"
                value={legalDraft.sepaAccountHolder || ''}
                onChange={(e) => setLegalDraft((p) => ({ ...p, sepaAccountHolder: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-left"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold">نام بانک فرانسه (SEPA)</label>
              <input
                type="text"
                dir="ltr"
                value={legalDraft.sepaBankName || ''}
                onChange={(e) => setLegalDraft((p) => ({ ...p, sepaBankName: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-left"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold">شماره IBAN حساب اختصاصی فرانسه (SEPA)</label>
              <input
                type="text"
                dir="ltr"
                value={legalDraft.sepaIban || ''}
                onChange={(e) => setLegalDraft((p) => ({ ...p, sepaIban: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] font-mono text-left"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold">کد BIC / SWIFT</label>
              <input
                type="text"
                dir="ltr"
                value={legalDraft.sepaBic || ''}
                onChange={(e) => setLegalDraft((p) => ({ ...p, sepaBic: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] font-mono text-left"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold">آستانه پیشنهاد اولویت SEPA (یورو €)</label>
              <input
                type="number"
                dir="ltr"
                min="100"
                max="50000"
                value={sepaThresholdEur}
                onChange={(e) => setSepaThresholdEur(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] font-mono text-left"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold">نام میانجی رسمی مصرف‌کننده (الزامی Art. L612-1)</label>
              <input
                type="text"
                dir="ltr"
                value={legalDraft.mediatorName || ''}
                onChange={(e) => setLegalDraft((p) => ({ ...p, mediatorName: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-left"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold">نشانی میانجی مصرف‌کننده</label>
              <input
                type="text"
                dir="ltr"
                value={legalDraft.mediatorAddress || ''}
                onChange={(e) => setLegalDraft((p) => ({ ...p, mediatorAddress: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-left"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold">وب‌سایت میانجی مصرف‌کننده</label>
              <input
                type="url"
                dir="ltr"
                value={legalDraft.mediatorUrl || ''}
                onChange={(e) => setLegalDraft((p) => ({ ...p, mediatorUrl: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] font-mono text-left"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingLegal}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-black disabled:opacity-50 cursor-pointer"
          >
            <Save size={15} />
            <span>{savingLegal ? 'در حال ذخیره...' : 'ذخیره و انتشار در صفحات قانونی و فاکتورها'}</span>
          </button>
        </form>
      )}

      {/* TAB 4: FRENCH ACCOUNTING LEDGER */}
      {subTab === 'accounting' && (
        <div className="p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-5">
          <div className="space-y-1">
            <h2 className="text-base font-black text-[var(--foreground)]">
              خروجی رسمی دفتر درآمد فرانسه (Livre de recettes — تفکیک URSSAF Limousin از BIC)
            </h2>
            <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
              مطابق قوانین مالیاتی و اجتماعی فرانسه (Décret 2020-1095 و CGI Art. 98 A)، درآمد آثار اصل و کتاب‌های خودنشر (Artiste-Auteur) به‌طور خودکار از درآمد چاپ‌های بازتولید Fine Art و نسخه‌های تجاری (Micro-entreprise BIC) تفکیک می‌شود تا تحویل به حسابدار رسمی (Expert-comptable) بی‌نقص باشد.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] space-y-1">
              <span className="font-bold text-[var(--primary)]">بخش اول: Artiste-Auteur (URSSAF Limousin)</span>
              <p className="text-xl font-black font-mono tabular-nums">
                <span dir="ltr" className="inline-block">
                  {formatEur(data.stats.totalArtisteAuteurCents, 'fr')}
                </span>
              </p>
              <span className="text-[11px] text-[var(--foreground-muted)]">آثار اصل دستی + کتاب‌های خودنشر دیجیتال + حمایت</span>
            </div>
            <div className="p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] space-y-1">
              <span className="font-bold text-amber-700 dark:text-amber-400">بخش دوم: Commercial / Micro-entreprise (BIC)</span>
              <p className="text-xl font-black font-mono tabular-nums">
                <span dir="ltr" className="inline-block">
                  {formatEur(data.stats.totalCommercialBicCents, 'fr')}
                </span>
              </p>
              <span className="text-[11px] text-[var(--foreground-muted)]">چاپ‌های بازتولید Fine Art + نسخه‌های خریداری‌شده از ناشر</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="/api/studio/commerce/ledger?bucket=all"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold"
            >
              <Download size={14} />
              <span>دانلود کل دفتر درآمد (CSV)</span>
            </a>
            <a
              href="/api/studio/commerce/ledger?bucket=artiste_auteur"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs font-bold hover:border-[var(--primary)]"
            >
              <Download size={14} />
              <span>خروجی اختصاصی URSSAF Limousin (Artiste-Auteur)</span>
            </a>
            <a
              href="/api/studio/commerce/ledger?bucket=commercial_bic"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs font-bold hover:border-[var(--primary)]"
            >
              <Download size={14} />
              <span>خروجی اختصاصی Micro-entreprise (BIC)</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
