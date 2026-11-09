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
  GraduationCap,
  Globe,
  Feather,
} from 'lucide-react';
import {
  getArticles,
  getBooks,
  ACADEMIC_INSTITUTIONS,
  GLOBAL_AUTHORITY_BADGES,
} from '@/lib/cms';
import { Book3DShowcase } from '@/components/books/Book3DShowcase';
import { NewsletterSignup } from '@/components/newsletter/NewsletterSignup';
import type { Locale } from '@makaremi/shared';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';

  const articles = await getArticles(locale);
  const books = await getBooks(locale);

  const featuredBook = books[0];
  const featuredBookTrans =
    featuredBook?.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    featuredBook?.translations?.[0];

  const psychoSlug = isFr ? 'psychanalyse' : 'psychoanalysis';

  // The 4 Iconic Top Portals from makaremi.com/home-persan/
  const fourHeroPortals = [
    {
      id: 'portal-publications',
      title: isFa ? 'انتشارات و مقالات' : isFr ? 'Publications & Articles' : 'Publications & Essays',
      subtitle: isFa
        ? 'جستارهای روانکاوی، فرهنگ، شاهنامه و جامعه'
        : isFr
        ? 'Essais cliniques, culturels et sociétaux'
        : 'Psychoanalytic, cultural & social essays',
      badge: isFa ? '۱۵۰+ مقاله' : '150+ Articles',
      href: `/${locale}/${psychoSlug}/articles`,
      icon: FileText,
      accent: 'var(--color-psychoanalysis)',
    },
    {
      id: 'portal-films',
      title: isFa ? 'فیلم‌ها و سخنرانی‌ها' : isFr ? 'Vidéos & Conférences' : 'Films & Lectures',
      subtitle: isFa
        ? 'مجموعه‌های در روان‌‌پژوهی (۶۵+)، نگاه روانکاو (۸۱+) و حافظ'
        : isFr
        ? 'Séries télévisées (160+ épisodes) et conférences'
        : '160+ TV episodes & university lectures',
      badge: isFa ? '۱۶۰+ ویدیو' : '160+ Vidéos',
      href: `/${locale}/media`,
      icon: Video,
      accent: 'var(--color-strategy)',
    },
    {
      id: 'portal-books',
      title: isFa ? 'کتاب‌ها (ویترین 3D)' : isFr ? 'Livres (Vitrine 3D)' : 'Books (3D Library)',
      subtitle: isFa
        ? '۸ ژانر تخصصی همراه با کتاب‌خوان ورق‌خور سه‌بعدی'
        : isFr
        ? '8 genres avec lecteur 3D interactif'
        : '8 genres with 3D page-turning reader',
      badge: isFa ? `${books.length}+ کتاب` : `${books.length}+ Livres`,
      href: `/${locale}/books`,
      icon: BookOpen,
      accent: 'var(--primary)',
    },
    {
      id: 'portal-exhibitions',
      title: isFa ? 'نمایشگاه‌ها و گالری‌ها' : isFr ? 'Expositions & Galeries' : 'Exhibitions & Galleries',
      subtitle: isFa
        ? '۲۷+ نمایشگاه جهانی و ۷ اثر در موزه مدرن خوشنویسی مسکو'
        : isFr
        ? '27+ expositions mondiales & Musée de Moscou'
        : '27+ international shows & Moscow Museum',
      badge: isFa ? '۲۷+ نمایشگاه' : '27+ Expos',
      href: `/${locale}/gallery`,
      icon: Palette,
      accent: 'var(--color-art)',
    },
  ];

  const pillars = [
    {
      id: 'psychoanalysis',
      title: isFa ? 'روانکاوی لکانی' : isFr ? 'Psychanalyse Lacanienne' : 'Lacanian Psychoanalysis',
      description: isFa
        ? 'خوانش بالینی ناخودآگاه، ترجمه سمینار سوم لکان و مفهوم‌پردازی دگرشنیدن در بستر فرهنگ ایرانی.'
        : isFr
        ? "Pratique clinique du sujet, écoute de l'inconscient et séminaires de Jacques Lacan."
        : 'Clinical reading of the unconscious, Jacques Lacan seminar translations, and listening differently.',
      href: `/${locale}/${psychoSlug}`,
      accent: 'var(--color-psychoanalysis)',
      icon: Sparkles,
    },
    {
      id: 'art_calligraphy',
      title: isFa ? 'هنر، خوشنویسی و شعر' : isFr ? 'Art, Calligraphie & Poésie' : 'Modern Art, Calligraphy & Poetry',
      description: isFa
        ? 'بیش از ۲۷ نمایشگاه بین‌المللی در پاریس، قصر پومپادور، موزه خوشنویسی مسکو، هاوانا و فستیوال فاس.'
        : isFr
        ? 'Expositions internationales au Château de Pompadour, à l’UNESCO et au Musée de Moscou.'
        : 'International exhibitions across Paris UNESCO, Pompadour, Moscow Museum of Calligraphy, and Fez.',
      href: `/${locale}/gallery`,
      accent: 'var(--color-art)',
      icon: Palette,
    },
    {
      id: 'cultural_strategy',
      title: isFa ? 'مطالعات راهبردی و فرهنگ' : isFr ? 'Stratégie Culturelle & Politique' : 'Cultural Strategy',
      description: isFa
        ? 'تبیین افق‌های توسعه، مدرنیزاسیون سازمانی، دموکراسی سکولار و بازخوانی مفهوم «سرزمین فرهنگی ایران».'
        : isFr
        ? "Modèles de transition démocratique laïque et concept de la 'Terre culturelle de l'Iran'."
        : 'Strategic blueprints for secular democratic transition and the civilizational concept of Cultural Iran.',
      href: `/${locale}/strategy`,
      accent: 'var(--color-strategy)',
      icon: Compass,
    },
    {
      id: 'human_rights_dadkhahi',
      title: isFa ? 'حقوق بشر و دادخواهی' : isFr ? "Droits de l'Homme & Justice" : 'Human Rights & Dadkhahi',
      description: isFa
        ? 'خزانه‌داری جامعه دفاع از حقوق بشر در ایران (LDDHI)، نشست‌های ژنو و مستندسازی کشتار تابستان ۱۳۶۷.'
        : isFr
        ? 'Interventions au Conseil des droits de l’homme de l’ONU à Genève et justice pour le massacre de 1988.'
        : 'Interventions at UN Human Rights Council Geneva sessions and documentation of the 1988 prison massacres.',
      href: `/${locale}/human-rights`,
      accent: 'var(--color-dadkhahi)',
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-20">
      {/* Hero Section with strict single H1 & Anti-Slop Museum Architecture */}
      <section className="relative rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-8 sm:p-12 lg:p-16 overflow-hidden shadow-sm">
        {/* Subtle Archival Texture Hairline Accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[var(--pillar-psychoanalysis)] via-[var(--pillar-art)] to-[var(--pillar-strategy)] opacity-80" />

        <div className="relative max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs text-[var(--foreground)] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
            <span className="font-serif tracking-wide">
              {isFa
                ? 'پایگاه رسمی آثار علمی، هنری و فرهنگی • روانکاو · هنرمند · پژوهشگر'
                : 'Site officiel et archives de référence • Artiste · Psychanalyste · Chercheur'}
            </span>
          </div>

          {/* EXACT SINGLE H1 PER PAGE */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[var(--foreground)] tracking-tight leading-[1.18]">
            {isFa
              ? 'دکتر حسن مکارمی؛ افق تفکر، هنر و دادخواهی'
              : 'Dr. Hassan Makaremi : Psychanalyse, Art et Justice'}
          </h1>

          <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed font-serif max-w-3xl">
            {isFa
              ? 'به پایگاه من خوش آمدید. در این مجموعه از چهار دامنه فعالیت‌هایم با شما سخن می‌گویم: هنر و ادبیات (خوشنویسی، نقاشی و شعر و حافظ‌پژوهی)، ایران و حقوق بشر، خدمات راهبردی (مدرنیزاسیون و توسعه سازمانی در دانشگاه سوربن)، روانکاوی بالینی لکانی، و سفرهایی که زندگی را می‌سازند.'
              : "Bienvenue. Ce portail rassemble mes travaux dans quatre domaines : l'Art et la Poésie (calligraphie, peinture, études sur Hafez), les Droits humains en Iran (LDDHI), le Conseil stratégique (Sorbonne), et la Psychanalyse clinique lacanienne."}
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <Link
              href={`/${locale}/books`}
              className="flex items-center gap-2 px-5 py-3 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors"
            >
              <BookOpen size={16} />
              <span>{isFa ? `کتاب‌خانه (${books.length}+ کتاب)` : `Bibliothèque (${books.length}+ Livres)`}</span>
            </Link>

            <Link
              href={`/${locale}/hafez`}
              className="flex items-center gap-2 px-5 py-3 rounded-lg bg-[var(--surface-sunken)] hover:bg-[var(--surface-canvas)] border border-[var(--border-medium)] text-[var(--foreground)] font-semibold text-xs sm:text-sm transition-colors shadow-xs"
            >
              <Feather size={16} className="text-[var(--accent-gold)]" />
              <span>{isFa ? 'قطب حافظ‌پژوهی و دگرشنیدن' : 'Pôle Hafez & Poésie'}</span>
            </Link>

            <Link
              href={`/${locale}/about`}
              className="flex items-center gap-2 px-5 py-3 rounded-lg bg-[var(--surface-card)] hover:bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-medium text-xs sm:text-sm transition-colors"
            >
              <GraduationCap size={16} className="text-[var(--primary)]" />
              <span>{isFa ? 'شرح حال، ۶ دانشگاه و مصاحبه‌ها' : 'Biographie, 6 Universités & Entretiens'}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 4 Iconic Top Portals (چهار درگاه اصلی بالای صفحه اول به یادگار سایت وردپرسی) */}
      <section aria-label="چهار درگاه اصلی" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {fourHeroPortals.map((portal) => {
          const Icon = portal.icon;
          return (
            <Link
              key={portal.id}
              href={portal.href}
              className="group p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] archival-lift flex flex-col justify-between space-y-4 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--surface-sunken)] group-hover:scale-105 transition-transform duration-200"
                  style={{ color: portal.accent }}
                >
                  <Icon size={22} />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--foreground)]">
                  {portal.badge}
                </span>
              </div>

              <div className="space-y-1.5">
                <h2 className="text-lg font-black text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors duration-150">
                  {portal.title}
                </h2>
                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                  {portal.subtitle}
                </p>
              </div>
            </Link>
          );
        })}
      </section>

      {/* Featured 3D Book Showcase (v8.0 Cultural Sanctuary Edition) */}
      {featuredBook && (
        <section
          aria-label="ویترین سه‌بعدی کتاب برگزیده"
          className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 sm:p-10 lg:p-12 overflow-hidden shadow-sm"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 flex justify-center bg-[var(--surface-sunken)] rounded-2xl p-4 border border-[var(--border-subtle)]">
              <Book3DShowcase book={featuredBook} translation={featuredBookTrans} locale={locale} />
            </div>

            <div className="lg:col-span-7 space-y-5">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--primary)] font-bold">
                {isFa
                  ? 'ویترین سه‌بعدی و کتاب‌خوان ورق‌خور • اثر شاخص ترجمه و پژوهش'
                  : 'Vitrine 3D Interactive • Publication Majeure'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--foreground)]">
                {featuredBookTrans?.title || featuredBook.slug}
              </h2>
              {featuredBookTrans?.subtitle && (
                <p className="text-sm font-bold text-[var(--foreground-muted)]">
                  {featuredBookTrans.subtitle}
                </p>
              )}
              <p className="text-sm text-[var(--foreground-muted)] leading-relaxed font-serif">
                {featuredBookTrans?.synopsis}
              </p>

              <div className="flex flex-wrap gap-3.5 pt-2">
                <Link
                  href={`/${locale}/books/${featuredBook.slug}`}
                  className="px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  {isFa
                    ? 'گشودن کتاب و تورق سه‌بعدی (از صفحه ۱ عنوان)'
                    : 'Ouvrir et feuilleter en 3D (Page 1)'}
                </Link>
                <Link
                  href={`/${locale}/books`}
                  className="px-5 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--foreground)] text-xs font-bold hover:bg-[var(--surface-overlay)] transition-colors"
                >
                  {isFa ? `مشاهده همه ${books.length} کتاب در ۸ ژانر` : `Tous les ${books.length} livres`}
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4 Pillars Interactive Grid */}
      <section aria-label="ستون‌های محتوایی" className="space-y-6">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
              {isFa ? 'ستون‌های چهارگانه اندیشه و آفرینش' : 'Piliers Fondamentaux'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
              {isFa
                ? 'دسته‌بندی ساختاریافته مقالات، کتاب‌ها، آثار هنری و اسناد حقوق بشری'
                : 'Domaines d’investigation clinique, artistique, stratégique et philosophique'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <Link
                key={p.id}
                href={p.href}
                className="group p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-transparent hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
              >
                <div
                  className="absolute top-0 start-0 end-0 h-1.5 transition-all duration-300 group-hover:h-2"
                  style={{ backgroundColor: p.accent }}
                />
                <div className="space-y-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center bg-stone-100 dark:bg-stone-800 transition-transform duration-300 group-hover:scale-110"
                    style={{ color: p.accent }}
                  >
                    <Icon size={24} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors flex items-center justify-between">
                      <span>{p.title}</span>
                      {isFa ? (
                        <ArrowLeft size={16} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      ) : (
                        <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      )}
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      {p.description}
                    </p>
                  </div>
                </div>

                <div
                  className="pt-4 mt-4 border-t border-stone-100 dark:border-stone-800 text-[11px] font-semibold flex items-center justify-between"
                  style={{ color: p.accent }}
                >
                  <span>{isFa ? 'ورود به بخش اختصاصی' : 'Consulter le pilier'}</span>
                  <span>{isFa ? '←' : '→'}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Academic Credentials (6 Universities) & Global Presence («حضور من در هستی») */}
      <section
        aria-label="کارنامه دانشگاهی و حضور جهانی"
        className="rounded-3xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-6 sm:p-10 space-y-8"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-teal-600 font-bold">
              <Globe size={16} />
              <span>{isFa ? 'حضور من در هستی • ۶ دانشگاه ایران و فرانسه' : 'Parcours Académique & Muséal'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--foreground)]">
              {isFa
                ? 'کارنامه دانشگاهی، موزه مدرن خوشنویسی مسکو و نهادهای بین‌المللی'
                : 'Universités (Iran & France), Musée de Moscou et Institutions'}
            </h2>
          </div>

          <Link
            href={`/${locale}/about`}
            className="text-xs font-bold text-[var(--primary)] hover:underline shrink-0"
          >
            {isFa ? 'مشاهده کامل شرح حال، ۳۴+ مصاحبه و منابع ←' : 'Voir la biographie complète →'}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACADEMIC_INSTITUTIONS.map((inst) => (
            <div
              key={inst.id}
              className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-1.5"
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-[var(--foreground-muted)]">
                <span className="font-bold text-teal-700 dark:text-teal-400">
                  {inst.country === 'IR' ? (isFa ? 'ایران' : 'Iran') : isFa ? 'فرانسه' : 'France'}
                </span>
                <span>{inst.period}</span>
              </div>
              <h3 className="text-sm font-bold text-[var(--foreground)] leading-snug">
                {inst.name[locale]}
              </h3>
              <p className="text-xs text-[var(--foreground-muted)]">{inst.role[locale]}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {GLOBAL_AUTHORITY_BADGES.map((badge) => (
            <div
              key={badge.id}
              className="p-3.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-1"
            >
              <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 block">
                {badge.badgeText[locale]}
              </span>
              <h3 className="text-xs font-bold text-[var(--foreground)] leading-snug">
                {badge.title[locale]}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Scholarly Articles */}
      <section aria-label="آخرین مقالات پژوهشی" className="space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
          <div>
            <h2 className="text-2xl font-black text-[var(--foreground)]">
              {isFa ? 'گزیده مقالات و بیانیه‌های پژوهشی' : 'Articles & Essais Récents'}
            </h2>
            <p className="text-xs text-[var(--foreground-muted)] mt-1">
              {isFa
                ? 'مجهز به ارجاع علمی، چکیده مدیریتی و واژه‌نامه لکانی'
                : 'Études cliniques et stratégiques indexées'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.slice(0, 4).map((art) => {
            const trans =
              art.translations?.find((t) => t.languages_code.startsWith(locale)) ||
              art.translations?.[0];
            const pSlug =
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
              <article
                key={art.id}
                className="p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:shadow-lg transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--primary)] font-bold">
                    {art.pillar.replace('_', ' ')}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] leading-snug">
                    <Link
                      href={`/${locale}/${pSlug}/articles/${art.slug}`}
                      className="hover:text-[var(--primary)] transition-colors"
                    >
                      {trans?.title || art.slug}
                    </Link>
                  </h3>
                  <p className="text-xs text-[var(--foreground-muted)] leading-relaxed line-clamp-3">
                    {trans?.executive_summary}
                  </p>
                </div>

                <div className="border-t border-[var(--border-subtle)] pt-3 flex items-center justify-between text-[11px] text-[var(--foreground-muted)]">
                  <span>{art.published_at?.slice(0, 10) || '2026'}</span>
                  <Link
                    href={`/${locale}/${pSlug}/articles/${art.slug}`}
                    className="font-bold text-[var(--primary)] hover:underline"
                  >
                    {isFa ? 'مطالعه مقاله ←' : 'Lire la suite →'}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Censorship-Resistant Full-Text Newsletter */}
      <section aria-label="خبرنامه تمام‌متن ضدسانسور" className="pt-4">
        <NewsletterSignup locale={locale} />
      </section>
    </div>
  );
}
