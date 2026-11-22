'use client';

import React, { useState } from 'react';
import { Play, Pause, Sparkles } from 'lucide-react';
import { IIIFDeepZoomViewer } from './IIIFDeepZoomViewer';
import { BilingualWorkReader } from '@/components/i18n/BilingualWorkReader';
import { resolveWorkTranslation } from '@/lib/work-language';
import { resolveProxiedMediaUrl } from '@/lib/media-url';
import type { Poem, Artwork, Locale } from '@makaremi/shared';

interface PoetryArtworkSyncProps {
  poem: Poem;
  artwork?: Artwork;
  locale: Locale;
}

export function PoetryArtworkSync({ poem, artwork, locale }: PoetryArtworkSyncProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';

  const resolved = resolveWorkTranslation({
    collection: 'poems',
    slug: poem.slug,
    translations: poem.translations,
    siteLocale: locale,
  });
  const poemTrans = resolved.originalRecord || poem.translations?.[0];
  const artworkTrans = artwork?.translations?.find((t) => t.languages_code.startsWith(locale)) || artwork?.translations?.[0];

  const verses = poemTrans?.verses || [];

  const hasOwnArtwork = Boolean(poem.artwork_image_url);
  const viewerTitle = hasOwnArtwork
    ? poemTrans?.title || poem.slug
    : artworkTrans?.title || poemTrans?.title || (isFa ? 'میان نشان و نماد' : 'Entre Signe et Symbole');
  const hasRealAudio = Boolean(poem.audio_recitation_file_id);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Visual Canvas Side */}
        <div className="space-y-4">
          <IIIFDeepZoomViewer
            imageId={hasOwnArtwork ? `poem-${poem.slug}` : artwork?.iiif_image_id || `poem-${poem.slug}`}
            imageUrl={resolveProxiedMediaUrl(
              poem.artwork_image_url || artwork?.image_url || artwork?.gallery_images?.[0]?.url,
              'art',
              viewerTitle
            )}
            title={viewerTitle}
            medium={hasOwnArtwork ? undefined : artwork?.medium}
            dimensions={hasOwnArtwork ? undefined : artwork?.dimensions}
            locale={locale}
          />
          {!hasOwnArtwork && artworkTrans?.curator_critique_markdown && (
            <div className="p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs text-[var(--foreground-muted)] italic leading-relaxed">
              {artworkTrans.curator_critique_markdown}
            </div>
          )}
        </div>

        {/* Poetry & Recitation Side */}
        <div className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
            <div>
              <span className="text-[11px] font-mono tracking-wider uppercase text-[var(--primary)] block">
                {isFa
                  ? 'شعر و تصویر (سروده و تابلوی اختصاصی)'
                  : isFr
                    ? 'Poésie & Image (Poème et calligraphie)'
                    : 'Poetry & Image (Poem & Original Calligraphy)'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[var(--foreground)] mt-1">
                {poemTrans?.title || poem.slug}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold shadow-md hover:opacity-90 transition-all cursor-pointer shrink-0"
            >
              {hasRealAudio ? (
                <>
                  {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                  <span>
                    {isPlaying
                      ? isFa ? 'توقف دکلمه' : isFr ? 'Pause' : 'Pause'
                      : isFa ? 'پخش دکلمه صوتی' : isFr ? 'Écouter' : 'Listen'}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>
                    {isPlaying
                      ? isFa ? 'حالت عادی' : isFr ? 'Vue normale' : 'Standard View'
                      : isFa ? 'حالت تمرکز خوانش' : isFr ? 'Mode lecture' : 'Focus Mode'}
                  </span>
                </>
              )}
            </button>
          </div>

          <BilingualWorkReader
            originalLang={resolved.originalLang}
            siteLocale={locale}
            translated={resolved.translatedRecord}
            originalContent={
              <div className="space-y-6 py-2">
                {verses.map((v) => (
                  <div
                    key={v.line_index}
                    className={`p-4 rounded-xl border border-transparent transition-all ${isPlaying ? 'bg-[var(--surface-sunken)] border-[var(--border-subtle)]' : ''
                      }`}
                  >
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-base sm:text-lg font-serif text-[var(--foreground)] leading-loose">
                      <span className="w-full sm:w-1/2 text-center sm:text-start">{v.hemistich_a}</span>
                      {v.hemistich_b && (
                        <span className="w-full sm:w-1/2 text-center sm:text-end text-[var(--foreground-muted)]">
                          {v.hemistich_b}
                        </span>
                      )}
                    </div>
                    {v.translation_text && (
                      <p className="text-xs text-[var(--foreground-muted)] italic mt-2 text-center sm:text-start border-t border-[var(--border-subtle)] pt-2">
                        {v.translation_text}
                      </p>
                    )}
                  </div>
                ))}

                {poemTrans?.commentary_markdown && (
                  <div className="border-t border-[var(--border-subtle)] pt-4 text-xs text-[var(--foreground-muted)] leading-relaxed">
                    <span className="font-bold text-[var(--foreground)] block mb-1">
                      {isFa ? 'یادداشت مؤلف بر این سروده:' : isFr ? 'Note de l’auteur :' : 'Author’s Note:'}
                    </span>
                    {poemTrans.commentary_markdown}
                  </div>
                )}
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
