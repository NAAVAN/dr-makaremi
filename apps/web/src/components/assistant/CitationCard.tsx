'use client';

import React, { useState } from 'react';
import type { RagCitation } from '@/lib/rag/research-assistant';

interface CitationCardProps {
  citation: RagCitation;
  index: number;
}

export const CitationCard: React.FC<CitationCardProps> = ({ citation, index }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyHash = () => {
    navigator.clipboard.writeText(citation.content_sha256);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pillarColorMap: Record<string, string> = {
    psychoanalysis: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    art_calligraphy: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    cultural_strategy: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    human_rights_dadkhahi: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  };

  const pillarBadgeClass = pillarColorMap[citation.pillar] || 'border-zinc-500/30 bg-zinc-500/10 text-zinc-400';

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm p-4 text-xs transition-all hover:border-amber-500/40 hover:shadow-lg">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 font-mono text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
            {index + 1}
          </span>
          <span className={`rounded px-1.5 py-0.5 text-[10px] uppercase font-semibold border ${pillarBadgeClass}`}>
            {citation.pillar}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400 text-[10px]">
            {citation.documentType}
          </span>
        </div>
        <a
          href={citation.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium"
        >
          مشاهده سند
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
        <div className="flex items-center gap-1 font-mono">
          <span className="text-zinc-400">SHA-256:</span>
          <span>{citation.content_sha256.slice(0, 10)}...{citation.content_sha256.slice(-6)}</span>
        </div>
        <button
          onClick={handleCopyHash}
          type="button"
          className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          title="کپی کردن هش کامل سند"
        >
          {copied ? '✓ کپی شد' : 'کپی هش'}
        </button>
      </div>
    </div>
  );
};
