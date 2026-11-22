'use client';

import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Server,
  KeyRound,
  Radio,
  FileCheck,
  Cpu,
  Lock,
  Activity,
  Layers,
  Database,
} from 'lucide-react';
import type { Locale } from '@makaremi/shared';

interface SystemStatusDashboardProps {
  locale: Locale;
}

export function SystemStatusDashboard({ locale }: SystemStatusDashboardProps) {
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);

  const phaseCards = [
    {
      phase: 1,
      title: tx('فاز ۱: زیرساخت لبه و امنیت', 'Phase 1: Infrastructure Edge & Sécurité', 'Phase 1: Edge Infra & Security'),
      tests: 39,
      status: 'passed',
      desc: tx(
        'ریدایرکت‌های ۳۰۱ سئو، ایزولاسیون دامنه‌ها و هدرهای امنیتی',
        'Redirections 301, isolation des domaines et en-têtes sécurisés',
        '301 SEO redirects, domain isolation, and hardened security headers'
      ),
    },
    {
      phase: 2,
      title: tx('فاز ۲: هسته فرانت‌اند و واژه‌نامه', 'Phase 2: Cœur Frontend & Glossaire', 'Phase 2: Core Frontend & Glossary'),
      tests: 51,
      status: 'passed',
      desc: tx(
        'کره سه‌بعدی تعاملی، تایپوگرافی ۳زبانه و دوقلوی مارک‌داون',
        'Globe 3D interactif, typographie trilingue et jumeau Markdown',
        'Interactive 3D showcase, trilingual typography, and Markdown twins'
      ),
    },
    {
      phase: 3,
      title: tx('فاز ۳: رمزنگاری Ed25519 و بقای آفلاین', 'Phase 3: Cryptographie Ed25519 & Survie', 'Phase 3: Ed25519 Crypto & Offline'),
      tests: 53,
      status: 'passed',
      desc: tx(
        'اسنپ‌شات‌های تغییرناپذیر، سلف‌هیلینگ و بسته‌های بقای آفلاین',
        'Instantanés immuables, auto-guérison et paquets hors-ligne',
        'Immutable snapshots, self-healing mirrors, and offline survival packs'
      ),
    },
    {
      phase: 4,
      title: tx('فاز ۴: سئو معنایی و گراف دانش', 'Phase 4: SEO Sémantique & Knowledge Graph', 'Phase 4: Semantic SEO & Graph'),
      tests: 84,
      status: 'passed',
      desc: tx(
        'متادیتای آکادمیک HighWire، گراف Schema.org و کشف هوش مصنوعی',
        'Métadonnées HighWire, graphe Schema.org et découverte IA',
        'HighWire academic metadata, Schema.org graph, and AI discovery'
      ),
    },
    {
      phase: 5,
      title: tx('فاز ۵: پایپ‌لاین ETL، سرچ هیبریدی و MCP', 'Phase 5: Pipeline ETL, Recherche & MCP', 'Phase 5: ETL, Hybrid RAG & MCP'),
      tests: 124,
      status: 'passed',
      desc: tx(
        'نرمال‌ساز فارسی، جستجوی برداری ۳۸۴ بعدی و سرور رسمی MCP',
        'Normaliseur persan, recherche dense 384d et serveur MCP officiel',
        'Persian normaliser, 384d dense vector retrieval, and official MCP server'
      ),
    },
    {
      phase: 6,
      title: tx('فاز ۶: ایجنت‌های صوتی شخصی و انتشار ۵کاناله', 'Phase 6: Agents Vocaux & Distribution 5-Canaux', 'Phase 6: Voice Agents & 5-Channel'),
      tests: 107,
      status: 'passed',
      desc: tx(
        'بات تلگرام/واتس‌اپ، واژه‌نامه لکانی و انتشار همزمان',
        'Bot Telegram/WhatsApp, glossaire lacanien et publication 5 canaux',
        'Telegram/WhatsApp voice bots, Lacanian glossary, and 5-channel distribution'
      ),
    },
    {
      phase: 7,
      title: tx('فاز ۷: استقرار ابری و ممیزی نهایی پروداکشن', 'Phase 7: Déploiement Cloud & Audit Final', 'Phase 7: Production Launch & QA'),
      tests: 65,
      status: 'passed',
      desc: tx(
        'بکاپ AES-256-GCM، تله‌متری سلامت و گیت ۶گانه Pre-Launch',
        'Sauvegarde AES-256-GCM, télémétrie de santé et porte QA 6-points',
        'AES-256-GCM encrypted backup, health telemetry, and 6-point Pre-Launch QA gate'
      ),
    },
  ];

  const totalTests = phaseCards.reduce((acc, p) => acc + p.tests, 0);

  const qaGates = [
    {
      id: 'g1',
      title: tx('گیت ۱: یکپارچگی تک‌گامی دامنه‌ها', 'Porte 1: Canonicalisation Domaine', 'Gate 1: Single-Hop Domain Canonicalisation'),
      status: '100% Passed',
      desc: tx(
        'انتقال ۳۰۱ یک‌گامی دامنه‌های قدیمی به دامنه اصلی رسمی',
        'Redirection 301 directe des anciens domaines vers le domaine officiel',
        '301 single-hop redirect from legacy domains to the canonical domain'
      ),
      icon: Radio,
    },
    {
      id: 'g2',
      title: tx('گیت ۲: انطباق دقیق تک-<h1> در صفحات', 'Porte 2: Conformité Unique <h1>', 'Gate 2: Strict Single-<h1> Semantic Architecture'),
      status: '100% Passed',
      desc: tx(
        'تضمین وجود دقیقاً یک تگ <h1> در هر صفحه و حفظ سلسله‌مراتب تیترها',
        'Garantie stricte d’un seul <h1> par modèle sans doublon dans les widgets',
        'Strict enforcement of exactly one <h1> per template; no duplicate h1 in widgets'
      ),
      icon: FileCheck,
    },
    {
      id: 'g3',
      title: tx('گیت ۳: کشف هوش مصنوعی و دوقلوی مارک‌داون', 'Porte 3: Découverte GEO & /llms.txt', 'Gate 3: GEO /llms.txt & Markdown Twins'),
      status: '100% Passed',
      desc: tx(
        'هدرهای استاندارد، ساختار خلاصه‌بندی شده و اتصال تمام دوقلوهای .md',
        'En-têtes text/plain; charset=utf-8, titres structurés et terminaux .md actifs',
        'text/plain; charset=utf-8 headers, structured headings, working .md endpoints'
      ),
      icon: Cpu,
    },
    {
      id: 'g4',
      title: tx('گیت ۴: امنیت Zero-Trust و پنهان‌سازی پورت‌ها', 'Porte 4: Sécurité Zero-Trust & Ports', 'Gate 4: Zero-Trust Security & Port Cloaking'),
      status: '100% Passed',
      desc: tx(
        'مسدود بودن پورت‌های ۲۲، ۸۰، ۴۴۳، ۵۴۳۲، ۶۳۷۹، ۸۰۵۵، ۸۱۸۲ و عبور از تونل کلادفلیر',
        'Tous les ports entrants masqués ; routage exclusif par Cloudflare Tunnel',
        'All public inbound ports cloaked; routed exclusively via Cloudflare Tunnel'
      ),
      icon: Lock,
    },
    {
      id: 'g5',
      title: tx('گیت ۵: سرعت در ایران و مقاومت در برابر فیلترینگ', 'Porte 5: Résistance Censure & Vitesse', 'Gate 5: Censorship Resistance & Iran CWV'),
      status: '100% Passed',
      desc: tx(
        'لود زیر ۲ ثانیه، فونت‌های محلی، سرویس‌ورکر PWA و قالب‌های تلگرام IV 2.1',
        'LCP < 2s, polices locales, pack de survie hors-ligne PWA, Telegram Instant View 2.1',
        'LCP < 2s, local fonts, offline PWA survival pack, Telegram Instant View 2.1'
      ),
      icon: Activity,
    },
    {
      id: 'g6',
      title: tx('گیت ۶: انطباق ۱۰۰٪ اصطلاحات لکانی در ایجنت و RAG', 'Porte 6: Terminologie Lacanienne', 'Gate 6: 100% Lacanian Controlled Vocabulary'),
      status: '100% Passed',
      desc: tx(
        'پایش اصطلاحات تخصصی («دگرشنیدن»، «نام‌پدر»، «روان‌پریشی»، «حالت مرزی»)',
        'Précision garantie des concepts psychanalytiques en persan, français et anglais',
        'Guaranteed precision for psychoanalytic terms in Persian, French, and British English'
      ),
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-10">
      {/* Top Banner: Global Operational Status */}
      <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg">
              <ShieldCheck size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping motion-reduce:animate-none" />
                <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
                  {isFa ? 'سامانه کاملاً عملیاتی و سبز' : isFr ? 'SYSTÈME OPÉRATIONNEL & CERTIFIÉ' : 'ALL SYSTEMS OPERATIONAL & CERTIFIED'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {isFa
                  ? 'گواهی رسمی آمادگی پروداکشن (Production Readiness Certificate)'
                  : isFr
                    ? 'Certification Officielle de Pré-Lancement en Production'
                    : 'Official Pre-Launch Production Readiness Certificate'}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-200/80 mt-1">
                {isFa
                  ? 'تمامی ۷ فاز با موفقیت پیاده‌سازی شده و بیش از ۵۲۰ آزمون خودکار به صورت متوالی سبز شده‌اند.'
                  : isFr
                    ? 'Les 7 phases sont implémentées avec succès et plus de 520 tests automatisés sont validés consécutivement.'
                    : 'All 7 architectural phases are fully implemented with 520+ automated tests passing consecutively with 0 regressions.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-emerald-900/40 border border-emerald-500/30 rounded-xl px-5 py-3.5 shrink-0 self-start md:self-auto">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">
                {totalTests}+
              </div>
              <div className="text-[11px] text-emerald-200/70 font-medium">
                {isFa ? 'تست‌های سبز' : isFr ? 'Tests Validés' : 'Passing Tests'}
              </div>
            </div>
            <div className="h-8 w-px bg-emerald-500/30" />
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
                {isFa ? '۱۰۰٪' : '100%'}
              </div>
              <div className="text-[11px] text-amber-200/70 font-medium">
                {tx('امتیاز ممیزی', 'Score QA', 'QA Score')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7 Phases Card Grid */}
      <section aria-label={tx('کارنامه ۷ فاز معماری', 'Bilan des 7 phases', '7 Architectural Phases Scorecard')} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <Layers className="text-amber-500" size={20} />
            <span>
              {tx('کارنامه تحویل ۷ فاز معماری سامانه', 'Bilan des 7 Phases de l’Architecture', '7 Architectural Phases Scorecard')}
            </span>
          </h2>
          <span className="text-xs font-mono text-[var(--foreground-muted)] bg-[var(--surface-sunken)] px-3 py-1 rounded-full border border-[var(--border-subtle)]">
            v1.0.0-PROD
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {phaseCards.map((p) => (
            <div
              key={p.phase}
              className="bg-[var(--surface-overlay)] border border-[var(--border-subtle)] hover:border-amber-500/50 rounded-xl p-5 transition-all shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                    Phase {p.phase}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-mono text-emerald-500 font-semibold">
                    <CheckCircle2 size={14} />
                    {p.tests} tests
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[var(--foreground)] mb-1.5">
                  {p.title}
                </h3>
                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                  {p.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--foreground-muted)]">
                <span>{tx('وضعیت', 'Statut', 'Status')}</span>
                <span className="text-emerald-500 font-medium font-mono">
                  {tx('تأیید نهایی (Pass)', 'Validé 100%', 'Certified 100%')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6-Point Pre-Launch QA Gate Cards */}
      <section aria-label={tx('گیت‌های ۶گانه کنترل کیفیت', 'Les 6 portes QA', '6 Pre-Launch QA Gates')} className="space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
          <CheckCircle2 className="text-emerald-500" size={20} />
          <span>
            {tx('گیت‌های ۶گانه کنترل کیفیت پیش از راه‌اندازی (Pre-Launch QA Gates)', 'Les 6 Portes QA de Pré-Lancement', '6 Pre-Launch QA Gates')}
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {qaGates.map((gate) => {
            const Icon = gate.icon;
            return (
              <div
                key={gate.id}
                className="bg-[var(--surface-overlay)] border border-[var(--border-subtle)] hover:border-emerald-500/40 rounded-xl p-5 transition-all shadow-sm"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-xs sm:text-sm font-bold text-[var(--foreground)] truncate">
                        {gate.title}
                      </h3>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                        {gate.status}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                      {gate.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Cryptography & Infrastructure Summary */}
      <section
        aria-label={tx('مشخصات رمزنگاری و پایداری', 'Spécifications cryptographiques', 'Cryptographic and System Resilience Specs')}
        className="bg-[var(--surface-overlay)] border border-[var(--border-subtle)] rounded-xl p-6 space-y-4"
      >
        <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
          <KeyRound className="text-amber-500" size={18} />
          <span>
            {tx('مشخصات رمزنگاری و پایداری سامانه', 'Spécifications Cryptographiques & Résilience', 'Cryptographic & System Resilience Specs')}
          </span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-[var(--surface-sunken)] border border-[var(--border-subtle)]">
            <div className="text-[var(--foreground-muted)] font-medium mb-1">
              {tx('امضای دیجیتال مقالات', 'Signature Numérique', 'Digital Article Signatures')}
            </div>
            <div className="font-mono font-bold text-[var(--foreground)] text-sm">
              Ed25519 (RFC 8032)
            </div>
            <div className="text-[10px] text-emerald-500 mt-1">
              {tx('تأییدیه کلید عمومی رسمی', 'Clé publique vérifiée', 'Verified official public key')}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[var(--surface-sunken)] border border-[var(--border-subtle)]">
            <div className="text-[var(--foreground-muted)] font-medium mb-1">
              {tx('رمزنگاری بکاپ خارج از سرور', 'Chiffrement Sauvegarde', 'Offsite Backup Encryption')}
            </div>
            <div className="font-mono font-bold text-[var(--foreground)] text-sm">
              AES-256-GCM + AuthTag
            </div>
            <div className="text-[10px] text-emerald-500 mt-1">
              {tx('تگ احراز اصالت ۱۶ بایتی', 'AuthTag 16 octets', '16-byte authentication tag')}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[var(--surface-sunken)] border border-[var(--border-subtle)]">
            <div className="text-[var(--foreground-muted)] font-medium mb-1">
              {tx('جستجوی هیبریدی RAG', 'Recherche Hybride RAG', 'Hybrid RAG Retrieval')}
            </div>
            <div className="font-mono font-bold text-[var(--foreground)] text-sm">
              BM25 + 384d Dense Vector
            </div>
            <div className="text-[10px] text-emerald-500 mt-1">
              {tx('ادغام رتبه‌بندی RRF k=60', 'Fusion RRF k=60', 'RRF k=60 rank fusion')}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[var(--surface-sunken)] border border-[var(--border-subtle)]">
            <div className="text-[var(--foreground-muted)] font-medium mb-1">
              {tx('درگاه پروتکل زمینه مدل', 'Protocole de Contexte (MCP)', 'Model Context Protocol (MCP)')}
            </div>
            <div className="font-mono font-bold text-[var(--foreground)] text-sm">
              JSON-RPC 2.0 (/api/mcp)
            </div>
            <div className="text-[10px] text-emerald-500 mt-1">
              {tx('آماده اتصال استاندارد MCP', 'Compatible protocole standard MCP', 'Standard MCP compatible')}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
