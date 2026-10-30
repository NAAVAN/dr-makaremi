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
            : 'Inscription réussie. Les textes intégraux vous seront adressés par courriel.'
        );
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || (isFa ? 'خطا در ثبت ایمیل. لطفاً مجدداً تلاش کنید.' : 'Erreur d’inscription.'));
      }
    } catch {
      setStatus('error');
      setMessage(isFa ? 'خطای ارتباط با سرور.' : 'Erreur de connexion.');
    }
  };

  return (
    <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/5 to-slate-500/5 dark:from-sky-950/20 dark:to-slate-900/40 p-6 md:p-8 text-slate-800 dark:text-slate-200">
      <div className="max-w-xl mx-auto space-y-4 text-center">
        <div className="inline-flex p-3 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 mb-1">
          <Mail size={24} />
        </div>
        <h3 className="text-xl md:text-2xl font-bold font-serif">
          {isFa ? 'خبرنامه تمام‌متن ضدسانسور' : 'Lettre d’information intégrale anti-censure'}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {isFa
            ? 'در صورت مسدودسازی وب‌سایت در ایران، متن کامل مقالات، یادداشت‌ها و بیانیه‌های دکتر حسن مکارمی (بدون نیاز به کلیک روی لینک یا فیلترشکن) مستقیماً به صندوق ایمیل شما ارسال می‌شود.'
            : 'Recevez le texte intégral des publications et déclarations du Dr Makaremi directement dans votre boîte de réception, sans dépendance aux liens Web.'}
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
                placeholder={isFa ? 'آدرس ایمیل خود را وارد کنید...' : 'Votre adresse email...'}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm placeholder:text-slate-400"
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
                className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-medium text-sm transition-colors shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                {status === 'loading' && <Loader2 size={16} className="animate-spin" />}
                <span>{isFa ? 'عضویت آزاد' : 'S’inscrire'}</span>
              </button>
            </div>

            {status === 'error' && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle size={14} />
                <span>{message}</span>
              </div>
            )}

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck size={13} className="text-emerald-500" />
              <span>
                {isFa ? 'حریم خصوصی امن: ایمیل‌ها به صورت رمزنگاری‌شده نگهداری می‌شوند.' : 'Confidentialité garantie.'}
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
