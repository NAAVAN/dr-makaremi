'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';
import type { CommerceCatalogItem, Locale } from '@makaremi/shared';
import { useAcquisitionCart } from './CartProvider';
import { formatEur } from '@/lib/commerce/rules';

interface InlineWorkAcquisitionBarProps {
  products: CommerceCatalogItem[];
  locale: Locale;
  heading?: string;
  compact?: boolean;
}

export function InlineWorkAcquisitionBar({
  products,
  locale,
  heading,
  compact = false,
}: InlineWorkAcquisitionBarProps) {
  const { addItem, items } = useAcquisitionCart();
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);

  if (!products || products.length === 0) return null;

  const availableProducts = products.filter((p) => p.availability !== 'not_for_sale');
  if (availableProducts.length === 0) return null;

  const kindLabel = (kind: CommerceCatalogItem['kind']) => {
    switch (kind) {
      case 'original_artwork':
        return tx('اثر اصل یکتا (گواهی Décret Marcus)', 'Œuvre originale 1/1 (Décret Marcus)', 'Unique Original (Décret Marcus)');
      case 'fine_art_print':
        return tx('چاپ موزه‌ای شماره‌دار (Hahnemühle)', 'Tirage Fine Art numéroté', 'Numbered Fine Art Print');
      case 'book_physical_signed':
        return tx('نسخه چاپی امضاشده استاد (ارسال از پاریس)', 'Exemplaire dédicacé (Paris)', 'Author-Signed Copy (Paris)');
      case 'book_digital_ebook':
        return tx('نسخه دیجیتال رسمی (تحویل فوری)', 'Édition numérique (instantanée)', 'Official Digital Edition');
      case 'commission_inquiry':
        return tx('سفارش خوشنویسی اختصاصی', 'Commande sur mesure', 'Bespoke Commission');
      case 'patronage_edition':
        return tx('حمایت از آرشیو مستقل', 'Mécénat Archives', 'Archive Patronage');
    }
  };

  return (
    <div
      className={`rounded-2xl bg-[var(--surface-card)] border border-amber-500/35 ${
        compact ? 'p-4 space-y-3' : 'p-5 space-y-4'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-amber-600 shrink-0" />
          <span className="text-xs sm:text-sm font-black text-[var(--foreground)]">
            {heading ||
              tx(
                'تملک مستقیم از آتلیه و انتشارات پاریس',
                'Acquisition directe — Atelier & Éditions Paris',
                'Direct Acquisition — Paris Studio & Editions'
              )}
          </span>
        </div>
        <Link
          href={`/${locale}/shop`}
          className="text-[11px] font-bold text-[var(--primary)] hover:underline"
        >
          {tx('مشاهده کل فروشگاه ←', 'Voir toute la boutique →', 'View full shop →')}
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {availableProducts.map((product) => {
          const inCart = items.some((e) => e.product.sku === product.sku);
          const isSold = product.availability === 'sold';
          const isReserved = product.availability === 'reserved';
          const canBuy = product.availability === 'available' && product.priceEurCents !== null;

          return (
            <div
              key={product.sku}
              className="p-3.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] flex flex-col justify-between gap-3"
            >
              <div className="space-y-1">
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300">
                  {kindLabel(product.kind)}
                </span>
                <p className="text-xs font-bold text-[var(--foreground)] leading-snug">
                  {product.title[locale]}
                </p>
                {product.physicalSpecs?.dimensionsCm && (
                  <p className="text-[11px] font-mono text-[var(--foreground-muted)]">
                    {product.physicalSpecs.dimensionsCm}
                    {product.editionSize && product.editionSize > 1
                      ? ` • ${product.editionRemaining ?? product.editionSize}/${product.editionSize}`
                      : ''}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <span className="text-sm font-black font-mono tabular-nums text-[var(--foreground)]">
                  {formatEur(product.priceEurCents, locale)}
                </span>

                {canBuy ? (
                  <button
                    type="button"
                    onClick={() => addItem(product)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      inCart
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-95'
                    }`}
                  >
                    {inCart ? <CheckCircle2 size={13} /> : <ShoppingBag size={13} />}
                    <span>
                      {inCart
                        ? tx('در سبد تملک', 'Dans le panier', 'In Cart')
                        : product.kind === 'original_artwork'
                          ? tx('تملک اثر', 'Acquérir', 'Acquire')
                          : tx('افزودن به سبد', 'Ajouter', 'Add to Cart')}
                    </span>
                  </button>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[11px] font-bold text-[var(--foreground-muted)]">
                    {isSold
                      ? tx('واگذار شده', 'Acquis / Vendu', 'Acquired')
                      : isReserved
                        ? tx('رزرو موقت', 'Réservé', 'Reserved')
                        : tx('استعلام از آتلیه', 'Sur demande', 'Inquire')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-[var(--foreground-muted)]">
        <span className="inline-flex items-center gap-1">
          <ShieldCheck size={12} className="text-emerald-600" />
          {tx('گواهی اصالت Ed25519 • پرداخت Stripe CB / Alma / SEPA', 'Certificat Ed25519 • Stripe CB / Alma / SEPA', 'Ed25519 Certificate • Stripe CB / Alma / SEPA')}
        </span>
      </div>
    </div>
  );
}
