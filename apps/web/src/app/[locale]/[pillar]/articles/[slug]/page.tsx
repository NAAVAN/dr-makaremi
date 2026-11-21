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
import { buildTrilingualMetadata } from '@/lib/seo-helpers';

export const dynamicParams = true;

export async function generateStaticParams() {
  const articles = await getArticles('fa');
  const params: Array<{ locale: string; pillar: string; slug: string }> = [];

  // Pre-render the top 40 canonical & newest articles statically; all 404 render dynamically on demand
  const preRenderArticles = articles.slice(0, 40);

  for (const locale of SUPPORTED_LOCALES) {
    for (const art of preRenderArticles) {
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

  const faPillar =
    article.pillar === 'psychoanalysis'
      ? 'psychoanalysis'
      : article.pillar === 'art_calligraphy'
        ? 'art'
        : article.pillar === 'cultural_strategy'
          ? 'strategy'
          : 'human-rights';
  const frPillar = article.pillar === 'psychoanalysis' ? 'psychanalyse' : faPillar;
  const pillarSegment = locale === 'fr' ? frPillar : faPillar;

  const academicMeta = buildArticleAcademicMeta(article, locale as Locale);

  return buildTrilingualMetadata({
    locale: locale as Locale,
    path: `/${faPillar}/articles/${slug}`,
    frPath: `/${frPillar}/articles/${slug}`,
    title: trans?.title || article.slug,
    description: trans?.executive_summary?.slice(0, 160) || trans?.title || article.slug,
    ogType: 'article',
    publishedTime: article.published_at || article.created_at,
    modifiedTime: article.updated_at || article.published_at || article.created_at,
    other: {
      ...academicMeta,
    },
  });
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
