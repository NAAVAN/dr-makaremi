'use client';

import React, { useState } from 'react';
import { BookOpen, Columns2, Languages, ShieldCheck } from 'lucide-react';
import type { Locale } from '@makaremi/shared';
import { getLanguageDir, getLanguageLabel } from '@/lib/work-language';
import type { StoredWorkTranslation } from '@/lib/translations-store';

export type BilingualViewMode = 'original' | 'translated' | 'side-by-side';

interface BilingualWorkReaderProps {
  originalLang: Locale;
  siteLocale: Locale;
  translated: StoredWorkTranslation | null;
  /** The 100% authentic untouched original work (rendered inside native dir/lang wrapper) */
  originalContent: React.ReactNode;
  /** Optional custom pre-rendered translated node (falls back to clean paragraphs/verses) */
  translatedContent?: React.ReactNode;
}

/**
 * Gold-Standard 3-Mode Scholarly Bilingual Reader (Gallimard / Loeb Classical Library Pattern).
 * - Server-Component safe (accepts ReactNode slots, zero function props).
 * - If `originalLang === siteLocale`: renders `originalContent` directly with ZERO extra chrome.
 * - If `originalLang !== siteLocale`: defaults strictly to the untouched original work while
 *   offering crisp switching between Original, Site-Language Translation, and Side-by-Side
 *   parallel reading (with proper RTL/LTR isolation per column).
 */
export function BilingualWorkReader({
  originalLang,
  siteLocale,
  translated,
  originalContent,
  translatedContent,
}: BilingualWorkReaderProps) {
  const [mode, setMode] = useState<BilingualViewMode>('original');

  // Native match: zero extra UI needed — show authentic original cleanly
  if (originalLang === siteLocale) {
    return <>{originalContent}</>;
  }

  const isFa = siteLocale === 'fa';
  const isFr = siteLocale === 'fr';
  const origName = getLanguageLabel(originalLang, siteLocale);
  const targetName = getLanguageLabel(siteLocale, siteLocale);
  const origDir = getLanguageDir(originalLang);
  const targetDir = getLanguageDir(siteLocale);
  const hasTranslation = Boolean(translated);

  const labels = {
    provenance: isFa
      ? `زبان اصلی اثر: ${origName}`
      : isFr
        ? `Langue originale : ${origName}`
        : `Original language: ${origName}`,
    modeOriginal: isFa
      ? `اصل اثر (${origName})`
      : isFr
        ? `Texte original (${origName})`
        : `Original (${origName})`,
    modeTranslated: isFa
      ? `ترجمه به ${targetName}`
      : isFr
        ? `Traduction (${targetName})`
        : `${targetName} Translation`,
    modeParallel: isFa
      ? 'مطالعه دوزبانه روبه‌رو'
      : isFr
        ? 'Lecture bilingue côte à côte'
        : 'Side-by-Side Bilingual',
    colophon: isFa
      ? 'ترجمه خوانشی با پایبندی به اصطلاح‌نامه لکانی دکتر حسن مکارمی — متن اصلی همواره مرجع معتبر است.'
      : isFr
        ? 'Traduction de lecture fidèle au glossaire lacanien du Dr Hassan Makaremi — le texte original demeure la référence.'
        : 'Scholarly reading translation aligned with Dr Hassan Makaremi’s controlled Lacanian glossary; the original text remains authoritative.',
    queuedNotice: isFa
      ? `ترجمه کامل این اثر به ${targetName} در برنامه ترجمه مرحله‌ای آرشیو (موج‌های ۳ تا ۵) ثبت شده است و به محض تأیید واژگانی، مستقیماً در همین کادر فعال خواهد شد. متن اصلی اثر در پایین بدون هیچ تغییری در دسترس شماست.`
      : isFr
        ? `La traduction intégrale en ${targetName} de cette œuvre est planifiée dans le programme d’édition trilingue (vagues 3–5). Le texte original authentique reste intégralement lisible ci-dessous.`
        : `The full British English (en-GB) scholarly translation of this work is scheduled in our trilingual editorial pipeline (Waves 3–5). The untouched original text remains available below.`,
  };

  const renderDefaultTranslated = (tr: StoredWorkTranslation) => (
    <div dir={targetDir} lang={siteLocale === 'en' ? 'en-GB' : siteLocale} className="space-y-5">
      {tr.title && (
        <h2 className="font-display text-xl sm:text-2xl font-black text-[var(--foreground)]">
          {tr.title}
        </h2>
      )}
      {tr.summary && (
        <p className="p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-sm sm:text-base italic text-[var(--foreground)] leading-relaxed">
          {tr.summary}
        </p>
      )}
      {tr.verses && tr.verses.length > 0 && (
        <div className="space-y-4 py-2">
          {tr.verses.map((v) => (
            <div
              key={v.line_index}
              className="p-3.5 rounded-xl bg-[var(--surface-artifact)] border border-[var(--border-subtle)] space-y-1 font-serif text-base text-[var(--foreground)] leading-loose"
            >
              <p>{v.hemistich_a}</p>
              {v.hemistich_b && <p className="text-[var(--foreground-muted)]">{v.hemistich_b}</p>}
            </div>
          ))}
        </div>
      )}
      {tr.body_markdown && (
        <div className="font-serif text-base sm:text-lg leading-loose text-[var(--foreground)] space-y-4">
          {tr.body_markdown
            .split(/\n{2,}/)
            .filter(Boolean)
            .map((para, idx) => (
              <p key={idx}>{para.trim()}</p>
            ))}
        </div>
      )}
    </div>
  );

  return (
    <div
      data-bilingual-reader="true"
      data-original-lang={originalLang}
      className="space-y-6"
    >
      {/* 3-Mode Scholarly Reading Control Bar */}
      <div
        role="region"
        aria-label={isFa ? 'انتخاب زبان خوانش اثر' : isFr ? 'Choix de lecture bilingue' : 'Bilingual Reading Controls'}
        className="rounded-2xl bg-[var(--surface-artifact)] border border-[var(--border-artifact)] p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-[var(--shadow-sm)]"
      >
        <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
          <ShieldCheck size={15} className="text-[var(--primary)] shrink-0" />
          <span className="font-semibold text-[var(--foreground)]">{labels.provenance}</span>
        </div>

        <div
          role="tablist"
          aria-label={isFa ? 'حالت‌های نمایش متن' : isFr ? 'Modes d’affichage' : 'Reading Modes'}
          className="flex flex-wrap items-center gap-1.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'original'}
            onClick={() => setMode('original')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              mode === 'original'
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] shadow-xs'
                : 'bg-[var(--surface-card)] text-[var(--foreground)] border-[var(--border-subtle)] hover:border-[var(--primary)]'
            }`}
          >
            <BookOpen size={13} />
            <span>{labels.modeOriginal}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'translated'}
            onClick={() => setMode('translated')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
              mode === 'translated'
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] shadow-xs'
                : 'bg-[var(--surface-card)] text-[var(--foreground)] border-[var(--border-subtle)] hover:border-[var(--primary)]'
            }`}
          >
            <Languages size={13} />
            <span>{labels.modeTranslated}</span>
          </button>

          {hasTranslation && (
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'side-by-side'}
              onClick={() => setMode('side-by-side')}
              className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                mode === 'side-by-side'
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] shadow-xs'
                  : 'bg-[var(--surface-card)] text-[var(--foreground)] border-[var(--border-subtle)] hover:border-[var(--primary)]'
              }`}
            >
              <Columns2 size={13} />
              <span>{labels.modeParallel}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode 1: Untouched Original Work (Default — Native RTL/LTR Direction!) */}
      {mode === 'original' && (
        <div dir={origDir} lang={originalLang === 'en' ? 'en-GB' : originalLang}>
          {originalContent}
        </div>
      )}

      {/* Mode 2: Translated Reading View */}
      {mode === 'translated' && (
        <div className="space-y-4">
          {translated ? (
            <>
              <div className="px-4 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs text-[var(--foreground-muted)]">
                {labels.colophon}
              </div>
              {translatedContent || renderDefaultTranslated(translated)}
            </>
          ) : (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] text-xs sm:text-sm text-[var(--foreground)] leading-relaxed">
                {labels.queuedNotice}
              </div>
              <div dir={origDir} lang={originalLang === 'en' ? 'en-GB' : originalLang}>
                {originalContent}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Side-by-Side Parallel Bilingual Reading (Loeb / Gallimard Standard) */}
      {mode === 'side-by-side' && translated && (
        <div className="space-y-4">
          <div className="px-4 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs text-[var(--foreground-muted)]">
            {labels.colophon}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div
              dir={origDir}
              lang={originalLang === 'en' ? 'en-GB' : originalLang}
              className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-6 space-y-4"
            >
              <div className="pb-2 border-b border-[var(--border-subtle)] text-xs font-mono font-bold text-[var(--primary)]">
                {labels.modeOriginal}
              </div>
              {originalContent}
            </div>

            <div
              dir={targetDir}
              lang={siteLocale === 'en' ? 'en-GB' : siteLocale}
              className="rounded-2xl bg-[var(--surface-artifact)] border border-[var(--border-artifact)] p-6 space-y-4"
            >
              <div className="pb-2 border-b border-[var(--border-subtle)] text-xs font-mono font-bold text-[var(--accent-gold)]">
                {labels.modeTranslated}
              </div>
              {translatedContent || renderDefaultTranslated(translated)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
