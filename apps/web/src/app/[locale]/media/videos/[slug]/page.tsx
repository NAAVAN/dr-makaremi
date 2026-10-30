import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Video, Calendar, MapPin, ArrowRight, ArrowLeft, Download } from 'lucide-react';
import { getVideoSpeechBySlug, getVideoSpeeches } from '@/lib/cms';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { ResilientMediaPlayer } from '@/components/media/ResilientMediaPlayer';
import { SpeechTranscriptView } from '@/components/media/SpeechTranscriptView';

export async function generateStaticParams() {
  const videos = await getVideoSpeeches('fa');
  const params: Array<{ locale: string; slug: string }> = [];

  for (const locale of SUPPORTED_LOCALES) {
    for (const v of videos) {
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
  const vid = await getVideoSpeechBySlug(slug, locale as Locale);
  if (!vid) return {};

  const trans =
    vid.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    vid.translations?.[0];

  return {
    title: trans?.title || vid.slug,
    description: trans?.description?.slice(0, 160),
    alternates: {
      canonical: `https://makaremi.com/${locale}/media/videos/${slug}`,
    },
  };
}

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };
  if (!isValidLocale(locale)) notFound();

  const vid = await getVideoSpeechBySlug(slug, locale);
  if (!vid) notFound();

  const isFa = locale === 'fa';
  const trans =
    vid.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    vid.translations?.[0];

  const title = trans?.title || vid.slug;

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      <nav aria-label="راهنمای مسیر" className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
        <Link
          href={`/${locale}/media`}
          className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors font-medium"
        >
          {isFa ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          <span>{isFa ? 'بازگشت به آرشیو رسانه' : 'Retour aux médias'}</span>
        </Link>

        <Link
          href={`/${locale}/media/videos/${slug}.md`}
          target="_blank"
          className="flex items-center gap-1 font-mono px-2.5 py-1 rounded-md bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
        >
          <Download size={12} />
          <span>.md (AEO / AI Twin)</span>
        </Link>
      </nav>

      {/* Single H1 Tag */}
      <header className="space-y-4 border-b border-[var(--border-subtle)] pb-6">
        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--foreground-muted)] font-medium">
          <span className="font-mono uppercase px-2.5 py-0.5 rounded-full bg-[var(--surface-sunken)] border border-[var(--border-subtle)] font-bold text-[var(--primary)]">
            {vid.pillar.replace('_', ' ')}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={13} />
            {vid.event_date}
          </span>
          {vid.event_location && (
            <span className="flex items-center gap-1">
              <MapPin size={13} />
              {vid.event_location}
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
        youtubeId={vid.youtube_video_id}
        selfHostedAudio={vid.self_hosted_audio_url}
        selfHostedHls={vid.self_hosted_hls_url}
        locale={locale}
      />

      {/* Speech Transcript */}
      <SpeechTranscriptView
        title={title}
        transcriptMarkdown={trans?.transcript_markdown}
        description={trans?.description}
        locale={locale}
      />
    </div>
  );
}
