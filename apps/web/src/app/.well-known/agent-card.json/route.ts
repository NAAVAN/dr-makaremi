import { NextResponse } from 'next/server';

export async function GET() {
  const card = {
    schema_version: '1.0',
    name: 'Dr. Hassan Makaremi Official Knowledge & Museum Archive',
    alternate_name: 'پایگاه رسمی آثار دکتر حسن مکارمی',
    description:
      'Authoritative trilingual (Persian, French, English) digital museum, scholarly archive, and grounded RAG/MCP server for Dr. Hassan Makaremi: Clinical Lacanian Psychoanalyst, Sorbonne Researcher, Contemporary Calligrapher, Hafez Scholar, and Human Rights Defender (LDDHI).',
    url: 'https://makaremi.com',
    languages: ['fa', 'fr', 'en'],
    capabilities: {
      markdown_content_negotiation: true,
      markdown_twin_suffix: '.md',
      llms_txt: 'https://makaremi.com/llms.txt',
      llms_full_txt: 'https://makaremi.com/llms-full.txt',
      sitemap: 'https://makaremi.com/sitemap.xml',
      knowledge_graph: 'https://makaremi.com/api/knowledge-graph',
      hybrid_search: 'https://makaremi.com/api/search',
      grounded_rag: 'https://makaremi.com/api/rag',
      mcp_server: {
        protocol: 'JSON-RPC 2.0',
        endpoint: 'https://makaremi.com/api/mcp',
        authentication: 'none (public read-only scholarly corpus)',
      },
      cryptographic_integrity: {
        algorithm: 'Ed25519 (RFC 8032) + SHA-256',
        public_key_url: 'https://makaremi.com/.well-known/makaremi-public-key.pem',
        verify_endpoint: 'https://makaremi.com/api/integrity',
      },
    },
    corpus_summary: {
      articles: 404,
      books: 25,
      poems: 300,
      videos_and_speeches: 261,
      calligraphy_series: 29,
      international_exhibitions: 27,
      archival_reference_documents: 25,
    },
    contact: {
      email: 'contact@makaremi.com',
      location: 'Paris, France',
    },
  };

  return NextResponse.json(card, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
