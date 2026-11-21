import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MapPin, Calendar, ArrowRight, ArrowLeft, Download } from 'lucide-react';
import { getExhibitions, getExhibitionBySlug, getArtworks } from '@/lib/cms';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { IIIFDeepZoomViewer } from '@/components/gallery/IIIFDeepZoomViewer';
import { renderSafeMarkdown } from '@/lib/markdown';

export async function generateStaticParams() {
  const exhibitions = await getExhibitions('fa');
  const params: Array<{ locale: string; slug: string }> = [];

  for (const locale of SUPPORTED_LOCALES) {
    for (const e of exhibitions) {
      params.push({ locale, slug: e.slug });
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
  const expo = await getExhibitionBySlug(slug, locale as Locale);
  if (!expo) return {};

  const trans =
    expo.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    expo.translations?.[0];

  return {
    title: trans?.title || expo.slug,
    description: trans?.curatorial_statement_markdown?.slice(0, 160),
    alternates: {
      canonical: `https://makaremi.com/${locale}/art/exhibitions/${slug}`,
    },
  };
}

export default async function ExhibitionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };
  if (!isValidLocale(locale)) notFound();

  const expo = await getExhibitionBySlug(slug, locale);
  if (!expo) notFound();

  const artworks = await getArtworks(locale);
  const isFa = locale === 'fa';
  const trans =
    expo.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    expo.translations?.[0];

  const title = trans?.title || expo.slug;

  return (
    <div className="space-y-12">
      {/* Navigation */}
      <nav aria-label="راهنمای مسیر" className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
        <Link
          href={`/${locale}/gallery`}
          className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors font-medium"
        >
          {isFa ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          <span>{isFa ? 'بازگشت به گالری و نمایشگاه‌ها' : 'Retour à la galerie'}</span>
        </Link>

        <Link
          href={`/${locale}/art/exhibitions/${slug}.md`}
          target="_blank"
          className="flex items-center gap-1 font-mono px-2.5 py-1 rounded-md bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
        >
          <Download size={12} />
          <span>.md (AEO / AI Twin)</span>
        </Link>
      </nav>

      {/* Header Info with Strict Single H1 */}
      <header className="space-y-4 border-b border-[var(--border-subtle)] pb-6">
        <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--foreground-muted)] font-medium">
          <span className="flex items-center gap-1.5">
            <Calendar size={14} className="text-[var(--primary)]" />
            {expo.start_date} {expo.end_date ? `تا ${expo.end_date}` : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={14} className="text-[var(--color-art)]" />
            {expo.venue_name} ({expo.venue_city})
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight leading-tight">
          {title}
        </h1>
      </header>

      {/* Curatorial Statement & Critical Essays */}
      <section aria-label="بیانیه نمایشگاه" className="space-y-4 max-w-3xl">
        <h2 className="text-xl font-bold text-[var(--foreground)]">
          {isFa ? 'بیانیه کیوریتوری و نگاه منتقدان' : 'Déclaration Curatoriale & Critiques'}
        </h2>
        <div className="text-base leading-relaxed text-[var(--foreground)] font-serif space-y-4">
          {renderSafeMarkdown(trans?.curatorial_statement_markdown || '')}
        </div>
      </section>

      {/* Featured Exhibition Artwork / Real Gallery Photos with IIIF Deep Zoom */}
      <section aria-label="آثار به نمایش درآمده" className="space-y-6">
        <h2 className="text-xl font-bold text-[var(--foreground)] border-b border-[var(--border-subtle)] pb-3">
          {isFa ? 'آثار و تصاویر آرشیوی این نمایشگاه (زوم عمیق بافت بوم)' : 'Œuvres & Archives Photographiques'}
        </h2>

        {expo.gallery_images && expo.gallery_images.length > 0 ? (
          <div className="space-y-6">
            <IIIFDeepZoomViewer
              imageId={`expo-${expo.slug}`}
              imageUrl={expo.cover_image_url || expo.gallery_images[0].url}
              title={title}
              locale={locale}
            />
            {expo.gallery_images.length > 1 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {expo.gallery_images.map((img, i) => (
                  <figure
                    key={`${img.id}-${i}`}
                    className="rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--surface-sunken)]"
                  >
                    <img
                      src={img.url}
                      alt={img.alt || img.title || title}
                      loading="lazy"
                      className="w-full aspect-[4/3] object-cover"
                    />
                  </figure>
                ))}
              </div>
            )}
          </div>
        ) : (
          artworks.slice(0, 1).map((art) => {
            const artTrans =
              art.translations?.find((t) => t.languages_code.startsWith(locale)) ||
              art.translations?.[0];

            return (
              <div key={art.id} className="space-y-4 p-6 rounded-3xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)]">
                <IIIFDeepZoomViewer
                  imageId={art.iiif_image_id}
                  imageUrl={art.image_url}
                  title={artTrans?.title || 'اثر خوشنویسی'}
                  medium={art.medium}
                  dimensions={art.dimensions}
                  locale={locale}
                />
                {artTrans?.curator_critique_markdown && (
                  <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs text-[var(--foreground-muted)] italic leading-relaxed">
                    {artTrans.curator_critique_markdown}
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
