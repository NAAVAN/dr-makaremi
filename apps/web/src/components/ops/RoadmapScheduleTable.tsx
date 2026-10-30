'use client';

import React from 'react';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';
import type { Locale } from '@makaremi/shared';

interface RoadmapScheduleTableProps {
  locale: Locale;
}

export function RoadmapScheduleTable({ locale }: RoadmapScheduleTableProps) {
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';

  const roadmapMilestones = [
    {
      weeks: isFa ? 'هفته ۱ تا ۲' : isFr ? 'Semaines 1-2' : 'Weeks 1-2',
      phaseName: isFa ? 'فاز ۱: هسته زیرساخت لبه و امنیت' : isFr ? 'Phase 1: Infrastructure Edge & Sécurité' : 'Phase 1: Edge Infrastructure & Security',
      deliverables: isFa
        ? 'راه‌اندازی Next.js 15، Directus CMS، تونل Zero-Trust کلادفلیر، ایزولاسیون دامنه‌ها و ریدایرکت‌های ۳۰۱ سئو'
        : isFr
        ? 'Mise en place de Next.js 15, Directus CMS, tunnel Cloudflare Zero-Trust, isolation et redirections 301'
        : 'Setup Next.js 15, Directus CMS, Cloudflare Zero-Trust Tunnel, domain isolation, and 301 SEO redirects',
      status: 'completed',
    },
    {
      weeks: isFa ? 'هفته ۳ تا ۴' : isFr ? 'Semaines 3-4' : 'Weeks 3-4',
      phaseName: isFa ? 'فاز ۲: مهاجرت داده و آرشیو مدیا' : isFr ? 'Phase 2: Migration des Données & Médias' : 'Phase 2: Data Migration & Media Archive',
      deliverables: isFa
        ? 'مهاجرت آرشیو مقالات، کتاب‌ها، اشعار، ویدیوها و تولید کاشی‌های زوم عمیق ۴۰۹۶ پیکسلی IIIF با فشرده‌سازی AVIF'
        : isFr
        ? 'Migration des articles, livres, poèmes, vidéos et génération des pyramides IIIF 4096px avec compression AVIF'
        : 'Migration of articles, books, poetry, speeches, and generation of 4096px IIIF deep-zoom tiles with AVIF',
      status: 'completed',
    },
    {
      weeks: isFa ? 'هفته ۵ تا ۶' : isFr ? 'Semaines 5-6' : 'Weeks 5-6',
      phaseName: isFa ? 'فاز ۳: معماری فرانت‌اند و بقای آفلاین' : isFr ? 'Phase 3: Frontend & Survie Hors-Ligne' : 'Phase 3: Frontend & Offline Survival',
      deliverables: isFa
        ? 'کره سه‌بعدی تعاملی، تایپوگرافی ۳زبانه (وزیرمتن/اوت‌فیت)، دوقلوی مارک‌داون، اسنپ‌شات‌های Ed25519 و پکیج PWA'
        : isFr
        ? 'Globe 3D interactif, typographie trilingue (Vazirmatn/Outfit), jumeau Markdown, instantanés Ed25519 et PWA'
        : 'Interactive 3D Globe, trilingual typography, Markdown twins, Ed25519 snapshots, and offline PWA survival pack',
      status: 'completed',
    },
    {
      weeks: isFa ? 'هفته ۷ تا ۸' : isFr ? 'Semaines 7-8' : 'Weeks 7-8',
      phaseName: isFa ? 'فاز ۴: سئو معنایی و هوش مصنوعی' : isFr ? 'Phase 4: SEO Sémantique & IA (GEO)' : 'Phase 4: Semantic SEO & AI Discovery (GEO)',
      deliverables: isFa
        ? 'متادیتای علمی HighWire/DublinCore، گراف دانش Schema.org، مستندات /llms.txt و قانون تک-<h1>'
        : isFr
        ? 'Métadonnées HighWire/DublinCore, graphe Schema.org, fichiers /llms.txt et conformité stricte <h1> unique'
        : 'Academic HighWire/DublinCore metadata, Schema.org knowledge graph, /llms.txt discovery, and strict single-<h1>',
      status: 'completed',
    },
    {
      weeks: isFa ? 'هفته ۹ تا ۱۰' : isFr ? 'Semaines 9-10' : 'Weeks 9-10',
      phaseName: isFa ? 'فاز ۵: جستجوی هیبریدی و سرور MCP' : isFr ? 'Phase 5: Recherche RAG & Serveur MCP' : 'Phase 5: Hybrid RAG & MCP Server',
      deliverables: isFa
        ? 'نرمال‌ساز فنی فارسی، وکتورهای ۳۸۴ بعدی متراکم + BM25، ارزیابی RRF k=60 و سرور رسمی JSON-RPC 2.0 در /api/mcp'
        : isFr
        ? 'Normaliseur persan, vecteurs denses 384d + BM25, fusion RRF k=60 et serveur officiel JSON-RPC 2.0 à /api/mcp'
        : 'Persian normalizer, 384d dense vectors + BM25, RRF k=60 fusion, and official JSON-RPC 2.0 server at /api/mcp',
      status: 'completed',
    },
    {
      weeks: isFa ? 'هفته ۱۱ تا ۱۲' : isFr ? 'Semaines 11-12' : 'Weeks 11-12',
      phaseName: isFa ? 'فاز ۶ و ۷: ایجنت‌های صوتی و استقرار نهایی' : isFr ? 'Phase 6 & 7: Agents Vocaux & Lancement' : 'Phases 6 & 7: Voice Agents & Launch',
      deliverables: isFa
        ? 'ایجنت‌های تلگرام/واتس‌اپ، واژه‌نامه لکانی، توزیع ۵کاناله، بکاپ AES-256-GCM، تله‌متری /api/health و ممیزی Pre-Launch'
        : isFr
        ? 'Agents Telegram/WhatsApp, glossaire lacanien, distribution 5 canaux, sauvegarde AES-256-GCM et audit QA'
        : 'Telegram/WhatsApp voice agents, Lacanian glossary, 5-channel distribution, AES-256-GCM backup, and Pre-Launch QA',
      status: 'completed',
    },
  ];

  return (
    <section className="bg-[var(--surface-overlay)] border border-[var(--border-subtle)] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] flex items-center gap-2.5">
            <Calendar className="text-amber-500" size={24} />
            <span>
              {isFa
                ? 'نقشه راه اجرایی ۱۲ هفته‌ای پروژه (Implementation Roadmap)'
                : isFr
                ? 'Feuille de Route d’Exécution sur 12 Semaines'
                : '12-Week Project Implementation Roadmap'}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-1">
            {isFa
              ? 'برنامه زمان‌بندی مهندسی فازهای ۷گانه مطابق بخش ۷.۱ سند مرجع معماری با تحقق ۱۰۰٪ اهداف.'
              : isFr
              ? 'Calendrier d’ingénierie des 7 phases conforme à la section 7.1 du plan architectural.'
              : 'Engineering timeline across all 7 phases with 100% completion rate.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-emerald-400 text-xs font-semibold">
          <CheckCircle2 size={16} />
          <span>{isFa ? 'پیشرفت کلی: ۱۰۰٪ (تکمیل‌شده)' : 'Progression Globale: 100% (Terminé)'}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-[var(--foreground-muted)]">
              <th className="py-3 px-4 text-center font-bold w-28">
                {isFa ? 'بازه زمانی' : 'Période'}
              </th>
              <th className="py-3 px-4 font-bold w-48">
                {isFa ? 'فاز اجرایی' : 'Phase'}
              </th>
              <th className="py-3 px-4 font-bold">
                {isFa ? 'خروجی‌ها و دستاوردهای کلیدی' : 'Livrables Clés'}
              </th>
              <th className="py-3 px-4 text-center font-bold w-28">
                {isFa ? 'وضعیت' : 'Statut'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]/60">
            {roadmapMilestones.map((m, idx) => (
              <tr key={idx} className="hover:bg-[var(--surface-sunken)]/50 transition-colors">
                <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-500 whitespace-nowrap">
                  {m.weeks}
                </td>
                <td className="py-3.5 px-4 font-bold text-[var(--foreground)] whitespace-nowrap">
                  {m.phaseName}
                </td>
                <td className="py-3.5 px-4 text-[var(--foreground-muted)] leading-relaxed">
                  {m.deliverables}
                </td>
                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono">
                    <CheckCircle2 size={12} />
                    Done
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
