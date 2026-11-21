'use client';

import React, { useMemo, useState } from 'react';
import { Search, Images, Layers } from 'lucide-react';
import { IIIFDeepZoomViewer } from './IIIFDeepZoomViewer';
import type { Artwork, Locale } from '@makaremi/shared';

interface ArtworksVaultShowcaseProps {
  artworks: Artwork[];
  locale: Locale;
}

export function ArtworksVaultShowcase({ artworks, locale }: ArtworksVaultShowcaseProps) {
  const isFa = locale === 'fa';
  const [query, setQuery] = useState('');
  const [selectedArtworkId, setSelectedArtworkId] = useState<string>(artworks[0]?.id || '');
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(
    artworks[0]?.image_url || artworks[0]?.gallery_images?.[0]?.url || null
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return artworks;
    return artworks.filter((a) => {
      const tr = a.translations?.find((t) => t.languages_code.startsWith(locale)) || a.translations?.[0];
      return `${tr?.title || ''} ${tr?.description_markdown || ''}`.toLowerCase().includes(q);
    });
  }, [artworks, locale, query]);

  const activeArtwork =
    artworks.find((a) => a.id === selectedArtworkId) || filtered[0] || artworks[0];
  const activeTrans =
    activeArtwork?.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    activeArtwork?.translations?.[0];

  const activeImages = activeArtwork?.gallery_images || [];
  const viewerImage = selectedImageUrl || activeArtwork?.image_url || activeImages[0]?.url || null;

  const selectArtwork = (art: Artwork) => {
    setSelectedArtworkId(art.id);
    setSelectedImageUrl(art.image_url || art.gallery_images?.[0]?.url || null);
  };

  return (
    <div className="space-y-8">
      {/* Interactive Museum Deep-Zoom Stage */}
      {activeArtwork && (
        <div className="space-y-4">
          <IIIFDeepZoomViewer
            imageId={activeArtwork.iiif_image_id}
            imageUrl={viewerImage}
            title={activeTrans?.title || activeArtwork.slug}
            medium={activeArtwork.medium}
            dimensions={activeArtwork.dimensions}
            locale={locale}
          />

          {/* Selected Series Description & Multi-Canvas Strip */}
          <div className="p-5 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-[var(--foreground)]">
                {activeTrans?.title || activeArtwork.slug}
              </h3>
              <span className="text-xs font-mono text-[var(--foreground-muted)]">
                {activeArtwork.year} • {activeImages.length}{' '}
                {isFa ? 'تصویر در این مجموعه' : 'images dans cette série'}
              </span>
            </div>

            {activeTrans?.description_markdown && (
              <p className="text-xs text-[var(--foreground-muted)] leading-relaxed whitespace-pre-line">
                {activeTrans.description_markdown.slice(0, 600)}
              </p>
            )}

            {activeImages.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2">
                {activeImages.map((img, i) => (
                  <button
                    key={`${img.id}-${i}`}
                    type="button"
                    onClick={() => setSelectedImageUrl(img.url)}
                    className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${viewerImage === img.url
                        ? 'border-[var(--primary)] scale-105'
                        : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                  >
                    <img
                      src={img.url}
                      alt={img.alt || img.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Searchable Complete Catalog of All 54 WordPress Artwork Galleries */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-[var(--primary)] font-bold">
            <Layers size={15} />
            <span>
              {isFa
                ? `گنجینه کامل ${artworks.length} مجموعه تابلو و نقاشی‌خط`
                : `Catalogue complet (${artworks.length} séries de tableaux)`}
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              size={14}
              className="absolute top-1/2 -translate-y-1/2 start-3 text-[var(--foreground-muted)] pointer-events-none"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isFa ? 'فیلتر عنوان تابلو یا مجموعه...' : 'Filtrer les tableaux...'}
              aria-label={isFa ? 'فیلتر گالری آثار' : 'Filter artworks'}
              className="w-full ps-9 pe-3 py-1.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div
            role="status"
            className="p-8 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-center space-y-3"
          >
            <p className="text-sm font-bold text-[var(--foreground)]">
              {isFa ? 'تابلویی مطابق جستجوی شما یافت نشد.' : 'Aucune œuvre trouvée.'}
            </p>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--primary)] text-[var(--primary-foreground)] cursor-pointer"
            >
              {isFa ? 'نمایش همه تابلوها' : 'Tout afficher'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((art) => {
              const tr = art.translations?.find((t) => t.languages_code.startsWith(locale)) || art.translations?.[0];
              const isSelected = activeArtwork?.id === art.id;
              const thumb = art.image_url || art.gallery_images?.[0]?.url;

              return (
                <button
                  key={art.id}
                  type="button"
                  onClick={() => selectArtwork(art)}
                  className={`text-start min-w-0 rounded-2xl overflow-hidden border transition-all cursor-pointer flex flex-col justify-between bg-[var(--surface-card)] ${isSelected
                      ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20 shadow-lg'
                      : 'border-[var(--border-subtle)] hover:shadow-md'
                    }`}
                >
                  <div className="aspect-[4/3] w-full bg-[var(--surface-sunken)] overflow-hidden relative">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={tr?.title || art.slug}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--foreground-muted)]">
                        <Images size={24} />
                      </div>
                    )}
                    {(art.gallery_images?.length || 0) > 0 && (
                      <span className="absolute bottom-2 end-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-mono tabular-nums">
                        {art.gallery_images?.length}
                      </span>
                    )}
                  </div>

                  <div className="p-3 space-y-1 min-w-0 w-full">
                    <h4 className="text-xs font-bold text-[var(--foreground)] line-clamp-2 leading-snug break-words">
                      {tr?.title || art.slug}
                    </h4>
                    <span className="text-[10px] font-mono tabular-nums text-[var(--foreground-muted)] block">
                      {art.year} • {tr?.languages_code?.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
