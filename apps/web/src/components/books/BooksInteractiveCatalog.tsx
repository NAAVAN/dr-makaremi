'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Sparkles, Sliders, Layers, Eye } from 'lucide-react';
import { getBookStudioProfile, BOOK_GENRE_LABELS, type BookGenreKey } from '@/lib/legacy-heritage';
import { Book3DShowcase } from './Book3DShowcase';
import { BookSampleReader } from './BookSampleReader';
import type { Book, Locale } from '@makaremi/shared';

interface BooksInteractiveCatalogProps {
  books: Book[];
  locale: Locale;
}

const GENRE_FILTER_KEYS: Array<'all' | BookGenreKey> = [
  'all',
  'psychoanalysis',
  'hafez',
  'strategy',
  'culture',
  'art',
  'poetry',
  'novel',
  'memoir',
];

export function BooksInteractiveCatalog({ books, locale }: BooksInteractiveCatalogProps) {
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';

  const [selectedGenre, setSelectedGenre] = useState<'all' | BookGenreKey>('all');
  const [spotlightSlug, setSpotlightSlug] = useState<string>(
    books[0]?.slug || 'lacan-seminar-3-psychoses'
  );
  const [showInlineReader, setShowInlineReader] = useState<boolean>(false);

  const filteredBooks = books.filter((b) => {
    if (selectedGenre === 'all') return true;
    const prof = getBookStudioProfile(b.slug, b.page_count || 240, b.pillar);
    return prof.genreKey === selectedGenre;
  });

  const spotlightBook =
    books.find((b) => b.slug === spotlightSlug) || filteredBooks[0] || books[0];
  const spotlightTrans =
    spotlightBook?.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    spotlightBook?.translations?.[0];
  const spotlightProfile = spotlightBook
    ? getBookStudioProfile(spotlightBook.slug, spotlightBook.page_count || 240, spotlightBook.pillar)
    : null;

  return (
    <div className="space-y-12">
      {/* 1. Interactive 3D Sanctuary Spotlight Stage */}
      {spotlightBook && spotlightProfile && (
        <section
          aria-label="ویترین سه‌بعدی کتاب برگزیده"
          className="rounded-3xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-6 sm:p-8 lg:p-10 shadow-sm space-y-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* 3D Book Mesh Column */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center bg-[var(--surface-card)] rounded-2xl p-4 border border-[var(--border-subtle)]">
              <Book3DShowcase
                book={spotlightBook}
                translation={spotlightTrans}
                locale={locale}
              />
            </div>

            {/* Book Details & Sanctuary Actions Column */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold">
                  {spotlightProfile.genreLabel[locale]}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[var(--surface-card)] border border-[var(--border-subtle)] font-mono text-[var(--foreground-muted)]">
                  {spotlightBook.publication_year} • {spotlightTrans?.publisher_name}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[var(--surface-card)] border border-[var(--border-subtle)] font-mono text-[var(--foreground-muted)]">
                  {spotlightBook.page_count || 240} {isFa ? 'صفحه' : 'p.'} ({spotlightProfile.spineWidthMm} mm)
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] leading-snug">
                  {spotlightTrans?.title || spotlightBook.slug}
                </h2>
                {spotlightTrans?.subtitle && (
                  <p className="text-sm sm:text-base font-bold text-[var(--foreground-muted)]">
                    {spotlightTrans.subtitle}
                  </p>
                )}
              </div>

              <p className="text-sm text-[var(--foreground)] leading-relaxed font-serif">
                {spotlightTrans?.synopsis}
              </p>

              {/* Calm Physical Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--foreground-muted)] block">
                    {isFa ? 'قطع و ابعاد' : 'Format'}
                  </span>
                  <span className="text-xs font-bold text-[var(--foreground)]">
                    {spotlightProfile.trimSizeLabel[locale]}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--foreground-muted)] block">
                    {isFa ? 'قطر عطف و وزن' : 'Dos & Poids'}
                  </span>
                  <span className="text-xs font-bold font-mono text-[var(--foreground)]">
                    {spotlightProfile.spineWidthMm}mm • {spotlightProfile.weightGrams}g
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--foreground-muted)] block">
                    {isFa ? 'جهت صحافی' : 'Reliure'}
                  </span>
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    {spotlightProfile.direction === 'rtl'
                      ? isFa
                        ? 'راست‌به‌چپ (فارسی)'
                        : 'RTL (Persan)'
                      : isFa
                      ? 'چپ‌به‌راست (فرانسوی)'
                      : 'LTR (Français)'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--foreground-muted)] block">
                    {isFa ? 'بازه مطالعه مجاز' : 'Extrait autorisé'}
                  </span>
                  <span className="text-xs font-bold font-mono text-[var(--foreground)]">
                    {isFa
                      ? `ص ۱ + ص ${spotlightProfile.previewStartPage}–${spotlightProfile.previewEndPage}`
                      : `p. 1 + p. ${spotlightProfile.previewStartPage}–${spotlightProfile.previewEndPage}`}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInlineReader((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white shadow-sm transition-all cursor-pointer"
                >
                  <BookOpen size={15} />
                  <span>
                    {showInlineReader
                      ? isFa
                        ? 'بستن کتاب‌خوان ورق‌خور'
                        : 'Fermer le lecteur'
                      : isFa
                      ? 'گشودن و تورق سه‌بعدی کتاب (شروع از صفحه ۱)'
                      : 'Ouvrir et feuilleter en 3D (Page 1)'}
                  </span>
                </button>

                <Link
                  href={`/${locale}/books/${spotlightBook.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--foreground)] hover:border-amber-600/50 transition-all"
                >
                  <Eye size={15} />
                  <span>{isFa ? 'صفحه اختصاصی و شناسنامه کامل اثر' : 'Fiche complète du livre'}</span>
                </Link>

                <Link
                  href={`/${locale}/book-studio?book=${spotlightBook.slug}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-teal-800 dark:text-teal-300 bg-teal-500/10 border border-teal-500/25 hover:bg-teal-500/20 transition-all"
                >
                  <Sliders size={14} />
                  <span>{isFa ? 'تنظیم در استودیو کتاب (مدیر)' : 'Studio 3D (Admin)'}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Expandable Inline 3D Page-Flip Reader */}
          {showInlineReader && (
            <div className="pt-4 border-t border-[var(--border-subtle)] animate-fade-in">
              <BookSampleReader
                title={spotlightTrans?.title || spotlightBook.slug}
                subtitle={spotlightTrans?.subtitle}
                publisherName={spotlightTrans?.publisher_name}
                tableOfContents={spotlightTrans?.table_of_contents_markdown}
                sampleChapter={spotlightTrans?.sample_chapter_markdown}
                book={spotlightBook}
                locale={locale}
              />
            </div>
          )}
        </section>
      )}

      {/* 2. 8-Genre Filter Bar (Matching the Legacy WordPress Bibliography Categories) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {GENRE_FILTER_KEYS.map((gKey) => {
            const label =
              gKey === 'all'
                ? isFa
                  ? `همه کتاب‌ها (${books.length})`
                  : isFr
                  ? `Tous les livres (${books.length})`
                  : `All Books (${books.length})`
                : BOOK_GENRE_LABELS[gKey][locale];
            const isSelected = selectedGenre === gKey;

            return (
              <button
                key={gKey}
                type="button"
                onClick={() => setSelectedGenre(gKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs'
                    : 'bg-[var(--surface-sunken)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] border border-[var(--border-subtle)]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Categorized Books Grid with 3D Spine Indicator */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBooks.map((b) => {
          const trans =
            b.translations?.find((t) => t.languages_code.startsWith(locale)) ||
            b.translations?.[0];
          const prof = getBookStudioProfile(b.slug, b.page_count || 240, b.pillar);
          const isSpotlight = b.slug === spotlightBook?.slug;

          return (
            <article
              key={b.id}
              className={`group rounded-2xl bg-[var(--surface-card)] border transition-all duration-300 p-6 flex flex-col justify-between ${
                isSpotlight
                  ? 'border-amber-600/60 ring-2 ring-amber-500/20 shadow-lg'
                  : 'border-[var(--border-subtle)] hover:shadow-xl'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--primary)]">
                    {prof.genreLabel[locale]}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--foreground-muted)]">
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300">
                      {prof.direction.toUpperCase()}
                    </span>
                    <span>{b.publication_year}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors leading-snug">
                    <Link href={`/${locale}/books/${b.slug}`}>
                      {trans?.title || b.slug}
                    </Link>
                  </h2>
                  {trans?.subtitle && (
                    <p className="text-xs text-[var(--foreground-muted)] font-medium">
                      {trans.subtitle}
                    </p>
                  )}
                </div>

                <p className="text-xs text-[var(--foreground-muted)] line-clamp-3 leading-relaxed">
                  {trans?.synopsis}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center justify-between text-[11px] text-[var(--foreground-muted)] font-mono">
                  <span className="truncate max-w-[160px]">{trans?.publisher_name}</span>
                  <span>
                    {b.page_count || 240} ص • عطف {prof.spineWidthMm}mm
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSpotlightSlug(b.slug);
                      setShowInlineReader(true);
                      window.scrollTo({ top: 140, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    <Sparkles size={13} />
                    <span>{isFa ? 'بارگذاری در ویترین 3D بالا' : 'Voir en 3D'}</span>
                  </button>

                  <Link
                    href={`/${locale}/books/${b.slug}`}
                    className="text-xs font-bold text-[var(--primary)] hover:underline"
                  >
                    {isFa ? 'مشاهده و مطالعه ←' : 'Découvrir →'}
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

