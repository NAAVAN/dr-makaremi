'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, FileText, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import type { Article, ContentPillar, Locale } from '@makaremi/shared';

interface PaginatedArticlesGridProps {
  articles: Article[];
  locale: Locale;
  pillarSlug: string;
}

const PAGE_SIZE = 24;

function getPillarRouteSegment(pillar: ContentPillar, locale: Locale): string {
  switch (pillar) {
    case 'psychoanalysis':
      return locale === 'fr' ? 'psychanalyse' : 'psychoanalysis';
    case 'art_calligraphy':
      return 'art';
    case 'cultural_strategy':
      return 'strategy';
    case 'human_rights_dadkhahi':
      return 'human-rights';
  }
}

function getPillarDisplayLabel(pillar: ContentPillar | 'all', locale: Locale): string {
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  switch (pillar) {
    case 'all':
      return isFa ? 'همه ستون‌ها' : isFr ? 'Tous les domaines' : 'All Pillars';
    case 'psychoanalysis':
      return isFa ? 'روانکاوی لکانی' : isFr ? 'Psychanalyse' : 'Psychoanalysis';
    case 'cultural_strategy':
      return isFa ? 'پژوهش، جامعه و راهبرد' : isFr ? 'Recherche & Société' : 'Research & Strategy';
    case 'art_calligraphy':
      return isFa ? 'هنر، شعر و حافظ' : isFr ? 'Art, Poésie & Hafez' : 'Art, Poetry & Hafez';
    case 'human_rights_dadkhahi':
      return isFa ? 'حقوق بشر و دادخواهی' : isFr ? 'Droits Humains' : 'Human Rights';
  }
}

function normalizePillarParam(raw: string | null): ContentPillar | 'all' {
  if (!raw) return 'all';
  const v = raw.toLowerCase();
  if (v === 'psychoanalysis' || v === 'psychanalyse') return 'psychoanalysis';
  if (v === 'art' || v === 'art_calligraphy') return 'art_calligraphy';
  if (v === 'strategy' || v === 'cultural_strategy') return 'cultural_strategy';
  if (v === 'human-rights' || v === 'human_rights_dadkhahi' || v === 'dadkhahi') return 'human_rights_dadkhahi';
  return 'all';
}

function PaginatedArticlesGridInner({
  articles,
  locale,
  pillarSlug,
}: PaginatedArticlesGridProps) {
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const isUnifiedMode = pillarSlug === 'all';
  const searchParams = useSearchParams();

  const [query, setQuery] = useState('');
  const [langFilter, setLangFilter] = useState<'all' | 'fa' | 'fr' | 'en'>('all');
  const [pillarFilter, setPillarFilter] = useState<'all' | ContentPillar>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Sync URL query params (?pillar=, ?category=, ?q=, ?lang=)
  useEffect(() => {
    const pParam = searchParams.get('pillar');
    const cParam = searchParams.get('category');
    const qParam = searchParams.get('q');
    const lParam = searchParams.get('lang');

    if (pParam) setPillarFilter(normalizePillarParam(pParam));
    else setPillarFilter('all');

    if (cParam) setCategoryFilter(cParam);
    else setCategoryFilter('all');

    if (qParam) setQuery(qParam);
    if (lParam === 'fa' || lParam === 'fr' || lParam === 'en' || lParam === 'all') {
      setLangFilter(lParam);
    }
    setPage(1);
  }, [searchParams]);

  const pillarCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: articles.length,
      psychoanalysis: 0,
      cultural_strategy: 0,
      art_calligraphy: 0,
      human_rights_dadkhahi: 0,
    };
    for (const a of articles) {
      counts[a.pillar] = (counts[a.pillar] || 0) + 1;
    }
    return counts;
  }, [articles]);

  const topCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const art of articles) {
      if (isUnifiedMode && pillarFilter !== 'all' && art.pillar !== pillarFilter) continue;
      for (const c of art.categories || []) {
        if (!c || c === 'طبقه بندی نشده' || c === 'Non classé' || c === 'Unclassified') continue;
        counts.set(c, (counts.get(c) || 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [articles, isUnifiedMode, pillarFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((art) => {
      const trans =
        art.translations?.find((t) => t.languages_code.startsWith(locale)) ||
        art.translations?.[0];

      if (isUnifiedMode && pillarFilter !== 'all' && art.pillar !== pillarFilter) {
        return false;
      }
      if (categoryFilter !== 'all') {
        const cats = (art.categories || []).map((c) => c.toLowerCase());
        if (!cats.includes(categoryFilter.toLowerCase())) return false;
      }
      if (langFilter !== 'all') {
        const hasLang = art.translations?.some((t) => t.languages_code.startsWith(langFilter));
        if (!hasLang) return false;
      }
      if (!q) return true;
      const hay = `${trans?.title || ''} ${trans?.executive_summary || ''} ${(art.categories || []).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [articles, locale, isUnifiedMode, pillarFilter, categoryFilter, langFilter, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Unified Pillar Tabs (shown in /articles mode) */}
      {isUnifiedMode && (
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'psychoanalysis', 'cultural_strategy', 'art_calligraphy', 'human_rights_dadkhahi'] as const).map(
            (pKey) => {
              const active = pillarFilter === pKey;
              return (
                <button
                  key={pKey}
                  type="button"
                  onClick={() => {
                    setPillarFilter(pKey);
                    setCategoryFilter('all');
                    setPage(1);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer tabular-nums ${
                    active
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs'
                      : 'bg-[var(--surface-sunken)] text-[var(--foreground-muted)] border border-[var(--border-subtle)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {getPillarDisplayLabel(pKey, locale)} ({pillarCounts[pKey] || 0})
                </button>
              );
            }
          )}
        </div>
      )}

      {/* Search, WP Categories & Language Filter Toolbar */}
      <div className="space-y-3 p-4 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)]">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
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

          <div className="flex items-center gap-1.5 text-xs shrink-0">
            {(['all', 'fa', 'fr', 'en'] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setLangFilter(code);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  langFilter === code
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'bg-[var(--surface-card)] text-[var(--foreground-muted)] border border-[var(--border-subtle)] hover:text-[var(--foreground)]'
                }`}
              >
                {code === 'all' ? (isFa ? 'همه' : 'All') : code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Original WordPress Categories Pills */}
        {topCategories.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => {
                setCategoryFilter('all');
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'bg-[var(--surface-card)] text-[var(--foreground-muted)] border border-[var(--border-subtle)] hover:text-[var(--foreground)]'
              }`}
            >
              {isFa ? 'همه دسته‌بندی‌ها' : isFr ? 'Toutes catégories' : 'All Categories'}
            </button>
            {topCategories.map(([cat, count]) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategoryFilter(cat);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer tabular-nums ${
                  categoryFilter.toLowerCase() === cat.toLowerCase()
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'bg-[var(--surface-card)] text-[var(--foreground-muted)] border border-[var(--border-subtle)] hover:text-[var(--foreground)]'
                }`}
              >
                {cat} ({count})
              </button>
            ))}
          </div>
        )}
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

      {/* Empty State */}
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
              setPillarFilter('all');
              setCategoryFilter('all');
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
            const effectivePillarSlug = isUnifiedMode
              ? getPillarRouteSegment(art.pillar, locale)
              : pillarSlug;
            const href = `/${locale}/${effectivePillarSlug}/articles/${art.slug}`;

            return (
              <article
                key={art.id}
                className="archival-lift min-w-0 p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:shadow-lg transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-[var(--foreground-muted)] tabular-nums">
                    <span>{art.published_at?.slice(0, 10)}</span>
                    {isUnifiedMode && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold whitespace-nowrap">
                        {getPillarDisplayLabel(art.pillar, locale)}
                      </span>
                    )}
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
                    <Link href={href} className="hover:text-[var(--primary)] transition-colors">
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
                    href={href}
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

          <span className="px-4 py-2 text-xs font-mono text-[var(--foreground-muted)] tabular-nums">
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

export function PaginatedArticlesGrid(props: PaginatedArticlesGridProps) {
  return (
    <Suspense
      fallback={
        <div className="p-8 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-center text-xs text-[var(--foreground-muted)]">
          Loading articles archive...
        </div>
      }
    >
      <PaginatedArticlesGridInner {...props} />
    </Suspense>
  );
}
