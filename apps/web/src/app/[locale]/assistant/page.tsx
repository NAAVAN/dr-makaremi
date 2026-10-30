import React from 'react';
import type { Metadata } from 'next';
import type { Locale } from '@makaremi/shared';
import { JsonLdGraph } from '@/components/seo/JsonLdGraph';
import { ResearchAssistantChat } from '@/components/assistant/ResearchAssistantChat';
import { FacebookEtlStudio } from '@/components/assistant/FacebookEtlStudio';

interface AssistantPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AssistantPageProps): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    fa: 'دستیار هوشمند پژوهشگر و کارگاه آرشیو آثار دکتر حسن مکارمی',
    fr: 'Assistant de Recherche Intelligent - Dr Hassan Makaremi',
    en: 'Research Assistant & Digital Archive Studio - Dr. Hassan Makaremi',
  };

  const descriptions: Record<string, string> = {
    fa: 'دستیار هوشمند پژوهشگر با استناد به اسناد معتبر، استخراج و نرمال‌سازی داده‌های فیس‌بوک، و سرور پروتکل زمینه مدل (MCP).',
    fr: "Assistant de recherche académique et clinique sans hallucination fondé sur le corpus officiel du Dr Hassan Makaremi.",
    en: "Zero-hallucination grounded research assistant with SHA-256 citations and MCP server for Dr. Hassan Makaremi's corpus.",
  };

  const pageTitle = titles[locale] || titles.fa;
  const pageDescription = descriptions[locale] || descriptions.fa;

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: `https://makaremi.com/${locale}/assistant`,
      languages: {
        fa: 'https://makaremi.com/fa/assistant',
        fr: 'https://makaremi.com/fr/assistant',
        en: 'https://makaremi.com/en/assistant',
      },
      types: {
        'text/markdown': `https://makaremi.com/${locale}/assistant.md`,
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

export default async function AssistantPage({ params }: AssistantPageProps) {
  const { locale: rawLocale } = await params;
  const locale = (['fa', 'fr', 'en'].includes(rawLocale) ? rawLocale : 'fa') as Locale;

  const jsonLdGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `https://makaremi.com/${locale}/assistant#app`,
        url: `https://makaremi.com/${locale}/assistant`,
        name:
          locale === 'fa'
            ? 'دستیار هوشمند پژوهشگر آثار دکتر حسن مکارمی'
            : locale === 'fr'
            ? 'Assistant de Recherche Intelligent - Dr Hassan Makaremi'
            : 'Dr. Hassan Makaremi Research Assistant',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'All',
        author: {
          '@type': 'Person',
          '@id': 'https://makaremi.com/#hassan-makaremi',
          name: 'Dr. Hassan Makaremi',
        },
        description:
          'Zero-hallucination grounded research assistant with SHA-256 citations and Model Context Protocol (MCP) server.',
      },
    ],
  };

  const isRtl = locale === 'fa';

  return (
    <>
      {/* Explicit markdown twin link for browser and crawler discovery */}
      <link
        rel="alternate"
        type="text/markdown"
        href={`https://makaremi.com/${locale}/assistant.md`}
      />

      <JsonLdGraph data={jsonLdGraph} />

      <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 space-y-12" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Exactly ONE <h1> tag in the entire document tree */}
        <header className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Hybrid RAG + MCP Protocol (JSON-RPC 2.0)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 font-serif">
            {locale === 'fa'
              ? 'دستیار هوشمند پژوهشگر آثار دکتر حسن مکارمی'
              : locale === 'fr'
              ? 'Assistant de Recherche Intelligent - Dr Hassan Makaremi'
              : 'Dr. Hassan Makaremi Research Assistant & Archive Studio'}
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            {locale === 'fa'
              ? 'سامانه هوشمند استنتاجی بدون توهم (Zero-Hallucination) مبتنی بر جستجوی ترکیبی برداری و واژگانی در تمامی کتاب‌ها، مقالات روان‌کاوی، سخنرانی‌ها و دست‌نوشته‌های فیس‌بوک با ارجاع قطعی و هش SHA-256.'
              : locale === 'fr'
              ? 'Plateforme de recherche clinique et philosophique ancrée sur le corpus authentifié du Dr Makaremi, avec vérification cryptographique et protocole MCP.'
              : 'Grounded academic knowledge retrieval and interactive archival ingestion engine with SHA-256 content verification and MCP protocol support.'}
          </p>
        </header>

        {/* Section 1: Grounded Research Assistant Chat */}
        <section aria-labelledby="assistant-chat-heading" className="space-y-4">
          <h2 id="assistant-chat-heading" className="sr-only">
            {locale === 'fa' ? 'گفت‌وگو با دستیار پژوهشگر' : 'Research Assistant Chat'}
          </h2>
          <ResearchAssistantChat locale={locale} />
        </section>

        {/* Section 2: Facebook ETL & Migration Studio */}
        <section aria-labelledby="etl-studio-heading" className="pt-12 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="max-w-5xl mx-auto text-center space-y-2">
            <h2 id="etl-studio-heading" className="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-serif">
              {locale === 'fa'
                ? 'کارگاه پایپ‌لاین مهاجرت، پالایش و ادغام آرشیو فیس‌بوک و وردپرس'
                : 'Facebook & WordPress Archive Ingestion & Normalization Studio'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
              {locale === 'fa'
                ? 'نرمال‌سازی خودکار خط فارسی و نیم‌فاصله (ZWNJ)، حذف پست‌های خرد کمتر از ۸۰ کلمه، ادغام یادداشت‌های سریالی و امضای دیجیتال Ed25519.'
                : 'Automated Persian typography normalization, micro-post filtering, thread merging, and Ed25519 signing.'}
            </p>
          </div>

          <FacebookEtlStudio locale={locale} />
        </section>
      </main>
    </>
  );
}
