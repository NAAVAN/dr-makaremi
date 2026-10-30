import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  getArticles,
  getBooks,
  getArtworks,
  getLacanianGlossary,
} from '@/lib/cms';
import {
  buildFullGraph,
  buildArticleNode,
  buildBookNode,
  buildVisualArtworkNode,
  buildDefinedTermSetNode,
  serializeSafeJsonLd,
} from '@/lib/schema-org';
import type { Locale } from '@/lib/i18n';

const QuerySchema = z.object({
  locale: z.enum(['fa', 'fr', 'en']).default('fa'),
});

export async function GET(request: NextRequest) {
  // 1. Rate Limiting (Cloudflare Security Audit Compliance)
  const rl = checkRateLimit(
    request,
    { windowMs: 60000, maxRequests: 60 },
    'knowledge-graph'
  );
  if (!rl.allowed) return rl.response!;

  // 2. Strict Zod Validation of Query Parameters
  const { searchParams } = new URL(request.url);
  const rawLocale = searchParams.get('locale') || 'fa';

  const parseResult = QuerySchema.safeParse({ locale: rawLocale });
  if (!parseResult.success) {
    return new NextResponse(
      JSON.stringify({
        error: 'Invalid locale parameter. Must be one of: fa, fr, en',
        details: parseResult.error.flatten(),
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }
    );
  }

  const locale = parseResult.data.locale as Locale;

  // 3. Assemble Domain Nodes
  const [articles, books, artworks, glossary] = await Promise.all([
    getArticles(locale),
    getBooks(locale),
    getArtworks(locale),
    getLacanianGlossary(),
  ]);

  const items = [
    ...articles.map((a) => buildArticleNode(a, locale)),
    ...books.map((b) => buildBookNode(b, locale)),
    ...artworks.map((art) => buildVisualArtworkNode(art, locale)),
    buildDefinedTermSetNode(glossary, locale),
  ];

  const graph = buildFullGraph({
    locale,
    items,
  });

  // 4. Safe Serialization (Zero Breakout XSS)
  const safeSerialized = serializeSafeJsonLd(graph);

  return new NextResponse(safeSerialized, {
    status: 200,
    headers: {
      'Content-Type': 'application/ld+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
