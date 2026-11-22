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

const CLAUDE_MODELS: ListboxOption<string>[] = [
  {
    value: 'claude-sonnet-4-5',
    label: 'Claude Sonnet 4.5 (پیشنهادی برای ادب فارسی و ترجمه دقیق)',
    badge: 'Balanced',
  },
  {
    value: 'claude-opus-4-1',
    label: 'Claude Opus (حداکثر ژرفای ادبی و روانکاوی لکانی)',
    badge: 'Flagship',
  },
  {
    value: 'claude-haiku-4-5',
    label: 'Claude Haiku (سریع و اقتصادی برای چکیده و دستیار)',
    badge: 'Fast',
  },
];

interface AiAndApiSettingsPanelProps {
  onStatusUpdated: (nextStatus: AiProviderRuntimeStatus) => void;
}

export function AiAndApiSettingsPanel({ onStatusUpdated }: AiAndApiSettingsPanelProps) {
  const [status, setStatus] = useState<AiProviderRuntimeStatus | null>(null);
  const [queue, setQueue] = useState<ManualTranslationQueueItem[]>([]);
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-5');
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
        setSelectedModel(data.status.model || 'claude-sonnet-4-5');
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
          model: selectedModel,
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

  const handleTestAnthropic = async () => {
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
        text: data.testResult?.message || 'نتیجه آزمایش دریافت شد.',
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
    a.download = `makaremi-antigravity-translation-queue-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pendingQueue = queue.filter((q) => q.status === 'pending_manual_translation');

  return (
    <div className="space-y-6">
      {/* Anthropic Claude Card */}
      <section className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-[var(--primary-light)] border border-[var(--border-subtle)] text-[var(--primary)] flex items-center justify-center shrink-0">
              <Bot size={22} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[var(--foreground)]">
                موتور ترجمه ادبی و دستیار هوشمند (طراحی‌شده برای Anthropic Claude)
              </h2>
              <p className="text-xs text-[var(--foreground-muted)] mt-1 leading-relaxed">
                در مرحله فعلی، آثار بدون نیاز به کلید API پولی وارد «صف ترجمه دستی / آنتی‌گرویتی» می‌شوند. پس از تحویل نهایی وب‌سایت به استاد، کافی است کلید `ANTHROPIC_API_KEY` در `.env` سرور قرار گیرد تا هم ترجمه لحظه‌ای (با قفل واژه‌نامه لکانی و املای بریتانیایی) و هم دستیار پژوهشی هوشمند به‌صورت کاملاً خودکار کار کنند.
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
              ? 'کلید Anthropic متصل است (خودکار)'
              : 'حالت فعلی: صف ترجمه دستی آنتی‌گرویتی'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <AccessibleListbox
            label="مدل منتخب Anthropic Claude (پس از تحویل)"
            value={selectedModel}
            options={CLAUDE_MODELS}
            onChange={setSelectedModel}
          />

          <div className="rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-[var(--foreground)]">
                ترجمه خودکار بلافاصله پس از ثبت نهایی
              </div>
              <div className="text-xs text-[var(--foreground-muted)]">
                {status?.hasApiKeyConfigured
                  ? 'فعال به محض زدن تیک'
                  : 'به محض قرار دادن کلید Anthropic فعال می‌شود'}
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
            <span>نحوه فعال‌سازی کلید پولی Anthropic در سرور پس از تحویل سایت:</span>
          </div>
          <p className="leading-relaxed">
            کلید پولی هرگز در مرورگر یا کد کلاینت ذخیره نمی‌شود. تنها کافی است در تنظیمات محیطی سرور (`.env`) مقادیر زیر را ثبت کنید:
          </p>
          <pre
            dir="ltr"
            className="rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] p-3 font-mono text-[11px] text-[var(--foreground)] overflow-x-auto"
          >{`MAKAREMI_AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-api03-...
MAKAREMI_AI_MODEL=${selectedModel}
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
            <span>ذخیره تنظیمات موتور Claude</span>
          </button>

          <button
            type="button"
            disabled={testing}
            onClick={handleTestAnthropic}
            className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-medium)] hover:border-[var(--primary)] text-[var(--foreground)] font-bold text-xs"
          >
            {testing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            <span>آزمایش اتصال زنده کلید Anthropic</span>
          </button>
        </div>
      </section>

      {/* Manual Antigravity Translation Queue */}
      <section className="rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div>
            <h3 className="text-base font-extrabold text-[var(--foreground)]">
              صف ترجمه دستی فعلی و خروجی آماده برای ایجنت‌های آنتی‌گرویتی ({pendingQueue.length.toLocaleString('fa-IR')} مورد)
            </h3>
            <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
              آثاری که استاد با یک زبان ثبت کرده‌اند اینجا فهرست می‌شوند تا در صورت تمایل خروجی JSON آن‌ها را دریافت کرده و با ایجنت‌های آنتی‌گرویتی ترجمه و ثبت فرمایید.
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
