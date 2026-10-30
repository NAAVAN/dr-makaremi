import React from 'react';
import { FileText, Quote } from 'lucide-react';
import { renderSafeMarkdown } from '@/lib/markdown';
import type { Locale } from '@makaremi/shared';

interface SpeechTranscriptViewProps {
  title: string;
  transcriptMarkdown?: string | null;
  description?: string | null;
  locale: Locale;
}

export function SpeechTranscriptView({
  title,
  transcriptMarkdown,
  description,
  locale,
}: SpeechTranscriptViewProps) {
  const isFa = locale === 'fa';

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-4">
        <FileText className="text-[var(--primary)]" size={20} />
        <h3 className="text-base font-bold text-[var(--foreground)]">
          {isFa ? 'پیاده‌سازی متنی و بیانیه کامل گفتار' : 'Transcription Intégrale'}
        </h3>
      </div>

      {description && (
        <div className="p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs text-[var(--foreground-muted)] leading-relaxed italic">
          {description}
        </div>
      )}

      {transcriptMarkdown ? (
        <div className="prose-content text-base leading-loose text-[var(--foreground)] space-y-4">
          {renderSafeMarkdown(transcriptMarkdown)}
        </div>
      ) : (
        <p className="text-xs text-[var(--foreground-muted)]">
          {isFa ? 'متن پیاده‌سازی شده در دست بازبینی است.' : 'Transcription en cours.'}
        </p>
      )}
    </div>
  );
}
