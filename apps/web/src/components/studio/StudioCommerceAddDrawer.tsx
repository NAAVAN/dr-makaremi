'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  PlusCircle,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  X,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type {
  CommerceArchiveOptionsPayload,
  CommerceArchiveWorkOption,
  CommerceAvailability,
  CommerceCatalogItem,
  CommerceProductKind,
  LegalEntityBucket,
} from '@makaremi/shared';
import {
  COMMERCE_AVAILABILITY_OPTIONS,
  COMMERCE_COLLECTION_OPTIONS,
  COMMERCE_DIMENSION_PRESETS,
  COMMERCE_KIND_LIST,
  COMMERCE_KIND_PRESETS,
  COMMERCE_MEDIUM_PRESETS,
  buildDefaultLocalizedCopy,
  buildSuggestedSku,
} from '@/lib/commerce/presets';
import { formatEur } from '@/lib/commerce/rules';
import { AccessibleListbox, type ListboxOption } from './AccessibleListbox';

interface StudioCommerceAddDrawerProps {
  archiveOptions: CommerceArchiveOptionsPayload | null;
  archiveLoading: boolean;
  existingCatalog: CommerceCatalogItem[];
  onCreated: (created: CommerceCatalogItem, updatedCatalog: CommerceCatalogItem[]) => void;
  onClose: () => void;
}

const STANDALONE_PATRONAGE_SLUGS: Array<{
  slug: string;
  labelFa: string;
  titleFr: string;
  titleEn: string;
  defaultKind: CommerceProductKind;
}> = [
  {
    slug: 'bespoke-calligraphy-commission',
    labelFa: 'سفارش خوشنویسی اختصاصی جدید (بر پایه شعر یا نام)',
    titleFr: 'Commande calligraphique originale sur mesure',
    titleEn: 'Bespoke Original Calligraphy Commission',
    defaultKind: 'commission_inquiry',
  },
  {
    slug: 'archive-patronage-edition',
    labelFa: 'حمایت مالی از نگهداری و انتشار آزاد آرشیو',
    titleFr: 'Soutien à la préservation des archives',
    titleEn: 'Archive Preservation Patronage',
    defaultKind: 'patronage_edition',
  },
  {
    slug: 'collector-portfolio-box',
    labelFa: 'مجموعه کلکسیونی ویژه (آلبوم آثار منتخب)',
    titleFr: 'Coffret collector d’atelier (Édition limitée)',
    titleEn: 'Studio Collector Portfolio Box (Limited Edition)',
    defaultKind: 'fine_art_print',
  },
];

export function StudioCommerceAddDrawer({
  archiveOptions,
  archiveLoading,
  existingCatalog,
  onCreated,
  onClose,
}: StudioCommerceAddDrawerProps) {
  const existingSkus = useMemo(
    () => new Set(existingCatalog.map((c) => c.sku.toUpperCase())),
    [existingCatalog]
  );

  const skuCountByWork = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of existingCatalog) {
      const key = `${item.collection}:${item.slug}`;
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [existingCatalog]);

  // Step 1: Cascading Archive Selection
  const [collection, setCollection] = useState<CommerceCatalogItem['collection']>('artworks');
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const [selectedPlateId, setSelectedPlateId] = useState<string>('');

  // Step 2: Kind & French Legal Presets
  const [kind, setKind] = useState<CommerceProductKind>('original_artwork');
  const [availability, setAvailability] = useState<CommerceAvailability>('available');
  const [priceEur, setPriceEur] = useState<string>('1850');

  // Step 3: Dimensions, Medium, Edition & Digital/Publisher Links
  const [dimensionPreset, setDimensionPreset] = useState<string>('60 × 80 cm');
  const [customDimension, setCustomDimension] = useState<string>('');
  const [mediumPresetKey, setMediumPresetKey] = useState<string>('ink_canvas');
  const [customMediumFa, setCustomMediumFa] = useState<string>('');
  const [customMediumFr, setCustomMediumFr] = useState<string>('');
  const [customMediumEn, setCustomMediumEn] = useState<string>('');
  const [editionSize, setEditionSize] = useState<string>('1');
  const [editionRemaining, setEditionRemaining] = useState<string>('1');
  const [digitalAssetChoice, setDigitalAssetChoice] = useState<string>('');
  const [customDigitalAsset, setCustomDigitalAsset] = useState<string>('');
  const [publisherLinkChoice, setPublisherLinkChoice] = useState<string>('');
  const [customPublisherUrl, setCustomPublisherUrl] = useState<string>('');

  // Step 4: Advanced / Trilingual Overrides (auto-filled, user can customize)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sku, setSku] = useState<string>('');
  const [skuManuallyEdited, setSkuManuallyEdited] = useState(false);
  const [titleFa, setTitleFa] = useState<string>('');
  const [titleFr, setTitleFr] = useState<string>('');
  const [titleEn, setTitleEn] = useState<string>('');
  const [subtitleFa, setSubtitleFa] = useState<string>('');
  const [subtitleFr, setSubtitleFr] = useState<string>('');
  const [subtitleEn, setSubtitleEn] = useState<string>('');
  const [legalBucket, setLegalBucket] = useState<LegalEntityBucket>('artiste_auteur');
  const [vatRateBasisPoints, setVatRateBasisPoints] = useState<0 | 550 | 2000>(550);
  const [hsCode, setHsCode] = useState<string>('9701.91');
  const [weightGrams, setWeightGrams] = useState<string>('2200');
  const [yearStr, setYearStr] = useState<string>('');
  const [featured, setFeatured] = useState<boolean>(false);
  const [framed, setFramed] = useState<boolean>(false);
  const [signedByArtist, setSignedByArtist] = useState<boolean>(true);
  const [requiresWithdrawalWaiver, setRequiresWithdrawalWaiver] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Works list for current collection
  const currentCollectionWorks: CommerceArchiveWorkOption[] = useMemo(() => {
    if (!archiveOptions) return [];
    if (collection === 'artworks') return archiveOptions.artworks;
    if (collection === 'books') return archiveOptions.books;
    if (collection === 'poems') return archiveOptions.poems;
    if (collection === 'videos') return archiveOptions.videos;
    return STANDALONE_PATRONAGE_SLUGS.map((s) => ({
      collection: 'patronage',
      slug: s.slug,
      title: { fa: s.labelFa, fr: s.titleFr, en: s.titleEn },
      year: new Date().getUTCFullYear(),
      imageUrl: null,
    }));
  }, [archiveOptions, collection]);

  // Auto-select first work whenever collection changes
  useEffect(() => {
    if (currentCollectionWorks.length > 0) {
      const stillValid = currentCollectionWorks.some((w) => w.slug === selectedSlug);
      if (!stillValid) {
        setSelectedSlug(currentCollectionWorks[0].slug);
      }
    }
  }, [currentCollectionWorks, selectedSlug]);

  const selectedWork = useMemo(
    () => currentCollectionWorks.find((w) => w.slug === selectedSlug) || null,
    [currentCollectionWorks, selectedSlug]
  );

  // Auto-select first plate when artwork changes
  useEffect(() => {
    if (selectedWork?.plates && selectedWork.plates.length > 0) {
      const stillValid = selectedWork.plates.some((p) => String(p.id) === selectedPlateId);
      if (!stillValid) {
        setSelectedPlateId(String(selectedWork.plates[0].id));
      }
    } else {
      setSelectedPlateId('');
    }
  }, [selectedWork, selectedPlateId]);

  const selectedPlateIndex = useMemo(() => {
    if (!selectedWork?.plates || !selectedPlateId) return -1;
    return selectedWork.plates.findIndex((p) => String(p.id) === selectedPlateId);
  }, [selectedWork, selectedPlateId]);

  const selectedPlate =
    selectedPlateIndex >= 0 && selectedWork?.plates ? selectedWork.plates[selectedPlateIndex] : null;

  // Apply sensible defaults when collection changes
  const handleCollectionChange = (nextCol: CommerceCatalogItem['collection']) => {
    setCollection(nextCol);
    setSkuManuallyEdited(false);
    const colMeta = COMMERCE_COLLECTION_OPTIONS.find((c) => c.value === nextCol);
    if (colMeta) {
      applyKindPreset(colMeta.defaultKind);
    }
  };

  // Apply French-law defaults whenever kind changes
  const applyKindPreset = (nextKind: CommerceProductKind) => {
    const preset = COMMERCE_KIND_PRESETS[nextKind];
    setKind(nextKind);
    setLegalBucket(preset.legalBucket);
    setVatRateBasisPoints(preset.vatRateBasisPoints);
    setHsCode(preset.hsCode);
    setRequiresWithdrawalWaiver(preset.requiresWithdrawalWaiver);
    setSignedByArtist(preset.signedByArtist);
    setPriceEur(preset.defaultPriceEur !== null ? String(preset.defaultPriceEur) : '');
    setEditionSize(preset.defaultEditionSize !== null ? String(preset.defaultEditionSize) : '');
    setEditionRemaining(preset.defaultEditionSize !== null ? String(preset.defaultEditionSize) : '');
    setWeightGrams(preset.defaultWeightGrams !== null ? String(preset.defaultWeightGrams) : '');
    setMediumPresetKey(preset.defaultMediumKey);
    setDimensionPreset(preset.defaultDimensionsCm || '__none__');
    setCustomDimension('');
    setSkuManuallyEdited(false);
  };

  const effectiveDimensions = useMemo(() => {
    if (dimensionPreset === '__none__') return null;
    if (dimensionPreset === '__custom__') return customDimension.trim() || null;
    return dimensionPreset;
  }, [dimensionPreset, customDimension]);

  // Auto-sync trilingual titles, subtitles, SKU, year, PDFs & publisher links when work/plate/kind/dimensions change
  useEffect(() => {
    if (!selectedWork) return;
    const plateNum = selectedPlateIndex >= 0 ? selectedPlateIndex + 1 : null;
    const copy = buildDefaultLocalizedCopy({
      work: selectedWork,
      kind,
      plateNumber: plateNum,
      dimensionsCm: effectiveDimensions,
    });
    setTitleFa(copy.title.fa);
    setTitleFr(copy.title.fr);
    setTitleEn(copy.title.en);
    setSubtitleFa(copy.subtitle.fa);
    setSubtitleFr(copy.subtitle.fr);
    setSubtitleEn(copy.subtitle.en);
    setYearStr(selectedWork.year ? String(selectedWork.year) : '');

    if (!skuManuallyEdited) {
      const nextSku = buildSuggestedSku({
        collection,
        slug: selectedWork.slug,
        kind,
        plateImageId: selectedPlate ? selectedPlate.id : null,
        dimensionsCm: effectiveDimensions,
        existingSkus,
      });
      setSku(nextSku);
    }

    if (selectedWork.pdfUrls && selectedWork.pdfUrls.length > 0) {
      setDigitalAssetChoice(selectedWork.pdfUrls[0]);
    } else {
      setDigitalAssetChoice('__none__');
    }

    if (selectedWork.externalLinks && selectedWork.externalLinks.length > 0) {
      setPublisherLinkChoice(selectedWork.externalLinks[0].url);
    } else {
      setPublisherLinkChoice('__none__');
    }
  }, [
    selectedWork,
    selectedPlate,
    selectedPlateIndex,
    kind,
    collection,
    effectiveDimensions,
    existingSkus,
    skuManuallyEdited,
  ]);

  // Build dropdown option arrays
  const collectionListboxOptions: ListboxOption<CommerceCatalogItem['collection']>[] = useMemo(
    () =>
      COMMERCE_COLLECTION_OPTIONS.map((opt) => {
        let badge = '';
        if (archiveOptions) {
          if (opt.value === 'artworks') {
            badge = `${archiveOptions.counts.artworks} مجموعه • ${archiveOptions.counts.artworkPlates} تابلو`;
          } else if (opt.value === 'books') {
            badge = `${archiveOptions.counts.books} کتاب`;
          } else if (opt.value === 'poems') {
            badge = `${archiveOptions.counts.poems} شعر`;
          } else if (opt.value === 'videos') {
            badge = `${archiveOptions.counts.videos} فیلم`;
          } else {
            badge = 'مستقل';
          }
        }
        return {
          value: opt.value,
          label: opt.labelFa,
          description: opt.descriptionFa,
          badge,
        };
      }),
    [archiveOptions]
  );

  const workListboxOptions: ListboxOption<string>[] = useMemo(
    () =>
      currentCollectionWorks.map((w) => {
        const listedCount = skuCountByWork.get(`${w.collection}:${w.slug}`) || 0;
        const platesInfo = w.plates && w.plates.length > 0 ? `${w.plates.length} تابلو` : null;
        const badgeParts = [
          w.year ? String(w.year) : null,
          platesInfo,
          listedCount > 0 ? `${listedCount} عرضه فعال` : null,
        ].filter(Boolean);

        return {
          value: w.slug,
          label: w.title.fa,
          description: [w.title.fr, w.publisherName, w.isbn ? `ISBN: ${w.isbn}` : null]
            .filter(Boolean)
            .join(' • '),
          badge: badgeParts.join(' | ') || undefined,
          thumbnail: w.imageUrl,
          searchKeywords: `${w.slug} ${w.title.fr} ${w.title.en} ${w.year || ''} ${w.isbn || ''}`,
        };
      }),
    [currentCollectionWorks, skuCountByWork]
  );

  const plateListboxOptions: ListboxOption<string>[] = useMemo(() => {
    if (!selectedWork?.plates) return [];
    return selectedWork.plates.map((pl, idx) => ({
      value: String(pl.id),
      label: `تابلوی شماره ${idx + 1} — ${pl.title}`,
      badge: `ID ${pl.id}`,
      thumbnail: pl.imageUrl,
      searchKeywords: `${pl.id} ${idx + 1} ${pl.title}`,
    }));
  }, [selectedWork]);

  const kindListboxOptions: ListboxOption<CommerceProductKind>[] = useMemo(() => {
    // Put recommended kinds for this collection first
    const sorted = [...COMMERCE_KIND_LIST].sort((a, b) => {
      const aRec = a.recommendedCollections.includes(collection) ? 0 : 1;
      const bRec = b.recommendedCollections.includes(collection) ? 0 : 1;
      return aRec - bRec;
    });
    return sorted.map((p) => ({
      value: p.kind,
      label: p.labelFa,
      description: p.descriptionFa,
      badge: p.recommendedCollections.includes(collection) ? `پیشنهادی • ${p.badge}` : p.badge,
    }));
  }, [collection]);

  const availabilityListboxOptions: ListboxOption<CommerceAvailability>[] = useMemo(
    () =>
      COMMERCE_AVAILABILITY_OPTIONS.map((a) => ({
        value: a.value,
        label: a.labelFa,
        description: a.descriptionFa,
        badge: a.badge,
      })),
    []
  );

  const dimensionListboxOptions: ListboxOption<string>[] = useMemo(
    () =>
      COMMERCE_DIMENSION_PRESETS.map((d) => ({
        value: d.value,
        label: d.labelFa,
        description: d.descriptionFa,
      })),
    []
  );

  const mediumListboxOptions: ListboxOption<string>[] = useMemo(
    () =>
      COMMERCE_MEDIUM_PRESETS.map((m) => ({
        value: m.key,
        label: m.labelFa,
        description: m.descriptionFa,
      })),
    []
  );

  const pdfListboxOptions: ListboxOption<string>[] = useMemo(() => {
    const opts: ListboxOption<string>[] = [
      { value: '__none__', label: 'بدون فایل متصل (بعداً اضافه می‌شود)', description: 'مجوز دانلود بدون فایل مستقیم' },
    ];
    for (const url of selectedWork?.pdfUrls || []) {
      const fileName = url.split('/').pop() || url;
      opts.push({
        value: url,
        label: `فایل PDF موجود در آرشیو: ${fileName}`,
        description: 'متصل به سند اصلی کتاب در آرشیو رسمی',
        badge: 'PDF آرشیو',
      });
    }
    opts.push({
      value: '__custom__',
      label: 'وارد کردن کلید فایل خصوصی یا نشانی دلخواه...',
      description: 'مناسب فایل‌های بارگذاری‌شده در Vercel Blob / R2',
    });
    return opts;
  }, [selectedWork]);

  const publisherLinkListboxOptions: ListboxOption<string>[] = useMemo(() => {
    const opts: ListboxOption<string>[] = [
      { value: '__none__', label: 'بدون پیوند ناشر بیرونی (فروش مستقیم آتلیه)' },
    ];
    for (const link of selectedWork?.externalLinks || []) {
      opts.push({
        value: link.url,
        label: `${link.platform} — ${link.label}`,
        badge: link.platform,
      });
    }
    opts.push({
      value: '__custom__',
      label: 'وارد کردن پیوند ناشر دلخواه...',
    });
    return opts;
  }, [selectedWork]);

  const previewImageUrl = selectedPlate?.imageUrl || selectedWork?.imageUrl || null;
  const priceRequiresValue = availability === 'available';
  const parsedPriceCents = useMemo(() => {
    const clean = priceEur.trim();
    if (!clean) return null;
    const n = Math.round(Number(clean) * 100);
    return Number.isFinite(n) ? n : null;
  }, [priceEur]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedWork) {
      setErrorMsg('لطفاً ابتدا یک اثر را از لیست کشویی آرشیو انتخاب کنید.');
      return;
    }

    if (priceRequiresValue && (parsedPriceCents === null || parsedPriceCents < 100)) {
      setErrorMsg('برای آثار «قابل تملک (فعال)»، وارد کردن قیمت معتبر (حداقل ۱ یورو) الزامی است.');
      return;
    }
    if (!priceRequiresValue && parsedPriceCents !== null && parsedPriceCents < 100) {
      setErrorMsg('اگر قیمت وارد می‌کنید، باید حداقل ۱ یورو باشد (یا فیلد قیمت را خالی بگذارید).');
      return;
    }

    const mediumPreset = COMMERCE_MEDIUM_PRESETS.find((m) => m.key === mediumPresetKey);
    const resolvedMedium =
      mediumPresetKey === '__custom__'
        ? customMediumFa.trim()
          ? {
              fa: customMediumFa.trim(),
              fr: customMediumFr.trim() || customMediumFa.trim(),
              en: customMediumEn.trim() || customMediumFr.trim() || customMediumFa.trim(),
            }
          : null
        : mediumPreset?.medium.fa
          ? mediumPreset.medium
          : null;

    const resolvedDigitalAsset =
      digitalAssetChoice === '__none__'
        ? null
        : digitalAssetChoice === '__custom__'
          ? customDigitalAsset.trim() || null
          : digitalAssetChoice || null;

    const resolvedPublisherUrl =
      publisherLinkChoice === '__none__'
        ? null
        : publisherLinkChoice === '__custom__'
          ? customPublisherUrl.trim() || null
          : publisherLinkChoice || null;

    const matchedLink = selectedWork.externalLinks?.find((l) => l.url === resolvedPublisherUrl);

    setSubmitting(true);
    try {
      const res = await fetch('/api/studio/commerce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: sku.trim().toUpperCase() || undefined,
          collection,
          slug: selectedWork.slug,
          plateImageId: selectedPlate ? selectedPlate.id : null,
          imageUrl: previewImageUrl,
          kind,
          legalBucket,
          availability,
          priceEurCents: parsedPriceCents,
          vatRateBasisPoints,
          editionSize:
            kind === 'original_artwork'
              ? 1
              : editionSize.trim()
                ? Math.max(1, Number(editionSize))
                : null,
          editionRemaining:
            kind === 'original_artwork'
              ? availability === 'sold'
                ? 0
                : 1
              : editionRemaining.trim()
                ? Math.max(0, Number(editionRemaining))
                : null,
          title: {
            fa: titleFa.trim() || selectedWork.title.fa,
            fr: titleFr.trim() || selectedWork.title.fr,
            en: titleEn.trim() || selectedWork.title.en,
          },
          subtitle:
            subtitleFa.trim() || subtitleFr.trim() || subtitleEn.trim()
              ? {
                  fa: subtitleFa.trim(),
                  fr: subtitleFr.trim(),
                  en: subtitleEn.trim(),
                }
              : null,
          dimensionsCm: effectiveDimensions,
          medium: resolvedMedium,
          weightGrams: weightGrams.trim() ? Math.max(10, Number(weightGrams)) : null,
          framed,
          paperOrSupport: mediumPreset?.paperOrSupport || null,
          signedByArtist,
          numberedEdition: kind === 'fine_art_print',
          digitalAssetKey: resolvedDigitalAsset,
          externalPublisherUrl: resolvedPublisherUrl,
          externalPublisherLabel: matchedLink?.platform || null,
          requiresWithdrawalWaiver,
          hsCode: hsCode.trim() || COMMERCE_KIND_PRESETS[kind].hsCode,
          featured,
          year: yearStr.trim() ? Number(yearStr) : null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        setErrorMsg(json.error || 'ثبت اثر جدید در فروشگاه ناموفق بود.');
      } else {
        onCreated(json.item, json.catalog);
      }
    } catch {
      setErrorMsg('خطای ارتباط با سرور هنگام ثبت اثر جدید.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-[var(--surface-card)] border-2 border-[var(--primary)]/45 shadow-[var(--shadow-md)] p-5 sm:p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[var(--primary)]">
            <PlusCircle size={20} />
            <h2 className="text-base sm:text-lg font-black text-[var(--foreground)]">
              افزودن اثر جدید به فروشگاه (انتخاب گام‌به‌گام از آرشیو)
            </h2>
          </div>
          <p className="text-xs text-[var(--foreground-muted)]">
            کافی است دسته، اثر و نوع فروش را از لیست‌های کشویی انتخاب کنید؛ تمام مقررات مالیاتی و حقوقی فرانسه، کد گمرکی و عناوین سه‌زبانه به‌طور خودکار تنظیم می‌شوند.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs font-bold hover:border-red-500/60 hover:text-red-600 cursor-pointer"
        >
          <X size={14} />
          <span>بستن</span>
        </button>
      </div>

      {archiveLoading && !archiveOptions && (
        <div className="p-6 rounded-xl bg-[var(--surface-sunken)] text-center text-xs text-[var(--foreground-muted)]">
          در حال بارگذاری فهرست کامل آرشیو (تابلوها، کتاب‌ها، اشعار و سخنرانی‌ها)...
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/35 text-red-700 dark:text-red-400 text-xs font-bold flex items-center gap-2"
        >
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Live Preview Banner */}
      {selectedWork && (
        <div className="p-4 rounded-2xl bg-[var(--surface-sunken)]/80 border border-[var(--border-subtle)] flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-24 h-24 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] overflow-hidden shrink-0 flex items-center justify-center">
            {previewImageUrl ? (
              <img
                src={previewImageUrl}
                alt={titleFa || selectedWork.title.fa}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon size={28} className="text-[var(--foreground-muted)]" />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
              <span dir="ltr" className="px-2 py-0.5 rounded bg-[var(--surface-card)] border border-[var(--border-subtle)] font-bold text-[var(--primary)]">
                {sku || 'AUTO-SKU'}
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold font-sans">
                {legalBucket === 'artiste_auteur' ? 'URSSAF هنرمند-مؤلف' : 'بازتولید/تجاری BIC'}
              </span>
              <span dir="ltr" className="px-2 py-0.5 rounded bg-[var(--surface-card)] text-[var(--foreground-muted)]">
                HS: {hsCode}
              </span>
              {effectiveDimensions && (
                <span dir="ltr" className="px-2 py-0.5 rounded bg-[var(--surface-card)] text-[var(--foreground-muted)]">
                  {effectiveDimensions}
                </span>
              )}
              {requiresWithdrawalWaiver && (
                <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-800 dark:text-sky-300 font-sans font-bold">
                  استثنای انصراف Art. L221-28
                </span>
              )}
            </div>

            <p className="text-sm font-black text-[var(--foreground)] leading-snug">
              {titleFa || selectedWork.title.fa}
            </p>
            <p dir="ltr" className="text-xs text-[var(--foreground-muted)] text-end truncate">
              {titleFr || selectedWork.title.fr}
            </p>
          </div>

          <div className="sm:text-end shrink-0 space-y-1">
            <span className="text-[10px] text-[var(--foreground-muted)] block">پیش‌نمایش قیمت</span>
            <span dir="ltr" className="text-lg font-black font-mono text-[var(--primary)] inline-block">
              {parsedPriceCents !== null ? formatEur(parsedPriceCents, 'fr') : 'استعلام قیمت'}
            </span>
          </div>
        </div>
      )}

      {/* STEP 1: Cascading Archive Dropdowns */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-black text-[var(--primary)]">
          <span className="w-6 h-6 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] inline-flex items-center justify-center font-mono">
            ۱
          </span>
          <span>انتخاب اثر از آرشیو (لیست‌های کشویی آبشاری)</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AccessibleListbox
            label="۱. دسته آرشیو"
            value={collection}
            options={collectionListboxOptions}
            onChange={handleCollectionChange}
          />

          <AccessibleListbox
            label="۲. انتخاب اثر / مجموعه از آرشیو"
            value={selectedSlug}
            options={workListboxOptions}
            onChange={(slug) => {
              setSelectedSlug(slug);
              setSkuManuallyEdited(false);
            }}
            searchable
            searchPlaceholder="جستجوی نام فارسی، فرانسوی یا سال اثر..."
            placeholder="انتخاب اثر از فهرست..."
            disabled={workListboxOptions.length === 0}
          />
        </div>

        {plateListboxOptions.length > 0 && (
          <div className="p-4 rounded-xl bg-[var(--surface-sunken)]/60 border border-[var(--border-subtle)] space-y-2">
            <AccessibleListbox
              label={`۳. انتخاب تابلوی دقیق داخل این مجموعه (${plateListboxOptions.length} تابلو)`}
              value={selectedPlateId}
              options={plateListboxOptions}
              onChange={(pid) => {
                setSelectedPlateId(pid);
                setSkuManuallyEdited(false);
              }}
              searchable
              searchPlaceholder="جستجوی شماره تابلو یا شناسه (مثلاً 728)..."
            />
            <p className="text-[11px] text-[var(--foreground-muted)]">
              با انتخاب هر تابلو از لیست بالا، تصویر واقعی همان تابلو در پیش‌نمایش فروشگاه، صفحه گالری و گواهی اصالت ثبت می‌شود.
            </p>
          </div>
        )}
      </div>

      {/* STEP 2: Kind & Commercial Configuration */}
      <div className="space-y-4 pt-2 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 text-xs font-black text-[var(--primary)]">
          <span className="w-6 h-6 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] inline-flex items-center justify-center font-mono">
            ۲
          </span>
          <span>نوع فروش، قیمت‌گذاری و وضعیت موجودی</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AccessibleListbox
            label="نوع عرضه در فروشگاه (تنظیم خودکار قوانین فرانسه)"
            value={kind}
            options={kindListboxOptions}
            onChange={applyKindPreset}
          />

          <AccessibleListbox
            label="وضعیت موجودی"
            value={availability}
            options={availabilityListboxOptions}
            onChange={setAvailability}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-[var(--foreground)] mb-1.5">
              قیمت (یورو €) {priceRequiresValue ? '*' : '(اختیاری)'}
            </label>
            <input
              type="number"
              dir="ltr"
              step="0.5"
              min="1"
              placeholder={priceRequiresValue ? 'مثلاً 1850' : 'خالی برای استعلام'}
              value={priceEur}
              onChange={(e) => setPriceEur(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] text-sm font-mono text-left focus:outline-none focus:border-[var(--primary)]"
            />
            {parsedPriceCents !== null && parsedPriceCents >= 250000 && (
              <p className="mt-1 text-[10px] text-sky-700 dark:text-sky-400 font-bold">
                واریز بانکی SEPA بدون کارمزد به‌عنوان گزینه اول نمایش داده می‌شود.
              </p>
            )}
            {kind === 'book_physical_signed' && parsedPriceCents !== null && parsedPriceCents < 3500 && (
              <p className="mt-1 text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                قانون Loi Darcos فرانسه (حداقل ۳ € پست زیر ۳۵ €) خودکار اعمال می‌شود.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-[var(--foreground)] mb-1.5">
              تیراژ کل (تعداد نسخه)
            </label>
            <input
              type="number"
              dir="ltr"
              min="1"
              max="10000"
              disabled={kind === 'original_artwork'}
              value={kind === 'original_artwork' ? '1' : editionSize}
              onChange={(e) => {
                setEditionSize(e.target.value);
                if (!editionRemaining || editionRemaining === editionSize) {
                  setEditionRemaining(e.target.value);
                }
              }}
              placeholder="مثلاً 30"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] text-sm font-mono text-left disabled:opacity-60 focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-[var(--foreground)] mb-1.5">
              تعداد باقی‌مانده
            </label>
            <input
              type="number"
              dir="ltr"
              min="0"
              max="10000"
              disabled={kind === 'original_artwork'}
              value={kind === 'original_artwork' ? (availability === 'sold' ? '0' : '1') : editionRemaining}
              onChange={(e) => setEditionRemaining(e.target.value)}
              placeholder="مثلاً 30"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] text-sm font-mono text-left disabled:opacity-60 focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-[var(--foreground)] mb-1.5">
              سال خلق / انتشار
            </label>
            <input
              type="number"
              dir="ltr"
              min="1950"
              max="2100"
              value={yearStr}
              onChange={(e) => setYearStr(e.target.value)}
              placeholder="مثلاً 2015"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] text-sm font-mono text-left focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
        </div>
      </div>

      {/* STEP 3: Dimensions, Medium & Digital / Publisher Dropdowns */}
      <div className="space-y-4 pt-2 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 text-xs font-black text-[var(--primary)]">
          <span className="w-6 h-6 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] inline-flex items-center justify-center font-mono">
            ۳
          </span>
          <span>ابعاد، تکنیک و فایل‌های پیوست (لیست‌های کشویی آماده)</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <AccessibleListbox
              label="ابعاد استاندارد اثر"
              value={dimensionPreset}
              options={dimensionListboxOptions}
              onChange={setDimensionPreset}
            />
            {dimensionPreset === '__custom__' && (
              <input
                type="text"
                dir="ltr"
                value={customDimension}
                onChange={(e) => setCustomDimension(e.target.value)}
                placeholder="مثلاً 80 × 120 cm"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] text-xs font-mono text-left"
              />
            )}
          </div>

          <div className="space-y-2">
            <AccessibleListbox
              label="تکنیک / مدیوم (سه‌زبانه خودکار)"
              value={mediumPresetKey}
              options={mediumListboxOptions}
              onChange={setMediumPresetKey}
            />
            {mediumPresetKey === '__custom__' && (
              <div className="grid grid-cols-1 gap-2">
                <input
                  type="text"
                  value={customMediumFa}
                  onChange={(e) => setCustomMediumFa(e.target.value)}
                  placeholder="تکنیک به فارسی..."
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={customMediumFr}
                  onChange={(e) => setCustomMediumFr(e.target.value)}
                  placeholder="Technique en français..."
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs text-left"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={customMediumEn}
                  onChange={(e) => setCustomMediumEn(e.target.value)}
                  placeholder="Medium in English..."
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs text-left"
                />
              </div>
            )}
          </div>
        </div>

        {(kind === 'book_digital_ebook' || (selectedWork?.pdfUrls && selectedWork.pdfUrls.length > 0)) && (
          <div className="space-y-2">
            <AccessibleListbox
              label="فایل دیجیتال قابل دانلود (PDF / eBook)"
              value={digitalAssetChoice}
              options={pdfListboxOptions}
              onChange={setDigitalAssetChoice}
            />
            {digitalAssetChoice === '__custom__' && (
              <input
                type="text"
                dir="ltr"
                value={customDigitalAsset}
                onChange={(e) => setCustomDigitalAsset(e.target.value)}
                placeholder="https://... یا کلید فایل در Vercel Blob"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] text-xs font-mono text-left"
              />
            )}
          </div>
        )}

        {(collection === 'books' || availability === 'external_publisher') && (
          <div className="space-y-2">
            <AccessibleListbox
              label="پیوند ناشر بیرونی (اختیاری — L’Harmattan / آمازون)"
              value={publisherLinkChoice}
              options={publisherLinkListboxOptions}
              onChange={setPublisherLinkChoice}
            />
            {publisherLinkChoice === '__custom__' && (
              <input
                type="url"
                dir="ltr"
                value={customPublisherUrl}
                onChange={(e) => setCustomPublisherUrl(e.target.value)}
                placeholder="https://www.editions-harmattan.fr/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] text-xs font-mono text-left"
              />
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-5 pt-1 text-xs font-bold">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="rounded"
            />
            <span>نمایش برجسته (اثر منتخب در فروشگاه)</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={signedByArtist}
              onChange={(e) => setSignedByArtist(e.target.checked)}
              className="rounded"
            />
            <span>امضاشده با دست استاد</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={framed}
              onChange={(e) => setFramed(e.target.checked)}
              className="rounded"
            />
            <span>همراه با قاب موزه‌ای</span>
          </label>
        </div>
      </div>

      {/* STEP 4: Collapsible Advanced & Trilingual Text Controls */}
      <div className="border-t border-[var(--border-subtle)] pt-3">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="inline-flex items-center gap-2 text-xs font-extrabold text-[var(--foreground-muted)] hover:text-[var(--primary)] cursor-pointer"
        >
          {showAdvanced ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          <span>تنظیمات پیشرفته: ویرایش عناوین سه‌زبانه، کد SKU، رژیم حسابداری و گمرک</span>
        </button>

        {showAdvanced && (
          <div className="mt-4 p-4 rounded-xl bg-[var(--surface-sunken)]/70 border border-[var(--border-subtle)] space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold mb-1">عنوان فارسی (FA)</label>
                <input
                  type="text"
                  value={titleFa}
                  onChange={(e) => setTitleFa(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)]"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">عنوان فرانسوی (FR)</label>
                <input
                  type="text"
                  dir="ltr"
                  value={titleFr}
                  onChange={(e) => setTitleFr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-left"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">عنوان انگلیسی (EN)</label>
                <input
                  type="text"
                  dir="ltr"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-left"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold mb-1">زیرعنوان فارسی</label>
                <input
                  type="text"
                  value={subtitleFa}
                  onChange={(e) => setSubtitleFa(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)]"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">زیرعنوان فرانسوی</label>
                <input
                  type="text"
                  dir="ltr"
                  value={subtitleFr}
                  onChange={(e) => setSubtitleFr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-left"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">زیرعنوان انگلیسی</label>
                <input
                  type="text"
                  dir="ltr"
                  value={subtitleEn}
                  onChange={(e) => setSubtitleEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-left"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold mb-1">کد یکتا (SKU)</label>
                <input
                  type="text"
                  dir="ltr"
                  value={sku}
                  onChange={(e) => {
                    setSku(e.target.value.toUpperCase());
                    setSkuManuallyEdited(true);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] font-mono text-left"
                />
              </div>

              <AccessibleListbox
                label="رژیم حسابداری فرانسه"
                compact
                value={legalBucket}
                options={[
                  { value: 'artiste_auteur', label: 'URSSAF هنرمند-مؤلف (Artiste-Auteur)' },
                  { value: 'commercial_bic', label: 'بازتولید / تجاری (Micro-entreprise BIC)' },
                ]}
                onChange={setLegalBucket}
              />

              <AccessibleListbox
                label="نرخ TVA (در حالت فعال)"
                compact
                value={String(vatRateBasisPoints)}
                options={[
                  { value: '550', label: '5.5% (آثار اصل و کتاب)' },
                  { value: '2000', label: '20% (چاپ بازتولید)' },
                  { value: '0', label: '0% (معاف / حمایت)' },
                ]}
                onChange={(v) => setVatRateBasisPoints(Number(v) as 0 | 550 | 2000)}
              />

              <div>
                <label className="block font-bold mb-1">کد گمرکی (HS CN23)</label>
                <input
                  type="text"
                  dir="ltr"
                  value={hsCode}
                  onChange={(e) => setHsCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] font-mono text-left"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block font-bold mb-1">وزن تقریبی بسته (گرم — برای محاسبه پست)</label>
                <input
                  type="number"
                  dir="ltr"
                  min="10"
                  max="100000"
                  value={weightGrams}
                  onChange={(e) => setWeightGrams(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] font-mono text-left"
                />
              </div>
              <label className="inline-flex items-center gap-2 font-bold cursor-pointer pt-4">
                <input
                  type="checkbox"
                  checked={requiresWithdrawalWaiver}
                  onChange={(e) => setRequiresWithdrawalWaiver(e.target.checked)}
                />
                <span>الزام تیک انصراف فوری از حق بازگشت ۱۴ روزه (Art. L221-28)</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--border-subtle)]">
        <div className="inline-flex items-center gap-1.5 text-[11px] text-[var(--foreground-muted)]">
          <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
          <span>پس از ثبت، اثر بلافاصله در فروشگاه زنده و صفحه مربوط به خود در آرشیو نمایش داده می‌شود.</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs font-bold hover:border-[var(--primary)] cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={submitting || !selectedWork}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs sm:text-sm font-black shadow-sm hover:opacity-95 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? <Sparkles size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
            <span>{submitting ? 'در حال ثبت در دیتابیس...' : 'ثبت و انتشار در فروشگاه زنده'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
