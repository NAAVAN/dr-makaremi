'use client';

import React, { useMemo, useState } from 'react';
import {
  FileText,
  Search,
  Copy,
  Check,
  Download,
  Play,
  Clock,
  BookOpen,
  X,
} from 'lucide-react';
import { renderSafeMarkdown } from '@/lib/markdown';
import { cleanSummaryWithoutRawUrls, extractUrlsFromText } from '@/lib/link-labeler';
import { DestinationLinkButton } from '@/components/common/DestinationLinkButton';
import type {
  Locale,
  VideoTranscriptChapter,
  VideoTranscriptRecord,
} from '@makaremi/shared';

interface SpeechTranscriptViewProps {
  title: string;
  slug?: string;
  transcriptMarkdown?: string | null;
  description?: string | null;
  locale: Locale;
  chapters?: VideoTranscriptChapter[];
  transcriptMethod?: VideoTranscriptRecord['method'] | null;
  onSeekSeconds?: (sec: number) => void;
  fallbackOriginalNotice?: string | null;
  onShowOriginalClick?: () => void;
}

const TIMESTAMP_PREFIX_RE = /^\*\*\[(\d{1,2}:\d{2}(?::\d{2})?)\]\*\*\s*([\s\S]*)$/;
const PLAIN_TIMESTAMP_RE = /^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*([\s\S]*)$/;

function parseTimestampToSeconds(stamp: string): number {
  const parts = stamp.split(':').map((n) => Number(n));
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

function formatClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export function SpeechTranscriptView({
  title,
  slug,
  transcriptMarkdown,
  description,
  locale,
  chapters,
  transcriptMethod,
  onSeekSeconds,
  fallbackOriginalNotice,
  onShowOriginalClick,
}: SpeechTranscriptViewProps) {
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);

  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const cleanDesc = useMemo(() => cleanSummaryWithoutRawUrls(description), [description]);
  const descUrls = useMemo(() => extractUrlsFromText(description), [description]);

  // Strip raw standalone URLs from transcript only when checking substantiveness
  const cleanedTranscript = useMemo(() => {
    if (!transcriptMarkdown) return '';
    return transcriptMarkdown.trim();
  }, [transcriptMarkdown]);

  const wordCount = useMemo(() => {
    if (!cleanedTranscript) return 0;
    return cleanedTranscript.split(/\s+/).filter(Boolean).length;
  }, [cleanedTranscript]);

  const readMinutes = Math.max(1, Math.round(wordCount / 180));

  const paragraphs = useMemo(() => {
    if (!cleanedTranscript) return [];
    return cleanedTranscript
      .split(/\n\s*\n/)
      .map((raw) => raw.trim())
      .filter(Boolean)
      .map((raw, index) => {
        const m = raw.match(TIMESTAMP_PREFIX_RE) || raw.match(PLAIN_TIMESTAMP_RE);
        if (m) {
          return {
            index,
            stamp: m[1],
            startSec: parseTimestampToSeconds(m[1]),
            body: m[2].trim(),
          };
        }
        return {
          index,
          stamp: null,
          startSec: null,
          body: raw,
        };
      });
  }, [cleanedTranscript]);

  const hasTimedParagraphs = useMemo(
    () => paragraphs.some((p) => p.startSec !== null),
    [paragraphs]
  );

  const visibleParagraphs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return paragraphs;
    return paragraphs.filter(
      (p) =>
        p.body.toLowerCase().includes(q) ||
        (p.stamp && p.stamp.toLowerCase().includes(q))
    );
  }, [paragraphs, searchQuery]);

  const handleCopy = async () => {
    if (!cleanedTranscript) return;
    try {
      await navigator.clipboard.writeText(cleanedTranscript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleDownloadMd = () => {
    if (!cleanedTranscript) return;
    const content = `# ${title}\n\n${cleanedTranscript}\n`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug || 'transcript'}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const provenanceLabel =
    transcriptMethod === 'professor_edited'
      ? tx('تأیید و ویراستاری‌شده در پیشخوان', 'Vérifié dans l’atelier', 'Editorial Verified')
      : transcriptMethod === 'vault_editorial'
        ? tx('متن کامل آرشیو رسمی', 'Texte intégral d’archive', 'Official Archive Text')
        : transcriptMethod === 'youtube_captions' || transcriptMethod === 'asr_verified'
          ? tx('پیاده‌سازی متنی زمان‌بندی‌شده', 'Transcription horodatée', 'Timestamped Transcript')
          : null;

  return (
    <section
      id="video-transcript"
      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 sm:p-8 space-y-6 scroll-mt-24"
    >
      {/* Header + Stats + Utility Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <FileText className="text-[var(--primary)] shrink-0" size={20} />
          <h2 className="text-base sm:text-lg font-extrabold text-[var(--foreground)]">
            {tx(
              'پیاده‌سازی متنی و بیانیه کامل گفتار',
              'Transcription intégrale & notes',
              'Full Transcript & Statement'
            )}
          </h2>
          {provenanceLabel && (
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-[11px] font-bold">
              {provenanceLabel}
            </span>
          )}
        </div>

        {wordCount > 30 && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-sunken)] text-[var(--foreground-muted)] font-mono text-[11px]">
              <Clock size={12} />
              {tx(
                `~${readMinutes} دقیقه مطالعه (${wordCount.toLocaleString('fa-IR')} واژه)`,
                `~${readMinutes} min (${wordCount} mots)`,
                `~${readMinutes} min read (${wordCount} words)`
              )}
            </span>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[11px] font-bold text-[var(--foreground)] hover:border-[var(--primary)] cursor-pointer"
            >
              {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              <span>
                {copied
                  ? tx('کپی شد', 'Copié', 'Copied')
                  : tx('کپی متن', 'Copier', 'Copy')}
              </span>
            </button>

            <button
              type="button"
              onClick={handleDownloadMd}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[11px] font-bold text-[var(--foreground)] hover:border-[var(--primary)] cursor-pointer"
            >
              <Download size={12} />
              <span dir="ltr">.md</span>
            </button>
          </div>
        )}
      </div>

      {/* Cleaned Archival Description (Zero Raw URLs — BUG-V03 Fix) */}
      {(cleanDesc || descUrls.length > 0) && (
        <div className="p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] space-y-3">
          {cleanDesc && (
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed">
              {cleanDesc}
            </p>
          )}
          {descUrls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {descUrls.map((u) => (
                <DestinationLinkButton key={u} href={u} locale={locale} compact />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Optional Chapter Jump Chips */}
      {chapters && chapters.length > 1 && onSeekSeconds && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-[var(--foreground-muted)] flex items-center gap-1.5">
            <BookOpen size={13} className="text-[var(--primary)]" />
            <span>
              {tx(
                'پرش سریع به بخش‌های زمانی گفتار (کلیک روی زمان):',
                'Accès rapide par repères temporels :',
                'Jump to Timed Sections:'
              )}
            </span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {chapters.map((ch) => (
              <button
                key={`${ch.startSec}-${ch.title}`}
                type="button"
                onClick={() => onSeekSeconds(ch.startSec)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--surface-sunken)] border border-[var(--border-subtle)] hover:border-[var(--primary)] text-[11px] text-[var(--foreground)] transition-colors cursor-pointer"
              >
                <span dir="ltr" className="font-mono font-bold text-[var(--primary)] inline-flex items-center gap-0.5">
                  <Play size={10} className="fill-current" />
                  {formatClock(ch.startSec)}
                </span>
                <span className="truncate max-w-[200px]">{ch.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Live In-Transcript Search Bar (when transcript has multiple paragraphs) */}
      {paragraphs.length >= 3 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search
              size={14}
              className="absolute top-1/2 -translate-y-1/2 start-3 text-[var(--foreground-muted)] pointer-events-none"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tx(
                'جستجوی واژه یا مفهوم در متن این سخنرانی...',
                'Rechercher un mot dans cette transcription...',
                'Search within this transcript...'
              )}
              className="w-full ps-9 pe-8 py-2 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label={tx('پاک کردن', 'Effacer', 'Clear')}
                onClick={() => setSearchQuery('')}
                className="absolute top-1/2 -translate-y-1/2 end-2.5 text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>
          {searchQuery.trim() && (
            <span className="text-xs font-mono text-[var(--primary)] font-bold">
              {tx(
                `${visibleParagraphs.length} بند منطبق`,
                `${visibleParagraphs.length} passage(s)`,
                `${visibleParagraphs.length} matching paragraph(s)`
              )}
            </span>
          )}
        </div>
      )}

      {/* Main Transcript Body */}
      {cleanedTranscript ? (
        visibleParagraphs.length === 0 ? (
          <div className="p-6 rounded-xl bg-[var(--surface-sunken)] text-center text-xs text-[var(--foreground-muted)]">
            {tx(
              'هیچ بندی با این عبارت در متن گفتار یافت نشد.',
              'Aucun passage ne correspond à votre recherche.',
              'No passages matched your search query.'
            )}
          </div>
        ) : hasTimedParagraphs || searchQuery.trim().length > 0 ? (
          <div className="space-y-4">
            {visibleParagraphs.map((p) => (
              <div
                key={p.index}
                className="group rounded-xl p-3.5 sm:p-4 bg-[var(--surface-sunken)]/40 hover:bg-[var(--surface-sunken)] border border-transparent hover:border-[var(--border-subtle)] transition-colors space-y-2"
              >
                {p.stamp && p.startSec !== null && (
                  <button
                    type="button"
                    onClick={() => onSeekSeconds?.(p.startSec!)}
                    disabled={!onSeekSeconds}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--primary-light)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] font-mono text-[11px] font-bold transition-colors cursor-pointer disabled:cursor-default"
                    title={tx('پرش ویدیو به این لحظه', 'Aller à ce moment de la vidéo', 'Jump video to this timestamp')}
                  >
                    <Play size={10} className="fill-current" />
                    <span dir="ltr">{p.stamp}</span>
                  </button>
                )}
                <div className="prose-content text-base leading-loose text-[var(--foreground)]">
                  {renderSafeMarkdown(p.body, { locale })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="prose-content text-base leading-loose text-[var(--foreground)] space-y-4">
            {renderSafeMarkdown(cleanedTranscript, { locale })}
          </div>
        )
      ) : (
        <div className="p-5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] space-y-3">
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed">
            {fallbackOriginalNotice ||
              tx(
                'متن کامل پیاده‌سازی‌شده این سخنرانی در نوبت تکمیل و بازبینی آرشیو قرار دارد.',
                'La transcription intégrale de cette intervention est en cours d’intégration dans les archives.',
                'The full transcript of this lecture is currently queued for archival integration.'
              )}
          </p>
          {onShowOriginalClick && (
            <button
              type="button"
              onClick={onShowOriginalClick}
              className="px-3.5 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold cursor-pointer"
            >
              {tx('مطالعه متن کامل به زبان اصلی', 'Lire la transcription originale', 'Read Full Original Transcript')}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
