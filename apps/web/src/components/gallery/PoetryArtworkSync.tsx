'use client';

import React, { useState } from 'react';
import { Play, Pause, Music, Sparkles } from 'lucide-react';
import { IIIFDeepZoomViewer } from './IIIFDeepZoomViewer';
import type { Poem, Artwork, Locale } from '@makaremi/shared';

interface PoetryArtworkSyncProps {
  poem: Poem;
  artwork?: Artwork;
  locale: Locale;
}

export function PoetryArtworkSync({ poem, artwork, locale }: PoetryArtworkSyncProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const isFa = locale === 'fa';
  const poemTrans = poem.translations?.find((t) => t.languages_code.startsWith(locale)) || poem.translations?.[0];
  const artworkTrans = artwork?.translations?.find((t) => t.languages_code.startsWith(locale)) || artwork?.translations?.[0];

  const verses = poemTrans?.verses || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Visual Canvas Side */}
      <div className="space-y-4">
        <IIIFDeepZoomViewer
          imageId={artwork?.iiif_image_id || 'makaremi-pompadour-01'}
          title={artworkTrans?.title || 'میان نشان و نماد'}
          medium={artwork?.medium}
          dimensions={artwork?.dimensions}
          locale={locale}
        />
        {artworkTrans?.curator_critique_markdown && (
          <div className="p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs text-[var(--foreground-muted)] italic leading-relaxed">
            {artworkTrans.curator_critique_markdown}
          </div>
        )}
      </div>

      {/* Poetry & Recitation Side */}
      <div className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
          <div>
            <span className="text-[11px] font-mono tracking-wider uppercase text-[var(--primary)] block">
              {isFa ? 'شعر و تصویر (دکلمه و خوشنویسی)' : 'Poésie & Image Synchronisée'}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[var(--foreground)] mt-1">
              {poemTrans?.title || poem.slug}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold shadow-md hover:opacity-90 transition-all cursor-pointer"
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} />}
            <span>{isPlaying ? (isFa ? 'توقف دکلمه' : 'Pause') : (isFa ? 'پخش دکلمه صوتی' : 'Écouter la récitation')}</span>
          </button>
        </div>

        {/* Verses Layout */}
        <div className="space-y-6 py-4">
          {verses.map((v) => (
            <div
              key={v.line_index}
              className={`p-4 rounded-xl border border-transparent transition-all ${
                isPlaying ? 'bg-[var(--surface-sunken)] border-[var(--border-subtle)]' : ''
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
        </div>

        {poemTrans?.commentary_markdown && (
          <div className="border-t border-[var(--border-subtle)] pt-4 text-xs text-[var(--foreground-muted)] leading-relaxed">
            <span className="font-bold text-[var(--foreground)] block mb-1">
              {isFa ? 'یادداشت مؤلف بر این سروده:' : 'Note de l’auteur :'}
            </span>
            {poemTrans.commentary_markdown}
          </div>
        )}
      </div>
    </div>
  );
}
