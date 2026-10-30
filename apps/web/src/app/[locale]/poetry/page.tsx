import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Music, Feather, BookOpen } from 'lucide-react';
import { getPoems, getArtworks } from '@/lib/cms';
import { isValidLocale, type Locale } from '@/lib/i18n';
import { PoetryArtworkSync } from '@/components/gallery/PoetryArtworkSync';

export default async function PoetryOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  if (!isValidLocale(locale)) notFound();

  const isFa = locale === 'fa';
  const poems = await getPoems(locale);
  const artworks = await getArtworks(locale);

  const featuredPoem = poems[0];
  const featuredArtwork = artworks[0];

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
              {isFa ? '۲. دفتر اشعار و سروده‌های دکتر حسن مکارمی' : '2. Archive des Poèmes'}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {poems.map((p) => {
            const trans =
              p.translations?.find((t) => t.languages_code.startsWith(locale)) ||
              p.translations?.[0];

            return (
              <article
                key={p.id}
                className="p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:shadow-lg transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)] font-mono">
                    <span>{p.creation_year || 2015}</span>
                    <span>{isFa ? 'سروده و دکلمه' : 'Poème'}</span>
                  </div>

                  <h3 className="text-lg font-bold text-[var(--foreground)]">
                    <Link
                      href={`/${locale}/poetry/poems/${p.slug}`}
                      className="hover:text-[var(--primary)] transition-colors"
                    >
                      {trans?.title || p.slug}
                    </Link>
                  </h3>

                  {trans?.verses && trans.verses[0] && (
                    <blockquote className="p-3 rounded-xl bg-[var(--surface-sunken)] text-xs font-serif leading-relaxed space-y-1 text-[var(--foreground)]">
                      <p>{trans.verses[0].hemistich_a}</p>
                      {trans.verses[0].hemistich_b && (
                        <p className="opacity-80">{trans.verses[0].hemistich_b}</p>
                      )}
                    </blockquote>
                  )}

                  <p className="text-xs text-[var(--foreground-muted)] line-clamp-2">
                    {trans?.commentary_markdown}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--border-subtle)] flex justify-end text-xs">
                  <Link
                    href={`/${locale}/poetry/poems/${p.slug}`}
                    className="font-bold text-[var(--primary)] hover:underline"
                  >
                    {isFa ? 'متن کامل شعر و دکلمه ←' : 'Lire le poème →'}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
