import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import { getArticles, mapPillarSlugToPillar } from '@/lib/cms';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { PaginatedArticlesGrid } from '@/components/archive/PaginatedArticlesGrid';

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
  const rawArticles = await getArticles(locale, pillarKey);
  // Strip heavy full-body markdown from listing RSC payload for fast Core Web Vitals
  const articles = rawArticles.map((art) => ({
    ...art,
    translations: art.translations?.map((t) => ({
      ...t,
      body_markdown: '',
    })),
  }));

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

      <PaginatedArticlesGrid
        articles={articles}
        locale={locale}
        pillarSlug={pillar}
      />
    </div>
  );
}
