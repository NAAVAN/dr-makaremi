'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Menu,
  X,
  BookOpen,
  Palette,
  Compass,
  Sparkles,
  Radio,
  ChevronDown,
  UserCheck,
  Feather,
  Video,
  Home,
} from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { SearchModal } from './SearchModal';
import { MirrorSwitcher } from './MirrorSwitcher';
import type { Locale } from '@makaremi/shared';

interface HeaderProps {
  locale: Locale;
}

interface SubMenuItem {
  href: string;
  label: string;
  badge?: string;
}

interface NavGroupItem {
  href: string;
  label: string;
  accent: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  subItems?: SubMenuItem[];
}

export function Header({ locale }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mirrorOpen, setMirrorOpen] = useState(false);

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';

  const psychoSlug = isFr ? 'psychanalyse' : 'psychoanalysis';

  const navGroups: NavGroupItem[] = [
    {
      href: `/${locale}`,
      label: isFa ? 'صفحه اول' : isFr ? 'Accueil' : 'Home',
      accent: 'var(--primary)',
      icon: Home,
    },
    {
      href: `/${locale}/about`,
      label: isFa ? 'در مورد استاد' : isFr ? 'À Propos' : 'About',
      accent: '#0d9488',
      icon: UserCheck,
      subItems: [
        {
          href: `/${locale}/about?tab=cv`,
          label: isFa
            ? 'شرح حال و کارنامه ۶ دانشگاه (ایران و فرانسه)'
            : isFr
              ? 'Biographie & 6 Universités (Iran & France)'
              : 'Biography & 6 Universities (Iran & France)',
          badge: '6 Univ',
        },
        {
          href: `/${locale}/about?tab=global`,
          label: isFa
            ? 'حضور در هستی (موزه مسکو، یونسکو، بنیاد توس)'
            : isFr
              ? 'Présence Mondiale (Musée de Moscou, UNESCO)'
              : 'Global Presence (Moscow Museum, UNESCO, Toos)',
        },
        {
          href: `/${locale}/about?tab=interviews`,
          label: isFa
            ? 'مصاحبه با استاد (آرشیو ۳۴+ گفتگوی رسانه‌ای)'
            : isFr
              ? 'Entretiens Médias (34+ Interviews)'
              : 'Media Interviews (34+ Conversations)',
          badge: '34+',
        },
        {
          href: `/${locale}/about?tab=references`,
          label: isFa
            ? 'منابع و اسناد حقوق بشری (LDDHI / سازمان ملل)'
            : isFr
              ? 'Références & Déclarations Droits Humains (LDDHI)'
              : 'Human Rights References & UN Letters (LDDHI)',
          badge: '27+',
        },
        {
          href: `/${locale}/about?tab=documentary`,
          label: isFa
            ? 'فیلم مستند زندگی‌نامه (۴ قسمت) و سفرهای زندگی'
            : isFr
              ? 'Documentaire Biographique (4 parties)'
              : 'Biographical Documentary (4 Parts)',
        },
      ],
    },
    {
      href: `/${locale}/${psychoSlug}`,
      label: isFa ? 'روانکاوی' : isFr ? 'Psychanalyse' : 'Psychoanalysis',
      accent: 'var(--color-psychoanalysis)',
      icon: Sparkles,
      subItems: [
        {
          href: `/${locale}/${psychoSlug}/articles`,
          label: isFa
            ? 'مقالات بالینی و نظری لکانی'
            : isFr
              ? 'Articles Cliniques & Théoriques'
              : 'Clinical & Theoretical Lacanian Articles',
        },
        {
          href: `/${locale}/media?series=dar-ravanpajoohi-ba-makaremi`,
          label: isFa
            ? 'مجموعه فیلم‌ها: «در روان‌‌پژوهی» (۶۵+ قسمت)'
            : isFr
              ? 'Série Vidéo : « Recherche Psychanalytique » (65+)'
              : 'Video Series: “In Psycho-Research” (65+ Ep)',
          badge: '65 Ep',
        },
        {
          href: `/${locale}/media?series=negah-e-ravankav`,
          label: isFa
            ? 'مجموعه فیلم‌ها: «نگاه روانکاو» (۸۱+ قسمت)'
            : isFr
              ? 'Série Vidéo : « Le Regard du Psychanalyste » (81+)'
              : 'Video Series: “The Psychoanalyst’s Gaze” (81+ Ep)',
          badge: '81 Ep',
        },
        {
          href: `/${locale}/books?genre=psychoanalysis`,
          label: isFa
            ? 'کتاب‌های روانکاوی (تألیف و ترجمه لکان)'
            : isFr
              ? 'Livres de Psychanalyse & Traductions de Lacan'
              : 'Psychoanalysis Books & Lacan Translations',
        },
        {
          href: `/${locale}/glossary`,
          label: isFa
            ? 'واژه‌نامه تحلیلی روانکاوی لکانی'
            : isFr
              ? 'Glossaire Analytique Lacanien'
              : 'Controlled Lacanian Glossary',
        },
      ],
    },
    {
      href: `/${locale}/strategy`,
      label: isFa ? 'پژوهش و جامعه' : isFr ? 'Recherche & Société' : 'Research & Society',
      accent: 'var(--color-strategy)',
      icon: Compass,
      subItems: [
        {
          href: `/${locale}/strategy/articles`,
          label: isFa
            ? 'مقالات پژوهش، اسطوره‌شناسی و سرزمین فرهنگی ایران'
            : isFr
              ? 'Articles Recherche & Terre Culturelle d’Iran'
              : 'Cultural Research & Mythology Articles',
        },
        {
          href: `/${locale}/human-rights`,
          label: isFa
            ? 'مقالات جامعه، حقوق بشر و دادخواهی'
            : isFr
              ? 'Articles Société, Droits Humains & Justice'
              : 'Society, Human Rights & Transitional Justice',
        },
        {
          href: `/${locale}/books?genre=strategy`,
          label: isFa
            ? 'کتاب راهبردی (دوران گذار و ایران آینده)'
            : isFr
              ? 'Livres de Stratégie & Iran du Futur'
              : 'Strategic Books (Transition & Future Iran)',
        },
        {
          href: `/${locale}/books?genre=culture`,
          label: isFa
            ? 'کتاب پژوهش و فرهنگ (سرزمین فرهنگی ایران)'
            : isFr
              ? 'Livres de Recherche Culturelle'
              : 'Cultural Research Monographs',
        },
        {
          href: `/${locale}/media?pillar=human_rights_dadkhahi`,
          label: isFa
            ? 'کنفرانس‌های پژوهش و جامعه'
            : isFr
              ? 'Conférences Recherche & Société'
              : 'Research & Society Conferences',
        },
      ],
    },
    {
      href: `/${locale}/gallery`,
      label: isFa ? 'هنر' : isFr ? 'Art' : 'Art',
      accent: 'var(--color-art)',
      icon: Palette,
      subItems: [
        {
          href: `/${locale}/gallery`,
          label: isFa
            ? 'گالری‌های موضوعی و موزه زوم عمیق (IIIF)'
            : isFr
              ? 'Galeries Thématiques & Zoom Muséal IIIF'
              : 'Thematic Galleries & IIIF Deep Zoom Museum',
        },
        {
          href: `/${locale}/gallery#exhibitions-hall`,
          label: isFa
            ? 'نمایشگاه‌های بین‌المللی (۳۵ نمایشگاه جهانی)'
            : isFr
              ? 'Historique des Expositions (35 Internationales)'
              : 'International Exhibitions Archive (35 Shows)',
          badge: '35',
        },
        {
          href: `/${locale}/art/exhibitions/moscow-museum-modern-calligraphy`,
          label: isFa
            ? 'گنجینه موزه مدرن خوشنویسی مسکو (۷ اثر دائمی)'
            : isFr
              ? 'Collection du Musée de la Calligraphie de Moscou'
              : 'Moscow Museum of Calligraphy (7 Permanent Works)',
        },
        {
          href: `/${locale}/media?series=az-namadpardazi-ta-nastaaliq`,
          label: isFa
            ? 'فیلم‌ها و کنفرانس‌های هنر (از نمادپردازی تا نستعلیق)'
            : isFr
              ? 'Vidéos & Conférences Art (Du Symbolisme au Nasta’liq)'
              : 'Art Films & UNESCO Lectures',
        },
        {
          href: `/${locale}/books?genre=art`,
          label: isFa
            ? 'کتاب‌های هنر و خوشنویسی (L’Harmattan)'
            : isFr
              ? 'Bibliographie Art & Calligraphie'
              : 'Art & Calligraphy Bibliography',
        },
      ],
    },
    {
      href: `/${locale}/hafez`,
      label: isFa ? 'شعر و حافظ' : isFr ? 'Poésie & Hafez' : 'Poetry & Hafez',
      accent: '#d97706',
      icon: Feather,
      subItems: [
        {
          href: `/${locale}/hafez`,
          label: isFa
            ? 'قطب حافظ‌پژوهی (دیگرشنیدن حافظ و راز غزل)'
            : isFr
              ? 'Pôle Hafez : Écouter Hafez Autrement'
              : 'Hafezology Hub: Listening Differently to Hafez',
          badge: isFa ? 'ویژه' : 'Hafez',
        },
        {
          href: `/${locale}/hafez#hafez-videos`,
          label: isFa
            ? 'مجموعه ویدیویی «صدای سخن عشق (حافظ)»'
            : isFr
              ? 'Série Vidéo « La Voix de l’Amour (Hafez) »'
              : 'Video Series: “The Voice of Love (Hafez)”',
        },
        {
          href: `/${locale}/poetry`,
          label: isFa
            ? 'شعر و تصویر (همگام‌سازی دکلمه و نقاشی‌خط)'
            : isFr
              ? 'Poésie & Image (Récitation & Calligraphie)'
              : 'Poetry & Image (Synchronized Recitation & Art)',
        },
        {
          href: `/${locale}/poetry#poems-archive`,
          label: isFa
            ? 'دفتر اشعار و سروده‌های دکتر حسن مکارمی'
            : isFr
              ? 'Recueil de Poèmes'
              : 'Archive of Poems',
        },
        {
          href: `/${locale}/books?genre=poetry`,
          label: isFa
            ? 'کتاب‌های شعر دوزبانه (پیانو با چهار دست / این باغ را...)'
            : isFr
              ? 'Livres de Poésie Bilingue (Piano à quatre mains)'
              : 'Bilingual Poetry Books',
        },
      ],
    },
    {
      href: `/${locale}/books`,
      label: isFa ? 'کتاب‌ها (3D)' : isFr ? 'Livres 3D' : '3D Books',
      accent: 'var(--primary)',
      icon: BookOpen,
      subItems: [
        {
          href: `/${locale}/books`,
          label: isFa
            ? 'تالار جامع کتاب‌ها و کتاب‌خوان ورق‌خور سه‌بعدی'
            : isFr
              ? 'Bibliothèque 3D & Lecteur Interactif'
              : '3D Book Showcase & Interactive Page-Flip Reader',
          badge: 'v8.0 3D',
        },
        {
          href: `/${locale}/books?genre=psychoanalysis`,
          label: isFa ? 'کتاب‌های روانکاوی لکانی' : isFr ? 'Livres de Psychanalyse' : 'Psychoanalysis Books',
        },
        {
          href: `/${locale}/books?genre=hafez`,
          label: isFa ? 'کتاب‌های حافظ‌پژوهی (فارسی و فرانسه)' : isFr ? 'Livres sur Hafez' : 'Hafez Studies Books',
        },
        {
          href: `/${locale}/books?genre=strategy`,
          label: isFa ? 'کتاب‌های مطالعات راهبردی و فرهنگ' : isFr ? 'Livres de Stratégie & Culture' : 'Strategy & Culture Books',
        },
        {
          href: `/${locale}/books?genre=novel`,
          label: isFa
            ? 'رمان و خاطرات (جغرافیای بازار وکیل / گریز ناگزیر)'
            : isFr
              ? 'Romans & Mémoires (Bazar Vakil / Mémoires)'
              : 'Novels & Memoirs (Vakil Bazaar / Thirty Narratives)',
        },
        {
          href: `/${locale}/book-studio`,
          label: isFa
            ? 'استودیوی مدیریت و مهندسی کتاب (پنل مدیر سایت)'
            : isFr
              ? 'Studio d’Édition 3D (Console Admin)'
              : '3D Book Publishing Studio (Admin Dashboard)',
          badge: 'Studio',
        },
      ],
    },
    {
      href: `/${locale}/media`,
      label: isFa ? 'فیلم‌ها و تماس' : isFr ? 'Médias & Contact' : 'Media & Contact',
      accent: 'var(--color-strategy)',
      icon: Video,
      subItems: [
        {
          href: `/${locale}/media`,
          label: isFa
            ? 'آرشیو جامع فیلم‌ها، سخنرانی‌ها و پادکست‌ها'
            : isFr
              ? 'Archives Vidéos, Conférences & Podcasts'
              : 'Complete Video Lectures & Podcasts Archive',
        },
        {
          href: `/${locale}/assistant`,
          label: isFa
            ? 'دستیار هوشمند پژوهشگر آثار (RAG & MCP)'
            : isFr
              ? 'Assistant de Recherche IA (RAG)'
              : 'AI Research Assistant (RAG & MCP)',
        },
        {
          href: `/${locale}/about?tab=contact`,
          label: isFa
            ? 'تماس با استاد و دعوت به سخنرانی / نمایشگاه'
            : isFr
              ? 'Contact & Mentions Légales'
              : 'Contact Dr. Makaremi',
        },
      ],
    },
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[#FBFBF9]/95 dark:bg-[#121316]/95 border-b border-stone-200 dark:border-stone-800 transition-colors shadow-sm">
      {/* TIER 1: Brand Identity (Right in RTL) + Framed Language & Utility Controls (Left in RTL) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between py-3.5 sm:py-4 gap-4">
          {/* Logo / Brand Identity with Generous Breathing Space */}
          <Link
            href={`/${locale}`}
            className="flex items-center gap-3.5 group select-none shrink-0"
            aria-label="صفحه اصلی دکتر حسن مکارمی"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-800 to-stone-900 text-amber-300 flex items-center justify-center text-lg font-bold shadow-sm border border-amber-500/30 shrink-0">
              ✦
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors leading-none">
                {isFa ? 'دکتر حسن مکارمی' : 'Dr. Hassan Makaremi'}
              </span>
              <span className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 font-medium">
                {isFa
                  ? 'هنرمند خوشنویس • روانکاو بالینی لکانی • پژوهشگر سوربن پاریس'
                  : isFr
                    ? 'Artiste Calligraphe • Psychanalyste Lacanien • Chercheur à la Sorbonne'
                    : 'Calligrapher • Clinical Lacanian Psychoanalyst • Sorbonne Researcher'}
              </span>
            </div>
          </Link>

          {/* Action Tools & Language Switcher (Strictly Framed & Contained Inside Header) */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="جستجو در سایت"
              className="px-3 py-1.5 rounded-xl text-stone-700 dark:text-stone-200 hover:bg-stone-200/70 dark:hover:bg-stone-800 transition-colors border border-stone-300/80 dark:border-stone-700 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="جستجو (Cmd+K)"
            >
              <Search size={15} />
              <span className="hidden sm:inline">{isFa ? 'جستجو' : isFr ? 'Recherche' : 'Search'}</span>
            </button>

            <Link
              href={`/${locale}/assistant`}
              aria-label={isFa ? 'دستیار پژوهشگر' : 'Research Assistant'}
              className="px-3 py-1.5 rounded-xl text-amber-800 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 transition-colors border border-amber-500/30 flex items-center gap-1.5 text-xs font-bold"
              title={isFa ? 'دستیار هوشمند پژوهشگر' : 'AI Research Assistant'}
            >
              <Sparkles size={14} />
              <span className="hidden md:inline">{isFa ? 'دستیار هوشمند' : 'Assistant IA'}</span>
            </Link>

            <button
              type="button"
              onClick={() => setMirrorOpen(true)}
              aria-label={isFa ? 'مسیرهای ضدسانسور و آینه‌ها' : 'Miroirs et accès anti-censure'}
              className="p-2 rounded-xl text-sky-700 dark:text-sky-400 hover:bg-sky-500/10 transition-colors border border-sky-500/30 cursor-pointer"
              title={isFa ? 'مسیرهای ضدسانسور و آینه‌های ابری' : 'Miroirs et accès anti-censure'}
            >
              <Radio size={16} />
            </button>

            {/* Framed Language Switcher */}
            <LanguageSwitcher currentLocale={locale} />

            {/* Dark / Light Theme Toggle */}
            <ThemeToggle />

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-stone-700 dark:text-stone-200 hover:bg-stone-200/70 dark:hover:bg-stone-800 transition-colors border border-stone-300 dark:border-stone-700 cursor-pointer"
              aria-label="منوی موبایل"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* TIER 2: Dedicated Cultural Mega-Navigation Bar (Separated with Generous Spacing & Centered Balance) */}
      <div className="hidden lg:block border-t border-stone-200/80 dark:border-stone-800/80 bg-[#F4F2EC]/90 dark:bg-[#16181E]/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav
            className="flex items-center justify-center gap-1.5 xl:gap-3 py-2"
            aria-label="ناوبری اصلی"
          >
            {navGroups.map((group) => {
              const isHome = group.href === `/${locale}`;
              const isActive = isHome
                ? pathname === group.href
                : pathname.startsWith(group.href.split('?')[0]);
              const IconComp = group.icon;

              return (
                <div key={group.href} className="relative group/nav">
                  <Link
                    href={group.href}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs xl:text-[13px] font-bold whitespace-nowrap transition-all duration-200 ${isActive
                        ? 'bg-white dark:bg-stone-800 text-teal-900 dark:text-teal-300 shadow-sm border border-stone-200/80 dark:border-stone-700'
                        : 'text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white hover:bg-white/70 dark:hover:bg-stone-800/60'
                      }`}
                    style={{
                      borderBottom: isActive ? `2px solid ${group.accent}` : undefined,
                    }}
                  >
                    {IconComp && <IconComp size={14} className="opacity-75 shrink-0" />}
                    <span>{group.label}</span>
                    {group.subItems && group.subItems.length > 0 && (
                      <ChevronDown
                        size={13}
                        className="opacity-60 group-hover/nav:rotate-180 transition-transform duration-200"
                      />
                    )}
                  </Link>

                  {/* Dropdown Submenu */}
                  {group.subItems && group.subItems.length > 0 && (
                    <div
                      className={`invisible opacity-0 translate-y-1 group-hover/nav:visible group-hover/nav:opacity-100 group-hover/nav:translate-y-0 focus-within:visible focus-within:opacity-100 transition-all duration-200 absolute top-full ${isFa ? 'right-0' : 'left-0'
                        } pt-2 w-80 z-50`}
                    >
                      <div className="rounded-2xl bg-[#FBFBF9] dark:bg-[#18191D] border border-stone-200/90 dark:border-stone-700 shadow-2xl p-2.5 space-y-1">
                        <div
                          className="px-3 py-2 text-xs font-black border-b border-stone-200/70 dark:border-stone-800 flex items-center justify-between"
                          style={{ color: group.accent }}
                        >
                          <span>{group.label}</span>
                          <span className="text-[10px] opacity-75 font-normal">
                            {isFa ? 'بخش‌های زیرمجموعه' : 'Sous-rubriques'}
                          </span>
                        </div>
                        {group.subItems.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-200/65 dark:hover:bg-stone-800 hover:text-stone-950 dark:hover:text-white transition-colors"
                          >
                            <span className="leading-relaxed">{sub.label}</span>
                            {sub.badge && (
                              <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                                {sub.badge}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Drawer Menu with Expandable Submenus */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[var(--surface-overlay)] border-b border-[var(--border-subtle)] px-4 pt-3 pb-6 space-y-2 max-h-[82vh] overflow-y-auto">
          {navGroups.map((group) => {
            const isExpanded = openMobileGroup === group.href;
            return (
              <div
                key={group.href}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] overflow-hidden"
              >
                <div className="flex items-center justify-between px-3.5 py-3">
                  <Link
                    href={group.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 text-sm font-bold text-[var(--foreground)]"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: group.accent }}
                    />
                    <span>{group.label}</span>
                  </Link>
                  {group.subItems && group.subItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setOpenMobileGroup(isExpanded ? null : group.href)}
                      className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--surface-sunken)] cursor-pointer"
                      aria-label={group.label}
                    >
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                  )}
                </div>

                {group.subItems && isExpanded && (
                  <div className="border-t border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-3 py-2 space-y-1">
                    {group.subItems.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between py-2 px-2.5 rounded-lg text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-card)] transition-colors"
                      >
                        <span>{sub.label}</span>
                        {sub.badge && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                            {sub.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Instant Search Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        locale={locale}
      />

      {/* Anti-Censorship Mirror Switcher Modal */}
      <MirrorSwitcher
        isOpen={mirrorOpen}
        onClose={() => setMirrorOpen(false)}
        locale={locale}
      />
    </header>
  );
}
