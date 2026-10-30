'use client';

import React, { useState } from 'react';
import {
  RotateCw,
  BookOpen,
  Play,
  Pause,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from 'lucide-react';
import { getBookStudioProfile } from '@/lib/legacy-heritage';
import type { Book, BookTranslation, Locale } from '@makaremi/shared';

interface Book3DShowcaseProps {
  book: Book;
  translation?: BookTranslation;
  locale: Locale;
}

type CameraPose = 'isometric' | 'front' | 'spine' | 'back';
type MotionMode = 'float' | 'turntable' | 'paused';

export function Book3DShowcase({ book, translation, locale }: Book3DShowcaseProps) {
  const profile = getBookStudioProfile(book.slug, book.page_count || 240, book.pillar);
  const isRtlBook = profile.direction === 'rtl';
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';

  const [pose, setPose] = useState<CameraPose>('isometric');
  const [coverOpen, setCoverOpen] = useState(false);
  const [motionMode, setMotionMode] = useState<MotionMode>('float');
  const [manualOffset, setManualOffset] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });
  const [hoverOffset, setHoverOffset] = useState<{ rx: number; ry: number } | null>(null);

  const title = translation?.title || book.slug;
  const subtitle = translation?.subtitle || '';
  const publisher =
    translation?.publisher_name || (isFa ? 'انتشارات آلیان، پاریس' : 'Éditions Alian, Paris');
  const pageCount = book.page_count || 240;

  // Authentic physical spine width in pixels (scaled from mm)
  const spinePx = Math.max(28, Math.min(54, Math.round(profile.spineWidthMm * 1.65)));
  const halfSpine = spinePx / 2;
  const paperBlockDepth = spinePx - 4;
  const halfPaperDepth = paperBlockDepth / 2;

  const getBasePoseRotation = (): { rx: number; ry: number } => {
    switch (pose) {
      case 'front':
        return { rx: 4, ry: isRtlBook ? -6 : 6 };
      case 'spine':
        return { rx: 6, ry: isRtlBook ? -76 : 76 };
      case 'back':
        return { rx: 4, ry: 180 };
      case 'isometric':
      default:
        return { rx: 11, ry: isRtlBook ? -28 : 28 };
    }
  };

  const baseRot = getBasePoseRotation();
  const finalRx = baseRot.rx + manualOffset.rx + (hoverOffset ? hoverOffset.rx : 0);
  const finalRy = baseRot.ry + manualOffset.ry + (hoverOffset ? hoverOffset.ry : 0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (pose === 'back' || motionMode === 'turntable') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setHoverOffset({
      rx: Math.max(-14, Math.min(14, -(y / rect.height) * 22)),
      ry: Math.max(-24, Math.min(24, (x / rect.width) * 34)),
    });
  };

  const handleMouseLeave = () => {
    setHoverOffset(null);
  };

  const selectPose = (nextPose: CameraPose) => {
    setManualOffset({ rx: 0, ry: 0 });
    setHoverOffset(null);
    if (nextPose === 'back') {
      setCoverOpen(false);
    }
    setPose(nextPose);
  };

  const nudgeRotation = (dRx: number, dRy: number) => {
    setManualOffset((prev) => ({
      rx: Math.max(-35, Math.min(35, prev.rx + dRx)),
      ry: prev.ry + dRy,
    }));
  };

  const motionClass =
    motionMode === 'turntable'
      ? 'book-3d-motion-turntable'
      : motionMode === 'float'
      ? 'book-3d-motion-float'
      : 'book-3d-motion-paused';

  // 22 dense solid paper block slices across the entire Z depth (-halfPaperDepth to +halfPaperDepth)
  // This guarantees a 100% solid volumetric paper block from every angle (bottom, top, side, or open cover) — never a hollow box!
  const sliceCount = 22;
  const solidPaperSlices = Array.from({ length: sliceCount }, (_, i) => {
    const t = i / (sliceCount - 1); // 0 to 1
    const zPos = -halfPaperDepth + t * paperBlockDepth;
    return { zPos, isEven: i % 2 === 0 };
  });

  return (
    <div className="flex flex-col items-center select-none py-3 space-y-5">
      {/* Subtle Top Museum Tag */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-stone-700 dark:text-stone-300">
        <span className="px-2.5 py-1 rounded-full bg-stone-200/80 dark:bg-stone-800/90 font-bold">
          {profile.genreLabel[locale]}
        </span>
        <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30 font-bold">
          {isRtlBook
            ? isFa
              ? 'صحافی فارسی (راست‌به‌چپ RTL)'
              : 'Reliure Persane (RTL)'
            : isFa
            ? 'صحافی لاتین (چپ‌به‌راست LTR)'
            : 'Reliure Française (LTR)'}
        </span>
        <span className="px-2.5 py-1 rounded-full bg-stone-200/80 dark:bg-stone-800/90 font-bold">
          {isFa ? `قطر عطف: ${profile.spineWidthMm} میلی‌متر` : `Dos : ${profile.spineWidthMm} mm`}
        </span>
      </div>

      {/* 3D Sanctuary Stage */}
      <div
        className="relative w-64 sm:w-72 h-96 sm:h-[405px] cursor-grab active:cursor-grabbing flex items-center justify-center"
        style={{ perspective: '1600px' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Dynamic Ambient Pedestal Shadow */}
        <div
          className="absolute -bottom-4 w-52 h-8 rounded-full bg-black/30 dark:bg-black/55 blur-xl pointer-events-none transition-transform duration-700"
          style={{
            transform: coverOpen ? 'scaleX(1.4)' : 'scaleX(1)',
            animation:
              motionMode !== 'paused' ? 'bookPedestalShadow 6.5s ease-in-out infinite' : 'none',
          }}
        />

        {/* OUTER 3D MOTION RIG (Runs continuous CSS @keyframes float or 360° turntable) */}
        <div className={`relative w-60 sm:w-64 h-80 sm:h-96 ${motionClass}`}>
          {/* INNER 3D POSE RIG */}
          <div
            className="relative w-full h-full transition-transform duration-700 ease-out"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateX(${finalRx}deg) rotateY(${finalRy}deg)`,
            }}
          >
            {/* 0. DENSE 22-LAYER SOLID PAPER BLOCK CORE (Completely fills the volume between Front & Back covers so it is NEVER hollow) */}
            {solidPaperSlices.map((slice, idx) => (
              <div
                key={idx}
                className="absolute inset-[3px] pointer-events-none"
                style={{
                  backgroundColor: slice.isEven ? '#FAF7F0' : '#F0EAD8',
                  border: '1px solid #E2DAC4',
                  transform: `translateZ(${slice.zPos.toFixed(1)}px)`,
                }}
              />
            ))}

            {/* 1. INTERIOR PAGE 1: FORMAL TITLE PAGE (Top surface of the solid paper block, revealed when Front Cover opens) */}
            <div
              className="absolute inset-[3px] p-5 flex flex-col justify-between text-center border border-stone-300 shadow-inner"
              dir={isRtlBook ? 'rtl' : 'ltr'}
              style={{
                backgroundColor: '#FCFBF7',
                color: '#1C1917',
                transform: `translateZ(${halfPaperDepth + 0.5}px)`,
              }}
            >
              <div className="border-b border-stone-300/80 pb-2 flex items-center justify-between text-[9px] text-stone-500 font-bold">
                <span>{isFa ? 'صفحه ۱ (صفحه عنوان داخلی)' : 'Page 1 (Page de titre)'}</span>
                <span>{book.publication_year}</span>
              </div>

              <div className="my-auto space-y-2.5 px-2">
                <div className="w-8 h-8 mx-auto rounded-full border border-amber-700/40 flex items-center justify-center text-amber-800 text-xs">
                  ✦
                </div>
                <p className="text-[10px] font-bold text-amber-900 tracking-wide">
                  {isFa ? 'دکتر حسن مکارمی' : 'Dr. Hassan Makaremi'}
                </p>
                <h3 className="text-sm sm:text-base font-black text-stone-900 leading-snug">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-[10px] text-stone-600 leading-relaxed line-clamp-2">
                    {subtitle}
                  </p>
                )}
                <div className="w-12 h-px bg-amber-700/40 mx-auto my-2" />
                <p className="text-[9px] text-stone-500 italic leading-relaxed line-clamp-2">
                  {profile.dedicationText[locale]}
                </p>
              </div>

              <div className="border-t border-stone-300/80 pt-2 text-[9px] text-stone-600 space-y-0.5">
                <p className="font-bold">{publisher}</p>
                <p className="text-[8px] opacity-75">
                  {isFa ? `صفحه ۱ از ${pageCount}` : `Page 1 / ${pageCount}`}
                </p>
              </div>
            </div>

            {/* 2. HINGED FRONT COVER (Swings open around Right Spine for RTL, Left Spine for LTR) */}
            <div
              className="absolute inset-0 rounded-sm shadow-2xl transition-transform duration-1000 ease-in-out"
              style={{
                transformStyle: 'preserve-3d',
                transformOrigin: isRtlBook ? 'right center' : 'left center',
                transform: `translateZ(${halfSpine}px) rotateY(${
                  coverOpen ? (isRtlBook ? 142 : -142) : 0
                }deg)`,
              }}
            >
              {/* Front Cover Outer Face */}
              <div
                className="absolute inset-0 rounded-sm p-6 flex flex-col justify-between text-white"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'translateZ(0.5px)',
                  background: `linear-gradient(145deg, ${profile.coverPalette.frontBg} 0%, ${profile.coverPalette.frontSecondary} 100%)`,
                  border: `1px solid ${profile.coverPalette.borderFrame}`,
                }}
              >
                {/* Gold Foil Inner Frame */}
                <div
                  className="absolute inset-3 pointer-events-none rounded-sm"
                  style={{ border: `1px solid ${profile.coverPalette.borderFrame}` }}
                />

                <div className="relative z-10 space-y-2.5" dir={isRtlBook ? 'rtl' : 'ltr'}>
                  <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider opacity-85">
                    <span style={{ color: profile.coverPalette.accentGold }}>
                      {profile.genreLabel[locale]}
                    </span>
                    <span>{book.publication_year}</span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-black leading-snug line-clamp-3 pt-1">
                    {title}
                  </h2>

                  {subtitle && (
                    <p className="text-[11px] opacity-85 leading-relaxed line-clamp-2">
                      {subtitle}
                    </p>
                  )}
                </div>

                {/* Center Calligraphic Medallion Emblem */}
                <div className="relative z-10 my-auto flex justify-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center border shadow-inner"
                    style={{
                      borderColor: profile.coverPalette.borderFrame,
                      background:
                        'radial-gradient(circle, rgba(212,175,55,0.22) 0%, transparent 70%)',
                    }}
                  >
                    <Sparkles size={22} style={{ color: profile.coverPalette.accentGold }} />
                  </div>
                </div>

                <div
                  className="relative z-10 border-t pt-3 space-y-1"
                  style={{ borderColor: profile.coverPalette.borderFrame }}
                  dir={isRtlBook ? 'rtl' : 'ltr'}
                >
                  <p
                    className="text-xs font-bold"
                    style={{ color: profile.coverPalette.accentGold }}
                  >
                    {isFa ? 'دکتر حسن مکارمی' : 'Dr. Hassan Makaremi'}
                  </p>
                  <p className="text-[10px] opacity-85 truncate">{publisher}</p>
                  <p className="text-[9px] opacity-65">{book.isbn_13}</p>
                </div>
              </div>

              {/* Front Cover Inner Surface (داخل جلد — کاملاً سفید و یکدست و بدون هیچ‌گونه نوشته) */}
              <div
                className="absolute inset-0 rounded-sm"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg) translateZ(0.5px)',
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #E7E2D5',
                  boxShadow: isRtlBook
                    ? 'inset 12px 0 18px -10px rgba(0,0,0,0.12)'
                    : 'inset -12px 0 18px -10px rgba(0,0,0,0.12)',
                }}
              />
            </div>

            {/* 3. SPINE (Center-origin at Z=0, spanning exact -halfSpine to +halfSpine) */}
            <div
              className="absolute top-0 bottom-0 flex items-center justify-center text-white shadow-inner"
              style={{
                width: `${spinePx}px`,
                transformOrigin: 'center center',
                ...(isRtlBook
                  ? {
                      right: `-${halfSpine}px`,
                      transform: 'rotateY(90deg)',
                    }
                  : {
                      left: `-${halfSpine}px`,
                      transform: 'rotateY(-90deg)',
                    }),
                backgroundColor: profile.coverPalette.spineBg,
                borderTop: `2px solid ${profile.coverPalette.accentGold}`,
                borderBottom: `2px solid ${profile.coverPalette.accentGold}`,
              }}
            >
              <span
                className="text-[10px] font-bold tracking-wider truncate px-2 whitespace-nowrap"
                style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  color: profile.coverPalette.accentGold,
                }}
              >
                {title} • {isFa ? 'دکتر حسن مکارمی' : 'Dr. H. Makaremi'}
              </span>
            </div>

            {/* 4. FORE-EDGE PAPER STACK (Center-origin at Z=0, opposite to Spine) */}
            <div
              className="absolute top-[3px] bottom-[3px]"
              style={{
                width: `${paperBlockDepth}px`,
                transformOrigin: 'center center',
                ...(isRtlBook
                  ? {
                      left: `${3 - halfPaperDepth}px`,
                      transform: 'rotateY(-90deg)',
                    }
                  : {
                      right: `${3 - halfPaperDepth}px`,
                      transform: 'rotateY(90deg)',
                    }),
                background:
                  'repeating-linear-gradient(90deg, #FBF9F4 0px, #FBF9F4 1.5px, #DFD6C0 1.5px, #DFD6C0 3px)',
                boxShadow: 'inset 0 0 8px rgba(0,0,0,0.15)',
                border: '1px solid #DCD3BD',
              }}
            />

            {/* 5A. TOP PAPER BLOCK EDGE (Center-origin at Z=0, flush with top of paper block) */}
            <div
              className="absolute left-[3px] right-[3px]"
              style={{
                height: `${paperBlockDepth}px`,
                top: `${3 - halfPaperDepth}px`,
                transformOrigin: 'center center',
                transform: 'rotateX(90deg)',
                background:
                  'repeating-linear-gradient(0deg, #FBF9F4 0px, #FBF9F4 1.5px, #DFD6C0 1.5px, #DFD6C0 3px)',
                boxShadow: 'inset 0 0 8px rgba(0,0,0,0.14)',
                border: '1px solid #DCD3BD',
              }}
            />

            {/* 5B. BOTTOM PAPER BLOCK EDGE (Center-origin at Z=0, flush with bottom of paper block — نمای زیر کتاب کاملاً بسته و توپُر) */}
            <div
              className="absolute left-[3px] right-[3px]"
              style={{
                height: `${paperBlockDepth}px`,
                bottom: `${3 - halfPaperDepth}px`,
                transformOrigin: 'center center',
                transform: 'rotateX(90deg)',
                background:
                  'repeating-linear-gradient(0deg, #F7F3E8 0px, #F7F3E8 1.5px, #D8CEB6 1.5px, #D8CEB6 3px)',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.18)',
                border: '1px solid #D5CBB2',
              }}
            />

            {/* 6. BACK COVER (With Pure Plain White Inner Surface facing the paper block) */}
            <div
              className="absolute inset-0 rounded-sm"
              style={{
                transformStyle: 'preserve-3d',
                transform: `translateZ(-${halfSpine}px)`,
              }}
            >
              {/* Back Cover Inner White Surface (کاملاً سفید و ساده) */}
              <div
                className="absolute inset-0 rounded-sm"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #E7E2D5',
                }}
              />

              {/* Back Cover Outer Face */}
              <div
                className="absolute inset-0 rounded-sm p-6 shadow-2xl flex flex-col justify-between text-white"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg) translateZ(0.5px)',
                  backgroundColor: profile.coverPalette.backBg,
                  border: `1px solid ${profile.coverPalette.borderFrame}`,
                }}
                dir={isRtlBook ? 'rtl' : 'ltr'}
              >
                <div className="space-y-3">
                  <span
                    className="text-[10px] tracking-wider uppercase font-bold block"
                    style={{ color: profile.coverPalette.accentGold }}
                  >
                    {isFa
                      ? 'درباره کتاب و چکیده اثر'
                      : isFr
                      ? 'Quatrième de couverture'
                      : 'Back Cover Synopsis'}
                  </span>
                  <p className="text-xs leading-relaxed opacity-90 line-clamp-8">
                    {translation?.synopsis || 'توضیحات اثر در دست تکمیل است.'}
                  </p>
                </div>

                <div
                  className="border-t pt-3 space-y-1.5 text-[10px] opacity-80"
                  style={{ borderColor: profile.coverPalette.borderFrame }}
                >
                  <div className="flex items-center justify-between">
                    <span>{profile.trimSizeLabel[locale]}</span>
                    <span>{pageCount} ص</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px]">
                    <span>{book.publication_year}</span>
                    <span>ISBN: {book.isbn_13}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive 3D Controls (Cover Open, Motion Mode, Camera Presets & Directional Nudge) */}
      <div className="w-full max-w-sm space-y-2.5 pt-1">
        {/* Row 1: Open Front Cover onto Page 1 + Flip to Back Cover */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              if (pose === 'back') setPose('isometric');
              setCoverOpen((prev) => !prev);
            }}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              coverOpen
                ? 'bg-amber-700 text-white border-amber-700 shadow-sm'
                : 'bg-[var(--surface-card)] text-[var(--foreground)] border-[var(--border-subtle)] hover:border-amber-600/60'
            }`}
          >
            <BookOpen size={14} />
            <span>
              {coverOpen
                ? isFa
                  ? 'بستن جلد کتاب'
                  : 'Fermer la couverture'
                : isFa
                ? 'باز کردن جلد (صفحه ۱)'
                : 'Ouvrir (Page 1)'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => selectPose(pose === 'back' ? 'isometric' : 'back')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              pose === 'back'
                ? 'bg-teal-800 text-white border-teal-800 shadow-sm'
                : 'bg-[var(--surface-card)] text-[var(--foreground)] border-[var(--border-subtle)] hover:border-teal-600/60'
            }`}
          >
            <RotateCw
              size={14}
              className={pose === 'back' ? 'rotate-180 transition-transform' : 'transition-transform'}
            />
            <span>
              {pose === 'back'
                ? isFa
                  ? 'نمای روی جلد'
                  : 'Voir la couverture'
                : isFa
                ? 'مشاهده پشت جلد'
                : 'Quatrième de couv.'}
            </span>
          </button>
        </div>

        {/* Row 2: Active 3D Animation Mode Selector (Float / 360° Turntable / Pause) */}
        <div className="flex items-center justify-between gap-1 p-1 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[11px]">
          <button
            type="button"
            onClick={() => setMotionMode('float')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${
              motionMode === 'float'
                ? 'bg-teal-800 text-white shadow-sm'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <Play size={12} />
            <span>{isFa ? 'شناور ۳بعدی' : 'Flottement 3D'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMotionMode('turntable')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${
              motionMode === 'turntable'
                ? 'bg-amber-700 text-white shadow-sm'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <RefreshCw size={12} className={motionMode === 'turntable' ? 'animate-spin' : ''} />
            <span>{isFa ? 'چرخش ۳۶۰°' : 'Rotation 360°'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMotionMode('paused')}
            className={`flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg font-bold transition-all cursor-pointer ${
              motionMode === 'paused'
                ? 'bg-stone-800 text-white shadow-sm'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <Pause size={12} />
            <span>{isFa ? 'توقف' : 'Pause'}</span>
          </button>
        </div>

        {/* Row 3: Camera Angle Presets & Directional 3D Rotation Buttons */}
        <div className="flex items-center justify-between gap-1 p-1 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[11px]">
          <button
            type="button"
            onClick={() => selectPose('isometric')}
            className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
              pose === 'isometric' && manualOffset.rx === 0 && manualOffset.ry === 0
                ? 'bg-[var(--surface-card)] text-[var(--foreground)] shadow-sm'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {isFa ? 'سه‌رخ' : '3D Iso'}
          </button>
          <button
            type="button"
            onClick={() => selectPose('front')}
            className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
              pose === 'front' && manualOffset.rx === 0 && manualOffset.ry === 0
                ? 'bg-[var(--surface-card)] text-[var(--foreground)] shadow-sm'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {isFa ? 'روبه‌رو' : 'Face'}
          </button>
          <button
            type="button"
            onClick={() => selectPose('spine')}
            className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
              pose === 'spine' && manualOffset.rx === 0 && manualOffset.ry === 0
                ? 'bg-[var(--surface-card)] text-[var(--foreground)] shadow-sm'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {isFa ? 'عطف' : 'Dos'}
          </button>

          <div className="h-4 w-px bg-[var(--border-subtle)] mx-0.5" />

          {/* Directional 3D Nudge Buttons */}
          <button
            type="button"
            onClick={() => nudgeRotation(0, -20)}
            title={isFa ? 'چرخش به چپ' : 'Tourner à gauche'}
            className="p-1.5 rounded-lg bg-[var(--surface-card)] text-[var(--foreground)] hover:bg-amber-500/15 transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} />
          </button>
          <button
            type="button"
            onClick={() => nudgeRotation(0, 20)}
            title={isFa ? 'چرخش به راست' : 'Tourner à droite'}
            className="p-1.5 rounded-lg bg-[var(--surface-card)] text-[var(--foreground)] hover:bg-amber-500/15 transition-colors cursor-pointer"
          >
            <ArrowRight size={13} />
          </button>
          <button
            type="button"
            onClick={() => nudgeRotation(10, 0)}
            title={isFa ? 'زاویه بالا' : 'Haut'}
            className="p-1.5 rounded-lg bg-[var(--surface-card)] text-[var(--foreground)] hover:bg-amber-500/15 transition-colors cursor-pointer"
          >
            <ArrowUp size={13} />
          </button>
          <button
            type="button"
            onClick={() => nudgeRotation(-10, 0)}
            title={isFa ? 'زاویه پایین' : 'Bas'}
            className="p-1.5 rounded-lg bg-[var(--surface-card)] text-[var(--foreground)] hover:bg-amber-500/15 transition-colors cursor-pointer"
          >
            <ArrowDown size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
