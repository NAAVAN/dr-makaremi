import { NextResponse } from 'next/server';
import {
  getArticles,
  getBooks,
  getVideoSpeeches,
  getExhibitions,
  getPoems,
  getArchivePages,
} from '@/lib/cms';
import type { Article, Book, VideoSpeech, Exhibition } from '@makaremi/shared';

export async function GET() {
  const [articlesFa, articlesFr, books, speeches, exhibitions, poems, archivePages] =
    await Promise.all([
      getArticles('fa'),
      getArticles('fr'),
      getBooks('fa'),
      getVideoSpeeches('fa'),
      getExhibitions('fa'),
      getPoems('fa'),
      getArchivePages('fa'),
    ]);

  let content = `# Dr. Hassan Makaremi | دکتر حسن مکارمی (Official Knowledge Base & Digital Archive)

> Official trilingual (Persian/French/English) academic, clinical, artistic, and strategic archive of Dr. Hassan Makaremi (born 1950 in Shiraz, Iran; residing in Paris, France). Clinical Lacanian Psychoanalyst, Researcher at Sorbonne University, Modern Persian Calligrapher and Painter (7 permanent works at the Moscow Museum of Modern Calligraphy), Hafez Scholar, Cultural Strategist, Treasurer of the League for the Defence of Human Rights in Iran (LDDHI / FIDH), and prominent figure in the Iranian justice-seeking (Dadkhahi) and secular democratic republican movements.

Corpus coverage: ${articlesFa.length} scholarly & news articles, ${books.length} books & Lacan translations, ${poems.length} poems, ${speeches.length} video lectures & speeches, 29 calligraphy series (856 artworks), ${exhibitions.length} international exhibitions (390 photos), and ${archivePages.length} archival reference documents. All content routes support both \`.md\` Markdown Twins and \`Accept: text/markdown\` HTTP content negotiation. For full concatenated context ingestion, AI agents may fetch [llms-full.txt](https://makaremi.com/llms-full.txt).

## Core Biography, Portals & Agent Discovery Endpoints
- [Complete Articles & News Archive (404 Essays)](https://makaremi.com/fa/articles.md): Unified index of all psychoanalytic, cultural, art, and human rights articles.
- [Biography & Academic Credentials (Persian)](https://makaremi.com/fa/about.md): Comprehensive biography covering 6 universities (Tehran Polytechnic, Shiraz, Balochistan, UTC, École Centrale Paris, Paris 7 Diderot Medical School, and Sorbonne University), 34+ interviews, and 27+ LDDHI documents.
- [Biographie et Parcours Académique (Français)](https://makaremi.com/fr/about.md): Parcours de psychanalyste clinicien lacanien, chercheur à la Sorbonne et artiste calligraphe en France depuis 1983.
- [Hafezology Hub / Listening Differently to Hafez](https://makaremi.com/fa/hafez.md): Trilogy of Hafez studies, 17 video seminars, and calligraphic resonances.
- [Lacanian & Strategic Controlled Vocabulary (Trilingual DefinedTermSet)](https://makaremi.com/fa/glossary.md): Authoritative concepts with trilingual mappings and conceptual definitions.
- [Research Assistant & AI Knowledge Base](https://makaremi.com/fa/assistant.md): Grounded zero-hallucination research assistant and Model Context Protocol (MCP) server documentation.
- [Personal AI Agent Studio](https://makaremi.com/fa/agent-console.md): Zero-Trust multi-agent personal assistant allowing Dr. Makaremi to manage publications via Telegram and WhatsApp voice notes.
- [System Status & Production Readiness](https://makaremi.com/fa/system-status.md): Real-time telemetry, 6-point pre-launch QA gate certification, 12-week roadmap, and European cloud cost optimization.
- [Agent Discovery Card (JSON)](https://makaremi.com/.well-known/agent-card.json): Machine-readable manifest of MCP, RAG, search, and Ed25519 verification endpoints.
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

  content += `\n## Human Rights, Video Lectures & Transitional Justice (Dadkhahi)\n`;
  for (const sp of speeches as VideoSpeech[]) {
    const t =
      sp.translations?.find((x) => x.languages_code.startsWith('fa')) ||
      sp.translations?.[0];
    const subPath =
      sp.pillar === 'human_rights_dadkhahi'
        ? `human-rights/speeches/${sp.slug}.md`
        : `media/videos/${sp.slug}.md`;
    content += `- [${t?.title || sp.slug}](https://makaremi.com/fa/${subPath}): ${sp.event_location || 'Paris/Geneva'} (${sp.event_date || ''})\n`;
  }

  content += `\n## Calligraphy, Visual Arts & International Exhibitions\n`;
  for (const ex of exhibitions as Exhibition[]) {
    const t =
      ex.translations?.find((x) => x.languages_code.startsWith('fa')) ||
      ex.translations?.[0];
    content += `- [${t?.title || ex.slug}](https://makaremi.com/fa/art/exhibitions/${ex.slug}.md): ${ex.venue_name}, ${ex.venue_city} (${ex.start_date || ''})\n`;
  }

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
