import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Sparkles, FileText, ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { getArticles, getBooks, mapPillarSlugToPillar } from '@/lib/cms';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import type { ContentPillar } from '@makaremi/shared';

const PILLAR_SLUGS: Record<Locale, string[]> = {
  fa: ['psychoanalysis', 'art', 'strategy', 'human-rights'],
  fr: ['psychanalyse', 'psychoanalysis', 'art', 'strategy', 'human-rights'],
  en: ['psychoanalysis', 'art', 'strategy', 'human-rights'],
};

export async function generateStaticParams() {
  const params: Array<{ locale: string; pillar: string }> = [];
  for (const locale of SUPPORTED_LOCALES) {
    for (const pillar of PILLAR_SLUGS[locale]) {
      params.push({ locale, pillar });
    }
  }
  return params;
}

export default async function PillarHubPage({
  params,
}: {
  params: Promise<{ locale: string; pillar: string }>;
}) {
  const { locale, pillar } = (await params) as { locale: Locale; pillar: string };
  if (!isValidLocale(locale)) notFound();

  const pillarKey = mapPillarSlugToPillar(pillar);
  if (!pillarKey) notFound();

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';

  const articles = await getArticles(locale, pillarKey);
  const allBooks = await getBooks(locale);
  const pillarBooks = allBooks.filter((b) => b.pillar === pillarKey);

  const pillarTitles: Record<ContentPillar, { fa: string; fr: string; en: string }> = {
    psychoanalysis: {
      fa: 'روانکاوی لکانی و بالین',
      fr: 'Psychanalyse Lacanienne',
      en: 'Lacanian Psychoanalysis',
    },
    art_calligraphy: {
      fa: 'هنر و خوشنویسی مدرن',
      fr: 'Art & Calligraphie Contemporaine',
      en: 'Modern Art & Calligraphy',
    },
    cultural_strategy: {
      fa: 'مطالعات راهبردی و فرهنگ',
      fr: 'Stratégie Culturelle & Politique',
      en: 'Cultural & Political Strategy',
    },
    human_rights_dadkhahi: {
      fa: 'حقوق بشر و دادخواهی',
      fr: "Droits de l'Homme & Justice Transitionnelle",
      en: 'Human Rights & Transitional Justice',
    },
  };

  const currentTitle = pillarTitles[pillarKey][locale];

  return (
    <div className="space-y-12">
      {/* Pillar Hub Header with Single H1 */}
      <header className="space-y-4 border-b border-[var(--border-subtle)] pb-6">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-[var(--primary)] font-bold">
          <Sparkles size={16} />
          <span>{isFa ? 'پورتال تخصصی ستون اندیشه' : 'Portail Thématique'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
          {currentTitle}
        </h1>
        <p className="text-sm text-[var(--foreground-muted)] max-w-2xl leading-relaxed">
          {isFa
            ? 'آرشیو متمرکز مقالات پژوهشی، کتاب‌ها، مفاهیم واژه‌نامه تخصصی و بیانیه‌های دکتر حسن مکارمی در این ستون محتوایی.'
            : 'Archives thématiques d’articles, monographies et concepts cliniques.'}
        </p>
      </header>

      {/* Articles Section */}
      <section aria-label="مقالات این ستون" className="space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            {isFa ? 'مقالات و جستارهای پژوهشی' : 'Articles & Essais Cliniques'}
          </h2>
          <Link
            href={`/${locale}/${pillar}/articles`}
            className="text-xs font-bold text-[var(--primary)] hover:underline"
          >
            {isFa ? 'مشاهده همه مقالات ←' : 'Tous les articles →'}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((art) => {
            const trans =
              art.translations?.find((t) => t.languages_code.startsWith(locale)) ||
              art.translations?.[0];

            return (
              <article
                key={art.id}
                className="p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:shadow-lg transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-[var(--foreground)] leading-snug">
                    <Link
                      href={`/${locale}/${pillar}/articles/${art.slug}`}
                      className="hover:text-[var(--primary)] transition-colors"
                    >
                      {trans?.title || art.slug}
                    </Link>
                  </h3>
                  <p className="text-xs text-[var(--foreground-muted)] leading-relaxed line-clamp-3">
                    {trans?.executive_summary}
                  </p>
                </div>

                <div className="border-t border-[var(--border-subtle)] pt-3 flex items-center justify-between text-xs">
                  <span className="text-[var(--foreground-muted)] font-mono text-[11px]">
                    {art.published_at?.slice(0, 10)}
                  </span>
                  <Link
                    href={`/${locale}/${pillar}/articles/${art.slug}`}
                    className="font-bold text-[var(--primary)] hover:underline"
                  >
                    {isFa ? 'مطالعه متن کامل ←' : 'Lire →'}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Pillar Books Section */}
      {pillarBooks.length > 0 && (
        <section aria-label="کتاب‌های مرتبط با این ستون" className="space-y-6 pt-4">
          <h2 className="text-xl font-bold text-[var(--foreground)] border-b border-[var(--border-subtle)] pb-3">
            {isFa ? 'کتاب‌های مرتبط' : 'Livres Associés'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillarBooks.map((b) => {
              const bTrans =
                b.translations?.find((t) => t.languages_code.startsWith(locale)) ||
                b.translations?.[0];

              return (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-base font-bold text-[var(--foreground)]">
                      <Link href={`/${locale}/books/${b.slug}`} className="hover:text-[var(--primary)] transition-colors">
                        {bTrans?.title || b.slug}
                      </Link>
                    </h3>
                    <p className="text-xs text-[var(--foreground-muted)] line-clamp-2 mt-1">
                      {bTrans?.synopsis}
                    </p>
                  </div>

                  <Link
                    href={`/${locale}/books/${b.slug}`}
                    className="text-xs font-bold text-[var(--primary)] hover:underline"
                  >
                    {isFa ? 'مشاهده کتاب ←' : 'Voir le livre →'}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
