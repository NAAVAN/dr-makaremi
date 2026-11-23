import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Sparkles, ShieldCheck, Scale, RotateCcw } from 'lucide-react';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { buildTrilingualMetadata } from '@/lib/seo-helpers';
import { getCommerceCatalog, getCommerceLegalConfig } from '@/lib/commerce/store';
import { ShopCatalogClient } from '@/components/commerce/ShopCatalogClient';
import { JsonLdGraph } from '@/components/seo/JsonLdGraph';
import { buildBreadcrumbNode, buildFullGraph } from '@/lib/schema-org';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  return buildTrilingualMetadata({
    locale,
    path: '/shop',
    title: isFa
      ? 'فروشگاه و گالری تملک آثار (تابلوهای نقاشی‌خط، چاپ موزه‌ای و کتاب‌ها) | دکتر حسن مکارمی'
      : isFr
        ? 'Boutique & Éditions — Œuvres Originales, Tirages Fine Art & Livres | Dr Hassan Makaremi'
        : 'Shop & Editions — Original Calligraphy, Fine Art Prints & Signed Books | Dr. Hassan Makaremi',
    description: isFa
      ? 'تملک مستقیم تابلوهای اصل نقاشی‌خط با گواهی اصالت Décret Marcus و Ed25519، چاپ‌های موزه‌ای شماره‌دار Hahnemühle، و کتاب‌های امضاشده و دیجیتال از آتلیه پاریس.'
      : isFr
        ? 'Acquérez directement depuis l’atelier de Paris les calligraphies originales (certifiées Décret Marcus + Ed25519), tirages Fine Art Hahnemühle et livres dédicacés.'
        : 'Acquire original calligraphy artworks (Décret Marcus + Ed25519 certified), numbered Hahnemühle Fine Art prints, and signed/digital books directly from Dr. Makaremi’s Paris studio.',
    includeMarkdownTwin: false,
  });
}

export default async function ShopPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  if (!isValidLocale(locale)) notFound();

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);

  const [products, legalConfig] = await Promise.all([
    getCommerceCatalog(),
    getCommerceLegalConfig(),
  ]);

  const offerItems = products
    .filter((p) => p.availability === 'available' && p.priceEurCents !== null)
    .map((p) => ({
      '@type': 'Product',
      sku: p.sku,
      name: p.title[locale],
      description: p.subtitle?.[locale] || p.title[locale],
      image: p.imageUrl ? `https://makaremi.com${p.imageUrl}` : undefined,
      brand: { '@type': 'Person', name: 'Dr Hassan Makaremi' },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'EUR',
        price: ((p.priceEurCents || 0) / 100).toFixed(2),
        availability: 'https://schema.org/InStock',
        url: `https://makaremi.com/${locale}/shop`,
      },
    }));

  const jsonLd = buildFullGraph({
    locale,
    items: [
      buildBreadcrumbNode([
        { name: tx('خانه', 'Accueil', 'Home'), item: `https://makaremi.com/${locale}` },
        { name: tx('فروشگاه و تملک آثار', 'Boutique & Éditions', 'Shop & Editions'), item: `https://makaremi.com/${locale}/shop` },
      ]),
      ...offerItems.slice(0, 12),
    ],
  });

  return (
    <div className="space-y-10">
      <JsonLdGraph data={jsonLd} />

      {/* Museum-Boutique Header with STRICT SINGLE H1 */}
      <header className="space-y-4 border-b border-[var(--border-subtle)] pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-amber-700 dark:text-amber-400 font-bold">
            <Sparkles size={15} />
            <span>
              {tx(
                'آتلیه و انتشارات رسمی پاریس • تملک مستقیم آثار',
                'Atelier & Éditions Paris • Acquisition Directe',
                'Official Paris Studio & Editions • Direct Acquisition'
              )}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link
              href={`/${locale}/legal/cgv`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] font-bold hover:border-[var(--primary)]"
            >
              <Scale size={13} />
              <span>{tx('شرایط فروش (CGV)', 'CGV', 'Terms (CGV)')}</span>
            </Link>
            <Link
              href={`/${locale}/legal/retractation`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--surface-sunken)] border border-amber-500/35 text-amber-800 dark:text-amber-300 font-bold hover:border-amber-500"
            >
              <RotateCcw size={13} />
              <span>{tx('انصراف ۱۴ روزه', 'Renoncer au contrat ici', '14-Day Withdrawal')}</span>
            </Link>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
          {tx(
            'فروشگاه و گالری تملک آثار دکتر حسن مکارمی',
            'Boutique & Éditions — Dr Hassan Makaremi',
            'Shop & Collector Editions — Dr. Hassan Makaremi'
          )}
        </h1>

        <p className="text-sm text-[var(--foreground-muted)] max-w-3xl leading-relaxed">
          {tx(
            'تملک مستقیم تابلوهای نقاشی‌خط اصل (همراه با گواهی اصالت Décret Marcus و امضای رمزنگاری‌شده Ed25519)، چاپ‌های موزه‌ای شماره‌دار روی کاغذ پنبه‌ای Hahnemühle، و نسخه‌های چاپی امضاشده و دیجیتال کتاب‌ها از پاریس؛ منطبق با قوانین فروش آنلاین فرانسه و اتحادیه اروپا.',
            'Acquérez directement depuis Paris des calligraphies originales (certifiées Décret Marcus & Ed25519), des tirages Fine Art numérotés sur Hahnemühle, ainsi que les livres dédicacés et éditions numériques du Dr Hassan Makaremi.',
            'Directly acquire hand-executed original calligraphy works (Décret Marcus & Ed25519 certified), numbered Hahnemühle Fine Art prints, and author-signed or digital books from Dr. Hassan Makaremi’s Paris studio.'
          )}
        </p>

        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-[var(--foreground-muted)]">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-sunken)] border border-[var(--border-subtle)]">
            <ShieldCheck size={13} className="text-emerald-600" />
            {tx('Stripe France (CB / Visa / Alma)', 'Stripe France (CB / Visa / Alma)', 'Stripe France (CB / Visa / Alma)')}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-sunken)] border border-[var(--border-subtle)]">
            {tx('واریز SEPA بدون کارمزد برای آثار کلکسیونی', 'Virement SEPA 0 % pour les pièces de collection', '0% SEPA Wire for collector works')}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-sunken)] border border-[var(--border-subtle)] font-mono">
            {legalConfig.taxMode === 'franchise_en_base' ? legalConfig.franchiseMentionFr : 'TVA France & UE'}
          </span>
        </div>
      </header>

      <ShopCatalogClient products={products} legalConfig={legalConfig} locale={locale} />
    </div>
  );
}
