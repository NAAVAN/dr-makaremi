import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { hasPrototypePollution } from '@/lib/etl/types';
import { isStudioRequestAuthorized } from '@/lib/studio/auth';
import {
  deleteGoldenQaItem,
  listGoldenQaItems,
  upsertGoldenQaItem,
} from '@/lib/rag/training-store';
import type { ContentPillar, Locale } from '@makaremi/shared';

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

const GoldenQaSchema = z.object({
  id: z.string().max(80).optional(),
  locale: z.enum(['fa', 'fr', 'en']).default('fa'),
  pillar: z.enum(['psychoanalysis', 'art_calligraphy', 'cultural_strategy', 'human_rights_dadkhahi']),
  questionCanonical: z.string().min(4).max(500),
  questionVariants: z.array(z.string().max(300)).max(12).optional(),
  answerMarkdown: z.string().min(15).max(8000),
  linkedUrls: z.array(z.string().max(300)).max(10).optional(),
  priorityBoost: z.number().min(1.0).max(2.5).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export async function GET(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 60 }, 'studio_ai_gqa_get');
  if (!rl.allowed) return rl.response!;
  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized studio access' }, { status: 401, headers: HEADERS });
  }

  const items = await listGoldenQaItems();
  return NextResponse.json({ ok: true, items }, { status: 200, headers: HEADERS });
}

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 30 }, 'studio_ai_gqa_post');
  if (!rl.allowed) return rl.response!;
  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized studio access' }, { status: 401, headers: HEADERS });
  }

  const raw = await request.text().catch(() => '');
  if (!raw || hasPrototypePollution(raw)) {
    return NextResponse.json({ ok: false, error: 'Disallowed payload' }, { status: 400, headers: HEADERS });
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400, headers: HEADERS });
  }

  const check = GoldenQaSchema.safeParse(parsedJson);
  if (!check.success) {
    return NextResponse.json({ ok: false, error: 'Validation failed', details: check.error.issues }, { status: 400, headers: HEADERS });
  }

  const saved = await upsertGoldenQaItem({
    ...check.data,
    locale: check.data.locale as Locale,
    pillar: check.data.pillar as ContentPillar,
  });
  const items = await listGoldenQaItems();

  return NextResponse.json(
    { ok: true, item: saved, items, message: 'پاسخ طلایی با امضای Ed25519 ذخیره و فوراً در مغز دستیار نمایه شد.' },
    { status: 201, headers: HEADERS }
  );
}

export async function DELETE(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 30 }, 'studio_ai_gqa_del');
  if (!rl.allowed) return rl.response!;
  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized studio access' }, { status: 401, headers: HEADERS });
  }

  const id = (request.nextUrl.searchParams.get('id') || '').trim();
  if (!id) {
    return NextResponse.json({ ok: false, error: 'Missing id parameter' }, { status: 400, headers: HEADERS });
  }

  await deleteGoldenQaItem(id);
  const items = await listGoldenQaItems();
  return NextResponse.json({ ok: true, items, message: 'پاسخ طلایی از فهرست فعال حذف شد.' }, { status: 200, headers: HEADERS });
}
