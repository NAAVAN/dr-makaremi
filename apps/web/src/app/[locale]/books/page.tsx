import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookOpen, Sliders } from 'lucide-react';
import { getBooks } from '@/lib/cms';
import { isValidLocale, type Locale } from '@/lib/i18n';
import { BooksInteractiveCatalog } from '@/components/books/BooksInteractiveCatalog';

export default async function BooksCatalogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  if (!isValidLocale(locale)) notFound();

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';

  const books = await getBooks(locale);

  return (
    <div className="space-y-10">
      {/* Page Header with Single H1 */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-[var(--primary)] font-bold">
            <BookOpen size={16} />
            <span>{isFa ? 'کتاب‌خانه سه‌بعدی و منشورات' : 'Bibliothèque 3D & Publications'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
            {isFa
              ? 'کتاب‌خانه دیجیتال و تألیفات دکتر حسن مکارمی'
              : isFr
                ? 'Publications & Livres du Dr. Hassan Makaremi'
                : 'Digital Library & Publications of Dr. Hassan Makaremi'}
          </h1>
          <p className="text-sm text-[var(--foreground-muted)] max-w-2xl leading-relaxed">
            {isFa
              ? 'مجموعه بیش از ۱۶ عنوان کتاب تألیفی و ترجمه در ۸ ژانر تخصصی (روانکاوی بالینی لکانی، حافظ‌پژوهی، مطالعات راهبردی، فرهنگ ایران، هنر خوشنویسی، شعر دوزبانه، رمان و خاطرات) همراه با کتاب‌خوان ورق‌خور سه‌بعدی.'
              : "Monographies, études sur Hafez, romans, traductions de Jacques Lacan et essais stratégiques publiés en France et en Iran."}
          </p>
        </div>

        <Link
          href={`/${locale}/book-studio`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[var(--surface-sunken)] hover:bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--foreground)] transition-all shrink-0"
        >
          <Sliders size={14} className="text-amber-600" />
          <span>
            {isFa
              ? 'ورود به استودیوی مدیریت کتاب 3D (دشبورد)'
              : isFr
                ? 'Studio d’Édition 3D (Admin)'
                : '3D Book Publishing Studio'}
          </span>
        </Link>
      </header>

      {/* Interactive 3D Showcase, 8-Genre Filter & Books Grid */}
      <BooksInteractiveCatalog books={books} locale={locale} />
    </div>
  );
}
