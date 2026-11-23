'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Search,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Palette,
  Award,
  HeartHandshake,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import type { CommerceCatalogItem, CommerceLegalConfig, Locale } from '@makaremi/shared';
import { useAcquisitionCart } from './CartProvider';
import { formatEur } from '@/lib/commerce/rules';

interface ShopCatalogClientProps {
  products: CommerceCatalogItem[];
  legalConfig: CommerceLegalConfig;
  locale: Locale;
}

type CategoryFilter = 'all' | 'original_artwork' | 'fine_art_print' | 'books' | 'special';

export function ShopCatalogClient({ products, legalConfig, locale }: ShopCatalogClientProps) {
  const { addItem, items, openDrawer, itemCount } = useAcquisitionCart();
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);

  const [category, setCategory] = useState<CategoryFilter>('all');
  const [query, setQuery] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (p.availability === 'not_for_sale') return false;
      if (onlyAvailable && p.availability !== 'available') return false;
      if (category === 'original_artwork' && p.kind !== 'original_artwork') return false;
      if (category === 'fine_art_print' && p.kind !== 'fine_art_print') return false;
      if (category === 'books' && p.kind !== 'book_physical_signed' && p.kind !== 'book_digital_ebook') return false;
      if (category === 'special' && p.kind !== 'commission_inquiry' && p.kind !== 'patronage_edition') return false;
      if (q) {
        const hay = `${p.sku} ${p.title.fa} ${p.title.fr} ${p.title.en} ${p.subtitle?.fa || ''} ${p.subtitle?.fr || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, category, query, onlyAvailable]);

  const counts = useMemo(() => {
    const visible = products.filter((p) => p.availability !== 'not_for_sale');
    return {
      all: visible.length,
      original: visible.filter((p) => p.kind === 'original_artwork').length,
      prints: visible.filter((p) => p.kind === 'fine_art_print').length,
      books: visible.filter((p) => p.kind === 'book_physical_signed' || p.kind === 'book_digital_ebook').length,
      special: visible.filter((p) => p.kind === 'commission_inquiry' || p.kind === 'patronage_edition').length,
    };
  }, [products]);

  const tabs: Array<{ id: CategoryFilter; label: string; count: number; icon: React.ComponentType<{ size?: number }> }> = [
    { id: 'all', label: tx('همه آثار', 'Tout voir', 'All Editions'), count: counts.all, icon: Sparkles },
    { id: 'original_artwork', label: tx('آثار اصل یکتا', 'Œuvres originales', 'Original Artworks'), count: counts.original, icon: Palette },
    { id: 'fine_art_print', label: tx('چاپ موزه‌ای شماره‌دار', 'Tirages Fine Art', 'Fine Art Prints'), count: counts.prints, icon: Award },
    { id: 'books', label: tx('کتاب‌ها (امضاشده و دیجیتال)', 'Livres & eBooks', 'Signed & Digital Books'), count: counts.books, icon: BookOpen },
    { id: 'special', label: tx('سفارش اختصاصی و حمایت', 'Commandes & Mécénat', 'Commissions & Patronage'), count: counts.special, icon: HeartHandshake },
  ];

  const getWorkDetailHref = (p: CommerceCatalogItem): string | null => {
    if (p.collection === 'artworks') return `/${locale}/gallery?series=${p.slug}#iiif-stage`;
    if (p.collection === 'books') return `/${locale}/books/${p.slug}`;
    if (p.collection === 'poems') return `/${locale}/poetry/poems/${p.slug}`;
    if (p.collection === 'videos') return `/${locale}/speeches/${p.slug}`;
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Filter & Search Toolbar */}
      <div className="rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = category === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategory(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    active
                      ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--primary-foreground)] shadow-sm'
                      : 'bg-[var(--surface-card)] border-[var(--border-subtle)] text-[var(--foreground)] hover:border-[var(--primary)]'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${active ? 'bg-white/20' : 'bg-[var(--surface-sunken)] text-[var(--foreground-muted)]'}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {itemCount > 0 && (
            <button
              type="button"
              onClick={openDrawer}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-sm cursor-pointer"
            >
              <ShoppingBag size={14} />
              <span>{tx(`مشاهده سبد تملک (${itemCount})`, `Voir le panier (${itemCount})`, `Open Cart (${itemCount})`)}</span>
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute top-1/2 -translate-y-1/2 start-3 text-[var(--foreground-muted)] pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tx('جستجوی عنوان تابلو، کتاب یا کد SKU...', 'Rechercher une œuvre, un livre ou SKU...', 'Search artwork, book or SKU...')}
              className="w-full ps-9 pe-3 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-bold text-[var(--foreground)] cursor-pointer">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
            />
            <span>{tx('فقط آثار موجود برای تملک', 'Uniquement disponibles', 'Available only')}</span>
          </label>
        </div>
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-center space-y-3">
          <p className="text-sm font-bold text-[var(--foreground)]">
            {tx('اثری مطابق فیلتر انتخابی یافت نشد.', 'Aucune œuvre ne correspond à ce filtre.', 'No works matched your filter.')}
          </p>
          <button
            type="button"
            onClick={() => {
              setCategory('all');
              setQuery('');
              setOnlyAvailable(false);
            }}
            className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold cursor-pointer"
          >
            {tx('نمایش کل کاتالوگ', 'Afficher tout le catalogue', 'Show full catalog')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => {
            const detailHref = getWorkDetailHref(p);
            const inCart = items.some((e) => e.product.sku === p.sku);
            const canBuy = p.availability === 'available' && p.priceEurCents !== null;
            const isOriginal = p.kind === 'original_artwork';
            const isPrint = p.kind === 'fine_art_print';
            const isHighTicket = (p.priceEurCents || 0) >= legalConfig.sepaRecommendedThresholdEurCents;

            return (
              <article
                key={p.sku}
                className="group rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--primary)] hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Visual Media Header */}
                  <div className="aspect-[16/11] w-full bg-[var(--surface-sunken)] relative overflow-hidden border-b border-[var(--border-subtle)]">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.title[locale]}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[var(--foreground-muted)] p-6 text-center">
                        {p.kind === 'patronage_edition' ? <HeartHandshake size={32} className="text-[var(--primary)]" /> : <Sparkles size={32} className="text-amber-600" />}
                        <span className="text-xs font-bold">{p.sku}</span>
                      </div>
                    )}

                    {/* Top Left Kind Badge */}
                    <span
                      className={`absolute top-3 start-3 px-2.5 py-1 rounded-lg text-[10px] font-black shadow-sm backdrop-blur-sm ${
                        isOriginal
                          ? 'bg-amber-600/95 text-white'
                          : isPrint
                            ? 'bg-stone-900/85 text-amber-200'
                            : p.kind === 'book_digital_ebook'
                              ? 'bg-teal-700/90 text-white'
                              : 'bg-stone-900/85 text-white'
                      }`}
                    >
                      {isOriginal
                        ? tx('اثر اصل ۱/۱', 'Œuvre originale 1/1', 'Original 1/1')
                        : isPrint
                          ? tx('چاپ موزه‌ای شماره‌دار', 'Tirage Fine Art', 'Fine Art Print')
                          : p.kind === 'book_physical_signed'
                            ? tx('کتاب چاپی امضاشده', 'Livre dédicacé', 'Signed Book')
                            : p.kind === 'book_digital_ebook'
                              ? tx('نسخه دیجیتال فوری', 'eBook immédiat', 'Instant eBook')
                              : p.kind === 'commission_inquiry'
                                ? tx('سفارش اختصاصی', 'Sur mesure', 'Bespoke')
                                : tx('حمایت از آرشیو', 'Mécénat', 'Patronage')}
                    </span>

                    {p.availability !== 'available' && (
                      <span className="absolute top-3 end-3 px-2.5 py-1 rounded-lg text-[10px] font-black bg-black/80 text-white">
                        {p.availability === 'sold'
                          ? tx('واگذار شده', 'Vendu', 'Sold')
                          : p.availability === 'reserved'
                            ? tx('رزرو موقت', 'Réservé', 'Reserved')
                            : tx('استعلام', 'Sur demande', 'Inquiry')}
                      </span>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-[var(--foreground-muted)]">
                      <span dir="ltr">{p.sku}</span>
                      {p.physicalSpecs?.dimensionsCm && <span dir="ltr">{p.physicalSpecs.dimensionsCm}</span>}
                      {!p.physicalSpecs?.dimensionsCm && p.year && <span dir="ltr">{p.year}</span>}
                    </div>

                    <h2 className="text-base font-extrabold text-[var(--foreground)] leading-snug">
                      {p.title[locale]}
                    </h2>

                    {p.subtitle?.[locale] && (
                      <p className="text-xs text-[var(--foreground-muted)] leading-relaxed line-clamp-2">
                        {p.subtitle[locale]}
                      </p>
                    )}

                    {/* French Legal & Accounting Transparency Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
                      {isOriginal && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 font-semibold">
                          {tx('گواهی Décret Marcus + Ed25519', 'Certificat Décret Marcus + Ed25519', 'Décret Marcus + Ed25519')}
                        </span>
                      )}
                      {isHighTicket && (
                        <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-800 dark:text-sky-300 border border-sky-500/20 font-semibold">
                          {tx('واریز SEPA بدون کارمزد', 'Virement SEPA 0 %', '0% SEPA Wire')}
                        </span>
                      )}
                      {!isHighTicket && (p.priceEurCents || 0) >= 5000 && (
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-800 dark:text-purple-300 border border-purple-500/20 font-semibold">
                          {tx('قسطی Alma ۲ تا ۴ قسط', 'Alma 2x/3x/4x', 'Alma Installments')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="px-5 py-4 border-t border-[var(--border-subtle)] bg-[var(--surface-sunken)]/50 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-lg font-black font-mono tabular-nums text-[var(--foreground)] block leading-none">
                        {formatEur(p.priceEurCents, locale)}
                      </span>
                      <span className="text-[10px] text-[var(--foreground-muted)]">
                        {legalConfig.taxMode === 'franchise_en_base'
                          ? tx('معاف از TVA (Art. 293 B)', 'TVA non applicable (293 B)', 'VAT-exempt (Art. 293 B)')
                          : tx('با احتساب TVA فرانسه', 'TTC France', 'VAT incl.')}
                      </span>
                    </div>

                    {canBuy ? (
                      <button
                        type="button"
                        onClick={() => addItem(p)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer ${
                          inCart
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-95'
                        }`}
                      >
                        {inCart ? <CheckCircle2 size={14} /> : <ShoppingBag size={14} />}
                        <span>
                          {inCart
                            ? tx('در سبد تملک', 'Dans le panier', 'In Cart')
                            : isOriginal
                              ? tx('تملک اثر اصل', 'Acquérir l’œuvre', 'Acquire Original')
                              : tx('افزودن به سبد', 'Ajouter au panier', 'Add to Cart')}
                        </span>
                      </button>
                    ) : (
                      <Link
                        href={`/${locale}/about?tab=contact`}
                        className="px-3.5 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--foreground)] hover:border-[var(--primary)]"
                      >
                        {tx('تماس با آتلیه', 'Contacter l’atelier', 'Contact Studio')}
                      </Link>
                    )}
                  </div>

                  {detailHref && (
                    <Link
                      href={detailHref}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--primary)] hover:underline"
                    >
                      <ExternalLink size={11} />
                      <span>
                        {p.collection === 'artworks'
                          ? tx('بررسی بافت اثر در نمایشگر زوم عمیق IIIF', 'Examiner en zoom muséal IIIF', 'Inspect in IIIF Deep Zoom')
                          : p.collection === 'books'
                            ? tx('مشاهده کتاب سه‌بعدی و فصل نمونه', 'Voir le livre 3D & extrait', 'View 3D book & sample chapter')
                            : p.collection === 'poems'
                              ? tx('مطالعه شعر کامل در آرشیو', 'Lire le poème dans les archives', 'Read poem in archive')
                              : tx('مشاهده سخنرانی در آرشیو', 'Voir la conférence dans les archives', 'View lecture in archive')}
                      </span>
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* French Consumer Protection & Access Transparency Notice */}
      <section className="p-6 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 font-extrabold text-[var(--foreground)]">
            <ShieldCheck size={15} className="text-emerald-600" />
            <span>{tx('گواهی اصالت و انطباق فرانسه', 'Authenticité & Conformité France', 'French Legal & Provenance')}</span>
          </div>
          <p className="text-[var(--foreground-muted)] leading-relaxed">
            {tx(
              'همه آثار اصل با گواهی اصالت Décret Marcus و امضای کریپتوگرافیک Ed25519 و همه کتاب‌ها با رعایت Loi Lang و Loi Darcos عرضه می‌شوند.',
              'Œuvres originales certifiées Décret Marcus + Ed25519 ; livres conformes aux lois Lang & Darcos ; rétractation en ligne conforme au décret n° 2026-3.',
              'Originals include Décret Marcus + Ed25519 provenance; books comply with Loi Lang & Loi Darcos; online withdrawal complies with 2026 French law.'
            )}
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 font-extrabold text-[var(--foreground)]">
            <Sparkles size={15} className="text-amber-600" />
            <span>{tx('آرشیو علمی و حقوق بشری همیشه رایگان', 'Archives scientifiques & civiques gratuites', 'Open Scholarship Remains Free')}</span>
          </div>
          <p className="text-[var(--foreground-muted)] leading-relaxed">
            {tx(
              'مطالعه ۴۰۳ مقاله علمی، ۳۰۰ شعر، حافظ‌پژوهی و تمامی اسناد حقوق بشر و دادخواهی همچنان برای همگان آزاد و رایگان باقی می‌ماند.',
              'L’accès aux 403 articles, 300 poèmes, recherches sur Hafez et archives des droits humains demeure intégralement gratuit.',
              'All 403 scholarly articles, 300 poems, Hafez studies, and human rights records remain permanently open and free.'
            )}
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 font-extrabold text-[var(--foreground)]">
            <BookOpen size={15} className="text-[var(--primary)]" />
            <span>{tx('پشتیبانی مخاطبان داخل ایران', 'Lecteurs en Iran', 'Readers Inside Iran')}</span>
          </div>
          <p className="text-[var(--foreground-muted)] leading-relaxed">
            {tx(
              'پرداخت یورویی ویژه مخاطبان اروپا و سراسر جهان است. برای تهیه کتاب‌های منتشرشده در ایران، در صفحه هر کتاب دکمه کتاب‌فروشی‌های رسمی داخل ایران قرار دارد.',
              'Le paiement en euros concerne l’UE et l’international ; les ouvrages publiés en Iran renvoient vers les librairies locales autorisées.',
              'EUR checkout serves Europe and international collectors; books published in Iran retain direct links to authorized domestic bookstores.'
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
