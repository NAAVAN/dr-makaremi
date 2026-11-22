'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { del as idbDel, get as idbGet, set as idbSet } from 'idb-keyval';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FilePlus2,
  FolderOpen,
  Globe,
  Languages,
  Layers,
  Loader2,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  PILLARS_CONFIG,
  type AiProviderRuntimeStatus,
  type ContentPillar,
  type Locale,
  type StudioPoemVerseInput,
  type StudioWorkDraft,
  type StudioWorkType,
} from '@makaremi/shared';
import { AccessibleListbox, type ListboxOption } from './AccessibleListbox';
import { StandardUploadDropzone } from './StandardUploadDropzone';
import { VoiceRecorderWidget } from '../curation/VoiceRecorderWidget';
import { normaliseExternalVideoUrl, suggestSeoFromContent } from '@/lib/studio/media-gatekeeper';

const IDB_DRAFTS_INDEX_KEY = 'makaremi_studio_drafts_v2';

const WORK_TYPE_OPTIONS: ListboxOption<StudioWorkType>[] = [
  { value: 'article', label: 'مقاله علمی، جستار یا کنفرانس مکتوب', badge: 'Article' },
  { value: 'book', label: 'کتاب یا رساله (همراه با ویترین ۳بعدی)', badge: 'Book' },
  { value: 'poem', label: 'شعر یا کوتاه‌واره (با ساختار دو مصراعی)', badge: 'Poem' },
  { value: 'video', label: 'ویدئو، سخنرانی یا مصاحبه تصویری', badge: 'Video' },
  { value: 'artwork', label: 'تابلوی خوشنویسی یا نقاشی (گالری IIIF)', badge: 'Artwork' },
  { value: 'exhibition', label: 'نمایشگاه انفرادی یا بین‌المللی', badge: 'Exhibition' },
  { value: 'page', label: 'متن مصاحبه مطبوعاتی یا یادداشت زندگینامه', badge: 'Page' },
];

const PILLAR_OPTIONS: ListboxOption<ContentPillar>[] = Object.values(PILLARS_CONFIG).map((p) => ({
  value: p.id,
  label: p.titleFa,
  description: `${p.titleFr} / ${p.titleEn}`,
}));

const CATEGORY_BY_TYPE: Record<StudioWorkType, ListboxOption<string>[]> = {
  article: [
    { value: 'مقاله تخصصی روانکاوی', label: 'مقاله تخصصی روانکاوی' },
    { value: 'حافظ‌پژوهی و ادبیات', label: 'حافظ‌پژوهی و ادبیات' },
    { value: 'استراتژی و فرهنگ ایران', label: 'استراتژی و فرهنگ ایران' },
    { value: 'حقوق بشر و دادخواهی', label: 'حقوق بشر و دادخواهی' },
    { value: 'متن کامل سخنرانی و کنفرانس', label: 'متن کامل سخنرانی و کنفرانس' },
    { value: 'خبر و رویداد فرهنگی', label: 'خبر و رویداد فرهنگی' },
  ],
  book: [
    { value: 'روانکاوی لکانی', label: 'روانکاوی لکانی' },
    { value: 'حافظ‌پژوهی و عرفان', label: 'حافظ‌پژوهی و عرفان' },
    { value: 'پژوهش و فرهنگ', label: 'پژوهش و فرهنگ' },
    { value: 'شعر و ادبیات', label: 'شعر و ادبیات' },
    { value: 'هنر و خوشنویسی', label: 'هنر و خوشنویسی' },
  ],
  poem: [
    { value: 'شعر فارسی', label: 'شعر فارسی' },
    { value: 'شعر فرانسوی', label: 'شعر فرانسوی (Poésie)' },
    { value: 'کوتاه‌واره دوزبانه (پاره‌شعر)', label: 'کوتاه‌واره دوزبانه (پاره‌شعر)' },
  ],
  video: [
    { value: 'سخنرانی روانکاوی', label: 'سخنرانی روانکاوی' },
    { value: 'حافظ‌پژوهی', label: 'حافظ‌پژوهی' },
    { value: 'جامعه و فرهنگ ایران', label: 'جامعه و فرهنگ ایران' },
    { value: 'هنر، خوشنویسی و یونسکو', label: 'هنر، خوشنویسی و یونسکو' },
    { value: 'مصاحبه رسانه‌ای', label: 'مصاحبه رسانه‌ای' },
  ],
  artwork: [
    { value: 'خوشنویسی مدرن و نستعلیق', label: 'خوشنویسی مدرن و نستعلیق' },
    { value: 'منطق‌الطیر و اسطوره', label: 'منطق‌الطیر و اسطوره' },
    { value: 'نقاشی آبستره و مواد طبیعی', label: 'نقاشی آبستره و مواد طبیعی' },
    { value: 'چنبره (Torus) و توپولوژی', label: 'چنبره (Torus) و توپولوژی' },
  ],
  exhibition: [
    { value: 'نمایشگاه انفرادی', label: 'نمایشگاه انفرادی' },
    { value: 'نمایشگاه گروهی بین‌المللی', label: 'نمایشگاه گروهی بین‌المللی' },
    { value: 'رویداد یونسکو و موزه‌ها', label: 'رویداد یونسکو و موزه‌ها' },
  ],
  page: [
    { value: 'مصاحبه مطبوعاتی', label: 'مصاحبه مطبوعاتی' },
    { value: 'کارنامه دانشگاهی و منابع', label: 'کارنامه دانشگاهی و منابع' },
    { value: 'بیانیه و یادداشت عمومی', label: 'بیانیه و یادداشت عمومی' },
  ],
};

function createEmptyDraft(): StudioWorkDraft {
  const now = new Date().toISOString();
  return {
    id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    workType: 'article',
    pillar: 'psychoanalysis',
    category: CATEGORY_BY_TYPE.article[0].value,
    originalLocale: 'fa',
    publicationYear: String(new Date().getFullYear()),
    publisherOrVenue: '',
    isbnOrDimensions: '',
    externalUrl: '',
    youtubeOrVideoUrl: '',
    primary: {
      languages_code: 'fa-IR',
      title: '',
      subtitle: '',
      summary: '',
      body_markdown: '',
      commentary_markdown: '',
      verses: [{ line_index: 1, hemistich_a: '', hemistich_b: '' }],
    },
    includeTranslations: false,
    optionalTranslations: {},
    seo: {},
    primaryAsset: null,
    documentAsset: null,
    book3DSpec: {
      showIn3DShowcase: true,
      allowFullPdfDownload: false,
      pageCount: '',
      samplePagesRangeNote: '',
    },
    audioIntro: null,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
}

interface WorkCreatorWizardProps {
  aiStatus: AiProviderRuntimeStatus | null;
  onDraftsCountChange: (count: number) => void;
  onPublishedSuccess: () => void;
}

export function WorkCreatorWizard({
  aiStatus,
  onDraftsCountChange,
  onPublishedSuccess,
}: WorkCreatorWizardProps) {
  const [drafts, setDrafts] = useState<Record<string, StudioWorkDraft>>({});
  const [activeDraftId, setActiveDraftId] = useState<string>('');
  const [activeOptionalLocale, setActiveOptionalLocale] = useState<Locale>('fr');
  const [seoOpen, setSeoOpen] = useState(false);
  const [draftsDrawerOpen, setDraftsDrawerOpen] = useState(false);
  const [lastSavedLabel, setLastSavedLabel] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishFeedback, setPublishFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Load drafts from IndexedDB (+ fallback sync with /api/studio/drafts)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await idbGet<Record<string, StudioWorkDraft>>(IDB_DRAFTS_INDEX_KEY);
        if (!mounted) return;
        if (stored && Object.keys(stored).length > 0) {
          setDrafts(stored);
          const sorted = Object.values(stored).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
          setActiveDraftId(sorted[0].id);
          onDraftsCountChange(sorted.length);
        } else {
          const fresh = createEmptyDraft();
          setDrafts({ [fresh.id]: fresh });
          setActiveDraftId(fresh.id);
          onDraftsCountChange(1);
        }
      } catch {
        const fresh = createEmptyDraft();
        setDrafts({ [fresh.id]: fresh });
        setActiveDraftId(fresh.id);
      } finally {
        if (mounted) setHydrated(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [onDraftsCountChange]);

  const activeDraft: StudioWorkDraft = drafts[activeDraftId] || createEmptyDraft();
  const draftsList = useMemo(
    () => Object.values(drafts).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [drafts]
  );

  // Per-item debounced auto-save to IndexedDB + optional server draft mirror
  useEffect(() => {
    if (!hydrated || !activeDraftId || !drafts[activeDraftId]) return;
    onDraftsCountChange(Object.keys(drafts).length);

    const timer = setTimeout(async () => {
      try {
        await idbSet(IDB_DRAFTS_INDEX_KEY, drafts);
        setLastSavedLabel(new Date().toLocaleTimeString('fa-IR'));
        const current = drafts[activeDraftId];
        if (current && current.primary.title.trim()) {
          fetch('/api/studio/drafts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(current),
          }).catch(() => {});
        }
      } catch {
        // ignore storage errors
      }
    }, 550);

    return () => clearTimeout(timer);
  }, [drafts, activeDraftId, hydrated, onDraftsCountChange]);

  const patchActive = (updater: (prev: StudioWorkDraft) => StudioWorkDraft) => {
    setPublishFeedback(null);
    setDrafts((prev) => {
      const base = prev[activeDraftId] || activeDraft;
      const updated = updater(base);
      return {
        ...prev,
        [updated.id]: { ...updated, updatedAt: new Date().toISOString() },
      };
    });
  };

  // Detect probable original script mismatch to assist professor politely
  const scriptWarning = useMemo(() => {
    const sample = `${activeDraft.primary.title} ${activeDraft.primary.body_markdown || ''}`.trim();
    if (!sample) return null;
    const hasPersian = /[\u0600-\u06FF]/.test(sample);
    if (hasPersian && activeDraft.originalLocale !== 'fa') {
      return 'متن واردشده حاوی حروف فارسی است؛ در صورت فارسی بودن اصل اثر، زبان اصلی را روی «فارسی (FA)» تنظیم فرمایید.';
    }
    if (!hasPersian && sample.length > 15 && activeDraft.originalLocale === 'fa') {
      return 'متن واردشده با الفبای لاتین است؛ در صورت فرانسوی یا انگلیسی بودن اصل اثر، زبان اصلی را تغییر دهید.';
    }
    return null;
  }, [activeDraft.primary.title, activeDraft.primary.body_markdown, activeDraft.originalLocale]);

  const otherLocales: Locale[] = useMemo(() => {
    return (['fa', 'fr', 'en'] as Locale[]).filter((l) => l !== activeDraft.originalLocale);
  }, [activeDraft.originalLocale]);

  useEffect(() => {
    if (!otherLocales.includes(activeOptionalLocale)) {
      setActiveOptionalLocale(otherLocales[0]);
    }
  }, [otherLocales, activeOptionalLocale]);

  const startAnotherDraft = () => {
    const fresh = createEmptyDraft();
    setDrafts((prev) => ({ ...prev, [fresh.id]: fresh }));
    setActiveDraftId(fresh.id);
    setPublishFeedback(null);
  };

  const removeDraft = async (id: string) => {
    setDrafts((prev) => {
      const copy = { ...prev };
      delete copy[id];
      const remaining = Object.values(copy);
      if (remaining.length === 0) {
        const fresh = createEmptyDraft();
        copy[fresh.id] = fresh;
        setActiveDraftId(fresh.id);
      } else if (id === activeDraftId) {
        setActiveDraftId(remaining[0].id);
      }
      idbSet(IDB_DRAFTS_INDEX_KEY, copy).catch(() => {});
      return copy;
    });
    fetch(`/api/studio/drafts?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
  };

  const handlePublishBatch = async (publishAllNonEmpty: boolean) => {
    const targets = publishAllNonEmpty
      ? draftsList.filter((d) => d.primary.title.trim().length > 0)
      : [activeDraft].filter((d) => d.primary.title.trim().length > 0);

    if (targets.length === 0) {
      setPublishFeedback({
        ok: false,
        message: 'لطفاً دست‌کم عنوان اثر را وارد فرمایید تا امکان ثبت نهایی فراهم شود.',
      });
      return;
    }

    setIsPublishing(true);
    setPublishFeedback(null);
    try {
      const res = await fetch('/api/studio/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drafts: targets }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setPublishFeedback({
          ok: false,
          message: data.error || 'ثبت نهایی با خطا روبه‌رو شد.',
        });
        return;
      }

      // Remove published drafts from local workspace and prepare clean draft
      const publishedIds = new Set(targets.map((t) => t.id));
      const remainingMap: Record<string, StudioWorkDraft> = {};
      for (const [k, v] of Object.entries(drafts)) {
        if (!publishedIds.has(k)) remainingMap[k] = v;
      }
      if (Object.keys(remainingMap).length === 0) {
        const fresh = createEmptyDraft();
        remainingMap[fresh.id] = fresh;
        setActiveDraftId(fresh.id);
      } else {
        setActiveDraftId(Object.keys(remainingMap)[0]);
      }
      setDrafts(remainingMap);
      await idbSet(IDB_DRAFTS_INDEX_KEY, remainingMap).catch(() => idbDel(IDB_DRAFTS_INDEX_KEY));

      const queuedTotal = (data.results || []).filter(
        (r: { queuedManualTargets?: string[] }) => (r.queuedManualTargets?.length || 0) > 0
      ).length;
      const autoTotal = (data.results || []).filter(
        (r: { autoTranslatedTargets?: string[] }) => (r.autoTranslatedTargets?.length || 0) > 0
      ).length;

      const summaryParts = [`${data.publishedCount} اثر با موفقیت در سایت ثبت شد.`];
      if (autoTotal > 0) {
        summaryParts.push(`${autoTotal} اثر به‌طور خودکار توسط Anthropic Claude ترجمه شد.`);
      }
      if (queuedTotal > 0) {
        summaryParts.push(
          `${queuedTotal} اثر برای ترجمه زبان‌های باقیمانده در «صف ترجمه دستی / آنتی‌گرویتی» ثبت گردید.`
        );
      }

      setPublishFeedback({ ok: true, message: summaryParts.join(' ') });
      onPublishedSuccess();
    } catch {
      setPublishFeedback({
        ok: false,
        message: 'خطا در ارتباط با سرور هنگام انتشار نهایی.',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const primaryDir = activeDraft.originalLocale === 'fa' ? 'rtl' : 'ltr';
  const readyBatchCount = draftsList.filter((d) => d.primary.title.trim().length > 0).length;

  return (
    <div className="space-y-5">
      {/* Top Draft Persistence & Batch Action Strip */}
      <div className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--foreground)]">
            <Save size={14} className="text-[var(--primary)]" />
            <span>
              {lastSavedLabel
                ? `ذخیره خودکار هر آیتم فعال (${lastSavedLabel})`
                : 'ذخیره خودکار مسوده‌ها فعال است'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setDraftsDrawerOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--surface-sunken)] border border-[var(--border-medium)] hover:border-[var(--primary)] text-[var(--foreground)] transition-colors"
          >
            <FolderOpen size={15} className="text-[var(--accent-gold)]" />
            <span>مسوده‌های ناتمام شما ({draftsList.length.toLocaleString('fa-IR')})</span>
            {draftsDrawerOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <button
            type="button"
            onClick={startAnotherDraft}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--surface-card)] border border-[var(--border-medium)] hover:border-[var(--primary)] text-[var(--primary)] transition-colors"
          >
            <FilePlus2 size={15} />
            <span>ذخیره و شروع اثر دیگر در کنار این اثر</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={isPublishing || !activeDraft.primary.title.trim()}
            onClick={() => handlePublishBatch(false)}
            className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--surface-sunken)] border border-[var(--border-medium)] hover:border-[var(--primary)] text-[var(--foreground)] disabled:opacity-50"
          >
            <CheckCircle2 size={15} className="text-[var(--primary)]" />
            <span>ثبت نهایی همین اثر</span>
          </button>

          <button
            type="button"
            disabled={isPublishing || readyBatchCount === 0}
            onClick={() => handlePublishBatch(true)}
            className="min-h-[42px] inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-extrabold bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {isPublishing ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
            <span>
              ثبت نهایی و جمعی ({readyBatchCount.toLocaleString('fa-IR')} اثر){' '}
              {aiStatus?.hasApiKeyConfigured ? '+ ترجمه خودکار Claude' : '+ صف ترجمه'}
            </span>
          </button>
        </div>
      </div>

      {/* Unfinished Drafts Drawer */}
      {draftsDrawerOpen && (
        <div className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-medium)] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[var(--foreground)]">
              فهرست مسوده‌های ذخیره‌شده روی دستگاه شما
            </h3>
            <span className="text-xs text-[var(--foreground-muted)]">
              با کلیک روی هر مورد، کار ناتمام دقیقاً از همان نقطه ادامه می‌یابد
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {draftsList.map((d) => {
              const isCurrent = d.id === activeDraft.id;
              return (
                <div
                  key={d.id}
                  className={`rounded-xl border p-3 flex items-center justify-between gap-2 ${
                    isCurrent
                      ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                      : 'border-[var(--border-subtle)] bg-[var(--surface-sunken)]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDraftId(d.id);
                      setDraftsDrawerOpen(false);
                    }}
                    className="text-right min-w-0 flex-1"
                  >
                    <div className="text-sm font-bold text-[var(--foreground)] truncate">
                      {d.primary.title || 'اثر بدون عنوان (در حال تکمیل)'}
                    </div>
                    <div className="text-xs text-[var(--foreground-muted)] mt-0.5">
                      {WORK_TYPE_OPTIONS.find((w) => w.value === d.workType)?.badge} • زبان اصلی:{' '}
                      {d.originalLocale.toUpperCase()}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeDraft(d.id)}
                    aria-label="حذف مسوده"
                    className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {publishFeedback && (
        <div
          className={`rounded-2xl border p-4 text-sm font-bold flex items-center gap-2.5 ${
            publishFeedback.ok
              ? 'border-emerald-500/60 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
              : 'border-red-500/60 bg-red-50/70 dark:bg-red-950/30 text-red-900 dark:text-red-200'
          }`}
        >
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{publishFeedback.message}</span>
        </div>
      )}

      {/* Main Unified Form Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Right/Primary Column: Classification + Text + Optional Translations + SEO */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card 1: Classification & Original Language */}
          <section className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
              <Layers size={18} className="text-[var(--primary)]" />
              <h2 className="text-base font-extrabold text-[var(--foreground)]">
                ۱. انتخاب دسته‌بندی و زبان اصلی اثر
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AccessibleListbox
                label="نوع اثر محتوایی"
                value={activeDraft.workType}
                options={WORK_TYPE_OPTIONS}
                onChange={(nextType) =>
                  patchActive((prev) => ({
                    ...prev,
                    workType: nextType,
                    category: CATEGORY_BY_TYPE[nextType][0].value,
                  }))
                }
              />

              <AccessibleListbox
                label="رکن فکری در ساختار سایت"
                value={activeDraft.pillar}
                options={PILLAR_OPTIONS}
                onChange={(nextPillar) => patchActive((prev) => ({ ...prev, pillar: nextPillar }))}
              />

              <AccessibleListbox
                label="دسته‌بندی موضوعی دقیق"
                value={activeDraft.category}
                options={CATEGORY_BY_TYPE[activeDraft.workType]}
                onChange={(nextCat) => patchActive((prev) => ({ ...prev, category: nextCat }))}
              />

              <div>
                <span className="block text-sm font-bold text-[var(--foreground)] mb-1.5">
                  زبان اصلی متن (نسخه مرجع)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { code: 'fa', label: 'فارسی', tag: 'FA' },
                      { code: 'fr', label: 'فرانسوی', tag: 'FR' },
                      { code: 'en', label: 'انگلیسی', tag: 'EN' },
                    ] as const
                  ).map((item) => {
                    const selected = activeDraft.originalLocale === item.code;
                    return (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() =>
                          patchActive((prev) => ({
                            ...prev,
                            originalLocale: item.code,
                            primary: {
                              ...prev.primary,
                              languages_code:
                                item.code === 'fa' ? 'fa-IR' : item.code === 'fr' ? 'fr-FR' : 'en',
                            },
                          }))
                        }
                        className={`min-h-[44px] rounded-xl border px-2.5 py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                          selected
                            ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--primary-foreground)]'
                            : 'bg-[var(--surface-sunken)] border-[var(--border-medium)] text-[var(--foreground)] hover:border-[var(--primary)]'
                        }`}
                      >
                        <span className="font-mono text-[11px]">{item.tag}</span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {scriptWarning && (
              <div className="rounded-xl border border-[var(--accent-gold)] bg-[var(--surface-sunken)] px-3.5 py-2.5 text-xs font-semibold text-[var(--foreground)]">
                {scriptWarning}
              </div>
            )}

            {/* Concise Metadata Fields per Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-[var(--foreground-muted)] mb-1">
                  سال خلق یا انتشار
                </label>
                <input
                  type="text"
                  value={activeDraft.publicationYear}
                  onChange={(e) =>
                    patchActive((prev) => ({ ...prev, publicationYear: e.target.value }))
                  }
                  placeholder="مثلاً 2026 یا ۱۴۰۵"
                  className="w-full min-h-[40px] rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] px-3 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--foreground-muted)] mb-1">
                  {activeDraft.workType === 'book'
                    ? 'نام ناشر'
                    : activeDraft.workType === 'exhibition'
                      ? 'شهر و گالری'
                      : 'محل ارائه یا رسانه'}
                </label>
                <input
                  type="text"
                  value={activeDraft.publisherOrVenue}
                  onChange={(e) =>
                    patchActive((prev) => ({ ...prev, publisherOrVenue: e.target.value }))
                  }
                  placeholder="مثلاً پاریس، یونسکو / نشر..."
                  className="w-full min-h-[40px] rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] px-3 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--foreground-muted)] mb-1">
                  {activeDraft.workType === 'book'
                    ? 'شابک (ISBN)'
                    : activeDraft.workType === 'artwork'
                      ? 'ابعاد و تکنیک اثر'
                      : 'لینک مرجع (اختیاری)'}
                </label>
                <input
                  type="text"
                  value={
                    activeDraft.workType === 'book' || activeDraft.workType === 'artwork'
                      ? activeDraft.isbnOrDimensions
                      : activeDraft.externalUrl
                  }
                  onChange={(e) =>
                    patchActive((prev) =>
                      prev.workType === 'book' || prev.workType === 'artwork'
                        ? { ...prev, isbnOrDimensions: e.target.value }
                        : { ...prev, externalUrl: e.target.value }
                    )
                  }
                  placeholder={
                    activeDraft.workType === 'book'
                      ? '978-...'
                      : activeDraft.workType === 'artwork'
                        ? '۱۰۰×۸۰ سانتی‌متر'
                        : 'https://...'
                  }
                  className="w-full min-h-[40px] rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] px-3 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* Card 2: Primary Content Editor */}
          <section className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-[var(--primary)]" />
                <h2 className="text-base font-extrabold text-[var(--foreground)]">
                  ۲. متن اصلی ({activeDraft.originalLocale.toUpperCase()})
                </h2>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--foreground-muted)]">
                جهت نگارش: {primaryDir.toUpperCase()}
              </span>
            </div>

            <div className="space-y-3" dir={primaryDir}>
              <div>
                <label className="block text-sm font-bold text-[var(--foreground)] mb-1">
                  عنوان اصلی اثر *
                </label>
                <input
                  type="text"
                  value={activeDraft.primary.title}
                  onChange={(e) =>
                    patchActive((prev) => ({
                      ...prev,
                      primary: { ...prev.primary, title: e.target.value },
                    }))
                  }
                  placeholder={
                    primaryDir === 'rtl'
                      ? 'عنوان کامل اثر را بنویسید...'
                      : 'Saisissez le titre original...'
                  }
                  className="w-full min-h-[46px] rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] px-4 text-sm font-bold text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--foreground-muted)] mb-1">
                  خلاصه یا چکیده معرفی (اختیاری)
                </label>
                <textarea
                  rows={2}
                  value={activeDraft.primary.summary || ''}
                  onChange={(e) =>
                    patchActive((prev) => ({
                      ...prev,
                      primary: { ...prev.primary, summary: e.target.value },
                    }))
                  }
                  placeholder={
                    primaryDir === 'rtl'
                      ? 'چکیده ۲ تا ۳ خطی برای معرفی در فهرست آثار...'
                      : 'Résumé succinct...'
                  }
                  className="w-full rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] p-3 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              {/* Poem Line-by-Line Dual-Hemistich Editor OR Standard Markdown Editor */}
              {activeDraft.workType === 'poem' ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[var(--foreground)]">
                      ابیات شعر (مصراع اول و دوم)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        patchActive((prev) => {
                          const verses = prev.primary.verses || [];
                          return {
                            ...prev,
                            primary: {
                              ...prev.primary,
                              verses: [
                                ...verses,
                                { line_index: verses.length + 1, hemistich_a: '', hemistich_b: '' },
                              ],
                            },
                          };
                        })
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--border-subtle)]"
                    >
                      <Plus size={14} />
                      <span>افزودن بیت جدید</span>
                    </button>
                  </div>

                  {(activeDraft.primary.verses || []).map((v, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-2.5"
                    >
                      <input
                        type="text"
                        value={v.hemistich_a}
                        onChange={(e) =>
                          patchActive((prev) => {
                            const nextVerses: StudioPoemVerseInput[] = [...(prev.primary.verses || [])];
                            nextVerses[idx] = { ...nextVerses[idx], hemistich_a: e.target.value };
                            return { ...prev, primary: { ...prev.primary, verses: nextVerses } };
                          })
                        }
                        placeholder={`بیت ${idx + 1} - مصراع اول`}
                        className="rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] px-3 py-2 text-sm text-[var(--foreground)]"
                      />
                      <input
                        type="text"
                        value={v.hemistich_b || ''}
                        onChange={(e) =>
                          patchActive((prev) => {
                            const nextVerses: StudioPoemVerseInput[] = [...(prev.primary.verses || [])];
                            nextVerses[idx] = { ...nextVerses[idx], hemistich_b: e.target.value };
                            return { ...prev, primary: { ...prev.primary, verses: nextVerses } };
                          })
                        }
                        placeholder={`بیت ${idx + 1} - مصراع دوم (اختیاری در شعر سپید)`}
                        className="rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] px-3 py-2 text-sm text-[var(--foreground)]"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-bold text-[var(--foreground)] mb-1">
                    {activeDraft.workType === 'video'
                      ? 'متن کامل سخنرانی / پیاده‌سازی گفتار (اختیاری)'
                      : 'متن کامل اثر، بیانیه یا توضیحات'}
                  </label>
                  <textarea
                    rows={6}
                    value={activeDraft.primary.body_markdown || ''}
                    onChange={(e) =>
                      patchActive((prev) => ({
                        ...prev,
                        primary: { ...prev.primary, body_markdown: e.target.value },
                      }))
                    }
                    placeholder={
                      primaryDir === 'rtl'
                        ? 'متن را اینجا بنویسید یا از ابزار ضبط و تایپ صوتی کنار صفحه استفاده کنید...'
                        : 'Texte complet de l’œuvre...'
                    }
                    className="w-full rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] p-3.5 text-sm leading-relaxed text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>
              )}

              {activeDraft.workType === 'video' && (
                <div>
                  <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                    نشانی ویدئو در یوتیوب یا ویمیو (استخراج خودکار شناسه)
                  </label>
                  <input
                    type="url"
                    dir="ltr"
                    value={activeDraft.youtubeOrVideoUrl || ''}
                    onChange={(e) => {
                      const norm = normaliseExternalVideoUrl(e.target.value);
                      patchActive((prev) => ({
                        ...prev,
                        youtubeOrVideoUrl: e.target.value,
                        externalUrl: norm.cleanUrl,
                      }));
                    }}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full min-h-[42px] rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] px-3 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Card 3: Optional Pre-existing Translations into the Other Two Languages (Req 3) */}
          <section className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Languages size={18} className="text-[var(--primary)]" />
                <div>
                  <h2 className="text-base font-extrabold text-[var(--foreground)]">
                    ۳. ورود اختیاری ترجمه به دو زبان دیگر
                  </h2>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    اگر متن این اثر را به یک یا هر دو زبان دیگر آماده دارید، همین‌جا وارد کنید تا بلافاصله منتشر شوند.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  patchActive((prev) => ({ ...prev, includeTranslations: !prev.includeTranslations }))
                }
                className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  activeDraft.includeTranslations
                    ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'bg-[var(--surface-sunken)] border-[var(--border-medium)] text-[var(--foreground)]'
                }`}
              >
                {activeDraft.includeTranslations
                  ? 'دارای ترجمه آماده هستم (باز)'
                  : 'ترجمه آماده دارم / باز کردن فیلدها'}
              </button>
            </div>

            {activeDraft.includeTranslations ? (
              <div className="space-y-4 pt-2 border-t border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  {otherLocales.map((loc) => {
                    const label = loc === 'fa' ? 'نسخه فارسی (FA)' : loc === 'fr' ? 'نسخه فرانسوی (FR)' : 'نسخه انگلیسی (EN)';
                    const hasData = Boolean(activeDraft.optionalTranslations[loc]?.title?.trim());
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setActiveOptionalLocale(loc)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-colors ${
                          activeOptionalLocale === loc
                            ? 'bg-[var(--primary-light)] border-[var(--primary)] text-[var(--primary)]'
                            : 'bg-[var(--surface-sunken)] border-[var(--border-subtle)] text-[var(--foreground-muted)]'
                        }`}
                      >
                        <span>{label}</span>
                        {hasData && <CheckCircle2 size={14} className="text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>

                {(() => {
                  const loc = activeOptionalLocale;
                  const tr = activeDraft.optionalTranslations[loc] || {
                    languages_code: loc === 'fa' ? 'fa-IR' : loc === 'fr' ? 'fr-FR' : 'en',
                    title: '',
                    summary: '',
                    body_markdown: '',
                  };
                  const locDir = loc === 'fa' ? 'rtl' : 'ltr';
                  return (
                    <div className="space-y-3" dir={locDir}>
                      <input
                        type="text"
                        value={tr.title}
                        onChange={(e) =>
                          patchActive((prev) => ({
                            ...prev,
                            optionalTranslations: {
                              ...prev.optionalTranslations,
                              [loc]: { ...tr, title: e.target.value },
                            },
                          }))
                        }
                        placeholder={
                          loc === 'fa'
                            ? 'عنوان فارسی...'
                            : loc === 'fr'
                              ? 'Titre en français...'
                              : 'Title in British Academic English...'
                        }
                        className="w-full min-h-[42px] rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] px-3.5 text-sm font-bold text-[var(--foreground)]"
                      />
                      <textarea
                        rows={2}
                        value={tr.summary || ''}
                        onChange={(e) =>
                          patchActive((prev) => ({
                            ...prev,
                            optionalTranslations: {
                              ...prev.optionalTranslations,
                              [loc]: { ...tr, summary: e.target.value },
                            },
                          }))
                        }
                        placeholder={
                          loc === 'fa'
                            ? 'چکیده فارسی...'
                            : loc === 'fr'
                              ? 'Résumé en français...'
                              : 'Academic summary in English...'
                        }
                        className="w-full rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] p-3 text-sm text-[var(--foreground)]"
                      />
                      <textarea
                        rows={4}
                        value={tr.body_markdown || ''}
                        onChange={(e) =>
                          patchActive((prev) => ({
                            ...prev,
                            optionalTranslations: {
                              ...prev.optionalTranslations,
                              [loc]: { ...tr, body_markdown: e.target.value },
                            },
                          }))
                        }
                        placeholder={
                          loc === 'fa'
                            ? 'متن کامل ترجمه فارسی...'
                            : loc === 'fr'
                              ? 'Texte complet en français...'
                              : 'Full text in British Academic English...'
                        }
                        className="w-full rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] p-3 text-sm text-[var(--foreground)]"
                      />
                    </div>
                  );
                })()}
              </div>
            ) : (
              <p className="text-xs text-[var(--foreground-muted)] bg-[var(--surface-sunken)] rounded-xl p-3 border border-[var(--border-subtle)]">
                {aiStatus?.hasApiKeyConfigured
                  ? 'در صورت خالی ماندن فیلدهای ترجمه، به محض «ثبت نهایی» سیستم به‌طور خودکار ترجمه دو زبان دیگر را با موتور Anthropic Claude انجام می‌دهد.'
                  : 'اگر فعلاً ترجمه‌ای وارد نفرمایید، هیچ ایرادی ندارد؛ پس از ثبت نهایی، اثر به‌صورت خودکار وارد «صف ترجمه دستی / آنتی‌گرویتی» می‌شود تا بدون وقفه ترجمه و منتشر گردد.'}
              </p>
            )}
          </section>

          {/* Card 4: Optional Plain-Language SEO Prompts (Req 5) */}
          <section className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSeoOpen((o) => !o)}
                className="flex items-center gap-2 text-right font-extrabold text-sm text-[var(--foreground)]"
              >
                {seoOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                <span>۴. توضیحات سئو برای دیده شدن در گوگل و هوش مصنوعی (کاملاً اختیاری)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const suggestion = suggestSeoFromContent({
                    title: activeDraft.primary.title || 'اثر جدید',
                    summary: activeDraft.primary.summary,
                    body: activeDraft.primary.body_markdown,
                    locale: activeDraft.originalLocale,
                    category: activeDraft.category,
                  });
                  patchActive((prev) => ({ ...prev, seo: { ...prev.seo, ...suggestion } }));
                  setSeoOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--surface-sunken)] border border-[var(--border-subtle)] hover:border-[var(--primary)] text-[var(--primary)]"
              >
                <Sparkles size={14} />
                <span>پرکردن هوشمند پیشنهادی</span>
              </button>
            </div>

            {seoOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-[var(--border-subtle)]">
                <div>
                  <label className="block text-xs font-bold text-[var(--foreground-muted)] mb-1">
                    توصیف یک‌جمله‌ای تصویر برای گوگل و نابینایان (Alt تصویر)
                  </label>
                  <input
                    type="text"
                    value={activeDraft.seo.imageAltText || ''}
                    onChange={(e) =>
                      patchActive((prev) => ({
                        ...prev,
                        seo: { ...prev.seo, imageAltText: e.target.value },
                      }))
                    }
                    placeholder="مثلاً: تابلوی خط نقاشی نستعلیق روی بوم کتان اثر دکتر حسن مکارمی"
                    className="w-full min-h-[40px] rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] px-3 text-xs text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--foreground-muted)] mb-1">
                    عنوان کوتاه نمایشی در نتایج جستجو
                  </label>
                  <input
                    type="text"
                    value={activeDraft.seo.metaTitle || ''}
                    onChange={(e) =>
                      patchActive((prev) => ({
                        ...prev,
                        seo: { ...prev.seo, metaTitle: e.target.value },
                      }))
                    }
                    placeholder="حداکثر ۶۵ کاراکتر..."
                    className="w-full min-h-[40px] rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] px-3 text-xs text-[var(--foreground)]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[var(--foreground-muted)] mb-1">
                    پاسخ کوتاه ۲ خطی برای نمایش در گوگل و خلاصه‌سازهای هوش مصنوعی
                  </label>
                  <textarea
                    rows={2}
                    value={activeDraft.seo.metaDescription || ''}
                    onChange={(e) =>
                      patchActive((prev) => ({
                        ...prev,
                        seo: { ...prev.seo, metaDescription: e.target.value },
                      }))
                    }
                    placeholder="خواننده در این اثر با چه پرسش و پاسخ محوری روبه‌رو می‌شود؟"
                    className="w-full rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] p-3 text-xs text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--foreground-muted)] mb-1">
                    کلمات کلیدی پیشنهادی (با ویرگول جدا کنید)
                  </label>
                  <input
                    type="text"
                    value={activeDraft.seo.keywords || ''}
                    onChange={(e) =>
                      patchActive((prev) => ({
                        ...prev,
                        seo: { ...prev.seo, keywords: e.target.value },
                      }))
                    }
                    placeholder="روانکاوی، دگرشنیدن، حافظ، خوشنویسی مدرن"
                    className="w-full min-h-[40px] rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] px-3 text-xs text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--foreground-muted)] mb-1">
                    {activeDraft.workType === 'video'
                      ? 'سرفصل‌های زمانی مهم ویدئو'
                      : 'نام عکاس، تکنیک اجرا یا مجوز نشر'}
                  </label>
                  <input
                    type="text"
                    value={
                      activeDraft.workType === 'video'
                        ? activeDraft.seo.videoChapters || ''
                        : activeDraft.seo.creditsOrTechnique || ''
                    }
                    onChange={(e) =>
                      patchActive((prev) => ({
                        ...prev,
                        seo:
                          prev.workType === 'video'
                            ? { ...prev.seo, videoChapters: e.target.value }
                            : { ...prev.seo, creditsOrTechnique: e.target.value },
                      }))
                    }
                    placeholder={
                      activeDraft.workType === 'video'
                        ? '۰۰:۰۰ مقدمه، ۰۴:۳۰ بحث لکان'
                        : 'مرکب و اکرلیک روی بوم'
                    }
                    className="w-full min-h-[40px] rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] px-3 text-xs text-[var(--foreground)]"
                  />
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Left Column: Standardised Upload Gatekeeper Dropzones + Voice Studio */}
        <div className="lg:col-span-5 space-y-5">
          {activeDraft.workType === 'book' ? (
            <>
              <StandardUploadDropzone
                slot="book_front_cover"
                value={activeDraft.book3DSpec?.frontCover}
                onChange={(asset) =>
                  patchActive((prev) => ({
                    ...prev,
                    primaryAsset: asset,
                    book3DSpec: {
                      ...(prev.book3DSpec || { showIn3DShowcase: true, allowFullPdfDownload: false }),
                      frontCover: asset,
                    },
                  }))
                }
              />
              <StandardUploadDropzone
                slot="book_back_cover"
                compact
                value={activeDraft.book3DSpec?.backCover}
                onChange={(asset) =>
                  patchActive((prev) => ({
                    ...prev,
                    book3DSpec: {
                      ...(prev.book3DSpec || { showIn3DShowcase: true, allowFullPdfDownload: false }),
                      backCover: asset,
                    },
                  }))
                }
              />
              <StandardUploadDropzone
                slot="book_spine"
                compact
                value={activeDraft.book3DSpec?.spineImage}
                onChange={(asset) =>
                  patchActive((prev) => ({
                    ...prev,
                    book3DSpec: {
                      ...(prev.book3DSpec || { showIn3DShowcase: true, allowFullPdfDownload: false }),
                      spineImage: asset,
                    },
                  }))
                }
              />
              <StandardUploadDropzone
                slot="document_pdf"
                customLabel="فایل PDF کامل یا صفحات برگزیده برای ورق‌زن ۳بعدی کتاب"
                value={activeDraft.book3DSpec?.samplePagesFile}
                onChange={(asset) =>
                  patchActive((prev) => ({
                    ...prev,
                    documentAsset: asset,
                    book3DSpec: {
                      ...(prev.book3DSpec || { showIn3DShowcase: true, allowFullPdfDownload: false }),
                      samplePagesFile: asset,
                    },
                  }))
                }
              />
            </>
          ) : (
            <>
              <StandardUploadDropzone
                slot={
                  activeDraft.workType === 'artwork'
                    ? 'artwork_iiif'
                    : activeDraft.workType === 'video'
                      ? 'video_asset'
                      : 'article_or_exhibition_cover'
                }
                value={activeDraft.primaryAsset}
                onChange={(asset) => patchActive((prev) => ({ ...prev, primaryAsset: asset }))}
              />
              <StandardUploadDropzone
                slot="document_pdf"
                compact
                value={activeDraft.documentAsset}
                onChange={(asset) => patchActive((prev) => ({ ...prev, documentAsset: asset }))}
              />
            </>
          )}

          {/* Voice Recording / File Drop Box */}
          <div className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 space-y-3">
            <VoiceRecorderWidget
              itemId={activeDraft.id}
              itemTitle={activeDraft.primary.title || 'اثر جدید'}
              mode="site_intro"
              existingAudio={activeDraft.audioIntro}
              onSaveAudio={(audio) => patchActive((prev) => ({ ...prev, audioIntro: audio }))}
              onTranscriptAppended={(txt) =>
                patchActive((prev) => ({
                  ...prev,
                  primary: {
                    ...prev.primary,
                    body_markdown: prev.primary.body_markdown
                      ? `${prev.primary.body_markdown}\n${txt}`
                      : txt,
                  },
                }))
              }
            />
            <div className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--foreground-muted)] space-y-0.5">
              <div>
                <strong className="text-[var(--foreground)]">فرمت‌های مجاز صوت:</strong> MP3 / M4A / WAV / WEBM
              </div>
              <div>
                <strong className="text-[var(--foreground)]">سقف حجم:</strong> حداکثر ۱۵ مگابایت •{' '}
                <strong className="text-[var(--foreground)]">پیشنهاد:</strong> ضبط ۱ تا ۳ دقیقه در محیط آرام با میکروفون بالای کادر
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
