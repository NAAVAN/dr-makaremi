'use client';

import React from 'react';
import Link from 'next/link';
import { motion, MotionConfig, useReducedMotion } from 'motion/react';
import { BookOpen, Feather, GraduationCap, ArrowLeft, ArrowRight } from 'lucide-react';
import type { Locale } from '@makaremi/shared';
import { CalligraphyInkStroke } from './CalligraphyInkStroke';
import { HeroPortraitFrame } from './HeroPortraitFrame';

interface MuseumHeroSectionProps {
  locale: Locale;
  stats: {
    articles: number;
    books: number;
    exhibitions: number;
    videos: number;
  };
  backdropArtworkUrl?: string | null;
  backdropArtworkTitle?: string;
}

/**
 * Asymmetric 12-Column Museum Hero Section.
 * - Strictly preserves Dr. Hassan Makaremi's exact authentic verbatim greeting (0 word changes).
 * - Guarantees immediate SSR paint for H1 & portrait (zero LCP delay).
 * - Pairs Kinetic Calligraphy Ink Stroke + 3-Layer Archival Portrait Passe-Partout.
 */
export function MuseumHeroSection({
  locale,
  stats,
  backdropArtworkUrl,
  backdropArtworkTitle,
}: MuseumHeroSectionProps) {
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const prefersReduced = useReducedMotion();

  const easeEmil: [number, number, number, number] = [0.23, 1, 0.32, 1];

  const ledgerMetrics = [
    {
      value: stats.articles,
      label: isFa ? 'مقاله و جستار' : isFr ? 'Articles' : 'Essays',
      href: `/${locale}/articles`,
    },
    {
      value: stats.books,
      label: isFa ? 'کتاب و ترجمه' : isFr ? 'Ouvrages' : 'Books',
      href: `/${locale}/books`,
    },
    {
      value: stats.exhibitions,
      label: isFa ? 'نمایشگاه جهانی' : isFr ? 'Expositions' : 'Exhibitions',
      href: `/${locale}/gallery`,
    },
    {
      value: stats.videos,
      label: isFa ? 'فیلم و گفتار' : isFr ? 'Conférences' : 'Lectures',
      href: `/${locale}/media`,
    },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <section
        aria-label={
          isFa
            ? 'معرفی و افق فکری دکتر حسن مکارمی'
            : isFr
              ? 'Présentation et horizon de pensée du Dr Hassan Makaremi'
              : 'Introduction and intellectual archive of Dr. Hassan Makaremi'
        }
        className="relative rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] overflow-hidden shadow-[var(--shadow-md)] archival-paper-weave"
      >
        {/* Subtle Kinetic Calligraphy Ink Stroke behind right/visual hemisphere */}
        <CalligraphyInkStroke className="absolute -top-6 end-0 w-[340px] sm:w-[540px] lg:w-[680px] h-auto opacity-85" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center p-6 sm:p-10 lg:p-14">
          {/* Editorial Typography Column (7 cols on desktop) */}
          <div className="lg:col-span-7 space-y-6 order-2 lg:order-1">
            {/* Restrained Archival Eyebrow */}
            <motion.div
              initial={prefersReduced ? false : { opacity: 0.4, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: easeEmil }}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs text-[var(--foreground-muted)] font-medium"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] shrink-0" />
              <span>
                {isFa
                  ? 'آرشیو رسمی آثار · روانکاوی، هنر، راهبرد و حقوق بشر'
                  : isFr
                    ? 'Archives officielles · Psychanalyse, Art, Stratégie & Droits humains'
                    : 'Official Archive · Psychoanalysis, Art, Strategy & Human Rights'}
              </span>
            </motion.div>

            {/* STRICT SINGLE H1 PER PAGE — immediate opacity:1 for fast LCP */}
            <motion.h1
              initial={prefersReduced ? false : { y: 10 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.55, ease: easeEmil }}
              className="font-display text-center font-black text-[var(--foreground)] tracking-tight flex flex-col items-center gap-2 sm:gap-3"
            >
              <span className="block text-4xl sm:text-[3.4rem] lg:text-[3.9rem] leading-[1.2] sm:whitespace-nowrap">
                {isFa
                  ? 'دکتر حسن مکارمی'
                  : isFr
                    ? 'Dr Hassan Makaremi'
                    : 'Dr. Hassan Makaremi'}
              </span>
              <span className="block text-3xl sm:text-5xl lg:text-[3.25rem] leading-[1.3] text-balance">
                {isFa
                  ? 'افق تفکر، هنر و دادخواهی'
                  : isFr
                    ? 'Psychanalyse, Art et Justice'
                    : 'Psychoanalysis, Art & Justice'}
              </span>
            </motion.h1>

            {/* EXACT VERBATIM AUTHOR GREETING (Zero words altered from Dr. Makaremi's original site) */}
            <motion.div
              initial={prefersReduced ? false : { opacity: 0.5, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: easeEmil }}
              className="rounded-2xl bg-[var(--surface-artifact)]/90 border border-[var(--border-subtle)] p-5 sm:p-6 space-y-3 max-w-2xl"
            >
              {isFa ? (
                <>
                  <p className="text-sm sm:text-base text-[var(--text-primary)] leading-[1.95]">
                    به سایت من خوش آمدید. در این سایت از چهار دامنه فعالیت هایم با شما سخن می گویم
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs sm:text-sm text-[var(--text-secondary)]">
                    <li>- هنرو ادبیات: خوشنویسی و نقاشی وشعر</li>
                    <li>- ایران: حقوق بشر</li>
                    <li>- خدمات راهبردی: مدرنیزاسیون و توسعه</li>
                    <li>- روانکاوی</li>
                  </ul>
                  <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed pt-1">
                    و همچنین سفرهایی که زندگی را می سازند: خانواده و دوستان و ..
                  </p>
                  <p className="font-serif text-base sm:text-lg font-bold text-[var(--primary)] pt-1 flex items-center justify-between border-t border-[var(--border-subtle)]">
                    <span>سفر خوش.</span>
                    <span className="text-sm sm:text-base text-[var(--foreground)]">حسن مکارمی</span>
                  </p>
                </>
              ) : isFr ? (
                <>
                  <p className="font-serif text-base sm:text-lg text-[var(--text-primary)] leading-relaxed">
                    Dr. Hassan Makaremi, psychanalyste, peintre et calligraphe, est né à Chiraz, Iran, en 1950. Depuis 1983, il vit et travaille en France. Il a organisé plus de vingt quatre expositions de ses œuvres en France, aux États-Unis, en Russie, au Cuba et au Maroc.
                  </p>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    En tant que spécialiste de la stratégie, il collabore avec le Centre d’Études Diplomatiques et Stratégiques de Paris et l’Institut d’Administration des Entreprises de Paris - Université Paris1 Panthéon Sorbonne.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-serif text-base sm:text-lg text-[var(--text-primary)] leading-relaxed">
                    Dr. Hassan Makaremi — clinical Lacanian psychoanalyst, painter, modern Persian calligrapher, and human rights defender — was born in Shiraz, Iran, in 1950 and has lived and worked in France since 1983.
                  </p>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    Explore his four fields of enquiry: Art and Literature (calligraphy, painting, poetry, and Hafez), Iran and Human Rights, Strategic Modernisation (Sorbonne), and Clinical Lacanian Psychoanalysis.
                  </p>
                </>
              )}
            </motion.div>

            {/* Clear CTA Hierarchy (Primary + Secondary + Quiet Link) */}
            <motion.div
              initial={prefersReduced ? false : { opacity: 0.4, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16, ease: easeEmil }}
              className="flex flex-wrap items-center gap-3.5 pt-1"
            >
              <Link
                href={`/${locale}/books`}
                className="interactive-tap inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-semibold text-xs sm:text-sm shadow-[var(--shadow-sm)] transition-colors"
              >
                <BookOpen size={16} />
                <span>
                  {isFa
                    ? `مرور کتاب‌خانه (${stats.books} عنوان)`
                    : isFr
                      ? `Parcourir la bibliothèque (${stats.books})`
                      : `Explore Library (${stats.books} Books)`}
                </span>
              </Link>

              <Link
                href={`/${locale}/hafez`}
                className="interactive-tap inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--surface-sunken)] hover:bg-[var(--surface-canvas)] border border-[var(--border-medium)] text-[var(--foreground)] font-semibold text-xs sm:text-sm transition-colors"
              >
                <Feather size={16} className="text-[var(--accent-gold)]" />
                <span>
                  {isFa
                    ? 'حافظ‌پژوهی و دگرشنیدن'
                    : isFr
                      ? 'Pôle Hafez & Poésie'
                      : 'Hafez & Poetry'}
                </span>
              </Link>

              <Link
                href={`/${locale}/about`}
                className="inline-flex items-center gap-1.5 px-2 py-2 text-xs sm:text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors"
              >
                <GraduationCap size={15} className="text-[var(--primary)]" />
                <span>
                  {isFa
                    ? '۶ دانشگاه و مصاحبه‌ها'
                    : isFr
                      ? '6 Universités & Entretiens'
                      : '6 Universities & Interviews'}
                </span>
                {isFa ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
              </Link>
            </motion.div>

            {/* Quiet Archival Stats Strip */}
            <motion.div
              initial={prefersReduced ? false : { opacity: 0.4, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.24, ease: easeEmil }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[var(--border-subtle)] max-w-2xl"
            >
              {ledgerMetrics.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  className="group flex flex-col gap-0.5 py-1 transition-colors"
                >
                  <span className="font-mono text-xl sm:text-2xl font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                    {m.value}
                  </span>
                  <span className="text-[11px] text-[var(--foreground-muted)]">
                    {m.label}
                  </span>
                </Link>
              ))}
            </motion.div>
          </div>

          {/* Museum Portrait Column (5 cols on desktop) */}
          <div className="lg:col-span-5 order-1 lg:order-2 flex items-center justify-center">
            <HeroPortraitFrame
              locale={locale}
              backdropArtworkUrl={backdropArtworkUrl}
              backdropArtworkTitle={backdropArtworkTitle}
            />
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}
