import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { isStudioRequestAuthorized } from '@/lib/studio/auth';
import { getStudioWorkDetail } from '@/lib/studio/works-index';
import type { TranslationCollectionName } from '@/lib/vault-loader';

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

const VALID_COLLECTIONS = new Set<string>([
  'articles',
  'books',
  'poems',
  'videos',
  'artworks',
  'exhibitions',
  'pages',
]);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ collection: string; slug: string }> }
) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 120 }, 'studio_work_detail_get');
  if (!rl.allowed) return rl.response!;

  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized studio access' }, { status: 401, headers: HEADERS });
  }

  const { collection, slug } = await context.params;
  if (!VALID_COLLECTIONS.has(collection)) {
    return NextResponse.json({ ok: false, error: 'Invalid collection' }, { status: 400, headers: HEADERS });
  }

  const detail = await getStudioWorkDetail(
    collection as TranslationCollectionName,
    decodeURIComponent(slug)
  );
  if (!detail) {
    return NextResponse.json({ ok: false, error: 'Work not found' }, { status: 404, headers: HEADERS });
  }

  return NextResponse.json({ ok: true, detail }, { status: 200, headers: HEADERS });
}
