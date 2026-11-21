import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { FileText, Download, ArrowRight, ArrowLeft } from 'lucide-react';
import { getArticles } from '@/lib/cms';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { PaginatedArticlesGrid } from '@/components/archive/PaginatedArticlesGrid';
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
    path: '/articles',
    title: isFa
      ? 'آرشیو جامع مقالات، خبر و بلاگ | دکتر حسن مکارمی'
      : isFr
        ? 'Archives Complètes des Articles & Actualités | Dr Hassan Makaremi'
        : 'Complete Articles, Essays & News Archive | Dr. Hassan Makaremi',
    description: isFa
      ? 'مجموعه کامل ۴۰۴ مقاله، یادداشت پژوهشی، اخبار و جستارهای دکتر حسن مکارمی در حوزه‌های روانکاوی لکانی، فرهنگ و راهبرد، هنر خوشنویسی و حقوق بشر.'
      : 'Archive intégrale de plus de 400 articles, essais et actualités du Dr Hassan Makaremi.',
  });
}

export default async function AllArticlesArchivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  if (!isValidLocale(locale)) notFound();

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const rawArticles = await getArticles(locale);

  // Strip heavy full-body markdown from listing RSC payload for fast Core Web Vitals
  const articles = rawArticles.map((art) => ({
    ...art,
    translations: art.translations?.map((t) => ({
      ...t,
      body_markdown: '',
    })),
  }));

  return (
    <div className="space-y-10">
      <link
        rel="alternate"
        type="text/markdown"
        href={`/${locale}/articles.md`}
        title="Markdown Twin"
      />

      <nav
        aria-label="راهنمای مسیر"
        className="flex items-center justify-between text-xs text-[var(--foreground-muted)]"
      >
        <Link
          href={`/${locale}`}
          className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors font-medium"
        >
          {isFa ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          <span>{isFa ? 'بازگشت به صفحه اول' : isFr ? 'Retour à l’accueil' : 'Back to Home'}</span>
        </Link>

        <Link
          href={`/${locale}/articles.md`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-mono px-2.5 py-1 rounded-md bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
        >
          <Download size={12} />
          <span>.md (AEO / Index)</span>
        </Link>
      </nav>

      {/* Strict Single H1 */}
      <header className="space-y-4 border-b border-[var(--border-subtle)] pb-6">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-[var(--primary)] font-bold">
          <FileText size={16} />
          <span>
            {isFa
              ? `خبر، بلاگ و آرشیو یکپارچه مقالات (${articles.length} اثر)`
              : isFr
                ? `Actualités, Blog & Archives (${articles.length} articles)`
                : `News, Blog & Complete Articles (${articles.length})`}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
          {isFa
            ? 'آرشیو جامع مقالات، جستارها و اخبار دکتر حسن مکارمی'
            : isFr
              ? 'Archives Complètes des Articles, Essais & Actualités'
              : 'Complete Archive of Essays, Research Articles & News'}
        </h1>

        <p className="text-sm text-[var(--foreground-muted)] max-w-3xl leading-relaxed">
          {isFa
            ? 'دسترسی یکپارچه به تمام مقالات، یادداشت‌ها و اخبار منتشرشده در هر چهار ستون اندیشه (روانکاوی لکانی، مطالعات راهبردی و جامعه، هنر و حافظ، و حقوق بشر و دادخواهی) با فیلتر زنده بر اساس موضوع، دسته‌بندی وردپرس و زبان.'
            : isFr
              ? 'Accès unifié à l’ensemble des articles, essais et actualités publiés dans les quatre domaines : psychanalyse, recherche & société, art & poésie, et droits humains.'
              : 'Unified access to all migrated essays, clinical articles, and news across psychoanalysis, strategy & society, art & poetry, and human rights.'}
        </p>
      </header>

      <PaginatedArticlesGrid articles={articles} locale={locale} pillarSlug="all" />
    </div>
  );
}
