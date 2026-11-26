'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Award, Check, Copy, ExternalLink, Globe, Play } from 'lucide-react';
import type { Locale } from '@makaremi/shared';
import type { RagCitation } from '@/lib/rag/research-assistant';

interface CitationCardProps {
  citation: RagCitation;
  index: number;
  locale?: Locale;
}

type AcademicFormat = 'apa' | 'chicago' | 'bibtex';

function buildAcademicReference(citation: RagCitation, fmt: AcademicFormat): string {
  const year = '2026';
  const tsPart = citation.timestampLabel ? ` [${citation.timestampLabel}]` : '';
  const safeKey = citation.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 28) || 'makaremi';
  if (fmt === 'bibtex') {
    const entryType = citation.documentType === 'book' ? 'book' : 'misc';
    return `@${entryType}{makaremi_${safeKey},\n  author = {Makaremi, Hassan},\n  title = {${citation.title}${tsPart}},\n  year = {${year}},\n  url = {${citation.url}},\n  note = {SHA-256: ${citation.content_sha256}}\n}`;
  }
  if (fmt === 'chicago') {
    return `Makaremi, Hassan. "${citation.title}${tsPart}." Dr. Hassan Makaremi Official Digital Archive. Accessed ${year}. ${citation.url} (SHA-256: ${citation.content_sha256.slice(0, 16)}).`;
  }
  return `Makaremi, H. (${year}). ${citation.title}${tsPart}. Dr. Hassan Makaremi Official Archive. ${citation.url}`;
}

export const CitationCard: React.FC<CitationCardProps> = ({ citation, index, locale = 'fa' }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);

  const copyText = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const pillarColorMap: Record<string, string> = {
    psychoanalysis: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    art_calligraphy: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
    cultural_strategy: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400',
    human_rights_dadkhahi: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400',
  };

  const pillarLabelMap: Record<string, string> = {
    psychoanalysis: tx('روان‌کاوی', 'Psychanalyse', 'Psychoanalysis'),
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
    page: tx('صفحه مرجع', 'Page de référence', 'Reference Page'),
    artwork: tx('اثر خوشنویسی', 'Œuvre calligraphique', 'Calligraphy Artwork'),
    commerce: tx('آتلیه و فروشگاه', 'Atelier & Éditions', 'Paris Atelier'),
    glossary: tx('واژه‌نامه', 'Glossaire', 'Glossary'),
    golden_qa: tx('پاسخ مصوب استاد', 'Réponse certifiée', 'Verified Answer'),
    training_note: tx('جزوه آموزشی', 'Note de séminaire', 'Seminar Note'),
  };

  const pillarBadgeClass =
    pillarColorMap[citation.pillar] || 'border-zinc-500/30 bg-zinc-500/10 text-zinc-500';
  const targetHref = citation.relativeUrl || citation.url;
  const isInternal = targetHref.startsWith('/');

  return (
    <div
      id={`citation-${index + 1}`}
      className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-4 text-xs transition-all hover:border-amber-500/40 hover:shadow-md"
    >
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
          {citation.isGoldenQa && (
            <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <Award size={11} />
              <span>{tx('مصوب استاد', 'Certifié', 'Verified')}</span>
            </span>
          )}
          {citation.isCrossLingual && citation.sourceLocale && (
            <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25">
              <Globe size={10} />
              <span>{tx(`متن اصلی: ${citation.sourceLocale.toUpperCase()}`, `Source : ${citation.sourceLocale.toUpperCase()}`, `Source: ${citation.sourceLocale.toUpperCase()}`)}</span>
            </span>
          )}
          {citation.timestampLabel && (
            <span
              dir="ltr"
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono font-bold bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/25"
            >
              <Play size={9} />
              <span>{citation.timestampLabel}</span>
            </span>
          )}
        </div>

        {isInternal ? (
          <Link
            href={targetHref}
            className="text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 font-bold"
          >
            <span>
              {citation.timestampLabel
                ? tx(`پخش در ${citation.timestampLabel}`, `Voir à ${citation.timestampLabel}`, `Watch at ${citation.timestampLabel}`)
                : tx('مشاهده سند', 'Voir la source', 'View Source')}
            </span>
            <ExternalLink size={11} />
          </Link>
        ) : (
          <a
            href={targetHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 font-bold"
          >
            <span>
              {citation.timestampLabel
                ? tx(`پخش در ${citation.timestampLabel}`, `Voir à ${citation.timestampLabel}`, `Watch at ${citation.timestampLabel}`)
                : tx('مشاهده سند', 'Voir la source', 'View Source')}
            </span>
            <ExternalLink size={11} />
          </a>
        )}
      </div>

      <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-1.5 line-clamp-1">
        {citation.title}
      </h4>

      <p className="text-zinc-600 dark:text-zinc-300 line-clamp-3 leading-relaxed mb-3 italic">
        «{citation.quote}»
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-500">
        <div className="flex items-center gap-1 font-mono" dir="ltr">
          <span className="text-zinc-400">SHA-256:</span>
          <span>
            {citation.content_sha256.slice(0, 10)}...{citation.content_sha256.slice(-6)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {(['apa', 'chicago', 'bibtex'] as AcademicFormat[]).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => copyText(fmt, buildAcademicReference(citation, fmt))}
              className="uppercase font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500/15 hover:text-amber-700 dark:hover:text-amber-300 transition-colors cursor-pointer"
              title={tx(`کپی ارجاع ${fmt.toUpperCase()}`, `Copier ${fmt.toUpperCase()}`, `Copy ${fmt.toUpperCase()} citation`)}
            >
              {copiedKey === fmt ? tx('کپی شد', 'Copié', 'Copied') : fmt}
            </button>
          ))}
          <button
            onClick={() => copyText('sha', citation.content_sha256)}
            type="button"
            className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            title={tx('کپی کردن هش کامل سند', 'Copier l’empreinte complète', 'Copy full SHA-256 digest')}
          >
            {copiedKey === 'sha' ? <Check size={11} /> : <Copy size={11} />}
            <span>{copiedKey === 'sha' ? tx('کپی شد', 'Copié', 'Copied') : tx('هش', 'Hash', 'Hash')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
