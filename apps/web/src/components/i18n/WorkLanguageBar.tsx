'use client';

import React from 'react';
import { Languages, RotateCcw } from 'lucide-react';
import type { Locale } from '@makaremi/shared';
import { getLanguageLabel } from '@/lib/work-language';

interface WorkLanguageBarProps {
  originalLang: Locale;
  siteLocale: Locale;
  isTranslated: boolean;
  hasTranslation: boolean;
  onToggle: () => void;
  compact?: boolean;
}

/**
 * In-Box Archival Language Provenance Badge & Translate Toggle for Archive Cards.
 * - Renders NOTHING when `originalLang === siteLocale` (zero clutter on native-language works).
 * - Preserves the authentic original work by default; one click switches to the site-language
 *   reading translation (or cleanly indicates queued Waves 3–5 status without broken UX).
 */
export function WorkLanguageBar({
  originalLang,
  siteLocale,
  isTranslated,
  hasTranslation,
  onToggle,
  compact = false,
}: WorkLanguageBarProps) {
  if (originalLang === siteLocale) return null;

  const isFa = siteLocale === 'fa';
  const isFr = siteLocale === 'fr';
  const origName = getLanguageLabel(originalLang, siteLocale);

  const badgeText = isFa
    ? `اصل اثر: ${origName}`
    : isFr
      ? `Original : ${origName}`
      : `Original: ${origName}`;

  const translateLabel = isFa
    ? 'ترجمه به فارسی'
    : isFr
      ? 'Traduire en français'
      : 'Translate to English';

  const showOriginalLabel = isFa
    ? 'نمایش اصل اثر'
    : isFr
      ? 'Voir l’original'
      : 'Show Original';

  const queuedLabel = isFa
    ? 'در صف ترجمه فارسی'
    : isFr
      ? 'Traduction en cours'
      : 'Translation Queued';

  return (
    <div
      data-work-lang-bar="true"
      data-original-lang={originalLang}
      className={`flex flex-wrap items-center justify-between gap-2 ${
        compact ? 'text-[10px]' : 'text-[11px]'
      } pb-2 mb-2 border-b border-[var(--border-subtle)]`}
    >
      <span className="inline-flex items-center gap-1.5 font-mono text-[var(--foreground-muted)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-gold)] shrink-0" />
        <span>{badgeText}</span>
      </span>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
        aria-pressed={isTranslated}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-semibold transition-colors cursor-pointer ${
          isTranslated
            ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
            : hasTranslation
              ? 'bg-[var(--surface-sunken)] hover:bg-[var(--surface-artifact)] text-[var(--primary)] border-[var(--border-medium)] hover:border-[var(--primary)]'
              : 'bg-[var(--surface-sunken)] text-[var(--foreground-muted)] border-[var(--border-subtle)] hover:text-[var(--foreground)]'
        }`}
      >
        {isTranslated ? (
          <>
            <RotateCcw size={11} className="shrink-0" />
            <span>{showOriginalLabel}</span>
          </>
        ) : (
          <>
            <Languages size={12} className="shrink-0" />
            <span>{hasTranslation ? translateLabel : queuedLabel}</span>
          </>
        )}
      </button>
    </div>
  );
}
