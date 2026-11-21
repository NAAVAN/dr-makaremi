import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Video, Film, ArrowLeft, ArrowRight } from 'lucide-react';
import { getVideoSpeeches, VIDEO_SERIES_CATALOG } from '@/lib/cms';
import { isValidLocale, type Locale } from '@/lib/i18n';
import { PaginatedVideosGrid } from '@/components/archive/PaginatedVideosGrid';

export default async function MediaCatalogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  if (!isValidLocale(locale)) notFound();

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';

  const rawVideos = await getVideoSpeeches(locale);
  const videos = rawVideos.map((v) => ({
    ...v,
    translations: v.translations?.map((t) => ({
      ...t,
      transcript_markdown: t.transcript_markdown ? 'available' : null,
    })),
  }));

  const countSeriesEpisodes = (slug: string) => {
    if (slug === 'az-namadpardazi-ta-nastaaliq') {
      return videos.filter(
        (v) => v.series_slug === 'az-namadpardazi-ta-nastaaliq' || v.series_slug === 'unesco-2009'
      ).length;
    }
    return videos.filter((v) => v.series_slug === slug).length;
  };

  return (
    <div className="space-y-14">
      {/* Page Header with Single H1 */}
      <header className="space-y-4 border-b border-[var(--border-subtle)] pb-6">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-[var(--color-strategy)] font-bold">
          <Video size={16} />
          <span>{isFa ? 'آرشیو فیلم‌ها، مجموعه‌های تلویزیونی و کنفرانس‌ها' : 'Médias & Conférences'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
          {isFa
            ? 'مرکز چندرسانه‌ای، سخنرانی‌ها و پادکست‌های دکتر حسن مکارمی'
            : isFr
              ? 'Archives Multimédias & Conférences'
              : 'Multimedia Hub, Speeches & Podcasts'}
        </h1>
        <p className="text-sm text-[var(--foreground-muted)] max-w-3xl leading-relaxed">
          {isFa
            ? `آرشیو کامل ${videos.length} برنامه تلویزیونی، سخنرانی و مستند شامل مجموعه‌های «در روان‌‌پژوهی»، «نگاه روانکاو»، «صدای سخن عشق (حافظ)»، جشنواره یونسکو ۲۰۰۹ و مستند ۶۰ سال زندگی با پخش‌کننده مقاوم در برابر فیلترینگ.`
            : `Archive complète de ${videos.length} émissions éducatives, conférences académiques et documentaires résilients.`}
        </p>
      </header>

      {/* SECTION 1: MAJOR VIDEO & TV SERIES (Live Clickable Series Filters!) */}
      <section aria-label="مجموعه‌های بزرگ ویدیویی" className="space-y-6">
        <div className="border-b border-[var(--border-subtle)] pb-3 space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-600 font-bold">
            <Film size={15} />
            <span>{isFa ? 'مجموعه‌های چندقسمتی ویدیویی (کلیک جهت فیلتر قسمت‌ها)' : 'Séries Audiovisuelles'}</span>
          </div>
          <h2 className="text-2xl font-black text-[var(--foreground)]">
            {isFa
              ? 'مجموعه‌های تلویزیونی، سمینارها و مستندهای موضوعی'
              : isFr
                ? 'Grandes Séries Télévisées et Documentaires Thématiques'
                : 'Major Broadcast Series & Thematic Documentaries'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {VIDEO_SERIES_CATALOG.map((series) => {
            const realCount = countSeriesEpisodes(series.slug) || series.episodeCount;
            return (
              <Link
                key={series.id}
                href={`/${locale}/media?series=${series.slug}#videos-archive`}
                className="group p-6 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] hover:border-[var(--primary)] hover:shadow-lg transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold font-mono tabular-nums shrink-0">
                      {realCount} {isFa ? 'ویدیو' : 'vidéos'}
                    </span>
                    <span className="text-[var(--foreground-muted)] font-medium truncate">
                      {series.broadcaster[locale]}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors leading-snug">
                    {series.title[locale]}
                  </h3>

                  <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                    {series.description[locale]}
                  </p>

                  <ul className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--foreground)]">
                    {series.sampleTopics[locale].map((t, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-bold text-[var(--primary)]">
                  <span>
                    {isFa
                      ? `مشاهده ${realCount} ویدیوی این مجموعه`
                      : `Voir les ${realCount} vidéos de cette série`}
                  </span>
                  {isFa ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: COMPLETE ARCHIVE OF ALL 261 MIGRATED VIDEOS & SPEECHES */}
      <section id="videos-archive" aria-label="آرشیو کامل فیلم‌ها و سخنرانی‌ها" className="space-y-6 scroll-mt-28">
        <h2 className="text-2xl font-black text-[var(--foreground)] border-b border-[var(--border-subtle)] pb-3">
          {isFa
            ? `آرشیو کامل فیلم‌ها، برنامه‌ها و سخنرانی‌ها (${videos.length} ویدیو)`
            : `Archive Complète des Vidéos & Conférences (${videos.length})`}
        </h2>

        <PaginatedVideosGrid videos={videos} locale={locale} />
      </section>
    </div>
  );
}
