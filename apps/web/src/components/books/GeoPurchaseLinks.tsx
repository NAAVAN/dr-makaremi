'use client';

import React, { useState } from 'react';
import { ShoppingCart, Download, ExternalLink, ShieldCheck } from 'lucide-react';
import { z } from 'zod';
import type { BookGeoLinks, CommerceCatalogItem, Locale } from '@makaremi/shared';
import { InlineWorkAcquisitionBar } from '@/components/commerce/InlineWorkAcquisitionBar';

interface GeoPurchaseLinksProps {
  geoLinks?: BookGeoLinks;
  directProducts?: CommerceCatalogItem[];
  locale: Locale;
}

const SafeUrlSchema = z
  .string()
  .url()
  .refine((u) => u.startsWith('https://'), 'Only HTTPS protocol is permitted');

export function GeoPurchaseLinks({ geoLinks, directProducts = [], locale }: GeoPurchaseLinksProps) {
  const iranLinks = geoLinks?.iran || [];
  const intlLinks = geoLinks?.international || [];
  const defaultRegion: 'iran' | 'international' =
    locale !== 'fa' && intlLinks.length > 0
      ? 'international'
      : iranLinks.length > 0
        ? 'iran'
        : 'international';

  const [region, setRegion] = useState<'iran' | 'international'>(defaultRegion);

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);

  const sanitizeUrl = (rawUrl: string): string | null => {
    const res = SafeUrlSchema.safeParse(rawUrl);
    return res.success ? res.data : null;
  };

  const activeLinks = region === 'iran' ? iranLinks : intlLinks;
  const hasAnyExternal = iranLinks.length > 0 || intlLinks.length > 0;

  return (
    <div className="space-y-4">
      {/* Direct Paris Atelier & Digital Acquisition (Stripe CB / Alma / SEPA) */}
      {directProducts.length > 0 && (
        <InlineWorkAcquisitionBar
          products={directProducts}
          locale={locale}
          heading={tx(
            'خرید مستقیم نسخه امضاشده یا دیجیتال از انتشارات استاد (پاریس)',
            'Commande directe (Exemplaire dédicacé / eBook officiel)',
            'Order Direct (Author-Signed Copy / Official eBook)'
          )}
          compact
        />
      )}

      {/* Publisher & Regional Bookstore Links (Iran Domestic + External Publishers) */}
      {hasAnyExternal && (
        <div className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="text-[var(--primary)]" size={17} />
              <h3 className="text-sm font-bold text-[var(--foreground)]">
                {tx('تهیه از ناشران رسمی و کتاب‌فروشی‌ها', 'Éditeurs & Librairies partenaires', 'Official Publishers & Bookstores')}
              </h3>
            </div>

            <div className="flex items-center gap-1 bg-[var(--surface-sunken)] p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setRegion('iran')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${region === 'iran'
                    ? 'bg-[var(--surface-card)] text-[var(--foreground)] shadow-xs'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  }`}
              >
                {tx('داخل ایران / آرشیو', 'Iran / Archives', 'Iran / Archive')}
              </button>
              <button
                type="button"
                onClick={() => setRegion('international')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${region === 'international'
                    ? 'bg-[var(--surface-card)] text-[var(--foreground)] shadow-xs'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                  }`}
              >
                {tx('ناشران اروپایی / بین‌المللی', 'International', 'International')}
              </button>
            </div>
          </div>

          <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
            {region === 'iran'
              ? tx(
                'پیوند ناشران و کتاب‌فروشی‌های داخل ایران و نسخه‌های آرشیوی در دسترس:',
                'Librairies nationales et liens d’archives disponibles :',
                'Domestic Iranian publishers/bookstores and archival links:'
              )
              : tx(
                'خرید نسخه چاپی از ناشران اروپایی (L’Harmattan، H&S Media و آمازون):',
                'Commande auprès des éditeurs européens (L’Harmattan, H&S Media, Amazon) :',
                'Order print editions from European publishers and Amazon:'
              )}
          </p>

          {activeLinks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {activeLinks.map((link, idx) => {
                const safeUrl = sanitizeUrl(link.url);
                if (!safeUrl) return null;

                const isDownload =
                  link.label.includes('دانلود') ||
                  link.label.includes('دریافت') ||
                  link.label.toLowerCase().includes('télécharger');

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
          ) : (
            <p className="text-xs text-[var(--foreground-muted)] italic">
              {region === 'iran'
                ? tx('این عنوان توسط ناشر اروپایی منتشر شده است؛ تب «ناشران اروپایی / بین‌المللی» یا بخش خرید مستقیم بالا را مشاهده کنید.', 'Cet ouvrage est publié en Europe ; consultez l’onglet International ou la commande directe ci-dessus.', 'Published in Europe; please check the International tab or Direct Order above.')
                : tx('برای این کتاب، نسخه مستقیم یا ناشر داخلی در بخش بالا و تب دیگر در دسترس است.', 'Consultez la commande directe ci-dessus ou l’autre onglet.', 'Check Direct Order above or the alternate regional tab.')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
