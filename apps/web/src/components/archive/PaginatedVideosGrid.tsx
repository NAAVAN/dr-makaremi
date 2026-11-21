'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Calendar, Video, FileText, ChevronLeft, ChevronRight, Film } from 'lucide-react';
import type { ContentPillar, VideoSpeech, Locale } from '@makaremi/shared';
import { getLanguageDir, resolveWorkTranslation } from '@/lib/work-language';
import { WorkLanguageBar } from '@/components/i18n/WorkLanguageBar';

interface PaginatedVideosGridProps {
  videos: VideoSpeech[];
  locale: Locale;
}

const PAGE_SIZE = 24;

const SERIES_FILTERS: Array<{
  key: string;
  label: Record<Locale, string>;
  matchSlugs?: string[];
}> = [
    {
      key: 'all',
      label: { fa: 'همه ویدیوها', fr: 'Toutes les vidéos', en: 'All Videos' },
    },
    {
      key: 'dar-ravanpajoohi-ba-makaremi',
      label: { fa: 'در روان‌پژوهی', fr: 'Recherche Psychanalytique', en: 'In Psycho-Research' },
    },
    {
      key: 'negah-e-ravankav',
      label: { fa: 'نگاه روانکاو', fr: 'Le Regard du Psychanalyste', en: 'The Psychoanalyst’s Gaze' },
    },
    {
      key: 'sedaye-sokhan-eshgh-hafez',
      label: { fa: 'صدای سخن عشق (حافظ)', fr: 'La Voix de l’Amour (Hafez)', en: 'Voice of Love (Hafez)' },
    },
    {
      key: 'az-namadpardazi-ta-nastaaliq',
      label: { fa: 'هنر، نستعلیق و یونسکو ۲۰۰۹', fr: 'Art, Nasta’liq & UNESCO 2009', en: 'Art, Nasta’liq & UNESCO' },
      matchSlugs: ['az-namadpardazi-ta-nastaaliq', 'unesco-2009'],
    },
    {
      key: 'morouri-bar-60-sal-zendegi',
      label: { fa: 'مستند ۶۰ سال زندگی', fr: 'Documentaire 60 ans', en: '60 Years Documentary' },
    },
    {
      key: 'video-poems',
      label: { fa: 'شعر و تصویر', fr: 'Poésie & Vidéo', en: 'Video-Poems' },
    },
    {
      key: 'human-rights-speeches',
      label: { fa: 'حقوق بشر و دادخواهی', fr: 'Droits Humains & Justice', en: 'Human Rights Speeches' },
    },
  ];

function matchesSeriesFilter(vid: VideoSpeech, seriesKey: string): boolean {
  if (seriesKey === 'all') return true;
  const def = SERIES_FILTERS.find((s) => s.key === seriesKey);
  if (def?.matchSlugs) {
    return def.matchSlugs.includes(vid.series_slug || '');
  }
  return (vid.series_slug || 'general') === seriesKey;
}

function VideosUrlSync({
  onSync,
}: {
  onSync: (params: {
    series: string;
    pillar: 'all' | ContentPillar;
    theme: string;
    query: string | null;
    hasDeepFilter: boolean;
  }) => void;
}) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const sParam = searchParams.get('series');
    const pParam = searchParams.get('pillar');
    const tParam = searchParams.get('theme');
    const qParam = searchParams.get('q');

    let hasDeepFilter = false;
    let series = 'all';
    if (sParam) {
      const normalized = sParam === 'unesco-2009' ? 'az-namadpardazi-ta-nastaaliq' : sParam;
      if (SERIES_FILTERS.some((f) => f.key === normalized)) {
        series = normalized;
        hasDeepFilter = true;
      }
    }

    let pillar: 'all' | ContentPillar = 'all';
    if (
      pParam === 'psychoanalysis' ||
      pParam === 'art_calligraphy' ||
      pParam === 'cultural_strategy' ||
      pParam === 'human_rights_dadkhahi'
    ) {
      pillar = pParam;
      hasDeepFilter = true;
    }

    const theme = tParam || 'all';
    if (tParam) hasDeepFilter = true;
    if (qParam) hasDeepFilter = true;

    onSync({ series, pillar, theme, query: qParam, hasDeepFilter });
  }, [searchParams, onSync]);
  return null;
}

export function PaginatedVideosGrid({ videos, locale }: PaginatedVideosGridProps) {
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);

  const [query, setQuery] = useState('');
  const [selectedSeries, setSelectedSeries] = useState<string>('all');
  const [selectedPillar, setSelectedPillar] = useState<'all' | ContentPillar>('all');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [onlyTranscript, setOnlyTranscript] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [translatedIds, setTranslatedIds] = useState<Record<string, boolean>>({});

  const toggleVideoTranslation = (id: string) => {
    setTranslatedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUrlSync = React.useCallback(
    (p: {
      series: string;
      pillar: 'all' | ContentPillar;
      theme: string;
      query: string | null;
      hasDeepFilter: boolean;
    }) => {
      setSelectedSeries(p.series);
      setSelectedPillar(p.pillar);
      setSelectedTheme(p.theme);
      if (p.query) setQuery(p.query);
      setPage(1);
      if (p.hasDeepFilter) {
        const el = document.getElementById('videos-archive');
        if (el) {
          setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
        }
      }
    },
    []
  );

  const seriesCounts = useMemo(() => {
    const map: Record<string, number> = { all: videos.length };
    for (const def of SERIES_FILTERS) {
      if (def.key === 'all') continue;
      map[def.key] = videos.filter((v) => matchesSeriesFilter(v, def.key)).length;
    }
    return map;
  }, [videos]);

  const topThemes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of videos) {
      for (const th of v.themes || []) {
        counts.set(th, (counts.get(th) || 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name]) => name);
  }, [videos]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return videos.filter((vid) => {
      const trans =
        vid.translations?.find((t) => t.languages_code.startsWith(locale)) ||
        vid.translations?.[0];
      if (!matchesSeriesFilter(vid, selectedSeries)) return false;
      if (selectedPillar !== 'all' && vid.pillar !== selectedPillar) return false;
      if (selectedTheme !== 'all' && !(vid.themes || []).includes(selectedTheme)) {
        return false;
      }
      if (onlyTranscript && !trans?.transcript_markdown) {
        return false;
      }
      if (!q) return true;
      const hay = `${trans?.title || ''} ${trans?.description || ''} ${(vid.themes || []).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [videos, locale, query, selectedSeries, selectedPillar, selectedTheme, onlyTranscript]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <VideosUrlSync onSync={handleUrlSync} />
      </Suspense>
      {/* Series Filter Pills (Synced with Mega Menu ?series= & Top Series Cards) */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-700 dark:text-amber-400">
          <Film size={14} />
          <span>{tx('فیلتر بر اساس مجموعه ویدیویی:', 'Filtrer par série :', 'Filter by Video Series:')}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {SERIES_FILTERS.map((s) => {
            const isSelected = selectedSeries === s.key;
            const count = seriesCounts[s.key] || 0;
            return (
              <button
                key={s.key}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  setSelectedSeries(s.key);
                  setSelectedPillar('all');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer tabular-nums ${isSelected
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs'
                    : 'bg-[var(--surface-sunken)] text-[var(--foreground-muted)] border border-[var(--border-subtle)] hover:text-[var(--foreground)]'
                  }`}
              >
                {s.label[locale]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Pillar Banner when deep-linked with ?pillar= */}
      {selectedPillar !== 'all' && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
          <span className="font-bold text-amber-900 dark:text-amber-200">
            {tx(`فیلتر فعال ستون: ${selectedPillar}`, `Filtre de pilier actif : ${selectedPillar}`, `Active pillar filter: ${selectedPillar}`)}
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedPillar('all');
              setPage(1);
            }}
            className="font-bold text-[var(--primary)] hover:underline cursor-pointer"
          >
            {tx('نمایش همه ستون‌ها', 'Tout afficher', 'Show all pillars')}
          </button>
        </div>
      )}

      {/* Search & Theme Filter */}
      <div className="space-y-3 p-4 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)]">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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
              placeholder={tx(
                `جستجو در ${videos.length} فیلم، برنامه و سخنرانی...`,
                `Rechercher parmi ${videos.length} vidéos et conférences...`,
                `Search ${videos.length} broadcasts, films & lectures...`
              )}
              aria-label={tx('جستجو در ویدیوها', 'Rechercher des vidéos', 'Search videos')}
              className="w-full ps-10 pe-4 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setOnlyTranscript((v) => !v);
              setPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer shrink-0 ${onlyTranscript
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent'
                : 'bg-[var(--surface-card)] text-[var(--foreground)] border-[var(--border-subtle)]'
              }`}
          >
            {tx('دارای متن پیاده‌شده', 'Avec transcription', 'With Transcript')}
          </button>
        </div>

        {topThemes.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSelectedTheme('all');
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${selectedTheme === 'all'
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'bg-[var(--surface-card)] text-[var(--foreground-muted)] border border-[var(--border-subtle)]'
                }`}
            >
              {tx(`همه موضوعات (${videos.length})`, `Tous (${videos.length})`, `All Topics (${videos.length})`)}
            </button>
            {topThemes.map((theme) => (
              <button
                key={theme}
                type="button"
                onClick={() => {
                  setSelectedTheme(theme);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${selectedTheme === theme
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'bg-[var(--surface-card)] text-[var(--foreground-muted)] border border-[var(--border-subtle)] hover:text-[var(--foreground)]'
                  }`}
              >
                {theme}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)] font-mono tabular-nums">
        <span>
          {tx(
            `نمایش ${pageItems.length} از ${filtered.length} ویدیو`,
            `${pageItems.length} sur ${filtered.length} vidéos`,
            `Showing ${pageItems.length} of ${filtered.length} videos`
          )}
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
            {tx(
              'ویدیویی مطابق فیلتر یا جستجوی شما یافت نشد.',
              'Aucune vidéo ne correspond à vos critères.',
              'No videos matched your search or filter criteria.'
            )}
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSelectedSeries('all');
              setSelectedPillar('all');
              setSelectedTheme('all');
              setOnlyTranscript(false);
              setPage(1);
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--primary)] text-[var(--primary-foreground)] cursor-pointer"
          >
            {tx('پاک کردن فیلترها', 'Réinitialiser', 'Reset filters')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pageItems.map((vid) => {
            const resolved = resolveWorkTranslation({
              collection: 'videos',
              slug: vid.slug,
              translations: vid.translations,
              siteLocale: locale,
            });
            const isShowingTranslated = Boolean(translatedIds[vid.id]);
            const origTrans = resolved.originalRecord;
            const displayTitle =
              isShowingTranslated && resolved.translatedRecord?.title
                ? resolved.translatedRecord.title
                : origTrans?.title || vid.slug;
            const displayDesc =
              isShowingTranslated && resolved.translatedRecord?.summary
                ? resolved.translatedRecord.summary
                : origTrans?.description;
            const activeDir = isShowingTranslated && resolved.hasTranslation
              ? getLanguageDir(locale)
              : getLanguageDir(resolved.originalLang);

            const href =
              vid.pillar === 'human_rights_dadkhahi'
                ? `/${locale}/human-rights/speeches/${vid.slug}`
                : `/${locale}/media/videos/${vid.slug}`;

            return (
              <article
                key={vid.id}
                className="archival-lift min-w-0 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between"
              >
                {vid.thumbnail_url && (
                  <Link href={href} className="block aspect-video w-full overflow-hidden bg-neutral-900 relative">
                    <img
                      src={vid.thumbnail_url}
                      alt={displayTitle}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                    {origTrans?.transcript_markdown && (
                      <span className="absolute bottom-2 end-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-mono">
                        <FileText size={10} className="shrink-0" />
                        {isFa ? 'متن کامل' : isFr ? 'Texte' : 'Transcript'}
                      </span>
                    )}
                  </Link>
                )}

                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between min-w-0">
                  <div className="space-y-2 min-w-0">
                    <WorkLanguageBar
                      originalLang={resolved.originalLang}
                      siteLocale={locale}
                      isTranslated={isShowingTranslated}
                      hasTranslation={resolved.hasTranslation}
                      onToggle={() => toggleVideoTranslation(vid.id)}
                      compact
                    />

                    <div className="flex items-center justify-between text-[11px] text-[var(--foreground-muted)] font-mono tabular-nums">
                      <span className="flex items-center gap-1 shrink-0">
                        <Calendar size={12} className="shrink-0" />
                        {vid.event_date}
                      </span>
                      <span className="inline-flex items-center gap-1 shrink-0">
                        <Video size={12} className="shrink-0" />
                        {vid.youtube_video_id ? 'YouTube' : vid.vimeo_url ? 'Vimeo' : 'Archive'}
                      </span>
                    </div>

                    <div dir={activeDir} className="space-y-1.5">
                      <h3 className="text-base font-bold text-[var(--foreground)] break-words">
                        <Link href={href} className="hover:text-[var(--primary)] transition-colors">
                          {displayTitle}
                        </Link>
                      </h3>

                      {displayDesc && displayDesc !== displayTitle && (
                        <p className="text-xs text-[var(--foreground-muted)] line-clamp-2 leading-relaxed break-words">
                          {displayDesc}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-[var(--border-subtle)] pt-3 flex items-center justify-between gap-2 text-xs">
                    <span className="text-[11px] text-[var(--foreground-muted)] truncate min-w-0">
                      {vid.themes?.[0] || vid.event_location}
                    </span>
                    <Link href={href} className="font-bold text-[var(--primary)] hover:underline shrink-0 whitespace-nowrap">
                      {isFa ? 'مشاهده ←' : isFr ? 'Voir →' : 'Watch →'}
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
          aria-label={tx('صفحه‌بندی ویدیوها', 'Pagination des vidéos', 'Videos Pagination')}
          className="flex items-center justify-center gap-2 pt-4"
        >
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--surface-card)] border border-[var(--border-subtle)] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            {isFa ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            <span>{tx('قبلی', 'Préc.', 'Prev')}</span>
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
            <span>{tx('بعدی', 'Suiv.', 'Next')}</span>
            {isFa ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </nav>
      )}
    </div>
  );
}
