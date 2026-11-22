'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Locale } from '@makaremi/shared';

interface HeroPortraitFrameProps {
  locale: Locale;
}

/**
 * Single Refined Museum Passe-Partout Frame for Dr. Hassan Makaremi's Portrait.
 * - Self-hosted high-res studio portrait (dr-makaremi-hero.jpg) with fetchPriority="high" & zero CLS.
 * - Clean double-mat archival passe-partout border with zero overlapping background image clutter.
 * - Parisian gallery curator plaque linking to full biography.
 */
export function HeroPortraitFrame({ locale }: HeroPortraitFrameProps) {
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const prefersReduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [finePointer, setFinePointer] = useState(false);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const smoothX = useSpring(rawX, { stiffness: 120, damping: 22, mass: 0.6 });
  const smoothY = useSpring(rawY, { stiffness: 120, damping: 22, mass: 0.6 });

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
  };

  const handlePointerLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative mx-auto w-full max-w-[360px] sm:max-w-[400px] lg:max-w-[420px] py-2"
    >
      {/* Archival Passe-Partout Mat & Authentic Portrait (Single Authoritative Hero Visual) */}
      <motion.figure
        style={prefersReduced ? undefined : { x: smoothX, y: smoothY }}
        initial={prefersReduced ? false : { opacity: 0.92, scale: 0.985, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-10 rounded-2xl bg-[var(--surface-passepartout)] border border-[var(--border-artifact)] p-3.5 sm:p-4 shadow-[var(--shadow-artifact)] ring-1 ring-inset ring-[var(--border-subtle)]"
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
