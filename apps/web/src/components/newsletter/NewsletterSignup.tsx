'use client';

import React, { useState } from 'react';
import { Mail, Check, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import type { Locale } from '@makaremi/shared';

interface NewsletterSignupProps {
  locale: Locale;
}

export function NewsletterSignup({ locale }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [hpFax, setHpFax] = useState(''); // Honeypot field
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          locale,
          hp_fax_number: hpFax,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
        setMessage(
          isFa
            ? 'اشتراک شما با موفقیت ثبت شد. متن کامل مقالات جدید مستقیماً به ایمیل شما ارسال خواهد شد.'
            : isFr
              ? 'Inscription réussie. Les textes intégraux vous seront adressés par courriel.'
              : 'Subscription confirmed. Full-text publications will be delivered directly to your inbox.'
        );
        setEmail('');
      } else {
        setStatus('error');
        setMessage(
          data.error ||
            (isFa
              ? 'خطا در ثبت ایمیل. لطفاً مجدداً تلاش کنید.'
              : isFr
                ? 'Erreur d’inscription. Veuillez réessayer.'
                : 'Subscription failed. Please try again.')
        );
      }
    } catch {
      setStatus('error');
      setMessage(
        isFa ? 'خطای ارتباط با سرور.' : isFr ? 'Erreur de connexion.' : 'Server connection error.'
      );
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 md:p-8 text-[var(--foreground)] shadow-[var(--shadow-sm)]">
      <div className="max-w-xl mx-auto space-y-4 text-center">
        <div className="inline-flex p-3 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--primary)] mb-1">
          <Mail size={24} />
        </div>
        <h3 className="font-display text-xl md:text-2xl font-bold">
          {isFa
            ? 'خبرنامه تمام‌متن ضدسانسور'
            : isFr
              ? 'Lettre d’information intégrale anti-censure'
              : 'Censorship-Resistant Full-Text Dispatch'}
        </h3>
        <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
          {isFa
            ? 'در صورت مسدودسازی وب‌سایت در ایران، متن کامل مقالات، یادداشت‌ها و بیانیه‌های دکتر حسن مکارمی (بدون نیاز به کلیک روی لینک یا فیلترشکن) مستقیماً به صندوق ایمیل شما ارسال می‌شود.'
            : isFr
              ? 'Recevez le texte intégral des publications et déclarations du Dr Makaremi directement dans votre boîte de réception, sans dépendance aux liens Web.'
              : 'Receive the full text of Dr Hassan Makaremi’s essays and public statements directly by email, ensuring uninterrupted reading without relying on external web links.'}
        </p>

        {status === 'success' ? (
          <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-sm font-medium">
            <Check size={18} className="shrink-0" />
            <span>{message}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  isFa
                    ? 'آدرس ایمیل خود را وارد کنید...'
                    : isFr
                      ? 'Votre adresse courriel...'
                      : 'Enter your email address...'
                }
                aria-label={isFa ? 'آدرس ایمیل' : isFr ? 'Adresse courriel' : 'Email address'}
                className="flex-1 px-4 py-3 rounded-xl border border-[var(--border-medium)] bg-[var(--surface-canvas)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
              />

              {/* Honeypot field - invisible to humans, traps bots */}
              <input
                type="text"
                name="hp_fax_number"
                value={hpFax}
                onChange={(e) => setHpFax(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ display: 'none', position: 'absolute', left: '-9999px' }}
              />

              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-6 py-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50 text-[var(--primary-foreground)] font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                {status === 'loading' && <Loader2 size={16} className="animate-spin" />}
                <span>{isFa ? 'عضویت آزاد' : isFr ? 'S’inscrire' : 'Subscribe'}</span>
              </button>
            </div>

            {status === 'error' && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle size={14} />
                <span>{message}</span>
              </div>
            )}

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--foreground-muted)]">
              <ShieldCheck size={13} className="text-[var(--primary)]" />
              <span>
                {isFa
                  ? 'حریم خصوصی امن: ایمیل‌ها به صورت رمزنگاری‌شده نگهداری می‌شوند.'
                  : isFr
                    ? 'Confidentialité garantie : adresses chiffrées.'
                    : 'Privacy protected: email addresses are stored encrypted.'}
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
