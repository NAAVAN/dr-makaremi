'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BookOpen, Sparkles, Sliders, Eye } from 'lucide-react';
import { getBookStudioProfile, BOOK_GENRE_LABELS, type BookGenreKey } from '@/lib/legacy-heritage';
import { Book3DShowcase } from './Book3DShowcase';
import { BookSampleReader } from './BookSampleReader';
import type { Book, Locale } from '@makaremi/shared';
import { getLanguageDir, resolveWorkTranslation } from '@/lib/work-language';
import { WorkLanguageBar } from '@/components/i18n/WorkLanguageBar';

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

function resolveGenreFromParams(genreParam: string | null, pillarParam: string | null): 'all' | BookGenreKey {
  const valid = new Set<string>(GENRE_FILTER_KEYS);
  if (genreParam && valid.has(genreParam.toLowerCase())) {
    return genreParam.toLowerCase() as 'all' | BookGenreKey;
  }
  if (pillarParam) {
    const p = pillarParam.toLowerCase();
    if (p === 'psychoanalysis' || p === 'psychanalyse') return 'psychoanalysis';
    if (p === 'art' || p === 'art_calligraphy') return 'art';
    if (p === 'strategy' || p === 'cultural_strategy') return 'strategy';
    if (p === 'human-rights' || p === 'human_rights_dadkhahi') return 'memoir';
  }
  return 'all';
}

function BooksUrlSync({
  books,
  onSync,
}: {
  books: Book[];
  onSync: (genre: 'all' | BookGenreKey, spotlight?: string) => void;
}) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const resolved = resolveGenreFromParams(searchParams.get('genre'), searchParams.get('pillar'));
    let firstSlug: string | undefined;
    if (resolved !== 'all') {
      const firstMatch = books.find((b) => {
        const prof = getBookStudioProfile(b.slug, b.page_count || 240, b.pillar, b.genre_key);
        return prof.genreKey === resolved;
      });
      if (firstMatch) firstSlug = firstMatch.slug;
    }
    onSync(resolved, firstSlug);
  }, [searchParams, books, onSync]);
  return null;
}

export function BooksInteractiveCatalog({ books, locale }: BooksInteractiveCatalogProps) {
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);

  const [selectedGenre, setSelectedGenre] = useState<'all' | BookGenreKey>('all');
  const [spotlightSlug, setSpotlightSlug] = useState<string>(
    books[0]?.slug || 'lacan-seminar-3-psychoses'
  );
  const [showInlineReader, setShowInlineReader] = useState<boolean>(false);
  const [showOriginalIds, setShowOriginalIds] = useState<Record<string, boolean>>({});

  const toggleBookTranslation = (id: string) => {
    setShowOriginalIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUrlSync = React.useCallback((genre: 'all' | BookGenreKey, spotlight?: string) => {
    setSelectedGenre(genre);
    if (spotlight) setSpotlightSlug(spotlight);
  }, []);

  const genreCounts = useMemo(() => {
    const counts: Record<string, number> = { all: books.length };
    for (const b of books) {
      const prof = getBookStudioProfile(b.slug, b.page_count || 240, b.pillar, b.genre_key);
      counts[prof.genreKey] = (counts[prof.genreKey] || 0) + 1;
    }
    return counts;
  }, [books]);

  const filteredBooks = useMemo(() => {
    if (selectedGenre === 'all') return books;
    return books.filter((b) => {
      const prof = getBookStudioProfile(b.slug, b.page_count || 240, b.pillar, b.genre_key);
      return prof.genreKey === selectedGenre;
    });
  }, [books, selectedGenre]);

  const spotlightBook =
    filteredBooks.find((b) => b.slug === spotlightSlug) || filteredBooks[0] || books[0];
  const spotlightTrans =
    spotlightBook?.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    spotlightBook?.translations?.[0];
  const spotlightProfile = spotlightBook
    ? getBookStudioProfile(
      spotlightBook.slug,
      spotlightBook.page_count || 240,
      spotlightBook.pillar,
      spotlightBook.genre_key
    )
    : null;

  return (
    <div className="space-y-12">
      <Suspense fallback={null}>
        <BooksUrlSync books={books} onSync={handleUrlSync} />
      </Suspense>
      {/* 1. Interactive 3D Sanctuary Spotlight Stage */}
      {spotlightBook && spotlightProfile && (
        <section
          aria-label="ویترین سه‌بعدی کتاب برگزیده"
          className="rounded-3xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-6 sm:p-8 lg:p-10 shadow-sm space-y-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 flex flex-col items-center justify-center bg-[var(--surface-card)] rounded-2xl p-4 border border-[var(--border-subtle)]">
              <Book3DShowcase
                book={spotlightBook}
                translation={spotlightTrans}
                locale={locale}
              />
            </div>

            <div className="lg:col-span-7 space-y-5">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold">
                  {spotlightProfile.genreLabel[locale]}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[var(--surface-card)] border border-[var(--border-subtle)] font-mono text-[var(--foreground-muted)]">
                  {spotlightBook.publication_year} • {spotlightTrans?.publisher_name}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[var(--surface-card)] border border-[var(--border-subtle)] font-mono text-[var(--foreground-muted)] tabular-nums">
                  {spotlightBook.page_count || 240} {tx('صفحه', 'p.', 'pp.')} ({spotlightProfile.spineWidthMm} mm)
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

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--foreground-muted)] block">
                    {tx('قطع و ابعاد', 'Format', 'Format & Dimensions')}
                  </span>
                  <span className="text-xs font-bold text-[var(--foreground)]">
                    {spotlightProfile.trimSizeLabel[locale]}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--foreground-muted)] block">
                    {tx('قطر عطف و وزن', 'Dos & Poids', 'Spine & Weight')}
                  </span>
                  <span className="text-xs font-bold font-mono text-[var(--foreground)] tabular-nums">
                    {spotlightProfile.spineWidthMm}mm • {spotlightProfile.weightGrams}g
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--foreground-muted)] block">
                    {tx('جهت صحافی', 'Reliure', 'Binding Direction')}
                  </span>
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    {spotlightProfile.direction === 'rtl'
                      ? tx('راست‌به‌چپ (فارسی)', 'RTL (Persan)', 'RTL (Persian)')
                      : tx('چپ‌به‌راست (فرانسوی)', 'LTR (Français)', 'LTR (French)')}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--foreground-muted)] block">
                    {tx('بازه مطالعه مجاز', 'Extrait autorisé', 'Preview Range')}
                  </span>
                  <span className="text-xs font-bold font-mono text-[var(--foreground)] tabular-nums">
                    {tx(
                      `ص ۱ + ص ${spotlightProfile.previewStartPage}–${spotlightProfile.previewEndPage}`,
                      `p. 1 + p. ${spotlightProfile.previewStartPage}–${spotlightProfile.previewEndPage}`,
                      `p. 1 + pp. ${spotlightProfile.previewStartPage}–${spotlightProfile.previewEndPage}`
                    )}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInlineReader((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white shadow-sm transition-all cursor-pointer"
                >
                  <BookOpen size={15} />
                  <span>
                    {showInlineReader
                      ? tx('بستن کتاب‌خوان ورق‌خور', 'Fermer le lecteur', 'Close 3D Reader')
                      : tx('گشودن و تورق سه‌بعدی کتاب (شروع از صفحه ۱)', 'Ouvrir et feuilleter en 3D (Page 1)', 'Open & Browse 3D Reader (Page 1)')}
                  </span>
                </button>

                <Link
                  href={`/${locale}/books/${spotlightBook.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--foreground)] hover:border-amber-600/50 transition-all"
                >
                  <Eye size={15} />
                  <span>{tx('صفحه اختصاصی و شناسنامه کامل اثر', 'Fiche complète du livre', 'Full Book Details & Citations')}</span>
                </Link>

                <Link
                  href={`/${locale}/book-studio?book=${spotlightBook.slug}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-teal-800 dark:text-teal-300 bg-teal-500/10 border border-teal-500/25 hover:bg-teal-500/20 transition-all"
                >
                  <Sliders size={14} />
                  <span>{tx('تنظیم در استودیو کتاب (مدیر)', 'Studio 3D (Admin)', '3D Book Studio')}</span>
                </Link>
              </div>
            </div>
          </div>

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

      {/* 2. 8-Genre Filter Bar (Synced with URL ?genre= / ?pillar=) */}
      <div
        id="books-genre-bar"
        className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {GENRE_FILTER_KEYS.map((gKey) => {
            const count = genreCounts[gKey] || 0;
            const label =
              gKey === 'all'
                ? isFa
                  ? `همه کتاب‌ها (${count})`
                  : isFr
                    ? `Tous les livres (${count})`
                    : `All Books (${count})`
                : `${BOOK_GENRE_LABELS[gKey][locale]} (${count})`;
            const isSelected = selectedGenre === gKey;

            return (
              <button
                key={gKey}
                type="button"
                onClick={() => {
                  setSelectedGenre(gKey);
                  if (gKey !== 'all') {
                    const first = books.find(
                      (b) => getBookStudioProfile(b.slug, b.page_count || 240, b.pillar, b.genre_key).genreKey === gKey
                    );
                    if (first) setSpotlightSlug(first.slug);
                  }
                }}
                aria-pressed={isSelected}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer tabular-nums ${isSelected
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

      {/* 3. Categorized Books Grid */}
      {filteredBooks.length === 0 ? (
        <div
          role="status"
          className="p-10 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-center space-y-3"
        >
          <p className="text-sm font-bold text-[var(--foreground)]">
            {tx('کتابی در این ژانر یافت نشد.', 'Aucun livre dans ce genre.', 'No books found in this genre.')}
          </p>
          <button
            type="button"
            onClick={() => setSelectedGenre('all')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--primary)] text-[var(--primary-foreground)] cursor-pointer"
          >
            {tx('نمایش همه کتاب‌ها', 'Afficher tous les livres', 'Show All Books')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((b) => {
            const resolved = resolveWorkTranslation({
              collection: 'books',
              slug: b.slug,
              translations: b.translations,
              siteLocale: locale,
            });
            const isShowingTranslated = resolved.hasTranslation && !showOriginalIds[b.id];
            const origTrans = resolved.originalRecord;
            const displayTitle =
              isShowingTranslated && resolved.translatedRecord?.title
                ? resolved.translatedRecord.title
                : origTrans?.title || b.slug;
            const displaySubtitle =
              isShowingTranslated && resolved.translatedRecord?.subtitle
                ? resolved.translatedRecord.subtitle
                : origTrans?.subtitle;
            const displaySynopsis =
              isShowingTranslated && resolved.translatedRecord?.summary
                ? resolved.translatedRecord.summary
                : origTrans?.synopsis;
            const activeDir = isShowingTranslated && resolved.hasTranslation
              ? getLanguageDir(locale)
              : getLanguageDir(resolved.originalLang);

            const prof = getBookStudioProfile(b.slug, b.page_count || 240, b.pillar, b.genre_key);
            const isSpotlight = b.slug === spotlightBook?.slug;

            return (
              <article
                key={b.id}
                className={`group min-w-0 rounded-2xl bg-[var(--surface-card)] border transition-all duration-300 p-6 flex flex-col justify-between ${isSpotlight
                    ? 'border-amber-600/60 ring-2 ring-amber-500/20 shadow-lg'
                    : 'border-[var(--border-subtle)] hover:shadow-xl'
                  }`}
              >
                <div className="space-y-4 min-w-0">
                  <WorkLanguageBar
                    originalLang={resolved.originalLang}
                    siteLocale={locale}
                    isTranslated={isShowingTranslated}
                    hasTranslation={resolved.hasTranslation}
                    onToggle={() => toggleBookTranslation(b.id)}
                    compact
                  />

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--primary)]">
                      {prof.genreLabel[locale]}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--foreground-muted)] tabular-nums shrink-0">
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300">
                        {prof.direction.toUpperCase()}
                      </span>
                      <span>{b.publication_year}</span>
                    </div>
                  </div>

                  <div dir={activeDir} className="space-y-2">
                    <h2 className="text-lg font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors break-words">
                      <Link href={`/${locale}/books/${b.slug}`}>
                        {displayTitle}
                      </Link>
                    </h2>
                    {displaySubtitle && (
                      <p className="text-xs text-[var(--foreground-muted)] font-medium break-words">
                        {displaySubtitle}
                      </p>
                    )}
                    <p className="text-xs text-[var(--foreground-muted)] line-clamp-3 leading-relaxed break-words">
                      {displaySynopsis}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-[var(--foreground-muted)] font-mono tabular-nums">
                    <span className="truncate max-w-[160px]">{origTrans?.publisher_name}</span>
                    <span>
                      {isFa
                        ? `${b.page_count || 240} ص · عطف ${prof.spineWidthMm}mm`
                        : isFr
                          ? `${b.page_count || 240} p. · dos ${prof.spineWidthMm}mm`
                          : `${b.page_count || 240} pp. · spine ${prof.spineWidthMm}mm`}
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
                      <span>{isFa ? 'بارگذاری در ویترین 3D بالا' : isFr ? 'Voir en 3D' : 'Open in 3D Stage'}</span>
                    </button>

                    <Link
                      href={`/${locale}/books/${b.slug}`}
                      className="text-xs font-bold text-[var(--primary)] hover:underline whitespace-nowrap"
                    >
                      {isFa ? 'مشاهده و مطالعه ←' : isFr ? 'Découvrir →' : 'View & Read →'}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
