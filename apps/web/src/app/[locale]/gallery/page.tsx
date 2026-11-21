import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Palette, MapPin, Calendar, Layers, Award, ArrowLeft, ArrowRight, Images, FileText } from 'lucide-react';
import { getExhibitions, getArtworks, THEMATIC_GALLERIES } from '@/lib/cms';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { ArtworksVaultShowcase } from '@/components/gallery/ArtworksVaultShowcase';
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
    path: '/gallery',
    title: isFa
      ? 'موزه نقاشی‌خط، ۲۹ مجموعه گالری و ۲۷ نمایشگاه بین‌المللی | دکتر حسن مکارمی'
      : isFr
        ? 'Galerie Calligraphique (29 Séries) & 27 Expositions Internationales'
        : 'Calligraphy Museum, 29 Artwork Series & 27 International Exhibitions',
    description: isFa
      ? 'گنجینه ۸۵۶ تابلوی نقاشی‌خط و خط شکسته نستعلیق نوگرا با نمایشگر زوم عمیق IIIF و کارنامه ۲۷ نمایشگاه جهانی در پاریس، پومپادور، یونسکو، مسکو، هاوانا و فاس.'
      : isFr
        ? 'Musée virtuel IIIF de 29 séries (856 tableaux) et 27 expositions internationales à Paris, Pompadour, UNESCO, Moscou, La Havane et Fès.'
        : 'IIIF deep-zoom virtual museum featuring 29 calligraphic series (856 artworks) and 27 international exhibitions including Moscow Museum & UNESCO Paris.',
    includeMarkdownTwin: false,
  });
}

export default async function GalleryOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  if (!isValidLocale(locale)) notFound();

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';

  const exhibitions = await getExhibitions(locale);
  const artworks = await getArtworks(locale);

  return (
    <div className="space-y-16">
      {/* Header with Single H1 */}
      <header className="space-y-4 border-b border-[var(--border-subtle)] pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-[var(--color-art)] font-bold">
            <Palette size={16} />
            <span>{isFa ? 'گالری‌های موضوعی، خوشنویسی و نمایشگاه‌های جهانی' : 'Galeries & Calligraphie'}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link
              href={`/${locale}/art/articles`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] font-bold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
            >
              <FileText size={13} />
              <span>{isFa ? 'مقالات هنر و خوشنویسی' : 'Articles sur l’Art'}</span>
            </Link>
            <a
              href="#exhibitions-hall"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] font-bold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
            >
              <Award size={13} />
              <span>{isFa ? `کارنامه ${exhibitions.length} نمایشگاه جهانی` : `${exhibitions.length} Expositions`}</span>
            </a>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
          {isFa
            ? 'گالری مجازی، مجموعه‌های نقاشی‌خط و موزه زوم عمیق آثار (IIIF)'
            : isFr
              ? 'Galerie Virtuelle, Séries Thématiques & Zoom Muséal IIIF'
              : 'Virtual Museum, Thematic Series & IIIF Deep Zoom Gallery'}
        </h1>
        <p className="text-sm text-[var(--foreground-muted)] max-w-3xl leading-relaxed">
          {isFa
            ? `${exhibitions.length} نمایشگاه نقاشی و خط شکسته نستعلیق نوگرا در موزه‌ها و قصرهای تاریخی اروپا، روسیه، کوبا و مراکش و ${artworks.length} مجموعه تابلو (۸۵۰+ تصویر موزه‌ای)؛ همراه با ۷ اثر در گنجینه دائمی موزه مدرن خوشنویسی مسکو.`
            : `${exhibitions.length} expositions internationales, ${artworks.length} séries calligraphiques et 7 œuvres permanentes au Musée Contemporain de la Calligraphie de Moscou.`}
        </p>
      </header>

      {/* Interactive Museum Deep-Zoom Stage & Complete Bilingual Artworks Vault */}
      {artworks.length > 0 && (
        <section aria-label="نمایشگر زوم عمیق و گنجینه تابلوها" className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              {isFa
                ? `کاوش بافت بوم و گنجینه کامل ${artworks.length} مجموعه تابلو (استاندارد IIIF)`
                : `Exploration Haute Définition IIIF & ${artworks.length} Séries`}
            </h2>
            <p className="text-xs text-[var(--foreground-muted)]">
              {isFa
                ? 'هر مجموعه تابلو را انتخاب کنید و با دکمه‌های بزرگنمایی بافت مرکب و نقاشی‌خط را از نزدیک ببینید.'
                : 'Sélectionnez une série pour explorer chaque tableau en haute définition.'}
            </p>
          </div>

          <ArtworksVaultShowcase artworks={artworks} locale={locale} />
        </section>
      )}

      {/* Thematic Galleries Series — Live Clickable Links into IIIF Deep Zoom! */}
      <section id="thematic-galleries" aria-label="گالری‌های موضوعی" className="space-y-6 scroll-mt-28">
        <div className="border-b border-[var(--border-subtle)] pb-3 space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-600 font-bold">
            <Layers size={15} />
            <span>{isFa ? 'گالری‌های موضوعی برگزیده (کلیک برای گشودن در نمایشگر IIIF)' : 'Galeries Thématiques'}</span>
          </div>
          <h2 className="text-2xl font-black text-[var(--foreground)]">
            {isFa
              ? 'گالری‌های موضوعی و داستان شکل‌گیری مجموعه‌ها'
              : isFr
                ? 'Séries Calligraphiques et Histoires des Collections'
                : 'Thematic Calligraphic Series & Curatorial Stories'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {THEMATIC_GALLERIES.map((gal) => {
            const matchedArtwork = artworks.find((a) => a.slug === gal.artworkSeriesSlug);
            const realCount = matchedArtwork?.gallery_images?.length || gal.artworkCount;
            const thumb = matchedArtwork?.image_url || matchedArtwork?.gallery_images?.[0]?.url;

            return (
              <Link
                key={gal.id}
                href={`/${locale}/gallery?series=${gal.artworkSeriesSlug}#iiif-stage`}
                className="group p-6 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] hover:border-[var(--primary)] hover:shadow-lg transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[var(--foreground-muted)]">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold tabular-nums">
                        {gal.year} • {realCount} {isFa ? 'تابلو' : 'œuvres'}
                      </span>
                      <span>{gal.dimensions}</span>
                    </div>
                    {thumb && (
                      <img
                        src={thumb}
                        alt={gal.title[locale]}
                        loading="lazy"
                        decoding="async"
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-xl object-cover border border-[var(--border-subtle)] shrink-0"
                      />
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                    {gal.title[locale]}
                  </h3>

                  <p className="text-xs font-semibold text-[var(--primary)]">
                    {gal.inspiration[locale]}
                  </p>

                  <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                    {gal.curatorStatement[locale]}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2 text-xs">
                  <span className="text-[11px] text-[var(--foreground-muted)] truncate">
                    {gal.critiqueAuthor ? gal.critiqueAuthor[locale] : gal.medium[locale]}
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-[var(--primary)] shrink-0">
                    <span>{isFa ? 'نمایش در زوم عمیق IIIF' : 'Ouvrir dans IIIF'}</span>
                    {isFa ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Exhibitions Hall Archive (All 27 Canonical Bilingual Exhibitions with Real Photos) */}
      <section id="exhibitions-hall" aria-label="تالارهای نمایشگاهی" className="space-y-6 scroll-mt-28">
        <div className="border-b border-[var(--border-subtle)] pb-3 space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-teal-600 font-bold">
            <Award size={15} />
            <span>
              {isFa
                ? `کارنامه کامل نمایشگاه‌های بین‌المللی (${exhibitions.length} نمایشگاه)`
                : `Historique des Expositions (${exhibitions.length})`}
            </span>
          </div>
          <h2 className="text-2xl font-black text-[var(--foreground)]">
            {isFa
              ? 'کارنامه نمایشگاه‌های بین‌المللی (پاریس، پومپادور، لیموژ، مسکو، سنت‌پترزبورگ، هاوانا، فاس)'
              : 'Expositions Majeures Internationales'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {exhibitions.map((expo) => {
            const trans =
              expo.translations?.find((t) => t.languages_code.startsWith(locale)) ||
              expo.translations?.[0];
            const thumb = expo.cover_image_url || expo.gallery_images?.[0]?.url;

            return (
              <article
                key={expo.id}
                className="group min-w-0 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                {thumb && (
                  <Link
                    href={`/${locale}/art/exhibitions/${expo.slug}`}
                    className="block aspect-[16/10] w-full overflow-hidden bg-[var(--surface-sunken)] relative border-b border-[var(--border-subtle)]"
                  >
                    <img
                      src={thumb}
                      alt={trans?.title || expo.slug}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {(expo.gallery_images?.length || 0) > 0 && (
                      <span className="absolute bottom-2 end-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-mono tabular-nums">
                        <Images size={10} />
                        {expo.gallery_images?.length}
                      </span>
                    )}
                  </Link>
                )}

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3 min-w-0">
                    <div className="flex items-center justify-between gap-2 text-xs text-[var(--foreground-muted)]">
                      <span className="flex items-center gap-1 font-mono tabular-nums shrink-0">
                        <Calendar size={13} />
                        {expo.start_date.slice(0, 4)}
                      </span>
                      <span className="flex items-center gap-1 font-medium truncate">
                        <MapPin size={13} className="shrink-0" />
                        <span className="truncate">{expo.venue_city}</span>
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors leading-snug break-words">
                      <Link href={`/${locale}/art/exhibitions/${expo.slug}`}>
                        {trans?.title || expo.slug}
                      </Link>
                    </h3>

                    <p className="text-xs text-[var(--foreground-muted)] line-clamp-3 leading-relaxed break-words">
                      {trans?.curatorial_statement_markdown}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                    <span className="text-[var(--foreground-muted)] font-mono text-[11px] tabular-nums">
                      {expo.gallery_images?.length || 0} {isFa ? 'تصویر آرشیوی' : 'photos'}
                    </span>
                    <Link
                      href={`/${locale}/art/exhibitions/${expo.slug}`}
                      className="font-bold text-[var(--primary)] hover:underline whitespace-nowrap"
                    >
                      {isFa ? 'ورود به تالار ←' : 'Visiter →'}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
