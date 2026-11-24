'use client';

import React, { useEffect, useState } from 'react';
import {
  Headphones,
  Video,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Play,
  FileText,
  Clock,
  Lock,
} from 'lucide-react';
import { resolveProxiedMediaUrl } from '@/lib/media-url';
import type { Locale, VideoHealthStatus } from '@makaremi/shared';

export interface ResilientMediaPlayerProps {
  title: string;
  youtubeId?: string | null;
  vimeoUrl?: string | null;
  selfHostedAudio?: string | null;
  selfHostedHls?: string | null;
  locale: Locale;
  videoHealthStatus?: VideoHealthStatus;
  videoHealthReason?: string | null;
  durationSeconds?: number | null;
  hasTranscript?: boolean;
  seekRequest?: { seconds: number; nonce: number } | null;
}

function formatDurationLabel(sec?: number | null): string | null {
  if (!sec || sec <= 0) return null;
  const total = Math.floor(sec);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function ResilientMediaPlayer({
  title,
  youtubeId,
  vimeoUrl,
  selfHostedAudio,
  selfHostedHls,
  locale,
  videoHealthStatus = 'ok',
  videoHealthReason,
  durationSeconds,
  hasTranscript = false,
  seekRequest,
}: ResilientMediaPlayerProps) {
  const vimeoId = vimeoUrl?.match(/vimeo\.com\/(\d+)/)?.[1] || null;
  const hasAudio = Boolean(selfHostedAudio || selfHostedHls);
  const sourcesCount = [Boolean(youtubeId), Boolean(vimeoId), hasAudio].filter(Boolean).length;

  const defaultMode: 'audio' | 'youtube' | 'vimeo' =
    youtubeId ? 'youtube' : vimeoId ? 'vimeo' : 'audio';

  const [activeMode, setActiveMode] = useState<'audio' | 'youtube' | 'vimeo'>(defaultMode);
  const [consentExternal, setConsentExternal] = useState<boolean>(false);
  const [startSec, setStartSec] = useState<number>(0);
  const [embedNonce, setEmbedNonce] = useState<number>(0);
  const [overrideUnavailable, setOverrideUnavailable] = useState<boolean>(false);

  // Support deep links like ?t=185 on page load
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const rawT = sp.get('t') || sp.get('start');
      if (rawT) {
        const parsed = parseInt(rawT.replace(/s$/i, ''), 10);
        if (Number.isFinite(parsed) && parsed > 0) {
          setStartSec(parsed);
        }
      }
    } catch {
      // ignore SSR/search parse
    }
  }, []);

  // React to timestamp clicks from SpeechTranscriptView
  useEffect(() => {
    if (!seekRequest) return;
    const sec = Math.max(0, Math.floor(seekRequest.seconds));
    setStartSec(sec);
    setConsentExternal(true);
    setOverrideUnavailable(true);
    setEmbedNonce((n) => n + 1);
    const playerEl = document.getElementById('resilient-video-stage');
    if (playerEl) {
      playerEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [seekRequest]);

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);

  const durationLabel = formatDurationLabel(durationSeconds);
  const isFlaggedUnavailable =
    (videoHealthStatus === 'private' || videoHealthStatus === 'unavailable') && !overrideUnavailable;

  const youtubeWatchUrl = youtubeId
    ? `https://www.youtube.com/watch?v=${youtubeId}${startSec > 0 ? `&t=${startSec}s` : ''}`
    : null;

  const youtubeEmbedUrl = youtubeId
    ? `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&autoplay=1${startSec > 0 ? `&start=${startSec}` : ''}`
    : null;

  const vimeoEmbedUrl = vimeoId
    ? `https://player.vimeo.com/video/${vimeoId}?dnt=1&autoplay=1${startSec > 0 ? `#t=${startSec}s` : ''}`
    : null;

  const scrollToTranscript = () => {
    const el = document.getElementById('video-transcript');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      id="resilient-video-stage"
      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] overflow-hidden shadow-lg"
    >
      {/* Player Header — BUG-V01 Fix: Single-source shows status badge + direct external link, multi-source shows switcher tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[var(--surface-sunken)] border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 min-w-0">
          <Video size={15} className="text-[var(--primary)] shrink-0" />
          <span className="font-bold text-xs text-[var(--foreground)] truncate max-w-xs sm:max-w-md">
            {title}
          </span>
          {durationLabel && (
            <span
              dir="ltr"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--foreground-muted)] shrink-0"
            >
              <Clock size={10} />
              {durationLabel}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {sourcesCount >= 2 ? (
            <div className="flex items-center gap-1 bg-[var(--surface-card)] p-1 rounded-xl border border-[var(--border-subtle)]">
              {youtubeId && (
                <button
                  type="button"
                  onClick={() => setActiveMode('youtube')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${activeMode === 'youtube'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }`}
                >
                  <Video size={13} />
                  <span>YouTube</span>
                </button>
              )}

              {vimeoId && (
                <button
                  type="button"
                  onClick={() => setActiveMode('vimeo')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${activeMode === 'vimeo'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }`}
                >
                  <Video size={13} />
                  <span>Vimeo</span>
                </button>
              )}

              {hasAudio && (
                <button
                  type="button"
                  onClick={() => setActiveMode('audio')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${activeMode === 'audio'
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs'
                      : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }`}
                >
                  <Headphones size={13} />
                  <span>{tx('پادکست صوتی', 'Audio', 'Audio')}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {youtubeWatchUrl && (
                <a
                  href={youtubeWatchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[11px] font-bold text-[var(--foreground)] hover:border-red-500/60 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <ExternalLink size={12} />
                  <span>{tx('مشاهده در یوتیوب', 'Voir sur YouTube', 'Watch on YouTube')}</span>
                </a>
              )}
              {vimeoUrl && !youtubeWatchUrl && (
                <a
                  href={vimeoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[11px] font-bold text-[var(--foreground)] hover:border-sky-500/60 hover:text-sky-600 transition-colors"
                >
                  <ExternalLink size={12} />
                  <span>{tx('مشاهده در Vimeo', 'Voir sur Vimeo', 'Watch on Vimeo')}</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Player Screen Display */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* BUG-V06 Fix: Archival notice for Private / Unavailable YouTube videos instead of black error frame */}
        {activeMode === 'youtube' && youtubeId && isFlaggedUnavailable ? (
          <div className="rounded-xl border border-amber-500/35 bg-amber-500/5 p-6 sm:p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto">
              <Lock size={22} />
            </div>
            <div className="space-y-2 max-w-xl mx-auto">
              <h2 className="text-base font-extrabold text-[var(--foreground)]">
                {videoHealthStatus === 'private'
                  ? tx(
                    'این ویدیو در حال حاضر در یوتیوب در حالت خصوصی (Private) است',
                    'Cette vidéo est actuellement définie en mode privé sur YouTube',
                    'This video is currently marked Private on YouTube'
                  )
                  : tx(
                    'استریم این ویدیو در حال حاضر از سرور یوتیوب در دسترس نیست',
                    'Le flux YouTube de cette archive est actuellement indisponible',
                    'This YouTube stream is currently unavailable'
                  )}
              </h2>
              <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                {tx(
                  'مشخصات این اثر در آرشیو رسمی دکتر حسن مکارمی حفظ شده است و وضعیت آن در پیشخوان برای بازبینی یا جایگزینی لینک ثبت گردیده است.',
                  'La notice bibliographique et les textes associés demeurent préservés dans les archives officielles du Dr Hassan Makaremi.',
                  'This record and its archival documentation remain preserved in Dr. Hassan Makaremi’s official archive and have been flagged in Pishkhan for link restoration.'
                )}
              </p>
              {videoHealthReason && (
                <p dir="ltr" className="text-[11px] font-mono text-[var(--foreground-muted)]">
                  Status: {videoHealthReason}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              {hasTranscript && (
                <button
                  type="button"
                  onClick={scrollToTranscript}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold cursor-pointer"
                >
                  <FileText size={14} />
                  <span>{tx('مطالعه متن پیاده‌سازی‌شده', 'Lire la transcription', 'Read Transcript Below')}</span>
                </button>
              )}
              {youtubeWatchUrl && (
                <a
                  href={youtubeWatchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--foreground)] hover:border-[var(--primary)]"
                >
                  <ExternalLink size={13} />
                  <span>{tx('بررسی مستقیم در یوتیوب', 'Vérifier sur YouTube', 'Check on YouTube')}</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  setOverrideUnavailable(true);
                  setConsentExternal(true);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--foreground-muted)] hover:text-[var(--foreground)] underline cursor-pointer"
              >
                {tx('تلاش مجدد برای بارگذاری پخش‌کننده', 'Réessayer le lecteur', 'Try Loading Player Anyway')}
              </button>
            </div>
          </div>
        ) : activeMode === 'youtube' && youtubeId ? (
          <div className="space-y-3">
            {!consentExternal ? (
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)]/60 p-4 sm:p-6 text-center space-y-4">
                {/* BUG-V02 Fix: One-click clickable cover with central Play overlay */}
                <button
                  type="button"
                  onClick={() => setConsentExternal(true)}
                  aria-label={tx(`پخش ویدیو: ${title}`, `Lire la vidéo : ${title}`, `Play video: ${title}`)}
                  className="group relative mx-auto block w-full max-w-2xl aspect-video rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-neutral-950 shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  <img
                    src={
                      resolveProxiedMediaUrl(
                        `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
                        'video',
                        title
                      ) || `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`
                    }
                    alt={title}
                    className="w-full h-full object-cover opacity-90 group-hover:scale-[1.02] transition-transform duration-300"
                    loading="eager"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col items-center justify-center gap-3">
                    <span className="w-16 h-16 rounded-full bg-red-600/95 group-hover:bg-red-600 group-hover:scale-105 text-white flex items-center justify-center shadow-2xl transition-all">
                      <Play size={28} className="fill-white ms-0.5" />
                    </span>
                    <span className="px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-sm text-white text-xs font-bold">
                      {startSec > 0
                        ? tx(
                          `کلیک برای شروع پخش از ${formatDurationLabel(startSec)}`,
                          `Cliquer pour lire à ${formatDurationLabel(startSec)}`,
                          `Click to play from ${formatDurationLabel(startSec)}`
                        )
                        : tx('کلیک برای پخش مستقیم ویدیو (حریم خصوصی امن)', 'Cliquer pour lancer la vidéo', 'Click to Play Video (Privacy-First)')}
                    </span>
                  </div>
                </button>

                <p className="text-[11px] text-[var(--foreground-muted)] max-w-lg mx-auto leading-relaxed">
                  {tx(
                    'پخش از طریق youtube-nocookie.com بدون کوکی ردیابی. در صورت محدودیت شبکه در ایران، متن پیاده‌سازی‌شده گفتار در بخش زیر بدون فیلتر در دسترس است.',
                    'Chargement sans cookies via youtube-nocookie.com dès votre clic.',
                    'Loads via privacy-enhanced youtube-nocookie.com on click; full transcript remains accessible below.'
                  )}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setConsentExternal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    <Play size={13} className="fill-white" />
                    <span>{tx('پخش ویدیو در صفحه', 'Lancer la vidéo', 'Play Video Here')}</span>
                  </button>
                  {youtubeWatchUrl && (
                    <a
                      href={youtubeWatchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--foreground)] hover:border-[var(--primary)] transition-colors"
                    >
                      <ExternalLink size={13} />
                      <span>{tx('باز کردن مستقیم در یوتیوب', 'Ouvrir sur YouTube', 'Open on YouTube')}</span>
                    </a>
                  )}
                  {hasTranscript && (
                    <button
                      type="button"
                      onClick={scrollToTranscript}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--primary)] hover:border-[var(--primary)] transition-colors cursor-pointer"
                    >
                      <FileText size={13} />
                      <span>{tx('پرش به متن پیاده‌سازی‌شده ↓', 'Aller à la transcription ↓', 'Jump to Transcript ↓')}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-[var(--border-subtle)] shadow-xl">
                  <iframe
                    key={`${youtubeId}-${startSec}-${embedNonce}`}
                    src={youtubeEmbedUrl || undefined}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-none"
                  />
                </div>

                {/* Persistent post-play fallback toolbar (never vanishes after click) */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[11px]">
                  <span className="text-[var(--foreground-muted)]">
                    {tx(
                      'اگر ویدیو در شبکه شما باز نشد، از لینک مستقیم یوتیوب یا متن پیاده‌سازی‌شده زیر استفاده کنید.',
                      'Si le lecteur ne charge pas, ouvrez la vidéo sur YouTube ou lisez la transcription ci-dessous.',
                      'If playback is blocked on your network, open YouTube directly or read the full transcript below.'
                    )}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {hasTranscript && (
                      <button
                        type="button"
                        onClick={scrollToTranscript}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] font-bold text-[var(--primary)] hover:border-[var(--primary)] cursor-pointer"
                      >
                        <FileText size={12} />
                        <span>{tx('متن پیاده‌سازی‌شده ↓', 'Transcription ↓', 'Transcript ↓')}</span>
                      </button>
                    )}
                    {youtubeWatchUrl && (
                      <a
                        href={youtubeWatchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] font-bold text-[var(--foreground)] hover:border-[var(--primary)]"
                      >
                        <ExternalLink size={12} />
                        <span>{tx('باز کردن در یوتیوب', 'Ouvrir sur YouTube', 'Open on YouTube')}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {activeMode === 'vimeo' && vimeoId && (
          <div className="space-y-3">
            {!consentExternal ? (
              <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-6 text-center space-y-3">
                <AlertCircle size={28} className="text-sky-500 mx-auto" />
                <h2 className="text-sm font-bold text-[var(--foreground)]">
                  {tx('پخش ویدیو از سرور Vimeo', 'Chargement Vimeo', 'Privacy-First Vimeo Embed')}
                </h2>
                <button
                  type="button"
                  onClick={() => setConsentExternal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
                >
                  <Play size={13} className="fill-white" />
                  <span>{tx('تأیید و پخش ویدیو در Vimeo', 'Lancer le lecteur Vimeo', 'Play Vimeo Video')}</span>
                </button>
              </div>
            ) : (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-[var(--border-subtle)] shadow-xl">
                <iframe
                  key={`${vimeoId}-${startSec}-${embedNonce}`}
                  src={vimeoEmbedUrl || undefined}
                  title={title}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-none"
                />
              </div>
            )}
          </div>
        )}

        {activeMode === 'audio' && hasAudio && (
          <div className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
                <Headphones size={24} />
              </div>
              <div>
                <h2 className="font-bold text-sm text-[var(--foreground)]">{title}</h2>
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

        {!youtubeId && !vimeoId && !hasAudio && (
          <div className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-6 text-center text-xs text-[var(--foreground-muted)]">
            {tx(
              'فایل تصویری مستقل برای این رکورد ثبت نشده است؛ متن و توضیحات آرشیوی در بخش پایین در دسترس است.',
              'La description et les notes d’archive de cette intervention figurent ci-dessous.',
              'The description and archival notes for this session appear below.'
            )}
          </div>
        )}
      </div>
    </div>
  );
}
