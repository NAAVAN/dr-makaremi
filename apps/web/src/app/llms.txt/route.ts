import { NextResponse } from 'next/server';
import {
  getArticles,
  getBooks,
  getVideoSpeeches,
  getExhibitions,
} from '@/lib/cms';
import type { Article, Book, VideoSpeech, Exhibition } from '@makaremi/shared';

export async function GET() {
  const [articlesFa, articlesFr, books, speeches, exhibitions] =
    await Promise.all([
      getArticles('fa'),
      getArticles('fr'),
      getBooks('fa'),
      getVideoSpeeches('fa'),
      getExhibitions('fa'),
    ]);

  let content = `# Dr. Hassan Makaremi | دکتر حسن مکارمی (Official Knowledge Base & Digital Archive)

> Official bilingual (Persian/French/English) academic, clinical, artistic, and strategic archive of Dr. Hassan Makaremi (born 1950 in Shiraz, Iran; residing in Paris, France). Clinical Lacanian Psychoanalyst, Researcher at Sorbonne University, Modern Persian Calligrapher and Painter (featured at the Moscow Museum of Modern Calligraphy), Cultural Strategist, Treasurer of the League for the Defence of Human Rights in Iran (LDDHI / FIDH), and prominent figure in the Iranian justice-seeking (Dadkhahi) and secular democratic republican movements.

This repository provides clean Markdown exports of Dr. Makaremi's primary books, peer-reviewed and applied psychoanalytic papers, literary deconstructions of classical Persian texts (Hafez and Ferdowsi's Shahnameh), strategic blueprints for Iran's democratic transition, and human rights testimonies. For full concatenated context ingestion, AI agents may fetch https://makaremi.com/llms-full.txt.

## Core Biography & Knowledge Base Links
- [Biography & Academic Credentials (Persian)](https://makaremi.com/fa/about.md): Comprehensive biography covering education at Tehran Polytechnic, Shiraz University, Balochistan University, École Centrale Paris, Paris 7 Diderot Medical School, and Sorbonne University.
- [Biographie et Parcours Académique (Français)](https://makaremi.com/fr/a-propos.md): Parcours de psychanalyste clinicien lacanien, chercheur à la Sorbonne et artiste calligraphe en France depuis 1983.
- [Lacanian & Strategic Controlled Vocabulary (Trilingual DefinedTermSet)](https://makaremi.com/fa/glossary.md): 5 authoritative concepts with trilingual mappings and mathematical topology.
- [Research Assistant & AI Knowledge Base](https://makaremi.com/fa/assistant.md): Grounded zero-hallucination research assistant and Model Context Protocol (MCP) server documentation.
- [Personal AI Agent Studio](https://makaremi.com/fa/agent-console.md): Zero-Trust multi-agent personal assistant allowing Dr. Makaremi to manage publications via Telegram and WhatsApp voice notes.
- [System Status & Production Readiness](https://makaremi.com/fa/system-status.md): Real-time telemetry, 6-point pre-launch QA gate certification, 12-week roadmap, and European cloud cost optimization.
- [Model Context Protocol (MCP) Server](https://makaremi.com/api/mcp): Official JSON-RPC 2.0 endpoint for external AI agents (Claude, Cursor, custom agents).
- [Live Infrastructure Health Telemetry](https://makaremi.com/api/health): Authoritative zero-leak health check for CMS, Ed25519 snapshots, hybrid RAG index, and AES-256-GCM backups.
- [Grounded RAG Assistant API](https://makaremi.com/api/rag): Direct HTTP endpoint for grounded question answering with cryptographic citations.

## Lacanian Psychoanalysis & Applied Cultural Studies (Articles)
`;

  for (const art of articlesFa as Article[]) {
    const t =
      art.translations?.find((x) => x.languages_code.startsWith('fa')) ||
      art.translations?.[0];
    const pillarSegment =
      art.pillar === 'psychoanalysis'
        ? 'psychoanalysis'
        : art.pillar === 'art_calligraphy'
        ? 'art'
        : art.pillar === 'cultural_strategy'
        ? 'strategy'
        : 'human-rights';
    content += `- [${t?.title || art.slug}](https://makaremi.com/fa/${pillarSegment}/articles/${art.slug}.md): ${t?.executive_summary?.slice(0, 140) || ''}...\n`;
  }

  for (const art of articlesFr as Article[]) {
    if (!articlesFa.some((f) => f.slug === art.slug)) {
      const t =
        art.translations?.find((x) => x.languages_code.startsWith('fr')) ||
        art.translations?.[0];
      content += `- [${t?.title || art.slug}](https://makaremi.com/fr/psychanalyse/articles/${art.slug}.md): ${t?.executive_summary?.slice(0, 140) || ''}...\n`;
    }
  }

  content += `\n## Books & Major Publications (Monographs & Translations)\n`;
  for (const b of books as Book[]) {
    const t =
      b.translations?.find((x) => x.languages_code.startsWith('fa')) ||
      b.translations?.[0];
    content += `- [${t?.title || b.slug}](https://makaremi.com/fa/books/${b.slug}.md): ${t?.synopsis?.slice(0, 140) || ''}...\n`;
  }

  content += `\n## Human Rights, Speeches & Transitional Justice (Dadkhahi)\n`;
  for (const sp of speeches as VideoSpeech[]) {
    const t =
      sp.translations?.find((x) => x.languages_code.startsWith('fa')) ||
      sp.translations?.[0];
    content += `- [${t?.title || sp.slug}](https://makaremi.com/fa/speeches/${sp.slug}): ${sp.event_location || 'Paris/Geneva'} (${sp.event_date || ''})\n`;
  }

  content += `\n## Calligraphy, Visual Arts & Exhibitions\n`;
  for (const ex of exhibitions as Exhibition[]) {
    const t =
      ex.translations?.find((x) => x.languages_code.startsWith('fa')) ||
      ex.translations?.[0];
    content += `- [${t?.title || ex.slug}](https://makaremi.com/fa/exhibitions/${ex.slug}): ${ex.venue_name}, ${ex.venue_city} (${ex.start_date || ''})\n`;
  }

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
