'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, FileText, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import type { Article, Locale } from '@makaremi/shared';

interface PaginatedArticlesGridProps {
  articles: Article[];
  locale: Locale;
  pillarSlug: string;
}

const PAGE_SIZE = 24;

export function PaginatedArticlesGrid({
  articles,
  locale,
  pillarSlug,
}: PaginatedArticlesGridProps) {
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const [query, setQuery] = useState('');
  const [langFilter, setLangFilter] = useState<'all' | 'fa' | 'fr' | 'en'>('all');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((art) => {
      const trans =
        art.translations?.find((t) => t.languages_code.startsWith(locale)) ||
        art.translations?.[0];
      if (langFilter !== 'all') {
        const hasLang = art.translations?.some((t) => t.languages_code.startsWith(langFilter));
        if (!hasLang) return false;
      }
      if (!q) return true;
      const hay = `${trans?.title || ''} ${trans?.executive_summary || ''} ${(art.categories || []).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [articles, locale, query, langFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-8">
      {/* Search & Language Filter Toolbar */}
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
                ? `جستجو در ${articles.length} مقاله و یادداشت...`
                : isFr
                  ? `Rechercher parmi ${articles.length} articles...`
                  : `Search ${articles.length} articles...`
            }
            aria-label={isFa ? 'جستجو در مقالات' : 'Search articles'}
            className="w-full ps-10 pe-4 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {(['all', 'fa', 'fr', 'en'] as const).map((code) => (
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
              {code === 'all' ? (isFa ? 'همه' : 'All') : code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)] font-mono tabular-nums">
        <span>
          {isFa
            ? `نمایش ${pageItems.length} از ${filtered.length} مقاله`
            : `Showing ${pageItems.length} of ${filtered.length} articles`}
        </span>
        <span>
          {isFa ? `صفحه ${safePage} از ${totalPages}` : `Page ${safePage} / ${totalPages}`}
        </span>
      </div>

      {/* Empty State (break-ui zero-results resilience) */}
      {pageItems.length === 0 ? (
        <div
          role="status"
          className="p-10 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-center space-y-3"
        >
          <p className="text-sm font-bold text-[var(--foreground)]">
            {isFa
              ? 'هیچ مقاله‌ای مطابق فیلتر یا جستجوی شما یافت نشد.'
              : isFr
                ? 'Aucun article ne correspond à votre recherche.'
                : 'No articles matched your search or filter.'}
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
            {isFa ? 'پاک کردن فیلترها' : isFr ? 'Réinitialiser les filtres' : 'Reset filters'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pageItems.map((art) => {
            const trans =
              art.translations?.find((t) => t.languages_code.startsWith(locale)) ||
              art.translations?.[0];

            return (
              <article
                key={art.id}
                className="archival-lift min-w-0 p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:shadow-lg transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-[var(--foreground-muted)] tabular-nums">
                    <span>{art.published_at?.slice(0, 10)}</span>
                    {art.categories?.slice(0, 2).map((cat) => (
                      <span
                        key={cat}
                        className="px-2 py-0.5 rounded-full bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--primary)] whitespace-nowrap"
                      >
                        {cat}
                      </span>
                    ))}
                    {art.pdf_url && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 shrink-0">
                        <FileDown size={11} className="shrink-0" />
                        PDF
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg font-bold text-[var(--foreground)] leading-snug break-words">
                    <Link
                      href={`/${locale}/${pillarSlug}/articles/${art.slug}`}
                      className="hover:text-[var(--primary)] transition-colors"
                    >
                      {trans?.title || art.slug}
                    </Link>
                  </h2>

                  <p className="text-xs text-[var(--foreground-muted)] leading-relaxed line-clamp-3 break-words">
                    {trans?.executive_summary}
                  </p>
                </div>

                <div className="border-t border-[var(--border-subtle)] pt-3 flex items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 text-[var(--foreground-muted)] font-mono text-[11px] shrink-0">
                    <FileText size={12} className="shrink-0" />
                    {trans?.languages_code?.slice(0, 2).toUpperCase()}
                  </span>
                  <Link
                    href={`/${locale}/${pillarSlug}/articles/${art.slug}`}
                    className="font-bold text-[var(--primary)] hover:underline whitespace-nowrap"
                  >
                    {isFa ? 'مطالعه متن کامل ←' : 'Lire →'}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav
          aria-label={isFa ? 'صفحه‌بندی مقالات' : 'Pagination'}
          className="flex items-center justify-center gap-2 pt-4"
        >
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--surface-card)] border border-[var(--border-subtle)] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            {isFa ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            <span>{isFa ? 'صفحه قبل' : 'Prev'}</span>
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
            <span>{isFa ? 'صفحه بعد' : 'Next'}</span>
            {isFa ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </nav>
      )}
    </div>
  );
}
