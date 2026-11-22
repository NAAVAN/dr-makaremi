import { NextRequest, NextResponse } from 'next/server';
import type { Locale } from '@makaremi/shared';
import { checkRateLimit } from '@/lib/rate-limit';
import { isStudioRequestAuthorized } from '@/lib/studio/auth';
import { listStudioWorks } from '@/lib/studio/works-index';
import { loadManualTranslationQueue } from '@/lib/studio/overlays';
import type { TranslationCollectionName } from '@/lib/vault-loader';

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

const VALID_COLLECTIONS = new Set<string>([
  'all',
  'articles',
  'books',
  'poems',
  'videos',
  'artworks',
  'exhibitions',
  'pages',
]);

export async function GET(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 120 }, 'studio_works_get');
  if (!rl.allowed) return rl.response!;

  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized studio access' }, { status: 401, headers: HEADERS });
  }

  const sp = request.nextUrl.searchParams;
  const colParam = sp.get('collection') || 'all';
  const collection = (VALID_COLLECTIONS.has(colParam) ? colParam : 'all') as TranslationCollectionName | 'all';
  const langParam = sp.get('originalLocale') || 'all';
  const originalLocale = (['fa', 'fr', 'en'].includes(langParam) ? langParam : 'all') as Locale | 'all';
  const stateParam = sp.get('state') || 'all';
  const translationState = (['all', 'complete', 'missing', 'enriched'].includes(stateParam)
    ? stateParam
    : 'all') as 'all' | 'complete' | 'missing' | 'enriched';
  const q = sp.get('q') || '';
  const page = Number.parseInt(sp.get('page') || '1', 10) || 1;
  const pageSize = Number.parseInt(sp.get('pageSize') || '25', 10) || 25;

  const listing = await listStudioWorks({
    collection,
    originalLocale,
    translationState,
    q,
    page,
    pageSize,
  });

  const manualQueue = loadManualTranslationQueue().filter((item) => item.status === 'pending_manual_translation');

  return NextResponse.json(
    {
      ok: true,
      ...listing,
      manualQueueCount: manualQueue.length,
    },
    { status: 200, headers: HEADERS }
  );
}
