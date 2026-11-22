'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, Feather } from 'lucide-react';
import type { Poem, Locale } from '@makaremi/shared';
import { getLanguageDir, resolveWorkTranslation } from '@/lib/work-language';
import { resolveProxiedMediaUrl } from '@/lib/media-url';
import { WorkLanguageBar } from '@/components/i18n/WorkLanguageBar';

interface PaginatedPoemsGridProps {
  poems: Poem[];
  locale: Locale;
}

const PAGE_SIZE = 24;

export function PaginatedPoemsGrid({ poems, locale }: PaginatedPoemsGridProps) {
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const [query, setQuery] = useState('');
  const [langFilter, setLangFilter] = useState<'all' | 'fa' | 'fr'>('all');
  const [page, setPage] = useState(1);
  const [showOriginalIds, setShowOriginalIds] = useState<Record<string, boolean>>({});

  const toggleCardTranslation = (id: string) => {
    setShowOriginalIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return poems.filter((p) => {
      const origTrans = p.translations?.[0];
      if (langFilter !== 'all' && !origTrans?.languages_code?.toLowerCase().startsWith(langFilter)) {
        return false;
      }
      if (!q) return true;
      const searchable = (p.translations || [])
        .map((t) => {
          const lines = (t.verses || [])
            .slice(0, 3)
            .map((v) => `${v.hemistich_a} ${v.hemistich_b || ''}`)
            .join(' ');
          return `${t.title || ''} ${lines}`;
        })
        .join(' ')
        .toLowerCase();
      return searchable.includes(q);
    });
  }, [poems, query, langFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)]">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute top-1/2 -translate-y-1/2 start-3.5 text-[var(--foreground-muted)] pointer-events-none"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder={
              isFa
                ? `جستجو در عنوان یا مطلع ${poems.length} شعر و سروده...`
                : isFr
                  ? `Rechercher parmi ${poems.length} poèmes...`
                  : `Search across ${poems.length} poems...`
            }
            aria-label={isFa ? 'جستجو در اشعار' : isFr ? 'Rechercher des poèmes' : 'Search poems'}
            className="w-full ps-10 pe-4 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {(['all', 'fa', 'fr'] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                setLangFilter(code);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${langFilter === code
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'bg-[var(--surface-card)] text-[var(--foreground-muted)] border border-[var(--border-subtle)] hover:text-[var(--foreground)]'
                }`}
            >
              {code === 'all' ? (isFa ? 'همه' : isFr ? 'Tous' : 'All') : code === 'fa' ? 'فارسی' : 'Français'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)] font-mono tabular-nums">
        <span>
          {isFa
            ? `نمایش ${pageItems.length} از ${filtered.length} سروده`
            : isFr
              ? `${pageItems.length} sur ${filtered.length} poèmes`
              : `Showing ${pageItems.length} of ${filtered.length} poems`}
        </span>
        <span>
          {safePage} / {totalPages}
        </span>
      </div>

      {/* Empty State */}
      {pageItems.length === 0 ? (
        <div
          role="status"
          className="p-10 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-center space-y-3"
        >
          <p className="text-sm font-bold text-[var(--foreground)]">
            {isFa
              ? 'شعری مطابق جستجوی شما یافت نشد.'
              : isFr
                ? 'Aucun poème ne correspond à votre recherche.'
                : 'No poems matched your search.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setLangFilter('all');
              setPage(1);
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--primary)] text-[var(--primary-foreground)] cursor-pointer"
          >
            {isFa ? 'پاک کردن فیلترها' : isFr ? 'Réinitialiser' : 'Reset filters'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pageItems.map((p) => {
            const resolved = resolveWorkTranslation({
              collection: 'poems',
              slug: p.slug,
              translations: p.translations,
              siteLocale: locale,
            });
            const isShowingTranslated = resolved.hasTranslation && !showOriginalIds[p.id];
            const displayTitle =
              isShowingTranslated && resolved.translatedRecord?.title
                ? resolved.translatedRecord.title
                : resolved.originalRecord?.title || p.slug;
            const activeVerses =
              isShowingTranslated && resolved.translatedRecord?.verses?.length
                ? resolved.translatedRecord.verses
                : resolved.originalRecord?.verses;
            const activeDir = isShowingTranslated && resolved.hasTranslation
              ? getLanguageDir(locale)
              : getLanguageDir(resolved.originalLang);

            return (
              <article
                key={p.id}
                className="archival-lift min-w-0 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between"
              >
                {p.artwork_image_url && (
                  <div className="aspect-[16/10] w-full overflow-hidden bg-[var(--surface-sunken)] border-b border-[var(--border-subtle)]">
                    <img
                      src={resolveProxiedMediaUrl(p.artwork_image_url, 'art', displayTitle) || p.artwork_image_url}
                      alt={displayTitle}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between min-w-0">
                  <div className="space-y-3 min-w-0">
                    <WorkLanguageBar
                      originalLang={resolved.originalLang}
                      siteLocale={locale}
                      isTranslated={isShowingTranslated}
                      hasTranslation={resolved.hasTranslation}
                      onToggle={() => toggleCardTranslation(p.id)}
                      compact
                    />

                    {isShowingTranslated && !resolved.hasTranslation && (
                      <p className="text-[11px] px-2.5 py-1.5 rounded-lg bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--foreground-muted)] leading-relaxed">
                        {isFa
                          ? 'ترجمه ادبی این سروده در موج شعر آرشیو آماده می‌شود؛ اصل اثر همواره در دسترس است.'
                          : isFr
                            ? 'Traduction littéraire en préparation ; le poème original reste accessible.'
                            : 'Literary British English translation queued; the original poem remains intact.'}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-[var(--foreground-muted)] font-mono tabular-nums">
                      <span>{p.creation_year || 2015}</span>
                      <span className="inline-flex items-center gap-1 shrink-0">
                        <Feather size={11} className="shrink-0" />
                        {resolved.originalLang.toUpperCase()}
                      </span>
                    </div>

                    <div dir={activeDir} className="space-y-2.5">
                      <h3 className="text-base font-bold text-[var(--foreground)] break-words">
                        <Link
                          href={`/${locale}/poetry/poems/${p.slug}`}
                          className="hover:text-[var(--primary)] transition-colors"
                        >
                          {displayTitle}
                        </Link>
                      </h3>

                      {activeVerses && activeVerses[0] && (
                        <blockquote className="p-3 rounded-xl bg-[var(--surface-sunken)] text-xs font-serif leading-relaxed space-y-1 text-[var(--foreground)] break-words">
                          <p className="line-clamp-2">{activeVerses[0].hemistich_a}</p>
                          {activeVerses[0].hemistich_b && (
                            <p className="opacity-80 line-clamp-2">{activeVerses[0].hemistich_b}</p>
                          )}
                        </blockquote>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--border-subtle)] flex justify-end text-xs">
                    <Link
                      href={`/${locale}/poetry/poems/${p.slug}`}
                      className="font-bold text-[var(--primary)] hover:underline whitespace-nowrap"
                    >
                      {isFa ? 'خوانش کامل شعر ←' : isFr ? 'Lire le poème →' : 'Read full poem →'}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <nav
          aria-label={isFa ? 'صفحه‌بندی اشعار' : isFr ? 'Pagination des poèmes' : 'Poems pagination'}
          className="flex items-center justify-center gap-2 pt-4"
        >
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--surface-card)] border border-[var(--border-subtle)] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            {isFa ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            <span>{isFa ? 'قبلی' : isFr ? 'Préc.' : 'Previous'}</span>
          </button>
          <span className="px-4 py-2 text-xs font-mono text-[var(--foreground-muted)]">
            {safePage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--surface-card)] border border-[var(--border-subtle)] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <span>{isFa ? 'بعدی' : isFr ? 'Suiv.' : 'Next'}</span>
            {isFa ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </nav>
      )}
    </div>
  );
}
