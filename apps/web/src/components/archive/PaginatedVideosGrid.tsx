'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Calendar, Video, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import type { VideoSpeech, Locale } from '@makaremi/shared';

interface PaginatedVideosGridProps {
  videos: VideoSpeech[];
  locale: Locale;
}

const PAGE_SIZE = 24;

export function PaginatedVideosGrid({ videos, locale }: PaginatedVideosGridProps) {
  const isFa = locale === 'fa';
  const [query, setQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [onlyTranscript, setOnlyTranscript] = useState<boolean>(false);
  const [page, setPage] = useState(1);

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
  }, [videos, locale, query, selectedTheme, onlyTranscript]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-6">
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
              placeholder={
                isFa
                  ? `جستجو در ${videos.length} فیلم، برنامه و سخنرانی...`
                  : `Rechercher parmi ${videos.length} vidéos et conférences...`
              }
              aria-label={isFa ? 'جستجو در ویدیوها' : 'Search videos'}
              className="w-full ps-10 pe-4 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setOnlyTranscript((v) => !v);
              setPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer shrink-0 ${
              onlyTranscript
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent'
                : 'bg-[var(--surface-card)] text-[var(--foreground)] border-[var(--border-subtle)]'
            }`}
          >
            {isFa ? 'دارای متن پیاده‌شده' : 'Avec transcription'}
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
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                selectedTheme === 'all'
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'bg-[var(--surface-card)] text-[var(--foreground-muted)] border border-[var(--border-subtle)]'
              }`}
            >
              {isFa ? `همه موضوعات (${videos.length})` : `Tous (${videos.length})`}
            </button>
            {topThemes.map((theme) => (
              <button
                key={theme}
                type="button"
                onClick={() => {
                  setSelectedTheme(theme);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                  selectedTheme === theme
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

      <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)] font-mono">
        <span>
          {isFa
            ? `نمایش ${pageItems.length} از ${filtered.length} ویدیو`
            : `${pageItems.length} sur ${filtered.length} vidéos`}
        </span>
        <span>
          {safePage} / {totalPages}
        </span>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pageItems.map((vid) => {
          const trans =
            vid.translations?.find((t) => t.languages_code.startsWith(locale)) ||
            vid.translations?.[0];
          const href =
            vid.pillar === 'human_rights_dadkhahi'
              ? `/${locale}/human-rights/speeches/${vid.slug}`
              : `/${locale}/media/videos/${vid.slug}`;

          return (
            <article
              key={vid.id}
              className="archival-lift rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between"
            >
              {vid.thumbnail_url && (
                <Link href={href} className="block aspect-video w-full overflow-hidden bg-neutral-900 relative">
                  <img
                    src={vid.thumbnail_url}
                    alt={trans?.title || vid.slug}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  {trans?.transcript_markdown && (
                    <span className="absolute bottom-2 end-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-mono">
                      <FileText size={10} />
                      {isFa ? 'متن کامل' : 'Texte'}
                    </span>
                  )}
                </Link>
              )}

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-[var(--foreground-muted)] font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {vid.event_date}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Video size={12} />
                      {vid.youtube_video_id ? 'YouTube' : vid.vimeo_url ? 'Vimeo' : 'Archive'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[var(--foreground)] leading-snug">
                    <Link href={href} className="hover:text-[var(--primary)] transition-colors">
                      {trans?.title || vid.slug}
                    </Link>
                  </h3>

                  {trans?.description && trans.description !== trans.title && (
                    <p className="text-xs text-[var(--foreground-muted)] line-clamp-2 leading-relaxed">
                      {trans.description}
                    </p>
                  )}
                </div>

                <div className="border-t border-[var(--border-subtle)] pt-3 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[var(--foreground-muted)] truncate max-w-[60%]">
                    {vid.themes?.[0] || vid.event_location}
                  </span>
                  <Link href={href} className="font-bold text-[var(--primary)] hover:underline shrink-0">
                    {isFa ? 'مشاهده ←' : 'Voir →'}
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {totalPages > 1 && (
        <nav
          aria-label={isFa ? 'صفحه‌بندی ویدیوها' : 'Pagination'}
          className="flex items-center justify-center gap-2 pt-4"
        >
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--surface-card)] border border-[var(--border-subtle)] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            {isFa ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            <span>{isFa ? 'قبلی' : 'Prev'}</span>
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
            <span>{isFa ? 'بعدی' : 'Next'}</span>
            {isFa ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </nav>
      )}
    </div>
  );
}
