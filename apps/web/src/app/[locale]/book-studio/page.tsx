import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Sliders, ArrowRight, ArrowLeft, Download } from 'lucide-react';
import { getBooks } from '@/lib/cms';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { BookStudioAdminWorkbench } from '@/components/books/BookStudioAdminWorkbench';

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';

  return {
    title: isFa
      ? 'استودیوی مدیریت و مهندسی کتاب سه‌بعدی (پنل مدیر) | دکتر حسن مکارمی'
      : isFr
      ? 'Studio d’Édition 3D & Lecteur Interactif | Dr Hassan Makaremi'
      : '3D Book Publishing Studio & Flipbook Engine | Dr. Hassan Makaremi',
    description: isFa
      ? 'استودیوی بک‌اند و دشبورد مدیریت کتاب‌های سه‌بعدی دکتر حسن مکارمی: تنظیم صحافی RTL/LTR، محاسبه قطر عطف، تعیین بازه صفحات مطالعه (مثلاً ۱۰۸ تا ۱۵۰) و برش خودکار جلد.'
      : 'Console d’édition 3D pour la gestion des ouvrages, du calcul du dos et des extraits.',
    alternates: {
      canonical: `https://makaremi.com/${locale}/book-studio`,
      types: {
        'text/markdown': `https://makaremi.com/${locale}/book-studio.md`,
      },
    },
  };
}

export default async function BookStudioDashboardPage({
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
      <link
        rel="alternate"
        type="text/markdown"
        href={`/${locale}/book-studio.md`}
        title="Markdown Twin"
      />

      {/* Top Breadcrumb */}
      <nav aria-label="راهنمای مسیر" className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
        <Link
          href={`/${locale}/books`}
          className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors font-medium"
        >
          {isFa ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          <span>{isFa ? 'بازگشت به تالار کتاب‌ها' : 'Retour à la bibliothèque'}</span>
        </Link>

        <Link
          href={`/${locale}/book-studio.md`}
          target="_blank"
          className="flex items-center gap-1 font-mono px-2.5 py-1 rounded-md bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
        >
          <Download size={12} />
          <span>.md (Studio Spec)</span>
        </Link>
      </nav>

      {/* Header with STRICT SINGLE H1 */}
      <header className="space-y-3 border-b border-[var(--border-subtle)] pb-6">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-amber-600 font-bold">
          <Sliders size={16} />
          <span>
            {isFa
              ? 'استودیوی بک‌اند و دشبورد مدیریت نشر • نسخه v8.0 Cultural Sanctuary'
              : 'Console d’Édition 3D • v8.0 Cultural Sanctuary'}
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
          {isFa
            ? 'استودیوی جامع مهندسی، مدیریت و نمایش سه‌بعدی کتاب‌ها'
            : isFr
            ? 'Studio d’Édition 3D et Configuration du Lecteur Interactif'
            : '3D Book Publishing Studio & Interactive Reader Configuration'}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--foreground-muted)] max-w-3xl leading-relaxed">
          {isFa
            ? 'در این میز کار مدیریتی، جهت صحافی (راست‌به‌چپ فارسی / چپ‌به‌راست فرانسوی)، تعداد صفحات، قطر عطف، برش خودکار جلد چاپخانه و بازه صفحات مجاز نمایش (مثلاً صفحه ۱۰۸ تا ۱۵۰) را تنظیم کنید و نتیجه را به صورت زنده در ویترین آرامش‌بخش فرانت‌اند مشاهده فرمایید.'
            : 'Configurez la reliure RTL/LTR, l’épaisseur du dos, la découpe de couverture et la plage de pages autorisée.'}
        </p>
      </header>

      {/* Interactive Workbench */}
      <BookStudioAdminWorkbench books={books} locale={locale} />
    </div>
  );
}

