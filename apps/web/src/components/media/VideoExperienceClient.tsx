'use client';

import React, { useState } from 'react';
import type {
  Locale,
  VideoHealthStatus,
  VideoTranscriptChapter,
  VideoTranscriptRecord,
} from '@makaremi/shared';
import type { StoredWorkTranslation } from '@/lib/translations-store';
import { ResilientMediaPlayer } from './ResilientMediaPlayer';
import { SpeechTranscriptView } from './SpeechTranscriptView';
import { BilingualWorkReader } from '@/components/i18n/BilingualWorkReader';
import { getLanguageLabel } from '@/lib/work-language';

interface VideoExperienceClientProps {
  title: string;
  slug: string;
  locale: Locale;
  youtubeId?: string | null;
  vimeoUrl?: string | null;
  selfHostedAudio?: string | null;
  selfHostedHls?: string | null;
  durationSeconds?: number | null;
  videoHealthStatus?: VideoHealthStatus;
  videoHealthReason?: string | null;
  chapters?: VideoTranscriptChapter[];
  transcriptMethod?: VideoTranscriptRecord['method'] | null;
  originalLang: Locale;
  originalTitle?: string | null;
  originalDescription?: string | null;
  originalTranscriptMarkdown?: string | null;
  translated: StoredWorkTranslation | null;
}

export function VideoExperienceClient({
  title,
  slug,
  locale,
  youtubeId,
  vimeoUrl,
  selfHostedAudio,
  selfHostedHls,
  durationSeconds,
  videoHealthStatus,
  videoHealthReason,
  chapters,
  transcriptMethod,
  originalLang,
  originalTitle,
  originalDescription,
  originalTranscriptMarkdown,
  translated,
}: VideoExperienceClientProps) {
  const [seekRequest, setSeekRequest] = useState<{ seconds: number; nonce: number } | null>(null);

  const handleSeek = (seconds: number) => {
    const clean = Math.max(0, Math.floor(seconds));
    setSeekRequest((prev) => ({ seconds: clean, nonce: (prev?.nonce || 0) + 1 }));
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('t', String(clean));
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore URL update issues
    }
  };

  const hasAnyTranscript = Boolean(
    (originalTranscriptMarkdown && originalTranscriptMarkdown.trim().length > 0) ||
      (translated?.body_markdown && translated.body_markdown.trim().length > 0)
  );

  const origLangLabel = getLanguageLabel(originalLang, locale);
  const translatedTranscriptMd = translated?.body_markdown?.trim() || null;

  const translatedSlot = translated ? (
    <SpeechTranscriptView
      title={translated.title || title}
      slug={slug}
      transcriptMarkdown={translatedTranscriptMd || originalTranscriptMarkdown}
      description={translated.summary}
      locale={translatedTranscriptMd ? locale : originalLang}
      chapters={chapters}
      transcriptMethod={transcriptMethod}
      onSeekSeconds={youtubeId || vimeoUrl ? handleSeek : undefined}
      fallbackOriginalNotice={
        !translatedTranscriptMd && originalTranscriptMarkdown
          ? locale === 'fr'
            ? `La synthèse est affichée en français ; la transcription intégrale originale (${origLangLabel}) figure ci-dessous.`
            : locale === 'en'
              ? `The scholarly summary is displayed in English; the full original transcript (${origLangLabel}) is preserved below.`
              : null
          : null
      }
    />
  ) : undefined;

  return (
    <div className="space-y-8">
      <ResilientMediaPlayer
        title={title}
        youtubeId={youtubeId}
        vimeoUrl={vimeoUrl}
        selfHostedAudio={selfHostedAudio}
        selfHostedHls={selfHostedHls}
        locale={locale}
        durationSeconds={durationSeconds}
        videoHealthStatus={videoHealthStatus}
        videoHealthReason={videoHealthReason}
        hasTranscript={hasAnyTranscript}
        seekRequest={seekRequest}
      />

      <BilingualWorkReader
        originalLang={originalLang}
        siteLocale={locale}
        translated={translated}
        originalTitle={originalTitle}
        translatedContent={translatedSlot}
        originalContent={
          <SpeechTranscriptView
            title={originalTitle || title}
            slug={slug}
            transcriptMarkdown={originalTranscriptMarkdown}
            description={originalDescription}
            locale={originalLang}
            chapters={chapters}
            transcriptMethod={transcriptMethod}
            onSeekSeconds={youtubeId || vimeoUrl ? handleSeek : undefined}
          />
        }
      />
    </div>
  );
}
