import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { Locale } from '@makaremi/shared';
import { isStudioRequestAuthorized } from '@/lib/studio/auth';
import { detectAiProseTells, humanizeScholarlyProse } from '@/lib/rag/prose-humanizer';

const HumanizeRequestSchema = z.object({
  text: z.string().min(1).max(30000),
  locale: z.enum(['fa', 'fr', 'en']).default('fa'),
});

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

export async function POST(request: NextRequest) {
  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers: HEADERS });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400, headers: HEADERS });
  }

  const parsed = HumanizeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'متن ورودی برای پالایش نثر نامعتبر است.' },
      { status: 400, headers: HEADERS }
    );
  }

  const loc = parsed.data.locale as Locale;
  const detectedBefore = detectAiProseTells(parsed.data.text, loc);
  const result = humanizeScholarlyProse(parsed.data.text, loc);

  return NextResponse.json(
    {
      ok: true,
      humanizedText: result.text,
      tellsRemovedCount: result.tellsRemovedCount,
      removedPatterns: result.removedPatterns,
      detectedBefore,
    },
    { status: 200, headers: HEADERS }
  );
}
