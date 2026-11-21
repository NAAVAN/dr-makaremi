import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Palette,
  Compass,
  ShieldAlert,
  Sparkles,
  FileText,
  Video,
  Globe,
} from 'lucide-react';
import {
  getArticles,
  getBooks,
  getVideoSpeeches,
  getExhibitions,
  getArtworks,
  ACADEMIC_INSTITUTIONS,
  GLOBAL_AUTHORITY_BADGES,
  resolveBadgeHref,
} from '@/lib/cms';
import { Book3DShowcase } from '@/components/books/Book3DShowcase';
import { NewsletterSignup } from '@/components/newsletter/NewsletterSignup';
import { MuseumHeroSection } from '@/components/home/MuseumHeroSection';
import { BorromeanKnotWidget } from '@/components/home/BorromeanKnotWidget';
import { EditorialReveal } from '@/components/home/EditorialReveal';
import type { Locale } from '@makaremi/shared';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';

  const [articles, books, videos, exhibitions, artworks] = await Promise.all([
    getArticles(locale),
    getBooks(locale),
    getVideoSpeeches(locale),
    getExhibitions(locale),
    getArtworks(locale),
  ]);

  const featuredBook = books[0];
  const featuredBookTrans =
    featuredBook?.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    featuredBook?.translations?.[0];

  const featuredArtwork = artworks.find((a) => a.image_url) || artworks[0];
  const featuredArtworkTrans =
    featuredArtwork?.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    featuredArtwork?.translations?.[0];

  const psychoSlug = isFr ? 'psychanalyse' : 'psychoanalysis';
  const DirArrow = isFa ? ArrowLeft : ArrowRight;

  // Section 2: 4 Editorial Archive Portals (Preserving all 4 iconic makaremi.com gateways)
  const fourHeroPortals = [
    {
      index: '01',
      id: 'portal-publications',
      title: isFa ? 'انتشارات، خبر و مقالات' : isFr ? 'Articles & Actualités' : 'Publications & Essays',
      subtitle: isFa
        ? 'جستارهای روانکاوی، فرهنگ، هنر و جامعه'
        : isFr
          ? 'Essais cliniques, culturels, artistiques et sociétaux'
          : 'Psychoanalytic, cultural, art & social essays',
      count: articles.length,
      unit: isFa ? 'مقاله' : isFr ? 'articles' : 'essays',
      href: `/${locale}/articles`,
      icon: FileText,
      accent: 'var(--color-psychoanalysis)',
    },
    {
      index: '02',
      id: 'portal-films',
      title: isFa ? 'فیلم‌ها و سخنرانی‌ها' : isFr ? 'Vidéos & Conférences' : 'Films & Lectures',
      subtitle: isFa
        ? 'در روان‌‌پژوهی، نگاه روانکاو، حافظ و نشست‌های یونسکو'
        : isFr
          ? 'Séries télévisées, UNESCO et séminaires Hafez'
          : 'TV lecture series, UNESCO & Hafez seminars',
      count: videos.length,
      unit: isFa ? 'ویدیو' : isFr ? 'vidéos' : 'videos',
      href: `/${locale}/media`,
      icon: Video,
      accent: 'var(--color-strategy)',
    },
    {
      index: '03',
      id: 'portal-books',
      title: isFa ? 'کتاب‌ها' : isFr ? 'Livres' : 'Books',
      subtitle: isFa
        ? '۸ حوزه تخصصی همراه با نمای سه‌بعدی و تورق نمونه'
        : isFr
          ? '8 genres avec vitrine 3D et extraits'
          : '8 genres with 3D showcase and reader',
      count: books.length,
      unit: isFa ? 'کتاب' : isFr ? 'livres' : 'books',
      href: `/${locale}/books`,
      icon: BookOpen,
      accent: 'var(--primary)',
    },
    {
      index: '04',
      id: 'portal-exhibitions',
      title: isFa ? 'نمایشگاه‌ها و گالری‌ها' : isFr ? 'Expositions & Galeries' : 'Exhibitions & Galleries',
      subtitle: isFa
        ? `${exhibitions.length} نمایشگاه جهانی، ۲۹ مجموعه تابلو و موزه مسکو`
        : isFr
          ? `${exhibitions.length} expositions, 29 séries et Musée de Moscou`
          : `${exhibitions.length} shows, 29 series & Moscow Museum`,
      count: exhibitions.length,
      unit: isFa ? 'نمایشگاه' : isFr ? 'expos' : 'shows',
      href: `/${locale}/gallery`,
      icon: Palette,
      accent: 'var(--color-art)',
    },
  ];

  const iranInstitutions = ACADEMIC_INSTITUTIONS.filter((i) => i.country === 'IR');
  const franceInstitutions = ACADEMIC_INSTITUTIONS.filter((i) => i.country === 'FR');

  const leadArticle = articles[0];
  const secondaryArticles = articles.slice(1, 4);

  const getArticlePillarSlug = (pillar: string) =>
    pillar === 'psychoanalysis'
      ? isFr
        ? 'psychanalyse'
        : 'psychoanalysis'
      : pillar === 'art_calligraphy'
        ? 'art'
        : pillar === 'cultural_strategy'
          ? 'strategy'
          : 'human-rights';

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* =====================================================================
          SECTION 1: ASYMMETRIC MUSEUM HERO WITH PORTRAIT & KINETIC INK STROKE
          ===================================================================== */}
      <MuseumHeroSection
        locale={locale}
        stats={{
          articles: articles.length,
          books: books.length,
          exhibitions: exhibitions.length,
          videos: videos.length,
        }}
        backdropArtworkUrl={featuredArtwork?.image_url}
        backdropArtworkTitle={featuredArtworkTrans?.title || featuredArtwork?.slug}
      />

      {/* =====================================================================
          SECTION 2: EDITORIAL ARCHIVE INDEX STRIP (4 ICONIC PORTALS)
          ===================================================================== */}
      <EditorialReveal>
        <section
          aria-label={isFa ? 'چهار درگاه اصلی آرشیو' : isFr ? 'Quatre portails principaux des archives' : 'Four Primary Archive Portals'}
          className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] overflow-hidden shadow-[var(--shadow-sm)]"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-[var(--border-subtle)]">
            {fourHeroPortals.map((portal) => {
              const Icon = portal.icon;
              return (
                <Link
                  key={portal.id}
                  href={portal.href}
                  className="group p-6 sm:p-7 flex flex-col justify-between gap-5 hover:bg-[var(--surface-artifact)] transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[var(--foreground-muted)] tracking-wider">
                      {portal.index}
                    </span>
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--surface-sunken)] border border-[var(--border-subtle)] transition-transform duration-200 group-hover:scale-105"
                      style={{ color: portal.accent }}
                    >
                      <Icon size={18} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="font-display text-lg font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors flex items-center justify-between gap-2">
                      <span>{portal.title}</span>
                      <DirArrow
                        size={15}
                        className="opacity-40 group-hover:opacity-100 transition-opacity shrink-0"
                      />
                    </h2>
                    <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                      {portal.subtitle}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[var(--border-subtle)] flex items-baseline gap-1.5">
                    <span className="font-mono text-lg font-bold text-[var(--foreground)]">
                      {portal.count}
                    </span>
                    <span className="text-[11px] text-[var(--foreground-muted)]">
                      {portal.unit}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </EditorialReveal>

      {/* =====================================================================
          SECTION 3: MUSEUM 3D BOOK PEDESTAL
          ===================================================================== */}
      {featuredBook && (
        <EditorialReveal>
          <section
            aria-label={isFa ? 'ویترین سه‌بعدی کتاب برگزیده' : isFr ? 'Vitrine 3D du livre sélectionné' : 'Featured Book 3D Showcase'}
            className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-artifact)] p-6 sm:p-10 lg:p-12 overflow-hidden shadow-[var(--shadow-sm)]"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-5 flex justify-center bg-[var(--surface-card)] rounded-2xl p-5 border border-[var(--border-subtle)] shadow-[var(--shadow-sm)]">
                <Book3DShowcase
                  book={featuredBook}
                  translation={featuredBookTrans}
                  locale={locale}
                />
              </div>

              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-[var(--primary)] font-semibold">
                  <BookOpen size={14} />
                  <span>
                    {isFa
                      ? 'کتاب برگزیده · نمای سه‌بعدی و تورق نمونه'
                      : isFr
                        ? 'Ouvrage à la une · Vitrine 3D & Feuilletage'
                        : 'Featured Monograph · 3D Showcase'}
                  </span>
                </div>

                <h2 className="font-display text-2xl sm:text-4xl font-black text-[var(--foreground)] text-balance">
                  {featuredBookTrans?.title || featuredBook.slug}
                </h2>

                {featuredBookTrans?.subtitle && (
                  <p className="text-sm sm:text-base font-semibold text-[var(--foreground-muted)]">
                    {featuredBookTrans.subtitle}
                  </p>
                )}

                <p className="font-serif text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-2xl">
                  {featuredBookTrans?.synopsis}
                </p>

                <div className="flex flex-wrap items-center gap-3.5 pt-2">
                  <Link
                    href={`/${locale}/books/${featuredBook.slug}`}
                    className="interactive-tap inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] text-xs sm:text-sm font-semibold shadow-[var(--shadow-sm)] transition-colors"
                  >
                    <span>
                      {isFa
                        ? 'گشودن کتاب و مطالعه نمونه'
                        : isFr
                          ? 'Ouvrir l’ouvrage en 3D'
                          : 'Open 3D Edition'}
                    </span>
                    <DirArrow size={14} />
                  </Link>

                  <Link
                    href={`/${locale}/books`}
                    className="interactive-tap inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] text-[var(--foreground)] text-xs sm:text-sm font-semibold hover:border-[var(--primary)] transition-colors"
                  >
                    <span>
                      {isFa
                        ? `همه ${books.length} کتاب در ۸ ژانر`
                        : isFr
                          ? `Les ${books.length} ouvrages`
                          : `All ${books.length} Books`}
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </EditorialReveal>
      )}

      {/* =====================================================================
          SECTION 4: ASYMMETRIC EDITORIAL BENTO (4 PILLARS + BORROMEAN KNOT)
          ===================================================================== */}
      <EditorialReveal>
        <section
          aria-label={isFa ? 'ستون‌های چهارگانه اندیشه و آفرینش' : isFr ? 'Quatre piliers de pensée et de création' : 'Four Pillars of Thought and Creation'}
          className="space-y-7"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
            <div className="space-y-1">
              <span className="font-mono text-xs text-[var(--primary)] font-semibold">
                {isFa ? 'چهار دامنه آثار' : isFr ? 'Quatre domaines' : 'Four Pillars'}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-[var(--foreground)]">
                {isFa
                  ? 'ستون‌های چهارگانه اندیشه و آفرینش'
                  : isFr
                    ? 'Piliers de Pensée et de Création'
                    : 'Four Pillars of Thought & Creation'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] max-w-md">
              {isFa
                ? 'مرور ساختاریافته آثار بالینی، تابلوهای خوشنویسی، پژوهش‌های راهبردی و اسناد حقوق بشری'
                : isFr
                  ? 'Exploration structurée des textes cliniques, œuvres calligraphiques, travaux stratégiques et archives civiques'
                  : 'Structured access to clinical essays, modern calligraphy, strategic research, and human rights archives'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Pillar 1 (Lead — 7 cols): Lacanian Psychoanalysis + Interactive Borromean Knot */}
            <div className="lg:col-span-7 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-[var(--shadow-sm)]">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-psychoanalysis)]">
                    <Sparkles size={16} />
                    <span>
                      {isFa
                        ? 'ستون نخست · روانکاوی بالینی'
                        : isFr
                          ? 'Pilier I · Clinique Lacanienne'
                          : 'Pillar I · Clinical Psychoanalysis'}
                    </span>
                  </div>
                  <Link
                    href={`/${locale}/${psychoSlug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline"
                  >
                    <span>{isFa ? 'ورود به تالار' : isFr ? 'Ouvrir' : 'Explore'}</span>
                    <DirArrow size={13} />
                  </Link>
                </div>

                <h3 className="font-display text-xl sm:text-2xl font-black text-[var(--foreground)]">
                  <Link
                    href={`/${locale}/${psychoSlug}`}
                    className="hover:text-[var(--primary)] transition-colors"
                  >
                    {isFa
                      ? 'روانکاوی لکانی و مفهوم دگرشنیدن'
                      : isFr
                        ? 'Psychanalyse Lacanienne & Écouter Autrement'
                        : 'Lacanian Psychoanalysis & Listening Differently'}
                  </Link>
                </h3>

                <p className="text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed">
                  {isFa
                    ? 'خوانش بالینی ناخودآگاه، ترجمه سمینار سوم ژاک لکان (پسیکوزها) و صورت‌بندی دگرشنیدن در بستر زبان و فرهنگ ایرانی.'
                    : isFr
                      ? 'Pratique clinique du sujet, traduction persane du Séminaire III de Jacques Lacan et écoute analytique dans la culture iranienne.'
                      : 'Clinical reading of the unconscious, translation of Jacques Lacan’s Seminar III, and conceptualising Listening Differently.'}
                </p>
              </div>

              {/* Bespoke Interactive Lacanian Borromean Knot */}
              <BorromeanKnotWidget locale={locale} />
            </div>

            {/* Pillar 2 (Feature Visual — 5 cols): Art, Calligraphy & Poetry with Real Artwork Plate */}
            <Link
              href={`/${locale}/gallery`}
              className="group lg:col-span-5 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--border-artifact)] overflow-hidden flex flex-col justify-between shadow-[var(--shadow-sm)] archival-lift"
            >
              {featuredArtwork?.image_url && (
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--surface-sunken)] border-b border-[var(--border-subtle)]">
                  <img
                    src={featuredArtwork.image_url}
                    alt={featuredArtworkTrans?.title || featuredArtwork.slug}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <span className="absolute bottom-3 start-3 px-2.5 py-1 rounded-md bg-[var(--surface-card)]/90 backdrop-blur-xs border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--foreground)]">
                    {isFa ? '۲۹ مجموعه · ۸۵۶ اثر' : isFr ? '29 séries · 856 œuvres' : '29 series · 856 works'}
                  </span>
                </div>
              )}

              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-2.5">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-art)]">
                    <Palette size={15} />
                    <span>
                      {isFa
                        ? 'ستون دوم · نقاشی‌خط و شعر'
                        : isFr
                          ? 'Pilier II · Calligraphie & Poésie'
                          : 'Pillar II · Art & Poetry'}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-black text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                    {isFa
                      ? 'هنر، خوشنویسی مدرن و شعر'
                      : isFr
                        ? 'Art, Calligraphie Moderne & Poésie'
                        : 'Modern Art, Calligraphy & Poetry'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed">
                    {isFa
                      ? 'بیش از ۲۷ نمایشگاه بین‌المللی در پاریس، قصر پومپادور، موزه خوشنویسی مسکو، هاوانا و فستیوال فاس همراه با زوم عمیق IIIF.'
                      : isFr
                        ? 'Plus de 27 expositions internationales à Paris (UNESCO), Château de Pompadour, Musée de Moscou, La Havane et Fès.'
                        : 'Over 27 international exhibitions across Paris UNESCO, Pompadour, Moscow Museum of Calligraphy, Havana, and Fez.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-bold text-[var(--color-art)]">
                  <span>{isFa ? 'گشودن گالری و زوم عمیق' : isFr ? 'Visiter la galerie IIIF' : 'Open IIIF Gallery'}</span>
                  <DirArrow size={14} />
                </div>
              </div>
            </Link>

            {/* Pillar 3 (6 cols): Cultural Strategy */}
            <Link
              href={`/${locale}/strategy`}
              className="group lg:col-span-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--border-artifact)] p-6 sm:p-7 flex flex-col justify-between gap-5 shadow-[var(--shadow-sm)] archival-lift"
            >
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-strategy)]">
                  <Compass size={16} />
                  <span>
                    {isFa
                      ? 'ستون سوم · مطالعات راهبردی'
                      : isFr
                        ? 'Pilier III · Stratégie Culturelle'
                        : 'Pillar III · Cultural Strategy'}
                  </span>
                </div>
                <h3 className="font-display text-xl font-black text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                  {isFa
                    ? 'مطالعات راهبردی و سرزمین فرهنگی ایران'
                    : isFr
                      ? 'Stratégie Culturelle & Modernisation'
                      : 'Cultural Strategy & Modernisation'}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed">
                  {isFa
                    ? 'مدرنیزاسیون سازمانی، دموکراسی سکولار، همکاری پژوهشی در دانشگاه سوربن و بازخوانی مفهوم «سرزمین فرهنگی ایران».'
                    : isFr
                      ? 'Modernisation organisationnelle, transition démocratique laïque, travaux à la Sorbonne et « Terre culturelle de l’Iran ».'
                      : 'Organisational modernisation, secular democratic transition, Sorbonne research, and the concept of Cultural Iran.'}
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-bold text-[var(--color-strategy)]">
                <span>{isFa ? 'مطالعه پژوهش‌های راهبردی' : isFr ? 'Lire les essais stratégiques' : 'Read Strategic Studies'}</span>
                <DirArrow size={14} />
              </div>
            </Link>

            {/* Pillar 4 (6 cols): Human Rights & Dadkhahi */}
            <Link
              href={`/${locale}/human-rights`}
              className="group lg:col-span-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--border-artifact)] p-6 sm:p-7 flex flex-col justify-between gap-5 shadow-[var(--shadow-sm)] archival-lift"
            >
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-dadkhahi)]">
                  <ShieldAlert size={16} />
                  <span>
                    {isFa
                      ? 'ستون چهارم · حقوق بشر و دادخواهی'
                      : isFr
                        ? 'Pilier IV · Droits Humains & Justice'
                        : 'Pillar IV · Human Rights & Dadkhahi'}
                  </span>
                </div>
                <h3 className="font-display text-xl font-black text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                  {isFa
                    ? 'حقوق بشر، عدالت انتقالی و دادخواهی'
                    : isFr
                      ? 'Droits de l’Homme & Justice Transitionnelle'
                      : 'Human Rights & Transitional Justice'}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed">
                  {isFa
                    ? 'خزانه‌داری جامعه دفاع از حقوق بشر در ایران (LDDHI)، گزارش‌ها و نشست‌های ژنو و مستندسازی دادخواهی کشتار تابستان ۱۳۶۷.'
                    : isFr
                      ? 'Trésorier de la LDDHI (FIDH), interventions au Conseil des droits de l’homme à Genève et mémoire du massacre de 1988.'
                      : 'Treasurer of LDDHI (FIDH), UN Geneva interventions, and historical documentation of the 1988 prison massacres.'}
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-bold text-[var(--color-dadkhahi)]">
                <span>{isFa ? 'ورود به بایگانی حقوق بشر' : isFr ? 'Consulter les archives' : 'Explore Human Rights Archive'}</span>
                <DirArrow size={14} />
              </div>
            </Link>
          </div>
        </section>
      </EditorialReveal>

      {/* =====================================================================
          SECTION 5: GEOGRAPHIC LIFE TIMELINE & PARIS REFLECTION PORTRAIT
          ===================================================================== */}
      <EditorialReveal>
        <section
          aria-label={isFa ? 'کارنامه دانشگاهی و حضور جهانی' : isFr ? 'Parcours académique et présence internationale' : 'Academic Trajectory and Global Presence'}
          className="rounded-3xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-6 sm:p-10 lg:p-12 space-y-10"
        >
          {/* Editorial Header Paired with Iconic Parisian Reflection Portrait (hassan-reflet.jpg) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-[var(--border-subtle)] pb-8">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[var(--primary)]">
                <Globe size={15} />
                <span>
                  {isFa
                    ? 'حضور من در هستی · ۶ دانشگاه در ایران و فرانسه'
                    : isFr
                      ? 'Présence dans le monde · 6 Universités (Iran & France)'
                      : 'Academic Trajectory · 6 Universities (Iran & France)'}
                </span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl font-black text-[var(--foreground)] text-balance">
                {isFa
                  ? 'مسیر دانشگاهی از شیراز و تهران تا سوربن، یونسکو و موزه مسکو'
                  : isFr
                    ? 'De Chiraz et Téhéran à la Sorbonne, l’UNESCO et Moscou'
                    : 'From Shiraz and Tehran to the Sorbonne, UNESCO, and Moscow'}
              </h2>

              {/* EXACT VERBATIM BIOGRAPHY LINE FROM DR. MAKAREMI'S ORIGINAL SITE */}
              {isFa ? (
                <blockquote className="font-serif text-sm sm:text-base text-[var(--text-secondary)] leading-[1.95] space-y-2">
                  <p>
                    در شیراز به سال ۱۳۲۹ به دنیا آمدم . در ایران , از پلی تکنیک تهران،دانشگاه شیراز، دانشگاه بلوچستان ، ودر فرانسه از دانشگاه کامپین، مدرسه مهندسی سانترال پاریس، دانشکده پزشکی پاریس هفت ،ومرکز مطالعات استراژی و دیپلماسی پاریس ، چون آموزش گیرنده و یا آموزش دهنده،عبورکرده ام.
                  </p>
                  <p className="text-[var(--primary)] font-bold">
                    و در این آرزو زندگی می کنم؛ ساختن ایران .
                  </p>
                </blockquote>
              ) : (
                <p className="font-serif text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
                  {isFr
                    ? 'Sept de ses œuvres sont en exposition permanente au musée moderne de calligraphie du Moscou. Il a publié plus de 40 articles. Le nombre de ses conférences passe à 40 à ce jour.'
                    : 'Seven of his calligraphic works are held in the permanent collection of the Moscow Museum of Modern Calligraphy alongside decades of clinical, academic, and human rights engagements in Paris.'}
                </p>
              )}

              <Link
                href={`/${locale}/about`}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[var(--primary)] hover:underline pt-1"
              >
                <span>
                  {isFa
                    ? 'مطالعه کامل شرح حال، ۳۴+ مصاحبه و مستند زندگی'
                    : isFr
                      ? 'Lire la biographie complète et les entretiens'
                      : 'Read full biography & interviews'}
                </span>
                <DirArrow size={14} />
              </Link>
            </div>

            {/* Companion Portrait: Iconic Parisian Glass Reflection ("Hassan Reflet") */}
            <figure className="lg:col-span-5 rounded-2xl bg-[var(--surface-passepartout)] border border-[var(--border-artifact)] p-2.5 shadow-[var(--shadow-md)]">
              <div className="relative aspect-[1200/748] w-full overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)]">
                <img
                  src="/images/portrait/dr-makaremi-paris-reflet.jpg"
                  alt={
                    isFa
                      ? 'دکتر حسن مکارمی و انعکاس تصویر او در آینه ساختمانی در پاریس'
                      : isFr
                        ? 'Dr Hassan Makaremi — reflet à Paris'
                        : 'Dr. Hassan Makaremi reflected in Parisian architecture'
                  }
                  width={1200}
                  height={748}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-top contrast-[1.03] saturate-[0.95]"
                />
              </div>
              <figcaption className="mt-2 px-1 flex items-center justify-between text-[11px] font-mono text-[var(--foreground-muted)]">
                <span>{isFa ? 'پاریس · انعکاس' : isFr ? 'Paris · Reflet' : 'Paris · Reflection'}</span>
                <span>1983 — 2026</span>
              </figcaption>
            </figure>
          </div>

          {/* 2-Column Geographic Academic Timeline (Iran -> France) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Iran Track */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[var(--foreground-muted)] pb-2 border-b border-[var(--border-subtle)]">
                <span>{isFa ? 'ایران · تحصیل و تدریس' : isFr ? 'Iran · Parcours universitaire' : 'Iran · Universities'}</span>
                <span>1968 — 1983</span>
              </div>
              <ol className="space-y-3">
                {iranInstitutions.map((inst) => (
                  <li
                    key={inst.id}
                    className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-[var(--foreground)] leading-snug">
                        {inst.name[locale]}
                      </h3>
                      <p className="text-xs text-[var(--foreground-muted)]">{inst.role[locale]}</p>
                    </div>
                    <span className="font-mono text-[11px] text-[var(--primary)] shrink-0">
                      {inst.period}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            {/* France Track */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[var(--foreground-muted)] pb-2 border-b border-[var(--border-subtle)]">
                <span>{isFa ? 'فرانسه · پژوهش و روانکاوی' : isFr ? 'France · Recherche & Clinique' : 'France · Research & Clinical'}</span>
                <span>1983 — 2026</span>
              </div>
              <ol className="space-y-3">
                {franceInstitutions.map((inst) => (
                  <li
                    key={inst.id}
                    className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-[var(--foreground)] leading-snug">
                        {inst.name[locale]}
                      </h3>
                      <p className="text-xs text-[var(--foreground-muted)]">{inst.role[locale]}</p>
                    </div>
                    <span className="font-mono text-[11px] text-[var(--primary)] shrink-0">
                      {inst.period}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* 5 Museum Plaque International Authority Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-2">
            {GLOBAL_AUTHORITY_BADGES.map((badge) => {
              const href = resolveBadgeHref(badge, locale);
              return (
                <Link
                  key={badge.id}
                  href={href}
                  className="group p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--primary)] transition-colors flex flex-col justify-between gap-2.5 archival-lift"
                >
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-[var(--accent-gold)] block">
                      {badge.badgeText[locale]}
                    </span>
                    <h3 className="text-xs font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors leading-snug">
                      {badge.title[locale]}
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--primary)] inline-flex items-center gap-1">
                    <span>{isFa ? 'مشاهده' : isFr ? 'Explorer' : 'View'}</span>
                    <DirArrow size={11} />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </EditorialReveal>

      {/* =====================================================================
          SECTION 6: LITERARY JOURNAL INDEX (LEAD ESSAY + HAIRLINE LIST)
          ===================================================================== */}
      {leadArticle && (
        <EditorialReveal>
          <section
            aria-label={isFa ? 'گزیده مقالات و بیانیه‌های پژوهشی' : isFr ? 'Articles et essais récents' : 'Selected Scholarly Essays'}
            className="space-y-7"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
              <div className="space-y-1">
                <span className="font-mono text-xs text-[var(--primary)] font-semibold">
                  {isFa ? 'نشریه و آرشیو مقالات' : isFr ? 'Cahiers & Essais' : 'Journal & Essays'}
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-black text-[var(--foreground)]">
                  {isFa
                    ? 'گزیده مقالات و بیانیه‌های پژوهشی'
                    : isFr
                      ? 'Articles et Essais Choisis'
                      : 'Selected Scholarly Essays'}
                </h2>
              </div>

              <Link
                href={`/${locale}/articles`}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[var(--primary)] hover:underline shrink-0"
              >
                <span>
                  {isFa
                    ? `آرشیو کامل ${articles.length} مقاله`
                    : isFr
                      ? `Tous les ${articles.length} articles`
                      : `All ${articles.length} Articles`}
                </span>
                <DirArrow size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Lead Essay Spotlight (6 cols) */}
              {(() => {
                const trans =
                  leadArticle.translations?.find((t) => t.languages_code.startsWith(locale)) ||
                  leadArticle.translations?.[0];
                const pSlug = getArticlePillarSlug(leadArticle.pillar);
                const href = `/${locale}/${pSlug}/articles/${leadArticle.slug}`;
                return (
                  <article className="lg:col-span-6 p-7 sm:p-8 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] flex flex-col justify-between gap-6 shadow-[var(--shadow-sm)] archival-lift">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-[11px] font-mono text-[var(--foreground-muted)]">
                        <span className="px-2.5 py-0.5 rounded-full bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--primary)] font-semibold">
                          {leadArticle.pillar.replace('_', ' ')}
                        </span>
                        <span>{leadArticle.published_at?.slice(0, 10) || '2026'}</span>
                      </div>

                      <h3 className="font-display text-xl sm:text-2xl font-black text-[var(--foreground)] leading-snug">
                        <Link href={href} className="hover:text-[var(--primary)] transition-colors">
                          {trans?.title || leadArticle.slug}
                        </Link>
                      </h3>

                      <p className="font-serif text-sm sm:text-base text-[var(--foreground-muted)] leading-relaxed line-clamp-4">
                        {trans?.executive_summary}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                      <Link
                        href={href}
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[var(--primary)] hover:underline"
                      >
                        <span>
                          {isFa
                            ? 'مطالعه متن کامل مقاله'
                            : isFr
                              ? 'Lire l’article complet'
                              : 'Read Full Essay'}
                        </span>
                        <DirArrow size={14} />
                      </Link>
                      <Link
                        href={`${href}.md`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[11px] text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors"
                      >
                        .md
                      </Link>
                    </div>
                  </article>
                );
              })()}

              {/* Curated Journal Hairline Index (6 cols) */}
              <div className="lg:col-span-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)] shadow-[var(--shadow-sm)] flex flex-col justify-between">
                {secondaryArticles.map((art) => {
                  const trans =
                    art.translations?.find((t) => t.languages_code.startsWith(locale)) ||
                    art.translations?.[0];
                  const pSlug = getArticlePillarSlug(art.pillar);
                  const href = `/${locale}/${pSlug}/articles/${art.slug}`;

                  return (
                    <article
                      key={art.id}
                      className="p-5 sm:p-6 hover:bg-[var(--surface-artifact)] transition-colors flex flex-col justify-between gap-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[var(--foreground-muted)]">
                        <span className="text-[var(--primary)] font-semibold">
                          {art.pillar.replace('_', ' ')}
                        </span>
                        <span>{art.published_at?.slice(0, 10) || '2026'}</span>
                      </div>

                      <h3 className="font-display text-base sm:text-lg font-bold text-[var(--foreground)] leading-snug">
                        <Link href={href} className="hover:text-[var(--primary)] transition-colors">
                          {trans?.title || art.slug}
                        </Link>
                      </h3>

                      <p className="text-xs text-[var(--foreground-muted)] leading-relaxed line-clamp-2">
                        {trans?.executive_summary}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        </EditorialReveal>
      )}

      {/* =====================================================================
          SECTION 7: CENSORSHIP-RESISTANT FULL-TEXT NEWSLETTER
          ===================================================================== */}
      <EditorialReveal>
        <section
          aria-label={isFa ? 'خبرنامه تمام‌متن ضدسانسور' : 'Infolettre intégrale anti-censure'}
          className="pt-2"
        >
          <NewsletterSignup locale={locale} />
        </section>
      </EditorialReveal>
    </div>
  );
}
