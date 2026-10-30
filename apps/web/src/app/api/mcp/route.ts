import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { hasPrototypePollution } from '@/lib/etl/types';
import { executeHybridSearch } from '@/lib/rag/hybrid-search';
import { FALLBACK_GLOSSARY, getArticleBySlug } from '@/lib/cms';
import { processFacebookArchive, PRE_SEEDED_FACEBOOK_POSTS } from '@/lib/etl/facebook-ingestor';
import { verifyEd25519Signature, buildCanonicalString, computeCanonicalSha256 } from '@/lib/crypto';
import type { Locale, ContentPillar } from '@makaremi/shared';

// Server info for Model Context Protocol (MCP)
const MCP_SERVER_INFO = {
  name: 'makaremi-knowledge-mcp',
  version: '1.0.0-PROD',
  protocolVersion: '2024-11-05',
  description: 'Official Model Context Protocol Server for Dr. Hassan Makaremi Digital Archive',
};

const MCP_TOOLS = [
  {
    name: 'search_makaremi_corpus',
    description: 'Hybrid multilingual (FA/FR/EN) search across Dr. Hassan Makaremi academic books, articles, speeches, and poems.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term or research question in Persian, French, or English' },
        locale: { type: 'string', enum: ['fa', 'fr', 'en'], description: 'Language filter (fa, fr, en)' },
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
    description: 'Query clinical definitions, French equivalents, and mathematical topology for Lacanian concepts developed by Dr. Makaremi (e.g. دگرشنیدن, عملیات نام پدر, حالت مرزی).',
    inputSchema: {
      type: 'object',
      properties: {
        term: { type: 'string', description: 'Concept or terminology keyword (Persian, French, or English)' },
      },
      required: ['term'],
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
    name: 'Lacanian & Strategic DefinedTermSet',
    description: 'Trilingual Lacanian psychoanalytic and political transition terminology',
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
  // Rate limiting: 60 requests per minute
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

  // Refinement 2: Prototype Pollution Guard
  if (hasPrototypePollution(rawBodyText)) {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request: Prototype pollution detected' } },
      { status: 400 }
    );
  }

  let body: any;
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

  const { jsonrpc, id = null, method, params = {} } = body;

  if (jsonrpc !== '2.0') {
    return NextResponse.json(
      { jsonrpc: '2.0', id, error: { code: -32600, message: 'Invalid Request: JSON-RPC 2.0 required' } },
      { status: 400 }
    );
  }

  // MCP Method Dispatcher
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
          capabilities: {
            tools: {},
            resources: {},
          },
        },
      });
    }

    case 'tools/list': {
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: {
          tools: MCP_TOOLS,
        },
      });
    }

    case 'tools/call': {
      const toolName = params?.name;
      const args = params?.arguments || {};

      if (toolName === 'search_makaremi_corpus') {
        const query = String(args.query || '');
        const locale = (args.locale || 'fa') as Locale;
        const pillar = (args.pillar || 'all') as ContentPillar | 'all';
        const limit = Math.min(20, Math.max(1, Number(args.limit) || 5));

        const results = await executeHybridSearch({ q: query, locale, pillar, limit });
        const textOutput = results.length === 0
          ? 'No matching documents found in Dr. Makaremi archives.'
          : results.map((r, i) => `[${i + 1}] ${r.title} (${r.pillar})\nURL: ${r.url}\nSHA-256: ${r.content_sha256}\nSnippet: ${r.snippet}`).join('\n\n');

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: textOutput }],
          },
        });
      }

      if (toolName === 'lookup_lacanian_glossary') {
        const termQuery = String(args.term || '').toLowerCase().trim();
        const matched = FALLBACK_GLOSSARY.filter((g) => {
          return (
            g.term_fa.toLowerCase().includes(termQuery) ||
            g.term_fr.toLowerCase().includes(termQuery) ||
            g.term_en.toLowerCase().includes(termQuery)
          );
        });

        const output = matched.length === 0
          ? `No Lacanian glossary definition found for "${args.term}".`
          : matched.map((g) => `Term (FA): ${g.term_fa}\nTerm (FR): ${g.term_fr}\nTerm (EN): ${g.term_en}\nPillar: ${g.pillar}\nDefinition (FA): ${g.conceptual_definition_fa}\nDefinition (FR): ${g.conceptual_definition_fr || 'N/A'}`).join('\n\n---\n\n');

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: output }],
          },
        });
      }

      if (toolName === 'inspect_etl_migration_queue') {
        const queueResult = await processFacebookArchive(PRE_SEEDED_FACEBOOK_POSTS);
        const limit = Number(args.limit) || 10;
        const items = queueResult.articles.slice(0, limit);

        const summaryText = `ETL Queue Status:\n- Total Raw Processed: ${queueResult.stats.total_raw_processed}\n- Filtered Micro-posts: ${queueResult.stats.filtered_micro_posts}\n- Threads Merged: ${queueResult.stats.threads_merged}\n- Duplicates Eliminated: ${queueResult.stats.duplicates_eliminated}\n- Items in Review: ${queueResult.stats.ready_for_review_count}\n\nEnriched Items:\n` +
          items.map((art, idx) => `[${idx + 1}] ${art.title} (${art.pillar}) - Status: ${art.status}\nSlug: ${art.slug}\nSHA-256: ${art.content_sha256}\nEd25519: ${art.signature_ed25519.slice(0, 32)}...`).join('\n\n');

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: summaryText }],
          },
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
            result: {
              content: [{ type: 'text', text: `Article with slug "${slug}" not found in archive.` }],
            },
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
          result: {
            content: [{ type: 'text', text: report }],
          },
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
        result: {
          resources: MCP_RESOURCES,
        },
      });
    }

    case 'resources/read': {
      const uri = String(params?.uri || '');
      if (uri === 'makaremi://corpus/glossary') {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(FALLBACK_GLOSSARY, null, 2),
              },
            ],
          },
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
