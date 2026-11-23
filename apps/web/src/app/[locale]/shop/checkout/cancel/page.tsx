import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { XCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { isValidLocale, type Locale } from '@/lib/i18n';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return {
    title:
      locale === 'fa'
        ? 'لغو مرحله پرداخت | دکتر حسن مکارمی'
        : locale === 'fr'
          ? 'Paiement annulé — Dr Hassan Makaremi'
          : 'Checkout Cancelled — Dr. Hassan Makaremi',
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutCancelPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  if (!isValidLocale(locale)) notFound();

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);

  return (
    <div className="max-w-xl mx-auto py-12 text-center space-y-5 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] p-8">
      <XCircle size={40} className="mx-auto text-amber-600" />
      <h1 className="text-2xl font-black text-[var(--foreground)]">
        {tx('فرآیند پرداخت لغو شد', 'Le paiement a été annulé', 'Payment Was Cancelled')}
      </h1>
      <p className="text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed">
        {tx(
          'هیچ مبلغی از حساب شما کسر نشده است. در هر زمان می‌توانید به گالری تملک آثار بازگردید یا از گزینه واریز بانکی SEPA استفاده نمایید.',
          'Aucun montant n’a été débité. Vous pouvez revenir à la boutique ou choisir le virement bancaire SEPA à tout moment.',
          'No charge was made. You may return to the shop or select SEPA wire transfer at any time.'
        )}
      </p>
      <Link
        href={`/${locale}/shop`}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold"
      >
        {isFa ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
        <span>{tx('بازگشت به گالری تملک آثار و فروشگاه', 'Retour à la Boutique & Éditions', 'Return to Shop & Editions')}</span>
      </Link>
    </div>
  );
}
