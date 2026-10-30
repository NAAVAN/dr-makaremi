import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Video, Calendar, MapPin, Headphones, Film } from 'lucide-react';
import { getVideoSpeeches, VIDEO_SERIES_CATALOG } from '@/lib/cms';
import { isValidLocale, type Locale } from '@/lib/i18n';

export default async function MediaCatalogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  if (!isValidLocale(locale)) notFound();

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';

  const videos = await getVideoSpeeches(locale);

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
            ? 'بیش از ۱۶۰ برنامه تلویزیونی و آموزشی شامل مجموعه ۶۵ قسمتی «در روان‌‌پژوهی»، مجموعه ۸۱ قسمتی «نگاه روانکاو»، «صدای سخن عشق (حافظ)» و سخنرانی‌های دانشگاهی با استریم صوتی ضدسانسور.'
            : 'Plus de 160 émissions éducatives, conférences académiques et podcasts audio résilients.'}
        </p>
      </header>

      {/* SECTION 1: MAJOR VIDEO & TV SERIES (/videos-persan/) */}
      <section aria-label="مجموعه‌های بزرگ ویدیویی" className="space-y-6">
        <div className="border-b border-[var(--border-subtle)] pb-3 space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-600 font-bold">
            <Film size={15} />
            <span>{isFa ? 'مجموعه‌های چندقسمتی ویدیویی (/videos-persan/)' : 'Séries Audiovisuelles'}</span>
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
          {VIDEO_SERIES_CATALOG.map((series) => (
            <article
              key={series.id}
              className="p-6 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold font-mono">
                    {series.episodeCount} {isFa ? 'قسمت' : 'épisodes'}
                  </span>
                  <span className="text-[var(--foreground-muted)] font-medium">
                    {series.broadcaster[locale]}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[var(--foreground)] leading-snug">
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
            </article>
          ))}
        </div>
      </section>

      {/* SECTION 2: FEATURED SPEECHES WITH TRANSCRIPTS & AUDIO */}
      <section aria-label="سخنرانی‌ها و نشست‌های ویژه" className="space-y-6">
        <h2 className="text-2xl font-black text-[var(--foreground)] border-b border-[var(--border-subtle)] pb-3">
          {isFa
            ? 'نشست‌ها و سخنرانی‌های برگزیده (همراه با متن کامل و پادکست صوتی)'
            : 'Conférences Majeures avec Transcription Intégrale'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {videos.map((vid) => {
            const trans =
              vid.translations?.find((t) => t.languages_code.startsWith(locale)) ||
              vid.translations?.[0];

            return (
              <article
                key={vid.id}
                className="p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:shadow-xl transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                    <span className="font-mono flex items-center gap-1">
                      <Calendar size={13} />
                      {vid.event_date}
                    </span>
                    {vid.event_location && (
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin size={13} />
                        {vid.event_location}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-[var(--foreground)] leading-snug">
                    <Link
                      href={`/${locale}/media/videos/${vid.slug}`}
                      className="hover:text-[var(--primary)] transition-colors"
                    >
                      {trans?.title || vid.slug}
                    </Link>
                  </h3>

                  <p className="text-xs text-[var(--foreground-muted)] line-clamp-3 leading-relaxed">
                    {trans?.description}
                  </p>
                </div>

                <div className="border-t border-[var(--border-subtle)] pt-4 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-[var(--primary)] font-medium">
                    <Headphones size={14} />
                    <span>{isFa ? 'پادکست صوتی موجود' : 'Audio disponible'}</span>
                  </span>
                  <Link
                    href={`/${locale}/media/videos/${vid.slug}`}
                    className="font-bold text-[var(--primary)] hover:underline"
                  >
                    {isFa ? 'مشاهده و شنیدن ←' : 'Écouter →'}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
