import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import {
  getArticles,
  getArticleBySlug,
  getLacanianGlossary,
  mapPillarSlugToPillar,
} from '@/lib/cms';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { ArticleReader } from '@/components/articles/ArticleReader';
import { JsonLdGraph } from '@/components/seo/JsonLdGraph';
import {
  buildArticleNode,
  buildBreadcrumbNode,
  buildFullGraph,
} from '@/lib/schema-org';
import { buildArticleAcademicMeta } from '@/lib/academic-metadata';

export async function generateStaticParams() {
  const articles = await getArticles('fa');
  const params: Array<{ locale: string; pillar: string; slug: string }> = [];

  for (const locale of SUPPORTED_LOCALES) {
    for (const art of articles) {
      if (art.pillar === 'psychoanalysis') {
        const pillarSlugs = locale === 'fr' ? ['psychanalyse', 'psychoanalysis'] : ['psychoanalysis'];
        for (const p of pillarSlugs) {
          params.push({ locale, pillar: p, slug: art.slug });
        }
      } else if (art.pillar === 'art_calligraphy') {
        params.push({ locale, pillar: 'art', slug: art.slug });
      } else if (art.pillar === 'cultural_strategy') {
        params.push({ locale, pillar: 'strategy', slug: art.slug });
      } else if (art.pillar === 'human_rights_dadkhahi') {
        params.push({ locale, pillar: 'human-rights', slug: art.slug });
      }
    }
  }

  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; pillar: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await getArticleBySlug(slug, locale as Locale);
  if (!article) return {};

  const trans =
    article.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    article.translations?.[0];

  const pillarSegment =
    article.pillar === 'psychoanalysis'
      ? locale === 'fr'
        ? 'psychanalyse'
        : 'psychoanalysis'
      : article.pillar === 'art_calligraphy'
      ? 'art'
      : article.pillar === 'cultural_strategy'
      ? 'strategy'
      : 'human-rights';

  const academicMeta = buildArticleAcademicMeta(article, locale as Locale);

  return {
    title: trans?.title || article.slug,
    description: trans?.executive_summary?.slice(0, 160),
    alternates: {
      canonical: `https://makaremi.com/${locale}/${pillarSegment}/articles/${slug}`,
      languages: {
        'fa-IR': `https://makaremi.com/fa/${pillarSegment}/articles/${slug}`,
        'fr-FR': `https://makaremi.com/fr/${pillarSegment}/articles/${slug}`,
        'en-US': `https://makaremi.com/en/${pillarSegment}/articles/${slug}`,
        'x-default': `https://makaremi.com/fa/${pillarSegment}/articles/${slug}`,
      },
      types: {
        'text/markdown': `https://makaremi.com/${locale}/${pillarSegment}/articles/${slug}.md`,
      },
    },
    other: {
      ...academicMeta,
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; pillar: string; slug: string }>;
}) {
  const { locale, pillar, slug } = (await params) as {
    locale: Locale;
    pillar: string;
    slug: string;
  };
  if (!isValidLocale(locale)) notFound();

  const pillarKey = mapPillarSlugToPillar(pillar);
  if (!pillarKey) notFound();

  const article = await getArticleBySlug(slug, locale);
  if (!article || article.pillar !== pillarKey) notFound();

  const isFa = locale === 'fa';
  const glossaryTerms = await getLacanianGlossary();
  const trans =
    article.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    article.translations?.[0];

  const articleNode = buildArticleNode(article, locale);
  const breadcrumbNode = buildBreadcrumbNode([
    { name: isFa ? 'خانه' : 'Home', item: `https://makaremi.com/${locale}` },
    { name: article.pillar, item: `https://makaremi.com/${locale}/${pillar}/articles` },
    { name: trans?.title || slug, item: `https://makaremi.com/${locale}/${pillar}/articles/${slug}` },
  ]);
  const jsonLdGraph = buildFullGraph({
    locale,
    items: [articleNode, breadcrumbNode],
  });

  return (
    <div className="space-y-10">
      <JsonLdGraph data={jsonLdGraph} />
      <nav aria-label="راهنمای مسیر" className="text-xs text-[var(--foreground-muted)]">
        <Link
          href={`/${locale}/${pillar}/articles`}
          className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors font-medium"
        >
          {isFa ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          <span>{isFa ? 'بازگشت به مقالات' : 'Retour aux articles'}</span>
        </Link>
      </nav>

      <ArticleReader
        article={article}
        translation={trans}
        glossaryTerms={glossaryTerms}
        locale={locale}
      />
    </div>
  );
}
