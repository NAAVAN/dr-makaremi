'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import type { Locale } from '@makaremi/shared';

interface StudioAuthGateProps {
  locale: Locale;
  targetName: 'dashboard' | 'curation-studio';
  usingDefaultFallback?: boolean;
}

export function StudioAuthGate({
  locale,
  targetName,
  usingDefaultFallback = false,
}: StudioAuthGateProps) {
  const router = useRouter();
  const [credential, setCredential] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isDashboard = targetName === 'dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credential.trim()) {
      setErrorMsg('لطفاً پین اختصاصی استاد یا کلید مدیریت را وارد فرمایید.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/studio/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretOrPin: credential.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || 'پین یا رمز واردشده معتبر نیست.');
        return;
      }
      router.refresh();
    } catch {
      setErrorMsg('امکان برقراری ارتباط با سرور برای تایید ورود وجود ندارد.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[var(--surface-canvas)] text-[var(--foreground)] flex flex-col justify-center items-center px-4 py-12"
    >
      <div className="w-full max-w-md rounded-2xl bg-[var(--surface-card)] border border-[var(--border-medium)] shadow-[var(--shadow-lg)] p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between gap-2">
          <div className="w-11 h-11 rounded-xl bg-[var(--primary-light)] border border-[var(--border-subtle)] text-[var(--primary)] flex items-center justify-center">
            <KeyRound size={22} strokeWidth={1.6} />
          </div>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors"
          >
            <ArrowRight size={14} />
            <span>بازگشت به وب‌سایت عمومی</span>
          </Link>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-wider text-[var(--accent-gold)] font-bold">
            MAKAREMI SANCTUARY ACCESS
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] leading-snug">
            {isDashboard
              ? 'ورود به داشبورد اختصاصی استاد مکارمی'
              : 'ورود به میز کار و آتلیه نشر استاد مکارمی'}
          </h1>
          <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
            این بخش تنها با پین اختصاصی استاد دکتر حسن مکارمی یا کلید مدیریت (`CURATION_ADMIN_SECRET`) قابل گشودن است تا تغییرات محتوایی و ترجمه‌ها با امنیت کامل ثبت شوند.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="studio-pin-input"
              className="block text-sm font-bold text-[var(--foreground)] mb-1.5"
            >
              پین اختصاصی استاد یا کلید مدیریت
            </label>
            <div className="relative">
              <input
                id="studio-pin-input"
                type={showPass ? 'text' : 'password'}
                dir="ltr"
                autoComplete="current-password"
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                placeholder="Enter PIN or Admin Secret..."
                className="w-full min-h-[46px] rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] pl-11 pr-4 py-2.5 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                aria-label={showPass ? 'پنهان کردن رمز' : 'نمایش رمز'}
                className="absolute inset-y-0 left-2 flex items-center justify-center px-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              >
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-red-400/60 bg-red-50/70 dark:bg-red-950/30 px-3.5 py-2.5 text-xs font-semibold text-red-800 dark:text-red-200">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-bold text-sm transition-transform duration-150 ease-out active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>در حال بررسی و گشودن نشست امن...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>گشودن میز کار استاد</span>
              </>
            )}
          </button>
        </form>

        <div className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-3 text-xs text-[var(--foreground-muted)] leading-relaxed">
          {usingDefaultFallback
            ? 'هشدار تنظیمات: در فایل .env متغیر CURATION_ADMIN_SECRET تنظیم نشده و از کلید موقت پیش‌فرض استفاده می‌شود. پیش از استقرار عمومی حتماً متغیر .env را تنظیم فرمایید.'
            : 'احراز هویت دوحالته فعال است (کلید CURATION_ADMIN_SECRET یا پین MAKAREMI_PROFESSOR_PIN در .env سرور). نشست برای ۱۲ ساعت معتبر می‌ماند.'}
        </div>
      </div>
    </div>
  );
}
