'use client';

import React from 'react';
import { DollarSign, ShieldAlert, Sparkles, Server, HardDrive, Cpu, Cloud } from 'lucide-react';
import type { Locale } from '@makaremi/shared';

interface CostBreakdownTableProps {
  locale: Locale;
}

export function CostBreakdownTable({ locale }: CostBreakdownTableProps) {
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);

  const costItems = [
    {
      category: tx('سرور ابری اختصاصی (VPS ابری مستقل)', 'Serveur VPS Dédié dans l’UE', 'Dedicated Cloud VPS (EU)'),
      provider: 'Hetzner / OVHcloud (Falkenstein / Gravelines)',
      specs: '8 vCPU, 32GB RAM, 160GB NVMe SSD, 10Gbps Network',
      monthlyEur: isFa ? '۲۵ تا ۳۵ €' : '€25 – €35',
      annualEur: isFa ? '۳۰۰ تا ۴۲۰ €' : '€300 – €420',
      icon: Server,
    },
    {
      category: tx('امنیت لبه و شبکه توزیع (Cloudflare Pro)', 'Sécurité Edge & CDN (Cloudflare Pro)', 'Edge Security & CDN (Cloudflare Pro)'),
      provider: 'Cloudflare Inc. (Tier-1 Global Anycast Edge)',
      specs: tx(
        'WAF پیشرفته، دفع حملات DDoS، فایروال Zero-Trust و قوانین کش لبه',
        'WAF avancé, protection DDoS, pare-feu Zero-Trust et cache Edge',
        'Managed WAF, DDoS mitigation, Zero-Trust tunnel, and Edge cache rules'
      ),
      monthlyEur: isFa ? '۲۳ € (۲۵ $)' : '€23 ($25)',
      annualEur: isFa ? '۲۷۶ €' : '€276',
      icon: Cloud,
    },
    {
      category: tx('میزبانی فرانت‌اند و SSR لبه', 'Hébergement Edge SSR & Frontend', 'Edge SSR Hosting & Frontend'),
      provider: tx('Vercel Pro / سرور خودمیزبان لینوکس', 'Vercel Pro / Linux auto-hébergé', 'Vercel Pro / Self-hosted Linux'),
      specs: tx(
        'رندرینگ ایستا ISR، فشرده‌سازی AVIF و اجرای دوقلوهای مارک‌داون',
        'Rendu statique ISR, compression AVIF et jumeaux Markdown',
        'Static ISR rendering, AVIF compression, and Markdown twins delivery'
      ),
      monthlyEur: isFa ? '۰ تا ۲۰ €' : '€0 – €20',
      annualEur: isFa ? '۰ تا ۲۴۰ €' : '€0 – €240',
      icon: Sparkles,
    },
    {
      category: tx('پردازش صوتی و جستجوی معنایی (API)', 'API Audio & Traitement Sémantique', 'Voice Processing & Semantic Search APIs'),
      provider: tx('موتور اختصاصی تبدیل گفتار به متن و نمایه‌سازی برداری', 'Moteur dédié de transcription vocale et vectorisation', 'Dedicated Speech-to-Text & Vector Indexing Service'),
      specs: tx(
        'تبدیل ویس‌های تلگرام/واتس‌اپ به متن، واژه‌نامه لکانی و پاسخ‌های RAG',
        'Transcription vocale Telegram/WhatsApp, glossaire lacanien et RAG',
        'Telegram/WhatsApp voice transcription, Lacanian glossary enrichment & RAG'
      ),
      monthlyEur: isFa ? '۱۵ تا ۳۰ €' : '€15 – €30',
      annualEur: isFa ? '۱۸۰ تا ۳۶۰ €' : '€180 – €360',
      icon: Cpu,
    },
    {
      category: tx('فضای ذخیره‌سازی ابری خارج از سرور (Offsite Backup)', 'Stockage Chiffré Hors-Site (S3 Compatible)', 'Encrypted Offsite Cloud Vault (S3)'),
      provider: 'Scaleway / Backblaze B2 (Amsterdam / Paris)',
      specs: tx(
        'ذخیره‌سازی رمزنگاری‌شده AES-256-GCM با دوره ماندگاری ۳۰ روزه',
        'Stockage chiffré AES-256-GCM avec rétention de 30 jours',
        'AES-256-GCM encrypted offsite storage with 30-day retention'
      ),
      monthlyEur: isFa ? '۵ تا ۷ €' : '€5 – €7',
      annualEur: isFa ? '۶۰ تا ۸۴ €' : '€60 – €84',
      icon: HardDrive,
    },
  ];

  return (
    <section
      aria-label={tx('جدول هزینه‌های زیرساخت ابری', 'Estimation des coûts cloud', 'Cloud Infrastructure Cost Breakdown')}
      className="bg-[var(--surface-overlay)] border border-[var(--border-subtle)] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] flex items-center gap-2.5">
            <DollarSign className="text-emerald-500" size={24} />
            <span>
              {tx(
                'جدول برآورد و بهینه‌سازی هزینه‌های ماهانه زیرساخت ابری در اروپا',
                'Estimation et Optimisation des Coûts Mensuels du Cloud en UE',
                'Monthly European Cloud Infrastructure Cost Optimisation'
              )}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-1">
            {tx(
              'برآورد اقتصادی دقیق بر اساس بخش ۷.۲ سند معماری با استقلال کامل داده‌ها و بدون وابستگی به زیرساخت‌های انحصاری.',
              'Estimation économique rigoureuse selon la section 7.2 du plan, garantissant l’indépendance souveraine des données.',
              'Economic breakdown based on Section 7.2 of the architectural blueprint ensuring full data sovereignty.'
            )}
          </p>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl shrink-0">
          <div className="text-[11px] text-emerald-400 font-medium">
            {tx('مجموع هزینه ماهانه جاری', 'Coût Mensuel Total', 'Total Monthly Operating Cost')}
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
            {tx('۷۰ تا ۱۱۵ یورو / ماه', '70 – 115 € / mois', '€70 – €115 / month')}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-start text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-[var(--foreground-muted)]">
              <th className="py-3 px-4 font-bold">
                {tx('سرویس و لایه معماری', 'Couche d’Infrastructure', 'Infrastructure Layer')}
              </th>
              <th className="py-3 px-4 font-bold">
                {tx('تأمین‌کننده ابری', 'Fournisseur', 'Provider')}
              </th>
              <th className="py-3 px-4 font-bold">
                {tx('مشخصات فنی و مقیاس', 'Spécifications Techniques', 'Technical Specifications')}
              </th>
              <th className="py-3 px-4 text-center font-bold">
                {tx('هزینه ماهانه', 'Coût / Mois', 'Monthly Cost')}
              </th>
              <th className="py-3 px-4 text-center font-bold">
                {tx('هزینه سالانه', 'Coût / An', 'Annual Cost')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]/60">
            {costItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <tr key={idx} className="hover:bg-[var(--surface-sunken)]/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[var(--foreground)] whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Icon className="text-amber-500 shrink-0" size={16} />
                      <span>{item.category}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-[var(--foreground-muted)]">
                    {item.provider}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-[var(--foreground-muted)] leading-relaxed">
                    {item.specs}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-500 whitespace-nowrap">
                    {item.monthlyEur}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-[var(--foreground-muted)] whitespace-nowrap">
                    {item.annualEur}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[var(--border-subtle)] bg-[var(--surface-sunken)]/30 font-bold">
              <td colSpan={3} className="py-3 px-4 text-sm text-[var(--foreground)]">
                {tx(
                  'مجموع برآورد هزینه سالانه زیرساخت ابری پروژه',
                  'Total Annuel Estimé de l’Infrastructure Cloud',
                  'Total Estimated Annual Cloud Infrastructure Cost'
                )}
              </td>
              <td className="py-3 px-4 text-center font-mono text-emerald-500 text-sm">
                {isFa ? '۷۰ - ۱۱۵ €' : '€70 – €115'}
              </td>
              <td className="py-3 px-4 text-center font-mono text-emerald-400 text-sm">
                {tx('۸۴۰ تا ۱,۳۸۰ € / سال', '840 – 1 380 € / an', '€840 – €1,380 / year')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
