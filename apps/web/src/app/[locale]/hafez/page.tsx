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
  VIDEO_SERIES_CATALOG,
  THEMATIC_GALLERIES,
} from '@/lib/cms';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { Book3DShowcase } from '@/components/books/Book3DShowcase';

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';

  return {
    title: isFa
      ? 'حافظ‌پژوهی و دیگرشنیدن حافظ | دکتر حسن مکارمی'
      : isFr
      ? 'Études Haféziennes : Hafez par Hafez | Dr Hassan Makaremi'
      : 'Hafezology & Listening Differently to Hafez | Dr. Hassan Makaremi',
    description: isFa
      ? 'قطب حافظ‌پژوهی دکتر حسن مکارمی: کتاب‌های «چند گفتار در دیگر شنیدن حافظ»، «نگرشی دیگر بر راز حافظ»، «Hafez par Hafez (لارماتان)» و مجموعه ویدیویی «صدای سخن عشق».'
      : 'Travaux du Dr Hassan Makaremi sur Hafez de Chiraz : livres Hafez par Hafez, séminaires et calligraphies.',
    alternates: {
      canonical: `https://makaremi.com/${locale}/hafez`,
      types: {
        'text/markdown': `https://makaremi.com/${locale}/hafez.md`,
      },
    },
  };
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

  const allBooks = await getBooks(locale);
  const hafezBooks = allBooks.filter(
    (b) =>
      b.slug.includes('hafez') ||
      b.slug === 'listening-differently-to-hafez' ||
      b.slug === 'another-look-at-secret-of-hafez' ||
      b.slug === 'hafez-par-hafez'
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
        ? 'مفهوم «دل» در فرهنگ پارسی و شعر حافظ'
        : isFr
        ? 'Le concept de « Del » (Cœur) dans la culture persane et chez Hafez'
        : 'The Concept of “Del” (Heart) in Persian Culture and Hafez’s Poetry',
      summary: isFa
        ? 'کالبدشکافی واژه «دل» در دیوان حافظ به عنوان جایگاه تلاقی ناخودآگاه، آیینه شهود و کانون مقاومت در برابر جزم‌اندیشی.'
        : 'Analyse sémiotique et psychanalytique du « Cœur » comme miroir de l’inconscient dans le Divân.',
      tag: isFa ? 'رساله پژوهشی' : 'Essai',
    },
    {
      id: 'rend-and-divided-subject',
      title: isFa
        ? '«رند» کیست؟ سوژه شکافته و شالوده‌شکنی از ریاکاری'
        : isFr
        ? 'La figure du « Rend » : éthique de la sincérité contre l’hypocrisie'
        : 'Who Is the “Rend”? The Divided Subject and Deconstruction of Hypocrisy',
      summary: isFa
        ? 'تبیین جایگاه رند شیراز در برابر زاهد و محتسب؛ چگونه حافظ با پذیرش کاستی انسان، اخلاقی نوین بر پایه مدارا و آزادی می‌آفریند.'
        : 'Comment Hafez déconstruit le discours moralisateur par la figure subersive du Rend.',
      tag: isFa ? 'روانکاوی ادبیات' : 'Psychanalyse & Poésie',
    },
    {
      id: 'ontology-of-hafez-love',
      title: isFa
        ? 'هستی‌شناسی حافظ؛ عشق، ایهام و دو جهان'
        : isFr
        ? 'Ontologie de Hafez : l’amour, la polysémie et les deux mondes'
        : 'Ontology of Hafez: Love, Polysemy, and the Two Worlds',
      summary: isFa
        ? 'بررسی ساختار چندمعنایی (ایهام) در غزل حافظ که در آن عشق زمینی و عشق کیهانی بدون مرز بر روی یکدیگر می‌لغزند.'
        : 'La structure polysémique du Ghazal où l’amour terrestre et cosmique se répondent.',
      tag: isFa ? 'نقد و نظر' : 'Herméneutique',
    },
    {
      id: 'hafez-by-hafez-methodology',
      title: isFa
        ? 'روش‌شناسی «حافظ به روایت حافظ» (Hafez par Hafez)'
        : isFr
        ? 'Méthodologie « Hafez par Hafez » : lire le Divân par ses signifiants'
        : '“Hafez by Hafez” Methodology: Reading the Divan Through Its Own Signifiers',
      summary: isFa
        ? 'روش ابداعی دکتر مکارمی در رمزگشایی از شبکه واژگان کلیدی دیوان حافظ (می، پیر مغان، زلف، خرابات، شاهد) در پیوند با یکدیگر.'
        : 'Déchiffrer le réseau des signifiants clés du Divân sans plaquer de dogme extérieur.',
      tag: isFa ? 'روش‌شناسی' : 'Méthodologie',
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
            target="_blank"
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

      {/* SECTION 2: HAFEZOLOGY TREATISES & ARTICLES */}
      <section aria-label="جستارها و مقالات حافظ‌پژوهی" className="space-y-6">
        <h2 className="text-2xl font-black text-[var(--foreground)] border-b border-[var(--border-subtle)] pb-3">
          {isFa
            ? 'محورهای نظری و جستارهای حافظ‌پژوهی'
            : isFr
            ? 'Axes Théoriques et Essais sur Hafez'
            : 'Key Theoretical Axes & Hafezology Essays'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hafezTreatises.map((item) => (
            <article
              key={item.id}
              className="p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-3"
            >
              <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[var(--surface-sunken)] text-amber-700 dark:text-amber-400 border border-[var(--border-subtle)]">
                {item.tag}
              </span>
              <h3 className="text-lg font-bold text-[var(--foreground)] leading-snug">
                {item.title}
              </h3>
              <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                {item.summary}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* SECTION 3: VIDEO SERIES «صدای سخن عشق (حافظ)» & SORBONNE CONFERENCE */}
      <section
        id="hafez-videos"
        aria-label="مجموعه ویدیویی صدای سخن عشق"
        className="rounded-3xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-6 sm:p-10 space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-amber-600 font-bold">
              <Video size={16} />
              <span>{isFa ? 'آرشیو دیداری و شنیداری حافظ‌پژوهی' : 'Séminaires Vidéos sur Hafez'}</span>
            </div>
            <h2 className="text-2xl font-black text-[var(--foreground)]">
              {hafezVideoSeries?.title[locale]}
            </h2>
          </div>

          <Link
            href={`/${locale}/media/videos/hafez-de-chiraz`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-700 text-white hover:bg-amber-800 transition-colors shrink-0"
          >
            <Video size={14} />
            <span>
              {isFa
                ? 'مشاهده کنفرانس سوربن پاریس درباره حافظ'
                : 'Conférence à la Sorbonne sur Hafez'}
            </span>
          </Link>
        </div>

        <p className="text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed">
          {hafezVideoSeries?.description[locale]}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {hafezVideoSeries?.sampleTopics[locale].map((topic, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-2"
            >
              <span className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-400">
                {isFa ? `محور گفتار ${i + 1}` : `Thème ${i + 1}`}
              </span>
              <h3 className="text-sm font-bold text-[var(--foreground)] leading-snug">
                {topic}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: CALLIGRAPHIC GALLERY «ثبت اقدامات / حافظ ۲۰۱۵» */}
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
            href={`/${locale}/gallery`}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold bg-[var(--primary)] text-[var(--primary-foreground)] shrink-0"
          >
            <Sparkles size={15} />
            <span>{isFa ? 'ورود به موزه زوم عمیق آثار (IIIF)' : 'Visiter la Galerie IIIF'}</span>
          </Link>
        </section>
      )}
    </div>
  );
}

