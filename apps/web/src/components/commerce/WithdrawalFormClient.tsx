'use client';

import React, { useState } from 'react';
import { RotateCcw, CheckCircle2, AlertTriangle, Printer, ShieldCheck } from 'lucide-react';
import type { CommerceWithdrawalRequest, Locale } from '@makaremi/shared';

interface WithdrawalFormClientProps {
  locale: Locale;
}

export function WithdrawalFormClient({ locale }: WithdrawalFormClientProps) {
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);

  const [step, setStep] = useState<'form' | 'confirm' | 'done'>('form');
  const [orderNumber, setOrderNumber] = useState('');
  const [customerFullName, setCustomerFullName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<CommerceWithdrawalRequest | null>(null);

  const handleProceedConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!orderNumber.trim() || !customerFullName.trim() || !customerEmail.includes('@')) {
      setError(
        tx(
          'لطفاً شماره سفارش، نام کامل و ایمیل معتبر خود را وارد کنید.',
          'Veuillez renseigner le numéro de commande, votre nom complet et une adresse e-mail valide.',
          'Please enter your order number, full name, and a valid email address.'
        )
      );
      return;
    }
    setStep('confirm');
  };

  const handleConfirmWithdrawal = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/commerce/withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          customerFullName: customerFullName.trim(),
          customerEmail: customerEmail.trim(),
          reason: reason.trim() || undefined,
          confirmedStepTwo: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || tx('ثبت درخواست با خطا مواجه شد.', 'Échec de l’enregistrement.', 'Failed to record withdrawal.'));
        setSubmitting(false);
        return;
      }
      setReceipt(data.withdrawal);
      setStep('done');
    } catch {
      setError(tx('خطا در ارتباط با سرور.', 'Erreur de connexion au serveur.', 'Server connection error.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'done' && receipt) {
    return (
      <div className="rounded-3xl bg-emerald-500/5 border-2 border-emerald-500/30 p-6 sm:p-8 space-y-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={26} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-xl font-black text-[var(--foreground)]">
              {tx(
                'رسید رسمی تاریخ‌دار ثبت انصراف از خرید (Accusé de réception horodaté)',
                'Accusé de réception horodaté — Rétractation enregistrée',
                'Timestamped Withdrawal Confirmation Receipt'
              )}
            </h2>
            <p className="text-xs text-[var(--foreground-muted)]">
              {tx(
                'مطابق ماده D.221-5 قانون حمایت از مصرف‌کننده فرانسه (مصوبه ۲۰۲۶-۳)، درخواست شما با تاریخ و ساعت دقیق ثبت شد.',
                'Conformément à l’article D.221-5 du Code de la consommation (Décret n° 2026-3), votre demande a été horodatée.',
                'Recorded with durable UTC timestamp pursuant to French Consumer Code Art. D.221-5 (Decree No. 2026-3).'
              )}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs">
          <div>
            <dt className="text-[var(--foreground-muted)]">{tx('کد پیگیری انصراف:', 'Référence :', 'Reference Code:')}</dt>
            <dd className="font-mono font-black text-[var(--primary)]">{receipt.referenceCode}</dd>
          </div>
          <div>
            <dt className="text-[var(--foreground-muted)]">{tx('شماره سفارش:', 'Commande :', 'Order Number:')}</dt>
            <dd className="font-mono font-bold text-[var(--foreground)]">{receipt.orderNumber}</dd>
          </div>
          <div>
            <dt className="text-[var(--foreground-muted)]">{tx('تاریخ و ساعت ثبت (UTC):', 'Horodatage exact (UTC) :', 'Exact Timestamp (UTC):')}</dt>
            <dd className="font-mono font-bold text-[var(--foreground)]">{receipt.confirmedAt}</dd>
          </div>
          <div>
            <dt className="text-[var(--foreground-muted)]">{tx('نام و ایمیل:', 'Client :', 'Customer:')}</dt>
            <dd className="font-bold text-[var(--foreground)]">{receipt.customerFullName} ({receipt.customerEmail})</dd>
          </div>
        </dl>

        <p className="text-xs text-[var(--foreground)] leading-relaxed p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)]">
          {receipt.legalBasisNoteFr}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold cursor-pointer"
          >
            <Printer size={14} />
            <span>{tx('چاپ / ذخیره PDF رسید تاریخ‌دار', 'Imprimer / Enregistrer l’accusé (PDF)', 'Print / Save Timestamped Receipt')}</span>
          </button>
          <span className="text-[11px] text-[var(--foreground-muted)]">
            {receipt.receiptEmailSent
              ? tx('نسخه ایمیل نیز به نشانی شما ارسال شد.', 'Une copie a également été envoyée par e-mail.', 'A copy was also dispatched to your email.')
              : tx('لطفاً این رسید تاریخ‌دار را چاپ یا ذخیره فرمایید.', 'Conservez ou imprimez cet accusé sur support durable.', 'Please save or print this durable receipt.')}
          </span>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="rounded-3xl bg-amber-500/5 border-2 border-amber-500/40 p-6 sm:p-8 space-y-6">
        <div className="flex items-start gap-3">
          <AlertTriangle size={24} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-black text-[var(--foreground)]">
              {tx('مرحله ۲ از ۲ — تأیید نهایی انصراف از قرارداد', 'Étape 2 / 2 — Confirmer votre rétractation', 'Step 2 of 2 — Confirm Your Withdrawal')}
            </h2>
            <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
              {tx(
                'لطفاً مشخصات زیر را بازبینی کرده و دکمه «تأیید قطعی انصراف» را فشار دهید تا رسید قانونی تاریخ‌دار صادر شود.',
                'Veuillez vérifier vos informations ci-dessous puis cliquer sur « Confirmer la rétractation » pour déclencher votre accusé de réception horodaté.',
                'Please review your details below and click "Confirm Withdrawal" to receive your immediate timestamped receipt.'
              )}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs">
          <div>
            <dt className="text-[var(--foreground-muted)]">{tx('شماره سفارش:', 'Numéro de commande :', 'Order Number:')}</dt>
            <dd className="font-mono font-bold text-[var(--foreground)]">{orderNumber.toUpperCase()}</dd>
          </div>
          <div>
            <dt className="text-[var(--foreground-muted)]">{tx('نام کامل:', 'Nom et prénom :', 'Full Name:')}</dt>
            <dd className="font-bold text-[var(--foreground)]">{customerFullName}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[var(--foreground-muted)]">{tx('پست الکترونیک دریافت رسید:', 'E-mail de réception :', 'Receipt Email:')}</dt>
            <dd className="font-mono font-bold text-[var(--foreground)]">{customerEmail}</dd>
          </div>
        </dl>

        {error && (
          <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-bold text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={handleConfirmWithdrawal}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs sm:text-sm font-black shadow-md cursor-pointer"
          >
            <RotateCcw size={15} />
            <span>
              {submitting
                ? tx('در حال ثبت...', 'Enregistrement...', 'Submitting...')
                : tx('تأیید قطعی انصراف (Confirmer la rétractation)', 'Confirmer la rétractation', 'Confirm Withdrawal')}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStep('form')}
            className="px-4 py-3 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--foreground)] hover:border-[var(--primary)] cursor-pointer"
          >
            {tx('بازگشت و ویرایش', 'Modifier', 'Back & Edit')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleProceedConfirm} className="rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-6 sm:p-8 space-y-5">
      <div className="flex items-center gap-2 text-xs font-mono uppercase text-[var(--primary)] font-bold">
        <ShieldCheck size={15} />
        <span>{tx('مرحله ۱ از ۲ — اعلام انصراف از سفارش', 'Étape 1 / 2 — Déclaration de rétractation', 'Step 1 of 2 — Withdrawal Declaration')}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="withdrawal-order-number" className="block text-xs font-bold text-[var(--foreground)]">
            {tx('شماره سفارش (مثلاً MKM-2026-0001) *', 'Numéro de commande (ex. MKM-2026-0001) *', 'Order Number (e.g. MKM-2026-0001) *')}
          </label>
          <input
            id="withdrawal-order-number"
            type="text"
            required
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="MKM-2026-0001"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="withdrawal-full-name" className="block text-xs font-bold text-[var(--foreground)]">
            {tx('نام و نام خانوادگی خریدار *', 'Nom et prénom *', 'Buyer Full Name *')}
          </label>
          <input
            id="withdrawal-full-name"
            type="text"
            required
            value={customerFullName}
            onChange={(e) => setCustomerFullName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <label htmlFor="withdrawal-email" className="block text-xs font-bold text-[var(--foreground)]">
            {tx('پست الکترونیک جهت دریافت رسید تاریخ‌دار *', 'Adresse e-mail pour l’accusé horodaté *', 'Email for Timestamped Receipt *')}
          </label>
          <input
            id="withdrawal-email"
            type="email"
            required
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <label htmlFor="withdrawal-reason" className="block text-xs font-bold text-[var(--foreground)]">
            {tx('توضیح اختیاری (بیان دلیل طبق قانون اجباری نیست)', 'Motif facultatif (aucune justification requise par la loi)', 'Optional Note (no justification required by law)')}
          </label>
          <textarea
            id="withdrawal-reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-bold text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <button
        type="submit"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs sm:text-sm font-black shadow-md hover:opacity-95 transition-opacity cursor-pointer"
      >
        <RotateCcw size={15} />
        <span>{tx('ادامه به مرحله تأیید انصراف (Renoncer au contrat ici)', 'Renoncer au contrat ici — Continuer', 'Withdraw from Contract — Continue')}</span>
      </button>
    </form>
  );
}
