import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Lock, ArrowLeft, ArrowRight } from 'lucide-react';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { buildTrilingualMetadata } from '@/lib/seo-helpers';
import { getCommerceLegalConfig } from '@/lib/commerce/store';
import { DestinationLinkButton } from '@/components/common/DestinationLinkButton';

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
    path: '/legal/confidentialite',
    title: isFa
      ? 'سیاست حریم خصوصی و حفاظت از داده‌ها (RGPD / CNIL)'
      : isFr
        ? 'Politique de confidentialité & RGPD — Dr Hassan Makaremi'
        : 'Privacy Policy (EU GDPR / French CNIL) — Dr. Hassan Makaremi',
    description: isFa
      ? 'سیاست شفاف حفاظت از داده‌های شخصی، پرداخت‌های امن Stripe، نگهداری ۱۰ ساله اسناد حسابداری فرانسه و حقوق کاربران تحت مقررات RGPD.'
      : isFr
        ? 'Protection des données personnelles conforme au RGPD et à la CNIL : commandes, facturation (conservation légale 10 ans), paiement Stripe et droits d’accès.'
        : 'GDPR and French CNIL privacy policy covering e-commerce orders, Stripe payments, 10-year French invoice retention, and data subject rights.',
    includeMarkdownTwin: false,
  });
}

export default async function ConfidentialitePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  if (!isValidLocale(locale)) notFound();

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);
  const cfg = await getCommerceLegalConfig();

  return (
    <article className="max-w-4xl mx-auto space-y-10">
      <nav aria-label={tx('راهنمای مسیر', 'Fil d’Ariane', 'Breadcrumb')} className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
        <Link href={`/${locale}/shop`} className="inline-flex items-center gap-1.5 font-bold hover:text-[var(--primary)]">
          {isFa ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          <span>{tx('بازگشت به گالری تملک آثار و فروشگاه', 'Retour à la Boutique', 'Back to Shop')}</span>
        </Link>
        <Link href={`/${locale}/legal/cgv`} className="font-bold hover:text-[var(--primary)]">
          {tx('شرایط عمومی فروش (CGV)', 'Voir les CGV', 'View CGV')}
        </Link>
      </nav>

      <header className="space-y-4 border-b border-[var(--border-subtle)] pb-6">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-[var(--primary)] font-bold">
          <Lock size={16} />
          <span>{tx('مقررات حفاظت از داده‌های اروپا (RGPD / CNIL)', 'RGPD (UE) 2016/679 • CNIL France', 'EU GDPR 2016/679 • CNIL France')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
          {tx('سیاست حریم خصوصی و حفاظت از داده‌ها (RGPD)', 'Politique de confidentialité & Données personnelles', 'Privacy Policy & Data Protection (GDPR)')}
        </h1>
      </header>

      <div className="space-y-5 text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed">
        <section className="p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-2">
          <h2 className="text-base font-extrabold text-[var(--foreground)]">
            {tx('۱. مسئول پردازش داده‌ها و هدف جمع‌آوری', '1. Responsable de traitement & Finalités', '1. Data Controller & Purposes')}
          </h2>
          <p>
            {tx(
              `مسئول پردازش داده‌ها ${cfg.sellerName} (${cfg.postalCodeCity}، فرانسه — ${cfg.email}) است. اطلاعات شما (نام، ایمیل، نشانی ارسال) صرفاً برای پردازش سفارش، ارسال آثار، صدور فاکتور قانونی فرانسه، صدور گواهی اصالت و رسیدگی به درخواست‌های انصراف از خرید استفاده می‌شود.`,
              `Les données personnelles sont traitées par ${cfg.sellerName} (${cfg.postalCodeCity}, ${cfg.email}) exclusivement pour l’exécution des commandes, l’expédition des œuvres et livres, la facturation légale, l’émission des certificats d’authenticité et la gestion du droit de rétractation.`,
              `Personal data is processed by ${cfg.sellerName} (${cfg.postalCodeCity}, ${cfg.email}) strictly for order fulfillment, insured shipping, French statutory invoicing, authenticity certificates, and withdrawal handling.`
            )}
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-2">
          <h2 className="text-base font-extrabold text-[var(--foreground)]">
            {tx('۲. امنیت پرداخت و کوکی‌های حداقلی (Zero Tracking)', '2. Sécurité des paiements & Cookies strictement nécessaires', '2. Payment Security & Minimal Cookies')}
          </h2>
          <p>
            {tx(
              'اطلاعات کارت بانکی شما هرگز روی سرورهای makaremi.com ذخیره یا مشاهده نمی‌شود؛ کل فرآیند پرداخت کارتی مستقیماً روی صفحه رمزنگاری‌شده Stripe France (دارای گواهی PCI-DSS سطح ۱) انجام می‌پذیرد. وب‌سایت از هیچ کوکی تبلیغاتی یا ردیاب شخص ثالث استفاده نمی‌کند و سبد تملک صرفاً به‌صورت محلی در مرورگر شما ذخیره می‌شود.',
              'Aucune donnée de carte bancaire ne transite ni n’est stockée sur makaremi.com : les paiements par carte sont traités exclusivement sur les pages chiffrées de Stripe (certifié PCI-DSS Niveau 1). Le site n’utilise aucun cookie publicitaire tiers ; seul le stockage local strictement nécessaire au panier est employé.',
              'No card numbers ever touch or are stored on makaremi.com; card transactions occur exclusively on PCI-DSS Level 1 Stripe Checkout pages. No third-party ad tracking cookies are used.'
            )}
          </p>
        </section>

        <section className="p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-2">
          <h2 className="text-base font-extrabold text-[var(--foreground)]">
            {tx('۳. مدت نگهداری اسناد و حقوق شما (CNIL)', '3. Durée de conservation & Vos droits (RGPD / CNIL)', '3. Retention Period & Your Rights (GDPR / CNIL)')}
          </h2>
          <p>
            {tx(
              'مطابق ماده L.123-22 قانون تجارت فرانسه، فاکتورها و اسناد حسابداری به مدت ۱۰ سال نگهداری می‌شوند. شما در هر زمان حق دسترسی، اصلاح، محدودسازی یا حذف داده‌های غیرالزامی خود را از طریق مکاتبه با contact@makaremi.com و همچنین حق طرح شکایت نزد نهاد نظارتی فرانسه (CNIL) دارید.',
              'Conformément à l’article L.123-22 du Code de commerce, les factures et pièces comptables sont conservées 10 ans. Vous disposez des droits d’accès, de rectification, d’effacement et de portabilité en écrivant à contact@makaremi.com, ainsi que du droit d’introduire une réclamation auprès de la CNIL.',
              'Under Art. L.123-22 of the French Commercial Code, invoices are retained for 10 years. You may exercise your GDPR rights of access, rectification, or erasure by writing to contact@makaremi.com, or lodge a complaint with the French CNIL.'
            )}
          </p>
          <div className="pt-2">
            <DestinationLinkButton
              href="https://www.cnil.fr"
              locale={locale}
              label={tx('وب‌سایت رسمی CNIL فرانسه', 'Site officiel de la CNIL', 'Official French CNIL Website')}
              compact
            />
          </div>
        </section>
      </div>
    </article>
  );
}
