import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Sparkles, Video, BookOpen, Palette, Feather, ShieldAlert, FileCheck2 } from 'lucide-react';
import {
  getArticles,
  getBooks,
  getVideoSpeeches,
  mapPillarSlugToPillar,
} from '@/lib/cms';
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

  const [articles, allBooks, pillarVideos] = await Promise.all([
    getArticles(locale, pillarKey),
    getBooks(locale),
    getVideoSpeeches(locale, pillarKey),
  ]);
  const pillarBooks = allBooks.filter((b) => b.pillar === pillarKey);

  const pillarTitles: Record<ContentPillar, { fa: string; fr: string; en: string }> = {
    psychoanalysis: {
      fa: 'روانکاوی لکانی و بالین',
      fr: 'Psychanalyse Lacanienne',
      en: 'Lacanian Psychoanalysis',
    },
    art_calligraphy: {
      fa: 'هنر، خوشنویسی، شعر و حافظ',
      fr: 'Art, Calligraphie & Poésie',
      en: 'Modern Art, Calligraphy & Poetry',
    },
    cultural_strategy: {
      fa: 'مطالعات راهبردی، پژوهش و جامعه',
      fr: 'Stratégie Culturelle, Recherche & Société',
      en: 'Cultural Strategy, Research & Society',
    },
    human_rights_dadkhahi: {
      fa: 'حقوق بشر و دادخواهی',
      fr: "Droits de l'Homme & Justice Transitionnelle",
      en: 'Human Rights & Transitional Justice',
    },
  };

  const currentTitle = pillarTitles[pillarKey][locale];

  const quickLinks =
    pillarKey === 'psychoanalysis'
      ? [
          { href: `/${locale}/${pillar}/articles`, label: isFa ? `همه ${articles.length} مقاله روانکاوی` : `${articles.length} Articles`, icon: Sparkles },
          { href: `/${locale}/media?series=dar-ravanpajoohi-ba-makaremi#videos-archive`, label: isFa ? 'مجموعه «در روان‌پژوهی»' : 'Série Recherche Psy.', icon: Video },
          { href: `/${locale}/media?series=negah-e-ravankav#videos-archive`, label: isFa ? 'مجموعه «نگاه روانکاو»' : 'Le Regard du Psy.', icon: Video },
          { href: `/${locale}/glossary`, label: isFa ? 'واژه‌نامه تحلیلی لکانی' : 'Glossaire Lacanien', icon: BookOpen },
          { href: `/${locale}/about/konferans-ravankavi-ir`, label: isFa ? 'کنفرانس‌های روانکاوی' : 'Conférences', icon: FileCheck2 },
        ]
      : pillarKey === 'art_calligraphy'
        ? [
            { href: `/${locale}/gallery`, label: isFa ? 'گالری IIIF و ۲۹ مجموعه تابلو' : 'Galerie IIIF', icon: Palette },
            { href: `/${locale}/gallery#exhibitions-hall`, label: isFa ? '۲۷ نمایشگاه بین‌المللی' : '27 Expositions', icon: Palette },
            { href: `/${locale}/hafez`, label: isFa ? 'قطب حافظ‌پژوهی' : 'Pôle Hafez', icon: Feather },
            { href: `/${locale}/poetry`, label: isFa ? 'دفتر ۳۰۰ شعر و تصویر' : '300 Poèmes', icon: Feather },
            { href: `/${locale}/${pillar}/articles`, label: isFa ? `${articles.length} مقاله هنر` : `${articles.length} Articles Art`, icon: Sparkles },
          ]
        : pillarKey === 'cultural_strategy'
          ? [
              { href: `/${locale}/${pillar}/articles`, label: isFa ? `همه ${articles.length} مقاله راهبرد و جامعه` : `${articles.length} Articles`, icon: Sparkles },
              { href: `/${locale}/about?tab=conferences`, label: isFa ? 'کنفرانس‌های پژوهش و جامعه' : 'Conférences', icon: FileCheck2 },
              { href: `/${locale}/books?genre=strategy`, label: isFa ? 'کتاب‌های راهبردی' : 'Livres Stratégie', icon: BookOpen },
              { href: `/${locale}/books?genre=culture`, label: isFa ? 'کتاب‌های فرهنگ ایران' : 'Livres Culture', icon: BookOpen },
            ]
          : [
              { href: `/${locale}/${pillar}/articles`, label: isFa ? `همه ${articles.length} مقاله و بیانیه` : `${articles.length} Articles`, icon: ShieldAlert },
              { href: `/${locale}/about?tab=references`, label: isFa ? 'منابع و اسناد LDDHI / سازمان ملل' : 'Références LDDHI / ONU', icon: FileCheck2 },
              { href: `/${locale}/media?pillar=human_rights_dadkhahi#videos-archive`, label: isFa ? `${pillarVideos.length} سخنرانی دادخواهی` : `${pillarVideos.length} Discours`, icon: Video },
              { href: `/${locale}/about/conference-26-khavaran-matn-ir`, label: isFa ? 'سند دادخواهی خاوران ۶۷' : 'Mémoire Khavaran 1988', icon: FileCheck2 },
            ];

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
            ? `آرشیو متمرکز ${articles.length} مقاله پژوهشی، ${pillarBooks.length} کتاب، ${pillarVideos.length} ویدیو و سخنرانی و اسناد مرتبط در این ستون محتوایی.`
            : `Archives thématiques : ${articles.length} articles, ${pillarBooks.length} livres et ${pillarVideos.length} vidéos.`}
        </p>

        {/* Sub-hub Quick Access Links */}
        <nav aria-label="دسترسی سریع این ستون" className="flex flex-wrap items-center gap-2 pt-2">
          {quickLinks.map((ql) => {
            const Icon = ql.icon;
            return (
              <Link
                key={ql.href}
                href={ql.href}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--surface-sunken)] hover:bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
              >
                <Icon size={14} className="text-[var(--primary)]" />
                <span>{ql.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Articles Section */}
      <section aria-label="مقالات این ستون" className="space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <h2 className="text-xl font-bold text-[var(--foreground)]">
            {isFa
              ? `مقالات و جستارهای پژوهشی (${articles.length} اثر)`
              : `Articles & Essais (${articles.length})`}
          </h2>
          <Link
            href={`/${locale}/${pillar}/articles`}
            className="text-xs font-bold text-[var(--primary)] hover:underline"
          >
            {isFa ? `مشاهده همه ${articles.length} مقاله ←` : `Tous les ${articles.length} articles →`}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.slice(0, 12).map((art) => {
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

      {/* Pillar Videos & Speeches Section */}
      {pillarVideos.length > 0 && (
        <section aria-label="ویدیوها و سخنرانی‌های این ستون" className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              {isFa
                ? `ویدیوها و سخنرانی‌های این ستون (${pillarVideos.length} ویدیو)`
                : `Vidéos & Conférences (${pillarVideos.length})`}
            </h2>
            <Link
              href={`/${locale}/media?pillar=${pillarKey}#videos-archive`}
              className="text-xs font-bold text-[var(--primary)] hover:underline"
            >
              {isFa ? `مشاهده همه ${pillarVideos.length} ویدیو ←` : `Toutes les ${pillarVideos.length} vidéos →`}
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {pillarVideos.slice(0, 6).map((vid) => {
              const vTrans =
                vid.translations?.find((t) => t.languages_code.startsWith(locale)) ||
                vid.translations?.[0];
              const vHref =
                vid.pillar === 'human_rights_dadkhahi'
                  ? `/${locale}/human-rights/speeches/${vid.slug}`
                  : `/${locale}/media/videos/${vid.slug}`;
              return (
                <Link
                  key={vid.id}
                  href={vHref}
                  className="group rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--primary)] hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                >
                  {vid.thumbnail_url && (
                    <div className="aspect-video w-full overflow-hidden bg-neutral-900">
                      <img
                        src={vid.thumbnail_url}
                        alt={vTrans?.title || vid.slug}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-[var(--foreground-muted)]">
                        {vid.event_date}
                      </span>
                      <h3 className="text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] leading-snug line-clamp-2 mt-1">
                        {vTrans?.title || vid.slug}
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-[var(--primary)]">
                      {isFa ? 'مشاهده ویدیو ←' : 'Regarder →'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Pillar Books Section */}
      {pillarBooks.length > 0 && (
        <section aria-label="کتاب‌های مرتبط با این ستون" className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              {isFa ? `کتاب‌های مرتبط (${pillarBooks.length} عنوان)` : `Livres Associés (${pillarBooks.length})`}
            </h2>
            <Link
              href={`/${locale}/books?pillar=${pillarKey}`}
              className="text-xs font-bold text-[var(--primary)] hover:underline"
            >
              {isFa ? 'مشاهده در کتاب‌خانه 3D ←' : 'Bibliothèque 3D →'}
            </Link>
          </div>

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
