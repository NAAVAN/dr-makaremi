'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Locale } from '@makaremi/shared';

interface HeroPortraitFrameProps {
  locale: Locale;
  backdropArtworkUrl?: string | null;
  backdropArtworkTitle?: string;
}

/**
 * 3-Layer Archival Museum Passe-Partout Frame for Dr. Hassan Makaremi's Portrait.
 * Layer 1: Muted authentic calligraphy canvas plate offset behind the frame.
 * Layer 2: Self-hosted high-res portrait (HM-12121.jpg) with fetchPriority="high" & zero CLS.
 * Layer 3: Parisian gallery curator plaque linking to full biography.
 */
export function HeroPortraitFrame({
  locale,
  backdropArtworkUrl,
  backdropArtworkTitle,
}: HeroPortraitFrameProps) {
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const prefersReduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [finePointer, setFinePointer] = useState(false);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const smoothX = useSpring(rawX, { stiffness: 120, damping: 22, mass: 0.6 });
  const smoothY = useSpring(rawY, { stiffness: 120, damping: 22, mass: 0.6 });

  const backRawX = useMotionValue(0);
  const backRawY = useMotionValue(0);
  const backSmoothX = useSpring(backRawX, { stiffness: 90, damping: 24, mass: 0.8 });
  const backSmoothY = useSpring(backRawY, { stiffness: 90, damping: 24, mass: 0.8 });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      setFinePointer(window.matchMedia('(pointer: fine)').matches);
    }
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReduced || !finePointer || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    rawX.set(nx * 6);
    rawY.set(ny * 6);
    backRawX.set(nx * -8);
    backRawY.set(ny * -8);
  };

  const handlePointerLeave = () => {
    rawX.set(0);
    rawY.set(0);
    backRawX.set(0);
    backRawY.set(0);
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative mx-auto w-full max-w-[360px] sm:max-w-[400px] lg:max-w-[420px] pt-4 pb-6 px-3 sm:px-5"
    >
      {/* Layer 1: Subtle Offset Calligraphy Canvas Plate (Depth 1) */}
      <motion.div
        style={prefersReduced ? undefined : { x: backSmoothX, y: backSmoothY }}
        aria-hidden="true"
        className="absolute top-0 end-0 w-[72%] aspect-[4/5] rounded-2xl overflow-hidden border border-[var(--border-medium)] bg-[var(--surface-sunken)] opacity-55 dark:opacity-35 shadow-sm"
      >
        {backdropArtworkUrl ? (
          <img
            src={backdropArtworkUrl}
            alt={backdropArtworkTitle || ''}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover opacity-65 saturate-75"
          />
        ) : (
          <div className="w-full h-full archival-paper-weave" />
        )}
      </motion.div>

      {/* Layer 2: Archival Passe-Partout Mat & Authentic Portrait (Depth 2 — Primary Hero Visual) */}
      <motion.figure
        style={prefersReduced ? undefined : { x: smoothX, y: smoothY }}
        initial={prefersReduced ? false : { opacity: 0.92, scale: 0.985, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-10 rounded-2xl bg-[var(--surface-passepartout)] border border-[var(--border-artifact)] p-3 sm:p-4 shadow-[var(--shadow-artifact)]"
      >
        <div className="relative aspect-[825/935] w-full overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)]">
          <img
            src="/images/portrait/dr-makaremi-hero.jpg"
            alt={
              isFa
                ? 'پرتره دکتر حسن مکارمی در کنار تابلوهای خوشنویسی مدرن'
                : isFr
                  ? 'Portrait du Dr Hassan Makaremi devant ses calligraphies modernes'
                  : 'Portrait of Dr. Hassan Makaremi beside his modern calligraphy works'
            }
            width={825}
            height={935}
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover object-top contrast-[1.03] saturate-[0.97]"
          />
          {/* Subtle Museum Frame Inner Vignette */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-black/10 dark:ring-white/10"
          />
        </div>

        {/* Layer 3: Parisian Museum Curator Plaque */}
        <figcaption className="mt-3.5 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-[var(--foreground)] truncate">
              {isFa ? 'دکتر حسن مکارمی' : 'Dr Hassan Makaremi'}
            </p>
            <p className="text-[11px] font-mono text-[var(--foreground-muted)] truncate">
              {isFa
                ? 'شیراز ۱۳۲۹ · پاریس'
                : isFr
                  ? 'Chiraz 1950 · Paris'
                  : 'Shiraz 1950 · Paris'}
            </p>
          </div>

          <Link
            href={`/${locale}/about`}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--primary)] text-[11px] font-semibold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
          >
            <span>{isFa ? 'شرح حال' : isFr ? 'Biographie' : 'Biography'}</span>
            {isFa ? <ArrowLeft size={12} /> : <ArrowRight size={12} />}
          </Link>
        </figcaption>
      </motion.figure>
    </div>
  );
}
