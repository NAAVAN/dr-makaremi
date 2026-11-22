import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { hasPrototypePollution } from '@/lib/etl/types';
import { isStudioRequestAuthorized } from '@/lib/studio/auth';
import {
  getAiRuntimeStatus,
  saveAiSettingsFile,
  testAiEngineConnection,
} from '@/lib/ai/provider-adapter';
import { loadManualTranslationQueue } from '@/lib/studio/overlays';

const AiConfigPatchSchema = z.object({
  action: z.enum(['update', 'test']).default('update'),
  model: z.string().min(3).max(80).optional(),
  autoTranslateOnPublish: z.boolean().optional(),
});

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 60 }, 'studio_ai_config_get');
  if (!rl.allowed) return rl.response!;

  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized studio access' }, { status: 401, headers: HEADERS });
  }

  return NextResponse.json(
    {
      ok: true,
      status: getAiRuntimeStatus(),
      manualQueue: loadManualTranslationQueue(),
    },
    { status: 200, headers: HEADERS }
  );
}

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 20 }, 'studio_ai_config_post');
  if (!rl.allowed) return rl.response!;

  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized studio access' }, { status: 401, headers: HEADERS });
  }

  const raw = await request.text().catch(() => '');
  if (hasPrototypePollution(raw)) {
    return NextResponse.json({ ok: false, error: 'Disallowed payload' }, { status: 400, headers: HEADERS });
  }

  let parsed: unknown = {};
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400, headers: HEADERS });
  }

  const check = AiConfigPatchSchema.safeParse(parsed);
  if (!check.success) {
    return NextResponse.json({ ok: false, error: 'Invalid AI settings payload' }, { status: 400, headers: HEADERS });
  }

  if (check.data.action === 'test') {
    const testResult = await testAiEngineConnection();
    return NextResponse.json(
      { ok: testResult.ok, testResult, status: getAiRuntimeStatus() },
      { status: 200, headers: HEADERS }
    );
  }

  saveAiSettingsFile({
    ...(check.data.model ? { model: check.data.model } : {}),
    ...(check.data.autoTranslateOnPublish !== undefined
      ? { autoTranslateOnPublish: check.data.autoTranslateOnPublish }
      : {}),
  });

  return NextResponse.json(
    {
      ok: true,
      status: getAiRuntimeStatus(),
      message: 'تنظیمات موتور ترجمه و دستیار هوشمند به‌روزرسانی شد.',
    },
    { status: 200, headers: HEADERS }
  );
}
