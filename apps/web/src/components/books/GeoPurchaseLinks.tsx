'use client';

import React, { useState } from 'react';
import { ShoppingCart, Download, ExternalLink, Globe, ShieldCheck } from 'lucide-react';
import { z } from 'zod';
import type { BookGeoLinks, Locale } from '@makaremi/shared';

interface GeoPurchaseLinksProps {
  geoLinks?: BookGeoLinks;
  locale: Locale;
}

const SafeUrlSchema = z
  .string()
  .url()
  .refine((u) => u.startsWith('https://'), 'Only HTTPS protocol is permitted');

export function GeoPurchaseLinks({ geoLinks, locale }: GeoPurchaseLinksProps) {
  const [region, setRegion] = useState<'iran' | 'international'>('iran');

  const isFa = locale === 'fa';
  const iranLinks = geoLinks?.iran || [];
  const intlLinks = geoLinks?.international || [];

  const sanitizeUrl = (rawUrl: string): string | null => {
    const res = SafeUrlSchema.safeParse(rawUrl);
    return res.success ? res.data : null;
  };

  const activeLinks = region === 'iran' ? iranLinks : intlLinks;

  return (
    <div className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="text-[var(--primary)]" size={18} />
          <h3 className="text-sm font-bold text-[var(--foreground)]">
            {isFa ? 'تهیه و دریافت نسخه کتاب' : 'Acquisition & Purchase'}
          </h3>
        </div>

        {/* Region Selector */}
        <div className="flex items-center gap-1 bg-[var(--surface-sunken)] p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setRegion('iran')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              region === 'iran'
                ? 'bg-[var(--surface-card)] text-[var(--foreground)] shadow-xs'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {isFa ? 'داخل ایران' : 'Iran'}
          </button>
          <button
            type="button"
            onClick={() => setRegion('international')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              region === 'international'
                ? 'bg-[var(--surface-card)] text-[var(--foreground)] shadow-xs'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {isFa ? 'خارج از ایران (بین‌المللی)' : 'International'}
          </button>
        </div>
      </div>

      <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
        {region === 'iran'
          ? (isFa ? 'پلتفرم‌های داخلی، نسخه الکترونیکی طاقچه و لینک‌های دانلود امن مستقیم برای دسترسی پایدار:' : 'Plateformes nationales et téléchargement direct résilient :')
          : (isFa ? 'خرید نسخه فیزیکی و بین‌المللی از آمازون و ناشران اروپایی:' : 'Achat international via Amazon et éditeurs européens :')}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {activeLinks.map((link, idx) => {
          const safeUrl = sanitizeUrl(link.url);
          if (!safeUrl) return null;

          const isDownload = link.label.includes('دانلود') || link.label.includes('دریافت');

          return (
            <a
              key={idx}
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] hover:bg-[var(--surface-overlay)] hover:border-[var(--primary)] transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[var(--surface-card)] text-[var(--primary)]">
                  {isDownload ? <Download size={16} /> : <ExternalLink size={16} />}
                </div>
                <div>
                  <span className="block font-bold text-xs text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                    {link.label}
                  </span>
                  <span className="text-[10px] text-[var(--foreground-muted)] font-mono">
                    {link.platform}
                  </span>
                </div>
              </div>

              <ShieldCheck size={14} className="text-emerald-500 opacity-60 group-hover:opacity-100" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
