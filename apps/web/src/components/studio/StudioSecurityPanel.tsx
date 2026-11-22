'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

interface SecurityStatusResponse {
  hasCustomPin: boolean;
  hasCustomManagementKey: boolean;
  superAdminProtected: boolean;
  superAdminKeySource: 'env_super_admin' | 'env_curation_admin' | 'preview_fallback';
  usingDefaultFallback: boolean;
  storageMode: 'persistent_disk' | 'serverless_runtime_tmp';
  updatedAt: string | null;
}

export function StudioSecurityPanel() {
  const [status, setStatus] = useState<SecurityStatusResponse | null>(null);
  const [role, setRole] = useState<string>('professor');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newPin, setNewPin] = useState('');
  const [newManagementKey, setNewManagementKey] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/studio/security');
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus(data.security);
        setRole(data.role || 'professor');
      }
    } catch {
      // ignore transient errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const pinTrimmed = newPin.trim();
    const keyTrimmed = newManagementKey.trim();

    if (!pinTrimmed && !keyTrimmed) {
      setFeedback({
        ok: false,
        msg: 'لطفاً حداقل یکی از فیلدهای «پین جدید استاد» یا «کلید مدیریت جدید» را پر کنید.',
      });
      return;
    }

    if (pinTrimmed && pinTrimmed.length < 4) {
      setFeedback({ ok: false, msg: 'پین اختصاصی استاد باید حداقل ۴ کاراکتر باشد.' });
      return;
    }

    if (keyTrimmed && keyTrimmed.length < 8) {
      setFeedback({ ok: false, msg: 'کلید مدیریت باید حداقل ۸ کاراکتر باشد.' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/studio/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          newPin: pinTrimmed,
          newManagementKey: keyTrimmed,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFeedback({ ok: false, msg: data.error || 'خطا در ذخیره پین و کلید.' });
        return;
      }

      setStatus(data.security);
      setNewPin('');
      setNewManagementKey('');
      setFeedback({ ok: true, msg: data.message });
    } catch {
      setFeedback({ ok: false, msg: 'امکان ارتباط با سرور برای ذخیره تنظیمات امنیتی برقرار نشد.' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/studio/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFeedback({ ok: false, msg: data.error || 'خطا در بازنشانی تنظیمات.' });
        return;
      }
      setStatus(data.security);
      setFeedback({ ok: true, msg: data.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="studio-security-settings" className="space-y-6">
      <section className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-[var(--primary-light)] border border-[var(--border-subtle)] text-[var(--primary)] flex items-center justify-center shrink-0">
              <KeyRound size={22} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[var(--foreground)]">
                تنظیمات امنیتی، تغییر پین اختصاصی و کلید مدیریت پیشخوان
              </h2>
              <p className="text-xs text-[var(--foreground-muted)] mt-1 leading-relaxed">
                در این بخش می‌توانید پین اختصاصی استاد و کلید مدیریت پیشخوان را بدون قطع شدن دسترسی سوپر ادمین تغییر دهید. هر دو رمز به صورت کدگذاری‌شده (`scrypt`) ذخیره می‌شوند و هرگز به شکل متن ساده نگهداری نمی‌شوند.
              </p>
            </div>
          </div>

          <span className="px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 inline-flex items-center gap-1.5">
            <ShieldCheck size={14} />
            <span>
              {role === 'super_admin'
                ? 'نشست فعلی: سوپر ادمین (دسترسی دائمی فعال)'
                : 'دسترسی سوپر ادمین مستقل و مصون است'}
            </span>
          </span>
        </div>

        {/* Super-Admin Non-Lockout Guarantee Banner */}
        <div className="rounded-xl bg-[var(--primary-light)]/50 border border-[var(--primary)]/30 p-4 flex items-start gap-3">
          <Lock size={18} className="text-[var(--primary)] shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs leading-relaxed">
            <div className="font-extrabold text-[var(--foreground)]">
              ضمانت حفظ دسترسی سوپر ادمین (غیرقابل مسدودسازی از پنل)
            </div>
            <p className="text-[var(--foreground-muted)]">
              تغییر پین استاد یا کلید مدیریت در این فرم، هیچ‌گاه کلید مادر سوپر ادمین (تعریف‌شده در متغیرهای سرور{' '}
              <code dir="ltr" className="font-mono font-bold text-[var(--foreground)]">
                SUPER_ADMIN_SECRET / CURATION_ADMIN_SECRET
              </code>
              ) را بازنویسی یا غیرفعال نمی‌کند. سوپر ادمین در هر شرایطی حتی پس از تغییر پین یا کلید توسط استاد می‌تواند وارد پیشخوان شود.
            </p>
          </div>
        </div>

        {status?.storageMode === 'serverless_runtime_tmp' && (
          <div className="rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-500/40 p-3.5 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>
              توجه محیط Serverless: فایل‌سیستم استقرار فعلی فقط در حافظه موقت (`/tmp`) قابل نوشتن است؛ بنابراین تغییرات این فرم فوراً در نمونه جاری فعال می‌شوند، اما برای ماندگاری همیشگی پس از استقرار مجدد سرور، متغیر `MAKAREMI_PROFESSOR_PIN` را نیز در پنل میزبانی به‌روزرسانی فرمایید. دسترسی سوپر ادمین همیشه فعال می‌ماند.
            </span>
          </div>
        )}

        {loading ? (
          <div className="py-10 flex items-center justify-center gap-2 text-xs text-[var(--foreground-muted)]">
            <Loader2 size={16} className="animate-spin" />
            <span>در حال دریافت وضعیت امنیتی پیشخوان...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Professor PIN Change Field */}
              <div className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="pishkhan-new-pin"
                    className="text-sm font-extrabold text-[var(--foreground)]"
                  >
                    پین اختصاصی جدید استاد (PIN)
                  </label>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                      status?.hasCustomPin
                        ? 'border-[var(--primary)]/50 bg-[var(--primary-light)] text-[var(--primary)]'
                        : 'border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--foreground-muted)]'
                    }`}
                  >
                    {status?.hasCustomPin ? 'پین سفارشی فعال' : 'پیش‌فرض سرور'}
                  </span>
                </div>

                <div className="relative">
                  <input
                    id="pishkhan-new-pin"
                    type={showPin ? 'text' : 'password'}
                    dir="ltr"
                    autoComplete="new-password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="مثال: 48291753 (حداقل ۴ کاراکتر)"
                    className="w-full min-h-[44px] rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] pl-11 pr-3.5 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin((p) => !p)}
                    aria-label={showPin ? 'پنهان کردن پین' : 'نمایش پین'}
                    className="absolute inset-y-0 left-2 flex items-center justify-center px-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                  >
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <p className="text-[11px] text-[var(--foreground-muted)] leading-relaxed">
                  در صورت تکمیل، پین جدید جایگزین پین قبلی استاد می‌شود (اگر نمی‌خواهید پین تغییر کند، این فیلد را خالی بگذارید).
                </p>
              </div>

              {/* Management Key Change Field */}
              <div className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="pishkhan-new-key"
                    className="text-sm font-extrabold text-[var(--foreground)]"
                  >
                    کلید مدیریت جدید پیشخوان
                  </label>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                      status?.hasCustomManagementKey
                        ? 'border-[var(--primary)]/50 bg-[var(--primary-light)] text-[var(--primary)]'
                        : 'border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--foreground-muted)]'
                    }`}
                  >
                    {status?.hasCustomManagementKey ? 'کلید سفارشی فعال' : 'پیش‌فرض سرور'}
                  </span>
                </div>

                <div className="relative">
                  <input
                    id="pishkhan-new-key"
                    type={showKey ? 'text' : 'password'}
                    dir="ltr"
                    autoComplete="new-password"
                    value={newManagementKey}
                    onChange={(e) => setNewManagementKey(e.target.value)}
                    placeholder="حداقل ۸ کاراکتر ترکیبی امن..."
                    className="w-full min-h-[44px] rounded-xl bg-[var(--surface-card)] border border-[var(--border-medium)] pl-11 pr-3.5 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((p) => !p)}
                    aria-label={showKey ? 'پنهان کردن کلید' : 'نمایش کلید'}
                    className="absolute inset-y-0 left-2 flex items-center justify-center px-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <p className="text-[11px] text-[var(--foreground-muted)] leading-relaxed">
                  کلید مدیریت مستقل از کلید مادر سوپر ادمین ثبت می‌شود؛ بنابراین تغییر آن هرگز دسترسی سوپر ادمین را قطع نمی‌کند.
                </p>
              </div>
            </div>

            {feedback && (
              <div
                className={`rounded-xl border p-3.5 text-xs font-bold flex items-center gap-2 ${
                  feedback.ok
                    ? 'border-emerald-500/60 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                    : 'border-red-400/60 bg-red-50/70 dark:bg-red-950/30 text-red-900 dark:text-red-200'
                }`}
              >
                <CheckCircle2 size={16} />
                <span>{feedback.msg}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-bold text-xs disabled:opacity-50"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                  <span>ذخیره پین و کلید جدید پیشخوان</span>
                </button>

                {(status?.hasCustomPin || status?.hasCustomManagementKey) && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleResetToDefaults}
                    className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] hover:border-red-500 text-[var(--foreground)] font-bold text-xs"
                  >
                    <RotateCcw size={14} />
                    <span>بازنشانی به تنظیمات پیش‌فرض سرور</span>
                  </button>
                )}
              </div>

              {status?.updatedAt && (
                <span className="text-[11px] text-[var(--foreground-muted)]">
                  آخرین به‌روزرسانی امنیتی: {new Date(status.updatedAt).toLocaleString('fa-IR')}
                </span>
              )}
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
