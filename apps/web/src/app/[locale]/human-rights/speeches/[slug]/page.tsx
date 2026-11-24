import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowRight, ArrowLeft, Download, Calendar, MapPin, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const speeches = await getVideoSpeeches('fa', 'human_rights_dadkhahi');
  const params: Array<{ locale: string; slug: string }> = [];

  for (const locale of SUPPORTED_LOCALES) {
    for (const s of speeches.slice(0, 35)) {
      params.push({ locale, slug: s.slug });
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
  const speech = await getVideoSpeechBySlug(slug, locale);
  if (!speech) return {};

  const resolved = resolveWorkTranslation({
    collection: 'videos',
    slug: speech.slug,
    translations: speech.translations,
    siteLocale: locale,
  });
  const trans = resolved.originalRecord || speech.translations?.[0];

  const title = resolved.translatedRecord?.title || trans?.title || speech.slug;
  const description = (resolved.translatedRecord?.summary || trans?.description || title).slice(0, 160);

  return buildTrilingualMetadata({
    locale,
    path: `/human-rights/speeches/${speech.canonical_video_slug || slug}`,
    title,
    description,
    ogType: 'article',
    imageUrl: speech.thumbnail_url,
    publishedTime: speech.event_date,
  });
}

export default async function SpeechDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };
  if (!isValidLocale(locale)) notFound();

  const [speech, allSpeeches] = await Promise.all([
    getVideoSpeechBySlug(slug, locale),
    getVideoSpeeches(locale, 'human_rights_dadkhahi'),
  ]);
  if (!speech) notFound();

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);

  const resolved = resolveWorkTranslation({
    collection: 'videos',
    slug: speech.slug,
    translations: speech.translations,
    siteLocale: locale,
  });
  const trans = resolved.originalRecord || speech.translations?.[0];
  const title = resolved.translatedRecord?.title || trans?.title || speech.slug;

  const currentIdx = allSpeeches.findIndex((s) => s.slug === speech.slug);
  const prevSpeech = currentIdx > 0 ? allSpeeches[currentIdx - 1] : null;
  const nextSpeech =
    currentIdx >= 0 && currentIdx < allSpeeches.length - 1 ? allSpeeches[currentIdx + 1] : null;

  const getSpeechTitle = (sp: (typeof allSpeeches)[number]) => {
    const r = resolveWorkTranslation({
      collection: 'videos',
      slug: sp.slug,
      translations: sp.translations,
      siteLocale: locale,
    });
    return r.translatedRecord?.title || r.originalRecord?.title || sp.slug;
  };

  const jsonLdGraph = buildFullGraph({
    locale,
    items: [
      buildVideoObjectNode(speech, locale),
      buildBreadcrumbNode([
        { name: tx('خانه', 'Accueil', 'Home'), item: `https://makaremi.com/${locale}` },
        { name: tx('حقوق بشر و دادخواهی', 'Droits de l’Homme', 'Human Rights'), item: `https://makaremi.com/${locale}/human-rights` },
        { name: title, item: `https://makaremi.com/${locale}/human-rights/speeches/${slug}` },
      ]),
    ],
  });

  const locIsTag = isCategoryLabel(speech.event_location);

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      <JsonLdGraph data={jsonLdGraph} />
      <link
        rel="alternate"
        type="text/markdown"
        href={`/${locale}/human-rights/speeches/${slug}.md`}
        title="Markdown Twin"
      />
      <nav aria-label={tx('راهنمای مسیر', 'Fil d’Ariane', 'Breadcrumb')} className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
        <Link
          href={`/${locale}/human-rights`}
          className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors font-medium"
        >
          {isFa ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          <span>
            {tx('بازگشت به پورتال حقوق بشر و دادخواهی', 'Retour aux droits de l’homme', 'Back to Human Rights')}
          </span>
        </Link>

        <Link
          href={`/${locale}/human-rights/speeches/${slug}.md`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 font-mono px-2.5 py-1 rounded-md bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
        >
          <Download size={12} />
          <span dir="ltr">.md (AEO Twin)</span>
        </Link>
      </nav>

      {/* Header with Strict Single H1 */}
      <header className="space-y-4 border-b border-[var(--border-subtle)] pb-6">
        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--foreground-muted)] font-medium">
          <span className="px-2.5 py-0.5 rounded-full bg-[var(--surface-sunken)] border border-[var(--border-subtle)] font-bold text-[var(--color-dadkhahi)]">
            {tx('دادخواهی و عدالت انتقالی', 'Droits humains & Justice', 'Human Rights & Justice')}
          </span>
          <span className="flex items-center gap-1 font-mono" dir="ltr">
            <Calendar size={13} />
            {speech.event_date}
          </span>
          {speech.event_location && (
            <span className="flex items-center gap-1">
              {locIsTag ? <Tag size={13} /> : <MapPin size={13} />}
              {locIsTag ? localizeTaxonomyTag(speech.event_location, locale) : speech.event_location}
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
        slug={speech.slug}
        locale={locale}
        youtubeId={speech.youtube_video_id}
        vimeoUrl={speech.vimeo_url}
        selfHostedAudio={speech.self_hosted_audio_url}
        selfHostedHls={speech.self_hosted_hls_url}
        durationSeconds={speech.duration_seconds}
        videoHealthStatus={speech.video_health_status}
        videoHealthReason={speech.video_health_reason}
        chapters={speech.transcript_chapters}
        transcriptMethod={speech.transcript_method}
        originalLang={resolved.originalLang}
        originalTitle={trans?.title}
        originalDescription={trans?.description}
        originalTranscriptMarkdown={trans?.transcript_markdown}
        translated={resolved.translatedRecord}
      />

      {/* Prev / Next Speech Navigation */}
      {(prevSpeech || nextSpeech) && (
        <nav
          aria-label={tx('سخنرانی‌های قبلی و بعدی', 'Interventions précédente et suivante', 'Speech Navigation')}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--border-subtle)]"
        >
          {prevSpeech ? (
            <Link
              href={`/${locale}/human-rights/speeches/${prevSpeech.slug}`}
              className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--primary)] transition-colors space-y-1"
            >
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--primary)]">
                {isFa ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                <span>{tx('سخنرانی قبلی', 'Intervention précédente', 'Previous Speech')}</span>
              </span>
              <p className="text-xs sm:text-sm font-bold text-[var(--foreground)] line-clamp-2">
                {getSpeechTitle(prevSpeech)}
              </p>
            </Link>
          ) : (
            <div />
          )}

          {nextSpeech ? (
            <Link
              href={`/${locale}/human-rights/speeches/${nextSpeech.slug}`}
              className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--primary)] transition-colors space-y-1 text-end"
            >
              <span className="inline-flex items-center justify-end gap-1 text-[11px] font-bold text-[var(--primary)] w-full">
                <span>{tx('سخنرانی بعدی', 'Intervention suivante', 'Next Speech')}</span>
                {isFa ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
              </span>
              <p className="text-xs sm:text-sm font-bold text-[var(--foreground)] line-clamp-2">
                {getSpeechTitle(nextSpeech)}
              </p>
            </Link>
          ) : null}
        </nav>
      )}
    </div>
  );
}
