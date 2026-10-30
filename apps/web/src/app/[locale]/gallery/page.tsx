import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Palette, MapPin, Calendar, Layers, Award } from 'lucide-react';
import { getExhibitions, getArtworks, THEMATIC_GALLERIES } from '@/lib/cms';
import { isValidLocale, type Locale } from '@/lib/i18n';
import { IIIFDeepZoomViewer } from '@/components/gallery/IIIFDeepZoomViewer';

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
  const featuredArtwork = artworks[0];
  const featuredArtworkTrans =
    featuredArtwork?.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    featuredArtwork?.translations?.[0];

  return (
    <div className="space-y-16">
      {/* Header with Single H1 */}
      <header className="space-y-4 border-b border-[var(--border-subtle)] pb-6">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-[var(--color-art)] font-bold">
          <Palette size={16} />
          <span>{isFa ? 'گالری‌های موضوعی، خوشنویسی و نمایشگاه‌های جهانی' : 'Galeries & Calligraphie'}</span>
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
            ? 'بیش از ۲۷ نمایشگاه نقاشی و خط شکسته نستعلیق نوگرا در موزه‌ها و قصرهای تاریخی اروپا، روسیه، کوبا و مراکش؛ همراه با ۷ اثر در گنجینه دائمی موزه مدرن خوشنویسی مسکو.'
            : 'Plus de 27 expositions internationales et 7 œuvres permanentes au Musée Contemporain de la Calligraphie de Moscou.'}
        </p>
      </header>

      {/* Featured Artwork Deep Zoom */}
      {featuredArtwork && (
        <section aria-label="نمایشگر زوم عمیق اثر برگزیده" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                {isFa ? 'کاوش بافت بوم و حرکت قلم‌مو با استاندارد موزه‌ای IIIF' : 'Exploration Haute Définition IIIF'}
              </h2>
              <p className="text-xs text-[var(--foreground-muted)]">
                {isFa ? 'از دکمه‌های بزرگنمایی برای بررسی بافت میکروسکوپی مرکب استفاده کنید.' : 'Utilisez les commandes pour zoomer au cœur de la matière.'}
              </p>
            </div>
          </div>

          <IIIFDeepZoomViewer
            imageId={featuredArtwork.iiif_image_id}
            title={featuredArtworkTrans?.title || 'میان نشان و نماد'}
            medium={featuredArtwork.medium}
            dimensions={featuredArtwork.dimensions}
            locale={locale}
          />
        </section>
      )}

      {/* Thematic Galleries Series (/galleries-persan/) */}
      <section id="thematic-galleries" aria-label="گالری‌های موضوعی" className="space-y-6">
        <div className="border-b border-[var(--border-subtle)] pb-3 space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-600 font-bold">
            <Layers size={15} />
            <span>{isFa ? 'زیرمنوی گالری‌ها (/galleries-persan/)' : 'Galeries Thématiques'}</span>
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
          {THEMATIC_GALLERIES.map((gal) => (
            <article
              key={gal.id}
              className="p-6 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-[var(--foreground-muted)]">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold">
                    {gal.year} • {gal.artworkCount} {isFa ? 'اثر' : 'œuvres'}
                  </span>
                  <span>{gal.dimensions}</span>
                </div>

                <h3 className="text-lg font-bold text-[var(--foreground)]">
                  {gal.title[locale]}
                </h3>

                <p className="text-xs font-semibold text-[var(--primary)]">
                  {gal.inspiration[locale]}
                </p>

                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                  {gal.curatorStatement[locale]}
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--foreground-muted)]">
                <span>{gal.medium[locale]}</span>
                {gal.critiqueAuthor && (
                  <span className="font-bold text-amber-700 dark:text-amber-400">
                    {gal.critiqueAuthor[locale]}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Exhibitions Hall Archive (/nameyshgah-ir/) */}
      <section id="exhibitions-hall" aria-label="تالارهای نمایشگاهی" className="space-y-6">
        <div className="border-b border-[var(--border-subtle)] pb-3 space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-teal-600 font-bold">
            <Award size={15} />
            <span>{isFa ? 'زیرمنوی نمایشگاه‌ها (/nameyshgah-ir/) • ۲۷+ نمایشگاه جهانی' : 'Historique des Expositions'}</span>
          </div>
          <h2 className="text-2xl font-black text-[var(--foreground)]">
            {isFa
              ? 'کارنامه نمایشگاه‌های بین‌المللی (پاریس، پومپادور، مسکو، سنت‌پترزبورگ، هاوانا، فاس)'
              : 'Expositions Majeures Internationaux'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {exhibitions.map((expo) => {
            const trans =
              expo.translations?.find((t) => t.languages_code.startsWith(locale)) ||
              expo.translations?.[0];

            return (
              <article
                key={expo.id}
                className="group rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:shadow-xl transition-all duration-300 p-6 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar size={13} />
                      {expo.start_date.slice(0, 4)}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin size={13} />
                      {expo.venue_city}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors leading-snug">
                    <Link href={`/${locale}/art/exhibitions/${expo.slug}`}>
                      {trans?.title || expo.slug}
                    </Link>
                  </h3>

                  <p className="text-xs text-[var(--foreground-muted)] line-clamp-3 leading-relaxed">
                    {trans?.curatorial_statement_markdown}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                  <span className="text-[var(--foreground-muted)] font-mono text-[11px] truncate max-w-[160px]">
                    {expo.venue_name}
                  </span>
                  <Link
                    href={`/${locale}/art/exhibitions/${expo.slug}`}
                    className="font-bold text-[var(--primary)] hover:underline"
                  >
                    {isFa ? 'ورود به تالار ←' : 'Visiter →'}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
