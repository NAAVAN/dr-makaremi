'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface CalligraphyInkStrokeProps {
  className?: string;
}

/**
 * Kinetic Persian Calligraphy Ink-Reed Stroke (SVG < 3KB, GPU-composited)
 * Sweeps behind the hero portrait like a reed pen gliding over archival cotton paper.
 */
export function CalligraphyInkStroke({ className = '' }: CalligraphyInkStrokeProps) {
  const prefersReduced = useReducedMotion();

  return (
    <svg
      viewBox="0 0 680 420"
      fill="none"
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      {/* Primary sweeping Nastaliq keshideh arc */}
      <motion.path
        d="M 42 330 C 138 308, 224 196, 338 158 C 436 126, 514 174, 594 114 C 626 90, 646 66, 658 46"
        stroke="var(--primary)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeOpacity="0.22"
        initial={prefersReduced ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0.2 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.15, ease: [0.23, 1, 0.32, 1], delay: 0.15 }}
      />

      {/* Secondary fine gold-ochre reed harmonic */}
      <motion.path
        d="M 96 364 C 218 338, 294 252, 412 222 C 504 198, 566 226, 636 174"
        stroke="var(--accent-gold)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeOpacity="0.28"
        initial={prefersReduced ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.3, ease: [0.23, 1, 0.32, 1], delay: 0.38 }}
      />

      {/* Calligraphic dot (Noqteh) accent */}
      <motion.rect
        x="524"
        y="96"
        width="8"
        height="8"
        rx="1.2"
        fill="var(--accent-gold)"
        fillOpacity="0.34"
        transform="rotate(45 528 100)"
        initial={prefersReduced ? { scale: 1, opacity: 1 } : { scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1], delay: 0.95 }}
      />

      {/* Fine archival compass hairline */}
      <motion.circle
        cx="558"
        cy="282"
        r="74"
        stroke="var(--border-artifact)"
        strokeWidth="0.9"
        strokeDasharray="3 5"
        strokeOpacity="0.55"
        initial={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.5 }}
      />
    </svg>
  );
}
