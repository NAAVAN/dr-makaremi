'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sliders,
  Eye,
  Scissors,
  Film,
  CheckCircle2,
  Copy,
  BookOpen,
  Sparkles,
  Layers,
} from 'lucide-react';
import { getBookStudioProfile } from '@/lib/legacy-heritage';
import { Book3DShowcase } from './Book3DShowcase';
import { BookSampleReader } from './BookSampleReader';
import type { Book, Locale } from '@makaremi/shared';

interface BookStudioAdminWorkbenchProps {
  books: Book[];
  locale: Locale;
}

const PAPER_TYPES = [
  { id: 'bulky70', labelFa: 'بالکی نخودی ۷۰ گرم (ضریب پفکی ۱.۸)', labelFr: 'Bouffant Ivoire 70g (1.8)', gsm: 70, bulk: 1.8 },
  { id: 'offset80', labelFa: 'تحریر سفید ۸۰ گرم (ضریب ۱.۳۵)', labelFr: 'Offset Blanc 80g (1.35)', gsm: 80, bulk: 1.35 },
  { id: 'matte115', labelFa: 'گلاسه مات هنری ۱۱۵ گرم (ضریب ۱.۱)', labelFr: 'Couché Mat 115g (1.1)', gsm: 115, bulk: 1.1 },
];

const TRIM_SIZES = [
  { id: 'vaziri', labelFa: 'وزیری استاندارد (۱۷۰×۲۴۰ میلی‌متر)', labelFr: 'Royal 170×240 mm', w: 170, h: 240 },
  { id: 'roghi', labelFa: 'رقعی (۱۴۵×۲۱۵ میلی‌متر)', labelFr: 'Octavo 145×215 mm', w: 145, h: 215 },
  { id: 'rahli', labelFa: 'رحلی هنری (۲۱۰×۲۹۰ میلی‌متر)', labelFr: 'Art Quarto 210×290 mm', w: 210, h: 290 },
];

export function BookStudioAdminWorkbench({ books, locale }: BookStudioAdminWorkbenchProps) {
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';

  const [selectedSlug, setSelectedSlug] = useState<string>(
    books[0]?.slug || 'lacan-seminar-3-psychoses'
  );
  const selectedBook = books.find((b) => b.slug === selectedSlug) || books[0];
  const selectedTrans =
    selectedBook?.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    selectedBook?.translations?.[0];

  const baseProfile = getBookStudioProfile(
    selectedBook.slug,
    selectedBook.page_count || 264,
    selectedBook.pillar
  );

  // Live Studio State
  const [viewMode, setViewMode] = useState<'studio' | 'visitor' | 'reels'>('studio');
  const [direction, setDirection] = useState<'rtl' | 'ltr'>(baseProfile.direction);
  const [pageCount, setPageCount] = useState<number>(selectedBook.page_count || 264);
  const [paperIdx, setPaperIdx] = useState<number>(0);
  const [trimIdx, setTrimIdx] = useState<number>(0);
  const [previewStart, setPreviewStart] = useState<number>(baseProfile.previewStartPage);
  const [previewEnd, setPreviewEnd] = useState<number>(baseProfile.previewEndPage);
  const [copiedConfig, setCopiedConfig] = useState<boolean>(false);

  const paper = PAPER_TYPES[paperIdx];
  const trim = TRIM_SIZES[trimIdx];

  // Volumetric & Spine Calculation Engine
  const paperBlockMm = Number(((pageCount / 2) * (paper.gsm / 1000) * paper.bulk).toFixed(1));
  const boardThicknessMm = 3.2; // Hardcover boards
  const totalSpineMm = Number((paperBlockMm + boardThicknessMm).toFixed(1));
  const printingForms = Number((pageCount / 16).toFixed(1));
  const totalSpreadWidthMm = Number((trim.w * 2 + totalSpineMm).toFixed(1));
  const estimatedWeightGrams = Math.round(
    (trim.w * trim.h * pageCount * paper.gsm) / 2_000_000 + 110
  );

  // Stack thickness before & after previewStart
  const stackBeforeMm = Number(((previewStart / pageCount) * paperBlockMm).toFixed(1));
  const stackAfterMm = Number((((pageCount - previewStart) / pageCount) * paperBlockMm).toFixed(1));

  const handleSelectBook = (slug: string) => {
    setSelectedSlug(slug);
    const b = books.find((item) => item.slug === slug);
    if (b) {
      const prof = getBookStudioProfile(b.slug, b.page_count || 240, b.pillar);
      setDirection(prof.direction);
      setPageCount(b.page_count || 240);
      setPreviewStart(prof.previewStartPage);
      setPreviewEnd(prof.previewEndPage);
    }
  };

  const handleCopyJson = () => {
    const configPayload = {
      slug: selectedBook.slug,
      direction,
      pageCount,
      trimSize: `${trim.w}x${trim.h}mm`,
      paperGsm: paper.gsm,
      bulkFactor: paper.bulk,
      spineWidthMm: totalSpineMm,
      weightGrams: estimatedWeightGrams,
      previewStartPage: previewStart,
      previewEndPage: previewEnd,
    };
    navigator.clipboard?.writeText(JSON.stringify(configPayload, null, 2));
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2500);
  };

  // Dynamic book object reflecting live studio overrides
  const liveBook: Book = {
    ...selectedBook,
    page_count: pageCount,
  };

  return (
    <div className="space-y-8">
      {/* Top Studio Mode Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)]">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="studio-book-select" className="text-xs font-bold text-[var(--foreground)]">
            {isFa ? 'انتخاب کتاب در استودیو:' : 'Livre actif :'}
          </label>
          <select
            id="studio-book-select"
            value={selectedSlug}
            onChange={(e) => handleSelectBook(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--foreground)]"
          >
            {books.map((b) => {
              const t =
                b.translations?.find((tr) => tr.languages_code.startsWith(locale)) ||
                b.translations?.[0];
              return (
                <option key={b.slug} value={b.slug}>
                  {t?.title || b.slug} ({b.publication_year})
                </option>
              );
            })}
          </select>
        </div>

        {/* Mode Switcher: Admin Studio vs Pure Visitor View vs 9:16 Reels */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[var(--surface-card)] p-1 rounded-xl border border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setViewMode('studio')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'studio'
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <Sliders size={14} />
            <span>{isFa ? '۱. میز کار مهندسی مدیر' : '1. Console Admin'}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('visitor')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'visitor'
                ? 'bg-emerald-700 text-white'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <Eye size={14} />
            <span>{isFa ? '۲. نمای خالص خواننده سایت (Sanctuary)' : '2. Vue Lecteur Pure'}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('reels')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'reels'
                ? 'bg-amber-700 text-white'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <Film size={14} />
            <span>{isFa ? '۳. استودیو ریلز ۹:۱۶ (شبکه‌های اجتماعی)' : '3. Studio Reels 9:16'}</span>
          </button>
        </div>
      </div>

      {/* MODE 1: ADMIN ENGINEERING WORKBENCH + LIVE PREVIEW */}
      {viewMode === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Admin Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Control Card 1: Binding Direction & Volumetric Spine Engine */}
            <div className="p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <h2 className="text-base font-black text-[var(--foreground)] flex items-center gap-2">
                  <Layers size={16} className="text-amber-600" />
                  <span>
                    {isFa
                      ? '۱. جهت صحافی و موتور محاسبه حجم و قطر کتاب'
                      : '1. Reliure & Calculateur Volumétrique'}
                  </span>
                </h2>
              </div>

              {/* RTL vs LTR Switcher */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[var(--foreground)] block">
                  {isFa ? 'جهت صحافی و باز شدن جلد کتاب:' : 'Sens de reliure :'}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDirection('rtl')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      direction === 'rtl'
                        ? 'bg-amber-700 text-white border-amber-700'
                        : 'bg-[var(--surface-sunken)] text-[var(--foreground)] border-[var(--border-subtle)]'
                    }`}
                  >
                    {isFa ? 'راست‌به‌چپ (RTL فارسی)' : 'RTL (Persan)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('ltr')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      direction === 'ltr'
                        ? 'bg-amber-700 text-white border-amber-700'
                        : 'bg-[var(--surface-sunken)] text-[var(--foreground)] border-[var(--border-subtle)]'
                    }`}
                  >
                    {isFa ? 'چپ‌به‌راست (LTR فرانسوی)' : 'LTR (Français)'}
                  </button>
                </div>
              </div>

              {/* Page Count Slider & Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="page-count-input" className="font-bold text-[var(--foreground)]">
                    {isFa ? 'تعداد کل صفحات کتاب:' : 'Nombre total de pages :'}
                  </label>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                    {pageCount} {isFa ? `صفحه (${printingForms} فرم چاپی)` : 'pages'}
                  </span>
                </div>
                <input
                  id="page-count-input"
                  type="range"
                  min={64}
                  max={640}
                  step={8}
                  value={pageCount}
                  onChange={(e) => setPageCount(Number(e.target.value))}
                  className="w-full accent-amber-700 cursor-pointer"
                />
              </div>

              {/* Paper & Trim Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="paper-type-select" className="text-[11px] font-bold text-[var(--foreground-muted)] block">
                    {isFa ? 'جنس کاغذ و ضریب پفکی:' : 'Papier :'}
                  </label>
                  <select
                    id="paper-type-select"
                    value={paperIdx}
                    onChange={(e) => setPaperIdx(Number(e.target.value))}
                    className="w-full px-2.5 py-2 rounded-xl text-xs bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--foreground)]"
                  >
                    {PAPER_TYPES.map((p, i) => (
                      <option key={p.id} value={i}>
                        {isFa ? p.labelFa : p.labelFr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="trim-size-select" className="text-[11px] font-bold text-[var(--foreground-muted)] block">
                    {isFa ? 'قطع استاندارد کتاب:' : 'Format :'}
                  </label>
                  <select
                    id="trim-size-select"
                    value={trimIdx}
                    onChange={(e) => setTrimIdx(Number(e.target.value))}
                    className="w-full px-2.5 py-2 rounded-xl text-xs bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--foreground)]"
                  >
                    {TRIM_SIZES.map((t, i) => (
                      <option key={t.id} value={i}>
                        {isFa ? t.labelFa : t.labelFr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Calculated Physical Telemetry */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-center">
                  <span className="text-[10px] text-[var(--foreground-muted)] block">
                    {isFa ? 'ضخامت بلوک کاغذ' : 'Bloc papier'}
                  </span>
                  <span className="text-sm font-black font-mono text-teal-700 dark:text-teal-400">
                    {paperBlockMm} mm
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-center">
                  <span className="text-[10px] text-[var(--foreground-muted)] block">
                    {isFa ? 'قطر کل عطف (Spine)' : 'Dos total'}
                  </span>
                  <span className="text-sm font-black font-mono text-amber-700 dark:text-amber-400">
                    {totalSpineMm} mm
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-center">
                  <span className="text-[10px] text-[var(--foreground-muted)] block">
                    {isFa ? 'وزن تقریبی' : 'Poids estimé'}
                  </span>
                  <span className="text-sm font-black font-mono text-[var(--foreground)]">
                    {estimatedWeightGrams} g
                  </span>
                </div>
              </div>
            </div>

            {/* Control Card 2: Admin Authorized Page Range (مثلاً ۱۰۸ تا ۱۵۰) */}
            <div className="p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-4">
              <h2 className="text-base font-black text-[var(--foreground)] flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
                <BookOpen size={16} className="text-teal-600" />
                <span>
                  {isFa
                    ? '۲. بازه صفحات مجاز نمایش به اختیار مدیر'
                    : '2. Plage de Pages Autorisée (Extrait)'}
                </span>
              </h2>

              <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                {isFa
                  ? 'قانون طلایی نسخه v8.0: جلد کتاب همیشه ابتدا روی «صفحه ۱ (صفحه عنوان داخلی)» باز می‌شود و سپس خواننده با ورق زدن وارد بازه انتخابی شما (مثلاً صفحه ۱۰۸ تا ۱۵۰) می‌گردد.'
                  : 'La couverture s’ouvre toujours sur la Page 1 (Titre) avant de passer à la plage sélectionnée.'}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="preview-start-input" className="text-[11px] font-bold text-[var(--foreground)] block mb-1">
                    {isFa ? 'از صفحه (شروع تورق):' : 'Page de début :'}
                  </label>
                  <input
                    id="preview-start-input"
                    type="number"
                    min={1}
                    max={pageCount - 2}
                    value={previewStart}
                    onChange={(e) => setPreviewStart(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold bg-[var(--surface-sunken)] border border-[var(--border-subtle)]"
                  />
                </div>
                <div>
                  <label htmlFor="preview-end-input" className="text-[11px] font-bold text-[var(--foreground)] block mb-1">
                    {isFa ? 'تا صفحه (پایان تورق):' : 'Page de fin :'}
                  </label>
                  <input
                    id="preview-end-input"
                    type="number"
                    min={previewStart + 1}
                    max={pageCount}
                    value={previewEnd}
                    onChange={(e) => setPreviewEnd(Math.min(pageCount, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold bg-[var(--surface-sunken)] border border-[var(--border-subtle)]"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewStart(1);
                    setPreviewEnd(20);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[var(--surface-sunken)] border border-[var(--border-subtle)] hover:border-amber-600/50 cursor-pointer"
                >
                  {isFa ? '۲۰ صفحه اول (۱ تا ۲۰)' : '20 premières pages'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewStart(108);
                    setPreviewEnd(150);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 cursor-pointer"
                >
                  {isFa ? 'فصل میانی (۱۰۸ تا ۱۵۰)' : 'Chapitre central (108–150)'}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[11px] font-mono flex items-center justify-between">
                <span>{isFa ? `قطر پشته قبل از ص ${previewStart}:` : 'Épaisseur avant :'}</span>
                <span className="font-bold text-amber-700 dark:text-amber-400">
                  {stackBeforeMm} mm / {stackAfterMm} mm
                </span>
              </div>
            </div>

            {/* Control Card 3: Print-Spread Automatic Cover Slicer */}
            <div className="p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-4">
              <h2 className="text-base font-black text-[var(--foreground)] flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
                <Scissors size={16} className="text-rose-600" />
                <span>
                  {isFa
                    ? '۳. برش خودکار شیت گسترده جلد چاپخانه'
                    : '3. Découpe Automatique de la Couverture'}
                </span>
              </h2>
              <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                {isFa
                  ? `عرض کل شیت گسترده چاپخانه برای این کتاب برابر با ${totalSpreadWidthMm} میلی‌متر (پشت جلد ${trim.w}mm + عطف ${totalSpineMm}mm + روی جلد ${trim.w}mm) محاسبه شده است.`
                  : `Largeur totale de la planche d'impression : ${totalSpreadWidthMm} mm.`}
              </p>

              <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono">
                <div className="p-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)]">
                  <span className="block font-bold text-[var(--foreground)]">
                    {direction === 'rtl' ? (isFa ? 'روی جلد (چپ)' : 'Face') : isFa ? 'پشت جلد' : 'Dos'}
                  </span>
                  <span>{trim.w} mm</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-300">
                  <span className="block font-bold">{isFa ? 'عطف مرکزی' : 'Dos central'}</span>
                  <span>{totalSpineMm} mm</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)]">
                  <span className="block font-bold text-[var(--foreground)]">
                    {direction === 'rtl' ? (isFa ? 'پشت جلد (راست)' : '4e couv') : isFa ? 'روی جلد' : 'Face'}
                  </span>
                  <span>{trim.w} mm</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyJson}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-[var(--primary)] text-[var(--primary-foreground)] cursor-pointer"
              >
                {copiedConfig ? <CheckCircle2 size={15} /> : <Copy size={15} />}
                <span>
                  {copiedConfig
                    ? isFa
                      ? 'تنظیمات سه‌بعدی کتاب کپی شد!'
                      : 'Configuration copiée !'
                    : isFa
                    ? 'ذخیره و کپی تنظیمات JSON برای فرانت‌اند'
                    : 'Exporter la configuration JSON'}
                </span>
              </button>
            </div>
          </div>

          {/* Right Column: Live 3D Showcase & Page-Flip Reader Preview (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-3xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5">
                  <Sparkles size={15} className="text-amber-600" />
                  <span>
                    {isFa
                      ? 'پیش‌نمایش زنده ویترین سه‌بعدی در فرانت‌اند سایت (نسخه آرامش‌بخش v8.0)'
                      : 'Aperçu 3D en Direct (Édition Sanctuaire Culturel v8.0)'}
                  </span>
                </span>
                <Link
                  href={`/${locale}/books/${selectedBook.slug}`}
                  className="text-xs font-bold text-[var(--primary)] hover:underline"
                >
                  {isFa ? 'مشاهده در صفحه عمومی کتاب ←' : 'Voir la page publique →'}
                </Link>
              </div>

              <div className="bg-[var(--surface-card)] rounded-2xl p-4 border border-[var(--border-subtle)]">
                <Book3DShowcase
                  book={liveBook}
                  translation={selectedTrans}
                  locale={locale}
                />
              </div>
            </div>

            <BookSampleReader
              title={selectedTrans?.title || selectedBook.slug}
              subtitle={selectedTrans?.subtitle}
              publisherName={selectedTrans?.publisher_name}
              tableOfContents={selectedTrans?.table_of_contents_markdown}
              sampleChapter={selectedTrans?.sample_chapter_markdown}
              book={liveBook}
              locale={locale}
            />
          </div>
        </div>
      )}

      {/* MODE 2: PURE VISITOR SANCTUARY VIEW */}
      {viewMode === 'visitor' && (
        <div className="space-y-10 animate-fade-in">
          <div className="p-8 rounded-3xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 bg-[var(--surface-card)] rounded-2xl p-4 border border-[var(--border-subtle)]">
              <Book3DShowcase
                book={liveBook}
                translation={selectedTrans}
                locale={locale}
              />
            </div>
            <div className="lg:col-span-7 space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300">
                {baseProfile.genreLabel[locale]}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--foreground)]">
                {selectedTrans?.title}
              </h2>
              <p className="text-sm text-[var(--foreground-muted)] leading-relaxed font-serif">
                {selectedTrans?.synopsis}
              </p>
            </div>
          </div>

          <BookSampleReader
            title={selectedTrans?.title || selectedBook.slug}
            subtitle={selectedTrans?.subtitle}
            publisherName={selectedTrans?.publisher_name}
            tableOfContents={selectedTrans?.table_of_contents_markdown}
            sampleChapter={selectedTrans?.sample_chapter_markdown}
            book={liveBook}
            locale={locale}
          />
        </div>
      )}

      {/* MODE 3: 9:16 SOCIAL MEDIA REELS / SHORTS STUDIO */}
      {viewMode === 'reels' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-fade-in">
          <div className="lg:col-span-5 flex justify-center">
            {/* 9:16 Vertical Smartphone Stage */}
            <div className="w-[310px] h-[550px] rounded-[36px] p-5 bg-gradient-to-b from-stone-900 via-stone-950 to-black text-white border-4 border-stone-700 shadow-2xl flex flex-col justify-between items-center text-center relative overflow-hidden">
              <div className="space-y-1 pt-2 z-10">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 block">
                  makaremi.com • 3D Book Reveal
                </span>
                <h3 className="text-sm font-black px-2 line-clamp-2">
                  {selectedTrans?.title}
                </h3>
              </div>

              <div className="scale-75 -my-10">
                <Book3DShowcase
                  book={liveBook}
                  translation={selectedTrans}
                  locale={locale}
                />
              </div>

              <div className="space-y-1.5 pb-2 z-10 border-t border-white/15 pt-3 w-full">
                <p className="text-xs font-bold text-amber-400">
                  {isFa ? 'دکتر حسن مکارمی' : 'Dr. Hassan Makaremi'}
                </p>
                <p className="text-[10px] opacity-75">
                  {selectedTrans?.publisher_name} • {pageCount} ص
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4 p-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)]">
            <h2 className="text-xl font-black text-[var(--foreground)]">
              {isFa
                ? 'استودیو تولید ریلز ۹:۱۶ (Instagram Reels / YouTube Shorts)'
                : 'Studio Vidéo Vertical 9:16 (Reels & Shorts)'}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed">
              {isFa
                ? 'کادر عمودی ۹:۱۶ در سمت راست، کتاب انتخاب‌شده را با قطر واقعی عطف، طلاکوب جلد و انیمیشن باز شدن روی صفحه ۱ عنوان آماده ضبط و انتشار در شبکه‌های اجتماعی (اینستاگرام، تلگرام و یوتیوب) می‌کند.'
                : 'Cadre vertical 9:16 prêt pour l’enregistrement et le partage sur Instagram Reels, YouTube Shorts et Telegram.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

