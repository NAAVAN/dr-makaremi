'use client';

import React from 'react';
import { BookOpen, Image as ImageIcon, FileText, Upload, CheckCircle2, Trash2, Layers } from 'lucide-react';
import { VoiceRecorderWidget, type RecordedAudioAsset } from './VoiceRecorderWidget';

export interface Book3DAssetsSpec {
  frontCoverDataUrl?: string;
  frontCoverFileName?: string;
  backCoverDataUrl?: string;
  backCoverFileName?: string;
  spineImageDataUrl?: string;
  spineImageFileName?: string;
  pageCount?: string;
  samplePagesFileDataUrl?: string;
  samplePagesFileName?: string;
  samplePagesRangeNote?: string;
  allowFullPdfDownload?: boolean;
  showIn3DShowcase?: boolean;
  authorIntroAudio?: RecordedAudioAsset | null;
}

interface BookMediaAssetsUploaderProps {
  bookId: string;
  bookTitle: string;
  existingCoverUrl?: string;
  existingPdfs?: { title: string; url: string }[];
  spec: Book3DAssetsSpec;
  onChange: (updated: Book3DAssetsSpec) => void;
  onTranscriptAppended?: (text: string) => void;
}

export function BookMediaAssetsUploader({
  bookId,
  bookTitle,
  existingCoverUrl,
  existingPdfs = [],
  spec,
  onChange,
  onTranscriptAppended,
}: BookMediaAssetsUploaderProps) {
  const handleFileRead = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldPrefix: 'frontCover' | 'backCover' | 'spineImage' | 'samplePagesFile'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (fieldPrefix === 'frontCover') {
        onChange({ ...spec, frontCoverDataUrl: dataUrl, frontCoverFileName: file.name });
      } else if (fieldPrefix === 'backCover') {
        onChange({ ...spec, backCoverDataUrl: dataUrl, backCoverFileName: file.name });
      } else if (fieldPrefix === 'spineImage') {
        onChange({ ...spec, spineImageDataUrl: dataUrl, spineImageFileName: file.name });
      } else if (fieldPrefix === 'samplePagesFile') {
        onChange({ ...spec, samplePagesFileDataUrl: dataUrl, samplePagesFileName: file.name });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mt-4 rounded-2xl border-2 border-amber-200/90 bg-gradient-to-br from-amber-50/60 via-white to-stone-50 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200/70 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-700 text-white flex items-center justify-center shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-900">
              📦 پرونده ساخت کتاب سه‌بعدی، صفحات برگزیده ورق‌زن و صدای استاد
            </h4>
            <p className="text-xs text-slate-600">
              تصاویر روی جلد، پشت جلد، عطف کتاب، فایل صفحات برگزیده برای تورق در سایت و معرفی صوتی با صدای استاد
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs font-bold text-amber-950 bg-amber-100/90 border border-amber-300 px-3 py-1.5 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={spec.showIn3DShowcase ?? true}
              onChange={(e) => onChange({ ...spec, showIn3DShowcase: e.target.checked })}
              className="w-4 h-4 accent-amber-700 rounded"
            />
            <span>نمایش در ویترین کتاب‌های سه‌بعدی (3D Showcase)</span>
          </label>

          <label className="inline-flex items-center gap-2 text-xs font-bold text-teal-950 bg-teal-50 border border-teal-300 px-3 py-1.5 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={spec.allowFullPdfDownload ?? (existingPdfs.length > 0)}
              onChange={(e) => onChange({ ...spec, allowFullPdfDownload: e.target.checked })}
              className="w-4 h-4 accent-teal-700 rounded"
            />
            <span>اجازه دانلود مستقیم PDF کامل کتاب به مخاطبان</span>
          </label>
        </div>
      </div>

      {/* 4 Visual Asset Slots: Front Cover, Back Cover, Spine, Sample Pages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {/* 1. Front Cover */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-600" />
                ۱. تصویر روی جلد (Front)
              </span>
              {(spec.frontCoverDataUrl || existingCoverUrl) && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              )}
            </div>
            {spec.frontCoverDataUrl ? (
              <div className="relative mb-2">
                <img
                  src={spec.frontCoverDataUrl}
                  alt="روی جلد جدید"
                  className="h-28 w-full object-contain rounded-lg bg-slate-50 border border-emerald-200"
                />
                <div className="mt-1 flex items-center justify-between text-[11px] text-emerald-700 font-semibold">
                  <span className="truncate max-w-[140px]">{spec.frontCoverFileName}</span>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({ ...spec, frontCoverDataUrl: undefined, frontCoverFileName: undefined })
                    }
                    className="text-red-600 hover:underline flex items-center gap-0.5"
                  >
                    <Trash2 className="w-3 h-3" /> حذف
                  </button>
                </div>
              </div>
            ) : existingCoverUrl ? (
              <div className="mb-2">
                <img
                  src={existingCoverUrl}
                  alt={bookTitle}
                  className="h-28 w-full object-contain rounded-lg bg-slate-50 border border-slate-200"
                />
                <p className="text-[11px] text-slate-500 mt-1 text-center">
                  جلد فعلی موجود در سایت قدیم
                </p>
              </div>
            ) : (
              <div className="h-28 rounded-lg bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400 mb-2">
                بدون تصویر روی جلد
              </div>
            )}
          </div>
          <label className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-amber-100 text-slate-800 border border-slate-300 cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-amber-700" />
            <span>{existingCoverUrl || spec.frontCoverDataUrl ? 'جایگزینی تصویر روی جلد' : 'بارگذاری تصویر روی جلد'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileRead(e, 'frontCover')}
              className="hidden"
            />
          </label>
        </div>

        {/* 2. Back Cover */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-600" />
                ۲. تصویر پشت جلد (Back)
              </span>
              {spec.backCoverDataUrl && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </div>
            {spec.backCoverDataUrl ? (
              <div className="mb-2">
                <img
                  src={spec.backCoverDataUrl}
                  alt="پشت جلد"
                  className="h-28 w-full object-contain rounded-lg bg-slate-50 border border-emerald-200"
                />
                <div className="mt-1 flex items-center justify-between text-[11px] text-emerald-700 font-semibold">
                  <span className="truncate max-w-[140px]">{spec.backCoverFileName}</span>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({ ...spec, backCoverDataUrl: undefined, backCoverFileName: undefined })
                    }
                    className="text-red-600 hover:underline flex items-center gap-0.5"
                  >
                    <Trash2 className="w-3 h-3" /> حذف
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-28 rounded-lg bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-2 text-[11px] text-slate-500 mb-2">
                <span>تصویر پشت جلد برای چرخش ۳۶۰ درجه کتاب سه‌بعدی</span>
              </div>
            )}
          </div>
          <label className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-amber-100 text-slate-800 border border-slate-300 cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-amber-700" />
            <span>بارگذاری تصویر پشت جلد</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileRead(e, 'backCover')}
              className="hidden"
            />
          </label>
        </div>

        {/* 3. Spine Image & Page Count */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-600" />
                ۳. تصویر عطف و تعداد صفحات
              </span>
              {spec.spineImageDataUrl && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </div>
            {spec.spineImageDataUrl ? (
              <div className="mb-2">
                <img
                  src={spec.spineImageDataUrl}
                  alt="عطف کتاب"
                  className="h-20 w-full object-contain rounded-lg bg-slate-50 border border-emerald-200"
                />
                <div className="mt-1 flex items-center justify-between text-[11px] text-emerald-700 font-semibold">
                  <span className="truncate max-w-[140px]">{spec.spineImageFileName}</span>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({ ...spec, spineImageDataUrl: undefined, spineImageFileName: undefined })
                    }
                    className="text-red-600 hover:underline flex items-center gap-0.5"
                  >
                    <Trash2 className="w-3 h-3" /> حذف
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-20 rounded-lg bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center text-center p-2 text-[11px] text-slate-500 mb-2">
                <span>تصویر عطف کتاب (در صورت نبود، خودکار ساخته می‌شود)</span>
              </div>
            )}
            <input
              type="text"
              value={spec.pageCount || ''}
              onChange={(e) => onChange({ ...spec, pageCount: e.target.value })}
              placeholder="تعداد صفحات (مثلاً ۱۹۶ صفحه)"
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-800 mb-2 focus:border-amber-600 focus:outline-none"
            />
          </div>
          <label className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-amber-100 text-slate-800 border border-slate-300 cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-amber-700" />
            <span>بارگذاری تصویر عطف (Spine)</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileRead(e, 'spineImage')}
              className="hidden"
            />
          </label>
        </div>

        {/* 4. Selected Sample Pages for 3D Flipbook Reader */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-600" />
                ۴. فایل صفحات برگزیده (تورق)
              </span>
              {(spec.samplePagesFileDataUrl || existingPdfs.length > 0) && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              )}
            </div>

            {spec.samplePagesFileName ? (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 mb-2 text-xs text-emerald-900">
                <div className="font-bold truncate">{spec.samplePagesFileName}</div>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...spec,
                      samplePagesFileDataUrl: undefined,
                      samplePagesFileName: undefined,
                    })
                  }
                  className="text-[11px] text-red-600 hover:underline mt-1 inline-flex items-center gap-0.5"
                >
                  <Trash2 className="w-3 h-3" /> حذف فایل
                </button>
              </div>
            ) : existingPdfs.length > 0 ? (
              <div className="rounded-lg bg-teal-50/70 border border-teal-200 p-2 mb-2 text-[11px] text-teal-900">
                <div className="font-bold mb-1">فایل PDF موجود در سایت قدیم:</div>
                {existingPdfs.map((p, i) => (
                  <a
                    key={i}
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-teal-700 underline truncate"
                  >
                    📄 {p.title}
                  </a>
                ))}
              </div>
            ) : (
              <div className="h-16 rounded-lg bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center text-center p-2 text-[11px] text-slate-500 mb-2">
                <span>PDF یا Word صفحات برگزیده جهت ورق زدن در سایت</span>
              </div>
            )}

            <input
              type="text"
              value={spec.samplePagesRangeNote || ''}
              onChange={(e) => onChange({ ...spec, samplePagesRangeNote: e.target.value })}
              placeholder="شماره صفحات برگزیده (مثلاً ص ۱ تا ۲۰ + فهرست)"
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-800 mb-2 focus:border-amber-600 focus:outline-none"
            />
          </div>

          <label className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-amber-100 text-slate-800 border border-slate-300 cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-amber-700" />
            <span>بارگذاری فایل صفحات برگزیده (PDF/Word)</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,image/*"
              onChange={(e) => handleFileRead(e, 'samplePagesFile')}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 5. Author's Voice Introduction for the Book */}
      <VoiceRecorderWidget
        itemId={`book-${bookId}`}
        itemTitle={bookTitle}
        mode="site_intro"
        existingAudio={spec.authorIntroAudio}
        onSaveAudio={(audio) => onChange({ ...spec, authorIntroAudio: audio })}
        onTranscriptAppended={onTranscriptAppended}
      />
    </div>
  );
}

