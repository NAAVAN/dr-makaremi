'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Book, FileText, Image as ImageIcon, Sparkles } from 'lucide-react';
import Link from 'next/link';
import type { Locale } from '@makaremi/shared';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: Locale;
}

interface SearchItem {
  id: string;
  title: string;
  type: 'book' | 'article' | 'exhibition' | 'glossary';
  url: string;
  snippet: string;
}

const STATIC_SEARCH_INDEX: Record<Locale, SearchItem[]> = {
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
      snippet: 'تابلوهای خوشنویسی مدرن و نقاشی‌خط‌های دکتر مکارمی با نقد پروفسور مایکل بری',
    },
    {
      id: 's4',
      title: 'دگر شنیدن در روان‌کاوی',
      type: 'book',
      url: '/fa/books/listening-differently-in-psychoanalysis',
      snippet: 'جستارهایی در بالین، زبان و ناخودآگاه سوژه ایرانی',
    },
    {
      id: 's5',
      title: 'نگاهی راهبردی به دوران گذار',
      type: 'book',
      url: '/fa/books/strategic-look-at-transition',
      snippet: 'نقشه راهبردی جامع برای عبور از استبداد دینی و استقرار جمهوری دموکراتیک سکولار',
    },
    {
      id: 's6',
      title: 'واژه: دگرشنیدن (Écouter autrement)',
      type: 'glossary',
      url: '/fa/psychoanalysis/articles/is-psychoanalysis-a-science',
      snippet: 'رویکرد تحلیلی و بالینی دکتر مکارمی در بازخوانی ناخودآگاه سوژه',
    },
    {
      id: 's7',
      title: 'نشست دادخواهی خاوران',
      type: 'article',
      url: '/fa/human-rights/speeches/khavaran-justice-session',
      snippet: 'سخنرانی پیرامون ابعاد حقوقی و تاریخی کشتار تابستان ۱۳۶۷ و عدالت انتقالی',
    },
    {
      id: 's8',
      title: 'شعر مرا نوازش کن',
      type: 'article',
      url: '/fa/poetry/poems/caress-me',
      snippet: 'سروده‌ای با دکلمه صوتی مؤلف همراه با تابلوی نقاشی‌خط',
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
      title: 'Topologie des lieux saints',
      type: 'article',
      url: '/fr/psychanalyse/articles/topologie-des-lieux-saints',
      snippet: "Application du Tore lacanien et de la topologie de l'espace à l'architecture sacrée",
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
  ],
};

export function SearchModal({ isOpen, onClose, locale }: SearchModalProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle or open
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items = STATIC_SEARCH_INDEX[locale] || STATIC_SEARCH_INDEX.fa;
  const filtered = query.trim()
    ? items.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.snippet.toLowerCase().includes(query.toLowerCase())
      )
    : items;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'book':
        return <Book size={16} className="text-[var(--primary)]" />;
      case 'exhibition':
        return <ImageIcon size={16} className="text-[var(--color-art)]" />;
      case 'glossary':
        return <Sparkles size={16} className="text-[var(--color-psychoanalysis)]" />;
      default:
        return <FileText size={16} className="text-[var(--color-strategy)]" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="جستجوی سریع در آرشیو"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-20 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-[var(--surface-overlay)] border border-[var(--border-subtle)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-4 border-b border-[var(--border-subtle)]">
          <Search size={20} className="text-[var(--foreground-muted)]" />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              locale === 'fa'
                ? 'جستجوی کتاب‌ها، مقالات، واژه‌نامه لکانی یا نمایشگاه‌ها...'
                : locale === 'fr'
                ? 'Rechercher livres, articles, concepts lacaniens...'
                : 'Search books, articles, Lacanian concepts...'
            }
            className="w-full bg-transparent border-none text-base outline-none text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن پنجره جستجو"
            className="p-1 rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--surface-sunken)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Assistant CTA */}
        <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Sparkles size={16} />
            <span>
              {locale === 'fa'
                ? 'پاسخ‌های عمیق‌تر، تحلیلی و مستند به آثار می‌خواهید؟'
                : 'Need deeper, grounded research synthesis?'}
            </span>
          </div>
          <Link
            href={`/${locale}/assistant`}
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] transition-all"
          >
            {locale === 'fa' ? 'دستیار هوشمند پژوهشگر' : 'Research Assistant'}
          </Link>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-[var(--border-subtle)]">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <Link
                key={item.id}
                href={item.url}
                onClick={onClose}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--surface-sunken)] transition-colors group"
              >
                <div className="mt-1 p-2 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)]">
                  {getTypeIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                      {item.title}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--foreground-muted)]">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--foreground-muted)] line-clamp-1 mt-1 leading-relaxed">
                    {item.snippet}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-[var(--foreground-muted)]">
              {locale === 'fa' ? 'موردی یافت نشد.' : 'Aucun résultat trouvé.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
