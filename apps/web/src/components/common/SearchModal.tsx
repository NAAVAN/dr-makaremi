'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Book,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Video,
  Feather,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import type { Locale } from '@makaremi/shared';
import { cleanSummaryWithoutRawUrls } from '@/lib/link-labeler';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: Locale;
}

interface SearchItem {
  id: string;
  title: string;
  type: 'book' | 'article' | 'exhibition' | 'glossary' | 'speech' | 'poem';
  url: string;
  snippet: string;
}

const FEATURED_SHORTCUTS: Record<Locale, SearchItem[]> = {
  fa: [
    {
      id: 's1',
      title: 'سمینار سوم ژاک لکان: روان‌پریشی‌ها',
      type: 'book',
      url: '/fa/books/lacan-seminar-3-psychoses',
      snippet: 'ترجمه مستقیم سمینار کلاسیک ژاک لکان پیرامون ساختار سایکوز و استعاره پدری',
    },
    {
      id: 's2',
      title: 'آیا روانکاوی علم است؟',
      type: 'article',
      url: '/fa/psychoanalysis/articles/is-psychoanalysis-a-science',
      snippet: 'تحلیل جایگاه ناخودآگاه در علم معاصر و بررسی داده‌های ۳۹۵۴ پروژه پژوهشی CNRS',
    },
    {
      id: 's3',
      title: 'نمایشگاه میان نشان و نماد (پومپادور ۲۰۰۲)',
      type: 'exhibition',
      url: '/fa/art/exhibitions/pompadour-2002-between-sign-and-symbol',
      snippet: 'تابلوهای خوشنویسی مدرن و نقاشی‌خط‌های دکتر مکارمی با ۲۴ تصویر آرشیوی',
    },
    {
      id: 's4',
      title: 'واژه‌نامه تحلیلی لکانی (دگرشنیدن، نام پدر، حالت مرزی)',
      type: 'glossary',
      url: '/fa/glossary',
      snippet: 'اصطلاح‌نامه تخصصی و کنترل‌شده روانکاوی لکانی و مطالعات راهبردی',
    },
    {
      id: 's5',
      title: 'نشست دادخواهی خاوران',
      type: 'speech',
      url: '/fa/human-rights/speeches/khavaran-justice-session',
      snippet: 'سخنرانی پیرامون ابعاد حقوقی و تاریخی کشتار تابستان ۱۳۶۷ و عدالت انتقالی',
    },
    {
      id: 's6',
      title: 'شعر مرا نوازش کن',
      type: 'poem',
      url: '/fa/poetry/poems/caress-me',
      snippet: 'سروده همراه با تابلوی اختصاصی نقاشی‌خط در دفتر ۳۰۰ شعر',
    },
  ],
  fr: [
    {
      id: 'sf1',
      title: 'La psychanalyse est-elle une science ?',
      type: 'article',
      url: '/fr/psychanalyse/articles/is-psychoanalysis-a-science',
      snippet: 'Enquête épistémologique sur le statut du sujet et les données du CNRS',
    },
    {
      id: 'sf2',
      title: 'État Limite : Un concept psychanalytique ?',
      type: 'article',
      url: '/fr/psychanalyse/articles/etat-limite-concept-psychanalytique',
      snippet: "Étude structurale lacanienne des états limites et de l'opération Nom-du-Père",
    },
    {
      id: 'sf3',
      title: 'Hâfez, par Hâfez (Éditions L’Harmattan)',
      type: 'book',
      url: '/fr/books/hafez-par-hafez',
      snippet: 'Lecture psychanalytique et herméneutique du Divân de Hafez de Chiraz',
    },
    {
      id: 'sf4',
      title: 'Entre Signe et Symbole (Pompadour 2002)',
      type: 'exhibition',
      url: '/fr/art/exhibitions/pompadour-2002-between-sign-and-symbol',
      snippet: 'Exposition de calligraphie contemporaine au Château de Pompadour',
    },
  ],
  en: [
    {
      id: 'se1',
      title: 'Is Psychoanalysis a Science?',
      type: 'article',
      url: '/en/psychoanalysis/articles/is-psychoanalysis-a-science',
      snippet: 'Epistemological analysis of the unconscious, Jacques Lacan, and CNRS empirical data',
    },
    {
      id: 'se2',
      title: 'A Strategic Look at the Transition Period',
      type: 'book',
      url: '/en/books/strategic-look-at-transition',
      snippet: 'Models for secular democracy, constitutional reform, and transitional justice in Iran',
    },
    {
      id: 'se3',
      title: 'Lacanian Controlled Glossary',
      type: 'glossary',
      url: '/en/glossary',
      snippet: 'Trilingual clinical and strategic ontology by Dr. Hassan Makaremi',
    },
  ],
};

function mapApiResultToSearchItem(raw: Record<string, unknown>, locale: Locale): SearchItem {
  const id = String(raw.id || Math.random());
  const title = String(raw.title || raw.slug || '');
  const type = (String(raw.type || 'article') as SearchItem['type']);
  const rawUrl = String(raw.url || `/${locale}/articles`);
  const snippet = String(raw.snippet || raw.text || raw.content || '').slice(0, 180);
  // Ensure URL starts with current locale cleanly
  const normalizedUrl = rawUrl.startsWith('/') ? rawUrl : `/${locale}/${rawUrl}`;
  return { id, title, type, url: normalizedUrl, snippet };
}

export function SearchModal({ isOpen, onClose, locale }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}&locale=${locale}&limit=14`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error('Search failed');
        const data = (await res.json()) as { results?: Array<Record<string, unknown>> };
        const mapped = (data.results || []).map((r) => mapApiResultToSearchItem(r, locale));
        setResults(mapped);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, locale, isOpen]);

  if (!isOpen) return null;

  const trimmedQuery = query.trim();
  const displayItems =
    trimmedQuery.length >= 2
      ? results
      : FEATURED_SHORTCUTS[locale] || FEATURED_SHORTCUTS.fa;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'book':
        return <Book size={16} className="text-[var(--primary)]" />;
      case 'exhibition':
        return <ImageIcon size={16} className="text-[var(--color-art)]" />;
      case 'glossary':
        return <Sparkles size={16} className="text-[var(--color-psychoanalysis)]" />;
      case 'speech':
        return <Video size={16} className="text-[var(--color-strategy)]" />;
      case 'poem':
        return <Feather size={16} className="text-amber-600" />;
      default:
        return <FileText size={16} className="text-[var(--color-strategy)]" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tx('جستجوی سریع در آرشیو', 'Recherche rapide dans les archives', 'Quick archive search')}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-20 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-[var(--surface-overlay)] border border-[var(--border-subtle)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-4 border-b border-[var(--border-subtle)]">
          {loading ? (
            <Loader2 size={20} className="text-[var(--primary)] animate-spin shrink-0" />
          ) : (
            <Search size={20} className="text-[var(--foreground-muted)] shrink-0" />
          )}
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tx(
              'جستجو در ۴۰۴ مقاله، ۲۵ کتاب، ۳۰۰ شعر، ۲۶۱ ویدیو و ۲۷ نمایشگاه...',
              'Rechercher parmi 404 articles, 25 livres, 300 poèmes, 261 vidéos...',
              'Search across 404 articles, 25 books, 300 poems, 261 videos...'
            )}
            className="w-full bg-transparent border-none text-base outline-none text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label={tx('بستن پنجره جستجو', 'Fermer la recherche', 'Close search dialog')}
            className="p-1 rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Assistant CTA */}
        <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <Sparkles size={16} className="shrink-0" />
            <span>
              {tx(
                'جستجوی زنده روی ۲٬۷۴۸ سند واقعی آرشیو — برای تحلیل عمیق‌تر:',
                'Recherche directe sur 2 748 documents — pour une synthèse approfondie :',
                'Live search across 2,748 indexed documents — for deeper synthesis:'
              )}
            </span>
          </div>
          <Link
            href={`/${locale}/assistant`}
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold text-[11px] transition-all shrink-0"
          >
            {tx('دستیار هوشمند پژوهشگر', 'Assistant IA', 'AI Research Assistant')}
          </Link>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-[var(--border-subtle)]">
          {trimmedQuery.length < 2 && (
            <div className="px-3 py-1.5 text-[11px] font-mono text-[var(--foreground-muted)]">
              {tx(
                'میانبرهای برگزیده (حداقل ۲ حرف برای جستجوی کل آرشیو تایپ کنید):',
                'Accès rapides (tapez au moins 2 lettres) :',
                'Featured shortcuts (type at least 2 characters to search the full archive):'
              )}
            </div>
          )}

          {displayItems.length > 0 ? (
            displayItems.map((item) => (
              <Link
                key={`${item.id}-${item.url}`}
                href={item.url}
                onClick={onClose}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--surface-sunken)] transition-colors group"
              >
                <div className="mt-1 p-2 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] shrink-0">
                  {getTypeIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--foreground-muted)] shrink-0">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--foreground-muted)] line-clamp-1 mt-1 leading-relaxed">
                    {cleanSummaryWithoutRawUrls(item.snippet)}
                  </p>
                </div>
              </Link>
            ))
          ) : loading ? (
            <div className="p-8 text-center text-sm text-[var(--foreground-muted)]">
              {tx('در حال جستجو در آرشیو کامل...', 'Recherche en cours...', 'Searching complete archive...')}
            </div>
          ) : (
            <div className="p-8 text-center space-y-3 text-sm text-[var(--foreground-muted)]">
              <p>{tx('موردی مطابق جستجوی شما یافت نشد.', 'Aucun résultat trouvé.', 'No matching entries found.')}</p>
              <Link
                href={`/${locale}/articles?q=${encodeURIComponent(trimmedQuery)}`}
                onClick={onClose}
                className="inline-block px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[var(--primary)] text-[var(--primary-foreground)]"
              >
                {tx('جستجو در آرشیو کامل مقالات ←', 'Chercher dans tous les articles →', 'Search full articles archive →')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
