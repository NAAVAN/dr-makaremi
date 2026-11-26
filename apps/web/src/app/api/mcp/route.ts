import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { hasPrototypePollution } from '@/lib/etl/types';
import { executeHybridSearch } from '@/lib/rag/hybrid-search';
import {
  getActiveGlossary,
  getArchivePages,
  getArticleBySlug,
  getArtworks,
  getVideoSpeeches,
} from '@/lib/cms';
import {
  listGoldenQaItems,
  listLivingGlossaryAndEdges,
} from '@/lib/rag/training-store';
import { readCommerceJson } from '@/lib/vault-loader';
import { processFacebookArchive, PRE_SEEDED_FACEBOOK_POSTS } from '@/lib/etl/facebook-ingestor';
import { verifyEd25519Signature, buildCanonicalString, computeCanonicalSha256 } from '@/lib/crypto';
import type { CommerceCatalogItem, ContentPillar, Locale } from '@makaremi/shared';

const MCP_SERVER_INFO = {
  name: 'makaremi-knowledge-mcp',
  version: '2.0.0-PROD',
  protocolVersion: '2024-11-05',
  description: 'Official Model Context Protocol Server for Dr. Hassan Makaremi Digital Archive & Concept Graph',
};

const MCP_TOOLS = [
  {
    name: 'search_makaremi_corpus',
    description:
      'Hybrid cross-lingual (FA/FR/EN) search across Dr. Hassan Makaremi books, articles, timestamped video lectures, poems, reference pages, calligraphy artworks, official Paris atelier catalog, and verified Golden Q&A.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term or research question in Persian, French, or English' },
        locale: { type: 'string', enum: ['fa', 'fr', 'en'], description: 'Preferred response language (fa, fr, en)' },
        pillar: {
          type: 'string',
          enum: ['all', 'psychoanalysis', 'art_calligraphy', 'cultural_strategy', 'human_rights_dadkhahi'],
          description: 'Content pillar filter',
        },
        limit: { type: 'number', description: 'Maximum number of results to return (1-20)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'lookup_lacanian_glossary',
    description:
      'Query 66+ trilingual clinical, Hafez, calligraphy, and cultural-strategy definitions with canonical French/English equivalents and aliases.',
    inputSchema: {
      type: 'object',
      properties: {
        term: { type: 'string', description: 'Concept or terminology keyword (Persian, French, or English)' },
      },
      required: ['term'],
    },
  },
  {
    name: 'explore_concept_graph',
    description:
      'Traverse Dr. Hassan Makaremi’s semantic concept graph: returns canonical trilingual definition, related concepts across pillars, and linked books, articles, and timestamped video lectures.',
    inputSchema: {
      type: 'object',
      properties: {
        concept: { type: 'string', description: 'Concept name in FA, FR, or EN (e.g. دگرشنیدن, État limite, Khavaran)' },
        locale: { type: 'string', enum: ['fa', 'fr', 'en'], description: 'Preferred locale for related source retrieval' },
      },
      required: ['concept'],
    },
  },
  {
    name: 'inspect_etl_migration_queue',
    description: 'Inspect extracted Facebook and WordPress archive articles currently in review_pending status awaiting editorial sign-off.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of pending migration articles to inspect' },
      },
    },
  },
  {
    name: 'verify_document_cryptography',
    description: 'Cryptographically verify the official Ed25519 digital signature and SHA-256 digest of an article in the archive.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Article slug (e.g. is-psychoanalysis-a-science)' },
        locale: { type: 'string', enum: ['fa', 'fr', 'en'], description: 'Locale of the article' },
      },
      required: ['slug'],
    },
  },
];

const MCP_RESOURCES = [
  {
    uri: 'makaremi://corpus/articles',
    name: 'Academic & Psychoanalytic Articles',
    description: 'Peer-reviewed and clinical psychoanalytic papers published by Dr. Hassan Makaremi',
    mimeType: 'text/markdown',
  },
  {
    uri: 'makaremi://corpus/books',
    name: 'Monographs & Translated Books',
    description: 'Published books including Lacan Seminar III translation, psychoanalytic essays, and poetry collections',
    mimeType: 'text/markdown',
  },
  {
    uri: 'makaremi://corpus/glossary',
    name: 'Living Trilingual DefinedTermSet & Concept Graph',
    description: '66+ trilingual Lacanian psychoanalytic, Hafez, artistic, and strategic terms with concept edges',
    mimeType: 'application/json',
  },
  {
    uri: 'makaremi://corpus/videos',
    name: 'Video Lectures & Broadcast Transcripts',
    description: 'Deduplicated catalog of Dr. Hassan Makaremi lectures, psychoanalytic series, and human rights speeches with transcripts',
    mimeType: 'text/markdown',
  },
  {
    uri: 'makaremi://corpus/pages',
    name: 'Biography, Sorbonne/CNRS CV & Reference Pages',
    description: '25 authoritative biographical, conference, interview, and human-rights reference pages',
    mimeType: 'text/markdown',
  },
  {
    uri: 'makaremi://corpus/artworks',
    name: 'Contemporary Calligraphy Series (29 Series / 856 Plates)',
    description: 'Catalog of Dr. Hassan Makaremi calligraphic painting series, media, years, and museum exhibitions',
    mimeType: 'text/markdown',
  },
  {
    uri: 'makaremi://corpus/commerce',
    name: 'Paris Atelier Official Editions & Décret Marcus Provenance',
    description: 'Authenticated original artworks, numbered Fine Art prints, and monographs with Ed25519 certification',
    mimeType: 'application/json',
  },
  {
    uri: 'makaremi://corpus/golden-qa',
    name: 'Professor-Verified Canonical Q&A Knowledge Bank',
    description: 'Ed25519-signed authoritative answers curated directly by Dr. Hassan Makaremi in the Pishkhan',
    mimeType: 'application/json',
  },
];

export async function GET(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 60 }, 'mcp_server');
  if (!rl.allowed) return rl.response!;

  return NextResponse.json(
    {
      mcp: MCP_SERVER_INFO,
      capabilities: {
        tools: MCP_TOOLS.map((t) => t.name),
        resources: MCP_RESOURCES.map((r) => r.uri),
      },
      status: 'online',
    },
    {
      headers: {
        'X-RateLimit-Limit': '60',
        'X-RateLimit-Remaining': String(rl.remaining),
      },
    }
  );
}

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 60 }, 'mcp_server');
  if (!rl.allowed) return rl.response!;

  let rawBodyText = '';
  try {
    rawBodyText = await request.text();
  } catch {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error: unable to read body' } },
      { status: 400 }
    );
  }

  if (hasPrototypePollution(rawBodyText)) {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request: Prototype pollution detected' } },
      { status: 400 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBodyText);
  } catch {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error: invalid JSON' } },
      { status: 400 }
    );
  }

  if (hasPrototypePollution(body)) {
    return NextResponse.json(
      { jsonrpc: '2.0', id: body?.id ?? null, error: { code: -32600, message: 'Invalid Request: Prototype pollution detected' } },
      { status: 400 }
    );
  }

  const jsonrpc = body.jsonrpc;
  const id = (body.id as string | number | null) ?? null;
  const method = String(body.method || '');
  const params = (body.params as Record<string, unknown>) || {};

  if (jsonrpc !== '2.0') {
    return NextResponse.json(
      { jsonrpc: '2.0', id, error: { code: -32600, message: 'Invalid Request: JSON-RPC 2.0 required' } },
      { status: 400 }
    );
  }

  switch (method) {
    case 'initialize': {
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: MCP_SERVER_INFO.protocolVersion,
          serverInfo: {
            name: MCP_SERVER_INFO.name,
            version: MCP_SERVER_INFO.version,
          },
          capabilities: { tools: {}, resources: {} },
        },
      });
    }

    case 'tools/list': {
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: { tools: MCP_TOOLS },
      });
    }

    case 'tools/call': {
      const toolName = String(params?.name || '');
      const args = (params?.arguments as Record<string, unknown>) || {};

      if (toolName === 'search_makaremi_corpus') {
        const query = String(args.query || '');
        const locale = (args.locale || 'fa') as Locale;
        const pillar = (args.pillar || 'all') as ContentPillar | 'all';
        const limit = Math.min(20, Math.max(1, Number(args.limit) || 5));

        const results = await executeHybridSearch({ q: query, locale, pillar, limit });
        const textOutput =
          results.length === 0
            ? 'No matching documents found in Dr. Makaremi archives.'
            : results
                .map(
                  (r, i) =>
                    `[${i + 1}] ${r.title} (${r.documentType} | ${r.pillar})\nURL: ${r.url}\nSHA-256: ${r.content_sha256}\nSnippet: ${r.snippet}`
                )
                .join('\n\n');

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: textOutput }] },
        });
      }

      if (toolName === 'lookup_lacanian_glossary') {
        const termQuery = String(args.term || '').toLowerCase().trim();
        const glossary = getActiveGlossary();
        const matched = glossary.filter((g) => {
          const aliases = g.aliases || [];
          return (
            g.term_fa.toLowerCase().includes(termQuery) ||
            g.term_fr.toLowerCase().includes(termQuery) ||
            g.term_en.toLowerCase().includes(termQuery) ||
            aliases.some((a) => a.toLowerCase().includes(termQuery))
          );
        });

        const output =
          matched.length === 0
            ? `No glossary definition found for "${args.term}".`
            : matched
                .slice(0, 8)
                .map(
                  (g) =>
                    `Term (FA): ${g.term_fa}\nTerm (FR): ${g.term_fr}\nTerm (EN): ${g.term_en}\nPillar: ${g.pillar}\nDefinition (FA): ${g.conceptual_definition_fa}\nDefinition (FR): ${g.conceptual_definition_fr || 'N/A'}\nDefinition (EN): ${g.conceptual_definition_en || 'N/A'}`
                )
                .join('\n\n---\n\n');

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: output }] },
        });
      }

      if (toolName === 'explore_concept_graph') {
        const conceptQuery = String(args.concept || '').toLowerCase().trim();
        const loc = (args.locale || 'fa') as Locale;
        const { terms, edges } = await listLivingGlossaryAndEdges();
        const termById = new Map(terms.map((t) => [t.id, t]));
        const anchor = terms.find(
          (t) =>
            t.term_fa.toLowerCase().includes(conceptQuery) ||
            t.term_fr.toLowerCase().includes(conceptQuery) ||
            t.term_en.toLowerCase().includes(conceptQuery) ||
            t.aliases.some((a) => a.toLowerCase().includes(conceptQuery))
        );

        const relatedEdges = anchor
          ? edges.filter((e) => e.sourceTermId === anchor.id || e.targetTermId === anchor.id)
          : [];
        const neighbors = relatedEdges
          .map((e) => {
            const otherId = e.sourceTermId === anchor?.id ? e.targetTermId : e.sourceTermId;
            const other = termById.get(otherId);
            return other ? `- [${e.relationType}] ${other.term_fa} (${other.term_fr} / ${other.term_en})${e.noteFa ? ` — ${e.noteFa}` : ''}` : '';
          })
          .filter(Boolean);

        const hits = await executeHybridSearch({ q: conceptQuery, locale: loc, limit: 5 });
        const lines: string[] = [];
        if (anchor) {
          lines.push(`# Concept: ${anchor.term_fa} | ${anchor.term_fr} | ${anchor.term_en}`);
          lines.push(`Pillar: ${anchor.pillar}`);
          lines.push(`Definition (FA): ${anchor.conceptual_definition_fa}`);
          if (anchor.conceptual_definition_fr) lines.push(`Definition (FR): ${anchor.conceptual_definition_fr}`);
          if (neighbors.length > 0) {
            lines.push('\n## Connected Concepts (Semantic Graph)');
            lines.push(...neighbors);
          }
        } else {
          lines.push(`# Concept Search: ${args.concept}`);
        }
        lines.push('\n## Linked Archival Sources (Books, Articles, Lectures)');
        for (const h of hits) {
          lines.push(`- [${h.documentType}] ${h.title} -> ${h.url}`);
        }

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: lines.join('\n') }] },
        });
      }

      if (toolName === 'inspect_etl_migration_queue') {
        const queueResult = await processFacebookArchive(PRE_SEEDED_FACEBOOK_POSTS);
        const limit = Number(args.limit) || 10;
        const items = queueResult.articles.slice(0, limit);

        const summaryText =
          `ETL Queue Status:\n- Total Raw Processed: ${queueResult.stats.total_raw_processed}\n- Filtered Micro-posts: ${queueResult.stats.filtered_micro_posts}\n- Threads Merged: ${queueResult.stats.threads_merged}\n- Duplicates Eliminated: ${queueResult.stats.duplicates_eliminated}\n- Items in Review: ${queueResult.stats.ready_for_review_count}\n\nEnriched Items:\n` +
          items
            .map(
              (art, idx) =>
                `[${idx + 1}] ${art.title} (${art.pillar}) - Status: ${art.status}\nSlug: ${art.slug}\nSHA-256: ${art.content_sha256}\nEd25519: ${art.signature_ed25519.slice(0, 32)}...`
            )
            .join('\n\n');

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: summaryText }] },
        });
      }

      if (toolName === 'verify_document_cryptography') {
        const slug = String(args.slug || '');
        const loc = (args.locale || 'fa') as Locale;
        const article = await getArticleBySlug(slug, loc);

        if (!article) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            result: { content: [{ type: 'text', text: `Article with slug "${slug}" not found in archive.` }] },
          });
        }

        const trans = article.translations?.find((t) => t.languages_code.startsWith(loc)) || article.translations?.[0];
        const canonical = buildCanonicalString({
          slug: article.slug,
          locale: loc,
          title: trans?.title || '',
          body_markdown: trans?.body_markdown || '',
          published_at: article.published_at,
        });

        const sha = computeCanonicalSha256(canonical);
        const isValid = article.signature_ed25519 ? verifyEd25519Signature(canonical, article.signature_ed25519) : false;

        const report = `Cryptographic Verification for "${trans?.title}":\n- Status: ${isValid ? 'VERIFIED (AUTHENTIC)' : 'TAMPERED / UNVERIFIED'}\n- Computed SHA-256: ${sha}\n- Recorded SHA-256: ${article.content_sha256}\n- Ed25519 Signature Present: ${Boolean(article.signature_ed25519)}`;

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: report }] },
        });
      }

      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: unknown tool "${toolName}"` },
      });
    }

    case 'resources/list': {
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: { resources: MCP_RESOURCES },
      });
    }

    case 'resources/read': {
      const uri = String(params?.uri || '');
      if (uri === 'makaremi://corpus/glossary') {
        const data = await listLivingGlossaryAndEdges();
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }],
          },
        });
      }

      if (uri === 'makaremi://corpus/golden-qa') {
        const qa = await listGoldenQaItems();
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(qa, null, 2) }],
          },
        });
      }

      if (uri === 'makaremi://corpus/commerce') {
        const catalog = readCommerceJson<CommerceCatalogItem[]>('catalog.json', []);
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(catalog, null, 2) }],
          },
        });
      }

      if (uri === 'makaremi://corpus/pages') {
        const pages = await getArchivePages('fa');
        const md = [
          '# Dr. Hassan Makaremi — Reference & Biographical Pages\n',
          ...pages.map((p) => {
            const tr = p.translations?.find((t) => t.languages_code.startsWith('fa')) || p.translations?.[0];
            return `## ${tr?.title || p.slug}\n- URL: https://makaremi.com/fa/about/${p.slug}\n- Group: ${p.group}\n- Excerpt: ${(tr?.body_markdown || tr?.excerpt || '').slice(0, 500).replace(/\s+/g, ' ')}\n`;
          }),
        ].join('\n');
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: { contents: [{ uri, mimeType: 'text/markdown', text: md }] },
        });
      }

      if (uri === 'makaremi://corpus/artworks') {
        const artworks = await getArtworks('fa');
        const md = [
          '# Dr. Hassan Makaremi — Contemporary Calligraphy Series\n',
          ...artworks.map((a) => {
            const tr = a.translations?.find((t) => t.languages_code.startsWith('fa')) || a.translations?.[0];
            return `## ${tr?.title || a.slug}\n- Year: ${a.year} | Medium: ${a.medium} | Plates: ${a.gallery_images?.length || 1}\n- URL: https://makaremi.com/fa/gallery\n`;
          }),
        ].join('\n');
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: { contents: [{ uri, mimeType: 'text/markdown', text: md }] },
        });
      }

      if (uri === 'makaremi://corpus/videos') {
        const allVideos = await getVideoSpeeches('fa');
        const seen = new Set<string>();
        const lines: string[] = ['# Dr. Hassan Makaremi — Video Lectures & Transcripts Corpus\n'];
        for (const v of allVideos) {
          if (v.slug === '5668') continue;
          const yt = v.youtube_video_id?.trim();
          if (yt) {
            if (v.canonical_video_slug && v.canonical_video_slug !== v.slug) continue;
            if (seen.has(yt)) continue;
            seen.add(yt);
          }
          const tr = v.translations?.find((t) => t.languages_code.startsWith('fa')) || v.translations?.[0];
          const excerpt = (tr?.transcript_markdown || tr?.description || '').slice(0, 600).replace(/\s+/g, ' ');
          const routePath =
            v.pillar === 'human_rights_dadkhahi'
              ? `/fa/human-rights/speeches/${v.slug}`
              : `/fa/media/videos/${v.slug}`;
          lines.push(
            `## ${tr?.title || v.slug}\n- URL: https://makaremi.com${routePath}\n- Pillar: ${v.pillar}\n- Date: ${v.event_date}\n- Excerpt: ${excerpt}\n`
          );
        }

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: { contents: [{ uri, mimeType: 'text/markdown', text: lines.join('\n') }] },
        });
      }

      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        error: { code: -32602, message: `Resource not found: "${uri}"` },
      });
    }

    default: {
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: "${method}"` },
      });
    }
  }
}
