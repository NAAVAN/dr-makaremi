import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { executeHybridSearch } from '@/lib/rag/hybrid-search';
import type { ContentPillar, Locale } from '@makaremi/shared';

const SearchQuerySchema = z.object({
  q: z.string().min(1).max(256),
  locale: z.enum(['fa', 'fr', 'en']).optional(),
  pillar: z.enum(['psychoanalysis', 'art_calligraphy', 'cultural_strategy', 'human_rights_dadkhahi', 'all']).default('all'),
  type: z.enum(['all', 'book', 'article', 'speech', 'poem', 'exhibition', 'glossary']).default('all'),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export async function GET(request: NextRequest) {
  // Rate limiting: 60 requests per minute
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 60 }, 'hybrid_search');
  if (!rl.allowed) return rl.response!;

  const url = request.nextUrl;
  const rawParams = {
    q: url.searchParams.get('q') || '',
    locale: url.searchParams.get('locale') || undefined,
    pillar: url.searchParams.get('pillar') || 'all',
    type: url.searchParams.get('type') || 'all',
    limit: url.searchParams.get('limit') || '10',
  };

  const parsed = SearchQuerySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Bad Request',
        message: 'Invalid search parameters',
        details: parsed.error.issues,
      },
      {
        status: 400,
        headers: {
          'X-RateLimit-Limit': '60',
          'X-RateLimit-Remaining': String(rl.remaining),
        },
      }
    );
  }

  const { q, locale, pillar, type, limit } = parsed.data;

  try {
    const results = await executeHybridSearch({
      q,
      locale: locale as Locale | undefined,
      pillar: pillar as ContentPillar | 'all',
      type,
      limit,
    });

    return NextResponse.json(
      {
        query: q,
        locale: locale || 'all',
        total_results: results.length,
        results,
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-RateLimit-Limit': '60',
          'X-RateLimit-Remaining': String(rl.remaining),
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Search execution failed',
      },
      { status: 500 }
    );
  }
}
