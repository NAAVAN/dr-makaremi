import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Calendar, MapPin, Tag, ArrowRight, ArrowLeft, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { getVideoSpeechBySlug, getVideoSpeeches } from '@/lib/cms';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { VideoExperienceClient } from '@/components/media/VideoExperienceClient';
import { JsonLdGraph } from '@/components/seo/JsonLdGraph';
import { buildVideoObjectNode, buildBreadcrumbNode, buildFullGraph } from '@/lib/schema-org';
import { buildTrilingualMetadata } from '@/lib/seo-helpers';
import { localizeTaxonomyTag, resolveWorkTranslation } from '@/lib/work-language';

export const dynamicParams = true;

const CATEGORY_NOT_LOCATION = new Set([
  'خبر',
  'اخبار',
  'حافظ',
  'در مورد',
  'روانکاوی',
  'پژوهش',
  'جامعه',
  'شعر',
  'هنر',
  'طبقه بندی نشده',
  'طبقه‌بندی نشده',
  'news',
  'hafez',
  'art',
  'poésie',
  'psychanalyse',
  'recherche',
  'société',
  'à propos',
  'non classé',
  'unclassified',
]);

function isCategoryLabel(raw?: string | null): boolean {
  if (!raw) return false;
  return CATEGORY_NOT_LOCATION.has(raw.trim().toLowerCase());
}

export async function generateStaticParams() {
  const videos = await getVideoSpeeches('fa');
  const params: Array<{ locale: string; slug: string }> = [];

  for (const locale of SUPPORTED_LOCALES) {
    for (const v of videos.slice(0, 35)) {
      params.push({ locale, slug: v.slug });
    }
  }

  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return {};
  const vid = await getVideoSpeechBySlug(slug, locale);
  if (!vid) return {};

  const resolved = resolveWorkTranslation({
    collection: 'videos',
    slug: vid.slug,
    translations: vid.translations,
    siteLocale: locale,
  });
  const trans = resolved.originalRecord || vid.translations?.[0];

  const title = resolved.translatedRecord?.title || trans?.title || vid.slug;
  const description = (resolved.translatedRecord?.summary || trans?.description || title).slice(0, 160);

  // BUG-V09 Fix: Single authoritative canonical path per pillar
  const canonicalPath =
    vid.pillar === 'human_rights_dadkhahi'
      ? `/human-rights/speeches/${vid.canonical_video_slug || slug}`
      : `/media/videos/${vid.canonical_video_slug || slug}`;

  return buildTrilingualMetadata({
    locale,
    path: canonicalPath,
    title,
    description,
    ogType: 'article',
    imageUrl: vid.thumbnail_url,
    publishedTime: vid.event_date,
  });
}

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };
  if (!isValidLocale(locale)) notFound();

  const [vid, allVideos] = await Promise.all([
    getVideoSpeechBySlug(slug, locale),
    getVideoSpeeches(locale),
  ]);
  if (!vid) notFound();

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);

  const resolved = resolveWorkTranslation({
    collection: 'videos',
    slug: vid.slug,
    translations: vid.translations,
    siteLocale: locale,
  });
  const trans = resolved.originalRecord || vid.translations?.[0];
  const title = resolved.translatedRecord?.title || trans?.title || vid.slug;

  // Compute Prev / Next within same series (BUG-V08 #5)
  const seriesEpisodes = vid.series_slug
    ? allVideos.filter((v) => v.series_slug === vid.series_slug && v.slug !== '5668')
    : [];
  const currentSeriesIdx = seriesEpisodes.findIndex((v) => v.slug === vid.slug);
  const prevEpisode = currentSeriesIdx > 0 ? seriesEpisodes[currentSeriesIdx - 1] : null;
  const nextEpisode =
    currentSeriesIdx >= 0 && currentSeriesIdx < seriesEpisodes.length - 1
      ? seriesEpisodes[currentSeriesIdx + 1]
      : null;

  const getEpisodeTitle = (ep: (typeof allVideos)[number]) => {
    const r = resolveWorkTranslation({
      collection: 'videos',
      slug: ep.slug,
      translations: ep.translations,
      siteLocale: locale,
    });
    return r.translatedRecord?.title || r.originalRecord?.title || ep.slug;
  };

  const getEpisodeHref = (ep: (typeof allVideos)[number]) =>
    ep.pillar === 'human_rights_dadkhahi'
      ? `/${locale}/human-rights/speeches/${ep.slug}`
      : `/${locale}/media/videos/${ep.slug}`;

  const pillarLabel =
    vid.pillar === 'psychoanalysis'
      ? tx('روانکاوی', 'Psychanalyse', 'Psychoanalysis')
      : vid.pillar === 'art_calligraphy'
        ? tx('هنر و خوشنویسی', 'Art & Calligraphie', 'Art & Calligraphy')
        : vid.pillar === 'cultural_strategy'
          ? tx('راهبرد فرهنگی', 'Stratégie Culturelle', 'Cultural Strategy')
          : tx('حقوق بشر و دادخواهی', 'Droits Humains', 'Human Rights');

  const jsonLdGraph = buildFullGraph({
    locale,
    items: [
      buildVideoObjectNode(vid, locale),
      buildBreadcrumbNode([
        { name: tx('خانه', 'Accueil', 'Home'), item: `https://makaremi.com/${locale}` },
        { name: tx('رسانه و ویدیوها', 'Médias & Vidéos', 'Media & Videos'), item: `https://makaremi.com/${locale}/media` },
        { name: title, item: `https://makaremi.com/${locale}/media/videos/${slug}` },
      ]),
    ],
  });

  const locIsTag = isCategoryLabel(vid.event_location);

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      <JsonLdGraph data={jsonLdGraph} />
      <link
        rel="alternate"
        type="text/markdown"
        href={`/${locale}/media/videos/${slug}.md`}
        title="Markdown Twin"
      />
      <nav aria-label={tx('راهنمای مسیر', 'Fil d’Ariane', 'Breadcrumb')} className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
        <Link
          href={`/${locale}/media`}
          className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors font-medium"
        >
          {isFa ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          <span>{tx('بازگشت به آرشیو رسانه', 'Retour aux médias', 'Back to Media & Videos')}</span>
        </Link>

        <Link
          href={`/${locale}/media/videos/${slug}.md`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 font-mono px-2.5 py-1 rounded-md bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
        >
          <Download size={12} />
          <span dir="ltr">.md (AEO Twin)</span>
        </Link>
      </nav>

      {/* Single H1 Tag */}
      <header className="space-y-4 border-b border-[var(--border-subtle)] pb-6">
        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--foreground-muted)] font-medium">
          <span className="px-2.5 py-0.5 rounded-full bg-[var(--surface-sunken)] border border-[var(--border-subtle)] font-bold text-[var(--primary)]">
            {pillarLabel}
          </span>
          <span className="flex items-center gap-1 font-mono" dir="ltr">
            <Calendar size={13} />
            {vid.event_date}
          </span>
          {vid.event_location && (
            <span className="flex items-center gap-1">
              {locIsTag ? <Tag size={13} /> : <MapPin size={13} />}
              {locIsTag ? localizeTaxonomyTag(vid.event_location, locale) : vid.event_location}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight leading-tight">
          {title}
        </h1>
      </header>

      {/* Coordinated Player + Interactive Timestamped Transcript */}
      <VideoExperienceClient
        title={title}
        slug={vid.slug}
        locale={locale}
        youtubeId={vid.youtube_video_id}
        vimeoUrl={vid.vimeo_url}
        selfHostedAudio={vid.self_hosted_audio_url}
        selfHostedHls={vid.self_hosted_hls_url}
        durationSeconds={vid.duration_seconds}
        videoHealthStatus={vid.video_health_status}
        videoHealthReason={vid.video_health_reason}
        chapters={vid.transcript_chapters}
        transcriptMethod={vid.transcript_method}
        originalLang={resolved.originalLang}
        originalTitle={trans?.title}
        originalDescription={trans?.description}
        originalTranscriptMarkdown={trans?.transcript_markdown}
        translated={resolved.translatedRecord}
      />

      {/* Series Prev / Next Episode Navigation */}
      {(prevEpisode || nextEpisode) && (
        <nav
          aria-label={tx('قسمت‌های قبلی و بعدی مجموعه', 'Épisodes précédent et suivant', 'Series Episode Navigation')}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--border-subtle)]"
        >
          {prevEpisode ? (
            <Link
              href={getEpisodeHref(prevEpisode)}
              className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--primary)] transition-colors space-y-1"
            >
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--primary)]">
                {isFa ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                <span>{tx('قسمت قبلی در این مجموعه', 'Épisode précédent', 'Previous Episode')}</span>
              </span>
              <p className="text-xs sm:text-sm font-bold text-[var(--foreground)] line-clamp-2">
                {getEpisodeTitle(prevEpisode)}
              </p>
            </Link>
          ) : (
            <div />
          )}

          {nextEpisode ? (
            <Link
              href={getEpisodeHref(nextEpisode)}
              className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--primary)] transition-colors space-y-1 text-end"
            >
              <span className="inline-flex items-center justify-end gap-1 text-[11px] font-bold text-[var(--primary)] w-full">
                <span>{tx('قسمت بعدی در این مجموعه', 'Épisode suivant', 'Next Episode')}</span>
                {isFa ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
              </span>
              <p className="text-xs sm:text-sm font-bold text-[var(--foreground)] line-clamp-2">
                {getEpisodeTitle(nextEpisode)}
              </p>
            </Link>
          ) : null}
        </nav>
      )}
    </div>
  );
}
