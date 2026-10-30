import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Activity, FileText, ArrowUpRight, ShieldCheck, HeartPulse } from 'lucide-react';
import { SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { JsonLdGraph } from '@/components/seo/JsonLdGraph';
import { SystemStatusDashboard } from '@/components/ops/SystemStatusDashboard';
import { RoadmapScheduleTable } from '@/components/ops/RoadmapScheduleTable';
import { CostBreakdownTable } from '@/components/ops/CostBreakdownTable';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (SUPPORTED_LOCALES.includes(rawLocale as Locale) ? rawLocale : 'fa') as Locale;

  const titles: Record<Locale, string> = {
    fa: 'مرکز پایش وضعیت سیستم و گواهی آمادگی پروداکشن | دکتر حسن مکارمی',
    fr: 'État du Système & Certification de Production | Dr Hassan Makaremi',
    en: 'System Status & Production Readiness Certification | Dr. Hassan Makaremi',
  };

  const descriptions: Record<Locale, string> = {
    fa: 'پایش بلادرنگ وضعیت سلامت زیرساخت، اسنپ‌شات‌های تغییرناپذیر Ed25519، نتایج ممیزی ۶گانه Pre-Launch، نقشه راه ۱۲ هفته‌ای و جدول بهینه‌سازی هزینه‌های ابری در اروپا.',
    fr: 'Surveillance en temps réel de la santé de l’infrastructure, instantanés immuables Ed25519, audit QA 6-points de pré-lancement, feuille de route sur 12 semaines et optimisation des coûts cloud.',
    en: 'Real-time telemetry and infrastructure health monitoring, Ed25519 immutable snapshots, 6-point pre-launch QA gate results, 12-week roadmap, and European cloud cost optimization.',
  };

  const canonicalUrl = `https://makaremi.com/${locale}/system-status`;
  const markdownTwinUrl = `https://makaremi.com/${locale}/system-status.md`;

  return {
    title: titles[locale],
    description: descriptions[locale],
    alternates: {
      canonical: canonicalUrl,
      types: {
        'text/markdown': markdownTwinUrl,
      },
      languages: {
        'fa-IR': 'https://makaremi.com/fa/system-status',
        'fr-FR': 'https://makaremi.com/fr/system-status',
        'en-US': 'https://makaremi.com/en/system-status',
      },
    },
    openGraph: {
      title: titles[locale],
      description: descriptions[locale],
      url: canonicalUrl,
      type: 'website',
      siteName: 'Dr. Hassan Makaremi Official Archive',
    },
    other: {
      'citation_title': titles[locale],
      'DC.title': titles[locale],
      'DC.publisher': 'Dr. Hassan Makaremi Archive',
    },
  };
}

export default async function SystemStatusPage({ params }: PageProps) {
  const { locale: rawLocale } = await params;
  if (!SUPPORTED_LOCALES.includes(rawLocale as Locale)) {
    notFound();
  }
  const locale = rawLocale as Locale;
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';

  const jsonLdPayload = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `https://makaremi.com/${locale}/system-status#webpage`,
        url: `https://makaremi.com/${locale}/system-status`,
        name: isFa
          ? 'مرکز پایش وضعیت سیستم و آمادگی پروداکشن دکتر حسن مکارمی'
          : 'Dr. Hassan Makaremi System Status & Production Readiness',
        description: isFa
          ? 'پایش بلادرنگ سلامت زیرساخت، اسنپ‌شات‌های Ed25519 و گواهی کنترل کیفیت پیش از راه‌اندازی'
          : 'Real-time infrastructure telemetry, Ed25519 snapshots, and pre-launch QA gate certification',
        isPartOf: {
          '@type': 'WebSite',
          '@id': 'https://makaremi.com/#website',
          name: 'Dr. Hassan Makaremi Official Archive',
          url: 'https://makaremi.com',
        },
        inLanguage: locale === 'fa' ? 'fa-IR' : locale === 'fr' ? 'fr-FR' : 'en-US',
      },
      {
        '@type': 'AboutPage',
        '@id': `https://makaremi.com/${locale}/system-status#about`,
        mainEntity: {
          '@type': 'SoftwareApplication',
          name: 'MAKAREMI-CORE-2026',
          applicationCategory: 'Academic Digital Archive & AI Knowledge Base',
          operatingSystem: 'Linux (Hetzner / OVHcloud EU Cloud)',
          softwareVersion: '1.0.0-PROD',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'EUR',
          },
        },
      },
    ],
  };

  return (
    <>
      <JsonLdGraph data={jsonLdPayload} />

      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header & Page Title - STRICTLY ONE <h1> */}
          <header className="space-y-4 border-b border-[var(--border-subtle)] pb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono">
                  <Activity size={14} />
                  <span>{isFa ? 'پایش زنده سیستم' : 'Live Telemetry'}</span>
                </span>
                <span className="text-xs font-mono text-[var(--foreground-muted)]">
                  Release v1.0.0-PROD
                </span>
              </div>

              {/* Action Links: Markdown Twin & Raw Telemetry */}
              <div className="flex items-center gap-3">
                <Link
                  href={`/${locale}/system-status.md`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--surface-sunken)] hover:bg-[var(--surface-sunken)]/80 text-[var(--foreground)] border border-[var(--border-subtle)] transition-colors"
                >
                  <FileText size={14} className="text-amber-500" />
                  <span>{isFa ? 'دوقلوی مارک‌داون (.md)' : 'Jumeau Markdown (.md)'}</span>
                  <ArrowUpRight size={12} className="text-[var(--foreground-muted)]" />
                </Link>

                <Link
                  href="/api/health"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 transition-colors"
                >
                  <HeartPulse size={14} />
                  <span>{isFa ? 'تله‌متری JSON' : 'JSON Telemetry'}</span>
                  <ArrowUpRight size={12} />
                </Link>
              </div>
            </div>

            {/* The single <h1> element for this page */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-[var(--foreground)] tracking-tight">
              {isFa
                ? 'مرکز پایش وضعیت سیستم و گواهی آمادگی پروداکشن'
                : isFr
                ? 'État du Système et Certification de Production'
                : 'System Status & Production Readiness Certification'}
            </h1>

            <p className="text-sm sm:text-base text-[var(--foreground-muted)] max-w-3xl leading-relaxed">
              {isFa
                ? 'شفافیت کامل در عملکرد زیرساخت، نتایج ارزیابی خودکار گیت‌های کنترل کیفیت ۶گانه، نقشه راه ۱۲ هفته‌ای و بهینه‌سازی هزینه‌های ماهانه نگهداری ابری در سرورهای مستقل اروپایی.'
                : isFr
                ? 'Transparence totale de l’infrastructure, validation automatisée des 6 portes de qualité QA, feuille de route sur 12 semaines et optimisation des coûts cloud sur serveurs européens souverains.'
                : 'Complete transparency of system infrastructure, automated validation of all 6 pre-launch QA gates, 12-week implementation roadmap, and European cloud cost optimization.'}
            </p>
          </header>

          {/* Section 1: Dashboard with live metrics, 7 phases scorecard, and QA gates */}
          <SystemStatusDashboard locale={locale} />

          {/* Section 2: 12-Week Implementation Roadmap Schedule */}
          <RoadmapScheduleTable locale={locale} />

          {/* Section 3: Monthly European Cloud Cost Breakdown Table */}
          <CostBreakdownTable locale={locale} />

          {/* Footer note */}
          <footer className="pt-8 border-t border-[var(--border-subtle)] text-xs text-[var(--foreground-muted)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-emerald-500" size={16} />
              <span>
                {isFa
                  ? 'وب‌سایت رسمی و آرشیو جامع دیجیتال دکتر حسن مکارمی (پاریس، فرانسه)'
                  : 'Site officiel et archives numériques du Dr Hassan Makaremi (Paris, France)'}
              </span>
            </div>
            <div className="font-mono text-[11px]">
              TLS 1.3 • AES-256-GCM • Ed25519 • Zero-Trust Cloudflare
            </div>
          </footer>
        </div>
      </main>
    </>
  );
}
