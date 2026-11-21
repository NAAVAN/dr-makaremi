import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Music, Feather, BookOpen } from 'lucide-react';
import { getPoems, getArtworks } from '@/lib/cms';
import { isValidLocale, type Locale } from '@/lib/i18n';
import { PoetryArtworkSync } from '@/components/gallery/PoetryArtworkSync';
import { PaginatedPoemsGrid } from '@/components/archive/PaginatedPoemsGrid';

export default async function PoetryOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  if (!isValidLocale(locale)) notFound();

  const isFa = locale === 'fa';
  const rawPoems = await getPoems(locale);
  const artworks = await getArtworks(locale);

  const featuredPoem = rawPoems[0];
  const featuredArtwork = artworks[0];

  // Lightweight preview payload for fast archive page load (full verses load on detail page)
  const poems = rawPoems.map((p) => ({
    ...p,
    translations: p.translations?.map((t) => ({
      ...t,
      verses: (t.verses || []).slice(0, 2),
    })),
  }));

  return (
    <div className="space-y-14">
      <header className="space-y-4 border-b border-[var(--border-subtle)] pb-6">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-[var(--primary)] font-bold">
          <Music size={16} />
          <span>{isFa ? 'شعر، دکلمه و هنر تجسمی' : 'Poésie & Musique'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
          {isFa
            ? 'شعر و تصویر؛ تجلی دکلمه صوتی و خوشنویسی نوگرا'
            : 'Poésie & Image : Récitation et Calligraphie Synchronisée'}
        </h1>
        <p className="text-sm text-[var(--foreground-muted)] max-w-2xl leading-relaxed">
          {isFa
            ? 'طنین واژگان و رقص قلم‌مو؛ سروده‌های دوزبانه فارسی-فرانسوی دکتر حسن مکارمی همراه با تابلوهای اختصاصی و دکلمه صوتی مؤلف.'
            : 'Dialogue poétique et visuel entre la parole déclamée et la matière calligraphique.'}
        </p>
      </header>

      {/* 1. Synchronized Poetry & Artwork Showcase (شعر و تصویر) */}
      {featuredPoem && (
        <section aria-label="شعر و تصویر همگام" className="space-y-4">
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            {isFa ? '۱. بخش شعر و تصویر (همگام‌سازی صوت و نقاشی‌خط)' : '1. Poésie & Image Synchronisées'}
          </h2>
          <PoetryArtworkSync
            poem={featuredPoem}
            artwork={featuredArtwork}
            locale={locale}
          />
        </section>
      )}

      {/* 2. Complete Archive of Poems (زیرمنوی اشعار /poems-persan/) */}
      <section id="poems-archive" aria-label="دفتر اشعار" className="space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-600 font-bold">
              <Feather size={14} />
              <span>{isFa ? 'زیرمنوی اشعار (/poems-persan/)' : 'Recueil de Poèmes'}</span>
            </div>
            <h2 className="text-2xl font-black text-[var(--foreground)]">
              {isFa
                ? `۲. دفتر کامل اشعار و سروده‌های دکتر حسن مکارمی (${poems.length} شعر)`
                : `2. Archive Complète des Poèmes (${poems.length})`}
            </h2>
          </div>

          <Link
            href={`/${locale}/books?genre=poetry`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline"
          >
            <BookOpen size={14} />
            <span>{isFa ? 'کتاب‌های شعر دوزبانه ←' : 'Livres de poésie →'}</span>
          </Link>
        </div>

        <PaginatedPoemsGrid poems={poems} locale={locale} />
      </section>
    </div>
  );
}
