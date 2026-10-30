import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import { getArticles, mapPillarSlugToPillar } from '@/lib/cms';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';

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

export default async function PillarArticlesArchivePage({
  params,
}: {
  params: Promise<{ locale: string; pillar: string }>;
}) {
  const { locale, pillar } = (await params) as { locale: Locale; pillar: string };
  if (!isValidLocale(locale)) notFound();

  const pillarKey = mapPillarSlugToPillar(pillar);
  if (!pillarKey) notFound();

  const isFa = locale === 'fa';
  const articles = await getArticles(locale, pillarKey);

  return (
    <div className="space-y-12">
      <nav aria-label="راهنمای مسیر" className="text-xs text-[var(--foreground-muted)]">
        <Link
          href={`/${locale}/${pillar}`}
          className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors font-medium"
        >
          {isFa ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          <span>{isFa ? 'بازگشت به پورتال ستون' : 'Retour au portail'}</span>
        </Link>
      </nav>

      <header className="space-y-4 border-b border-[var(--border-subtle)] pb-6">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-[var(--primary)] font-bold">
          <FileText size={16} />
          <span>{isFa ? 'آرشیو مقالات' : 'Articles'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
          {isFa
            ? 'آرشیو مقالات و جستارهای پژوهشی'
            : 'Articles et Essais Cliniques'}
        </h1>
      </header>

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
                <h2 className="text-lg font-bold text-[var(--foreground)] leading-snug">
                  <Link
                    href={`/${locale}/${pillar}/articles/${art.slug}`}
                    className="hover:text-[var(--primary)] transition-colors"
                  >
                    {trans?.title || art.slug}
                  </Link>
                </h2>
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
    </div>
  );
}
