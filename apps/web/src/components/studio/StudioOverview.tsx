'use client';

import React from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowUpLeft,
  BookOpen,
  Bot,
  FilePlus2,
  FolderPlus,
  KeyRound,
  Languages,
  Save,
  ShieldCheck,
} from 'lucide-react';
import type { AiProviderRuntimeStatus, Locale } from '@makaremi/shared';

export type StudioTabId =
  | 'overview'
  | 'create'
  | 'enrich'
  | 'translations'
  | 'commerce'
  | 'ai_system'
  | 'security';

interface StudioOverviewProps {
  locale: Locale;
  stats: {
    totalWorks: number;
    trilingualComplete: number;
    missingAnyLocale: number;
    enrichedWorks: number;
    byCollection: Record<string, number>;
  } | null;
  localDraftsCount: number;
  manualQueueCount: number;
  aiStatus: AiProviderRuntimeStatus | null;
  onNavigateTab: (tab: StudioTabId) => void;
}

export function StudioOverview({
  locale,
  stats,
  localDraftsCount,
  manualQueueCount,
  aiStatus,
  onNavigateTab,
}: StudioOverviewProps) {
  const totalWorks = stats?.totalWorks ?? 1068;
  const complete = stats?.trilingualComplete ?? 1068;
  const enriched = stats?.enrichedWorks ?? 0;

  return (
    <div className="space-y-6">
      {/* Primary Hero Action — One Thing Leads */}
      <section className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-medium)] p-6 sm:p-8 shadow-[var(--shadow-sm)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--primary)]">
              <ShieldCheck size={14} />
              <span>پیشخوان دائمی و آتلیه نشر دکتر حسن مکارمی</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--foreground)] leading-snug">
              انتشار آثار جدید، تکمیل آرشیو موجود و کنترل مستقیم ترجمه‌ها در یک فضای آرام
            </h2>
            <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
              تمامی فایل‌های ارسالی پیش از ذخیره به‌صورت خودکار به فرمت استاندارد وب‌سایت تبدیل می‌شوند، مسوده‌های شما با ترک موقت صفحه از بین نمی‌روند، و متن‌های اصیل آرشیو همیشه مصون از تغییر باقی می‌مانند.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('create')}
              className="min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-bold text-sm transition-transform duration-150 active:scale-[0.98]"
            >
              <FilePlus2 size={18} />
              <span>ثبت و انتشار اثر جدید</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('translations')}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--surface-sunken)] hover:bg-[var(--primary-light)] border border-[var(--border-medium)] text-[var(--foreground)] font-bold text-sm transition-colors"
            >
              <Languages size={17} className="text-[var(--primary)]" />
              <span>بررسی و ویرایش ترجمه‌ها</span>
            </button>
          </div>
        </div>
      </section>

      {/* Focused Operational Metrics Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigateTab('translations')}
          className="text-right rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--primary)] p-5 transition-colors"
        >
          <div className="flex items-center justify-between text-xs font-bold text-[var(--foreground-muted)] mb-2">
            <span>آرشیو کل و پوشش ۳زبانه</span>
            <Languages size={16} className="text-[var(--primary)]" />
          </div>
          <div className="text-2xl font-black text-[var(--foreground)]">
            {complete.toLocaleString('fa-IR')} / {totalWorks.toLocaleString('fa-IR')}
          </div>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            {stats?.missingAnyLocale
              ? `${stats.missingAnyLocale.toLocaleString('fa-IR')} اثر در صف تکمیل ترجمه`
              : 'تمامی آثار دارای متن ۳زبانه آماده کنترل'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('create')}
          className="text-right rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--primary)] p-5 transition-colors"
        >
          <div className="flex items-center justify-between text-xs font-bold text-[var(--foreground-muted)] mb-2">
            <span>مسوده‌های ذخیره‌شده شما</span>
            <Save size={16} className="text-[var(--accent-gold)]" />
          </div>
          <div className="text-2xl font-black text-[var(--foreground)]">
            {localDraftsCount.toLocaleString('fa-IR')}
          </div>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            ذخیره‌شده روی دستگاه بدون خطر پاک شدن با بستن صفحه
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('enrich')}
          className="text-right rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--primary)] p-5 transition-colors"
        >
          <div className="flex items-center justify-between text-xs font-bold text-[var(--foreground-muted)] mb-2">
            <span>آثار غنی‌شده با پیوست تازه</span>
            <FolderPlus size={16} className="text-[var(--primary)]" />
          </div>
          <div className="text-2xl font-black text-[var(--foreground)]">
            {enriched.toLocaleString('fa-IR')}
          </div>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            افزودن یادداشت، لینک و مدرک به {totalWorks.toLocaleString('fa-IR')} اثر قبلی
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('ai_system')}
          className="text-right rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--primary)] p-5 transition-colors"
        >
          <div className="flex items-center justify-between text-xs font-bold text-[var(--foreground-muted)] mb-2">
            <span>موتور ترجمه و دستیار هوشمند</span>
            <Bot size={16} className="text-[var(--accent-gold)]" />
          </div>
          <div className="text-base font-extrabold text-[var(--foreground)] mt-1">
            {aiStatus?.hasApiKeyConfigured ? 'اتصال هوشمند فعال' : 'حالت دستی (صف ترجمه)'}
          </div>
          <p className="text-xs text-[var(--foreground-muted)] mt-1.5">
            {manualQueueCount > 0
              ? `${manualQueueCount.toLocaleString('fa-IR')} اثر در صف ترجمه دستی`
              : 'آماده ترجمه دستی یا خودکار با کلید API در آینده'}
          </p>
        </button>
      </section>

      {/* Archive Collection Breakdown & Connected Studio Shortcuts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5">
          <h3 className="text-sm font-extrabold text-[var(--foreground)] mb-3">
            فهرست زنده دسته‌بندی آثار موجود در وب‌سایت
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              { key: 'articles', label: 'مقالات و جستارها' },
              { key: 'poems', label: 'اشعار و مصراع‌ها' },
              { key: 'videos', label: 'سخنرانی و ویدئو' },
              { key: 'books', label: 'کتاب‌ها و رساله‌ها' },
              { key: 'artworks', label: 'تابلوهای گالری' },
              { key: 'exhibitions', label: 'نمایشگاه‌ها' },
              { key: 'pages', label: 'مصاحبه‌ها و کنفرانس‌ها' },
            ].map((row) => (
              <div
                key={row.key}
                className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-3"
              >
                <div className="text-[var(--foreground-muted)]">{row.label}</div>
                <div className="text-lg font-extrabold text-[var(--foreground)] mt-1">
                  {(stats?.byCollection?.[row.key] ?? 0).toLocaleString('fa-IR')}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-extrabold text-[var(--foreground)]">
              ابزارهای تخصصی متصل به پیشخوان
            </h3>
            <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
              دسترسی سریع به تنظیمات پین و کلید ورود، استودیوی کتاب ۳بعدی و مرکز پایش فنی:
            </p>
          </div>
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => onNavigateTab('security')}
              className="w-full min-h-[44px] flex items-center justify-between px-4 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] hover:border-[var(--primary)] text-xs font-bold text-[var(--foreground)] transition-colors"
            >
              <span className="flex items-center gap-2">
                <KeyRound size={16} className="text-[var(--primary)]" />
                <span>تغییر پین و کلید ورود پیشخوان</span>
              </span>
              <ArrowUpLeft size={15} />
            </button>
            <Link
              href={`/${locale}/book-studio`}
              className="w-full min-h-[44px] flex items-center justify-between px-4 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] hover:border-[var(--primary)] text-xs font-bold text-[var(--foreground)] transition-colors"
            >
              <span className="flex items-center gap-2">
                <BookOpen size={16} className="text-[var(--primary)]" />
                <span>استودیوی مهندسی کتاب‌های سه‌بعدی</span>
              </span>
              <ArrowUpLeft size={15} />
            </Link>
            <Link
              href={`/${locale}/system-status`}
              className="w-full min-h-[44px] flex items-center justify-between px-4 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] hover:border-[var(--primary)] text-xs font-bold text-[var(--foreground)] transition-colors"
            >
              <span className="flex items-center gap-2">
                <Activity size={16} className="text-[var(--primary)]" />
                <span>مرکز وضعیت سیستم و گواهی سلامت</span>
              </span>
              <ArrowUpLeft size={15} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
