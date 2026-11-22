import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Palette, MapPin, Calendar, Layers, Award, ArrowLeft, ArrowRight, Images, FileText } from 'lucide-react';
import { getExhibitions, getArtworks, THEMATIC_GALLERIES } from '@/lib/cms';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { ArtworksVaultShowcase } from '@/components/gallery/ArtworksVaultShowcase';
import { buildTrilingualMetadata } from '@/lib/seo-helpers';
import { cleanSummaryWithoutRawUrls } from '@/lib/link-labeler';
import { resolveProxiedMediaUrl } from '@/lib/media-url';

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
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);

  const exhibitions = await getExhibitions(locale);
  const artworks = await getArtworks(locale);

  return (
    <div className="space-y-16">
      {/* Header with Single H1 */}
      <header className="space-y-4 border-b border-[var(--border-subtle)] pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-[var(--color-art)] font-bold">
            <Palette size={16} />
            <span>{tx('گالری‌های موضوعی، خوشنویسی و نمایشگاه‌های جهانی', 'Galeries & Calligraphie', 'Thematic Galleries, Calligraphy & Exhibitions')}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link
              href={`/${locale}/art/articles`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] font-bold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
            >
              <FileText size={13} />
              <span>{tx('مقالات هنر و خوشنویسی', 'Articles sur l’Art', 'Art & Calligraphy Articles')}</span>
            </Link>
            <a
              href="#exhibitions-hall"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] font-bold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
            >
              <Award size={13} />
              <span>{tx(`کارنامه ${exhibitions.length} نمایشگاه جهانی`, `${exhibitions.length} Expositions`, `${exhibitions.length} Exhibitions`)}</span>
            </a>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
          {tx(
            'گالری مجازی، مجموعه‌های نقاشی‌خط و موزه زوم عمیق آثار (IIIF)',
            'Galerie Virtuelle, Séries Thématiques & Zoom Muséal IIIF',
            'Virtual Museum, Thematic Series & IIIF Deep Zoom Gallery'
          )}
        </h1>
        <p className="text-sm text-[var(--foreground-muted)] max-w-3xl leading-relaxed">
          {tx(
            `${exhibitions.length} نمایشگاه نقاشی و خط شکسته نستعلیق نوگرا در موزه‌ها و قصرهای تاریخی اروپا، روسیه، کوبا و مراکش و ${artworks.length} مجموعه تابلو (۸۵۰+ تصویر موزه‌ای)؛ همراه با ۷ اثر در گنجینه دائمی موزه مدرن خوشنویسی مسکو.`,
            `${exhibitions.length} expositions internationales, ${artworks.length} séries calligraphiques et 7 œuvres permanentes au Musée Contemporain de la Calligraphie de Moscou.`,
            `${exhibitions.length} international exhibitions across Europe, Russia, Cuba, and Morocco, ${artworks.length} calligraphic series (850+ museum plates), and 7 permanent works at the Moscow Museum of Modern Calligraphy.`
          )}
        </p>
      </header>

      {/* Interactive Museum Deep-Zoom Stage & Complete Bilingual Artworks Vault */}
      {artworks.length > 0 && (
        <section aria-label={tx('نمایشگر زوم عمیق و گنجینه تابلوها', 'Visionneuse IIIF et collection de tableaux', 'IIIF Deep-Zoom Viewer & Artworks Vault')} className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              {tx(
                `کاوش بافت بوم و گنجینه کامل ${artworks.length} مجموعه تابلو (استاندارد IIIF)`,
                `Exploration Haute Définition IIIF & ${artworks.length} Séries`,
                `IIIF High-Resolution Canvas Explorer & ${artworks.length} Series`
              )}
            </h2>
            <p className="text-xs text-[var(--foreground-muted)]">
              {tx(
                'هر مجموعه تابلو را انتخاب کنید و با دکمه‌های بزرگنمایی بافت مرکب و نقاشی‌خط را از نزدیک ببینید.',
                'Sélectionnez une série pour explorer chaque tableau en haute définition.',
                'Select any series to inspect ink textures and contemporary calligraphic brushstrokes in high resolution.'
              )}
            </p>
          </div>

          <ArtworksVaultShowcase artworks={artworks} locale={locale} />
        </section>
      )}

      {/* Thematic Galleries Series — Live Clickable Links into IIIF Deep Zoom! */}
      <section id="thematic-galleries" aria-label={tx('گالری‌های موضوعی', 'Galeries thématiques', 'Thematic Galleries')} className="space-y-6 scroll-mt-28">
        <div className="border-b border-[var(--border-subtle)] pb-3 space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-600 font-bold">
            <Layers size={15} />
            <span>{tx('گالری‌های موضوعی برگزیده (کلیک برای گشودن در نمایشگر IIIF)', 'Galeries Thématiques', 'Curated Thematic Galleries (Open in IIIF Viewer)')}</span>
          </div>
          <h2 className="text-2xl font-black text-[var(--foreground)]">
            {tx(
              'گالری‌های موضوعی و داستان شکل‌گیری مجموعه‌ها',
              'Séries Calligraphiques et Histoires des Collections',
              'Thematic Calligraphic Series & Curatorial Stories'
            )}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {THEMATIC_GALLERIES.map((gal) => {
            const matchedArtwork = artworks.find((a) => a.slug === gal.artworkSeriesSlug);
            const realCount = matchedArtwork?.gallery_images?.length || gal.artworkCount;
            const thumb = resolveProxiedMediaUrl(
              matchedArtwork?.image_url || matchedArtwork?.gallery_images?.[0]?.url,
              'art',
              gal.title[locale]
            );

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
                        {gal.year} • {realCount} {tx('تابلو', 'œuvres', 'works')}
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
                    <span>{tx('نمایش در زوم عمیق IIIF', 'Ouvrir dans IIIF', 'Open in IIIF Viewer')}</span>
                    {isFa ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Exhibitions Hall Archive (All 27 Canonical Bilingual Exhibitions with Real Photos) */}
      <section id="exhibitions-hall" aria-label={tx('تالارهای نمایشگاهی', 'Salles d’expositions', 'International Exhibitions Hall')} className="space-y-6 scroll-mt-28">
        <div className="border-b border-[var(--border-subtle)] pb-3 space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-teal-600 font-bold">
            <Award size={15} />
            <span>
              {tx(
                `کارنامه کامل نمایشگاه‌های بین‌المللی (${exhibitions.length} نمایشگاه)`,
                `Historique des Expositions (${exhibitions.length})`,
                `Complete International Exhibitions Archive (${exhibitions.length})`
              )}
            </span>
          </div>
          <h2 className="text-2xl font-black text-[var(--foreground)]">
            {tx(
              'کارنامه نمایشگاه‌های بین‌المللی (پاریس، پومپادور، لیموژ، مسکو، سنت‌پترزبورگ، هاوانا، فاس)',
              'Expositions Majeures Internationales',
              'Major International Exhibitions (Paris, Pompadour, Moscow, Havana, Fez)'
            )}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {exhibitions.map((expo) => {
            const trans =
              expo.translations?.find((t) => t.languages_code.startsWith(locale)) ||
              expo.translations?.[0];
            const thumb = resolveProxiedMediaUrl(
              expo.cover_image_url || expo.gallery_images?.[0]?.url,
              'art',
              trans?.title || expo.slug
            );

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
                      {cleanSummaryWithoutRawUrls(trans?.curatorial_statement_markdown)}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                    <span className="text-[var(--foreground-muted)] font-mono text-[11px] tabular-nums">
                      {expo.gallery_images?.length || 0} {tx('تصویر آرشیوی', 'photos', 'archival plates')}
                    </span>
                    <Link
                      href={`/${locale}/art/exhibitions/${expo.slug}`}
                      className="font-bold text-[var(--primary)] hover:underline whitespace-nowrap"
                    >
                      {tx('ورود به تالار ←', 'Visiter →', 'Enter Hall →')}
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
