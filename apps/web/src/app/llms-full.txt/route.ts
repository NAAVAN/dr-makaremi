import { NextResponse } from 'next/server';
import {
  getArticles,
  getBooks,
  getVideoSpeeches,
  getExhibitions,
  getLacanianGlossary,
} from '@/lib/cms';
import type {
  Article,
  Book,
  VideoSpeech,
  Exhibition,
  LacanianGlossaryTerm,
} from '@makaremi/shared';

export async function GET() {
  const [articlesFa, articlesFr, books, speeches, exhibitions, glossary] =
    await Promise.all([
      getArticles('fa'),
      getArticles('fr'),
      getBooks('fa'),
      getVideoSpeeches('fa'),
      getExhibitions('fa'),
      getLacanianGlossary(),
    ]);

  let content = `# Dr. Hassan Makaremi | Full Concatenated Academic & Strategic Corpus (LLMs Full View)
Domain: https://makaremi.com
Status: Production Canonical Archive
Export Date: ${new Date().toISOString()}

================================================================================
SECTION 1: BIOGRAPHY & ACADEMIC CREDENTIALS
================================================================================
Dr. Hassan Makaremi was born in Shiraz, Iran in 1950. He graduated from Amirkabir University of Technology (Tehran Polytechnic), Shiraz University, Balochistan University, École Centrale Paris, Université Paris Diderot (Paris 7 Medical School / Psychoanalytic Studies), and Sorbonne University.
Practicing Lacanian psychoanalyst in Paris since 1983. Researcher at Sorbonne University, modern Persian calligrapher and painter (Moscow Museum of Modern Calligraphy), Cultural Strategist, Treasurer of the League for the Defence of Human Rights in Iran (LDDHI / FIDH), and key contributor to the 1988 Prison Massacre justice-seeking movement (Dadkhahi).

================================================================================
SECTION 2: LACANIAN & STRATEGIC CONTROLLED VOCABULARY (DEFINED TERM SET)
================================================================================
`;

  for (const term of glossary as LacanianGlossaryTerm[]) {
    content += `### ${term.term_fa} | ${term.term_fr} (${term.term_en})\n`;
    content += `Pillar: ${term.pillar}\n`;
    content += `Canonical Definition (Persian): ${term.conceptual_definition_fa}\n`;
    if (term.conceptual_definition_fr) {
      content += `Canonical Definition (French): ${term.conceptual_definition_fr}\n`;
    }
    if (term.conceptual_definition_en) {
      content += `Canonical Definition (English): ${term.conceptual_definition_en}\n`;
    }
    content += `\n`;
  }

  content += `================================================================================\nSECTION 3: ARTICLES & RESEARCH PAPERS\n================================================================================\n\n`;

  for (const art of articlesFa as Article[]) {
    const t =
      art.translations?.find((x) => x.languages_code.startsWith('fa')) ||
      art.translations?.[0];
    content += `## [ARTICLE] ${t?.title || art.slug} (${art.pillar})\n`;
    content += `Content SHA-256: ${art.content_sha256}\n`;
    content += `Date: ${art.published_at || art.created_at}\n`;
    content += `Executive Summary:\n${t?.executive_summary || ''}\n\n`;
    content += `Body:\n${t?.body_markdown || ''}\n\n---\n\n`;
  }

  for (const art of articlesFr as Article[]) {
    if (!articlesFa.some((f) => f.slug === art.slug)) {
      const t =
        art.translations?.find((x) => x.languages_code.startsWith('fr')) ||
        art.translations?.[0];
      content += `## [ARTICLE - FR] ${t?.title || art.slug} (${art.pillar})\n`;
      content += `Content SHA-256: ${art.content_sha256}\n`;
      content += `Executive Summary:\n${t?.executive_summary || ''}\n\n`;
      content += `Body:\n${t?.body_markdown || ''}\n\n---\n\n`;
    }
  }

  content += `================================================================================\nSECTION 4: BOOKS & MONOGRAPHS\n================================================================================\n\n`;

  for (const b of books as Book[]) {
    const t =
      b.translations?.find((x) => x.languages_code.startsWith('fa')) ||
      b.translations?.[0];
    content += `## [BOOK] ${t?.title || b.slug}\n`;
    content += `ISBN: ${b.isbn_13 || 'N/A'} | Publisher: ${t?.publisher_name || 'Publisher'} (${b.publication_year})\n`;
    content += `Synopsis:\n${t?.synopsis || ''}\n\n`;
    if (t?.table_of_contents_markdown) {
      content += `Table of Contents:\n${t.table_of_contents_markdown}\n\n`;
    }
    if (t?.sample_chapter_markdown) {
      content += `Sample Chapter:\n${t.sample_chapter_markdown}\n\n`;
    }
    content += `---\n\n`;
  }

  content += `================================================================================\nSECTION 5: SPEECHES & INTERVENTIONS\n================================================================================\n\n`;

  for (const sp of speeches as VideoSpeech[]) {
    const t =
      sp.translations?.find((x) => x.languages_code.startsWith('fa')) ||
      sp.translations?.[0];
    content += `## [SPEECH] ${t?.title || sp.slug}\n`;
    content += `Venue: ${sp.event_location || 'Paris/Geneva'} | Date: ${sp.event_date}\n`;
    content += `Transcript:\n${t?.transcript_markdown || ''}\n\n---\n\n`;
  }

  content += `================================================================================\nSECTION 6: CALLIGRAPHY & EXHIBITIONS\n================================================================================\n\n`;

  for (const ex of exhibitions as Exhibition[]) {
    const t =
      ex.translations?.find((x) => x.languages_code.startsWith('fa')) ||
      ex.translations?.[0];
    content += `## [EXHIBITION] ${t?.title || ex.slug}\n`;
    content += `Location: ${ex.venue_name}, ${ex.venue_city} (${ex.start_date} - ${ex.end_date || 'Ongoing'})\n`;
    content += `Curatorial Statement:\n${t?.curatorial_statement_markdown || ''}\n\n---\n\n`;
  }

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
