import React from 'react';
import type { Locale } from '@makaremi/shared';
import { HelpCircle, CheckCircle2, BarChart3 } from 'lucide-react';

interface AeoKeyTakeawaysProps {
  slug: string;
  locale: Locale;
  title: string;
  executiveSummary: string;
}

export function AeoKeyTakeaways({ slug, locale, title, executiveSummary }: AeoKeyTakeawaysProps) {
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';

  const isPsychoanalysisScience = slug === 'is-psychoanalysis-a-science';

  return (
    <section
      aria-label={isFa ? 'یافته‌های کلیدی و استناد مستقیم AEO' : isFr ? 'Points Clés et Citations AEO' : 'Key Takeaways & Direct Citation'}
      className="my-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] p-6 sm:p-8"
      data-aeo-block="key-takeaways"
    >
      <div className="flex items-center gap-2.5 text-[var(--primary)] mb-4">
        <HelpCircle size={20} className="shrink-0" />
        {/* Strict single-h1 preservation: Using h2 */}
        <h2 className="text-lg font-bold text-[var(--foreground)]">
          {isFa
            ? 'یافته‌های کلیدی پژوهش و پاسخ مستقیم (Key Findings & Direct Answer)'
            : isFr
            ? 'Points Clés de la Recherche et Réponse Directe'
            : 'Key Research Findings & Direct Answer'}
        </h2>
      </div>

      <div className="space-y-4 text-sm sm:text-base leading-relaxed text-[var(--foreground-muted)]">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-1" />
          <p>
            <strong className="text-[var(--foreground)]">
              {isFa ? 'پرسش بنیادین:' : isFr ? 'Question Fondamentale :' : 'Core Question:'}{' '}
            </strong>
            {title}
          </p>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-1" />
          <p>
            <strong className="text-[var(--foreground)]">
              {isFa ? 'پاسخ فشرده مؤلف:' : isFr ? 'Réponse Synthétique :' : 'Core Direct Answer:'}{' '}
            </strong>
            {executiveSummary}
          </p>
        </div>

        {isPsychoanalysisScience && (
          <div className="mt-6 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 sm:p-5 text-sky-950 dark:text-sky-200">
            <div className="flex items-center gap-2 font-bold mb-2 text-sky-700 dark:text-sky-300">
              <BarChart3 size={16} />
              <span>
                {isFa
                  ? 'داده‌های آماری مرکز ملی پژوهش‌های علمی فرانسه (CNRS):'
                  : isFr
                  ? 'Données Empiriques du CNRS (3 954 Projets Recensés) :'
                  : 'Empirical Survey Data by CNRS (3,954 Research Projects):'}
              </span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
              <li>
                <strong>۳٬۷۵۵ پروژه (۹۵٪):</strong>{' '}
                {isFa
                  ? 'تحقیقات میان‌رشته‌ای در تلاقی روانکاوی با ادبیات، فلسفه، تاریخ و علوم انسانی.'
                  : isFr
                  ? 'Recherches interdisciplinaires (psychanalyse, littérature, philosophie, sciences humaines).'
                  : 'Interdisciplinary research bridging psychoanalysis, literature, philosophy, and humanities.'}
              </li>
              <li>
                <strong>۱۸۴ پروژه (۴.۶٪):</strong>{' '}
                {isFa
                  ? 'پژوهش‌های بالینی تجربی مستقیم در حوزه درمان و ساختار سوژه.'
                  : isFr
                  ? 'Recherches cliniques appliquées en psychopathologie et psychanalyse de terrain.'
                  : 'Applied clinical research in psychopathology and subject structure.'}
              </li>
              <li>
                <strong>۱۵ پروژه (۰.۴٪):</strong>{' '}
                {isFa
                  ? 'مطالعات زبان‌شناختی محض و تحلیل ساختار دال‌ها.'
                  : isFr
                  ? 'Études linguistiques structurales pures et topologie des signifiants.'
                  : 'Pure structural linguistics and topology of signifiers.'}
              </li>
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
