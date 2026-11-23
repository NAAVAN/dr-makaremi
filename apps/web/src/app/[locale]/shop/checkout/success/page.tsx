import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CheckCircle2, Landmark, Download, ShieldCheck, RotateCcw, ArrowLeft, ArrowRight } from 'lucide-react';
import { isValidLocale, type Locale } from '@/lib/i18n';
import { getCommerceLegalConfig, getCommerceOrderByNumber } from '@/lib/commerce/store';
import { formatEur } from '@/lib/commerce/rules';

export const dynamic = 'force-dynamic';

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
        ? 'تأیید سفارش و فاکتور رسمی | دکتر حسن مکارمی'
        : locale === 'fr'
          ? 'Confirmation de commande & Facture — Dr Hassan Makaremi'
          : 'Order Confirmation & Invoice — Dr. Hassan Makaremi',
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  if (!isValidLocale(locale)) notFound();

  const { order: orderParam } = await searchParams;
  const order = orderParam ? getCommerceOrderByNumber(orderParam) : null;
  const legalConfig = getCommerceLegalConfig();

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="rounded-3xl bg-emerald-500/5 border-2 border-emerald-500/30 p-6 sm:p-8 space-y-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={28} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)]">
              {order?.status === 'awaiting_sepa_transfer'
                ? tx('سفارش شما ثبت و پیش‌فاکتور SEPA صادر شد', 'Commande enregistrée — Facture pro forma SEPA émise', 'Order Reserved — SEPA Pro Forma Issued')
                : tx('سفارش شما با موفقیت ثبت شد', 'Merci — Votre commande est confirmée', 'Thank You — Your Order Is Confirmed')}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
              {tx(
                'اطلاعات کامل فاکتور مطابق مقررات فرانسه در زیر درج شده است.',
                'Retrouvez ci-dessous votre récapitulatif et votre numéro de facture conforme à la législation française.',
                'Below are your French-law compliant order and invoice details.'
              )}
            </p>
          </div>
        </div>

        {order ? (
          <div className="space-y-5">
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs">
              <div>
                <dt className="text-[var(--foreground-muted)]">{tx('شماره سفارش:', 'Commande :', 'Order:')}</dt>
                <dd className="font-mono font-black text-[var(--primary)]">{order.orderNumber}</dd>
              </div>
              <div>
                <dt className="text-[var(--foreground-muted)]">{tx('شماره فاکتور رسمی:', 'N° Facture :', 'Invoice No.:')}</dt>
                <dd className="font-mono font-bold text-[var(--foreground)]">{order.invoiceNumber}</dd>
              </div>
              <div>
                <dt className="text-[var(--foreground-muted)]">{tx('مبلغ نهایی:', 'Total TTC :', 'Total:')}</dt>
                <dd className="font-mono font-black text-[var(--foreground)]">{formatEur(order.quote.totalCents, locale)}</dd>
              </div>
            </dl>

            {/* SEPA Wire Instructions Box */}
            {order.status === 'awaiting_sepa_transfer' && (
              <div className="p-5 rounded-2xl bg-[var(--surface-card)] border border-amber-500/40 space-y-3 text-xs">
                <div className="flex items-center gap-2 font-extrabold text-amber-800 dark:text-amber-300">
                  <Landmark size={16} />
                  <span>{tx('مشخصات واریز بانکی SEPA (کارمزد ۰٪)', 'Coordonnées de virement bancaire SEPA (0 % frais)', 'SEPA Bank Wire Transfer Details (0% Fee)')}</span>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono">
                  <div>
                    <dt className="text-[var(--foreground-muted)] font-sans">{tx('دارنده حساب:', 'Titulaire :', 'Account Holder:')}</dt>
                    <dd className="font-bold">{legalConfig.sepaAccountHolder}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--foreground-muted)] font-sans">{tx('بانک:', 'Banque :', 'Bank:')}</dt>
                    <dd className="font-bold">{legalConfig.sepaBankName}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-[var(--foreground-muted)] font-sans">IBAN:</dt>
                    <dd className="font-black text-[var(--primary)]">{legalConfig.sepaIban}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--foreground-muted)] font-sans">BIC / SWIFT:</dt>
                    <dd className="font-bold">{legalConfig.sepaBic}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--foreground-muted)] font-sans">{tx('شناسه اجباری شرح واریز:', 'Motif obligatoire :', 'Required Payment Reference:')}</dt>
                    <dd className="font-black text-emerald-700 dark:text-emerald-400">{order.orderNumber}</dd>
                  </div>
                </dl>
                <p className="text-[11px] text-[var(--foreground-muted)] leading-relaxed">
                  {tx(
                    'به‌محض تأیید واریز SEPA در پیشخوان استاد، گواهی اصالت رمزنگاری‌شده Ed25519 و لینک دانلود فایل‌ها فعال و مرسوله از پاریس ارسال می‌شود.',
                    'Dès réception de votre virement SEPA, votre certificat d’authenticité Ed25519 (et vos liens numériques le cas échéant) seront activés et l’expédition depuis Paris lancée.',
                    'Upon SEPA settlement confirmation in Paris, your Ed25519 Certificate of Authenticity (and any digital links) will be issued and shipping initiated.'
                  )}
                </p>
              </div>
            )}

            {/* Order Items */}
            <div className="p-4 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-2.5 text-xs">
              {order.quote.lines.map((line) => (
                <div key={line.sku} className="flex items-center justify-between gap-3 py-1.5 border-b last:border-0 border-[var(--border-subtle)]">
                  <div>
                    <p className="font-bold text-[var(--foreground)]">{line.title[locale]}</p>
                    <span className="text-[10px] font-mono text-[var(--foreground-muted)]">
                      {line.sku} × {line.quantity}
                    </span>
                  </div>
                  <span className="font-mono font-bold tabular-nums">{formatEur(line.lineSubtotalCents, locale)}</span>
                </div>
              ))}
              <p className="text-[10px] font-mono text-[var(--foreground-muted)] pt-1">{order.quote.taxNoticeFr}</p>
            </div>

            {/* Instant Digital Downloads (when paid) */}
            {order.downloadTokens.length > 0 && (
              <div className="p-4 rounded-2xl bg-[var(--surface-card)] border border-teal-500/35 space-y-3">
                <span className="text-xs font-extrabold text-[var(--primary)] block">
                  {tx('دانلود امن نسخه‌های دیجیتال (اعتبار ۷۲ ساعته):', 'Téléchargements sécurisés (valables 72h) :', 'Secure Digital Downloads (72h window):')}
                </span>
                <div className="flex flex-wrap gap-2">
                  {order.downloadTokens.map((dt) => (
                    <a
                      key={dt.token}
                      href={`/api/commerce/downloads/${dt.token}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold"
                    >
                      <Download size={14} />
                      <span>{dt.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Ed25519 Authenticity Certificates (when issued) */}
            {order.certificateIds.length > 0 && (
              <div className="p-4 rounded-2xl bg-[var(--surface-card)] border border-emerald-500/35 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck size={15} />
                  <span>{tx('گواهی‌های اصالت رمزنگاری‌شده (Décret Marcus + Ed25519):', 'Certificats d’authenticité Décret Marcus + Ed25519 :', 'Décret Marcus + Ed25519 Authenticity Certificates:')}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {order.certificateIds.map((cid) => (
                    <Link
                      key={cid}
                      href={`/${locale}/verify/${cid}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-mono font-bold"
                    >
                      <ShieldCheck size={13} />
                      <span>{cid}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-[var(--foreground-muted)]">
            {tx('در صورت تکمیل پرداخت، جزئیات کامل فاکتور به پست الکترونیک شما ارسال می‌شود.', 'Votre facture détaillée vous est transmise par e-mail.', 'Your detailed invoice is dispatched by email.')}
          </p>
        )}

        <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-xs">
          <Link href={`/${locale}/shop`} className="inline-flex items-center gap-1.5 font-bold text-[var(--primary)] hover:underline">
            {isFa ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
            <span>{tx('بازگشت به گالری تملک آثار', 'Retour à la Boutique', 'Back to Shop')}</span>
          </Link>

          <Link
            href={`/${locale}/legal/retractation`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-card)] border border-amber-500/40 text-amber-800 dark:text-amber-300 font-bold"
          >
            <RotateCcw size={12} />
            <span>{tx('انصراف از خرید (قانون ۱۴ روزه فرانسه)', 'Renoncer au contrat ici', '14-Day Withdrawal')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
