'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Loader2,
  MessageSquareShare,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import type {
  AiEscalationSettings,
  AiKbSyncStatus,
  AiProfessorEscalation,
  AiSecurityAuditSummary,
} from '@makaremi/shared';

interface Props {
  onStatusBanner: (banner: { ok: boolean; text: string }) => void;
  onGoldenQaChanged?: () => void;
}

export function StudioEscalationAndSecurityPanel({ onStatusBanner, onGoldenQaChanged }: Props) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [syncStatus, setSyncStatus] = useState<AiKbSyncStatus | null>(null);
  const [security, setSecurity] = useState<AiSecurityAuditSummary | null>(null);
  const [settings, setSettings] = useState<AiEscalationSettings | null>(null);
  const [escalations, setEscalations] = useState<AiProfessorEscalation[]>([]);

  const [replyTicketCode, setReplyTicketCode] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [syncRes, secRes, escRes] = await Promise.all([
        fetch('/api/studio/ai-training/sync', { cache: 'no-store' }),
        fetch('/api/studio/ai-training/security', { cache: 'no-store' }),
        fetch('/api/studio/ai-training/escalations', { cache: 'no-store' }),
      ]);
      const [syncJson, secJson, escJson] = await Promise.all([
        syncRes.json().catch(() => ({})),
        secRes.json().catch(() => ({})),
        escRes.json().catch(() => ({})),
      ]);
      if (syncJson.ok && syncJson.status) setSyncStatus(syncJson.status);
      if (secJson.ok && secJson.summary) setSecurity(secJson.summary);
      if (escJson.ok) {
        if (escJson.settings) setSettings(escJson.settings);
        if (Array.isArray(escJson.escalations)) setEscalations(escJson.escalations);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleForceResync = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/studio/ai-training/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resync_all' }),
      });
      const json = await res.json();
      if (json.ok && json.status) {
        setSyncStatus(json.status);
        onStatusBanner({ ok: true, text: json.message || 'همگام‌سازی کامل پایگاه دانش انجام شد.' });
      } else {
        onStatusBanner({ ok: false, text: json.error || 'خطا در همگام‌سازی' });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateSettings = async (patch: Partial<AiEscalationSettings>) => {
    setBusy(true);
    try {
      const res = await fetch('/api/studio/ai-training/escalations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_settings', ...patch }),
      });
      const json = await res.json();
      if (json.ok && json.settings) {
        setSettings(json.settings);
        onStatusBanner({ ok: true, text: 'تنظیمات ارجاع سؤالات به تلگرام و واتساپ استاد ذخیره شد.' });
      } else {
        onStatusBanner({ ok: false, text: json.error || 'ذخیره تنظیمات ناموفق بود.' });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleReplyPublish = async (ticketCode: string) => {
    if (replyText.trim().length < 8) {
      onStatusBanner({ ok: false, text: 'لطفاً پاسخ کامل‌تری (حداقل ۸ نویسه) وارد فرمایید.' });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/studio/ai-training/escalations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply_and_publish',
          ticketCode,
          answerMarkdown: replyText.trim(),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setReplyTicketCode(null);
        setReplyText('');
        onStatusBanner({
          ok: true,
          text: `پاسخ استاد برای [${ticketCode}] با امضای دیجیتال Ed25519 در مغز دستیار هوشمند ثبت دائمی شد.`,
        });
        await loadAll();
        onGoldenQaChanged?.();
      } else {
        onStatusBanner({ ok: false, text: json.error || 'ثبت پاسخ ناموفق بود.' });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleApproveTicket = async (ticketCode: string) => {
    setBusy(true);
    try {
      const res = await fetch('/api/studio/ai-training/escalations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', ticketCode }),
      });
      const json = await res.json();
      if (json.ok) {
        onStatusBanner({ ok: true, text: `تیکت [${ticketCode}] تأیید و وارد مغز یادگیری دستیار شد.` });
        await loadAll();
        onGoldenQaChanged?.();
      } else {
        onStatusBanner({ ok: false, text: json.error || 'خطا در تأیید تیکت' });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDismissTicket = async (ticketCode: string) => {
    setBusy(true);
    try {
      const res = await fetch('/api/studio/ai-training/escalations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss', ticketCode }),
      });
      const json = await res.json();
      if (json.ok) {
        onStatusBanner({ ok: true, text: `تیکت [${ticketCode}] بایگانی شد.` });
        await loadAll();
      }
    } finally {
      setBusy(false);
    }
  };

  const handleTestPing = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/studio/ai-training/escalations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_ping', channel: 'both' }),
      });
      const json = await res.json();
      const tgOk = json.telegram?.sent;
      const waOk = json.whatsapp?.sent;
      onStatusBanner({
        ok: Boolean(tgOk || waOk),
        text:
          tgOk || waOk
            ? `پیام آزمایشی ارسال شد (تلگرام: ${tgOk ? 'موفق' : 'تنظیم‌نشده'} | واتساپ: ${waOk ? 'موفق' : 'تنظیم‌نشده'}).`
            : 'کلیدهای تلگرام و واتساپ هنوز در متغیرهای محیطی Vercel وارد نشده‌اند؛ صف یادگیری در پیشخوان فعال است.',
      });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-xs text-[var(--foreground-muted)] gap-2">
        <Loader2 size={16} className="animate-spin" />
        <span>در حال بارگذاری رادار همگام‌سازی خودکار، امنیت و صف ارجاع استاد...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. AUTO-INDEXING & KNOWLEDGE BASE COHERENCE RADAR */}
      <div className="rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-[var(--primary)]" />
            <div>
              <h3 className="text-sm font-extrabold text-[var(--foreground)]">
                رادار همگام‌سازی خودکار پایگاه دانش (تمام ۷ مسیر ثبت اثر و ویدیو)
              </h3>
              <p className="text-[11px] text-[var(--foreground-muted)]">
                هر اثر، ویدیو، زیرنویس، ترجمه، غنی‌سازی، کالای فروشگاه یا پاسخ استاد به محض ثبت در Neon Postgres و کل نمونه‌های دستیار همگام می‌شود.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={handleForceResync}
            className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold disabled:opacity-50"
          >
            <RefreshCw size={14} className={busy ? 'animate-spin' : ''} />
            <span>همگام‌سازی فوری</span>
          </button>
        </div>

        {syncStatus && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-center">
              <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-2.5">
                <div className="text-[10px] text-[var(--foreground-muted)]">نسخهٔ دانش</div>
                <div className="text-base font-extrabold text-[var(--primary)]">v{syncStatus.kbVersion}</div>
              </div>
              <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-2.5">
                <div className="text-[10px] text-[var(--foreground-muted)]">قطعات RAG</div>
                <div className="text-base font-extrabold text-[var(--foreground)]">
                  {syncStatus.counts.totalChunks.toLocaleString('fa-IR')}
                </div>
              </div>
              <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-2.5">
                <div className="text-[10px] text-[var(--foreground-muted)]">ویدیو / رونوشت</div>
                <div className="text-base font-extrabold text-[var(--foreground)]">
                  {syncStatus.counts.transcripts} / {syncStatus.counts.videos}
                </div>
              </div>
              <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-2.5">
                <div className="text-[10px] text-[var(--foreground-muted)]">پاسخ طلایی</div>
                <div className="text-base font-extrabold text-emerald-600">{syncStatus.counts.goldenQa}</div>
              </div>
              <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-2.5">
                <div className="text-[10px] text-[var(--foreground-muted)]">واژه‌نامه / فروشگاه</div>
                <div className="text-base font-extrabold text-[var(--foreground)]">
                  {syncStatus.counts.glossary} / {syncStatus.counts.commerce}
                </div>
              </div>
              <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-2.5">
                <div className="text-[10px] text-[var(--foreground-muted)]">آثار پویا Neon</div>
                <div className="text-base font-extrabold text-[var(--foreground)]">
                  {syncStatus.counts.dynamicWorks}
                </div>
              </div>
            </div>
            <div className="text-[11px] text-[var(--foreground-muted)] flex flex-wrap gap-x-4 gap-y-1">
              <span>مخزن: {syncStatus.storageMode === 'neon_postgres' ? 'Neon Postgres (دائمی)' : 'حالت محلی'}</span>
              <span>آخرین رویداد: {syncStatus.lastEventSummary || 'آماده'}</span>
              <span>آخرین به‌روزرسانی: {new Date(syncStatus.lastSyncedAt).toLocaleString('fa-IR')}</span>
            </div>
          </>
        )}
      </div>

      {/* 2. SECURITY & RISK SHIELD RADAR */}
      {security && (
        <div className="rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600" />
              <h3 className="text-sm font-extrabold text-[var(--foreground)]">
                سپر امنیت، ضدتزریق (Prompt Guard 2) و کنترل ریسک دستیار هوشمند
              </h3>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              {security.promptGuardMlEnabled ? 'سپر دوتایی (Regex + ML Prompt Guard) فعال' : 'سپر لایهٔ ۱ (Regex) فعال'}
            </span>
          </div>

          {(security.usingDefaultStudioFallback || security.usingDefaultEd25519Key) && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold">توصیهٔ امنیتی پیش از بهره‌برداری نهایی:</div>
                <p>
                  {security.usingDefaultStudioFallback
                    ? 'کلیدهای SUPER_ADMIN_SECRET و MAKAREMI_PROFESSOR_PIN روی مقدار پیش‌فرض توسعه هستند. برای امنیت حداکثری، یک گذرواژهٔ قوی در متغیرهای محیطی Vercel ثبت کنید. '
                    : ''}
                  {security.usingDefaultEd25519Key
                    ? 'کلید امضای دیجیتال MAKAREMI_SIGNING_KEY نیز باید در Vercel به کلید اختصاصی تولید منتقل شود.'
                    : ''}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-3">
              <div className="text-[10px] text-[var(--foreground-muted)]">تزریق پرامپت مسدودشده (۲۴ساعت)</div>
              <div className="text-lg font-extrabold text-[var(--foreground)]">{security.blockedInjections24h}</div>
            </div>
            <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-3">
              <div className="text-[10px] text-[var(--foreground-muted)]">وب‌هوک نامعتبر/تکراری (۲۴ساعت)</div>
              <div className="text-lg font-extrabold text-[var(--foreground)]">{security.blockedWebhookEvents24h}</div>
            </div>
            <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-3">
              <div className="text-[10px] text-[var(--foreground-muted)]">قفل ورود پیشخوان (۲۴ساعت)</div>
              <div className="text-lg font-extrabold text-[var(--foreground)]">{security.authLockouts24h}</div>
            </div>
            <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-3">
              <div className="text-[10px] text-[var(--foreground-muted)]">قفل Fail-Closed وب‌هوک‌ها</div>
              <div className="text-xs font-extrabold mt-1 text-emerald-600">
                {security.strictProductionActive ? 'Production قفل‌شده' : 'آماده (فعال در Production)'}
              </div>
            </div>
          </div>

          {security.recentEvents.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-[var(--foreground)]">آخرین رخدادهای ثبت‌شده در رادار امنیتی (بدون PII):</div>
              <div className="max-h-40 overflow-y-auto space-y-1.5">
                {security.recentEvents.slice(0, 6).map((evt) => (
                  <div
                    key={evt.id}
                    className="rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] px-3 py-2 text-[11px] flex flex-wrap items-center justify-between gap-2"
                  >
                    <span className="font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                      <ShieldAlert size={13} className="text-amber-600" />
                      {evt.eventType} — {evt.route}
                    </span>
                    <span className="text-[var(--foreground-muted)]">{evt.detailSanitized}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. TELEGRAM & WHATSAPP PROFESSOR ESCALATION & PERMANENT LEARNING LOOP */}
      <div className="rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MessageSquareShare size={18} className="text-[var(--primary)]" />
            <div>
              <h3 className="text-sm font-extrabold text-[var(--foreground)]">
                صف ارجاع سؤالات جدید به استاد (تلگرام، واتساپ و پیشخوان ← یادگیری دائمی)
              </h3>
              <p className="text-[11px] text-[var(--foreground-muted)]">
                سؤالات بدون سند به‌صورت خودکار وارد این صف می‌شوند؛ با اتصال توکن تلگرام/واتساپ، استاد می‌تواند با متن یا ویس پاسخ دهد و با یک ضربه در مغز دستیار ثبت دائمی کند.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={handleTestPing}
            className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] text-xs font-bold text-[var(--foreground)]"
          >
            <Send size={13} />
            <span>آزمایش اتصال تلگرام/واتساپ</span>
          </button>
        </div>

        {settings && (
          <div className="rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 space-y-3">
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span
                className={`px-2.5 py-1 rounded-full font-bold ${
                  settings.telegramConfigured
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                }`}
              >
                تلگرام: {settings.telegramConfigured ? 'متصل و آماده' : 'در انتظار کلید در Vercel'}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full font-bold ${
                  settings.whatsappConfigured
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                }`}
              >
                واتساپ: {settings.whatsappConfigured ? 'متصل و آماده' : 'در انتظار کلید در Vercel'}
              </span>
              <span className="px-2.5 py-1 rounded-full font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300">
                تأیید یک‌ضربه (متن و ویس): {settings.requireOneTapConfirmForText ? 'فعال' : 'خودکار'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label className="space-y-1">
                <span className="text-[11px] font-bold text-[var(--foreground-muted)]">الگوی ارسال به استاد</span>
                <select
                  value={settings.dispatchMode}
                  disabled={busy}
                  onChange={(e) =>
                    handleUpdateSettings({
                      dispatchMode: e.target.value as 'instant' | 'daily_digest',
                    })
                  }
                  className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-3 py-2 text-xs text-[var(--foreground)]"
                >
                  <option value="instant">ارسال آنی (با سقف روزانه)</option>
                  <option value="daily_digest">بستهٔ خلاصهٔ روزانه (Digest)</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-[11px] font-bold text-[var(--foreground-muted)]">سقف ارسال روزانه</span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  defaultValue={settings.dailyCap}
                  onBlur={(e) => handleUpdateSettings({ dailyCap: Number(e.target.value) || 5 })}
                  className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-3 py-2 text-xs text-[var(--foreground)]"
                />
              </label>

              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-xs font-bold text-[var(--foreground)] cursor-pointer py-2">
                  <input
                    type="checkbox"
                    checked={settings.requireOneTapConfirmForText}
                    onChange={(e) =>
                      handleUpdateSettings({
                        requireOneTapConfirmForText: e.target.checked,
                        requireOneTapConfirmForVoice: true,
                      })
                    }
                  />
                  <span>الزام تأیید یک‌ضربه پیش از ثبت دائمی</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Escalation Tickets List */}
        {escalations.length === 0 ? (
          <p className="text-xs text-[var(--foreground-muted)] rounded-xl bg-[var(--surface-card)] p-4">
            هنوز پرسش بی‌پاسخ جدیدی در صف ارجاع استاد ثبت نشده است. به‌محض طرح پرسش جدیدی خارج از آرشیو توسط پژوهشگران، تیکت آن با کد اختصاصی `[Q-XXXX]` اینجا ظاهر و به تلگرام/واتساپ ارسال می‌شود.
          </p>
        ) : (
          <div className="space-y-2.5">
            {escalations.slice(0, 20).map((item) => (
              <div
                key={item.id}
                className="rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-[var(--primary)]/15 text-[var(--primary)]">
                      {item.ticketCode}
                    </span>
                    <span className="text-xs font-bold text-[var(--foreground)]">{item.questionText}</span>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--surface-sunken)] text-[var(--foreground-muted)]">
                    {item.status === 'published_to_brain'
                      ? '✅ ثبت‌شده در مغز دستیار'
                      : item.status === 'answered_draft'
                        ? '📝 در انتظار تأیید یک‌ضربه'
                        : item.status === 'sent'
                          ? '📤 ارسال‌شده به استاد'
                          : item.status === 'dismissed'
                            ? 'بایگانی‌شده'
                            : '⏳ در صف پیشخوان'}
                  </span>
                </div>

                {item.professorReplyNormalized && (
                  <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3 text-xs text-[var(--foreground)] whitespace-pre-wrap">
                    <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                      پاسخ نرمال‌سازی‌شدهٔ استاد ({item.professorReplyChannel || 'پیشخوان'}):
                    </div>
                    {item.professorReplyNormalized}
                  </div>
                )}

                {item.status !== 'published_to_brain' && item.status !== 'dismissed' && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {item.status === 'answered_draft' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleApproveTicket(item.ticketCode)}
                        className="min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                      >
                        <CheckCircle2 size={13} />
                        <span>تأیید و ثبت دائمی در مغز دستیار</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTicketCode(replyTicketCode === item.ticketCode ? null : item.ticketCode);
                        setReplyText(item.professorReplyNormalized || '');
                      }}
                      className="min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold"
                    >
                      <span>پاسخ مستقیم از پیشخوان</span>
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDismissTicket(item.ticketCode)}
                      className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] text-xs text-[var(--foreground-muted)]"
                    >
                      <XCircle size={13} />
                      <span>بایگانی</span>
                    </button>
                  </div>
                )}

                {replyTicketCode === item.ticketCode && (
                  <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="پاسخ علمی استاد را بنویسید تا با نرمالایزر فارسی/لکانی و امضای Ed25519 فوراً وارد پایگاه دانش دستیار شود..."
                      className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] p-3 text-xs text-[var(--foreground)]"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleReplyPublish(item.ticketCode)}
                      className="min-h-[36px] px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                    >
                      ذخیره و آموزش دائمی دستیار
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
