'use client';

import React, { useState } from 'react';
import { PlusCircle, X, Upload, CheckCircle2, Sparkles } from 'lucide-react';
import { VoiceRecorderWidget, type RecordedAudioAsset } from './VoiceRecorderWidget';
import { BookMediaAssetsUploader, type Book3DAssetsSpec } from './BookMediaAssetsUploader';

export type NewWorkType = 'book' | 'gallery' | 'exhibition' | 'poem' | 'video' | 'article';

export interface CustomAddedWork {
  id: string;
  workType: NewWorkType;
  titleFa: string;
  titleFr: string;
  year: string;
  category: string;
  publisherOrVenue: string;
  isbnOrDimensions: string;
  externalUrl: string;
  bodyText: string;
  editorialNote: string;
  primaryFileName?: string;
  primaryFileDataUrl?: string;
  book3DSpec?: Book3DAssetsSpec;
  authorSiteAudio?: RecordedAudioAsset | null;
  createdAt: string;
}

interface AddNewWorkModalProps {
  defaultType: NewWorkType;
  isOpen: boolean;
  onClose: () => void;
  onAddWork: (work: CustomAddedWork) => void;
}

const WORK_TYPE_LABELS: Record<NewWorkType, string> = {
  book: '📚 کتاب یا رساله جدید',
  gallery: '🎨 تابلوی نقاشی / خوشنویسی یا مجموعه‌گالری جدید',
  exhibition: '🏛️ نمایشگاه انفرادی یا گروهی جدید (پس از ۲۰۱۶)',
  poem: '📜 شعر یا کوتاه‌واره جدید (همراه با تابلو و دکلمه)',
  video: '🎬 ویدئو، سخنرانی یا مصاحبه تصویری جدید',
  article: '🖋️ مقاله علمی، جستار، کنفرانس مکتوب یا خبر جدید',
};

const CATEGORY_OPTIONS: Record<NewWorkType, string[]> = {
  book: ['روانکاوی', 'حافظ‌پژوهی و عرفان', 'پژوهش و فرهنگ', 'راهبردی و مدیریت', 'شعر و ادبیات', 'رمان و خاطرات', 'هنر و خوشنویسی'],
  gallery: ['خوشنویسی مدرن و نستعلیق', 'نقاشی آبستره (مجرد)', 'نقاشی فیگوراتیو', 'منطق‌الطیر و اسطوره', 'کار با حنا و مواد طبیعی', 'بشقاب‌ها و سرامیک', 'ترکیب دیجیتال و رنگ'],
  exhibition: ['نمایشگاه انفرادی (Solo Exhibition)', 'نمایشگاه گروهی بین‌المللی (Collective)', 'رویداد یونسکو / نهادهای فرهنگی'],
  poem: ['شعر فارسی', 'شعر فرانسوی (Poésie)', 'کوتاه‌واره دوزبانه (پاره شعر)'],
  video: ['روانکاوی لکانی', 'حافظ‌پژوهی', 'جامعه و فرهنگ ایران', 'هنر و خوشنویسی', 'پژوهش و فلسفه', 'شعرخوانی و دکلمه', 'مصاحبه رسانه‌ای'],
  article: ['مقاله تخصصی روانکاوی', 'پژوهش حافظ و ادبیات', 'جامعه، فرهنگ و راهبرد', 'متن کامل سخنرانی / کنفرانس', 'مصاحبه مکتوب', 'خبر و رویداد فرهنگی'],
};

export function AddNewWorkModal({
  defaultType,
  isOpen,
  onClose,
  onAddWork,
}: AddNewWorkModalProps) {
  const [workType, setWorkType] = useState<NewWorkType>(defaultType);
  const [titleFa, setTitleFa] = useState('');
  const [titleFr, setTitleFr] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [category, setCategory] = useState(CATEGORY_OPTIONS[defaultType][0]);
  const [publisherOrVenue, setPublisherOrVenue] = useState('');
  const [isbnOrDimensions, setIsbnOrDimensions] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [editorialNote, setEditorialNote] = useState('');
  const [primaryFileName, setPrimaryFileName] = useState<string | undefined>();
  const [primaryFileDataUrl, setPrimaryFileDataUrl] = useState<string | undefined>();
  const [book3DSpec, setBook3DSpec] = useState<Book3DAssetsSpec>({
    showIn3DShowcase: true,
    allowFullPdfDownload: false,
  });
  const [authorSiteAudio, setAuthorSiteAudio] = useState<RecordedAudioAsset | null>(null);
  const [justSavedCount, setJustSavedCount] = useState(0);

  React.useEffect(() => {
    setWorkType(defaultType);
    setCategory(CATEGORY_OPTIONS[defaultType][0]);
  }, [defaultType, isOpen]);

  if (!isOpen) return null;

  const handlePrimaryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPrimaryFileName(file.name);
      setPrimaryFileDataUrl(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.readAsDataURL(file);
  };

  const resetFormForAnother = () => {
    setTitleFa('');
    setTitleFr('');
    setPublisherOrVenue('');
    setIsbnOrDimensions('');
    setExternalUrl('');
    setBodyText('');
    setEditorialNote('');
    setPrimaryFileName(undefined);
    setPrimaryFileDataUrl(undefined);
    setBook3DSpec({ showIn3DShowcase: true, allowFullPdfDownload: false });
    setAuthorSiteAudio(null);
  };

  const handleSubmit = (addAnother: boolean) => {
    if (!titleFa.trim() && !titleFr.trim()) {
      alert('لطفاً حداقل عنوان فارسی یا فرانسوی اثر را وارد فرمایید.');
      return;
    }

    const newWork: CustomAddedWork = {
      id: `custom-${workType}-${Date.now()}`,
      workType,
      titleFa: titleFa.trim(),
      titleFr: titleFr.trim(),
      year: year.trim(),
      category,
      publisherOrVenue: publisherOrVenue.trim(),
      isbnOrDimensions: isbnOrDimensions.trim(),
      externalUrl: externalUrl.trim(),
      bodyText: bodyText.trim(),
      editorialNote: editorialNote.trim(),
      primaryFileName,
      primaryFileDataUrl,
      book3DSpec: workType === 'book' ? book3DSpec : undefined,
      authorSiteAudio: workType === 'book' ? book3DSpec.authorIntroAudio : authorSiteAudio,
      createdAt: new Date().toISOString(),
    };

    onAddWork(newWork);
    setJustSavedCount((prev) => prev + 1);

    if (addAnother) {
      resetFormForAnother();
    } else {
      resetFormForAnother();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-3 overflow-y-auto">
      <div
        dir="rtl"
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white border-2 border-amber-300 shadow-2xl p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                افزودن اثر جدید به گنجینه سایت (به تعداد نامحدود)
              </h3>
              <p className="text-xs text-slate-600">
                هر تعداد کتاب، تابلوی هنری، نمایشگاه، شعر، ویدئو یا مقاله جدید که در سایت قدیم نبوده را می‌توانید اینجا اضافه کنید.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {justSavedCount > 0 && (
          <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-300 px-4 py-2.5 flex items-center gap-2 text-xs font-bold text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              تاکنون {justSavedCount} اثر جدید در این نوبت با موفقیت ثبت شد! می‌توانید اثر بعدی را در زیر وارد کنید.
            </span>
          </div>
        )}

        {/* Type selector pills */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-700 mb-2">
            ۱. نوع اثر جدید را انتخاب کنید:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {(Object.keys(WORK_TYPE_LABELS) as NewWorkType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setWorkType(t);
                  setCategory(CATEGORY_OPTIONS[t][0]);
                }}
                className={`text-right px-3.5 py-2.5 rounded-xl text-xs font-bold border transition ${
                  workType === t
                    ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {WORK_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Core fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              عنوان فارسی اثر:
            </label>
            <input
              type="text"
              value={titleFa}
              onChange={(e) => setTitleFa(e.target.value)}
              placeholder="مثلاً: کتاب یا تابلوی جدید..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-amber-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              عنوان فرانسوی / انگلیسی (اختیاری):
            </label>
            <input
              type="text"
              dir="ltr"
              value={titleFr}
              onChange={(e) => setTitleFr(e.target.value)}
              placeholder="Titre en français ou en anglais..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-amber-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              دسته‌بندی موضوعی پیشنهادی استاد:
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 bg-white focus:border-amber-600 focus:outline-none"
            >
              {CATEGORY_OPTIONS[workType].map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                سال خلق / انتشار:
              </label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="مثلاً 2024"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {workType === 'book'
                  ? 'نام ناشر:'
                  : workType === 'exhibition'
                  ? 'شهر و گالری:'
                  : 'محل ارائه / رسانه:'}
              </label>
              <input
                type="text"
                value={publisherOrVenue}
                onChange={(e) => setPublisherOrVenue(e.target.value)}
                placeholder={
                  workType === 'book'
                    ? 'مثلاً L’Harmattan / پردیس دانش'
                    : 'مثلاً پاریس، یونسکو'
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-amber-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              {workType === 'book'
                ? 'شماره شابک (ISBN):'
                : workType === 'gallery'
                ? 'ابعاد و تکنیک تابلو (مثلاً ۱۰۰×۸۰ سانتی‌متر، مرکب و اکریلیک):'
                : 'مشخصات تکمیلی:'}
            </label>
            <input
              type="text"
              value={isbnOrDimensions}
              onChange={(e) => setIsbnOrDimensions(e.target.value)}
              placeholder={workType === 'book' ? '978-...' : 'ابعاد، تکنیک یا مشخصات...'}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-amber-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              لینک مرتبط (یوتیوب، آمازون، سایت ناشر، گوگل‌درایو):
            </label>
            <input
              type="url"
              dir="ltr"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-amber-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Body Text / Poem / Description */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-800 mb-1">
            {workType === 'poem'
              ? 'متن کامل شعر:'
              : workType === 'article'
              ? 'متن کامل مقاله یا خلاصه آن:'
              : 'متن معرفی اثر / بیانیه هنری:'}
          </label>
          <textarea
            rows={4}
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            placeholder="متن معرفی، شعر، یا توضیحات کامل اثر را اینجا وارد فرمایید (یا با دکمه تایپ صوتی در پایین بگویید)..."
            className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:border-amber-600 focus:outline-none"
          />
        </div>

        {/* If Book: Render full 4-slot Front/Back/Spine/SamplePages + Book Voice Intro */}
        {workType === 'book' ? (
          <BookMediaAssetsUploader
            bookId="new-book"
            bookTitle={titleFa || titleFr || 'کتاب جدید'}
            spec={book3DSpec}
            onChange={setBook3DSpec}
            onTranscriptAppended={(txt) =>
              setBodyText((prev) => (prev ? `${prev} ${txt}` : txt))
            }
          />
        ) : (
          <div className="space-y-3 mb-4">
            {/* General File / Image / PDF uploader for non-book works */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  📎 بارگذاری فایل اثر (تصویر تابلو با کیفیت بالا، فایل PDF مقاله، یا پوستر نمایشگاه)
                </div>
                <p className="text-[11px] text-slate-500">
                  {primaryFileName
                    ? `فایل انتخاب‌شده: ${primaryFileName}`
                    : 'می‌توانید تصویر، PDF یا فایل Word اثر را مستقیم ضمیمه کنید.'}
                </p>
              </div>
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-800 hover:bg-amber-50 cursor-pointer shadow-sm">
                <Upload className="w-4 h-4 text-amber-700" />
                <span>انتخاب فایل از دستگاه</span>
                <input type="file" onChange={handlePrimaryFile} className="hidden" />
              </label>
            </div>

            {/* Site Audio Recorder for non-book works */}
            <VoiceRecorderWidget
              itemId={`new-${workType}`}
              itemTitle={titleFa || titleFr || 'اثر جدید'}
              mode="site_intro"
              existingAudio={authorSiteAudio}
              onSaveAudio={setAuthorSiteAudio}
              onTranscriptAppended={(txt) =>
                setBodyText((prev) => (prev ? `${prev}\n${txt}` : txt))
              }
            />
          </div>
        )}

        {/* Editorial Note for technical team */}
        <div className="mt-4 mb-6">
          <label className="block text-xs font-bold text-slate-800 mb-1">
            💬 یادداشت یا دستور استاد برای تیم فنی درباره نحوه نمایش این اثر:
          </label>
          <input
            type="text"
            value={editorialNote}
            onChange={(e) => setEditorialNote(e.target.value)}
            placeholder="مثلاً: این اثر در صفحه اول هم قرار بگیرد / در بالای لیست نمایش داده شود..."
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-amber-600 focus:outline-none"
          />
        </div>

        {/* Footer Buttons: Save & Add Another (Unlimited!) OR Save & Close */}
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
          >
            انصراف و بستن
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>ثبت این اثر و افزودن اثر بعدی (+)</span>
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-amber-600 hover:bg-amber-700 text-white shadow-md"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>ثبت نهایی اثر و بازگشت به لیست</span>
          </button>
        </div>
      </div>
    </div>
  );
}

