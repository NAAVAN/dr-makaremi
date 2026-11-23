import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight, Download, FileText, FileDown } from 'lucide-react';
import { getArchivePages, getArchivePageBySlug } from '@/lib/cms';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { renderSafeMarkdown } from '@/lib/markdown';
import { buildTrilingualMetadata } from '@/lib/seo-helpers';
import { BilingualWorkReader } from '@/components/i18n/BilingualWorkReader';
import { resolveWorkTranslation } from '@/lib/work-language';
import { resolveProxiedMediaUrl } from '@/lib/media-url';

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
  if (!isValidLocale(locale)) return {};
  const page = await getArchivePageBySlug(slug, locale);
  if (!page) return {};

  const trans =
    page.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    page.translations?.[0];

  return buildTrilingualMetadata({
    locale,
    path: `/about/${slug}`,
    ogType: 'article',
    title: trans?.title || page.slug,
    description: trans?.excerpt || trans?.title || page.slug,
    imageUrl: page.cover_image_url,
  });
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
  const isFr = locale === 'fr';
  const resolved = resolveWorkTranslation({
    collection: 'pages',
    slug: page.slug,
    translations: page.translations,
    siteLocale: locale,
  });
  const trans = resolved.originalRecord || page.translations?.[0];
  const displayTitle = resolved.translatedRecord?.title || trans?.title || page.slug;

  return (
    <article className="max-w-4xl mx-auto space-y-10">
      <link
        rel="alternate"
        type="text/markdown"
        href={`/${locale}/about/${slug}.md`}
        title="Markdown Twin"
      />

      <nav
        aria-label={isFa ? 'راهنمای مسیر' : isFr ? 'Fil d’Ariane' : 'Breadcrumb'}
        className="flex items-center justify-between text-xs text-[var(--foreground-muted)]"
      >
        <Link
          href={`/${locale}/about`}
          className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors font-medium"
        >
          {isFa ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          <span>
            {isFa
              ? 'بازگشت به درباره دکتر مکارمی و اسناد'
              : isFr
                ? 'Retour à À Propos'
                : 'Back to About & Archives'}
          </span>
        </Link>

        <Link
          href={`/${locale}/about/${slug}.md`}
          target="_blank" rel="noopener noreferrer"
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

        <h1 className="text-2xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
          {displayTitle}
        </h1>
      </header>

      {page.slug === 'contact-mention-fa' && (
        <aside className="p-5 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--primary)]/40 space-y-3">
          <p className="text-xs sm:text-sm font-bold text-[var(--foreground)]">
            {isFa
              ? 'نسخه به‌روز و رسمی اطلاعات حقوقی (LCEN)، شرایط عمومی فروش (CGV)، حریم خصوصی (RGPD) و سامانه انصراف از خرید (۲۰۲۶) در بخش قانونی سایت در دسترس است:'
              : isFr
                ? 'Les mentions légales actualisées (LCEN 2026), les CGV, la politique RGPD et la fonctionnalité de rétractation en ligne sont disponibles ici :'
                : 'Up-to-date French LCEN Legal Notices, General Terms of Sale (CGV), GDPR Privacy Policy, and Online Withdrawal are available here:'}
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link href={`/${locale}/legal/mentions-legales`} className="px-3.5 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-bold">
              {isFa ? 'اطلاعات حقوقی رسمی (Mentions légales)' : isFr ? 'Mentions légales (2026)' : 'Official Legal Notices'}
            </Link>
            <Link href={`/${locale}/legal/cgv`} className="px-3.5 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] font-bold hover:border-[var(--primary)]">
              {isFa ? 'شرایط عمومی فروش (CGV)' : isFr ? 'CGV' : 'Terms of Sale (CGV)'}
            </Link>
            <Link href={`/${locale}/legal/retractation`} className="px-3.5 py-2 rounded-xl bg-[var(--surface-card)] border border-amber-500/40 text-amber-800 dark:text-amber-300 font-bold">
              {isFa ? 'انصراف از خرید' : isFr ? 'Renoncer au contrat ici' : 'Withdraw from Contract'}
            </Link>
          </div>
        </aside>
      )}

      <BilingualWorkReader
        originalLang={resolved.originalLang}
        siteLocale={locale}
        translated={resolved.translatedRecord}
        originalTitle={trans?.title}
        originalContent={
          <section
            aria-label={isFa ? 'متن سند آرشیوی' : isFr ? 'Document d’archive' : 'Archival Document'}
            className="text-base sm:text-lg leading-loose text-[var(--foreground)] font-serif space-y-5"
          >
            {renderSafeMarkdown(trans?.body_markdown || '')}
          </section>
        }
      />

      {page.pdf_urls && page.pdf_urls.length > 0 && (
        <section
          aria-label={isFa ? 'اسناد PDF پیوست' : isFr ? 'Documents PDF associés' : 'Attached PDF Documents'}
          className="p-6 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] space-y-3"
        >
          <h2 className="text-sm font-bold text-[var(--foreground)]">
            {isFa
              ? 'فایل‌های PDF پیوست این صفحه:'
              : isFr
                ? 'Documents PDF associés :'
                : 'Attached PDF Documents:'}
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
        <section
          aria-label={isFa ? 'تصاویر آرشیوی پیوست' : isFr ? 'Images d’archive' : 'Archival Photographs'}
          className="space-y-4"
        >
          <h2 className="text-lg font-bold text-[var(--foreground)]">
            {isFa ? 'تصاویر آرشیوی پیوست' : isFr ? 'Images d’archive' : 'Archival Photographs'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {page.gallery_images.map((img, i) => (
              <figure key={`${img.id}-${i}`} className="rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--surface-sunken)]">
                <img
                  src={resolveProxiedMediaUrl(img.url, 'archive', img.alt || img.title) || img.url}
                  alt={img.alt || img.title}
                  loading="lazy"
                  decoding="async"
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
