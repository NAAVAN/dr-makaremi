'use client';

import React, { useState } from 'react';
import { Copy, Check, BookMarked } from 'lucide-react';
import type { Book, BookTranslation, Locale } from '@makaremi/shared';

interface BookMetadataCardProps {
  book: Book;
  translation?: BookTranslation;
  locale: Locale;
}

export function BookMetadataCard({ book, translation, locale }: BookMetadataCardProps) {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const title = translation?.title || book.slug;
  const publisher = translation?.publisher_name || 'Alian';
  const city = translation?.publication_city || (locale === 'fa' ? 'تهران / پاریس' : 'Paris');
  const year = book.publication_year;
  const isbn = book.isbn_13 || 'N/A';

  const citations: Record<string, string> = {
    APA: `Makaremi, H. (${year}). ${title}. ${city}: ${publisher}.`,
    MLA: `Makaremi, Hassan. ${title}. ${publisher}, ${year}.`,
    Chicago: `Makaremi, Hassan. ${title}. ${city}: ${publisher}, ${year}.`,
    BibTeX: `@book{makaremi${year}${book.slug.replace(/[^a-zA-Z0-9]/g, '')},
  author    = {Hassan Makaremi},
  title     = {${title}},
  year      = {${year}},
  publisher = {${publisher}},
  address   = {${city}},
  isbn      = {${isbn}}
}`,
  };

  const copyCitation = (format: string) => {
    navigator.clipboard.writeText(citations[format]);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  const isFa = locale === 'fa';

  return (
    <div className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-6 space-y-6">
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-4">
        <BookMarked className="text-[var(--primary)]" size={20} />
        <h3 className="text-base font-bold text-[var(--foreground)]">
          {isFa ? 'شناسنامه کتابشناختی و ارجاع علمی' : 'Bibliographic Passport & Citations'}
        </h3>
      </div>

      {/* Bibliographic table */}
      <dl className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <dt className="text-[var(--foreground-muted)]">{isFa ? 'شابک (ISBN-13)' : 'ISBN-13'}</dt>
          <dd className="font-mono font-bold text-[var(--foreground)] mt-0.5">{isbn}</dd>
        </div>
        <div>
          <dt className="text-[var(--foreground-muted)]">{isFa ? 'ناشر' : 'Publisher'}</dt>
          <dd className="font-bold text-[var(--foreground)] mt-0.5">{publisher}</dd>
        </div>
        <div>
          <dt className="text-[var(--foreground-muted)]">{isFa ? 'سال انتشار' : 'Year'}</dt>
          <dd className="font-bold text-[var(--foreground)] mt-0.5">{year}</dd>
        </div>
        <div>
          <dt className="text-[var(--foreground-muted)]">{isFa ? 'تعداد صفحات' : 'Pages'}</dt>
          <dd className="font-bold text-[var(--foreground)] mt-0.5">{book.page_count || '—'}</dd>
        </div>
      </dl>

      {/* Academic Citation Formats */}
      <div className="border-t border-[var(--border-subtle)] pt-4 space-y-2">
        <span className="text-[11px] font-bold text-[var(--foreground-muted)] block">
          {isFa ? 'کپی ارجاع استاندارد در مقالات علمی:' : 'Copy Citation Format:'}
        </span>
        <div className="flex flex-wrap gap-2">
          {Object.keys(citations).map((format) => (
            <button
              key={format}
              type="button"
              onClick={() => copyCitation(format)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-[var(--surface-sunken)] hover:bg-[var(--surface-overlay)] border border-[var(--border-subtle)] text-[var(--foreground)] transition-colors cursor-pointer"
            >
              {copiedFormat === format ? (
                <>
                  <Check size={12} className="text-emerald-500" />
                  <span className="text-emerald-500 font-bold">{format} کپی شد</span>
                </>
              ) : (
                <>
                  <Copy size={12} className="text-[var(--foreground-muted)]" />
                  <span>{format}</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
