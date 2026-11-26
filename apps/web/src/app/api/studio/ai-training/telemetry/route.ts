import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { hasPrototypePollution } from '@/lib/etl/types';
import { isStudioRequestAuthorized } from '@/lib/studio/auth';
import {
  getTrainingTelemetryOverview,
  updateFeedbackTriageStatus,
} from '@/lib/rag/training-store';

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

const TriageSchema = z.object({
  feedbackId: z.string().min(4).max(80),
  triagedStatus: z.enum(['open', 'converted_to_qa', 'dismissed']),
});

export async function GET(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 60 }, 'studio_ai_tel_get');
  if (!rl.allowed) return rl.response!;
  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized studio access' }, { status: 401, headers: HEADERS });
  }

  const overview = await getTrainingTelemetryOverview();
  return NextResponse.json({ ok: true, overview }, { status: 200, headers: HEADERS });
}

export async function PATCH(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 30 }, 'studio_ai_tel_patch');
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

  const check = TriageSchema.safeParse(parsedJson);
  if (!check.success) {
    return NextResponse.json({ ok: false, error: 'Validation failed' }, { status: 400, headers: HEADERS });
  }

  await updateFeedbackTriageStatus(check.data.feedbackId, check.data.triagedStatus);
  const overview = await getTrainingTelemetryOverview();
  return NextResponse.json({ ok: true, overview }, { status: 200, headers: HEADERS });
}
