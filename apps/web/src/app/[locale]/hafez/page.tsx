import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  Feather,
  BookOpen,
  Video,
  Palette,
  Sparkles,
  Download,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import {
  getBooks,
  getArticles,
  getVideoSpeeches,
  getArchivePages,
  VIDEO_SERIES_CATALOG,
  THEMATIC_GALLERIES,
} from '@/lib/cms';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { Book3DShowcase } from '@/components/books/Book3DShowcase';
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
    path: '/hafez',
    title: isFa
      ? 'حافظ‌پژوهی و دیگرشنیدن حافظ | دکتر حسن مکارمی'
      : isFr
        ? 'Études Haféziennes : Hafez par Hafez | Dr Hassan Makaremi'
        : 'Hafezology & Listening Differently to Hafez | Dr. Hassan Makaremi',
    description: isFa
      ? 'قطب حافظ‌پژوهی دکتر حسن مکارمی: کتاب‌های «چند گفتار در دیگر شنیدن حافظ»، «نگرشی دیگر بر راز حافظ»، «Hafez par Hafez (لارماتان)» و مجموعه ویدیویی «صدای سخن عشق».'
      : 'Travaux du Dr Hassan Makaremi sur Hafez de Chiraz : livres Hafez par Hafez, séminaires et calligraphies.',
  });
}

export default async function HafezologyHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  if (!isValidLocale(locale)) notFound();

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';

  const [allBooks, allVideos, allArticles, archivePages] = await Promise.all([
    getBooks(locale),
    getVideoSpeeches(locale),
    getArticles(locale),
    getArchivePages(locale),
  ]);

  const hafezBooks = allBooks.filter(
    (b) => b.slug.includes('hafez') || b.genre_key === 'hafez'
  );
  const hafezVideos = allVideos.filter(
    (v) => v.series_slug === 'sedaye-sokhan-eshgh-hafez'
  );
  const hafezArticles = allArticles
    .filter((a) => {
      const tr =
        a.translations?.find((t) => t.languages_code.startsWith(locale)) ||
        a.translations?.[0];
      return /حافظ|hafez|hâfez/i.test(`${tr?.title || ''} ${(a.categories || []).join(' ')}`);
    })
    .slice(0, 6);
  const hafezConferences = archivePages.filter((p) =>
    ['fa-conf-hafez-didar', 'poesie-hafez-do-ajahan-ir', 'rfi-hafez-ir'].includes(p.slug)
  );

  const primaryHafezBook = hafezBooks[0] || allBooks[0];
  const primaryTrans =
    primaryHafezBook?.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    primaryHafezBook?.translations?.[0];

  const hafezVideoSeries = VIDEO_SERIES_CATALOG.find(
    (s) => s.slug === 'sedaye-sokhan-eshgh-hafez'
  );
  const hafezGallery = THEMATIC_GALLERIES.find(
    (g) => g.slug === 'sabt-eghdamat-hafez-2015'
  );

  const hafezTreatises = [
    {
      id: 'del-in-persian-culture',
      title: isFa
        ? 'دیگرشنیدن حافظ: رند شیراز در برابر زاهد و محتسب'
        : isFr
          ? 'Écouter Hafez autrement : Le Rend face à l’hypocrisie'
          : 'Listening Differently to Hafez: The Rend Against Hypocrisy',
      summary: isFa
        ? 'بازخوانی مفهوم «رند» و واژه «دل» در دیوان حافظ با ابزارهای روانکاوی لکانی؛ گذار از ریاکاری زاهدانه به اخلاق آزادی درونی.'
        : 'Relecture lacanienne de la figure du Rend et du concept de « Del » dans le Divân.',
      tag: isFa ? 'کتاب مرجع' : 'Monographie',
      href: `/${locale}/books/listening-differently-to-hafez`,
    },
    {
      id: 'rend-and-divided-subject',
      title: isFa
        ? 'شعر حافظ و کارگاه هستی (گفتگوی مشروح با رادیو RFI)'
        : isFr
          ? 'Poésie de Hafez et l’atelier de l’être (Entretien RFI)'
          : 'Hafez Poetry & Workshop of Being (RFI Interview)',
      summary: isFa
        ? 'متن کامل گفتگوی رادیویی درباره پیوند غزل حافظ با روانکاوی مدرن و چرایی ماندگاری حافظ در حافظه ایرانیان.'
        : 'Texte intégral de l’entretien RFI sur la modernité radicale du Ghazal de Hafez.',
      tag: isFa ? 'مصاحبه RFI' : 'Entretien RFI',
      href: `/${locale}/about/rfi-hafez-ir`,
    },
    {
      id: 'ontology-of-hafez-love',
      title: isFa
        ? 'حافظ شیراز و دیدار / شب شعر حافظ و عشق دو جهان'
        : isFr
          ? 'Hafez de Chiraz : Rencontre et Amour des Deux Mondes'
          : 'Hafez of Shiraz & Night of Two-World Love (Paris)',
      summary: isFa
        ? 'گزارش و اسناد کنفرانس‌ها و شب‌های شعر حافظ در پاریس و بررسی ساختار چندمعنایی (ایهام) در غزل حافظ.'
        : 'Conférences et soirées poétiques consacrées à Hafez et à la polysémie du Ghazal à Paris.',
      tag: isFa ? 'کنفرانس پاریس' : 'Conférence',
      href: `/${locale}/about/fa-conf-hafez-didar`,
    },
    {
      id: 'hafez-by-hafez-methodology',
      title: isFa
        ? 'جستجو در ده‌ها مقاله و جستار حافظ‌پژوهی پایگاه'
        : isFr
          ? 'Explorer tous les articles et essais sur Hafez'
          : 'Explore All Articles & Essays on Hafez',
      summary: isFa
        ? 'دسترسی مستقیم به همه مقالات، یادداشت‌ها و جستارهای دکتر مکارمی که به رمزگشایی از دیوان حافظ پرداخته‌اند.'
        : 'Accès direct à l’ensemble des articles consacrés à Hafez dans nos archives.',
      tag: isFa ? 'آرشیو مقالات' : 'Archives',
      href: `/${locale}/articles?q=${encodeURIComponent(isFa ? 'حافظ' : 'Hafez')}`,
    },
  ];

  return (
    <div className="space-y-16">
      <link
        rel="alternate"
        type="text/markdown"
        href={`/${locale}/hafez.md`}
        title="Markdown Twin"
      />

      {/* Header with STRICT SINGLE H1 */}
      <header className="space-y-5 border-b border-[var(--border-subtle)] pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-amber-600 font-bold">
            <Feather size={16} />
            <span>
              {isFa
                ? 'قطب مستقل حافظ‌پژوهی • دیگرشنیدن حافظ شیرازی'
                : isFr
                  ? 'Pôle Hafez • Écouter autrement Hafez de Chiraz'
                  : 'Hafezology Hub • Listening Differently to Hafez of Shiraz'}
            </span>
          </div>

          <Link
            href={`/${locale}/hafez.md`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
          >
            <Download size={13} />
            <span>.md (AEO Twin)</span>
          </Link>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--foreground)] tracking-tight leading-tight">
          {isFa
            ? 'حافظ‌پژوهی و «دیگرشنیدن حافظ» در آثار دکتر حسن مکارمی'
            : isFr
              ? 'Hafez de Chiraz : Psychanalyse du Ghazal, Livres et Calligraphies'
              : 'Hafez of Shiraz: Psychoanalytic Hermeneutics, Books & Calligraphic Art'}
        </h1>

        <p className="text-sm sm:text-base text-[var(--foreground-muted)] max-w-4xl leading-relaxed">
          {isFa
            ? 'واکاوی راز ماندگاری خواجه شمس‌الدین محمد حافظ شیرازی از رهگذر زبان‌شناسی، روانکاوی لکانی و هنر خوشنویسی؛ مجموعه سه کتاب مرجع به فارسی و فرانسه، رساله‌های تحلیلی، مجموعه ویدیویی ۱۴ قسمتی «صدای سخن عشق» و تابلوهای نقاشی‌خط «ثبت اقدامات حافظ».'
            : isFr
              ? 'Exploration du Divân de Hafez à travers la psychanalyse lacanienne, trois ouvrages de référence en persan et en français (L’Harmattan), la série vidéo « La Voix de l’Amour » et des toiles calligraphiques.'
              : 'Exploring the Divan of Hafez through Lacanian psychoanalysis, three reference books in Persian and French (L’Harmattan), the 14-part video series “The Voice of Love”, and calligraphic canvases.'}
        </p>
      </header>

      {/* SECTION 1: 3D HAFEZ BOOKS SHOWCASE (چند گفتار در دیگر شنیدن حافظ / نگرشی دیگر بر راز حافظ / Hafez par Hafez) */}
      <section aria-label="کتاب‌های حافظ‌پژوهی" className="space-y-8">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-[var(--foreground)]">
              {isFa
                ? 'سه‌گانه کتاب‌های حافظ‌پژوهی (فارسی و فرانسه)'
                : isFr
                  ? 'Trilogie des Ouvrages sur Hafez (Persan & Français)'
                  : 'Trilogy of Hafezology Books (Persian & French)'}
            </h2>
            <p className="text-xs text-[var(--foreground-muted)]">
              {isFa
                ? 'منتشرشده در پاریس (L’Harmattan و Alian)، کلن (فروغ) و لندن (H&S Media)'
                : 'Publiés à Paris (L’Harmattan, Alian), Cologne et Londres'}
            </p>
          </div>
          <Link
            href={`/${locale}/books?genre=hafez`}
            className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline"
          >
            {isFa ? 'مشاهده در تالار کتاب‌خوان 3D ←' : 'Voir dans la bibliothèque 3D →'}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-6 sm:p-8">
          <div className="lg:col-span-5 flex justify-center bg-[var(--surface-card)] rounded-2xl p-4 border border-[var(--border-subtle)]">
            {primaryHafezBook && (
              <Book3DShowcase
                book={primaryHafezBook}
                translation={primaryTrans}
                locale={locale}
              />
            )}
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 gap-4">
            {hafezBooks.map((b) => {
              const t =
                b.translations?.find((tr) => tr.languages_code.startsWith(locale)) ||
                b.translations?.[0];
              const isFrenchBook = b.slug === 'hafez-par-hafez';

              return (
                <article
                  key={b.id}
                  className="p-5 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-amber-600/50 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold">
                      {isFrenchBook
                        ? isFa
                          ? 'نسخه فرانسوی (LTR) • انتشارات لارماتان پاریس'
                          : 'Édition Française (LTR) • L’Harmattan'
                        : isFa
                          ? `نسخه فارسی (RTL) • ${t?.publisher_name}`
                          : `Édition Persane • ${t?.publisher_name}`}
                    </span>
                    <span className="font-mono text-[var(--foreground-muted)]">
                      {b.publication_year} • {b.page_count} ص
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[var(--foreground)]">
                    <Link
                      href={`/${locale}/books/${b.slug}`}
                      className="hover:text-amber-600 transition-colors"
                    >
                      {t?.title || b.slug}
                    </Link>
                  </h3>

                  <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                    {t?.synopsis}
                  </p>

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] text-[var(--foreground-muted)]">
                      ISBN: {b.isbn_13}
                    </span>
                    <Link
                      href={`/${locale}/books/${b.slug}`}
                      className="font-bold text-[var(--primary)] hover:underline inline-flex items-center gap-1"
                    >
                      <span>{isFa ? 'تورق سه‌بعدی و مطالعه فصل نمونه' : 'Feuilleter en 3D'}</span>
                      {isFa ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 2: HAFEZOLOGY TREATISES, CONFERENCES & REAL ARTICLES */}
      <section aria-label="جستارها و مقالات حافظ‌پژوهی" className="space-y-6">
        <h2 className="text-2xl font-black text-[var(--foreground)] border-b border-[var(--border-subtle)] pb-3">
          {isFa
            ? 'محورهای نظری، کنفرانس‌ها و جستارهای حافظ‌پژوهی'
            : isFr
              ? 'Axes Théoriques, Conférences et Essais sur Hafez'
              : 'Key Theoretical Axes, Conferences & Hafezology Essays'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hafezTreatises.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--primary)] hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[var(--surface-sunken)] text-amber-700 dark:text-amber-400 border border-[var(--border-subtle)]">
                  {item.tag}
                </span>
                <h3 className="text-lg font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                  {item.summary}
                </p>
              </div>
              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-end text-xs font-bold text-[var(--primary)]">
                <span>{isFa ? 'مشاهده و مطالعه ←' : 'Consulter →'}</span>
              </div>
            </Link>
          ))}
        </div>

        {(hafezConferences.length > 0 || hafezArticles.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {hafezConferences.map((pg) => {
              const tr = pg.translations?.find((t) => t.languages_code.startsWith(locale)) || pg.translations?.[0];
              return (
                <Link
                  key={pg.id}
                  href={`/${locale}/about/${pg.slug}`}
                  className="p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] hover:border-[var(--primary)] transition-colors space-y-1.5"
                >
                  <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400">
                    {isFa ? 'سند / کنفرانس حافظ' : 'Conférence / Entretien'}
                  </span>
                  <h3 className="text-sm font-bold text-[var(--foreground)] leading-snug line-clamp-2">
                    {tr?.title || pg.slug}
                  </h3>
                </Link>
              );
            })}
            {hafezArticles.slice(0, 3).map((art) => {
              const tr = art.translations?.find((t) => t.languages_code.startsWith(locale)) || art.translations?.[0];
              const pSeg =
                art.pillar === 'psychoanalysis'
                  ? isFr
                    ? 'psychanalyse'
                    : 'psychoanalysis'
                  : art.pillar === 'art_calligraphy'
                    ? 'art'
                    : art.pillar === 'cultural_strategy'
                      ? 'strategy'
                      : 'human-rights';
              return (
                <Link
                  key={art.id}
                  href={`/${locale}/${pSeg}/articles/${art.slug}`}
                  className="p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] hover:border-[var(--primary)] transition-colors space-y-1.5"
                >
                  <span className="text-[10px] font-mono font-bold text-[var(--primary)]">
                    {isFa ? 'مقاله حافظ‌پژوهی' : 'Article sur Hafez'}
                  </span>
                  <h3 className="text-sm font-bold text-[var(--foreground)] leading-snug line-clamp-2">
                    {tr?.title || art.slug}
                  </h3>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 3: REAL MIGRATED HAFEZ VIDEO SERIES «صدای سخن عشق (حافظ)» */}
      <section
        id="hafez-videos"
        aria-label="مجموعه ویدیویی صدای سخن عشق"
        className="rounded-3xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-6 sm:p-10 space-y-6 scroll-mt-28"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-amber-600 font-bold">
              <Video size={16} />
              <span>
                {isFa
                  ? `آرشیو دیداری حافظ‌پژوهی (${hafezVideos.length} ویدیوی واقعی)`
                  : `Séminaires Vidéos sur Hafez (${hafezVideos.length})`}
              </span>
            </div>
            <h2 className="text-2xl font-black text-[var(--foreground)]">
              {hafezVideoSeries?.title[locale]}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href={`/${locale}/media/videos/hafez-de-chiraz`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-700 text-white hover:bg-amber-800 transition-colors"
            >
              <Video size={14} />
              <span>
                {isFa
                  ? 'کنفرانس پاریس درباره حافظ'
                  : 'Conférence à Paris sur Hafez'}
              </span>
            </Link>
            <Link
              href={`/${locale}/media?series=sedaye-sokhan-eshgh-hafez#videos-archive`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
            >
              <span>{isFa ? `همه ${hafezVideos.length} ویدیو ←` : `Toutes les ${hafezVideos.length} vidéos →`}</span>
            </Link>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed">
          {hafezVideoSeries?.description[locale]}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {hafezVideos.slice(0, 9).map((vid) => {
            const vTrans =
              vid.translations?.find((t) => t.languages_code.startsWith(locale)) ||
              vid.translations?.[0];
            return (
              <Link
                key={vid.id}
                href={`/${locale}/media/videos/${vid.slug}`}
                className="group rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--primary)] hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                {vid.thumbnail_url && (
                  <div className="aspect-video w-full overflow-hidden bg-neutral-900">
                    <img
                      src={vid.thumbnail_url}
                      alt={vTrans?.title || vid.slug}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400">
                      {vid.event_date}
                    </span>
                    <h3 className="text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] leading-snug line-clamp-2">
                      {vTrans?.title || vid.slug}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-[var(--primary)] pt-2">
                    {isFa ? 'مشاهده ویدیو ←' : 'Regarder →'}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* SECTION 4: CALLIGRAPHIC GALLERY «آثار ۲۰۱۵ / حافظ» (Linked Directly to works-2015 in IIIF!) */}
      {hafezGallery && (
        <section
          aria-label="گالری نقاشی‌خط حافظ"
          className="rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-6 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8"
        >
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-[var(--color-art)] font-bold">
              <Palette size={16} />
              <span>{isFa ? 'پیوند خط شکسته نستعلیق و غزل حافظ' : 'Calligraphie & Hafez'}</span>
            </div>
            <h2 className="text-2xl font-black text-[var(--foreground)]">
              {hafezGallery.title[locale]}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed">
              {hafezGallery.curatorStatement[locale]}
            </p>
            <div className="flex flex-wrap gap-3 text-xs font-mono text-[var(--foreground-muted)] pt-1">
              <span>{hafezGallery.dimensions}</span>
              <span>•</span>
              <span>{hafezGallery.medium[locale]}</span>
              <span>•</span>
              <span>
                {hafezGallery.artworkCount} {isFa ? 'تابلو' : 'toiles'}
              </span>
            </div>
          </div>

          <Link
            href={`/${locale}/gallery?series=${hafezGallery.artworkSeriesSlug}#iiif-stage`}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold bg-[var(--primary)] text-[var(--primary-foreground)] shrink-0"
          >
            <Sparkles size={15} />
            <span>{isFa ? 'گشودن گالری حافظ در موزه زوم عمیق (IIIF)' : 'Ouvrir la Série Hafez (IIIF)'}</span>
          </Link>
        </section>
      )}
    </div>
  );
}

