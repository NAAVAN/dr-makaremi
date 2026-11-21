'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Locale } from '@makaremi/shared';

type RegisterId = 'symbolic' | 'imaginary' | 'real';

interface BorromeanKnotWidgetProps {
  locale: Locale;
}

const REGISTERS: Record<
  RegisterId,
  {
    color: string;
    label: Record<Locale, string>;
    term: Record<Locale, string>;
    note: Record<Locale, string>;
  }
> = {
  symbolic: {
    color: 'var(--color-psychoanalysis)',
    label: {
      fa: 'ساحت نمادین',
      fr: 'Symbolique',
      en: 'Symbolic',
    },
    term: {
      fa: 'دگرشنیدن و دالِ زبان',
      fr: 'Écouter autrement & Signifiant',
      en: 'Listening Differently & Signifier',
    },
    note: {
      fa: 'جایگاه زبان، قانون، نام پدر و گشودن معنای پنهان گفتار در اتاق تحلیل.',
      fr: 'Lieu du langage, du Nom-du-Père et de l’écoute analytique du signifiant.',
      en: 'The order of language, Name-of-the-Father, and clinical listening to the signifier.',
    },
  },
  imaginary: {
    color: 'var(--color-art)',
    label: {
      fa: 'ساحت خیالی',
      fr: 'Imaginaire',
      en: 'Imaginary',
    },
    term: {
      fa: 'آینه، تصویر و زیبایی‌شناسی',
      fr: 'Stade du miroir & Image',
      en: 'Mirror Stage & Image',
    },
    note: {
      fa: 'پیوند تصویر، هویت آینه‌ای و دگردیسی خط و نقش در آفرینش هنری.',
      fr: 'Formation spéculaire du moi et résonance visuelle dans l’acte artistique.',
      en: 'Specular image, identification, and aesthetic transformation in visual art.',
    },
  },
  real: {
    color: 'var(--color-dadkhahi)',
    label: {
      fa: 'ساحت واقعی',
      fr: 'Réel',
      en: 'Real',
    },
    term: {
      fa: 'ناگفتنی و گسست تاریخی',
      fr: 'L’impossible à dire',
      en: 'The Unsymbolizable',
    },
    note: {
      fa: 'آنچه از چنگال نمادین‌سازی می‌گریزد؛ از ترومای بالینی تا حافظه دادخواهی.',
      fr: 'Ce qui résiste à la symbolisation, du trauma clinique à la mémoire collective.',
      en: 'What resists symbolization, spanning clinical trauma and historical memory.',
    },
  },
};

/**
 * Interactive Lacanian Borromean Knot (R.S.I. — Real, Symbolic, Imaginary).
 * Signature scholarly visual inside the Psychoanalysis showcase on the homepage.
 */
export function BorromeanKnotWidget({ locale }: BorromeanKnotWidgetProps) {
  const [active, setActive] = useState<RegisterId>('symbolic');
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const prefersReduced = useReducedMotion();
  const current = REGISTERS[active];

  return (
    <div className="rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* True Interlocking Borromean SVG */}
        <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
          <svg
            viewBox="0 0 180 180"
            className={`w-full h-full ${prefersReduced ? '' : 'borromean-breathe'}`}
            role="img"
            aria-label={
              isFa
                ? 'گره بورومه‌ای لکان: نمادین، خیالی و واقعی'
                : 'Nœud borroméen de Lacan : Symbolique, Imaginaire, Réel'
            }
          >
            {/* Symbolic Ring (Top) */}
            <circle
              cx="90"
              cy="64"
              r="42"
              fill="none"
              stroke="var(--color-psychoanalysis)"
              strokeWidth={active === 'symbolic' ? 4.5 : 2.5}
              strokeOpacity={active === 'symbolic' ? 1 : 0.45}
              className="transition-all duration-300 cursor-pointer"
              onClick={() => setActive('symbolic')}
            />
            {/* Imaginary Ring (Bottom Left) */}
            <circle
              cx="65"
              cy="108"
              r="42"
              fill="none"
              stroke="var(--color-art)"
              strokeWidth={active === 'imaginary' ? 4.5 : 2.5}
              strokeOpacity={active === 'imaginary' ? 1 : 0.45}
              className="transition-all duration-300 cursor-pointer"
              onClick={() => setActive('imaginary')}
            />
            {/* Real Ring (Bottom Right) */}
            <circle
              cx="115"
              cy="108"
              r="42"
              fill="none"
              stroke="var(--color-dadkhahi)"
              strokeWidth={active === 'real' ? 4.5 : 2.5}
              strokeOpacity={active === 'real' ? 1 : 0.45}
              className="transition-all duration-300 cursor-pointer"
              onClick={() => setActive('real')}
            />
            {/* Central Objet a indicator */}
            <circle cx="90" cy="94" r="4" fill="var(--accent-gold)" fillOpacity="0.85" />
          </svg>
        </div>

        {/* Interactive Register Selector & Note */}
        <div className="flex-1 min-w-0 space-y-2.5 text-center sm:text-start">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
            {(['symbolic', 'imaginary', 'real'] as RegisterId[]).map((id) => {
              const reg = REGISTERS[id];
              const isSelected = active === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setActive(id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--surface-card)] text-[var(--foreground)] border-[var(--border-artifact)] shadow-xs'
                      : 'bg-transparent text-[var(--foreground-muted)] border-transparent hover:border-[var(--border-subtle)]'
                  }`}
                >
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full me-1.5 align-middle"
                    style={{ backgroundColor: reg.color }}
                  />
                  {reg.label[locale]}
                </button>
              );
            })}
          </div>

          <motion.div
            key={active}
            initial={prefersReduced ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-1"
          >
            <p className="text-xs font-bold text-[var(--foreground)]">{current.term[locale]}</p>
            <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
              {current.note[locale]}
            </p>
          </motion.div>

          <Link
            href={`/${locale}/glossary`}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--primary)] hover:underline pt-0.5"
          >
            <span>
              {isFa
                ? 'مطالعه در اصطلاح‌نامه لکانی'
                : isFr
                  ? 'Consulter le glossaire lacanien'
                  : 'Explore Lacanian Glossary'}
            </span>
            {isFa ? <ArrowLeft size={12} /> : <ArrowRight size={12} />}
          </Link>
        </div>
      </div>
    </div>
  );
}
