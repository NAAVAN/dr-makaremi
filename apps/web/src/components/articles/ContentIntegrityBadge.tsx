'use client';

import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, Eye } from 'lucide-react';
import type { Locale } from '@makaremi/shared';
import { IntegrityAuditModal } from './IntegrityAuditModal';

interface ContentIntegrityBadgeProps {
  hash: string;
  locale: Locale;
  slug?: string;
}

export function ContentIntegrityBadge({ hash, locale, slug }: ContentIntegrityBadgeProps) {
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const copyHash = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isFa = locale === 'fa';

  return (
    <>
      <div data-verified-signature="ed25519" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-800 dark:text-emerald-300">
        <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="font-medium">
          {isFa ? 'امضای دیجیتال تغییرناپذیر:' : 'Empreinte SHA-256 :'}
        </span>
        <code className="font-mono text-[11px] opacity-90">{hash.slice(0, 10)}...{hash.slice(-6)}</code>
        <button
          type="button"
          onClick={copyHash}
          aria-label="کپی هش اعتبارسنجی"
          className="p-1 hover:bg-emerald-500/20 rounded transition-colors cursor-pointer"
          title="کپی هش کامل SHA-256"
        >
          {copied ? <Check size={12} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={12} />}
        </button>
        {slug && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="ms-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium transition-colors cursor-pointer"
            title="بررسی ریاضی امضای Ed25519"
          >
            <Eye size={12} />
            <span>{isFa ? 'بررسی امضا' : 'Vérifier'}</span>
          </button>
        )}
      </div>

      {slug && (
        <IntegrityAuditModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          slug={slug}
          locale={locale}
        />
      )}
    </>
  );
}
