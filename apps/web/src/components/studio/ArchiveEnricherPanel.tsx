'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  FolderPlus,
  Link2,
  Loader2,
  Plus,
  Search,
} from 'lucide-react';
import type {
  Locale,
  StudioStandardisedAsset,
  TranslationWorkDetail,
  TranslationWorkSummary,
} from '@makaremi/shared';
import { AccessibleListbox, type ListboxOption } from './AccessibleListbox';
import { StandardUploadDropzone } from './StandardUploadDropzone';
import { DestinationLinkButton } from '@/components/common/DestinationLinkButton';

const COLLECTION_OPTIONS: ListboxOption<string>[] = [
  { value: 'all', label: 'همه آثار آرشیو (۱٬۰۶۸ اثر)' },
  { value: 'articles', label: 'مقالات و جستارها' },
  { value: 'books', label: 'کتاب‌ها و رساله‌ها' },
  { value: 'poems', label: 'اشعار و مصراع‌ها' },
  { value: 'videos', label: 'سخنرانی‌ها و ویدئوها' },
  { value: 'artworks', label: 'تابلوهای گالری' },
  { value: 'exhibitions', label: 'نمایشگاه‌ها' },
  { value: 'pages', label: 'صفحات و مصاحبه‌ها' },
];

const LINK_PLATFORMS: ListboxOption<string>[] = [
  { value: 'YouTube', label: 'ویدئو در یوتیوب (YouTube)' },
  { value: 'Amazon / Publisher', label: 'لینک خرید آمازون یا ناشر' },
  { value: 'UNESCO / Press', label: 'گزارش یونسکو یا رسانه' },
  { value: 'PDF / Archive', label: 'فایل یا پیوند مرجع علمی (DOI)' },
];

interface ArchiveEnricherPanelProps {
  onEnrichedSuccess: () => void;
}

export function ArchiveEnricherPanel({ onEnrichedSuccess }: ArchiveEnricherPanelProps) {
  const [collectionFilter, setCollectionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [works, setWorks] = useState<TranslationWorkSummary[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [selectedWork, setSelectedWork] = useState<TranslationWorkDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // New Enrichment Inputs
  const [noteLocale, setNoteLocale] = useState<Locale>('fa');
  const [noteHeading, setNoteHeading] = useState('');
  const [noteBody, setNoteBody] = useState('');

  const [linkPlatform, setLinkPlatform] = useState('Amazon / Publisher');
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const [docTitle, setDocTitle] = useState('');
  const [docAsset, setDocAsset] = useState<StudioStandardisedAsset | null>(null);
  const [coverAsset, setCoverAsset] = useState<StudioStandardisedAsset | null>(null);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoadingList(true);
      try {
        const sp = new URLSearchParams({
          collection: collectionFilter,
          q: searchQuery,
          page: '1',
          pageSize: '20',
        });
        const res = await fetch(`/api/studio/works?${sp.toString()}`, { signal: controller.signal });
        const data = await res.json();
        if (res.ok && data.ok) {
          setWorks(data.items || []);
        }
      } catch {
        // ignore abort
      } finally {
        setLoadingList(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [collectionFilter, searchQuery]);

  const loadWorkDetail = async (item: TranslationWorkSummary) => {
    setLoadingDetail(true);
    setFeedback(null);
    try {
      const res = await fetch(
        `/api/studio/works/${encodeURIComponent(item.collection)}/${encodeURIComponent(item.slug)}`
      );
      const data = await res.json();
      if (res.ok && data.ok) {
        setSelectedWork(data.detail);
        setNoteLocale(data.detail.originalLocale || 'fa');
      }
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSaveEnrichment = async () => {
    if (!selectedWork) return;

    const hasNote = Boolean(noteHeading.trim() && noteBody.trim());
    const hasLink = Boolean(linkLabel.trim() && linkUrl.trim());
    const hasDoc = Boolean(docAsset && (docTitle.trim() || docAsset.fileName));
    const hasBookCover = Boolean(coverAsset && selectedWork.collection === 'books');

    if (!hasNote && !hasLink && !hasDoc && !hasBookCover) {
      setFeedback({
        ok: false,
        msg: 'لطفاً حداقل یک مطلب تکمیلی، پیوند یا مدرک استاندارد را پیش از ذخیره وارد فرمایید.',
      });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/studio/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: selectedWork.collection,
          slug: selectedWork.slug,
          ...(hasNote ? { note: { locale: noteLocale, heading: noteHeading, bodyMarkdown: noteBody } } : {}),
          ...(hasLink ? { link: { platform: linkPlatform, label: linkLabel, url: linkUrl } } : {}),
          ...(hasDoc && docAsset
            ? {
                document: {
                  title: docTitle.trim() || docAsset.fileName,
                  slot: docAsset.slot,
                  fileName: docAsset.fileName,
                  mimeType: docAsset.mimeType,
                  sizeBytes: docAsset.sizeBytes,
                  dataUrl: docAsset.dataUrl,
                },
              }
            : {}),
          ...(hasBookCover && coverAsset
            ? { bookCoverOverrides: { frontCoverDataUrl: coverAsset.dataUrl } }
            : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFeedback({ ok: false, msg: data.error || 'خطا در ثبت پیوست تکمیلی.' });
        return;
      }

      setSelectedWork((prev) => (prev ? { ...prev, enrichment: data.enrichment } : null));
      setNoteHeading('');
      setNoteBody('');
      setLinkLabel('');
      setLinkUrl('');
      setDocTitle('');
      setDocAsset(null);
      setCoverAsset(null);
      setFeedback({ ok: true, msg: data.message });
      onEnrichedSuccess();
    } catch {
      setFeedback({ ok: false, msg: 'ارتباط با سرور هنگام ذخیره پیوست برقرار نشد.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Search & Select Existing Work Column */}
      <div className="lg:col-span-5 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
          <FolderPlus size={18} className="text-[var(--primary)]" />
          <div>
            <h2 className="text-base font-extrabold text-[var(--foreground)]">
              ۱. جستجو و انتخاب اثر از آرشیو موجود
            </h2>
            <p className="text-xs text-[var(--foreground-muted)]">
              انتخاب هر یک از ۱٬۰۶۸ اثر برای افزودن مطلب، لینک یا مدرک تازه بدون آسیب به متن اصلی
            </p>
          </div>
        </div>

        <AccessibleListbox
          label="فیلتر بر اساس مجموعه"
          value={collectionFilter}
          options={COLLECTION_OPTIONS}
          onChange={setCollectionFilter}
        />

        <div className="relative">
          <Search
            size={16}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی عنوان یا شناسه اثر..."
            className="w-full min-h-[44px] rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] pr-10 pl-3 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
          />
        </div>

        <div className="space-y-2 max-h-[480px] overflow-y-auto pl-1">
          {loadingList ? (
            <div className="py-10 flex items-center justify-center gap-2 text-xs text-[var(--foreground-muted)]">
              <Loader2 size={16} className="animate-spin" />
              <span>در حال جستجو در آرشیو...</span>
            </div>
          ) : works.length === 0 ? (
            <p className="py-8 text-center text-xs text-[var(--foreground-muted)]">
              اثری با این فیلتر یافت نشد.
            </p>
          ) : (
            works.map((w) => {
              const isSelected = selectedWork?.slug === w.slug && selectedWork?.collection === w.collection;
              return (
                <button
                  key={`${w.collection}:${w.slug}`}
                  type="button"
                  onClick={() => loadWorkDetail(w)}
                  className={`w-full text-right rounded-xl border p-3 transition-colors ${
                    isSelected
                      ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                      : 'border-[var(--border-subtle)] bg-[var(--surface-sunken)] hover:border-[var(--primary)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--foreground-muted)] mb-1">
                    <span className="font-mono uppercase">{w.collection}</span>
                    <div className="flex items-center gap-1.5">
                      {(w.enrichmentCount || 0) > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--primary)] font-bold">
                          +{(w.enrichmentCount || 0).toLocaleString('fa-IR')} پیوست
                        </span>
                      )}
                      <span className="font-bold">اصلی: {w.originalLocale.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-[var(--foreground)] line-clamp-2">
                    {w.title}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Enrich Selected Work */}
      <div className="lg:col-span-7 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 space-y-5">
        {loadingDetail ? (
          <div className="py-20 flex items-center justify-center gap-2 text-sm text-[var(--foreground-muted)]">
            <Loader2 size={18} className="animate-spin" />
            <span>در حال بارگذاری پرونده اثر...</span>
          </div>
        ) : !selectedWork ? (
          <div className="py-16 text-center space-y-2">
            <FolderPlus size={36} strokeWidth={1.4} className="mx-auto text-[var(--foreground-muted)]" />
            <h3 className="text-base font-extrabold text-[var(--foreground)]">
              یک اثر را از ستون سمت راست انتخاب فرمایید
            </h3>
            <p className="text-xs text-[var(--foreground-muted)] max-w-md mx-auto leading-relaxed">
              پس از انتخاب هر کتاب، مقاله، شعر یا تابلو، می‌توانید مطلب تکمیلی، پیوند بیرونی، تصویر جلد یا سند PDF جدید به آن بیفزایید.
            </p>
          </div>
        ) : (
          <>
            <div className="border-b border-[var(--border-subtle)] pb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-mono text-[var(--accent-gold)] font-bold mb-1">
                  {selectedWork.collection.toUpperCase()} • {selectedWork.slug}
                </div>
                <h3 className="text-lg font-extrabold text-[var(--foreground)]">
                  {selectedWork.originalContent.title}
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--foreground)]">
                زبان اصلی: {selectedWork.originalLocale.toUpperCase()}
              </span>
            </div>

            {feedback && (
              <div
                className={`rounded-xl border p-3 text-xs font-bold flex items-center gap-2 ${
                  feedback.ok
                    ? 'border-emerald-500/60 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                    : 'border-red-500/60 bg-red-50/70 dark:bg-red-950/30 text-red-900 dark:text-red-200'
                }`}
              >
                <CheckCircle2 size={15} />
                <span>{feedback.msg}</span>
              </div>
            )}

            {/* Existing Enrichments Preview */}
            {selectedWork.enrichment &&
              (selectedWork.enrichment.notes.length > 0 ||
                selectedWork.enrichment.links.length > 0 ||
                selectedWork.enrichment.documents.length > 0) && (
                <div className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-3.5 space-y-2 text-xs">
                  <div className="font-extrabold text-[var(--foreground)]">
                    پیوست‌های ثبت‌شده پیشین روی این اثر:
                  </div>
                  {selectedWork.enrichment.notes.map((n) => (
                    <div key={n.id} className="flex items-center gap-2 text-[var(--foreground-muted)]">
                      <FileText size={13} className="text-[var(--primary)] shrink-0" />
                      <span>یادداشت ({n.locale.toUpperCase()}): {n.heading}</span>
                    </div>
                  ))}
                  {selectedWork.enrichment.links.map((l) => (
                    <div key={l.id} className="flex flex-wrap items-center gap-2 text-[var(--foreground-muted)]">
                      <DestinationLinkButton href={l.url} label={l.label} locale="fa" compact />
                    </div>
                  ))}
                  {selectedWork.enrichment.documents.map((d) => (
                    <div key={d.id} className="flex items-center gap-2 text-[var(--foreground-muted)]">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                      <span>مدرک پیوست‌شده: {d.title} ({d.fileName})</span>
                    </div>
                  ))}
                </div>
              )}

            {/* A) Add Supplementary Note / Addendum */}
            <div className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-extrabold text-[var(--foreground)] flex items-center gap-1.5">
                  <Plus size={15} className="text-[var(--primary)]" />
                  <span>الف) افزودن مطلب یا یادداشت تکمیلی جدید</span>
                </h4>
                <div className="flex items-center gap-1">
                  {(['fa', 'fr', 'en'] as Locale[]).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setNoteLocale(l)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                        noteLocale === l
                          ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                          : 'bg-[var(--surface-card)] text-[var(--foreground-muted)] border-[var(--border-subtle)]'
                      }`}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                dir={noteLocale === 'fa' ? 'rtl' : 'ltr'}
                value={noteHeading}
                onChange={(e) => setNoteHeading(e.target.value)}
                placeholder="عنوان بخش تکمیلی یا مؤخره جدید..."
                className="w-full min-h-[40px] rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] px-3 text-sm text-[var(--foreground)]"
              />
              <textarea
                rows={3}
                dir={noteLocale === 'fa' ? 'rtl' : 'ltr'}
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="متن تکمیلی که به انتهای این اثر افزوده شود (بدون حذف متن اصیل پیشین)..."
                className="w-full rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] p-3 text-sm text-[var(--foreground)]"
              />
            </div>

            {/* B) Add External Link */}
            <div className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-4 space-y-3">
              <h4 className="text-sm font-extrabold text-[var(--foreground)] flex items-center gap-1.5">
                <Link2 size={15} className="text-[var(--primary)]" />
                <span>ب) افزودن لینک مرتبط جدید (خرید، ویدئو، ناشر یا منبع)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AccessibleListbox
                  label="نوع پیوند"
                  value={linkPlatform}
                  options={LINK_PLATFORMS}
                  onChange={setLinkPlatform}
                />
                <div>
                  <label className="block text-sm font-bold text-[var(--foreground)] mb-1.5">
                    عنوان نمایشی پیوند
                  </label>
                  <input
                    type="text"
                    value={linkLabel}
                    onChange={(e) => setLinkLabel(e.target.value)}
                    placeholder="مثلاً: نسخه جدید آمازون اروپا"
                    className="w-full min-h-[44px] rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] px-3 text-sm text-[var(--foreground)]"
                  />
                </div>
              </div>
              <input
                type="url"
                dir="ltr"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="w-full min-h-[42px] rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] px-3 text-sm text-[var(--foreground)]"
              />
            </div>

            {/* C) Upload Supporting PDF / Document (and Book Cover if book) */}
            <div className="space-y-3">
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="عنوان مدرک یا سند جدید (مثلاً: فایل PDF ضمیمه یا عکس جدید)..."
                className="w-full min-h-[42px] rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] px-3.5 text-sm text-[var(--foreground)]"
              />
              <StandardUploadDropzone
                slot={selectedWork.collection === 'artworks' ? 'artwork_iiif' : 'document_pdf'}
                compact
                value={docAsset}
                onChange={setDocAsset}
                customLabel="ج) پیوست سند PDF یا مدرک استاندارد جدید به این اثر"
              />
              {selectedWork.collection === 'books' && (
                <StandardUploadDropzone
                  slot="book_front_cover"
                  compact
                  value={coverAsset}
                  onChange={setCoverAsset}
                  customLabel="جایگزینی یا ارتقای تصویر روی جلد کتاب سه‌بعدی"
                />
              )}
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={handleSaveEnrichment}
              className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-extrabold text-sm transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              <span>ثبت و امضای دیجیتال پیوست و انتشار در سایت</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
