import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowRight, ArrowLeft, Download } from 'lucide-react';
import { getPoems, getPoemBySlug, getArtworks } from '@/lib/cms';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { PoetryArtworkSync } from '@/components/gallery/PoetryArtworkSync';

export async function generateStaticParams() {
  const poems = await getPoems('fa');
  const params: Array<{ locale: string; slug: string }> = [];

  for (const locale of SUPPORTED_LOCALES) {
    for (const p of poems) {
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
  const poem = await getPoemBySlug(slug, locale as Locale);
  if (!poem) return {};

  const trans =
    poem.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    poem.translations?.[0];

  return {
    title: trans?.title || poem.slug,
    description: trans?.commentary_markdown?.slice(0, 160) || 'شعر و دکلمه صوتی دکتر حسن مکارمی',
    alternates: {
      canonical: `https://makaremi.com/${locale}/poetry/poems/${slug}`,
    },
  };
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
  const trans =
    poem.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    poem.translations?.[0];

  return (
    <div className="space-y-10">
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
          target="_blank"
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
