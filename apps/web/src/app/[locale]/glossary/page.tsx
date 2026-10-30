import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLacanianGlossary } from '@/lib/cms';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { GlossaryExplorer } from '@/components/glossary/GlossaryExplorer';
import { JsonLdGraph } from '@/components/seo/JsonLdGraph';
import { buildFullGraph, buildDefinedTermSetNode, buildBreadcrumbNode } from '@/lib/schema-org';
import { sanitizeMetaString } from '@/lib/academic-metadata';

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

  const titles: Record<Locale, string> = {
    fa: 'اصطلاح‌نامه تخصصی لکانی و مطالعات راهبردی | دکتر حسن مکارمی',
    fr: 'Glossaire et Ontologie Psychanalytique Lacanienne | Dr Hassan Makaremi',
    en: 'Lacanian & Strategic Controlled Vocabulary & Ontology | Dr. Hassan Makaremi',
  };

  const descriptions: Record<Locale, string> = {
    fa: 'واژه‌نامه کنترل‌شده مفاهیم بالینی روانکاوی لکانی (دگرشنیدن، عملیات نام پدر، حالت مرزی) و واژگان راهبردی تالیف و ترجمه دکتر حسن مکارمی.',
    fr: "Vocabulaire contrôlé et ontologie des concepts psychanalytiques lacaniens (Écouter autrement, Opération Nom-du-Père, État Limite) développés par le Dr Makaremi.",
    en: 'Controlled ontology and vocabulary of Lacanian clinical psychoanalytic concepts and cultural strategic terms by Dr. Hassan Makaremi.',
  };

  const title = sanitizeMetaString(titles[locale as Locale]);
  const description = sanitizeMetaString(descriptions[locale as Locale]);
  const baseUrl = 'https://makaremi.com';
  const pageUrl = `${baseUrl}/${locale}/glossary`;
  const markdownUrl = `${pageUrl}.md`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
      languages: {
        'fa-IR': `${baseUrl}/fa/glossary`,
        'fr-FR': `${baseUrl}/fr/glossary`,
        'en-US': `${baseUrl}/en/glossary`,
        'x-default': `${baseUrl}/fa/glossary`,
      },
      types: {
        'text/markdown': markdownUrl,
      },
    },
    other: {
      citation_title: title,
      citation_author: 'Makaremi, Hassan',
      citation_language: locale,
      citation_abstract_html_url: pageUrl,
      citation_fulltext_html_url: pageUrl,
      citation_markdown_url: markdownUrl,
      'DC.title': title,
      'DC.creator': 'Dr. Hassan Makaremi',
      'DC.subject': 'Lacanian Psychoanalysis, Controlled Vocabulary, Ontology',
      'DC.description': description,
      'DC.identifier': pageUrl,
      'DC.language': locale,
    },
  };
}

export default async function GlossaryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  if (!isValidLocale(locale)) notFound();

  const terms = await getLacanianGlossary();

  const isFa = locale === 'fa';
  const isFr = locale === 'fr';

  const baseUrl = 'https://makaremi.com';
  const breadcrumbs = [
    { name: isFa ? 'صفحه اصلی' : isFr ? 'Accueil' : 'Home', url: `${baseUrl}/${locale}` },
    {
      name: isFa ? 'اصطلاح‌نامه تخصصی' : isFr ? 'Glossaire Lacanien' : 'Lacanian Glossary',
      url: `${baseUrl}/${locale}/glossary`,
    },
  ];

  const graphData = buildFullGraph({
    locale,
    items: [
      buildDefinedTermSetNode(terms, locale),
      buildBreadcrumbNode(breadcrumbs),
    ],
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-5xl">
      {/* AI Discovery Link for Markdown Twin */}
      <link
        rel="alternate"
        type="text/markdown"
        href={`${baseUrl}/${locale}/glossary.md`}
        title="Lacanian Glossary Clean Markdown Twin for AI Agents (AEO/GEO)"
      />

      {/* XSS-Immune JSON-LD Schema.org Graph */}
      <JsonLdGraph data={graphData} />

      {/* Header with STRICT SINGLE <h1> */}
      <header className="mb-10 text-center sm:text-start">
        <span className="text-xs font-mono uppercase tracking-widest text-[var(--primary)] font-bold mb-2 block">
          {isFa
            ? 'هستی‌شناسی و واژه‌نامه کنترل‌شده (Controlled Ontology)'
            : isFr
            ? 'Ontologie et Vocabulaire Contrôlé'
            : 'Controlled Vocabulary & Ontology'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] font-serif leading-tight">
          {isFa
            ? 'اصطلاح‌نامه تخصصی لکانی و مطالعات راهبردی'
            : isFr
            ? 'Glossaire et Ontologie Psychanalytique Lacanienne'
            : 'Lacanian & Strategic Controlled Vocabulary'}
        </h1>
        <p className="mt-3 text-sm sm:text-base text-[var(--foreground-muted)] max-w-3xl leading-relaxed">
          {isFa
            ? 'مجموعه تعاریف مفهومی، اصطلاحات بالینی لکانی و مفاهیم راهبردی تالیف و معادل‌سازی‌شده توسط دکتر حسن مکارمی؛ به همراه معادل‌های متقابل به فرانسوی و انگلیسی جهت ارجاع آکادمیک و استناد مدل‌های هوش مصنوعی.'
            : isFr
            ? 'Répertoire des concepts cliniques lacaniens et termes stratégiques développés par le Dr Hassan Makaremi avec équivalents trilingues et références croisées.'
            : 'Authoritative clinical and strategic terminology developed by Dr. Hassan Makaremi with trilingual cross-references.'}
        </p>
      </header>

      {/* Interactive Explorer Component */}
      <GlossaryExplorer terms={terms} locale={locale} />
    </div>
  );
}
