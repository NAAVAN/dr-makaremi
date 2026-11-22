'use client';

import React, { useState } from 'react';
import { Headphones, Video, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';
import { resolveProxiedMediaUrl } from '@/lib/media-url';
import type { Locale } from '@makaremi/shared';

interface ResilientMediaPlayerProps {
  title: string;
  youtubeId?: string | null;
  vimeoUrl?: string | null;
  selfHostedAudio?: string | null;
  selfHostedHls?: string | null;
  locale: Locale;
}

export function ResilientMediaPlayer({
  title,
  youtubeId,
  vimeoUrl,
  selfHostedAudio,
  selfHostedHls,
  locale,
}: ResilientMediaPlayerProps) {
  const defaultMode: 'audio' | 'youtube' | 'vimeo' =
    youtubeId ? 'youtube' : vimeoUrl ? 'vimeo' : 'audio';

  const [activeMode, setActiveMode] = useState<'audio' | 'youtube' | 'vimeo'>(defaultMode);
  const [consentExternal, setConsentExternal] = useState<boolean>(false);

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);
  const vimeoId = vimeoUrl?.match(/vimeo\.com\/(\d+)/)?.[1] || null;

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] overflow-hidden shadow-lg space-y-4">
      {/* Player Header & Mode Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[var(--surface-sunken)] border-b border-[var(--border-subtle)]">
        <span className="font-bold text-xs text-[var(--foreground)] truncate max-w-sm">
          {title}
        </span>

        {/* Stream mode tabs */}
        <div className="flex items-center gap-1 bg-[var(--surface-card)] p-1 rounded-xl border border-[var(--border-subtle)] text-xs">
          {youtubeId && (
            <button
              type="button"
              onClick={() => setActiveMode('youtube')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeMode === 'youtube'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <Video size={14} />
              <span>YouTube</span>
            </button>
          )}

          {vimeoId && (
            <button
              type="button"
              onClick={() => setActiveMode('vimeo')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeMode === 'vimeo'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <Video size={14} />
              <span>Vimeo</span>
            </button>
          )}

          {(selfHostedAudio || selfHostedHls) && (
            <button
              type="button"
              onClick={() => setActiveMode('audio')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeMode === 'audio'
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <Headphones size={14} />
              <span>{tx('پادکست صوتی (سبک)', 'Podcast audio', 'Audio Podcast (Lite)')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Player Screen Display */}
      <div className="p-4 sm:p-6">
        {activeMode === 'youtube' && youtubeId && (
          <div className="space-y-3">
            {!consentExternal ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 text-center space-y-4">
                <div className="relative mx-auto max-w-md aspect-video rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-neutral-900">
                  <img
                    src={
                      resolveProxiedMediaUrl(
                        `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
                        'video',
                        title
                      ) || `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`
                    }
                    alt={title}
                    className="w-full h-full object-cover opacity-85"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-[var(--foreground)]">
                    {tx('بارگذاری ویدیوی یوتیوب با رضایت شما', 'Chargement YouTube (Sans Cookies)', 'Privacy-First YouTube Embed')}
                  </h4>
                  <p className="text-xs text-[var(--foreground-muted)] max-w-md mx-auto leading-relaxed">
                    {tx(
                      'جهت حفظ حریم خصوصی و بهینه‌سازی بارگذاری، ویدیوها با کلیک صریح شما از طریق youtube-nocookie.com بارگذاری می‌شوند.',
                      'Pour protéger votre vie privée, la vidéo est chargée via youtube-nocookie.com après votre clic.',
                      'To protect your privacy and keep loading fast, videos are loaded via youtube-nocookie.com only after your explicit click.'
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setConsentExternal(true)}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
                  >
                    {tx('تأیید و پخش ویدیو در صفحه', 'Activer le lecteur vidéo', 'Consent & Play Video')}
                  </button>
                  <a
                    href={`https://www.youtube.com/watch?v=${youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
                  >
                    <ExternalLink size={13} />
                    <span>{tx('باز کردن مستقیم در یوتیوب', 'Ouvrir sur YouTube', 'Open Directly on YouTube')}</span>
                  </a>
                </div>
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

        {activeMode === 'vimeo' && vimeoId && (
          <div className="space-y-3">
            {!consentExternal ? (
              <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-6 text-center space-y-3">
                <AlertCircle size={28} className="text-sky-500 mx-auto" />
                <h4 className="text-sm font-bold text-[var(--foreground)]">
                  {tx('پخش ویدیو از سرور Vimeo', 'Chargement Vimeo', 'Privacy-First Vimeo Embed')}
                </h4>
                <button
                  type="button"
                  onClick={() => setConsentExternal(true)}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
                >
                  {tx('تأیید و بارگذاری پلیر Vimeo', 'Activer le lecteur Vimeo', 'Consent & Load Vimeo Player')}
                </button>
              </div>
            ) : (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-[var(--border-subtle)] shadow-xl">
                <iframe
                  src={`https://player.vimeo.com/video/${vimeoId}?dnt=1`}
                  title={title}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-none"
                />
              </div>
            )}
          </div>
        )}

        {activeMode === 'audio' && (selfHostedAudio || selfHostedHls) && (
          <div className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
                <Headphones size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[var(--foreground)]">{title}</h4>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                  <ShieldCheck size={13} />
                  <span>{tx('پخش مستقیم سرور ابری', 'Flux direct résilient', 'Direct Resilient Stream')}</span>
                </p>
              </div>
            </div>

            <audio
              controls
              className="w-full h-10 rounded-lg outline-none"
              src={selfHostedAudio || selfHostedHls || undefined}
              preload="metadata"
            />
          </div>
        )}

        {!youtubeId && !vimeoId && !selfHostedAudio && !selfHostedHls && (
          <div className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-6 text-center text-xs text-[var(--foreground-muted)]">
            {tx(
              'متن و توضیحات آرشیوی این نشست در بخش پایین در دسترس است.',
              'La description et les notes d’archive de cette intervention figurent ci-dessous.',
              'The description and archival notes for this session appear below.'
            )}
          </div>
        )}
      </div>
    </div>
  );
}
