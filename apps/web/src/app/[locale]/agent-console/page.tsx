import React from 'react';
import type { Metadata } from 'next';
import type { Locale } from '@makaremi/shared';
import { JsonLdGraph } from '@/components/seo/JsonLdGraph';
import VoiceAgentSimulator from '@/components/agent/VoiceAgentSimulator';
import AssetIngestSimulator from '@/components/agent/AssetIngestSimulator';
import CommentModerationSimulator from '@/components/agent/CommentModerationSimulator';

interface AgentConsolePageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return [{ locale: 'fa' }, { locale: 'fr' }, { locale: 'en' }];
}

export async function generateMetadata({ params }: AgentConsolePageProps): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    fa: 'پیشخوان ایجنت شخصی تلگرام و واتس‌اپ دکتر حسن مکارمی | Personal AI Agent Studio',
    fr: 'Studio Agent Personnel IA - Dr Hassan Makaremi | Telegram & WhatsApp',
    en: 'Dr. Hassan Makaremi Personal AI Agent Studio | Telegram & WhatsApp Automation',
  };

  const descriptions: Record<string, string> = {
    fa: 'سامانه چندعاملی Zero-Trust مدیریت سایت، تبدیل خودکار ویس به مقاله علمی با واژه‌نامه لکانی، ویرایش صوتی، تأیید دو مرحله‌ای و توزیع هم‌زمان در ۵ کانال.',
    fr: 'Système multi-agent Zero-Trust permettant au Dr Hassan Makaremi de dicter des articles scientifiques, modérer les commentaires et publier simultanément sur 5 canaux.',
    en: 'Zero-Trust multi-agent AI system enabling Dr. Hassan Makaremi to transcribe voice notes into psychoanalytic papers, perform voice revisions, and publish across 5 channels.',
  };

  const pageTitle = titles[locale] || titles.fa!;
  const pageDescription = descriptions[locale] || descriptions.fa!;

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: `https://makaremi.com/${locale}/agent-console`,
      languages: {
        fa: 'https://makaremi.com/fa/agent-console',
        fr: 'https://makaremi.com/fr/agent-console',
        en: 'https://makaremi.com/en/agent-console',
      },
      types: {
        'text/markdown': `https://makaremi.com/${locale}/agent-console.md`,
      },
    },
    other: {
      citation_title: pageTitle,
      citation_author: 'Dr. Hassan Makaremi',
      'DC.title': pageTitle,
      'DC.creator': 'Dr. Hassan Makaremi',
    },
  };
}

export default async function AgentConsolePage({ params }: AgentConsolePageProps) {
  const { locale: rawLocale } = await params;
  const locale = (['fa', 'fr', 'en'].includes(rawLocale) ? rawLocale : 'fa') as Locale;

  const pageHeaders: Record<string, { title: string; subtitle: string }> = {
    fa: {
      title: 'پیشخوان ایجنت شخصی تلگرام و واتس‌اپ استاد',
      subtitle: 'مدیریت یکپارچه وب‌سایت، انتشار چندکاناله مقالات و نظارت هوشمند تنها با یک پیام صوتی',
    },
    fr: {
      title: 'Studio Agent Personnel IA du Dr Hassan Makaremi',
      subtitle: 'Gestion éditoriale automatisée, transcription vocale certifiée et diffusion omnicanale',
    },
    en: {
      title: 'Dr. Hassan Makaremi Personal AI Agent Studio',
      subtitle: 'Zero-Trust voice-driven publishing, Lacanian glossary enrichment, and omnichannel orchestration',
    },
  };

  const currentHeader = pageHeaders[locale] || pageHeaders.fa!;

  // Strict Schema.org SoftwareApplication graph linked to Dr. Hassan Makaremi
  const jsonLdGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://makaremi.com/#personal-agent-studio',
        name: 'Dr. Hassan Makaremi Personal AI Agent Studio',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All (Cloudflare Edge, Telegram Bot API, WhatsApp Business API)',
        author: {
          '@type': 'Person',
          '@id': 'https://makaremi.com/#hassan-makaremi',
          name: 'Dr. Hassan Makaremi',
        },
        description: currentHeader.subtitle,
        softwareVersion: '1.0.0-PROD',
        featureList: [
          'Voice-to-Article Transcription with Lacanian Glossary',
          'Voice Revision Loop with Ed25519 Re-Signing',
          'Two-Factor PIN Publish Challenge (Anti-Brute-Force)',
          'Omnichannel Publication: Website, Telegram Instant View 2.1, Facebook, LinkedIn, Instagram SVG, Newsletter',
          'IIIF Deep-Zoom Asset Processing for Books and Artworks',
          'Voice-Driven Comment Moderation with Prompt Injection Immunity',
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Strict JSON-LD Graph for SoftwareApplication */}
      <JsonLdGraph data={jsonLdGraph} />

      <div className="max-w-6xl mx-auto space-y-10">
        {/* Top Header Section - STRICTLY SINGLE <h1> IN THE ENTIRE PAGE */}
        <header className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            ZERO-TRUST MULTI-AGENT ORCHESTRATION &bull; PHASE 6
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {currentHeader.title}
          </h1>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed">
            {currentHeader.subtitle}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-500 pt-2">
            <span>Auth: HMAC-SHA256 &bull; timingSafeEqual</span>
            <span>&bull;</span>
            <span>Ed25519 Signatures</span>
            <span>&bull;</span>
            <a
              href={`/${locale}/agent-console.md`}
              className="text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Markdown Twin (AEO/LLM)</span>
              <span>&rarr;</span>
            </a>
          </div>
        </header>

        {/* 1. Main Interactive Voice Agent Simulator */}
        <section aria-labelledby="voice-simulator-heading">
          <VoiceAgentSimulator />
        </section>

        {/* 2. Grid with IIIF Asset Ingest & Comment Moderation Simulators */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section aria-labelledby="asset-ingest-heading">
            <AssetIngestSimulator />
          </section>

          <section aria-labelledby="comment-moderation-heading">
            <CommentModerationSimulator />
          </section>
        </div>
      </div>
    </main>
  );
}
