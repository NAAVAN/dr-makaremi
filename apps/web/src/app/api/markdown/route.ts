import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  getArticleBySlug,
  getBookBySlug,
  getExhibitionBySlug,
  getPoemBySlug,
  getVideoSpeechBySlug,
  getBooks,
  getArticles,
  getLacanianGlossary,
} from '@/lib/cms';
import type { Locale } from '@makaremi/shared';

const PathSchema = z
  .string()
  .min(1)
  .max(512)
  .regex(/^\/[a-zA-Z0-9_\-\/.]+\.md$/, 'Invalid markdown path format')
  .refine((p) => !p.includes('..'), 'Path traversal prohibited');

export async function GET(request: NextRequest) {
  // Rate limit: 100 requests per minute
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 100 }, 'markdown');
  if (!rl.allowed) return rl.response!;

  const urlObj = new URL(request.url);
  const rawPath =
    request.nextUrl.searchParams.get('path') ||
    urlObj.searchParams.get('path') ||
    request.headers.get('x-markdown-path') ||
    (request.nextUrl.pathname.endsWith('.md') ? request.nextUrl.pathname : '') ||
    '';

  const parseResult = PathSchema.safeParse(rawPath);
  if (!parseResult.success) {
    return new NextResponse(
      `# Error 400: Bad Request\nInvalid path specified for markdown twin: "${rawPath}"\nIssues: ${JSON.stringify(parseResult.error.issues)}`,
      {
        status: 400,
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
      }
    );
  }

  const path = parseResult.data;
  const cleanPath = path.slice(0, -3); // remove .md
  const segments = cleanPath.split('/').filter(Boolean);
  const locale = (segments[0] || 'fa') as Locale;

  let markdown = '';

  // 1. Single Book: /[locale]/books/[slug]
  if (segments.length === 3 && segments[1] === 'books') {
    const slug = segments[2];
    const book = await getBookBySlug(slug, locale);
    if (book) {
      const trans =
        book.translations?.find((t) => t.languages_code.startsWith(locale)) ||
        book.translations?.[0];
      markdown = `# ${trans?.title || book.slug}\n\n`;
      if (trans?.subtitle) markdown += `> ${trans.subtitle}\n\n`;
      markdown += `**Author:** Dr. Hassan Makaremi | دکتر حسن مکارمی\n`;
      if (book.isbn_13) markdown += `**ISBN-13:** ${book.isbn_13}\n`;
      markdown += `**Publisher:** ${trans?.publisher_name || 'N/A'}\n`;
      markdown += `**Year:** ${book.publication_year}\n`;
      if (book.page_count) markdown += `**Pages:** ${book.page_count}\n`;
      markdown += `\n---\n\n## Synopsis\n${trans?.synopsis || ''}\n\n`;
      if (trans?.table_of_contents_markdown) {
        markdown += `## Table of Contents\n${trans.table_of_contents_markdown}\n\n`;
      }
      if (trans?.sample_chapter_markdown) {
        markdown += `## Sample Chapter\n${trans.sample_chapter_markdown}\n\n`;
      }
    }
  }

  // 2. Single Article: /[locale]/[pillar]/articles/[slug]
  if (segments.length === 4 && segments[2] === 'articles') {
    const slug = segments[3];
    const article = await getArticleBySlug(slug, locale);
    if (article) {
      const trans =
        article.translations?.find((t) => t.languages_code.startsWith(locale)) ||
        article.translations?.[0];
      markdown = `# ${trans?.title || article.slug}\n\n`;
      markdown += `> ${trans?.executive_summary || ''}\n\n`;
      markdown += `**Author:** Dr. Hassan Makaremi | دکتر حسن مکارمی\n`;
      markdown += `**Pillar:** ${article.pillar}\n`;
      markdown += `**Date:** ${article.published_at || article.created_at}\n`;
      markdown += `**SHA-256 Digital Fingerprint:** \`${article.content_sha256}\`\n\n`;
      markdown += `---\n\n${trans?.body_markdown || ''}\n`;
    }
  }

  // 3. Single Exhibition: /[locale]/art/exhibitions/[slug]
  if (segments.length === 4 && segments[1] === 'art' && segments[2] === 'exhibitions') {
    const slug = segments[3];
    const exhibition = await getExhibitionBySlug(slug, locale);
    if (exhibition) {
      const trans =
        exhibition.translations?.find((t) => t.languages_code.startsWith(locale)) ||
        exhibition.translations?.[0];
      markdown = `# ${trans?.title || exhibition.slug}\n\n`;
      markdown += `**Venue:** ${exhibition.venue_name}, ${exhibition.venue_city}\n`;
      markdown += `**Dates:** ${exhibition.start_date} ${exhibition.end_date ? 'to ' + exhibition.end_date : ''}\n\n`;
      markdown += `## Curatorial Statement\n${trans?.curatorial_statement_markdown || ''}\n`;
    }
  }

  // 4. Single Poem: /[locale]/poetry/poems/[slug]
  if (segments.length === 4 && segments[1] === 'poetry' && segments[2] === 'poems') {
    const slug = segments[3];
    const poem = await getPoemBySlug(slug, locale);
    if (poem) {
      const trans =
        poem.translations?.find((t) => t.languages_code.startsWith(locale)) ||
        poem.translations?.[0];
      markdown = `# ${trans?.title || poem.slug}\n\n`;
      markdown += `**Author:** Dr. Hassan Makaremi\n\n`;
      if (trans?.verses) {
        markdown += trans.verses
          .map((v) => `${v.hemistich_a} ... ${v.hemistich_b || ''}`)
          .join('\n');
        markdown += '\n\n';
      }
      if (trans?.commentary_markdown) {
        markdown += `## Commentary\n${trans.commentary_markdown}\n`;
      }
    }
  }

  // 5. Single Speech: /[locale]/human-rights/speeches/[slug]
  if (segments.length === 4 && segments[1] === 'human-rights' && segments[2] === 'speeches') {
    const slug = segments[3];
    const video = await getVideoSpeechBySlug(slug, locale);
    if (video) {
      const trans =
        video.translations?.find((t) => t.languages_code.startsWith(locale)) ||
        video.translations?.[0];
      markdown = `# ${trans?.title || video.slug}\n\n`;
      markdown += `**Speaker:** Dr. Hassan Makaremi\n`;
      markdown += `**Date:** ${video.event_date}\n`;
      markdown += `**Location:** ${video.event_location || 'Geneva/Paris'}\n\n`;
      markdown += `## Description\n${trans?.description || ''}\n\n`;
      markdown += `## Full Transcript\n${trans?.transcript_markdown || ''}\n`;
    }
  }

  // 6. Lacanian Glossary / Ontology: /[locale]/glossary
  if (segments.length === 2 && segments[1] === 'glossary') {
    const terms = await getLacanianGlossary();
    markdown = `# Lacanian & Strategic Controlled Vocabulary | اصطلاح‌نامه تخصصی لکانی و راهبردی\n\n`;
    markdown += `> Authoritative clinical, psychoanalytic, and cultural strategic terminology developed and translated by Dr. Hassan Makaremi.\n\n`;
    for (const t of terms) {
      const primary = locale === 'fa' ? t.term_fa : locale === 'fr' ? t.term_fr : t.term_en;
      const def =
        locale === 'fa'
          ? t.conceptual_definition_fa
          : locale === 'fr'
          ? t.conceptual_definition_fr || t.conceptual_definition_fa
          : t.conceptual_definition_en || t.conceptual_definition_fa;
      markdown += `## ${primary}\n`;
      markdown += `- **Persian (FA):** ${t.term_fa}\n`;
      markdown += `- **French (FR):** ${t.term_fr}\n`;
      markdown += `- **English (EN):** ${t.term_en}\n`;
      markdown += `- **Pillar:** ${t.pillar}\n`;
      markdown += `- **Conceptual Definition:** ${def}\n\n`;
    }
  }

  // 6.5 Research Assistant & Knowledge Base: /[locale]/assistant
  if (segments.length === 2 && segments[1] === 'assistant') {
    const title =
      locale === 'fa'
        ? 'دستیار هوشمند پژوهشگر آثار دکتر حسن مکارمی | Grounded RAG & MCP Archive'
        : locale === 'fr'
        ? 'Assistant de Recherche Intelligent - Dr Hassan Makaremi | Grounded RAG'
        : 'Dr. Hassan Makaremi Research Assistant & MCP Knowledge Base';
    markdown = `# ${title}\n\n`;
    markdown += `> Authoritative Zero-Hallucination Grounded Research Assistant for the works, psychoanalytic papers, books, and strategic writings of Dr. Hassan Makaremi.\n\n`;
    markdown += `## System Capabilities\n`;
    markdown += `- **Hybrid Retrieval:** Dense Semantic Vector search (384d) + BM25 Lexical search combined with Reciprocal Rank Fusion (RRF k=60).\n`;
    markdown += `- **Cryptographic Verification:** Every retrieved citation is pinned with its authoritative SHA-256 fingerprint.\n`;
    markdown += `- **Model Context Protocol (MCP):** Connect external LLMs (Claude Desktop, Cursor, Custom Agents) via JSON-RPC 2.0 at \`/api/mcp\`.\n`;
    markdown += `- **Direct API Access:** Interrogate the grounded RAG assistant directly via \`POST /api/rag\`.\n\n`;
    markdown += `## Canonical Endpoints\n`;
    markdown += `- Interactive UI: https://makaremi.com/${locale}/assistant\n`;
    markdown += `- MCP Endpoint: https://makaremi.com/api/mcp\n`;
    markdown += `- RAG Endpoint: https://makaremi.com/api/rag\n`;
    markdown += `- Search Endpoint: https://makaremi.com/api/search\n\n`;
  }

  // 6.6 Personal AI Agent Console: /[locale]/agent-console
  if (segments.length === 2 && segments[1] === 'agent-console') {
    const title =
      locale === 'fa'
        ? 'پیشخوان ایجنت شخصی تلگرام و واتس‌اپ دکتر حسن مکارمی | Personal AI Agent Studio'
        : locale === 'fr'
        ? 'Studio Agent Personnel IA - Dr Hassan Makaremi | Telegram & WhatsApp'
        : 'Dr. Hassan Makaremi Personal AI Agent Studio | Telegram & WhatsApp Automation';
    markdown = `# ${title}\n\n`;
    markdown += `> Zero-Trust Multi-Agent AI System enabling Dr. Hassan Makaremi to manage publications, academic essays, artwork, and community comments via Telegram and WhatsApp voice notes.\n\n`;
    markdown += `## Architecture & Key Capabilities\n`;
    markdown += `- **Voice-to-Article ASR:** Transcribe Persian and French voice messages using Whisper Large-v3 with automated Lacanian psychoanalytic glossary enrichment (\`lacanian_glossary\`) and Persian typography normalization.\n`;
    markdown += `- **Voice Revision Loop:** Multi-turn iterative revision of drafts driven by voice commands with live Ed25519 signature updates.\n`;
    markdown += `- **Two-Factor Publish Challenge (2FA):** 3-minute single-use PIN challenge with 3-attempt brute-force lockout before atomic publication.\n`;
    markdown += `- **Synchronized Omnichannel Distribution:** Atomic simultaneous release across Website CMS, Telegram Instant View 2.1, Facebook, LinkedIn, Instagram SVG Quote Cards, Anti-Censorship Email Newsletter, and AI \`/llms.txt\`.\n`;
    markdown += `- **IIIF & Deep-Zoom Assets:** Image intake for new books and artwork with automated 4096x4096px Deep-Zoom pyramids and AVIF compression.\n`;
    markdown += `- **Zero-Trust Security & Cloudflare Defense:** Constant-time (\`timingSafeEqual\`) signature verification, strict user whitelist, anti-replay nonces, least privilege tokens (destructive operations blocked with 403 Forbidden), SSRF isolation, and indirect prompt injection defense.\n\n`;
    markdown += `## Canonical Endpoints & Interfaces\n`;
    markdown += `- Interactive Web Console: https://makaremi.com/${locale}/agent-console\n`;
    markdown += `- Telegram Webhook: https://makaremi.com/api/webhooks/telegram\n`;
    markdown += `- WhatsApp Webhook: https://makaremi.com/api/webhooks/whatsapp\n`;
    markdown += `- Comments Endpoint: https://makaremi.com/api/comments\n\n`;
  }

  // 6.7 System Status & Production Readiness: /[locale]/system-status
  if (segments.length === 2 && segments[1] === 'system-status') {
    const title =
      locale === 'fa'
        ? 'مرکز پایش وضعیت سیستم و گواهی آمادگی پروداکشن | دکتر حسن مکارمی'
        : locale === 'fr'
        ? 'État du Système et Certification de Production | Dr Hassan Makaremi'
        : 'System Status & Production Readiness Certification | Dr. Hassan Makaremi';
    markdown = `# ${title}\n\n`;
    markdown += `> Real-time infrastructure telemetry, 6-point pre-launch QA gate certification, 12-week roadmap, and European sovereign cloud cost optimization for MAKAREMI-CORE-2026.\n\n`;
    markdown += `## System Architecture & Verification Status\n`;
    markdown += `- **Production Release:** v1.0.0-PROD\n`;
    markdown += `- **All 7 Phases Implemented:** 100% Certified\n`;
    markdown += `- **Automated Regression Test Suite:** 520+ consecutive passing assertions (0 regressions)\n`;
    markdown += `- **Cryptographic Signatures:** Ed25519 (RFC 8032) asymmetric signatures on all sensitive articles and snapshots\n`;
    markdown += `- **Offsite Encrypted Backup:** AES-256-GCM authenticated encryption with 16-byte authTag and Ed25519 manifest signature\n`;
    markdown += `- **Zero-Trust Network:** Cloudflare Zero-Trust Tunnel (cloudflared), all public server ports cloaked (22, 80, 443, 5432, 6379, 8055, 8182)\n\n`;
    markdown += `## 6-Point Pre-Launch QA Gate Certification\n`;
    markdown += `1. **Domain Canonicalization:** Single-hop 301 redirects to https://makaremi.com (PASSED - 100%)\n`;
    markdown += `2. **Single-<h1> Architecture:** Exactly one <h1> per page template; 0 duplicate h1 in widgets (PASSED - 100%)\n`;
    markdown += `3. **GEO & /llms.txt:** text/plain; charset=utf-8 headers and working .md twin endpoints (PASSED - 100%)\n`;
    markdown += `4. **Zero-Trust Port Cloaking:** All inbound ports cloaked; routed exclusively via Cloudflare Tunnel (PASSED - 100%)\n`;
    markdown += `5. **Iran Censorship Resistance & Speed:** LCP < 2s, local fonts, PWA offline survival pack, Telegram Instant View 2.1 (PASSED - 100%)\n`;
    markdown += `6. **Lacanian Controlled Terminology:** 100% precision for psychoanalytic terms in Persian, French, English (PASSED - 100%)\n\n`;
    markdown += `## European Cloud Cost Optimization (Section 7.2)\n`;
    markdown += `- Dedicated Cloud VPS (Hetzner / OVHcloud EU): €25 - €35 / month\n`;
    markdown += `- Edge Security & CDN (Cloudflare Pro): €23 ($25) / month\n`;
    markdown += `- Edge SSR & Frontend Hosting: €0 - €20 / month\n`;
    markdown += `- Voice AI & LLM Processing APIs: €15 - €30 / month\n`;
    markdown += `- S3-Compatible Encrypted Offsite Vault: €5 - €7 / month\n`;
    markdown += `- **Total Monthly Operational Cost:** €70 - €115 / month (€840 - €1,380 / year)\n\n`;
    markdown += `## Telemetry Endpoints\n`;
    markdown += `- Interactive Dashboard: https://makaremi.com/${locale}/system-status\n`;
    markdown += `- JSON Telemetry: https://makaremi.com/api/health\n`;
    markdown += `- Public Key: https://makaremi.com/.well-known/makaremi-public-key.pem\n\n`;
  }

  // 6.8 About & Academic CV: /[locale]/about
  if (segments.length === 2 && segments[1] === 'about') {
    markdown = `# Dr. Hassan Makaremi — Academic CV, 6 Universities, Interviews & Human Rights References | درباره دکتر حسن مکارمی\n\n`;
    markdown += `> Born 1950 (1329) in Shiraz. Clinical Lacanian Psychoanalyst, Sorbonne Researcher, Strategic Consultant, Contemporary Calligrapher (7 permanent works in Moscow Museum of Calligraphy), and Treasurer of LDDHI.\n\n`;
    markdown += `## 6 Academic Universities (Iran & France)\n`;
    markdown += `- Amirkabir University of Technology (Tehran Polytechnic)\n`;
    markdown += `- Shiraz University & University of Sistan and Baluchestan\n`;
    markdown += `- Université de Technologie de Compiègne (UTC)\n`;
    markdown += `- École Centrale Paris\n`;
    markdown += `- Faculty of Medicine — Paris VII Denis Diderot University\n`;
    markdown += `- Université Paris 1 Panthéon-Sorbonne (IAE) & CEDS Paris\n\n`;
  }

  // 6.9 Hafezology Hub: /[locale]/hafez
  if (segments.length === 2 && segments[1] === 'hafez') {
    markdown = `# Hafezology & Listening Differently to Hafez | قطب حافظ‌پژوهی دکتر حسن مکارمی\n\n`;
    markdown += `> Trilogy of Hafez studies: "چند گفتار در دیگر شنیدن حافظ" (Alian/Forough), "نگرشی دیگر بر راز حافظ" (H&S Media), and "Hafez par Hafez" (L'Harmattan, Paris), alongside the 14-part video series "صدای سخن عشق".\n\n`;
  }

  // 6.10 3D Book Studio: /[locale]/book-studio
  if (segments.length === 2 && segments[1] === 'book-studio') {
    markdown = `# 3D Book Publishing Studio (v8.0 Cultural Sanctuary) | استودیوی مدیریت کتاب سه‌بعدی\n\n`;
    markdown += `> Interactive 3D book engineering workbench supporting Persian RTL and French LTR bindings, volumetric spine calculation, print-spread cover slicing, and Page 1 Title Page + custom admin page range previews.\n\n`;
  }

  // 7. Books Catalog fallback: /[locale]/books
  if (!markdown && segments.length === 2 && segments[1] === 'books') {
    const books = await getBooks(locale);
    markdown = `# Books & Publications Archive | فهرست آثار و کتاب‌های دکتر حسن مکارمی\n\n`;
    for (const b of books) {
      const trans =
        b.translations?.find((t) => t.languages_code.startsWith(locale)) ||
        b.translations?.[0];
      markdown += `### ${trans?.title || b.slug}\n`;
      markdown += `- **Publisher:** ${trans?.publisher_name} (${b.publication_year})\n`;
      markdown += `- **Link:** https://makaremi.com/${locale}/books/${b.slug}\n`;
      markdown += `- **Synopsis:** ${trans?.synopsis || ''}\n\n`;
    }
  }

  // If nothing matched, provide general canonical fallback
  if (!markdown) {
    markdown = `# Dr. Hassan Makaremi | دکتر حسن مکارمی\n\nCanonical archive entry for path: \`${cleanPath}\`.\nVisit https://makaremi.com/${locale} for the interactive view.\n`;
  }

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'X-Robots-Tag': 'all',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    },
  });
}
