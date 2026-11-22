import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { BookOpen, Sliders } from 'lucide-react';
import { getBooks } from '@/lib/cms';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { BooksInteractiveCatalog } from '@/components/books/BooksInteractiveCatalog';
import { buildTrilingualMetadata } from '@/lib/seo-helpers';

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
    path: '/books',
    title: isFa
      ? 'کتاب‌خانه دیجیتال و ۲۵ عنوان کتاب دکتر حسن مکارمی (ویترین 3D)'
      : isFr
        ? 'Bibliothèque 3D & 25 Livres du Dr Hassan Makaremi'
        : '3D Digital Library & 25 Books by Dr. Hassan Makaremi',
    description: isFa
      ? 'مجموعه کامل ۲۵ عنوان کتاب تألیفی و ترجمه ژاک لکان در ۸ ژانر تخصصی همراه با کتاب‌خوان ورق‌خور سه‌بعدی و شناسنامه کتاب‌شناختی.'
      : isFr
        ? 'Collection complète de 25 ouvrages de psychanalyse lacanienne, études sur Hafez, stratégie culturelle, poésie et romans.'
        : 'Complete catalogue of 25 books on Lacanian psychoanalysis, Hafezology, cultural strategy, calligraphy, poetry, and memoirs.',
  });
}

export default async function BooksCatalogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  if (!isValidLocale(locale)) notFound();

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);

  const books = await getBooks(locale);

  return (
    <div className="space-y-10">
      {/* Page Header with Single H1 */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-[var(--primary)] font-bold">
            <BookOpen size={16} />
            <span>{tx('کتاب‌خانه سه‌بعدی و منشورات', 'Bibliothèque 3D & Publications', '3D Library & Publications')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
            {tx(
              'کتاب‌خانه دیجیتال و تألیفات دکتر حسن مکارمی',
              'Publications & Livres du Dr Hassan Makaremi',
              'Digital Library & Publications of Dr Hassan Makaremi'
            )}
          </h1>
          <p className="text-sm text-[var(--foreground-muted)] max-w-2xl leading-relaxed">
            {tx(
              `مجموعه کامل ${books.length} عنوان کتاب تألیفی و ترجمه در ۸ ژانر تخصصی (روانکاوی بالینی لکانی، حافظ‌پژوهی، مطالعات راهبردی، فرهنگ ایران، هنر خوشنویسی، شعر دوزبانه، رمان و خاطرات) همراه با کتاب‌خوان ورق‌خور سه‌بعدی.`,
              `Collection complète de ${books.length} monographies, études sur Hafez, romans, traductions de Jacques Lacan et essais stratégiques publiés en France et en Iran.`,
              `Complete collection of ${books.length} monographs, Hafezology studies, novels, translations of Jacques Lacan, and strategic essays published in France, Germany, the UK, and Iran.`
            )}
          </p>
        </div>

        <Link
          href={`/${locale}/book-studio`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[var(--surface-sunken)] hover:bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--foreground)] transition-all shrink-0"
        >
          <Sliders size={14} className="text-amber-600" />
          <span>
            {isFa
              ? 'ورود به استودیوی مدیریت کتاب 3D (پیشخوان)'
              : isFr
                ? 'Studio d’Édition 3D (Admin)'
                : '3D Book Publishing Studio'}
          </span>
        </Link>
      </header>

      {/* Interactive 3D Showcase, 8-Genre Filter & Books Grid */}
      <BooksInteractiveCatalog books={books} locale={locale} />
    </div>
  );
}
