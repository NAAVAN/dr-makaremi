'use client';

import React, { useState } from 'react';
import { Play, Headphones, Video, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';
import type { Locale } from '@makaremi/shared';

interface ResilientMediaPlayerProps {
  title: string;
  youtubeId?: string | null;
  selfHostedAudio?: string | null;
  selfHostedHls?: string | null;
  locale: Locale;
}

export function ResilientMediaPlayer({
  title,
  youtubeId,
  selfHostedAudio,
  selfHostedHls,
  locale,
}: ResilientMediaPlayerProps) {
  const [activeMode, setActiveMode] = useState<'audio' | 'youtube' | 'hls'>('audio');
  const [consentYouTube, setConsentYouTube] = useState<boolean>(false);

  const isFa = locale === 'fa';

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] overflow-hidden shadow-lg space-y-4">
      {/* Player Header & Mode Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[var(--surface-sunken)] border-b border-[var(--border-subtle)]">
        <span className="font-bold text-xs text-[var(--foreground)] truncate max-w-sm">
          {title}
        </span>

        {/* Stream mode tabs */}
        <div className="flex items-center gap-1 bg-[var(--surface-card)] p-1 rounded-xl border border-[var(--border-subtle)] text-xs">
          <button
            type="button"
            onClick={() => setActiveMode('audio')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
              activeMode === 'audio'
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <Headphones size={14} />
            <span>{isFa ? 'پادکست صوتی (سبک)' : 'Audio Podcast'}</span>
          </button>

          {youtubeId && (
            <button
              type="button"
              onClick={() => setActiveMode('youtube')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
                activeMode === 'youtube'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <Video size={14} />
              <span>YouTube</span>
            </button>
          )}
        </div>
      </div>

      {/* Player Screen Display */}
      <div className="p-4 sm:p-6">
        {activeMode === 'audio' && (
          <div className="rounded-xl bg-gradient-to-r from-[var(--surface-sunken)] to-[var(--surface-card)] border border-[var(--border-subtle)] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
                <Headphones size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[var(--foreground)]">{title}</h4>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                  <ShieldCheck size={13} />
                  <span>{isFa ? 'پخش مستقیم سرور ابری (مقاوم در برابر فیلترینگ)' : 'Direct Resilient CDN Stream'}</span>
                </p>
              </div>
            </div>

            <audio
              controls
              className="w-full h-10 rounded-lg outline-none"
              src={selfHostedAudio || 'https://makaremi.com/assets/audio/khavaran-speech.mp3'}
              preload="metadata"
            />
          </div>
        )}

        {activeMode === 'youtube' && youtubeId && (
          <div className="space-y-3">
            {!consentYouTube ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 text-center space-y-3">
                <AlertCircle size={28} className="text-amber-500 mx-auto" />
                <h4 className="text-sm font-bold text-[var(--foreground)]">
                  {isFa ? 'بارگذاری محتوای یوتیوب با رضایت شما' : 'Chargement YouTube'}
                </h4>
                <p className="text-xs text-[var(--foreground-muted)] max-w-md mx-auto leading-relaxed">
                  {isFa
                    ? 'جهت حفظ حریم خصوصی و جلوگیری از اختلال بارگذاری در ایران، ویدیوهای یوتیوب تنها با کلیک صریح شما از طریق سرورهای بدون کوکی (youtube-nocookie.com) لود می‌شوند.'
                    : 'Pour protéger votre vie privée et optimiser le chargement, la vidéo sera lue via youtube-nocookie.com.'}
                </p>
                <button
                  type="button"
                  onClick={() => setConsentYouTube(true)}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
                >
                  {isFa ? 'تأیید و بارگذاری پلیر ویدیویی' : 'Activer le lecteur vidéo'}
                </button>
              </div>
            ) : (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-[var(--border-subtle)] shadow-xl">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`}
                  title={title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-none"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
