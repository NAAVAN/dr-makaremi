import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import { getArticles, mapPillarSlugToPillar } from '@/lib/cms';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { PaginatedArticlesGrid } from '@/components/archive/PaginatedArticlesGrid';
import { buildTrilingualMetadata } from '@/lib/seo-helpers';
import type { ContentPillar } from '@makaremi/shared';

const PILLAR_SLUGS: Record<Locale, string[]> = {
  fa: ['psychoanalysis', 'art', 'strategy', 'human-rights'],
  fr: ['psychanalyse', 'psychoanalysis', 'art', 'strategy', 'human-rights'],
  en: ['psychoanalysis', 'art', 'strategy', 'human-rights'],
};

const PILLAR_ARTICLES_META: Record<ContentPillar, { faSeg: string; frSeg: string; title: Record<Locale, string> }> = {
  psychoanalysis: {
    faSeg: 'psychoanalysis',
    frSeg: 'psychanalyse',
    title: {
      fa: 'آرشیو مقالات روانکاوی لکانی و بالینی',
      fr: 'Articles de Psychanalyse Lacanienne & Clinique',
      en: 'Lacanian Psychoanalysis & Clinical Articles Archive',
    },
  },
  art_calligraphy: {
    faSeg: 'art',
    frSeg: 'art',
    title: {
      fa: 'آرشیو مقالات هنر، خوشنویسی و شعر',
      fr: 'Articles sur l’Art, la Calligraphie et la Poésie',
      en: 'Art, Calligraphy & Poetry Articles Archive',
    },
  },
  cultural_strategy: {
    faSeg: 'strategy',
    frSeg: 'strategy',
    title: {
      fa: 'آرشیو مقالات پژوهش، جامعه و مطالعات راهبردی',
      fr: 'Articles de Recherche, Société & Stratégie Culturelle',
      en: 'Cultural Strategy, Research & Society Articles Archive',
    },
  },
  human_rights_dadkhahi: {
    faSeg: 'human-rights',
    frSeg: 'human-rights',
    title: {
      fa: 'آرشیو مقالات و بیانیه‌های حقوق بشر و دادخواهی',
      fr: "Articles & Déclarations Droits de l'Homme (LDDHI)",
      en: 'Human Rights & Transitional Justice Articles Archive',
    },
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; pillar: string }>;
}): Promise<Metadata> {
  const { locale, pillar } = await params;
  if (!isValidLocale(locale)) return {};
  const pillarKey = mapPillarSlugToPillar(pillar);
  if (!pillarKey) return {};
  const info = PILLAR_ARTICLES_META[pillarKey];
  const isFa = locale === 'fa';
  return buildTrilingualMetadata({
    locale,
    path: `/${info.faSeg}/articles`,
    frPath: `/${info.frSeg}/articles`,
    title: info.title[locale],
    description: isFa
      ? `آرشیو کامل مقالات و یادداشت‌های دکتر حسن مکارمی در بخش ${info.title.fa}.`
      : `${info.title[locale]} — Official archive of Dr. Hassan Makaremi.`,
    includeMarkdownTwin: false,
  });
}

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
