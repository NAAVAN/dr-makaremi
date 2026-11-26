import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { hasPrototypePollution } from '@/lib/etl/types';
import { recordFeedbackEvent } from '@/lib/rag/training-store';
import type { Locale } from '@makaremi/shared';

const FeedbackSchema = z.object({
  telemetryId: z.string().max(80).nullable().optional(),
  queryPreview: z.string().max(300).optional(),
  locale: z.enum(['fa', 'fr', 'en']).default('fa'),
  rating: z.union([z.literal(-1), z.literal(1)]),
  issueCategory: z
    .enum(['inaccurate', 'missing_source', 'wrong_language', 'tone', 'citation_link', 'other'])
    .optional(),
  userNote: z.string().max(400).optional(),
});

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 25 }, 'rag_feedback');
  if (!rl.allowed) return rl.response!;

  const raw = await request.text().catch(() => '');
  if (!raw || hasPrototypePollution(raw)) {
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: 'Malformed JSON' }, { status: 400 });
  }

  const check = FeedbackSchema.safeParse(parsedJson);
  if (!check.success) {
    return NextResponse.json({ ok: false, error: 'Validation failed' }, { status: 400 });
  }

  const saved = await recordFeedbackEvent({
    telemetryId: check.data.telemetryId || null,
    queryPreview: check.data.queryPreview,
    locale: check.data.locale as Locale,
    rating: check.data.rating,
    issueCategory: check.data.issueCategory,
    userNote: check.data.userNote,
  });

  return NextResponse.json(
    { ok: true, id: saved.id },
    {
      status: 201,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    }
  );
}
