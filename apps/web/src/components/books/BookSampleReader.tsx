'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  List,
  Sun,
  Moon,
  Coffee,
  ZoomIn,
  ZoomOut,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  FileText,
} from 'lucide-react';
import { renderSafeMarkdown } from '@/lib/markdown';
import { getBookStudioProfile } from '@/lib/legacy-heritage';
import type { Book, Locale } from '@makaremi/shared';

interface BookSampleReaderProps {
  title: string;
  subtitle?: string | null;
  publisherName?: string | null;
  tableOfContents?: string | null;
  sampleChapter?: string | null;
  book?: Book;
  locale: Locale;
}

type ReaderTheme = 'paper' | 'sepia' | 'night';

interface TurnAnimationState {
  fromIdx: number;
  toIdx: number;
  direction: 'next' | 'prev';
}

export function BookSampleReader({
  title,
  subtitle,
  publisherName,
  tableOfContents,
  sampleChapter,
  book,
  locale,
}: BookSampleReaderProps) {
  const profile = getBookStudioProfile(
    book?.slug || 'lacan-seminar-3-psychoses',
    book?.page_count || 240,
    book?.pillar || 'psychoanalysis'
  );

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const isRtlBook = profile.direction === 'rtl';
  const totalPages = book?.page_count || 240;

  const [activeTab, setActiveTab] = useState<'flipbook' | 'sample' | 'toc'>('flipbook');
  const [spreadIndex, setSpreadIndex] = useState<number>(0);
  const [turnState, setTurnState] = useState<TurnAnimationState | null>(null);
  const [theme, setTheme] = useState<ReaderTheme>('paper');
  const [fontSize, setFontSize] = useState<number>(15);

  const themeClasses: Record<ReaderTheme, string> = {
    paper: 'bg-[#FBF9F4] text-[#1C1917] border-[#E4DEC9]',
    sepia: 'bg-[#F3E9D2] text-[#3B2E1E] border-[#DECFA8]',
    night: 'bg-[#17181C] text-[#E5E7EB] border-[#2B2D33]',
  };

  // Build Spreads:
  // Spread 0 is ALWAYS Page 1 (Interior Title Page) & Page 2 (Colophon & TOC)
  // Spread 1+ are the Admin-configured preview range pages (e.g., 108-109, 110-111)
  const previewPairs: Array<{ firstPageNum: number; secondPageNum: number; idx: number }> = [];
  for (let i = 0; i < profile.previewPages.length; i += 2) {
    const p1 = profile.previewPages[i];
    const p2 = profile.previewPages[i + 1] || {
      pageNumber: p1.pageNumber + 1,
      chapterTitle: p1.chapterTitle,
      heading: isFa ? 'ادامه متن و یادداشت‌های تحلیلی' : 'Suite du texte',
      bodyParagraphs: [sampleChapter || 'ادامه گفتار در نسخه چاپی و الکترونیک کتاب...'],
    };
    previewPairs.push({
      firstPageNum: p1.pageNumber,
      secondPageNum: p2.pageNumber,
      idx: i,
    });
  }

  const totalSpreads = 1 + previewPairs.length;

  const triggerSpreadChange = (targetIdx: number) => {
    if (
      turnState !== null ||
      targetIdx < 0 ||
      targetIdx >= totalSpreads ||
      targetIdx === spreadIndex
    ) {
      return;
    }

    const direction: 'next' | 'prev' = targetIdx > spreadIndex ? 'next' : 'prev';
    setTurnState({
      fromIdx: spreadIndex,
      toIdx: targetIdx,
      direction,
    });

    setTimeout(() => {
      setSpreadIndex(targetIdx);
      setTurnState(null);
    }, 820);
  };

  const activeVisibleSpread = turnState ? turnState.toIdx : spreadIndex;

  // Calculate proportional paper stack thickness for natural book feel
  const currentFirstPage =
    activeVisibleSpread === 0
      ? 1
      : previewPairs[activeVisibleSpread - 1]?.firstPageNum || profile.previewStartPage;
  const currentSecondPage =
    activeVisibleSpread === 0
      ? 2
      : previewPairs[activeVisibleSpread - 1]?.secondPageNum || profile.previewStartPage + 1;

  const pagesBeforeRatio = Math.max(0.06, Math.min(0.92, currentFirstPage / totalPages));
  const pagesAfterRatio = Math.max(
    0.06,
    Math.min(0.92, (totalPages - currentSecondPage) / totalPages)
  );

  const stackBeforePx = Math.max(5, Math.round(pagesBeforeRatio * 22));
  const stackAfterPx = Math.max(5, Math.round(pagesAfterRatio * 22));

  // Helper to render the exact content of either the 'first' or 'second' page of any spread index
  const renderPageLogicalSide = (targetSpread: number, side: 'first' | 'second') => {
    if (side === 'first') {
      if (targetSpread === 0) {
        return (
          <div
            className="p-6 sm:p-10 min-h-[430px] sm:min-h-[480px] h-full flex flex-col justify-between relative select-none"
            style={{ fontSize: `${fontSize}px` }}
            dir={isRtlBook ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between text-xs opacity-60 border-b border-current/10 pb-3 font-bold">
              <span>{isFa ? 'صفحه عنوان داخلی (فرم اول)' : 'Page de faux-titre & titre'}</span>
              <span>{isFa ? 'صفحه ۱' : 'Page 1'}</span>
            </div>

            <div className="my-auto text-center space-y-4 py-6 px-3">
              <div className="w-12 h-12 mx-auto rounded-full border border-amber-700/40 flex items-center justify-center text-amber-700 dark:text-amber-400 text-lg">
                ✦
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-800 dark:text-amber-400">
                {isFa ? 'دکتر حسن مکارمی' : 'Dr. Hassan Makaremi'}
              </p>
              <h3 className="text-xl sm:text-2xl font-black leading-snug">{title}</h3>
              {subtitle && (
                <p className="text-xs sm:text-sm opacity-80 max-w-md mx-auto leading-relaxed">
                  {subtitle}
                </p>
              )}
              <div className="w-20 h-px bg-amber-700/30 mx-auto my-3" />
              <p className="text-xs italic opacity-80 max-w-md mx-auto leading-relaxed">
                «{profile.dedicationText[locale]}»
              </p>
            </div>

            <div className="border-t border-current/10 pt-3 flex items-center justify-between text-xs opacity-75">
              <span className="font-bold">
                {publisherName || (isFa ? 'انتشارات آلیان • پاریس' : 'Éditions Alian • Paris')}
              </span>
              <span>{book?.publication_year || 2018}</span>
            </div>
          </div>
        );
      }

      const pageData =
        profile.previewPages[(targetSpread - 1) * 2] || profile.previewPages[0];
      return (
        <div
          className="p-6 sm:p-10 min-h-[430px] sm:min-h-[480px] h-full flex flex-col justify-between relative select-none"
          style={{ fontSize: `${fontSize}px` }}
          dir={isRtlBook ? 'rtl' : 'ltr'}
        >
          <div className="flex items-center justify-between text-xs opacity-65 border-b border-current/10 pb-3">
            <span className="font-bold truncate max-w-[75%]">{pageData.chapterTitle}</span>
            <span className="font-bold">
              {isFa ? `صفحه ${pageData.pageNumber}` : `Page ${pageData.pageNumber}`}
            </span>
          </div>

          <div className="my-auto py-4 space-y-4 leading-loose">
            <h4 className="text-base sm:text-lg font-black text-amber-900 dark:text-amber-400">
              {pageData.heading}
            </h4>
            {pageData.bodyParagraphs.map((para, i) => (
              <p key={i} className="text-justify leading-relaxed">
                {para}
              </p>
            ))}
            {pageData.calligraphyQuote && (
              <blockquote className="my-3 p-3.5 rounded-xl bg-amber-500/10 border-s-4 border-amber-700 text-xs sm:text-sm font-bold italic text-center">
                {pageData.calligraphyQuote}
              </blockquote>
            )}
          </div>

          <div className="border-t border-current/10 pt-3 flex items-center justify-between text-[11px] opacity-65">
            <span>{pageData.footnote || title}</span>
            <span>
              {pageData.pageNumber} / {totalPages}
            </span>
          </div>
        </div>
      );
    }

    // side === 'second'
    if (targetSpread === 0) {
      return (
        <div
          className="p-6 sm:p-10 min-h-[430px] sm:min-h-[480px] h-full flex flex-col justify-between relative select-none"
          style={{ fontSize: `${fontSize}px` }}
          dir={isRtlBook ? 'rtl' : 'ltr'}
        >
          <div className="flex items-center justify-between text-xs opacity-60 border-b border-current/10 pb-3 font-bold">
            <span>{isFa ? 'شناسنامه نشر و فهرست گزیده' : 'Mentions d’édition & Sommaire'}</span>
            <span>{isFa ? 'صفحه ۲' : 'Page 2'}</span>
          </div>

          <div className="my-auto py-4 space-y-5 text-xs sm:text-sm leading-relaxed">
            <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 space-y-1.5 text-xs">
              <p className="font-bold">{profile.colophonText[locale]}</p>
              <p className="opacity-75">
                {profile.trimSizeLabel[locale]} • {profile.paperLabel[locale]} • {totalPages}{' '}
                {isFa ? 'صفحه' : 'pages'}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-sm border-b border-current/10 pb-1.5">
                {isFa ? 'گزیده سرفصل‌های کتاب:' : 'Sommaire principal :'}
              </h4>
              <div className="text-xs leading-loose opacity-90">
                {renderSafeMarkdown(
                  tableOfContents ||
                    '1. پیش‌گفتار مؤلف\n2. مبانی نظری و دگرشنیدن\n3. تحلیل موردی و کاربردی\n4. نتیجه‌گیری و افق‌های نو'
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-current/10 pt-3 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => triggerSpreadChange(1)}
              className="text-amber-800 dark:text-amber-400 font-bold hover:underline cursor-pointer"
            >
              {isFa
                ? `ورق بزنید: انتقال به صفحه ${profile.previewStartPage} (بخش انتخابی مدیر) ←`
                : `Tourner la page : Extrait p. ${profile.previewStartPage} →`}
            </button>
            <span className="opacity-65">2 / {totalPages}</span>
          </div>
        </div>
      );
    }

    const firstPage =
      profile.previewPages[(targetSpread - 1) * 2] || profile.previewPages[0];
    const secondPage = profile.previewPages[(targetSpread - 1) * 2 + 1];
    const pNum = secondPage ? secondPage.pageNumber : firstPage.pageNumber + 1;

    return (
      <div
        className="p-6 sm:p-10 min-h-[430px] sm:min-h-[480px] h-full flex flex-col justify-between relative select-none"
        style={{ fontSize: `${fontSize}px` }}
        dir={isRtlBook ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center justify-between text-xs opacity-65 border-b border-current/10 pb-3">
          <span className="font-bold truncate max-w-[75%]">
            {secondPage?.chapterTitle || firstPage.chapterTitle}
          </span>
          <span className="font-bold">{isFa ? `صفحه ${pNum}` : `Page ${pNum}`}</span>
        </div>

        <div className="my-auto py-4 space-y-4 leading-loose">
          {secondPage ? (
            <>
              <h4 className="text-base sm:text-lg font-black text-amber-900 dark:text-amber-400">
                {secondPage.heading}
              </h4>
              {secondPage.bodyParagraphs.map((para, i) => (
                <p key={i} className="text-justify leading-relaxed">
                  {para}
                </p>
              ))}
            </>
          ) : (
            <div className="space-y-3">{renderSafeMarkdown(sampleChapter || '')}</div>
          )}
        </div>

        <div className="border-t border-current/10 pt-3 flex items-center justify-between text-[11px] opacity-65">
          <span>{secondPage?.footnote || title}</span>
          <span>
            {pNum} / {totalPages}
          </span>
        </div>
      </div>
    );
  };

  // Map logical pages ('first' and 'second') to physical Left Half and Right Half of the open spread:
  // In Persian RTL books, the 'first' page of a spread sits on the RIGHT half, and the 'second' page sits on the LEFT half.
  // In French/English LTR books, the 'first' page sits on the LEFT half, and the 'second' page sits on the RIGHT half.
  const renderPhysicalLeftHalf = (idx: number) =>
    isRtlBook ? renderPageLogicalSide(idx, 'second') : renderPageLogicalSide(idx, 'first');

  const renderPhysicalRightHalf = (idx: number) =>
    isRtlBook ? renderPageLogicalSide(idx, 'first') : renderPageLogicalSide(idx, 'second');

  // Determine 3D leaf sweep geometry when turnState is active:
  // sweepsRightToLeft = true when the right-hand leaf lifts and turns to the left (RTL 'prev' OR LTR 'next')
  // sweepsRightToLeft = false when the left-hand leaf lifts and turns to the right (RTL 'next' OR LTR 'prev')
  const sweepsRightToLeft = turnState
    ? (isRtlBook && turnState.direction === 'prev') ||
      (!isRtlBook && turnState.direction === 'next')
    : false;

  const baseLeftSpreadIdx = turnState
    ? sweepsRightToLeft
      ? turnState.fromIdx
      : turnState.toIdx
    : spreadIndex;

  const baseRightSpreadIdx = turnState
    ? sweepsRightToLeft
      ? turnState.toIdx
      : turnState.fromIdx
    : spreadIndex;

  return (
    <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-card)] overflow-hidden shadow-md transition-colors">
      {/* Calm Sanctuary Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[var(--surface-sunken)] border-b border-[var(--border-subtle)]">
        {/* Mode Switchers */}
        <div className="flex flex-wrap items-center gap-1 bg-[var(--surface-card)] p-1 rounded-xl border border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setActiveTab('flipbook')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'flipbook'
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <BookOpen size={14} />
            <span>
              {isFa
                ? 'کتاب‌خوان ورق‌خور سه‌بعدی'
                : isFr
                ? 'Lecteur 3D Interactif'
                : '3D Page-Flip Reader'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sample')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'sample'
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <FileText size={14} />
            <span>{isFa ? 'نمای متنی پیوسته' : isFr ? 'Texte Continu' : 'Continuous Text'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('toc')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'toc'
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <List size={14} />
            <span>{isFa ? 'فهرست مطالب' : isFr ? 'Table des matières' : 'Table of Contents'}</span>
          </button>
        </div>

        {/* Sanctuary Paper Theme & Font Controls */}
        <div className="flex items-center gap-2">
          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 text-[11px] font-bold">
            <Sparkles size={12} />
            <span>
              {isFa
                ? `صفحه ۱ (عنوان) + صفحات برگزیده (${profile.previewStartPage} تا ${profile.previewEndPage})`
                : `Page 1 (Titre) + Extrait (p. ${profile.previewStartPage}–${profile.previewEndPage})`}
            </span>
          </span>

          <div className="flex items-center gap-1 border border-[var(--border-subtle)] bg-[var(--surface-card)] rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setTheme('paper')}
              aria-label="تم کاغذی"
              title="کاغذ نخودی گرم"
              className={`p-1.5 rounded-md cursor-pointer ${
                theme === 'paper'
                  ? 'bg-[#FBF9F4] text-stone-900 shadow-sm'
                  : 'text-[var(--foreground-muted)]'
              }`}
            >
              <Sun size={14} />
            </button>
            <button
              type="button"
              onClick={() => setTheme('sepia')}
              aria-label="تم سپیا"
              title="سپیا کلاسیک"
              className={`p-1.5 rounded-md cursor-pointer ${
                theme === 'sepia'
                  ? 'bg-[#F3E9D2] text-[#3B2E1E] shadow-sm'
                  : 'text-[var(--foreground-muted)]'
              }`}
            >
              <Coffee size={14} />
            </button>
            <button
              type="button"
              onClick={() => setTheme('night')}
              aria-label="تم تاریک"
              title="مطالعه شبانه"
              className={`p-1.5 rounded-md cursor-pointer ${
                theme === 'night'
                  ? 'bg-[#17181C] text-white shadow-sm'
                  : 'text-[var(--foreground-muted)]'
              }`}
            >
              <Moon size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1 border border-[var(--border-subtle)] bg-[var(--surface-card)] rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.max(13, s - 1))}
              aria-label="کاهش سایز فونت"
              className="p-1.5 text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-pointer"
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-[11px] font-bold px-1 text-[var(--foreground)]">
              {fontSize}
            </span>
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.min(22, s + 1))}
              aria-label="افزایش سایز فونت"
              className="p-1.5 text-[var(--foreground-muted)] hover:text-[var(--foreground)] cursor-pointer"
            >
              <ZoomIn size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: 3D CULTURAL SANCTUARY PAGE-TURNING FLIPBOOK */}
      {activeTab === 'flipbook' && (
        <div className="p-4 sm:p-8 bg-stone-100/70 dark:bg-stone-900/50 space-y-6">
          {/* Quick Spread Selector Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => triggerSpreadChange(0)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeVisibleSpread === 0
                    ? 'bg-amber-700 text-white shadow-sm'
                    : 'bg-[var(--surface-card)] text-[var(--foreground-muted)] border border-[var(--border-subtle)] hover:text-[var(--foreground)]'
                }`}
              >
                {isFa ? '۱. صفحه عنوان و شناسنامه (ص ۱ و ۲)' : '1. Page de titre & Colophon (p. 1–2)'}
              </button>

              {previewPairs.map((pair, idx) => (
                <button
                  key={pair.firstPageNum}
                  type="button"
                  onClick={() => triggerSpreadChange(idx + 1)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeVisibleSpread === idx + 1
                      ? 'bg-amber-700 text-white shadow-sm'
                      : 'bg-[var(--surface-card)] text-[var(--foreground-muted)] border border-[var(--border-subtle)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {isFa
                    ? `برگ برگزیده (ص ${pair.firstPageNum} و ${pair.secondPageNum})`
                    : `Extrait (p. ${pair.firstPageNum}–${pair.secondPageNum})`}
                </button>
              ))}
            </div>

            <div className="text-xs font-bold text-[var(--foreground-muted)]">
              {isRtlBook
                ? isFa
                  ? 'جهت تورق سه‌بعدی: راست‌به‌چپ (فارسی)'
                  : 'Sens de lecture : Droite à Gauche (RTL)'
                : isFa
                ? 'جهت تورق سه‌بعدی: چپ‌به‌راست (فرانسوی/لاتین)'
                : 'Sens de lecture : Gauche à Droite (LTR)'}
            </div>
          </div>

          {/* Open Two-Page Book Spread Container with 3D Page-Turning Leaf */}
          <div className="relative max-w-5xl mx-auto" style={{ perspective: '2400px' }}>
            {/* Outer Hardcover Binding Frame & Proportional Paper Stack */}
            <div
              className="relative rounded-2xl p-2 sm:p-3.5 shadow-2xl transition-all duration-500"
              style={{
                backgroundColor: profile.coverPalette.spineBg,
                border: `1px solid ${profile.coverPalette.borderFrame}`,
              }}
            >
              {/* Physical Left & Right Book Halves (Explicitly dir="ltr" grid so Column 1 = Physical Left Half, Column 2 = Physical Right Half) */}
              <div
                dir="ltr"
                className={`relative grid grid-cols-1 md:grid-cols-2 rounded-xl border ${themeClasses[theme]}`}
                style={{
                  transformStyle: 'preserve-3d',
                  boxShadow: isRtlBook
                    ? `${stackBeforePx}px 0 0 #E5DEC9, -${stackAfterPx}px 0 0 #DCD4BC, 0 18px 40px rgba(0,0,0,0.25)`
                    : `-${stackBeforePx}px 0 0 #E5DEC9, ${stackAfterPx}px 0 0 #DCD4BC, 0 18px 40px rgba(0,0,0,0.25)`,
                }}
              >
                {/* Center Spine Gutter Crease Shadow (Desktop & Tablet) */}
                <div
                  className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-12 pointer-events-none z-30"
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.14) 46%, rgba(0,0,0,0.24) 50%, rgba(0,0,0,0.14) 54%, rgba(0,0,0,0.0) 100%)',
                  }}
                />

                {/* Ambient Shadow Sweep Overlay during Page Turn */}
                {turnState && (
                  <div
                    className="absolute inset-0 pointer-events-none z-20 rounded-xl bg-black/25 book-leaf-shadow-pulse"
                  />
                )}

                {/* PHYSICAL LEFT HALF OF OPEN BOOK */}
                <div
                  onClick={() => {
                    // Clicking physical left page turns to NEXT spread in RTL, or PREV spread in LTR
                    if (isRtlBook) {
                      triggerSpreadChange(spreadIndex + 1);
                    } else {
                      triggerSpreadChange(spreadIndex - 1);
                    }
                  }}
                  title={
                    isRtlBook
                      ? isFa
                        ? 'کلیک برای ورق زدن به برگ بعدی'
                        : 'Tourner la page'
                      : isFa
                      ? 'کلیک برای برگ قبلی'
                      : 'Page précédente'
                  }
                  className="relative border-b md:border-b-0 md:border-r border-current/10 cursor-pointer"
                >
                  {renderPhysicalLeftHalf(baseLeftSpreadIdx)}
                </div>

                {/* PHYSICAL RIGHT HALF OF OPEN BOOK */}
                <div
                  onClick={() => {
                    // Clicking physical right page turns to PREV spread in RTL, or NEXT spread in LTR
                    if (isRtlBook) {
                      triggerSpreadChange(spreadIndex - 1);
                    } else {
                      triggerSpreadChange(spreadIndex + 1);
                    }
                  }}
                  title={
                    isRtlBook
                      ? isFa
                        ? 'کلیک برای برگ قبلی'
                        : 'Page précédente'
                      : isFa
                      ? 'کلیک برای ورق زدن به برگ بعدی'
                      : 'Tourner la page'
                  }
                  className="relative cursor-pointer"
                >
                  {renderPhysicalRightHalf(baseRightSpreadIdx)}
                </div>

                {/* =====================================================================
                    REAL 3D HINGED TURNING SHEET (Lifts from 0° and arcs 180° across spine)
                   ===================================================================== */}
                {turnState && (
                  <div
                    key={`${turnState.fromIdx}-${turnState.toIdx}-${turnState.direction}`}
                    className={`hidden md:block absolute top-0 bottom-0 w-1/2 z-40 pointer-events-none ${
                      sweepsRightToLeft
                        ? 'right-0 book-leaf-turn-rtl-sweep'
                        : 'left-0 book-leaf-turn-ltr-sweep'
                    }`}
                    style={{
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {/* FRONT FACE OF TURNING SHEET (Page lifting up from fromIdx) */}
                    <div
                      className={`absolute inset-0 overflow-hidden ${themeClasses[theme]} shadow-2xl`}
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        borderRadius: sweepsRightToLeft ? '0 12px 12px 0' : '12px 0 0 12px',
                        boxShadow: '0 16px 38px rgba(0,0,0,0.28)',
                      }}
                    >
                      {/* Subtle paper curl lighting gradient */}
                      <div
                        className="absolute inset-0 pointer-events-none z-10"
                        style={{
                          background: sweepsRightToLeft
                            ? 'linear-gradient(90deg, rgba(0,0,0,0.12) 0%, rgba(255,255,255,0.15) 30%, rgba(0,0,0,0.06) 100%)'
                            : 'linear-gradient(270deg, rgba(0,0,0,0.12) 0%, rgba(255,255,255,0.15) 30%, rgba(0,0,0,0.06) 100%)',
                        }}
                      />
                      {sweepsRightToLeft
                        ? renderPhysicalRightHalf(turnState.fromIdx)
                        : renderPhysicalLeftHalf(turnState.fromIdx)}
                    </div>

                    {/* BACK FACE OF TURNING SHEET (Reverse side carrying toIdx page onto opposite stack) */}
                    <div
                      className={`absolute inset-0 overflow-hidden ${themeClasses[theme]} shadow-2xl`}
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        borderRadius: sweepsRightToLeft ? '12px 0 0 12px' : '0 12px 12px 0',
                        boxShadow: '0 16px 38px rgba(0,0,0,0.28)',
                      }}
                    >
                      <div
                        className="absolute inset-0 pointer-events-none z-10"
                        style={{
                          background: sweepsRightToLeft
                            ? 'linear-gradient(270deg, rgba(0,0,0,0.14) 0%, rgba(255,255,255,0.12) 35%, rgba(0,0,0,0.04) 100%)'
                            : 'linear-gradient(90deg, rgba(0,0,0,0.14) 0%, rgba(255,255,255,0.12) 35%, rgba(0,0,0,0.04) 100%)',
                        }}
                      />
                      {sweepsRightToLeft
                        ? renderPhysicalLeftHalf(turnState.toIdx)
                        : renderPhysicalRightHalf(turnState.toIdx)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Calm Page-Turn Navigation Footer + Proportional Paper Stack Indicator */}
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              type="button"
              disabled={spreadIndex === 0 || turnState !== null}
              onClick={() => triggerSpreadChange(spreadIndex - 1)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--foreground)] disabled:opacity-40 hover:border-amber-600/60 transition-all cursor-pointer disabled:cursor-not-allowed shadow-sm"
            >
              {isFa ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
              <span>{isFa ? 'ورق زدن به برگ قبلی' : 'Page précédente'}</span>
            </button>

            {/* Subtle Proportional Paper Stack Bar */}
            <div className="flex items-center gap-3 text-xs font-bold text-[var(--foreground-muted)] text-center">
              <span>
                {activeVisibleSpread === 0
                  ? isFa
                    ? 'گشایش کتاب روی صفحه ۱ (عنوان داخلی) و صفحه ۲ (شناسنامه)'
                    : 'Ouverture sur la Page 1 (Titre) et Page 2 (Colophon)'
                  : isFa
                  ? `مطالعه صفحات ${currentFirstPage} و ${currentSecondPage} از ${totalPages} صفحه (قطر پشته قبل: ${stackBeforePx}px | بعد: ${stackAfterPx}px)`
                  : `Pages ${currentFirstPage}–${currentSecondPage} sur ${totalPages}`}
              </span>
            </div>

            <button
              type="button"
              disabled={spreadIndex >= totalSpreads - 1 || turnState !== null}
              onClick={() => triggerSpreadChange(spreadIndex + 1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-700 text-white disabled:opacity-40 hover:bg-amber-800 transition-all cursor-pointer disabled:cursor-not-allowed shadow-sm"
            >
              <span>{isFa ? 'ورق زدن به برگ بعدی' : 'Tourner la page'}</span>
              {isFa ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2 & 3: CONTINUOUS TEXT OR TABLE OF CONTENTS */}
      {activeTab !== 'flipbook' && (
        <div
          className={`p-6 sm:p-10 transition-colors duration-200 overflow-y-auto max-h-[520px] leading-loose ${themeClasses[theme]}`}
          style={{ fontSize: `${fontSize}px` }}
        >
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="border-b border-current/15 pb-4 mb-6">
              <h3 className="text-xl font-black">{title}</h3>
              <span className="text-xs opacity-70">
                {activeTab === 'sample'
                  ? isFa
                    ? 'پیش‌نمایش متن و فصل نمونه'
                    : 'Extrait du chapitre'
                  : isFa
                  ? 'فهرست سرفصل‌ها'
                  : 'Table des matières'}
              </span>
            </div>

            {renderSafeMarkdown(
              activeTab === 'sample'
                ? sampleChapter || 'فصل نمونه در حال حاضر موجود نیست.'
                : tableOfContents || 'فهرست مطالب در دست تکمیل است.'
            )}
          </div>
        </div>
      )}
    </div>
  );
}
