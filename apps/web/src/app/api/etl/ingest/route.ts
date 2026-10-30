import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  hasPrototypePollution,
  FacebookPostSchema,
  FacebookExportSchema,
  type RawFacebookPost,
} from '@/lib/etl/types';
import {
  processFacebookArchive,
  PRE_SEEDED_FACEBOOK_POSTS,
} from '@/lib/etl/facebook-ingestor';
import { enrichArticle } from '@/lib/etl/enrichment-pipeline';

export async function GET(request: NextRequest) {
  // Rate limiting: 60 requests per minute
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 60 }, 'etl_ingest_get');
  if (!rl.allowed) return rl.response!;

  try {
    const result = await processFacebookArchive(PRE_SEEDED_FACEBOOK_POSTS);

    return NextResponse.json(
      {
        success: true,
        stats: result.stats,
        articles: result.articles,
        filtered_micro_posts: result.filteredMicroPosts,
        deduplicated_posts: result.deduplicatedPosts,
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-RateLimit-Limit': '60',
          'X-RateLimit-Remaining': String(rl.remaining),
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Rate limiting: 30 requests per minute
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 30 }, 'etl_ingest_post');
  if (!rl.allowed) return rl.response!;

  let rawBodyText = '';
  try {
    rawBodyText = await request.text();
  } catch {
    return NextResponse.json({ error: 'Bad Request', message: 'Unable to read request payload' }, { status: 400 });
  }

  // Refinement 2: Cloudflare Security Audit Guard for Prototype Pollution
  if (hasPrototypePollution(rawBodyText)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Prototype pollution detected in payload' },
      { status: 400 }
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBodyText);
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON payload format' },
      { status: 400 }
    );
  }

  if (hasPrototypePollution(parsedJson)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Prototype pollution detected in payload' },
      { status: 400 }
    );
  }

  // Check if payload is a batch export or a single post
  const batchParse = FacebookExportSchema.safeParse(parsedJson);
  if (batchParse.success) {
    const result = await processFacebookArchive(batchParse.data.posts);
    return NextResponse.json(
      {
        success: true,
        type: 'batch',
        stats: result.stats,
        articles: result.articles,
        filtered_micro_posts: result.filteredMicroPosts,
        deduplicated_posts: result.deduplicatedPosts,
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': '30',
          'X-RateLimit-Remaining': String(rl.remaining),
        },
      }
    );
  }

  // Single post ingestion
  const singleParse = FacebookPostSchema.safeParse(parsedJson);
  if (!singleParse.success) {
    return NextResponse.json(
      {
        error: 'Bad Request',
        message: 'Invalid Facebook post schema',
        details: singleParse.error.issues,
      },
      { status: 400 }
    );
  }

  const postData: RawFacebookPost = singleParse.data;

  try {
    const enriched = await enrichArticle({
      source: 'facebook',
      sourceId: postData.id,
      timestamp: postData.timestamp,
      rawTitle: postData.title || 'پست فیس‌بوک',
      rawContent: postData.post || '',
      isMergedThread: false,
    });

    return NextResponse.json(
      {
        success: true,
        type: 'single',
        article: enriched,
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': '30',
          'X-RateLimit-Remaining': String(rl.remaining),
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    );
  }
}
