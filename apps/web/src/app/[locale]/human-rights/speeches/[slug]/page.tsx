import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ShieldAlert, ArrowRight, ArrowLeft, Download, Calendar, MapPin } from 'lucide-react';
import { getVideoSpeechBySlug, getVideoSpeeches } from '@/lib/cms';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { ResilientMediaPlayer } from '@/components/media/ResilientMediaPlayer';
import { SpeechTranscriptView } from '@/components/media/SpeechTranscriptView';
import { JsonLdGraph } from '@/components/seo/JsonLdGraph';
import { buildVideoObjectNode, buildBreadcrumbNode, buildFullGraph } from '@/lib/schema-org';
import { buildTrilingualMetadata } from '@/lib/seo-helpers';
import { BilingualWorkReader } from '@/components/i18n/BilingualWorkReader';
import { resolveWorkTranslation } from '@/lib/work-language';

export const dynamicParams = true;

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
  const description = trans?.description?.slice(0, 160) || title;

  return buildTrilingualMetadata({
    locale,
    path: `/human-rights/speeches/${slug}`,
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

  const speech = await getVideoSpeechBySlug(slug, locale);
  if (!speech) notFound();

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const resolved = resolveWorkTranslation({
    collection: 'videos',
    slug: speech.slug,
    translations: speech.translations,
    siteLocale: locale,
  });
  const trans = resolved.originalRecord || speech.translations?.[0];

  const title = resolved.translatedRecord?.title || trans?.title || speech.slug;
  const jsonLdGraph = buildFullGraph({
    locale,
    items: [
      buildVideoObjectNode(speech, locale),
      buildBreadcrumbNode([
        { name: isFa ? 'خانه' : isFr ? 'Accueil' : 'Home', item: `https://makaremi.com/${locale}` },
        { name: isFa ? 'حقوق بشر و دادخواهی' : isFr ? 'Droits de l’Homme' : 'Human Rights', item: `https://makaremi.com/${locale}/human-rights` },
        { name: title, item: `https://makaremi.com/${locale}/human-rights/speeches/${slug}` },
      ]),
    ],
  });

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      <JsonLdGraph data={jsonLdGraph} />
      <link
        rel="alternate"
        type="text/markdown"
        href={`/${locale}/human-rights/speeches/${slug}.md`}
        title="Markdown Twin"
      />
      <nav aria-label="راهنمای مسیر" className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
        <Link
          href={`/${locale}/human-rights`}
          className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors font-medium"
        >
          {isFa ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          <span>
            {isFa
              ? 'بازگشت به پورتال حقوق بشر و دادخواهی'
              : isFr
                ? 'Retour aux droits de l’homme'
                : 'Back to Human Rights'}
          </span>
        </Link>

        <Link
          href={`/${locale}/human-rights/speeches/${slug}.md`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 font-mono px-2.5 py-1 rounded-md bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
        >
          <Download size={12} />
          <span>.md (AEO / AI Twin)</span>
        </Link>
      </nav>

      {/* Header with Strict Single H1 */}
      <header className="space-y-4 border-b border-[var(--border-subtle)] pb-6">
        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--foreground-muted)] font-medium">
          <span className="font-mono uppercase px-2.5 py-0.5 rounded-full bg-[var(--surface-sunken)] border border-[var(--border-subtle)] font-bold text-[var(--color-dadkhahi)]">
            {isFa ? 'دادخواهی و عدالت انتقالی' : isFr ? 'Droits humains & Justice' : 'Human Rights & Justice'}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={13} />
            {speech.event_date}
          </span>
          {speech.event_location && (
            <span className="flex items-center gap-1">
              <MapPin size={13} />
              {speech.event_location}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight leading-tight">
          {title}
        </h1>
      </header>

      {/* Resilient Media Player */}
      <ResilientMediaPlayer
        title={title}
        youtubeId={speech.youtube_video_id}
        vimeoUrl={speech.vimeo_url}
        selfHostedAudio={speech.self_hosted_audio_url}
        selfHostedHls={speech.self_hosted_hls_url}
        locale={locale}
      />

      {/* Full Transcript View with Bilingual Reader */}
      <BilingualWorkReader
        originalLang={resolved.originalLang}
        siteLocale={locale}
        translated={resolved.translatedRecord}
        originalTitle={trans?.title}
        originalContent={
          <SpeechTranscriptView
            title={trans?.title || speech.slug}
            transcriptMarkdown={trans?.transcript_markdown}
            description={trans?.description}
            locale={locale}
          />
        }
      />
    </div>
  );
}
