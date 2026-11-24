'use client';

import React, { useState } from 'react';
import type { Locale } from '@makaremi/shared';
import type { RagCitation } from '@/lib/rag/research-assistant';

interface CitationCardProps {
  citation: RagCitation;
  index: number;
  locale?: Locale;
}

export const CitationCard: React.FC<CitationCardProps> = ({ citation, index, locale = 'fa' }) => {
  const [copied, setCopied] = useState(false);

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);

  const handleCopyHash = () => {
    navigator.clipboard.writeText(citation.content_sha256);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pillarColorMap: Record<string, string> = {
    psychoanalysis: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    art_calligraphy: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
    cultural_strategy: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400',
    human_rights_dadkhahi: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400',
  };

  const pillarLabelMap: Record<string, string> = {
    psychoanalysis: tx('روانکاوی', 'Psychanalyse', 'Psychoanalysis'),
    art_calligraphy: tx('هنر و خوشنویسی', 'Art', 'Art'),
    cultural_strategy: tx('راهبرد فرهنگی', 'Stratégie', 'Strategy'),
    human_rights_dadkhahi: tx('دادخواهی', 'Droits humains', 'Human Rights'),
  };

  const docTypeLabelMap: Record<string, string> = {
    article: tx('مقاله', 'Article', 'Article'),
    book: tx('کتاب', 'Livre', 'Book'),
    speech: tx('سخنرانی / ویدیو', 'Conférence / Vidéo', 'Video Lecture'),
    poem: tx('شعر', 'Poème', 'Poem'),
    exhibition: tx('نمایشگاه', 'Exposition', 'Exhibition'),
    glossary: tx('واژه‌نامه', 'Glossaire', 'Glossary'),
  };

  const pillarBadgeClass =
    pillarColorMap[citation.pillar] || 'border-zinc-500/30 bg-zinc-500/10 text-zinc-500';

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm p-4 text-xs transition-all hover:border-amber-500/40 hover:shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 font-mono text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
            {index + 1}
          </span>
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold border ${pillarBadgeClass}`}>
            {pillarLabelMap[citation.pillar] || citation.pillar}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400 text-[10px]">
            {docTypeLabelMap[citation.documentType] || citation.documentType}
          </span>
          {citation.timestampLabel && (
            <span
              dir="ltr"
              className="rounded px-1.5 py-0.5 text-[10px] font-mono font-bold bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/25"
            >
              ▶ {citation.timestampLabel}
            </span>
          )}
        </div>
        <a
          href={citation.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 font-bold"
        >
          <span>
            {citation.timestampLabel
              ? tx(`پخش در ${citation.timestampLabel}`, `Voir à ${citation.timestampLabel}`, `Watch at ${citation.timestampLabel}`)
              : tx('مشاهده سند', 'Voir la source', 'View Source')}
          </span>
          <span className="text-[10px]">↗</span>
        </a>
      </div>

      <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-1.5 line-clamp-1">
        {citation.title}
      </h4>

      <p className="text-zinc-600 dark:text-zinc-300 line-clamp-3 leading-relaxed mb-3 italic">
        «{citation.quote}»
      </p>

      <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-500">
        <div className="flex items-center gap-1 font-mono" dir="ltr">
          <span className="text-zinc-400">SHA-256:</span>
          <span>
            {citation.content_sha256.slice(0, 10)}...{citation.content_sha256.slice(-6)}
          </span>
        </div>
        <button
          onClick={handleCopyHash}
          type="button"
          className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          title={tx('کپی کردن هش کامل سند', 'Copier l’empreinte complète', 'Copy full SHA-256 digest')}
        >
          {copied ? tx('✓ کپی شد', '✓ Copié', '✓ Copied') : tx('کپی هش', 'Copier', 'Copy hash')}
        </button>
      </div>
    </div>
  );
};
