import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ShieldCheck, AlertTriangle, ArrowLeft, ArrowRight, Award } from 'lucide-react';
import { isValidLocale, type Locale } from '@/lib/i18n';
import {
  getAuthenticityCertificateById,
  verifyAuthenticityCertificate,
} from '@/lib/commerce/store';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; certificateId: string }>;
}): Promise<Metadata> {
  const { locale, certificateId } = await params;
  if (!isValidLocale(locale)) return {};
  return {
    title:
      locale === 'fa'
        ? `استعلام گواهی اصالت اثر ${certificateId} | دکتر حسن مکارمی`
        : locale === 'fr'
          ? `Certificat d’authenticité ${certificateId} — Décret Marcus & Ed25519`
          : `Authenticity Certificate Verification ${certificateId} — Dr. Hassan Makaremi`,
  };
}

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ locale: string; certificateId: string }>;
}) {
  const { locale, certificateId } = (await params) as { locale: Locale; certificateId: string };
  if (!isValidLocale(locale)) notFound();

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);

  const cert = await getAuthenticityCertificateById(certificateId);
  const verification = cert ? verifyAuthenticityCertificate(cert) : null;
  const isValid = Boolean(verification?.sha256Matches && verification?.ed25519Valid);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <nav aria-label={tx('راهنمای مسیر', 'Fil d’Ariane', 'Breadcrumb')} className="text-xs text-[var(--foreground-muted)]">
        <Link href={`/${locale}/shop`} className="inline-flex items-center gap-1.5 font-bold hover:text-[var(--primary)]">
          {isFa ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          <span>{tx('بازگشت به گالری تملک آثار', 'Retour à la Boutique', 'Back to Shop')}</span>
        </Link>
      </nav>

      {!cert ? (
        <div className="rounded-3xl bg-amber-500/5 border-2 border-amber-500/35 p-8 text-center space-y-4">
          <AlertTriangle size={36} className="mx-auto text-amber-600" />
          <h1 className="text-2xl font-black text-[var(--foreground)]">
            {tx('گواهی اصالت با این شناسه یافت نشد', 'Certificat d’authenticité introuvable', 'Certificate Not Found')}
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] font-mono">{certificateId}</p>
        </div>
      ) : (
        <article className="rounded-3xl bg-[var(--surface-card)] border-2 border-emerald-600/40 p-6 sm:p-10 space-y-6 shadow-lg">
          <header className="border-b border-[var(--border-subtle)] pb-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-black">
                <ShieldCheck size={15} />
                <span>
                  {isValid
                    ? tx('اصالت تأییدشده ریاضی (Ed25519 + SHA-256)', 'Authenticité vérifiée (Ed25519 + SHA-256)', 'Cryptographically Verified (Ed25519 + SHA-256)')
                    : tx('هشدار عدم تطابق امضا', 'Signature invalide', 'Invalid Signature')}
                </span>
              </span>
              <span className="font-mono text-xs font-black text-[var(--primary)]">{cert.certificateId}</span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono uppercase text-amber-700 dark:text-amber-400 font-bold pt-1">
              <Award size={15} />
              <span>{tx('گواهی اصالت اثر هنری — Décret Marcus n° 81-255 (فرانسه)', 'Certificat d’Authenticité — Décret Marcus n° 81-255', 'Certificate of Authenticity — French Décret Marcus')}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)]">
              {cert.artworkTitle[locale]}
            </h1>
          </header>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[var(--surface-sunken)]">
              <dt className="text-[var(--foreground-muted)]">{tx('هنرمند خالق اثر:', 'Artiste :', 'Artist:')}</dt>
              <dd className="font-black text-[var(--foreground)] mt-0.5">{cert.artistName}</dd>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--surface-sunken)]">
              <dt className="text-[var(--foreground-muted)]">{tx('نوع و تیراژ (Décret Marcus):', 'Qualification & Édition :', 'Classification & Edition:')}</dt>
              <dd className="font-bold text-[var(--foreground)] mt-0.5">{cert.editionLabel}</dd>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--surface-sunken)]">
              <dt className="text-[var(--foreground-muted)]">{tx('ابعاد اثر:', 'Dimensions :', 'Dimensions:')}</dt>
              <dd className="font-mono font-bold text-[var(--foreground)] mt-0.5">{cert.dimensionsCm}</dd>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--surface-sunken)]">
              <dt className="text-[var(--foreground-muted)]">{tx('تکنیک و مدیوم:', 'Technique / Médium :', 'Medium:')}</dt>
              <dd className="font-bold text-[var(--foreground)] mt-0.5">{cert.medium[locale]}</dd>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--surface-sunken)]">
              <dt className="text-[var(--foreground-muted)]">{tx('تملک‌کننده ثبت‌شده:', 'Acquéreur enregistré :', 'Registered Collector:')}</dt>
              <dd className="font-bold text-[var(--foreground)] mt-0.5">{cert.buyerName}</dd>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--surface-sunken)]">
              <dt className="text-[var(--foreground-muted)]">{tx('شماره فاکتور و تاریخ صدور:', 'Facture & Date :', 'Invoice & Issue Date:')}</dt>
              <dd className="font-mono font-bold text-[var(--foreground)] mt-0.5">
                {cert.invoiceNumber} • {cert.issuedAt.slice(0, 10)}
              </dd>
            </div>
          </dl>

          <blockquote className="p-4 rounded-2xl bg-[var(--surface-sunken)] border-s-4 border-amber-600 text-xs text-[var(--foreground)] leading-relaxed italic">
            {cert.decretMarcusStatementFr}
          </blockquote>

          <div className="p-4 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)] space-y-2 text-[11px] font-mono break-all">
            <div>
              <span className="text-[var(--foreground-muted)]">SHA-256: </span>
              <span className="text-[var(--foreground)]">{cert.canonicalSha256}</span>
            </div>
            <div>
              <span className="text-[var(--foreground-muted)]">Ed25519 Signature: </span>
              <span className="text-[var(--foreground)]">{cert.signatureEd25519}</span>
            </div>
          </div>
        </article>
      )}
    </div>
  );
}
