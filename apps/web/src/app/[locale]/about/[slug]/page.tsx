import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight, Download, FileText, FileDown } from 'lucide-react';
import { getArchivePages, getArchivePageBySlug } from '@/lib/cms';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { renderSafeMarkdown } from '@/lib/markdown';

export async function generateStaticParams() {
  const pages = await getArchivePages('fa');
  const params: Array<{ locale: string; slug: string }> = [];
  for (const locale of SUPPORTED_LOCALES) {
    for (const p of pages) {
      params.push({ locale, slug: p.slug });
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
  const page = await getArchivePageBySlug(slug, locale as Locale);
  if (!page) return {};

  const trans =
    page.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    page.translations?.[0];

  return {
    title: trans?.title || page.slug,
    description: trans?.excerpt?.slice(0, 160),
    alternates: {
      canonical: `https://makaremi.com/${locale}/about/${slug}`,
      types: {
        'text/markdown': `https://makaremi.com/${locale}/about/${slug}.md`,
      },
    },
  };
}

export default async function ArchiveReferencePageDetail({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };
  if (!isValidLocale(locale)) notFound();

  const page = await getArchivePageBySlug(slug, locale);
  if (!page) notFound();

  const isFa = locale === 'fa';
  const trans =
    page.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    page.translations?.[0];

  return (
    <article className="max-w-4xl mx-auto space-y-10">
      <link
        rel="alternate"
        type="text/markdown"
        href={`/${locale}/about/${slug}.md`}
        title="Markdown Twin"
      />

      <nav aria-label="راهنمای مسیر" className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
        <Link
          href={`/${locale}/about`}
          className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors font-medium"
        >
          {isFa ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          <span>{isFa ? 'بازگشت به درباره دکتر مکارمی و اسناد' : 'Retour à À Propos'}</span>
        </Link>

        <Link
          href={`/${locale}/about/${slug}.md`}
          target="_blank"
          className="flex items-center gap-1 font-mono px-2.5 py-1 rounded-md bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
        >
          <Download size={12} />
          <span>.md (AEO / AI Twin)</span>
        </Link>
      </nav>

      <header className="space-y-4 border-b border-[var(--border-subtle)] pb-6">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-[var(--primary)] font-bold">
          <FileText size={14} />
          <span>{page.group}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight leading-tight">
          {trans?.title || page.slug}
        </h1>
      </header>

      <section aria-label="متن سند آرشیوی" className="text-base sm:text-lg leading-loose text-[var(--foreground)] font-serif space-y-5">
        {renderSafeMarkdown(trans?.body_markdown || '')}
      </section>

      {page.pdf_urls && page.pdf_urls.length > 0 && (
        <section aria-label="اسناد PDF پیوست" className="p-6 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] space-y-3">
          <h2 className="text-sm font-bold text-[var(--foreground)]">
            {isFa ? 'فایل‌های PDF پیوست این صفحه:' : 'Documents PDF associés :'}
          </h2>
          <div className="flex flex-wrap gap-2">
            {page.pdf_urls.map((pdfUrl, i) => (
              <a
                key={pdfUrl}
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--primary)] hover:underline"
              >
                <FileDown size={13} />
                <span>PDF #{i + 1}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {page.gallery_images && page.gallery_images.length > 0 && (
        <section aria-label="تصاویر آرشیوی پیوست" className="space-y-4">
          <h2 className="text-lg font-bold text-[var(--foreground)]">
            {isFa ? 'تصاویر آرشیوی پیوست' : 'Images d’archive'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {page.gallery_images.map((img, i) => (
              <figure key={`${img.id}-${i}`} className="rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--surface-sunken)]">
                <img
                  src={img.url}
                  alt={img.alt || img.title}
                  loading="lazy"
                  className="w-full aspect-[4/3] object-cover"
                />
              </figure>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
