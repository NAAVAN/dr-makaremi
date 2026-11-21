'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface EditorialRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Calm GPU-only scroll reveal for museum sections.
 * Fires once on viewport entry and stays completely static under prefers-reduced-motion.
 */
export function EditorialReveal({ children, className = '', delay = 0 }: EditorialRevealProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.52, delay, ease: [0.23, 1, 0.32, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
