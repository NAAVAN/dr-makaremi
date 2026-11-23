import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { RotateCcw, ArrowLeft, ArrowRight } from 'lucide-react';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { buildTrilingualMetadata } from '@/lib/seo-helpers';
import { WithdrawalFormClient } from '@/components/commerce/WithdrawalFormClient';

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  return buildTrilingualMetadata({
    locale,
    path: '/legal/retractation',
    title: isFa
      ? 'انصراف از خرید (دکمه قانونی ۱۴ روزه فرانسه — Renoncer au contrat ici)'
      : isFr
        ? 'Renoncer au contrat ici — Exercice du droit de rétractation (Art. D.221-5)'
        : 'Withdraw from Contract — 14-Day French Online Withdrawal',
    description: isFa
      ? 'سامانه دو مرحله‌ای انصراف آنلاین از قرارداد فروش مطابق فرمان ۲۰۲۶-۲ و مصوبه ۲۰۲۶-۳ فرانسه با صدور فوری رسید تاریخ‌دار.'
      : isFr
        ? 'Fonctionnalité réglementaire en deux étapes permettant d’exercer votre droit légal de rétractation de 14 jours avec accusé de réception horodaté (Décret n° 2026-3).'
        : 'Two-step statutory French online withdrawal mechanism (Decree No. 2026-3) issuing an immediate timestamped confirmation receipt.',
    includeMarkdownTwin: false,
  });
}

export default async function RetractationPage({
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
    <div className="max-w-3xl mx-auto space-y-8">
      <nav aria-label={tx('راهنمای مسیر', 'Fil d’Ariane', 'Breadcrumb')} className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
        <Link href={`/${locale}/shop`} className="inline-flex items-center gap-1.5 font-bold hover:text-[var(--primary)]">
          {isFa ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          <span>{tx('بازگشت به گالری تملک آثار و فروشگاه', 'Retour à la Boutique', 'Back to Shop')}</span>
        </Link>
        <Link href={`/${locale}/legal/cgv`} className="font-bold hover:text-[var(--primary)]">
          {tx('مطالعه CGV', 'Lire les CGV', 'Read Terms (CGV)')}
        </Link>
      </nav>

      <header className="space-y-3 border-b border-[var(--border-subtle)] pb-6">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-amber-700 dark:text-amber-400 font-bold">
          <RotateCcw size={15} />
          <span>{tx('قانون حمایت از مصرف‌کننده فرانسه — Art. L.221-21 & D.221-5 (۲۰۲۶)', 'Code de la consommation • Art. L.221-21 & D.221-5 (Décret 2026-3)', 'French Consumer Code • Art. L.221-21 & D.221-5 (2026)')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
          {tx('انصراف از خرید (Renoncer au contrat ici)', 'Renoncer au contrat ici', 'Withdraw from Contract (14-Day Right)')}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed">
          {tx(
            'برای تمامی سفارش‌های کالاهای فیزیکی استاندارد (کتاب، چاپ شماره‌دار و آثار غیرسفارشی)، تا ۱۴ روز پس از تحویل می‌توانید بدون نیاز به ذکر دلیل، انصراف خود را در دو مرحله ساده ثبت کرده و رسید تاریخ‌دار دریافت نمایید.',
            'Pour toute commande de bien physique standard (livres, tirages, œuvres non personnalisées), vous pouvez exercer votre droit de rétractation sous 14 jours en deux étapes et obtenir immédiatement un accusé de réception horodaté.',
            'For eligible physical orders (books, prints, non-bespoke artworks), exercise your statutory 14-day withdrawal right in two simple steps and receive an instant timestamped confirmation.'
          )}
        </p>
      </header>

      <WithdrawalFormClient locale={locale} />
    </div>
  );
}
