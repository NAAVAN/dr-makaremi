import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Download, ArrowRight, ArrowLeft } from 'lucide-react';
import { getBooks, getBookBySlug } from '@/lib/cms';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { Book3DShowcase } from '@/components/books/Book3DShowcase';
import { BookMetadataCard } from '@/components/books/BookMetadataCard';
import { AuthorAudioPlayer } from '@/components/books/AuthorAudioPlayer';
import { BookSampleReader } from '@/components/books/BookSampleReader';
import { GeoPurchaseLinks } from '@/components/books/GeoPurchaseLinks';
import { JsonLdGraph } from '@/components/seo/JsonLdGraph';
import {
  buildBookNode,
  buildBreadcrumbNode,
  buildFullGraph,
} from '@/lib/schema-org';
import { buildBookAcademicMeta } from '@/lib/academic-metadata';

export async function generateStaticParams() {
  const books = await getBooks('fa');
  const params: Array<{ locale: string; slug: string }> = [];

  for (const locale of SUPPORTED_LOCALES) {
    for (const b of books) {
      params.push({ locale, slug: b.slug });
    }
  }

  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const book = await getBookBySlug(slug, locale as Locale);
  if (!book) return {};

  const trans =
    book.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    book.translations?.[0];

  const academicMeta = buildBookAcademicMeta(book, locale as Locale);

  return {
    title: trans?.title || book.slug,
    description: trans?.synopsis?.slice(0, 160),
    alternates: {
      canonical: `https://makaremi.com/${locale}/books/${slug}`,
      languages: {
        'fa-IR': `https://makaremi.com/fa/books/${slug}`,
        'fr-FR': `https://makaremi.com/fr/books/${slug}`,
        'en-US': `https://makaremi.com/en/books/${slug}`,
        'x-default': `https://makaremi.com/fa/books/${slug}`,
      },
      types: {
        'text/markdown': `https://makaremi.com/${locale}/books/${slug}.md`,
      },
    },
    other: {
      ...academicMeta,
    },
  };
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };
  if (!isValidLocale(locale)) notFound();

  const book = await getBookBySlug(slug, locale);
  if (!book) notFound();

  const isFa = locale === 'fa';
  const trans =
    book.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    book.translations?.[0];

  const title = trans?.title || book.slug;

  const bookNode = buildBookNode(book, locale);
  const breadcrumbNode = buildBreadcrumbNode([
    { name: isFa ? 'خانه' : 'Home', item: `https://makaremi.com/${locale}` },
    { name: isFa ? 'کتاب‌ها' : 'Books', item: `https://makaremi.com/${locale}/books` },
    { name: title, item: `https://makaremi.com/${locale}/books/${slug}` },
  ]);
  const jsonLdGraph = buildFullGraph({
    locale,
    items: [bookNode, breadcrumbNode],
  });

  return (
    <div className="space-y-12">
      <JsonLdGraph data={jsonLdGraph} />
      <link
        rel="alternate"
        type="text/markdown"
        href={`/${locale}/books/${slug}.md`}
        title="Markdown Twin"
      />
      {/* Breadcrumb & Navigation */}
      <nav aria-label="راهنمای مسیر" className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
        <Link
          href={`/${locale}/books`}
          className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors font-medium"
        >
          {isFa ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          <span>{isFa ? 'بازگشت به کتاب‌خانه' : 'Retour aux livres'}</span>
        </Link>

        <Link
          href={`/${locale}/books/${slug}.md`}
          target="_blank"
          className="flex items-center gap-1 font-mono px-2.5 py-1 rounded-md bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
        >
          <Download size={12} />
          <span>.md (AEO / AI Twin)</span>
        </Link>
      </nav>

      {/* Main Book Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Interactive 3D Mesh */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-3xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)]">
          <Book3DShowcase book={book} translation={trans} locale={locale} />
        </div>

        {/* Right Column: Book Identity & Actions */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--surface-sunken)] border border-[var(--border-subtle)] font-bold text-[var(--primary)]">
              {book.pillar.replace('_', ' ')}
            </span>

            {/* STRICT SINGLE H1 PER PAGE */}
            <h1 className="text-2xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight leading-tight">
              {title}
            </h1>

            {trans?.subtitle && (
              <p className="text-sm sm:text-base font-bold text-[var(--foreground-muted)]">
                {trans.subtitle}
              </p>
            )}
          </div>

          <p className="text-sm text-[var(--foreground)] leading-relaxed font-serif">
            {trans?.synopsis}
          </p>

          {/* Author Commentary Audio Player */}
          <AuthorAudioPlayer bookTitle={title} locale={locale} />

          {/* Acquisition Options */}
          <GeoPurchaseLinks geoLinks={trans?.geo_acquisition_links} locale={locale} />
        </div>
      </div>

      {/* Bibliographic Card & Academic Citations */}
      <BookMetadataCard book={book} translation={trans} locale={locale} />

      {/* In-Browser Flipbook / Sample Chapter Reader */}
      <section aria-label="پیش‌نمایش متن و فصل نمونه">
        <BookSampleReader
          title={title}
          subtitle={trans?.subtitle}
          publisherName={trans?.publisher_name}
          tableOfContents={trans?.table_of_contents_markdown}
          sampleChapter={trans?.sample_chapter_markdown}
          book={book}
          locale={locale}
        />
      </section>
    </div>
  );
}
