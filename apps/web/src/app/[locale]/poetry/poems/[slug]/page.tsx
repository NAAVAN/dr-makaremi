import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowRight, ArrowLeft, Download } from 'lucide-react';
import { getPoems, getPoemBySlug, getArtworks } from '@/lib/cms';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { PoetryArtworkSync } from '@/components/gallery/PoetryArtworkSync';
import { JsonLdGraph } from '@/components/seo/JsonLdGraph';
import { buildPoemNode, buildBreadcrumbNode, buildFullGraph } from '@/lib/schema-org';
import { buildTrilingualMetadata } from '@/lib/seo-helpers';

export const dynamicParams = true;

export async function generateStaticParams() {
  const poems = await getPoems('fa');
  const params: Array<{ locale: string; slug: string }> = [];

  for (const locale of SUPPORTED_LOCALES) {
    for (const p of poems.slice(0, 35)) {
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
  const poem = await getPoemBySlug(slug, locale);
  if (!poem) return {};

  const trans =
    poem.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    poem.translations?.[0];

  const title = trans?.title || poem.slug;
  const description =
    trans?.commentary_markdown?.slice(0, 160) ||
    (locale === 'fa'
      ? 'شعر و دکلمه صوتی دکتر حسن مکارمی'
      : locale === 'fr'
        ? 'Poème et récitation audio du Dr Hassan Makaremi'
        : 'Poem and audio recitation by Dr. Hassan Makaremi');

  return buildTrilingualMetadata({
    locale,
    path: `/poetry/poems/${slug}`,
    title,
    description,
    ogType: 'article',
    imageUrl: poem.artwork_image_url,
  });
}

export default async function SinglePoemPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = (await params) as { locale: Locale; slug: string };
  if (!isValidLocale(locale)) notFound();

  const poem = await getPoemBySlug(slug, locale);
  if (!poem) notFound();

  const artworks = await getArtworks(locale);
  const linkedArtwork = artworks.find((a) => a.id === poem.linked_artwork_id) || artworks[0];

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const trans =
    poem.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    poem.translations?.[0];
  const title = trans?.title || poem.slug;

  const jsonLdGraph = buildFullGraph({
    locale,
    items: [
      buildPoemNode(poem, locale),
      buildBreadcrumbNode([
        { name: isFa ? 'خانه' : isFr ? 'Accueil' : 'Home', item: `https://makaremi.com/${locale}` },
        { name: isFa ? 'شعر و ادبیات' : isFr ? 'Poésie' : 'Poetry', item: `https://makaremi.com/${locale}/poetry` },
        { name: title, item: `https://makaremi.com/${locale}/poetry/poems/${slug}` },
      ]),
    ],
  });

  return (
    <div className="space-y-10">
      <JsonLdGraph data={jsonLdGraph} />
      <link
        rel="alternate"
        type="text/markdown"
        href={`/${locale}/poetry/poems/${slug}.md`}
        title="Markdown Twin"
      />
      <nav aria-label="راهنمای مسیر" className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
        <Link
          href={`/${locale}/poetry`}
          className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors font-medium"
        >
          {isFa ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          <span>{isFa ? 'بازگشت به آرشیو اشعار' : 'Retour aux poèmes'}</span>
        </Link>

        <Link
          href={`/${locale}/poetry/poems/${slug}.md`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 font-mono px-2.5 py-1 rounded-md bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
        >
          <Download size={12} />
          <span>.md (AEO / AI Twin)</span>
        </Link>
      </nav>

      {/* Single H1 Tag */}
      <h1 className="sr-only">{trans?.title || poem.slug}</h1>

      <PoetryArtworkSync
        poem={poem}
        artwork={linkedArtwork}
        locale={locale}
      />
    </div>
  );
}
