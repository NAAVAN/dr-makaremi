import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Music, Feather, BookOpen, Video } from 'lucide-react';
import { getPoems, getArtworks, getArchivePageBySlug } from '@/lib/cms';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { PoetryArtworkSync } from '@/components/gallery/PoetryArtworkSync';
import { PaginatedPoemsGrid } from '@/components/archive/PaginatedPoemsGrid';
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
    path: '/poetry',
    title: isFa
      ? 'دفتر ۳۰۰ شعر و بخش شعر و تصویر | دکتر حسن مکارمی'
      : isFr
        ? 'Recueil de 300 Poèmes & Poésie-Image | Dr Hassan Makaremi'
        : '300 Poems Archive & Synchronised Poetry-Art | Dr Hassan Makaremi',
    description: isFa
      ? 'دفتر کامل ۳۰۰ سروده دوزبانه فارسی و فرانسوی دکتر حسن مکارمی همراه با پیش‌گفتار «شعرواره‌ها» و ۲۹۴ تابلوی نقاشی‌خط اختصاصی.'
      : isFr
        ? 'Recueil complet de 300 poèmes bilingues persan-français accompagnés de 294 œuvres calligraphiques.'
        : 'Complete archive of 300 bilingual Persian-French poems accompanied by 294 calligraphic artworks.',
    includeMarkdownTwin: false,
  });
}

export default async function PoetryOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  if (!isValidLocale(locale)) notFound();

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);
  const [rawPoems, artworks, prefacePage] = await Promise.all([
    getPoems(locale),
    getArtworks(locale),
    getArchivePageBySlug('page-2673', locale),
  ]);
  const prefaceText = prefacePage?.translations?.[0]?.body_markdown;

  const featuredPoem = rawPoems[0];
  const featuredArtwork = artworks[0];

  // Lightweight preview payload for fast archive page load (full verses load on detail page)
  const poems = rawPoems.map((p) => ({
    ...p,
    translations: p.translations?.map((t) => ({
      ...t,
      commentary_markdown: undefined,
      verses: (t.verses || []).slice(0, 2),
    })),
  }));

  return (
    <div className="space-y-14">
      <header className="space-y-4 border-b border-[var(--border-subtle)] pb-6">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-[var(--primary)] font-bold">
          <Music size={16} />
          <span>{tx('شعر، دکلمه و هنر تجسمی', 'Poésie & Musique', 'Poetry, Recitation & Visual Art')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
          {tx(
            'شعر و تصویر؛ تجلی دکلمه صوتی و خوشنویسی نوگرا',
            'Poésie & Image : Récitation et Calligraphie Synchronisée',
            'Poetry & Image: Audio Recitation and Synchronised Calligraphy'
          )}
        </h1>
        <p className="text-sm text-[var(--foreground-muted)] max-w-2xl leading-relaxed">
          {tx(
            'طنین واژگان و رقص قلم‌مو؛ سروده‌های دوزبانه فارسی-فرانسوی دکتر حسن مکارمی همراه با تابلوهای اختصاصی و بخش شعر و تصویر.',
            'Dialogue poétique et visuel entre la parole déclamée et la matière calligraphique.',
            'Poetic and visual dialogue between recited verse and contemporary Persian calligraphy by Dr Hassan Makaremi.'
          )}
        </p>

        {isFa && prefaceText && (
          <blockquote className="p-5 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs sm:text-sm font-serif text-[var(--foreground)] leading-loose whitespace-pre-line max-w-3xl">
            {prefaceText}
          </blockquote>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Link
            href={`/${locale}/media?series=video-poems#videos-archive`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--foreground)] hover:text-[var(--primary)]"
          >
            <Video size={14} />
            <span>{tx('بخش ویدیویی «شعر و تصویر»', 'Vidéos Poésie & Image', '“Poetry & Image” Video Series')}</span>
          </Link>
          <Link
            href={`/${locale}/books?genre=poetry`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--foreground)] hover:text-[var(--primary)]"
          >
            <BookOpen size={14} />
            <span>{tx('کتاب‌های شعر دوزبانه', 'Livres de poésie bilingue', 'Bilingual Poetry Books')}</span>
          </Link>
        </div>
      </header>

      {/* 1. Synchronised Poetry & Artwork Showcase (شعر و تصویر) */}
      {featuredPoem && (
        <section aria-label={tx('شعر و تصویر همگام', 'Poésie et image synchronisées', 'Synchronised Poetry & Artwork')} className="space-y-4">
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            {tx(
              '۱. بخش شعر و تصویر (همگام‌سازی صوت و نقاشی‌خط)',
              '1. Poésie & Image Synchronisées',
              '1. Poetry & Image (Synchronised Voice & Calligraphy)'
            )}
          </h2>
          <PoetryArtworkSync
            poem={featuredPoem}
            artwork={featuredArtwork}
            locale={locale}
          />
        </section>
      )}

      {/* 2. Complete Archive of Poems (زیرمنوی اشعار /poems-persan/) */}
      <section id="poems-archive" aria-label={tx('دفتر اشعار', 'Recueil de poèmes', 'Poems Archive')} className="space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-600 font-bold">
              <Feather size={14} />
              <span>{tx('زیرمنوی اشعار (/poems-persan/)', 'Recueil de Poèmes', 'Complete Poems Collection')}</span>
            </div>
            <h2 className="text-2xl font-black text-[var(--foreground)]">
              {tx(
                `۲. دفتر کامل اشعار و سروده‌های دکتر حسن مکارمی (${poems.length} شعر)`,
                `2. Archive Complète des Poèmes (${poems.length})`,
                `2. Complete Archive of Poems (${poems.length})`
              )}
            </h2>
          </div>

          <Link
            href={`/${locale}/books?genre=poetry`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline"
          >
            <BookOpen size={14} />
            <span>{tx('کتاب‌های شعر دوزبانه ←', 'Livres de poésie →', 'Bilingual Poetry Books →')}</span>
          </Link>
        </div>

        <PaginatedPoemsGrid poems={poems} locale={locale} />
      </section>
    </div>
  );
}
