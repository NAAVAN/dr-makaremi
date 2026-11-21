import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  GraduationCap,
  Globe,
  Mic,
  FileCheck2,
  Film,
  Mail,
  ExternalLink,
  Award,
  Sparkles,
  Download,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Video,
  FileText,
} from 'lucide-react';
import {
  ACADEMIC_INSTITUTIONS,
  GLOBAL_AUTHORITY_BADGES,
  MEDIA_INTERVIEWS_ARCHIVE,
  HUMAN_RIGHTS_REFERENCES_ARCHIVE,
  VIDEO_SERIES_CATALOG,
  getArchivePages,
  getVideoSpeeches,
  resolveBadgeHref,
} from '@/lib/cms';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { AboutTabNavigator } from '@/components/about/AboutTabNavigator';

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
      ? 'در مورد دکتر حسن مکارمی | کارنامه ۶ دانشگاه، مصاحبه‌ها و منابع'
      : isFr
        ? 'À Propos du Dr Hassan Makaremi | CV, 6 Universités, Entretiens & Références'
        : 'About Dr. Hassan Makaremi | Academic CV, 6 Universities, Interviews & References',
    description: isFa
      ? 'شرح حال علمی و هنری دکتر حسن مکارمی (متولد ۱۳۲۹ شیراز)، تحصیل و تدریس در ۶ دانشگاه ایران و فرانسه، ۷ اثر دائمی در موزه خوشنویسی مسکو، ۳۴+ مصاحبه و ۲۷+ سند حقوق بشری.'
      : 'Biographie académique et artistique du Dr Hassan Makaremi : 6 universités, Musée de Moscou, entretiens et références des droits humains.',
    alternates: {
      canonical: `https://makaremi.com/${locale}/about`,
      types: {
        'text/markdown': `https://makaremi.com/${locale}/about.md`,
      },
    },
  };
}

export default async function AboutProfessorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  if (!isValidLocale(locale)) notFound();

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';

  const bioDocumentary = VIDEO_SERIES_CATALOG.find(
    (s) => s.slug === 'morouri-bar-60-sal-zendegi'
  );
  const [archivePages, allVideos] = await Promise.all([
    getArchivePages(locale),
    getVideoSpeeches(locale),
  ]);

  const bioDocVideos = allVideos
    .filter((v) => v.series_slug === 'morouri-bar-60-sal-zendegi')
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const conferencePages = archivePages.filter((p) => p.group === 'conferences');
  const otherReferencePages = archivePages.filter(
    (p) => p.group !== 'conferences' && p.slug !== 'page-2673'
  );

  return (
    <div className="space-y-16">
      <link
        rel="alternate"
        type="text/markdown"
        href={`/${locale}/about.md`}
        title="Markdown Twin"
      />

      {/* Page Header with STRICT SINGLE H1 */}
      <header className="space-y-5 border-b border-[var(--border-subtle)] pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-[var(--primary)] font-bold">
            <Award size={16} />
            <span>
              {isFa
                ? 'در مورد استاد • شرح حال، ۶ دانشگاه، مصاحبه‌ها، کنفرانس‌ها و منابع'
                : isFr
                  ? 'À Propos • Biographie, 6 Universités, Entretiens & Références'
                  : 'About • Biography, 6 Universities, Interviews & References'}
            </span>
          </div>

          <Link
            href={`/${locale}/about.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
          >
            <Download size={13} />
            <span>.md (AEO / CV Twin)</span>
          </Link>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--foreground)] tracking-tight leading-tight">
          {isFa
            ? 'دکتر حسن مکارمی؛ پنج دهه اندیشه، روانکاوی، هنر خوشنویسی و دادخواهی'
            : isFr
              ? 'Dr Hassan Makaremi : Parcours Académique, Psychanalytique et Artistique'
              : 'Dr. Hassan Makaremi: Five Decades of Psychoanalysis, Art, Strategy & Human Rights'}
        </h1>

        <p className="text-sm sm:text-base text-[var(--foreground-muted)] max-w-4xl leading-relaxed">
          {isFa
            ? 'زاده ۱۳۲۹ خورشیدی (۱۹۵۰ میلادی) در شیراز. روانکاو بالینی و عضو هیئت مدیره انجمن روان‌پژوهان ایران در فرانسه، پژوهشگر دانشگاه سوربن پاریس، متخصص مشاوره راهبردی در بخش فرهنگی و نوسازی سازمانی، خزانه‌دار جامعه دفاع از حقوق بشر در ایران (LDDHI)، شاعر و هنرمند خوشنویس با ۲۷ نمایشگاه جهانی و ۷ اثر در گنجینه دائمی موزه مدرن خوشنویسی مسکو.'
            : isFr
              ? 'Né en 1950 à Chiraz. Psychanalyste clinicien à Paris, chercheur à la Sorbonne, consultant stratégique, trésorier de la LDDHI, poète et calligraphe avec 27 expositions internationales et 7 œuvres permanentes au Musée Contemporain de la Calligraphie de Moscou.'
              : 'Born in 1950 in Shiraz. Clinical psychoanalyst in Paris, Sorbonne researcher, strategic consultant, Treasurer of LDDHI, poet, and contemporary calligrapher with 27 international exhibitions and 7 permanent works at the Moscow Museum of Calligraphy.'}
        </p>

        {/* Interactive Tab Navigator synced with ?tab= query parameter */}
        <AboutTabNavigator locale={locale} conferenceCount={conferencePages.length} />
      </header>

      {/* SECTION 1: 6 UNIVERSITIES & ACADEMIC TRAJECTORY */}
      <section id="cv-universities" aria-label="کارنامه دانشگاهی" className="space-y-6 scroll-mt-28">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-teal-600 font-bold">
              <GraduationCap size={16} />
              <span>{isFa ? 'مسیر دانشگاهی از تهران و شیراز تا پاریس و سوربن' : 'Parcours Universitaire'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--foreground)]">
              {isFa
                ? 'تحصیل، پژوهش و تدریس در ۶ قطب دانشگاهی ایران و فرانسه'
                : isFr
                  ? 'Formation, Recherche et Enseignement dans 6 Grandes Universités'
                  : 'Education, Research & Teaching Across 6 Major Universities'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href={`/${locale}/about/cv-en-persane`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--primary)] text-[var(--primary-foreground)]"
            >
              <FileText size={14} />
              <span>{isFa ? 'متن کامل شرح حال (CV)' : 'Lire le CV complet'}</span>
            </Link>
            <a
              href="https://www.makaremi.com/wp-content/uploads/2015/02/cv-hassan-makaremi.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--foreground)] hover:text-[var(--primary)]"
            >
              <Download size={14} />
              <span>{isFa ? 'دانلود PDF رسمی CV' : 'Télécharger CV (PDF)'}</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ACADEMIC_INSTITUTIONS.map((inst) => (
            <article
              key={inst.id}
              className="p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:shadow-lg transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-800 dark:text-teal-300 border border-teal-500/25 font-bold">
                    {inst.country === 'IR' ? (isFa ? 'ایران' : 'Iran') : isFa ? 'فرانسه (پاریس)' : 'France'}
                  </span>
                  <span className="text-[var(--foreground-muted)]">{inst.period}</span>
                </div>
                <h3 className="text-base font-bold text-[var(--foreground)] leading-snug">
                  {inst.name[locale]}
                </h3>
                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                  {inst.role[locale]}
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] text-[11px] font-medium text-[var(--primary)]">
                {inst.field[locale]}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* SECTION 2: GLOBAL PRESENCE («حضور من در هستی») */}
      <section id="global-presence" aria-label="حضور من در هستی" className="space-y-6 scroll-mt-28">
        <div className="space-y-2 border-b border-[var(--border-subtle)] pb-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-amber-600 font-bold">
            <Globe size={16} />
            <span>{isFa ? 'حضور من در هستی • نهادها و موزه‌های بین‌المللی' : 'Présence Internationale'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[var(--foreground)]">
            {isFa
              ? 'جایگاه بین‌المللی در موزه‌ها، مجامع علمی و نهادهای حقوق بشری'
              : isFr
                ? 'Reconnaissance Muséale, Scientifique et Civique'
                : 'International Museum Collections, Academic & Civic Authorities'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GLOBAL_AUTHORITY_BADGES.map((badge) => {
            const targetHref = resolveBadgeHref(badge, locale);
            return (
              <div
                key={badge.id}
                className="p-6 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                    {badge.badgeText[locale]}
                  </span>
                  <h3 className="text-lg font-bold text-[var(--foreground)]">
                    <Link href={targetHref} className="hover:text-[var(--primary)] transition-colors">
                      {badge.title[locale]}
                    </Link>
                  </h3>
                  <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                    {badge.subtitle[locale]}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={targetHref}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline"
                  >
                    <span>{isFa ? 'مشاهده جزئیات و مستندات' : 'Voir les détails'}</span>
                    {isFa ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
                  </Link>
                  {badge.officialExternalUrl && (
                    <a
                      href={badge.officialExternalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--foreground-muted)] hover:text-[var(--primary)]"
                    >
                      <span>{isFa ? 'سایت رسمی موزه' : 'Site officiel'}</span>
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: MEDIA INTERVIEWS ARCHIVE (Linked to Real Migrated XML Pages!) */}
      <section id="interviews-archive" aria-label="مصاحبه با استاد" className="space-y-6 scroll-mt-28">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-sky-600 font-bold">
              <Mic size={16} />
              <span>{isFa ? 'آرشیو مصاحبه با استاد (۳۴+ گفتگوی رسانه‌ای)' : 'Entretiens Médias'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--foreground)]">
              {isFa
                ? 'مصاحبه‌های رسانه‌ای (RFI، دویچه‌وله، رادیو فردا، پیک یونسکو و رادیو زمانه)'
                : isFr
                  ? 'Archives des Entretiens Médias (RFI, Courrier de l’UNESCO, DW...)'
                  : 'Media Interviews Archive (RFI, UNESCO Courier, DW, Radio Zamaneh)'}
            </h2>
          </div>

          <Link
            href={`/${locale}/about/entretiens-fa`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--primary)] text-[var(--primary-foreground)] shrink-0"
          >
            <span>{isFa ? 'مشاهده فهرست کامل ۳۴+ مصاحبه ←' : 'Voir la liste complète (34+) →'}</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MEDIA_INTERVIEWS_ARCHIVE.map((item) => (
            <Link
              key={item.id}
              href={`/${locale}${item.targetPath}`}
              className="group p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--primary)] hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                  <span className="font-bold text-sky-700 dark:text-sky-400">
                    {item.outlet[locale]}
                  </span>
                  <span className="font-mono">{item.date}</span>
                </div>
                <h3 className="text-base font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors leading-snug">
                  {item.title[locale]}
                </h3>
                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                  {item.summary[locale]}
                </p>
              </div>
              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end text-xs font-bold text-[var(--primary)]">
                <span>{isFa ? 'مطالعه متن کامل مصاحبه ←' : 'Lire l’entretien →'}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 4: HUMAN RIGHTS REFERENCES (Linked to Real Migrated XML Documents!) */}
      <section id="human-rights-references" aria-label="منابع و اسناد حقوق بشری" className="space-y-6 scroll-mt-28">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-rose-600 font-bold">
              <FileCheck2 size={16} />
              <span>{isFa ? 'منابع و اسناد حقوق بشری (LDDHI / سازمان ملل)' : 'Références & Archives Civiques'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--foreground)]">
              {isFa
                ? 'منابع، نامه‌های سرگشاده به سازمان ملل و کارزارهای حقوق بشری (۲۷+ سند)'
                : isFr
                  ? 'Références, Lettres Ouvertes à l’ONU et Actions LDDHI / FIDH'
                  : 'Human Rights References, UN Open Letters & LDDHI Statements'}
            </h2>
          </div>

          <Link
            href={`/${locale}/about/references-fa`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--primary)] text-[var(--primary-foreground)] shrink-0"
          >
            <span>{isFa ? 'مشاهده آرشیو کامل ۲۷+ سند ←' : 'Voir toutes les références →'}</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {HUMAN_RIGHTS_REFERENCES_ARCHIVE.map((doc) => (
            <Link
              key={doc.id}
              href={`/${locale}${doc.targetPath}`}
              className="group p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--primary)] hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/25 font-bold">
                    {doc.location}
                  </span>
                  <span className="font-mono text-[var(--foreground-muted)]">{doc.date}</span>
                </div>
                <h3 className="text-base font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors leading-snug">
                  {doc.title[locale]}
                </h3>
                <p className="text-[11px] font-semibold text-[var(--primary)]">
                  {isFa ? 'مخاطب سند: ' : 'Destinataire : '}
                  {doc.recipient[locale]}
                </p>
                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                  {doc.summary[locale]}
                </p>
              </div>
              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end text-xs font-bold text-[var(--primary)]">
                <span>{isFa ? 'مشاهده سند کامل ←' : 'Consulter le document →'}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 5: 4-PART BIOGRAPHICAL DOCUMENTARY (Connected Directly to Real YouTube Videos in Vault!) */}
      {bioDocumentary && (
        <section
          id="bio-documentary"
          aria-label="مستند زندگی‌نامه"
          className="rounded-3xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-6 sm:p-10 space-y-6 scroll-mt-28"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-purple-600 font-bold">
                <Film size={16} />
                <span>
                  {isFa
                    ? 'فیلم‌های درباره استاد • سفرهایی که زندگی را می‌سازند'
                    : 'Documentaire Biographique en 4 Parties'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--foreground)]">
                {bioDocumentary.title[locale]}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--foreground-muted)] max-w-3xl leading-relaxed">
                {bioDocumentary.description[locale]}
              </p>
            </div>
            <Link
              href={`/${locale}/media?series=morouri-bar-60-sal-zendegi#videos-archive`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--primary)] text-[var(--primary-foreground)] shrink-0"
            >
              <Video size={14} />
              <span>{isFa ? 'پخش در آرشیو ویدیو' : 'Voir la série'}</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {bioDocVideos.length > 0
              ? bioDocVideos.map((vid, idx) => {
                const tr =
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
                          alt={tr?.title || vid.slug}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-mono font-bold text-purple-700 dark:text-purple-400">
                          {isFa ? `قسمت ${idx + 1} از ${bioDocVideos.length}` : `Partie ${idx + 1} / ${bioDocVideos.length}`}
                        </span>
                        <h3 className="text-xs font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] leading-snug line-clamp-2">
                          {tr?.title || vid.slug}
                        </h3>
                      </div>
                      <span className="text-[11px] font-bold text-[var(--primary)] pt-2">
                        {isFa ? 'پخش ویدیو ←' : 'Regarder →'}
                      </span>
                    </div>
                  </Link>
                );
              })
              : bioDocumentary.sampleTopics[locale].map((epTitle, idx) => (
                <Link
                  key={idx}
                  href={`/${locale}/media?series=morouri-bar-60-sal-zendegi#videos-archive`}
                  className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--primary)] space-y-2"
                >
                  <span className="text-[11px] font-mono font-bold text-purple-700 dark:text-purple-400">
                    {isFa ? `بخش ${idx + 1} از ۴` : `Partie ${idx + 1} / 4`}
                  </span>
                  <h3 className="text-sm font-bold text-[var(--foreground)] leading-snug">
                    {epTitle}
                  </h3>
                </Link>
              ))}
          </div>
        </section>
      )}

      {/* SECTION 5.5: DEDICATED CONFERENCES & SYMPOSIA ARCHIVE (Synced with ?tab=conferences) */}
      {conferencePages.length > 0 && (
        <section
          id="conferences-archive"
          aria-label="آرشیو کنفرانس‌ها و همایش‌ها"
          className="space-y-6 scroll-mt-28"
        >
          <div className="border-b border-[var(--border-subtle)] pb-3 space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-indigo-600 font-bold">
              <BookOpen size={15} />
              <span>
                {isFa
                  ? `کنفرانس‌ها و همایش‌های علمی و فرهنگی (${conferencePages.length} سند کامل)`
                  : `Conférences & Colloques (${conferencePages.length})`}
              </span>
            </div>
            <h2 className="text-2xl font-black text-[var(--foreground)]">
              {isFa
                ? 'کارنامه کنفرانس‌های روانکاوی، پژوهش و جامعه، حافظ و دادخواهی'
                : 'Conférences en Psychanalyse, Recherche & Société'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {conferencePages.map((pg) => {
              const tr =
                pg.translations?.find((t) => t.languages_code.startsWith(locale)) ||
                pg.translations?.[0];

              return (
                <article
                  key={pg.id}
                  className="archival-lift p-5 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold">
                      {isFa ? 'کنفرانس / همایش' : 'Conférence'}
                    </span>
                    <h3 className="text-sm font-bold text-[var(--foreground)] leading-snug">
                      <Link
                        href={`/${locale}/about/${pg.slug}`}
                        className="hover:text-[var(--primary)] transition-colors"
                      >
                        {tr?.title || pg.slug}
                      </Link>
                    </h3>
                    <p className="text-xs text-[var(--foreground-muted)] line-clamp-2 leading-relaxed">
                      {tr?.excerpt}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[var(--border-subtle)] flex justify-end text-xs">
                    <Link
                      href={`/${locale}/about/${pg.slug}`}
                      className="font-bold text-[var(--primary)] hover:underline"
                    >
                      {isFa ? 'مطالعه متن کامل ←' : 'Consulter →'}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 5.6: CLEAN MIGRATED ARCHIVAL REFERENCE PAGES (Zero WP Shells!) */}
      {otherReferencePages.length > 0 && (
        <section
          id="migrated-reference-pages"
          aria-label="آرشیو صفحات و اسناد مستقل"
          className="space-y-6 scroll-mt-28"
        >
          <div className="border-b border-[var(--border-subtle)] pb-3 space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--primary)] font-bold">
              <FileCheck2 size={15} />
              <span>
                {isFa
                  ? `اسناد، انتشارات و صفحات مرجع تکمیلی (${otherReferencePages.length} سند)`
                  : `Documents de Référence (${otherReferencePages.length})`}
              </span>
            </div>
            <h2 className="text-2xl font-black text-[var(--foreground)]">
              {isFa
                ? 'اسناد مرجع، نشریات، مصاحبه‌ها و یادداشت‌های مستقل'
                : 'Publications, Entretiens & Archives Éditoriales'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherReferencePages.map((pg) => {
              const tr =
                pg.translations?.find((t) => t.languages_code.startsWith(locale)) ||
                pg.translations?.[0];

              return (
                <article
                  key={pg.id}
                  className="archival-lift p-5 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[var(--surface-sunken)] text-[var(--primary)] font-bold">
                      {pg.group}
                    </span>
                    <h3 className="text-sm font-bold text-[var(--foreground)] leading-snug">
                      <Link
                        href={`/${locale}/about/${pg.slug}`}
                        className="hover:text-[var(--primary)] transition-colors"
                      >
                        {tr?.title || pg.slug}
                      </Link>
                    </h3>
                    <p className="text-xs text-[var(--foreground-muted)] line-clamp-2 leading-relaxed">
                      {tr?.excerpt}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[var(--border-subtle)] flex justify-end text-xs">
                    <Link
                      href={`/${locale}/about/${pg.slug}`}
                      className="font-bold text-[var(--primary)] hover:underline"
                    >
                      {isFa ? 'مشاهده متن کامل ←' : 'Consulter →'}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 6: CONTACT & ACADEMIC / ARTISTIC INVITATIONS */}
      <section
        id="contact-section"
        aria-label="تماس با استاد"
        className="rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center scroll-mt-28"
      >
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-emerald-600 font-bold">
            <Mail size={16} />
            <span>{isFa ? 'ارتباط مستقیم و دعوت‌های علمی و هنری' : 'Contact & Mentions Légales'}</span>
          </div>
          <h2 className="text-2xl font-black text-[var(--foreground)]">
            {isFa
              ? 'تماس با دکتر حسن مکارمی (پاریس)'
              : isFr
                ? 'Contacter le Dr Hassan Makaremi (Paris)'
                : 'Contact Dr. Hassan Makaremi (Paris)'}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed">
            {isFa
              ? 'جهت هماهنگی سخنرانی‌های دانشگاهی، سمینارهای روانکاوی، نمایشگاه‌های بین‌المللی خوشنویسی، سفارش کتاب‌ها یا ارتباط با دفتر مشاوره در پاریس می‌توانید از درگاه‌های رسمی زیر یا دستیار هوشمند سایت استفاده فرمایید.'
              : 'Pour toute invitation académique, exposition calligraphique, commande d’ouvrages ou consultation à Paris.'}
          </p>
        </div>

        <div className="lg:col-span-5 space-y-3 bg-[var(--surface-sunken)] p-6 rounded-2xl border border-[var(--border-subtle)] text-xs">
          <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
            <span className="text-[var(--foreground-muted)]">{isFa ? 'مکان فعالیت:' : 'Lieu :'}</span>
            <span className="font-bold text-[var(--foreground)]">Paris, France</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
            <span className="text-[var(--foreground-muted)]">{isFa ? 'پست الکترونیک رسمی:' : 'Email :'}</span>
            <a href="mailto:contact@makaremi.com" className="font-mono font-bold text-[var(--primary)] hover:underline">
              contact@makaremi.com
            </a>
          </div>
          <div className="pt-2 flex flex-wrap gap-2">
            <Link
              href={`/${locale}/assistant`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold bg-[var(--primary)] text-[var(--primary-foreground)]"
            >
              <Sparkles size={14} />
              <span>{isFa ? 'گفتگو با دستیار هوشمند آثار' : 'Assistant IA'}</span>
            </Link>
            <Link
              href={`/${locale}/about/contact-mention-fa`}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--foreground)] hover:text-[var(--primary)]"
            >
              <span>{isFa ? 'اطلاعات حقوقی' : 'Mentions légales'}</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
