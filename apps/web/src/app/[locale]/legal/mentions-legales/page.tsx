import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Scale, Building2, Server, ShieldCheck, ArrowLeft, ArrowRight, FileText } from 'lucide-react';
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
    path: '/legal/mentions-legales',
    title: isFa
      ? 'اطلاعات حقوقی رسمی (Mentions légales — قانون LCEN فرانسه)'
      : isFr
        ? 'Mentions légales (LCEN) — Atelier & Éditions Dr Hassan Makaremi'
        : 'Legal Notices (French LCEN) — Dr. Hassan Makaremi',
    description: isFa
      ? 'اطلاعات حقوقی رسمی، هویت ناشر و هنرمند-مؤلف در فرانسه، مشخصات میزبان و نهاد میانجی مصرف‌کننده مطابق قانون LCEN فرانسه.'
      : isFr
        ? 'Mentions légales officielles conformes à la loi LCEN n° 2004-575 : éditeur, statut artiste-auteur URSSAF Limousin, hébergeur Vercel Inc., médiation.'
        : 'Official French LCEN legal notices, publisher identification, URSSAF Limousin artist-author status, hosting provider, and consumer mediation.',
    includeMarkdownTwin: false,
  });
}

export default async function MentionsLegalesPage({
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
      <nav aria-label={tx('راهنمای مسیر', 'Fil d’Ariane', 'Breadcrumb')} className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--foreground-muted)]">
        <Link href={`/${locale}/shop`} className="inline-flex items-center gap-1.5 font-bold hover:text-[var(--primary)]">
          {isFa ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          <span>{tx('بازگشت به گالری تملک آثار و فروشگاه', 'Retour à la Boutique & Éditions', 'Back to Shop & Editions')}</span>
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link href={`/${locale}/legal/cgv`} className="px-3 py-1 rounded-lg bg-[var(--surface-sunken)] border border-[var(--border-subtle)] font-bold hover:border-[var(--primary)]">
            {tx('شرایط عمومی فروش (CGV)', 'CGV', 'Terms of Sale (CGV)')}
          </Link>
          <Link href={`/${locale}/legal/retractation`} className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold hover:border-amber-500">
            {tx('انصراف از خرید (قانون فرانسه)', 'Renoncer au contrat ici', 'Withdraw from Contract')}
          </Link>
        </div>
      </nav>

      <header className="space-y-4 border-b border-[var(--border-subtle)] pb-6">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase text-[var(--primary)] font-bold">
          <Scale size={16} />
          <span>{tx('قانون اقتصاد دیجیتال فرانسه — LCEN n° 2004-575', 'Loi LCEN n° 2004-575 du 21 juin 2004', 'French Digital Economy Act — LCEN')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
          {tx('اطلاعات حقوقی رسمی وب‌سایت و فروشگاه (Mentions légales)', 'Mentions légales officielles', 'Official Legal Notices (Mentions légales)')}
        </h1>
        <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
          {tx(
            'مطابق قانون شماره ۲۰۰۴-۵۷۵ فرانسه (LCEN) و قانون حمایت از مصرف‌کننده فرانسه (Code de la consommation)، مشخصات کامل صاحب امتیاز، وضعیت مالیاتی، میزبان سرور و نهاد میانجی در زیر اعلام می‌شود.',
            'Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique (LCEN) et du Code de la consommation.',
            'Published in accordance with French Law No. 2004-575 (LCEN) and the French Consumer Code.'
          )}
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-4">
          <div className="flex items-center gap-2 text-[var(--primary)] font-bold text-sm">
            <Building2 size={18} />
            <h2>{tx('۱. صاحب امتیاز و مدیر مسئول', '1. Éditeur & Directeur de publication', '1. Publisher & Seller Identity')}</h2>
          </div>
          <dl className="space-y-2.5 text-xs leading-relaxed">
            <div>
              <dt className="text-[var(--foreground-muted)]">{tx('نام و عنوان تجاری:', 'Nom / Dénomination :', 'Name / Trade Name:')}</dt>
              <dd className="font-bold text-[var(--foreground)]">{cfg.sellerName} — {cfg.tradeName}</dd>
            </div>
            <div>
              <dt className="text-[var(--foreground-muted)]">{tx('وضعیت حقوقی در فرانسه:', 'Statut juridique :', 'French Legal Status:')}</dt>
              <dd className="font-semibold text-[var(--foreground)]">
                {isFa ? cfg.legalStatusFa : isFr ? cfg.legalStatusFr : cfg.legalStatusEn}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--foreground-muted)]">{tx('شماره ثبت SIRET و کد APE:', 'Numéro SIRET / Code APE :', 'SIRET & APE Code:')}</dt>
              <dd className="font-mono text-[var(--foreground)]">
                SIRET: {cfg.siret} • APE: {cfg.apeCode}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--foreground-muted)]">{tx('مرجع بیمه و نظام هنرمندان:', 'Affiliation sociale :', 'Social Security Affiliation:')}</dt>
              <dd className="text-[var(--foreground)]">{cfg.urssafArtisteAuteurRef}</dd>
            </div>
            <div>
              <dt className="text-[var(--foreground-muted)]">{tx('نشانی در فرانسه:', 'Adresse postale :', 'Postal Address:')}</dt>
              <dd className="text-[var(--foreground)]">{cfg.addressLine1} — {cfg.postalCodeCity}, {cfg.country}</dd>
            </div>
            <div>
              <dt className="text-[var(--foreground-muted)]">{tx('پست الکترونیک رسمی:', 'Contact électronique :', 'Official Email:')}</dt>
              <dd>
                <a href={`mailto:${cfg.email}`} className="font-mono font-bold text-[var(--primary)] hover:underline">
                  {cfg.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-[var(--foreground-muted)]">{tx('مدیر مسئول انتشار:', 'Directeur de publication :', 'Director of Publication:')}</dt>
              <dd className="font-bold text-[var(--foreground)]">{cfg.directorOfPublication}</dd>
            </div>
          </dl>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--border-subtle)] space-y-4">
          <div className="flex items-center gap-2 text-[var(--primary)] font-bold text-sm">
            <Server size={18} />
            <h2>{tx('۲. میزبان وب‌سایت و نظام مالیاتی (TVA)', '2. Hébergement & Régime Fiscal (TVA)', '2. Hosting & French Tax Regime')}</h2>
          </div>
          <dl className="space-y-2.5 text-xs leading-relaxed">
            <div>
              <dt className="text-[var(--foreground-muted)]">{tx('میزبان فنی (Hébergeur):', 'Hébergeur :', 'Web Host:')}</dt>
              <dd className="font-bold text-[var(--foreground)]">{cfg.hostName}</dd>
              <dd className="text-[var(--foreground-muted)]">{cfg.hostAddress}</dd>
            </div>
            <div className="pt-1">
              <DestinationLinkButton href={cfg.hostWebsite} locale={locale} label={tx('وب‌سایت میزبان (Vercel)', 'Site de l’hébergeur (Vercel)', 'Hosting Provider (Vercel)')} compact />
            </div>
            <div className="pt-3 border-t border-[var(--border-subtle)]">
              <dt className="text-[var(--foreground-muted)]">{tx('وضعیت مالیات بر ارزش افزوده (TVA):', 'Régime de TVA :', 'VAT / TVA Status:')}</dt>
              <dd className="font-bold text-emerald-700 dark:text-emerald-400">
                {cfg.taxMode === 'franchise_en_base'
                  ? cfg.franchiseMentionFr
                  : `TVA intracommunautaire : ${cfg.vatNumber || 'En cours d’attribution'}`}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--foreground-muted)]">{tx('آمادگی فاکتور الکترونیکی فرانسه:', 'Facturation électronique (2026/2027) :', 'French E-Invoicing Readiness:')}</dt>
              <dd className="text-[var(--foreground)]">{cfg.eInvoicingPlatformName}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="p-6 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] space-y-4">
        <div className="flex items-center gap-2 text-[var(--primary)] font-bold text-sm">
          <ShieldCheck size={18} />
          <h2>{tx('۳. میانجی مصرف‌کننده (الزامی — Art. L612-1) و مالکیت فکری', '3. Médiation de la consommation (Art. L612-1) & Propriété intellectuelle', '3. Consumer Mediation (Art. L612-1) & Intellectual Property')}</h2>
        </div>
        <p className="text-xs text-[var(--foreground)] leading-relaxed">
          {tx(
            `مطابق ماده L.612-1 قانون حمایت از مصرف‌کننده فرانسه، هر خریدار در صورت بروز اختلاف حل‌نشده با خدمات مشتریان، حق مراجعه رایگان به نهاد میانجی رسمی مصرف‌کننده را دارد: ${cfg.mediatorName} (${cfg.mediatorAddress}).`,
            `Conformément aux articles L.612-1 et suivants du Code de la consommation, le consommateur a le droit de recourir gratuitement à un médiateur de la consommation en vue de la résolution amiable de tout litige : ${cfg.mediatorName}, ${cfg.mediatorAddress}.`,
            `Under Articles L.612-1 et seq. of the French Consumer Code, consumers have the right to free mediation via ${cfg.mediatorName} (${cfg.mediatorAddress}).`
          )}
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <DestinationLinkButton
            href={cfg.mediatorUrl}
            locale={locale}
            label={tx('درگاه رسمی میانجی مصرف‌کننده (CM2C)', 'Portail officiel du médiateur (CM2C)', 'Official Consumer Mediator Portal (CM2C)')}
            compact
          />
          <Link
            href={`/${locale}/legal/confidentialite`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-card)] border border-[var(--border-subtle)] text-xs font-bold hover:border-[var(--primary)]"
          >
            <FileText size={13} />
            <span>{tx('سیاست حریم خصوصی (RGPD)', 'Politique de confidentialité (RGPD)', 'Privacy Policy (GDPR)')}</span>
          </Link>
        </div>
        <p className="text-xs text-[var(--foreground-muted)] leading-relaxed border-t border-[var(--border-subtle)] pt-3">
          {tx(
            'تمامی آثار نقاشی‌خط، کتاب‌ها، مقالات، اشعار، تصاویر و متن‌های این وب‌سایت تحت حمایت قانون مالکیت فکری فرانسه (Code de la propriété intellectuelle) هستند. هرگونه بازنشر تجاری بدون اجازه کتبی دکتر حسن مکارمی ممنوع است.',
            'L’ensemble des œuvres calligraphiques, tableaux, livres, articles, poèmes et visuels présents sur makaremi.com est protégé par le Code de la propriété intellectuelle. Toute reproduction commerciale sans autorisation écrite préalable du Dr Hassan Makaremi est strictement interdite.',
            'All calligraphy artworks, paintings, books, essays, and poems on makaremi.com are protected under the French Intellectual Property Code. Commercial reproduction without prior written authorization is prohibited.'
          )}
        </p>
      </section>
    </article>
  );
}
