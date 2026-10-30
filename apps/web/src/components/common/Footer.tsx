import React from 'react';
import Link from 'next/link';
import type { Locale } from '@makaremi/shared';

interface FooterProps {
  locale: Locale;
}

export function Footer({ locale }: FooterProps) {
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';

  const psychoSlug = isFr ? 'psychanalyse' : 'psychoanalysis';

  return (
    <footer className="mt-20 border-t border-[var(--border-subtle)] bg-[var(--surface-sunken)] py-12 px-4 sm:px-6 lg:px-8 text-sm text-[var(--foreground-muted)] transition-colors">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Column 1-2: Scholarly Colophon */}
        <div className="md:col-span-2 space-y-4">
          <span className="font-bold text-base text-[var(--foreground)] tracking-tight block">
            {isFa ? 'دکتر حسن مکارمی' : 'Dr. Hassan Makaremi'}
          </span>
          <p className="text-xs leading-relaxed max-w-md">
            {isFa
              ? 'روانکاو بالینی لکانی، پژوهشگر مطالعات راهبردی در دانشگاه سوربن، هنرمند نقاش و خوشنویس نوگرا (۷ اثر در گنجینه دائمی موزه مدرن خوشنویسی مسکو)، حافظ‌پژوه، شاعر، و خزانه‌دار جامعه دفاع از حقوق بشر در ایران (LDDHI).'
              : isFr
              ? "Psychanalyste clinicien d'orientation lacanienne, chercheur à l'Université de la Sorbonne, calligraphe contemporain (Musée de Moscou), chercheur sur Hafez et trésorier de la Ligue de défense des droits de l'Homme en Iran (LDDHI)."
              : 'Clinical Lacanian Psychoanalyst, Sorbonne Researcher, Contemporary Calligrapher (7 permanent works in Moscow Museum), Hafez Scholar, Poet, and Treasurer of the League for the Defence of Human Rights in Iran (LDDHI).'}
          </p>
          <div className="flex flex-wrap gap-2 text-xs pt-2">
            <Link
              href="/llms.txt"
              className="px-2.5 py-1 rounded-md bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
            >
              /llms.txt (AI Knowledge Base)
            </Link>
            <Link
              href="/sitemap.xml"
              className="px-2.5 py-1 rounded-md bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
            >
              Sitemap
            </Link>
            <Link
              href={`/${locale}/about`}
              className="px-2.5 py-1 rounded-md bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
            >
              {isFa ? 'کارنامه ۶ دانشگاه و مصاحبه‌ها' : isFr ? 'CV & 6 Universités' : 'Academic CV & Interviews'}
            </Link>
          </div>
        </div>

        {/* Column 3: Core Domains */}
        <div className="space-y-3">
          <span className="font-bold text-xs uppercase tracking-wider text-[var(--foreground)] block">
            {isFa ? 'دامنه‌های اندیشه و هنر' : isFr ? 'Domaines & Piliers' : 'Core Domains'}
          </span>
          <ul className="space-y-2 text-xs">
            <li>
              <Link
                href={`/${locale}/${psychoSlug}`}
                className="hover:text-[var(--color-psychoanalysis)] transition-colors"
              >
                {isFa ? 'روانکاوی لکانی و بالین' : isFr ? 'Psychanalyse Lacanienne' : 'Lacanian Psychoanalysis'}
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/hafez`}
                className="hover:text-amber-600 transition-colors font-semibold"
              >
                {isFa ? 'قطب حافظ‌پژوهی (دیگرشنیدن حافظ)' : isFr ? 'Études sur Hafez' : 'Hafezology Hub'}
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/strategy`}
                className="hover:text-[var(--color-strategy)] transition-colors"
              >
                {isFa ? 'پژوهش، فرهنگ و راهبرد' : isFr ? 'Recherche & Stratégie' : 'Cultural & Strategic Studies'}
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/human-rights`}
                className="hover:text-[var(--color-dadkhahi)] transition-colors"
              >
                {isFa ? 'جامعه، حقوق بشر و دادخواهی' : isFr ? "Société & Droits de l'Homme" : 'Society & Human Rights'}
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/glossary`}
                className="hover:text-[var(--primary)] transition-colors"
              >
                {isFa ? 'واژه‌نامه تحلیلی لکانی' : isFr ? 'Glossaire Lacanien' : 'Lacanian Glossary'}
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 4: Books, Art & Media */}
        <div className="space-y-3">
          <span className="font-bold text-xs uppercase tracking-wider text-[var(--foreground)] block">
            {isFa ? 'انتشارات، گالری و فیلم‌ها' : isFr ? 'Livres, Art & Médias' : 'Books, Art & Media'}
          </span>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href={`/${locale}/books`} className="hover:text-[var(--primary)] transition-colors font-semibold">
                {isFa ? 'تالار کتاب‌های سه‌بعدی و ورق‌خور' : isFr ? 'Bibliothèque 3D Interactive' : '3D Books & Page-Flip Reader'}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/gallery`} className="hover:text-[var(--color-art)] transition-colors">
                {isFa ? 'گالری‌ها و ۲۷+ نمایشگاه جهانی' : isFr ? 'Galeries & 27+ Expositions' : 'Galleries & 27+ Exhibitions'}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/poetry`} className="hover:text-[var(--primary)] transition-colors">
                {isFa ? 'دفتر اشعار و شعر و تصویر' : isFr ? 'Poésie & Image' : 'Poetry & Synchronized Art'}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/media`} className="hover:text-[var(--color-strategy)] transition-colors">
                {isFa ? 'فیلم‌ها (در روان‌‌پژوهی و نگاه روانکاو)' : isFr ? 'Séries Vidéos & Conférences' : 'Video Series & Lectures'}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/about?tab=interviews`} className="hover:text-[var(--primary)] transition-colors">
                {isFa ? 'مصاحبه‌ها (۳۴+ گفتگو) و منابع' : isFr ? 'Entretiens (34+) & Références' : 'Interviews (34+) & References'}
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 5: Studio, AI & Infrastructure Console */}
        <div className="space-y-3">
          <span className="font-bold text-xs uppercase tracking-wider text-[var(--foreground)] block">
            {isFa ? 'استودیو نشر و کنسول هوشمند' : isFr ? 'Studio & Console IA' : 'Publishing Studio & AI'}
          </span>
          <ul className="space-y-2 text-xs">
            <li>
              <Link
                href={`/${locale}/book-studio`}
                className="hover:text-amber-600 transition-colors font-semibold"
              >
                {isFa ? 'استودیوی مدیریت کتاب 3D (دشبورد)' : isFr ? 'Studio d’Édition 3D (Admin)' : '3D Book Studio (Dashboard)'}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/assistant`} className="hover:text-[var(--primary)] transition-colors">
                {isFa ? 'دستیار هوشمند پژوهشگر (RAG)' : isFr ? 'Assistant IA de Recherche' : 'AI Research Assistant'}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/agent-console`} className="hover:text-emerald-600 transition-colors">
                {isFa ? 'پیشخوان ایجنت تلگرام و واتس‌اپ' : isFr ? 'Console Agent IA' : 'Personal AI Agent Studio'}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/system-status`} className="hover:text-emerald-600 transition-colors">
                {isFa ? 'پایش وضعیت سیستم و گواهی امنیتی' : isFr ? 'Statut du Système' : 'System Status & QA'}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <p>© {new Date().getFullYear()} Dr. Hassan Makaremi. All rights reserved.</p>
        <p className="text-[11px] text-[var(--foreground-muted)]">
          {isFa
            ? 'طراحی اختصاصی بر اساس معماری ایمن و مقاوم در برابر فیلترینگ MAKAREMI-CORE-2026'
            : 'Designed with Zero-Trust Jamstack Architecture (MAKAREMI-CORE-2026)'}
        </p>
      </div>
    </footer>
  );
}
