'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, BookOpen, ExternalLink, Globe } from 'lucide-react';
import type { LacanianGlossaryTerm, Locale } from '@makaremi/shared';

interface GlossaryExplorerProps {
  terms: LacanianGlossaryTerm[];
  locale: Locale;
}

export function GlossaryExplorer({ terms, locale }: GlossaryExplorerProps) {
  const [search, setSearch] = useState('');
  const [selectedPillar, setSelectedPillar] = useState<string>('all');

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';

  const filteredTerms = terms.filter((term) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      term.term_fa.toLowerCase().includes(q) ||
      term.term_fr.toLowerCase().includes(q) ||
      term.term_en.toLowerCase().includes(q) ||
      (term.conceptual_definition_fa && term.conceptual_definition_fa.toLowerCase().includes(q)) ||
      (term.conceptual_definition_fr && term.conceptual_definition_fr.toLowerCase().includes(q)) ||
      (term.conceptual_definition_en && term.conceptual_definition_en.toLowerCase().includes(q));

    const matchesPillar = selectedPillar === 'all' || term.pillar === selectedPillar;

    return matchesSearch && matchesPillar;
  });

  return (
    <div className="space-y-8">
      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[var(--surface-sunken)] p-4 sm:p-6 rounded-2xl border border-[var(--border-subtle)]">
        <div className="relative w-full sm:w-96">
          <Search size={18} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isFa
                ? 'جستجوی اصطلاح یا مفهوم (فارسی، فرانسه، انگلیسی)...'
                : isFr
                ? 'Rechercher un terme (français, persan, anglais)...'
                : 'Search term or concept (English, Persian, French)...'
            }
            className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSelectedPillar('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              selectedPillar === 'all'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface-card)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] border border-[var(--border-subtle)]'
            }`}
          >
            {isFa ? 'همه مفاهیم' : isFr ? 'Tous' : 'All'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedPillar('psychoanalysis')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              selectedPillar === 'psychoanalysis'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface-card)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] border border-[var(--border-subtle)]'
            }`}
          >
            {isFa ? 'روانکاوی لکانی' : isFr ? 'Psychanalyse' : 'Psychoanalysis'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedPillar('cultural_strategy')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              selectedPillar === 'cultural_strategy'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface-card)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] border border-[var(--border-subtle)]'
            }`}
          >
            {isFa ? 'مطالعات راهبردی' : isFr ? 'Stratégie' : 'Strategy'}
          </button>
        </div>
      </div>

      {/* Terms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTerms.map((term) => {
          const primaryName = isFa ? term.term_fa : isFr ? term.term_fr : term.term_en;
          const definition = isFa
            ? term.conceptual_definition_fa
            : isFr
            ? term.conceptual_definition_fr || term.conceptual_definition_fa
            : term.conceptual_definition_en || term.conceptual_definition_fa;

          return (
            <article
              key={term.id}
              id={term.id}
              className="p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-sm hover:border-[var(--primary)]/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="text-xl font-bold text-[var(--foreground)] font-serif">
                    {primaryName}
                  </h3>
                  <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--surface-sunken)] text-[var(--primary)] border border-[var(--border-subtle)]">
                    {term.pillar === 'psychoanalysis' ? 'Lacanian' : 'Strategy'}
                  </span>
                </div>

                {/* Multilingual Equivalents */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--foreground-muted)] mb-4">
                  <span className="flex items-center gap-1 font-mono">
                    <Globe size={12} />
                    <strong>FA:</strong> {term.term_fa}
                  </span>
                  <span>•</span>
                  <span className="font-mono">
                    <strong>FR:</strong> {term.term_fr}
                  </span>
                  <span>•</span>
                  <span className="font-mono">
                    <strong>EN:</strong> {term.term_en}
                  </span>
                </div>

                {/* Conceptual Definition */}
                <p className="text-sm leading-relaxed text-[var(--foreground)] mb-6">
                  {definition}
                </p>
              </div>

              {/* Cross-Reference Links */}
              <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                <span className="flex items-center gap-1">
                  <BookOpen size={13} className="text-[var(--primary)]" />
                  <span>
                    {term.pillar === 'psychoanalysis'
                      ? isFa ? 'ارجاع: سمینار ۳ لکان و دگرشنیدن' : 'Réf : Séminaire III de Lacan'
                      : isFa ? 'ارجاع: نگاهی راهبردی به دوران گذار' : 'Réf : Regard stratégique'}
                  </span>
                </span>

                <Link
                  href={`/${locale}/${term.pillar === 'psychoanalysis' ? (locale === 'fr' ? 'psychanalyse' : 'psychoanalysis') : 'strategy'}/articles`}
                  className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline font-medium"
                >
                  <span>{isFa ? 'مطالعه مقالات مرتبط' : 'Voir les articles'}</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {filteredTerms.length === 0 && (
        <div className="text-center py-12 text-[var(--foreground-muted)]">
          <p>{isFa ? 'مفهومی منطبق با جستجوی شما یافت نشد.' : 'Aucun terme ne correspond à votre recherche.'}</p>
        </div>
      )}
    </div>
  );
}
