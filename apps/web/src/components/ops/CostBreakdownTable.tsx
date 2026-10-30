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

  const costItems = [
    {
      category: isFa ? 'سرور ابری اختصاصی (VPS ابری مستقل)' : isFr ? 'Serveur VPS Dédié dans l’UE' : 'Dedicated Cloud VPS (EU)',
      provider: 'Hetzner / OVHcloud (Falkenstein / Gravelines)',
      specs: '8 vCPU, 32GB RAM, 160GB NVMe SSD, 10Gbps Network',
      monthlyEur: '۲۵ تا ۳۵ €',
      annualEur: '۳۰۰ تا ۴۲۰ €',
      icon: Server,
    },
    {
      category: isFa ? 'امنیت لبه و شبکه توزیع (Cloudflare Pro)' : isFr ? 'Sécurité Edge & CDN (Cloudflare Pro)' : 'Edge Security & CDN (Cloudflare Pro)',
      provider: 'Cloudflare Inc. (Tier-1 Global Anycast Edge)',
      specs: 'WAF پیشرفته، دفع حملات DDoS، فایروال Zero-Trust و قوانین کش لبه',
      monthlyEur: '۲۳ € (۲۵ $)',
      annualEur: '۲۷۶ €',
      icon: Cloud,
    },
    {
      category: isFa ? 'میزبانی فرانت‌اند و SSR لبه' : isFr ? 'Hébergement Edge SSR & Frontend' : 'Edge SSR Hosting & Frontend',
      provider: 'Vercel Pro / سرور خودمیزبان لینوکس',
      specs: 'رندرینگ ایستا ISR، فشرده‌سازی AVIF و اجرای دوقلوهای مارک‌داون',
      monthlyEur: '۰ تا ۲۰ €',
      annualEur: '۰ تا ۲۴۰ €',
      icon: Sparkles,
    },
    {
      category: isFa ? 'هوش مصنوعی صوتی و پردازش متن (AI APIs)' : isFr ? 'APIs IA Vocale & Modèles (Whisper & LLM)' : 'Voice AI & Processing APIs (Whisper & LLM)',
      provider: 'OpenAI (Whisper Large-v3 & Embeddings)',
      specs: 'تبدیل ویس‌های تلگرام/واتس‌اپ به متن، واژه‌نامه لکانی و پاسخ‌های RAG',
      monthlyEur: '۱۵ تا ۳۰ €',
      annualEur: '۱۸۰ تا ۳۶۰ €',
      icon: Cpu,
    },
    {
      category: isFa ? 'فضای ذخیره‌سازی ابری خارج از سرور (Offsite Backup)' : isFr ? 'Stockage Chiffré Hors-Site (S3 Compatible)' : 'Encrypted Offsite Cloud Vault (S3)',
      provider: 'Scaleway / Backblaze B2 (Amsterdam / Paris)',
      specs: 'ذخیره‌سازی رمزنگاری‌شده AES-256-GCM با دوره ماندگاری ۳۰ روزه',
      monthlyEur: '۵ تا ۷ €',
      annualEur: '۶۰ تا ۸۴ €',
      icon: HardDrive,
    },
  ];

  return (
    <section className="bg-[var(--surface-overlay)] border border-[var(--border-subtle)] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] flex items-center gap-2.5">
            <DollarSign className="text-emerald-500" size={24} />
            <span>
              {isFa
                ? 'جدول برآورد و بهینه‌سازی هزینه‌های ماهانه زیرساخت ابری در اروپا'
                : isFr
                ? 'Estimation et Optimisation des Coûts Mensuels du Cloud en UE'
                : 'Monthly European Cloud Infrastructure Cost Optimization'}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-1">
            {isFa
              ? 'برآورد اقتصادی دقیق بر اساس بخش ۷.۲ سند معماری با استقلال کامل داده‌ها و بدون وابستگی به زیرساخت‌های انحصاری.'
              : isFr
              ? 'Estimation économique rigoureuse selon la section 7.2 du plan, garantissant l’indépendance souveraine des données.'
              : 'Economic breakdown based on Section 7.2 of the architectural blueprint ensuring data sovereignty.'}
          </p>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl shrink-0">
          <div className="text-[11px] text-emerald-400 font-medium">
            {isFa ? 'مجموع هزینه ماهانه جاری' : 'Coût Mensuel Total'}
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
            ۷۰ تا ۱۱۵ یورو / ماه
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-[var(--foreground-muted)]">
              <th className="py-3 px-4 font-bold">
                {isFa ? 'سرویس و لایه معماری' : 'Couche d’Infrastructure'}
              </th>
              <th className="py-3 px-4 font-bold">
                {isFa ? 'تأمین‌کننده ابری' : 'Fournisseur'}
              </th>
              <th className="py-3 px-4 font-bold">
                {isFa ? 'مشخصات فنی و مقیاس' : 'Spécifications Techniques'}
              </th>
              <th className="py-3 px-4 text-center font-bold">
                {isFa ? 'هزینه ماهانه' : 'Coût / Mois'}
              </th>
              <th className="py-3 px-4 text-center font-bold">
                {isFa ? 'هزینه سالانه' : 'Coût / An'}
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
                {isFa
                  ? 'مجموع برآورد هزینه سالانه زیرساخت ابری پروژه'
                  : 'Total Annuel Estimé de l’Infrastructure Cloud'}
              </td>
              <td className="py-3 px-4 text-center font-mono text-emerald-500 text-sm">
                ۷۰ - ۱۱۵ €
              </td>
              <td className="py-3 px-4 text-center font-mono text-emerald-400 text-sm">
                ۸۴۰ تا ۱,۳۸۰ € / سال
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
