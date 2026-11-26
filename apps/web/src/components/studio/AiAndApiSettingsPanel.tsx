'use client';

import React, { useEffect, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Download,
  KeyRound,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { AiProviderRuntimeStatus, ManualTranslationQueueItem } from '@makaremi/shared';
import { AccessibleListbox, type ListboxOption } from './AccessibleListbox';
import { StudioAiTrainingStudio } from './StudioAiTrainingStudio';

const ENGINE_PROFILES: ListboxOption<string>[] = [
  {
    value: 'literary_balanced',
    label: 'پروفایل متعادل و ادبی (پیشنهادی برای متون فارسی، فرانسوی و انگلیسی)',
    badge: 'Standard',
  },
  {
    value: 'literary_deep',
    label: 'پروفایل عمیق پژوهشی (حداکثر دقت در متون تخصصی و روانکاوی)',
    badge: 'Deep',
  },
  {
    value: 'concise_fast',
    label: 'پروفایل سریع (مناسب برای چکیده و پاسخ‌های کوتاه)',
    badge: 'Fast',
  },
];

interface AiAndApiSettingsPanelProps {
  onStatusUpdated: (nextStatus: AiProviderRuntimeStatus) => void;
}

export function AiAndApiSettingsPanel({ onStatusUpdated }: AiAndApiSettingsPanelProps) {
  const [status, setStatus] = useState<AiProviderRuntimeStatus | null>(null);
  const [queue, setQueue] = useState<ManualTranslationQueueItem[]>([]);
  const [selectedProfile, setSelectedProfile] = useState('literary_balanced');
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/studio/ai-config');
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus(data.status);
        setSelectedProfile(data.status.model || 'literary_balanced');
        setAutoTranslate(Boolean(data.status.autoTranslateOnPublish));
        setQueue(data.manualQueue || []);
        onStatusUpdated(data.status);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/studio/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          model: selectedProfile,
          autoTranslateOnPublish: autoTranslate,
        }),
      });
      const data = await res.json();
      if (data.status) {
        setStatus(data.status);
        onStatusUpdated(data.status);
      }
      setMessage({ ok: Boolean(data.ok), text: data.message || 'تنظیمات ذخیره شد.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/studio/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      });
      const data = await res.json();
      setMessage({
        ok: Boolean(data.testResult?.ok),
        text: data.testResult?.message || 'نتیجه بررسی دریافت شد.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleExportManualQueue = () => {
    const pending = queue.filter((q) => q.status === 'pending_manual_translation');
    const blob = new Blob([JSON.stringify(pending, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `makaremi-manual-translation-queue-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pendingQueue = queue.filter((q) => q.status === 'pending_manual_translation');

  return (
    <div className="space-y-6">
      {/* Pishkhan 5-Tab AI Research Assistant Training Studio */}
      <StudioAiTrainingStudio />

      {/* Smart Engine Card */}
      <section className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-[var(--primary-light)] border border-[var(--border-subtle)] text-[var(--primary)] flex items-center justify-center shrink-0">
              <Bot size={22} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[var(--foreground)]">
                تنظیمات موتور ترجمه خودکار و دستیار هوشمند سایت
              </h2>
              <p className="text-xs text-[var(--foreground-muted)] mt-1 leading-relaxed">
                در حال حاضر تمامی آثار فاقد ترجمه وارد «صف ترجمه دستی» می‌شوند تا بدون هیچ هزینه جانبی توسط تیم ویراستاری ترجمه و منتشر گردند. در آینده و پس از تحویل نهایی سایت به استاد، کافی است کلید `MAKAREMI_AI_API_KEY` در تنظیمات سرور ثبت شود تا ترجمه لحظه‌ای سه‌زبانه و دستیار هوشمند به‌طور خودکار فعال شوند.
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
              status?.hasApiKeyConfigured
                ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                : 'border-[var(--border-medium)] bg-[var(--surface-sunken)] text-[var(--foreground)]'
            }`}
          >
            {status?.hasApiKeyConfigured
              ? 'کلید پردازش هوشمند متصل است (خودکار)'
              : 'حالت فعلی: صف ترجمه دستی'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <AccessibleListbox
            label="پروفایل پردازش ادبی و پژوهشی"
            value={selectedProfile}
            options={ENGINE_PROFILES}
            onChange={setSelectedProfile}
          />

          <div className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-[var(--foreground)]">
                ترجمه خودکار بلافاصله پس از ثبت نهایی
              </div>
              <div className="text-xs text-[var(--foreground-muted)]">
                {status?.hasApiKeyConfigured
                  ? 'فعال به محض زدن تیک'
                  : 'به محض ثبت کلید API در تنظیمات سرور فعال می‌شود'}
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoTranslate}
              onChange={(e) => setAutoTranslate(e.target.checked)}
              className="w-5 h-5 accent-[var(--primary)] cursor-pointer"
            />
          </div>
        </div>

        <div className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-4 space-y-2 text-xs text-[var(--foreground-muted)]">
          <div className="flex items-center gap-1.5 font-extrabold text-[var(--foreground)]">
            <KeyRound size={14} className="text-[var(--accent-gold)]" />
            <span>نحوه فعال‌سازی کلید پولی API در سرور پس از تحویل سایت:</span>
          </div>
          <p className="leading-relaxed">
            کلید اختصاصی هرگز در مرورگر یا کد سمت کاربر ذخیره نمی‌شود. تنها کافی است در متغیرهای محیطی سرور (`.env` یا پنل میزبان) مقادیر زیر را قرار دهید:
          </p>
          <pre
            dir="ltr"
            className="rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] p-3 font-mono text-[11px] text-[var(--foreground)] overflow-x-auto"
          >{`MAKAREMI_AI_PROVIDER=cloud_ai
MAKAREMI_AI_API_KEY=your-secret-api-key-here
MAKAREMI_AI_MODEL=${selectedProfile}
MAKAREMI_AI_AUTO_TRANSLATE=true`}</pre>
        </div>

        {message && (
          <div
            className={`rounded-xl border p-3 text-xs font-bold flex items-center gap-2 ${
              message.ok
                ? 'border-emerald-500/60 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                : 'border-[var(--accent-gold)] bg-[var(--surface-sunken)] text-[var(--foreground)]'
            }`}
          >
            <CheckCircle2 size={15} />
            <span>{message.text}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveSettings}
            className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-bold text-xs"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
            <span>ذخیره تنظیمات موتور هوشمند</span>
          </button>

          <button
            type="button"
            disabled={testing}
            onClick={handleTestConnection}
            className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] hover:border-[var(--primary)] text-[var(--foreground)] font-bold text-xs"
          >
            {testing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            <span>بررسی وضعیت اتصال کلید API</span>
          </button>
        </div>
      </section>

      {/* Manual Translation Queue */}
      <section className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div>
            <h3 className="text-base font-extrabold text-[var(--foreground)]">
              صف ترجمه دستی فعلی و خروجی آماده ویراستاری ({pendingQueue.length.toLocaleString('fa-IR')} مورد)
            </h3>
            <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
              آثاری که استاد با یک زبان ثبت کرده‌اند اینجا فهرست می‌شوند تا در صورت نیاز فایل JSON آن‌ها دریافت و به‌صورت دستی ترجمه و در سایت ثبت شوند.
            </p>
          </div>

          <button
            type="button"
            disabled={pendingQueue.length === 0}
            onClick={handleExportManualQueue}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[var(--surface-sunken)] border border-[var(--border-medium)] hover:border-[var(--primary)] text-[var(--foreground)] disabled:opacity-40"
          >
            <Download size={15} />
            <span>دریافت بسته JSON صف ترجمه ({pendingQueue.length.toLocaleString('fa-IR')})</span>
          </button>
        </div>

        {pendingQueue.length === 0 ? (
          <p className="py-6 text-center text-xs text-[var(--foreground-muted)]">
            هم‌اکنون موردی در انتظار ترجمه دستی نیست.
          </p>
        ) : (
          <div className="space-y-2">
            {pendingQueue.map((item) => (
              <div
                key={item.id}
                className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-3.5 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <div className="text-sm font-bold text-[var(--foreground)]">{item.sourceTitle}</div>
                  <div className="text-xs text-[var(--foreground-muted)] mt-0.5">
                    کلکسیون: {item.collection} • زبان اصلی: {item.originalLocale.toUpperCase()} • زبان‌های در انتظار:{' '}
                    {item.targetLocales.map((t) => t.toUpperCase()).join('، ')}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--accent-gold)]">
                  در انتظار ترجمه
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
