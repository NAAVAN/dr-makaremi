'use client';

import React, { useId, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Loader2,
  Mic,
  ShieldCheck,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';
import type { MediaSlotKey, StudioStandardisedAsset } from '@makaremi/shared';
import {
  MEDIA_UPLOAD_POLICIES,
  formatBytesFa,
  validateAndStandardiseClientFile,
} from '@/lib/studio/media-gatekeeper';

interface StandardUploadDropzoneProps {
  slot: MediaSlotKey;
  value?: StudioStandardisedAsset | null;
  onChange: (asset: StudioStandardisedAsset | null) => void;
  existingPreviewUrl?: string | null;
  compact?: boolean;
  customLabel?: string;
}

export function StandardUploadDropzone({
  slot,
  value,
  onChange,
  existingPreviewUrl,
  compact = false,
  customLabel,
}: StandardUploadDropzoneProps) {
  const inputId = useId();
  const policy = MEDIA_UPLOAD_POLICIES[slot];
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const SlotIcon =
    slot === 'document_pdf'
      ? FileText
      : slot === 'audio_intro'
        ? Mic
        : slot === 'video_asset'
          ? Video
          : ImageIcon;

  const processFile = async (file: File | undefined) => {
    if (!file) return;
    setErrorMsg(null);
    setIsProcessing(true);
    try {
      const result = await validateAndStandardiseClientFile(file, slot);
      if (!result.ok) {
        setErrorMsg(result.error);
      } else {
        onChange(result.asset);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    await processFile(file);
  };

  const isImageAsset = value?.mimeType.startsWith('image/');

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`rounded-2xl border transition-colors ${
        errorMsg
          ? 'border-red-500/70 bg-red-50/40 dark:bg-red-950/20'
          : isDragging
            ? 'border-[var(--primary)] bg-[var(--primary-light)]'
            : value
              ? 'border-emerald-600/50 bg-[var(--surface-card)]'
              : 'border-[var(--border-medium)] bg-[var(--surface-card)]'
      } ${compact ? 'p-3.5' : 'p-4 sm:p-5'}`}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--primary)] flex items-center justify-center shrink-0">
            <SlotIcon size={18} strokeWidth={1.6} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--foreground)]">
              {customLabel || policy.titleFa}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] mt-0.5">
              <ShieldCheck size={13} className="text-[var(--primary)] shrink-0" />
              <span>فیلتر استانداردسازی خودکار سایت فعال است</span>
            </div>
          </div>
        </div>

        {value && (
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              onChange(null);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-300/60 hover:bg-red-100 transition-transform active:scale-[0.97]"
          >
            <Trash2 size={13} />
            <span>حذف فایل</span>
          </button>
        )}
      </div>

      {/* Preview Box (Selected Asset or Existing URL or Empty Drop Area) */}
      {value ? (
        <div className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-3 mb-3">
          <div className="flex flex-wrap items-center gap-3">
            {isImageAsset ? (
              <img
                src={value.dataUrl}
                alt={value.fileName}
                className="w-20 h-20 object-cover rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--primary)] shrink-0">
                <FileText size={24} strokeWidth={1.5} />
              </div>
            )}

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5 text-sm font-bold text-[var(--foreground)]">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span className="truncate">{value.fileName}</span>
              </div>
              <div className="text-xs text-[var(--foreground-muted)] flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>حجم نهایی: {formatBytesFa(value.sizeBytes)}</span>
                {value.wasConvertedToWebP && value.originalSizeBytes > value.sizeBytes && (
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    تبدیل‌شده به WebP (کاهش از {formatBytesFa(value.originalSizeBytes)})
                  </span>
                )}
                {value.width && value.height && (
                  <span dir="ltr">
                    {value.width}×{value.height} px
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : existingPreviewUrl ? (
        <div className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-2.5 mb-3 flex items-center gap-3">
          <img
            src={existingPreviewUrl}
            alt="فایل فعلی موجود در آرشیو"
            className="w-16 h-16 object-cover rounded-lg border border-[var(--border-subtle)]"
          />
          <p className="text-xs text-[var(--foreground-muted)]">
            فایل فعلی در سایت موجود است؛ برای جایگزینی، فایل جدید را اینجا رها کنید یا انتخاب فرمایید.
          </p>
        </div>
      ) : null}

      {/* Upload Action Button */}
      <label
        htmlFor={inputId}
        className={`w-full min-h-[46px] rounded-xl border border-dashed flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold cursor-pointer transition-colors ${
          isProcessing
            ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
            : 'border-[var(--border-medium)] bg-[var(--surface-sunken)] hover:bg-[var(--primary-light)] hover:border-[var(--primary)] text-[var(--foreground)]'
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 size={17} className="animate-spin" />
            <span>در حال پالایش و استانداردسازی به فرمت سایت...</span>
          </>
        ) : (
          <>
            <Upload size={17} className="text-[var(--primary)]" />
            <span>{value ? 'انتخاب یا جایگزینی فایل از دستگاه' : 'انتخاب فایل از دستگاه یا رها کردن در این کادر'}</span>
          </>
        )}
        <input
          id={inputId}
          type="file"
          accept={policy.acceptAttr}
          onChange={handleInputChange}
          className="sr-only"
        />
      </label>

      {/* Error Message */}
      {errorMsg && (
        <div className="mt-2.5 rounded-xl border border-red-400/60 bg-red-50/70 dark:bg-red-950/30 px-3 py-2 flex items-start gap-2 text-xs font-medium text-red-800 dark:text-red-200">
          <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Mandatory Format, Size Limit & Preferred Site Standard Box */}
      <div className="mt-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] px-3.5 py-2.5 space-y-1 text-xs leading-relaxed text-[var(--foreground-muted)]">
        <div>
          <strong className="text-[var(--foreground)]">فرمت‌های مجاز:</strong>{' '}
          <span dir="ltr" className="font-mono text-[11px]">
            {policy.allowedExtensions.map((x) => x.toUpperCase()).join(' / ')}
          </span>
        </div>
        <div>
          <strong className="text-[var(--foreground)]">محدودیت حجم:</strong> {policy.maxSizeLabelFa}
        </div>
        <div>
          <strong className="text-[var(--foreground)]">پیشنهاد ترجیحی سایت:</strong> {policy.preferredStandardFa}
        </div>
      </div>
    </div>
  );
}
