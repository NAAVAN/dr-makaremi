'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize, RotateCcw, Eye, Layers } from 'lucide-react';
import type { Locale } from '@makaremi/shared';

interface IIIFDeepZoomViewerProps {
  imageId: string;
  imageUrl?: string | null;
  title: string;
  medium?: string;
  dimensions?: string | null;
  locale: Locale;
}

export function IIIFDeepZoomViewer({
  imageId,
  imageUrl,
  title,
  medium,
  dimensions,
  locale,
}: IIIFDeepZoomViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(true);
  const [imgFailed, setImgFailed] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    setImgFailed(false);
    setZoomLevel(1);
  }, [imageUrl, imageId]);

  const viewerId = `openseadragon-${imageId.replace(/[^a-zA-Z0-9]/g, '-')}`;

  useEffect(() => {
    let isMounted = true;

    async function initOpenSeadragon() {
      if (typeof window === 'undefined' || !containerRef.current) return;

      try {
        // Dynamic import to prevent SSR window reference failure
        const OpenSeadragon = (await import('openseadragon')).default;

        if (!isMounted) return;

        // Try initializing against Cantaloupe IIIF endpoint
        const iiifInfoUrl = `https://iiif.makaremi.com/iiif/3/${imageId}/info.json`;

        // Check if Cantaloupe is responsive
        const checkRes = await fetch(iiifInfoUrl, { method: 'HEAD' }).catch(() => null);

        if (checkRes && checkRes.ok) {
          viewerRef.current = OpenSeadragon({
            id: viewerId,
            prefixUrl: 'https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/',
            tileSources: iiifInfoUrl,
            showNavigationControl: false,
            showNavigator: true,
            navigatorPosition: 'BOTTOM_RIGHT',
            animationTime: 0.5,
            blendTime: 0.1,
            constrainDuringPan: true,
            maxZoomPixelRatio: 2.5,
            visibilityRatio: 1,
          });
          setIsUsingFallback(false);
        } else {
          // Cantaloupe unreachable or offline: activate interactive high-resolution canvas fallback
          setIsUsingFallback(true);
        }
      } catch {
        setIsUsingFallback(true);
      }
    }

    initOpenSeadragon();

    return () => {
      isMounted = false;
      if (viewerRef.current && typeof viewerRef.current.destroy === 'function') {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [imageId, viewerId]);

  // Fallback Canvas Zoom controls
  const handleZoom = (delta: number) => {
    if (viewerRef.current) {
      const cur = viewerRef.current.viewport.getZoom();
      viewerRef.current.viewport.zoomTo(Math.max(0.5, Math.min(6, cur + delta)));
    } else {
      setZoomLevel((z) => Math.max(1, Math.min(4, Number((z + delta).toFixed(1)))));
    }
  };

  const handleReset = () => {
    if (viewerRef.current) {
      viewerRef.current.viewport.goHome();
    } else {
      setZoomLevel(1);
    }
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => { });
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => { });
    }
  };

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl bg-neutral-950 overflow-hidden border border-[var(--border-subtle)] shadow-xl ${isFullscreen ? 'h-screen' : 'h-[480px] sm:h-[600px]'
        }`}
    >
      {/* IIIF Container for OpenSeadragon */}
      <div id={viewerId} className={`w-full h-full ${isUsingFallback ? 'hidden' : 'block'}`} />

      {/* Fallback Interactive High-Res Canvas / Real Artwork Image */}
      {isUsingFallback && (
        <div
          data-iiif-mode="MUSEUM CANVAS FALLBACK"
          className="relative w-full h-full flex items-center justify-center overflow-hidden bg-neutral-900 select-none"
        >
          <span className="sr-only">MUSEUM CANVAS FALLBACK (IIIF READY)</span>
          <div
            className="museum-canvas-smooth cursor-grab active:cursor-grabbing max-w-[90%] max-h-[85%] flex flex-col items-center justify-center p-4 text-center select-none"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {imageUrl && !imgFailed ? (
              <img
                src={imageUrl}
                alt={title}
                decoding="async"
                fetchPriority="high"
                onError={() => setImgFailed(true)}
                className="max-h-[420px] sm:max-h-[500px] w-auto object-contain rounded-lg shadow-2xl border border-white/10"
                draggable={false}
              />
            ) : (
              <div className="w-80 sm:w-96 h-96 sm:h-[440px] rounded-xl bg-gradient-to-br from-[#1E3A8A]/30 via-neutral-900 to-[#0F766E]/20 border border-white/10 shadow-2xl flex flex-col items-center justify-center p-8 text-neutral-300 relative">
                <span className="text-[10px] font-mono tracking-widest text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full mb-4">
                  MUSEUM CANVAS FALLBACK (IIIF READY)
                </span>
                <svg viewBox="0 0 200 120" className="w-48 h-32 text-amber-500/80 mb-4 stroke-current fill-none stroke-[2.5]">
                  <path d="M 20 60 C 50 10, 80 110, 110 50 C 140 10, 170 90, 190 60" />
                  <path d="M 30 80 Q 90 20, 170 80" strokeWidth="1.5" opacity="0.6" />
                  <circle cx="110" cy="50" r="4" fill="currentColor" />
                </svg>
                <h4 className="text-xl font-black text-white">{title}</h4>
                {medium && <p className="text-xs text-neutral-400 mt-2">{medium}</p>}
                {dimensions && <p className="text-[10px] text-neutral-500 font-mono mt-1">{dimensions}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Museum HUD / Header */}
      <div className="absolute top-4 start-4 end-4 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-white text-xs">
          <span className="font-bold">{title}</span>
          {dimensions && <span className="opacity-60 ms-2 font-mono text-[10px]">({dimensions})</span>}
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10 text-white">
          <span className="text-[10px] px-2 py-0.5 text-neutral-400 font-mono">
            {zoomLevel}x
          </span>
          <button
            type="button"
            onClick={() => handleZoom(0.3)}
            aria-label={tx('بزرگنمایی', 'Zoom avant', 'Zoom in')}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(-0.3)}
            aria-label={tx('کوچک‌نمایی', 'Zoom arrière', 'Zoom out')}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
          >
            <ZoomOut size={16} />
          </button>
          <button
            type="button"
            onClick={handleReset}
            aria-label={tx('بازنشانی زوم', 'Réinitialiser le zoom', 'Reset zoom')}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={tx('تمام صفحه', 'Plein écran', 'Toggle fullscreen')}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
          >
            <Maximize size={16} />
          </button>
        </div>
      </div>

      {/* Bottom Status Badge */}
      <div className="absolute bottom-3 start-4 flex items-center gap-2 pointer-events-none">
        <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] text-neutral-400 font-mono flex items-center gap-1.5">
          <Layers size={12} className="text-amber-400" />
          {isUsingFallback
            ? tx(
                'نمایشگر کاشی‌های بافت بوم (حالت باکیفیت آفلاین)',
                'Mode Haute Résolution Hors-Ligne',
                'High-Resolution Offline Canvas Mode'
              )
            : 'Cantaloupe IIIF v3 Protocol Connected'}
        </span>
      </div>
    </div>
  );
}
