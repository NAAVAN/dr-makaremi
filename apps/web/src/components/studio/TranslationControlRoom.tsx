'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Languages,
  Loader2,
  Lock,
  Save,
  Search,
} from 'lucide-react';
import type {
  Locale,
  StudioLocaleContentInput,
  StudioPoemVerseInput,
  TranslationWorkDetail,
  TranslationWorkSummary,
} from '@makaremi/shared';
import { AccessibleListbox, type ListboxOption } from './AccessibleListbox';

const COLLECTION_OPTIONS: ListboxOption<string>[] = [
  { value: 'all', label: 'همه کلکسیون‌ها (۱٬۰۶۸ اثر)' },
  { value: 'articles', label: 'مقالات و جستارها (۴۰۳+)' },
  { value: 'poems', label: 'اشعار و کوتاه‌واره‌ها (۳۰۰+)' },
  { value: 'videos', label: 'سخنرانی‌ها و ویدئوها (۲۶۱+)' },
  { value: 'books', label: 'کتاب‌ها و رساله‌ها (۲۴+)' },
  { value: 'artworks', label: 'تابلوهای گالری (۲۹+)' },
  { value: 'exhibitions', label: 'نمایشگاه‌ها (۲۷+)' },
  { value: 'pages', label: 'صفحات و مصاحبه‌ها (۲۴+)' },
];

const ORIGINAL_LANG_OPTIONS: ListboxOption<string>[] = [
  { value: 'all', label: 'همه زبان‌های اصلی' },
  { value: 'fa', label: 'زبان اصلی: فارسی (FA)' },
  { value: 'fr', label: 'زبان اصلی: فرانسوی (FR)' },
  { value: 'en', label: 'زبان اصلی: انگلیسی (EN)' },
];

const STATE_OPTIONS: ListboxOption<string>[] = [
  { value: 'all', label: 'همه وضعیت‌های ترجمه' },
  { value: 'complete', label: 'دارای هر ۳ زبان (کامل)' },
  { value: 'missing', label: 'در انتظار تکمیل ترجمه' },
  { value: 'enriched', label: 'دارای پیوست یا اصلاح جدید' },
];

function buildPublicWorkHref(
  collection: TranslationWorkDetail['collection'],
  slug: string,
  locale: Locale
): string {
  switch (collection) {
    case 'articles':
      return `/${locale}/articles/${slug}`;
    case 'books':
      return `/${locale}/books/${slug}`;
    case 'poems':
      return `/${locale}/poetry/${slug}`;
    case 'videos':
      return `/${locale}/media/${slug}`;
    case 'artworks':
    case 'exhibitions':
      return `/${locale}/gallery`;
    case 'pages':
      return `/${locale}/about`;
  }
}

interface TranslationControlRoomProps {
  onTranslationSaved: () => void;
}

export function TranslationControlRoom({ onTranslationSaved }: TranslationControlRoomProps) {
  const [collectionFilter, setCollectionFilter] = useState('all');
  const [origLangFilter, setOrigLangFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<TranslationWorkSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingList, setLoadingList] = useState(false);

  const [detail, setDetail] = useState<TranslationWorkDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editingLocale, setEditingLocale] = useState<Locale>('fr');
  const [editDraft, setEditDraft] = useState<StudioLocaleContentInput | null>(null);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const fetchList = useCallback(async () => {
    setLoadingList(true);
    try {
      const sp = new URLSearchParams({
        collection: collectionFilter,
        originalLocale: origLangFilter,
        state: stateFilter,
        q: searchQuery,
        page: String(page),
        pageSize: '20',
      });
      const res = await fetch(`/api/studio/works?${sp.toString()}`);
      const data = await res.json();
      if (res.ok && data.ok) {
        setItems(data.items || []);
        setTotal(data.total || 0);
      }
    } finally {
      setLoadingList(false);
    }
  }, [collectionFilter, origLangFilter, stateFilter, searchQuery, page]);

  useEffect(() => {
    const t = setTimeout(fetchList, 200);
    return () => clearTimeout(t);
  }, [fetchList]);

  useEffect(() => {
    setPage(1);
  }, [collectionFilter, origLangFilter, stateFilter, searchQuery]);

  const initLocaleEditor = useCallback((workDetail: TranslationWorkDetail, targetLoc: Locale) => {
    setEditingLocale(targetLoc);
    const existing = workDetail.translations[targetLoc];
    if (existing) {
      setEditDraft({
        ...existing,
        verses: existing.verses ? existing.verses.map((v) => ({ ...v })) : undefined,
      });
    } else {
      // Scaffold cleanly from original work (preserving line_index structure for poems!)
      setEditDraft({
        languages_code: targetLoc === 'fa' ? 'fa-IR' : targetLoc === 'fr' ? 'fr-FR' : 'en',
        title: '',
        subtitle: '',
        summary: '',
        body_markdown: '',
        commentary_markdown: '',
        verses: workDetail.originalContent.verses
          ? workDetail.originalContent.verses.map((v) => ({
              line_index: v.line_index,
              hemistich_a: '',
              hemistich_b: v.hemistich_b !== undefined ? '' : undefined,
            }))
          : undefined,
      });
    }
  }, []);

  const handleSelectWork = async (row: TranslationWorkSummary, preferredLocale?: Locale) => {
    setLoadingDetail(true);
    setFeedback(null);
    try {
      const res = await fetch(
        `/api/studio/works/${encodeURIComponent(row.collection)}/${encodeURIComponent(row.slug)}`
      );
      const data = await res.json();
      if (res.ok && data.ok && data.detail) {
        const d = data.detail as TranslationWorkDetail;
        setDetail(d);
        const firstOther: Locale =
          preferredLocale && preferredLocale !== d.originalLocale
            ? preferredLocale
            : (['fr', 'en', 'fa'] as Locale[]).find((l) => l !== d.originalLocale) || 'fr';
        initLocaleEditor(d, firstOther);
      }
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSaveTranslation = async () => {
    if (!detail || !editDraft) return;
    if (!editDraft.title.trim()) {
      setFeedback({ ok: false, msg: 'عنوان ترجمه نمی‌تواند خالی باشد.' });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/studio/translations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection: detail.collection,
          slug: detail.slug,
          targetLocale: editingLocale,
          title: editDraft.title,
          subtitle: editDraft.subtitle,
          summary: editDraft.summary,
          body_markdown: editDraft.body_markdown,
          commentary_markdown: editDraft.commentary_markdown,
          verses: editDraft.verses,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFeedback({ ok: false, msg: data.error || 'خطا در ذخیره ترجمه.' });
        return;
      }

      setDetail((prev) =>
        prev
          ? {
              ...prev,
              translations: {
                ...prev.translations,
                [editingLocale]: {
                  ...editDraft,
                  provenance: 'editorial_verified',
                  updated_at: data.updatedAt,
                },
              },
            }
          : null
      );
      setFeedback({ ok: true, msg: data.message });
      fetchList();
      onTranslationSaved();
    } catch {
      setFeedback({ ok: false, msg: 'خطای ارتباط با سرور هنگام ذخیره ترجمه.' });
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / 20));
  const origDir = detail?.originalLocale === 'fa' ? 'rtl' : 'ltr';
  const editDir = editingLocale === 'fa' ? 'rtl' : 'ltr';

  return (
    <div className="space-y-5">
      {/* Filter Bar */}
      <div className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <AccessibleListbox
          label="بخش محتوایی"
          value={collectionFilter}
          options={COLLECTION_OPTIONS}
          onChange={setCollectionFilter}
        />
        <AccessibleListbox
          label="زبان اصلی اثر"
          value={origLangFilter}
          options={ORIGINAL_LANG_OPTIONS}
          onChange={setOrigLangFilter}
        />
        <AccessibleListbox
          label="وضعیت پوشش ترجمه"
          value={stateFilter}
          options={STATE_OPTIONS}
          onChange={setStateFilter}
        />
        <div>
          <label className="block text-sm font-bold text-[var(--foreground)] mb-1.5">
            جستجو در عنوان یا شناسه
          </label>
          <div className="relative">
            <Search
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="عنوان فارسی، فرانسوی یا انگلیسی..."
              className="w-full min-h-[44px] rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] pr-10 pl-3 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Split View: Works List + Side-by-Side Trilingual Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Works Table Column */}
        <div className="lg:col-span-5 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)] border-b border-[var(--border-subtle)] pb-2.5">
            <span className="font-bold text-[var(--foreground)]">
              فهرست آثار ({total.toLocaleString('fa-IR')} مورد)
            </span>
            <span>
              صفحه {page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
            </span>
          </div>

          {loadingList ? (
            <div className="py-12 flex items-center justify-center gap-2 text-xs text-[var(--foreground-muted)]">
              <Loader2 size={16} className="animate-spin" />
              <span>در حال بارگذاری آثار...</span>
            </div>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-xs text-[var(--foreground-muted)]">
              موردی یافت نشد.
            </p>
          ) : (
            <div className="space-y-2 max-h-[580px] overflow-y-auto pl-1">
              {items.map((row) => {
                const selected = detail?.slug === row.slug && detail?.collection === row.collection;
                return (
                  <div
                    key={`${row.collection}:${row.slug}`}
                    className={`rounded-xl border p-3 transition-colors ${
                      selected
                        ? 'border-[var(--primary)] bg-[var(--primary-light)]'
                        : 'border-[var(--border-subtle)] bg-[var(--surface-sunken)] hover:border-[var(--primary)]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectWork(row)}
                      className="w-full text-right space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-mono uppercase text-[var(--foreground-muted)]">
                          {row.collection}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[var(--surface-card)] border border-[var(--border-subtle)] font-bold text-[var(--primary)]">
                          زبان اصلی: {row.originalLocale.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-[var(--foreground)] line-clamp-2">
                        {row.title}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {(['fa', 'fr', 'en'] as Locale[]).map((l) => {
                          const hasLoc = row.availableLocales.includes(l);
                          const isOrig = row.originalLocale === l;
                          return (
                            <span
                              key={l}
                              className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                                isOrig
                                  ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--primary-foreground)] font-bold'
                                  : hasLoc
                                    ? 'bg-[var(--surface-card)] border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-[var(--surface-card)] border-red-400/50 text-red-700 dark:text-red-300'
                              }`}
                            >
                              {l.toUpperCase()} {isOrig ? '(اصلی)' : hasLoc ? 'آماده' : 'ناقص'}
                            </span>
                          );
                        })}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--surface-sunken)] border border-[var(--border-subtle)] disabled:opacity-40"
              >
                <ChevronRight size={14} />
                <span>قبلی</span>
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--surface-sunken)] border border-[var(--border-subtle)] disabled:opacity-40"
              >
                <span>بعدی</span>
                <ChevronLeft size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Side-by-Side Trilingual Control & Edit Column */}
        <div className="lg:col-span-7 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 space-y-5">
          {loadingDetail ? (
            <div className="py-24 flex items-center justify-center gap-2 text-sm text-[var(--foreground-muted)]">
              <Loader2 size={18} className="animate-spin" />
              <span>در حال بارگذاری نسخه اصلی و ترجمه‌های این اثر...</span>
            </div>
          ) : !detail || !editDraft ? (
            <div className="py-20 text-center space-y-2">
              <Languages size={38} strokeWidth={1.4} className="mx-auto text-[var(--foreground-muted)]" />
              <h3 className="text-base font-extrabold text-[var(--foreground)]">
                مرکز کنترل، بازبینی و اصلاح مستقیم ترجمه‌ها
              </h3>
              <p className="text-xs text-[var(--foreground-muted)] max-w-md mx-auto leading-relaxed">
                روی هر اثر در ستون سمت راست کلیک کنید تا متن اصلی در یک سو و ترجمه‌های فرانسوی، انگلیسی و فارسی آن در سوی دیگر نمایش داده شوند. هر اصلاحی بلافاصله در وب‌سایت عمومی به‌روزرسانی می‌شود.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
                    <span className="font-mono uppercase text-[var(--accent-gold)] font-bold">
                      {detail.collection}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] font-bold">
                      زبان اصلی اثر: {detail.originalLocale.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[var(--foreground)]">
                    {detail.originalContent.title}
                  </h3>
                </div>

                <a
                  href={buildPublicWorkHref(detail.collection, detail.slug, editingLocale)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--surface-sunken)] border border-[var(--border-subtle)] hover:border-[var(--primary)] text-[var(--primary)]"
                >
                  <ExternalLink size={14} />
                  <span>مشاهده صفحه زنده ({editingLocale.toUpperCase()})</span>
                </a>
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

              {/* Locked Original Reference Preview */}
              <div
                dir={origDir}
                className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-4 space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-bold text-[var(--foreground-muted)]">
                  <span className="inline-flex items-center gap-1.5 text-[var(--foreground)]">
                    <Lock size={13} className="text-[var(--primary)]" />
                    <span>متن اصلی مرجع ({detail.originalLocale.toUpperCase()}) - محافظت‌شده در Vault</span>
                  </span>
                </div>
                <div className="text-sm font-extrabold text-[var(--foreground)]">
                  {detail.originalContent.title}
                </div>
                {detail.originalContent.summary && (
                  <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                    {detail.originalContent.summary}
                  </p>
                )}
                {detail.originalContent.verses && detail.originalContent.verses.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto space-y-1 text-xs text-[var(--foreground)] pt-1">
                    {detail.originalContent.verses.slice(0, 12).map((v) => (
                      <div key={v.line_index} className="flex flex-wrap gap-3">
                        <span>{v.hemistich_a}</span>
                        {v.hemistich_b && <span className="text-[var(--foreground-muted)]">/ {v.hemistich_b}</span>}
                      </div>
                    ))}
                  </div>
                ) : detail.originalContent.body_markdown ? (
                  <p className="text-xs text-[var(--foreground-muted)] leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
                    {detail.originalContent.body_markdown.slice(0, 1400)}
                    {detail.originalContent.body_markdown.length > 1400 ? '…' : ''}
                  </p>
                ) : null}
              </div>

              {/* Target Language Switcher Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {(['fa', 'fr', 'en'] as Locale[])
                    .filter((l) => l !== detail.originalLocale)
                    .map((loc) => {
                      const active = editingLocale === loc;
                      const exists = Boolean(detail.translations[loc]);
                      return (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => {
                            setFeedback(null);
                            initLocaleEditor(detail, loc);
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                            active
                              ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--primary-foreground)]'
                              : 'bg-[var(--surface-sunken)] border-[var(--border-medium)] text-[var(--foreground)] hover:border-[var(--primary)]'
                          }`}
                        >
                          {loc === 'fr' ? 'ویرایش فرانسوی (FR)' : loc === 'en' ? 'ویرایش انگلیسی (EN)' : 'ویرایش فارسی (FA)'}{' '}
                          {!exists && '• نیازمند ترجمه'}
                        </button>
                      );
                    })}
                </div>
                {detail.translations[editingLocale]?.updated_at && (
                  <span className="text-xs text-[var(--foreground-muted)]">
                    آخرین ویرایش: {detail.translations[editingLocale]?.updated_at}
                  </span>
                )}
              </div>

              {/* Editable Translation Form */}
              <div dir={editDir} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                    Title ({editingLocale.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={editDraft.title}
                    onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, title: e.target.value } : null))}
                    className="w-full min-h-[42px] rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] px-3.5 text-sm font-bold text-[var(--foreground)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                    Summary / Synopsis ({editingLocale.toUpperCase()})
                  </label>
                  <textarea
                    rows={2}
                    value={editDraft.summary || ''}
                    onChange={(e) => setEditDraft((prev) => (prev ? { ...prev, summary: e.target.value } : null))}
                    className="w-full rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] p-3 text-sm text-[var(--foreground)]"
                  />
                </div>

                {editDraft.verses && editDraft.verses.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto p-1">
                    <div className="text-xs font-bold text-[var(--foreground)]">
                      ترجمه بیت‌به‌بیت و مصراع‌به‌مصراع ({editDraft.verses.length} بیت):
                    </div>
                    {editDraft.verses.map((v, idx) => (
                      <div
                        key={v.line_index}
                        className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-2.5 space-y-1.5"
                      >
                        <div className="text-[11px] text-[var(--foreground-muted)]">
                          بیت {v.line_index}: {detail.originalContent.verses?.[idx]?.hemistich_a}
                          {detail.originalContent.verses?.[idx]?.hemistich_b
                            ? ` / ${detail.originalContent.verses?.[idx]?.hemistich_b}`
                            : ''}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={v.hemistich_a}
                            onChange={(e) =>
                              setEditDraft((prev) => {
                                if (!prev?.verses) return prev;
                                const next: StudioPoemVerseInput[] = [...prev.verses];
                                next[idx] = { ...next[idx], hemistich_a: e.target.value };
                                return { ...prev, verses: next };
                              })
                            }
                            placeholder={`Line ${v.line_index} - Hemistich A`}
                            className="rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] px-2.5 py-1.5 text-xs text-[var(--foreground)]"
                          />
                          {v.hemistich_b !== undefined && (
                            <input
                              type="text"
                              value={v.hemistich_b}
                              onChange={(e) =>
                                setEditDraft((prev) => {
                                  if (!prev?.verses) return prev;
                                  const next: StudioPoemVerseInput[] = [...prev.verses];
                                  next[idx] = { ...next[idx], hemistich_b: e.target.value };
                                  return { ...prev, verses: next };
                                })
                              }
                              placeholder={`Line ${v.line_index} - Hemistich B`}
                              className="rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] px-2.5 py-1.5 text-xs text-[var(--foreground)]"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                      Body / Transcript / Curatorial Statement ({editingLocale.toUpperCase()})
                    </label>
                    <textarea
                      rows={8}
                      value={editDraft.body_markdown || ''}
                      onChange={(e) =>
                        setEditDraft((prev) => (prev ? { ...prev, body_markdown: e.target.value } : null))
                      }
                      className="w-full rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] p-3.5 text-sm leading-relaxed text-[var(--foreground)]"
                    />
                  </div>
                )}

                {detail.collection === 'poems' && (
                  <div>
                    <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                      Commentary ({editingLocale.toUpperCase()})
                    </label>
                    <textarea
                      rows={2}
                      value={editDraft.commentary_markdown || ''}
                      onChange={(e) =>
                        setEditDraft((prev) =>
                          prev ? { ...prev, commentary_markdown: e.target.value } : null
                        )
                      }
                      className="w-full rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] p-2.5 text-xs text-[var(--foreground)]"
                    />
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={handleSaveTranslation}
                className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-extrabold text-sm transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                <span>ذخیره اصلاح ترجمه و به‌روزرسانی آنی در وب‌سایت</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
