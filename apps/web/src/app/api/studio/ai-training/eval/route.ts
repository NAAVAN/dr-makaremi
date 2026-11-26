import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { isStudioRequestAuthorized } from '@/lib/studio/auth';
import { getLatestEvalRun } from '@/lib/rag/training-store';
import { runGoldenEvalSuite } from '@/lib/rag/eval-runner';

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

const EvalPostSchema = z.object({
  mode: z.enum(['deterministic', 'live_llm']).default('deterministic'),
  maxCases: z.number().int().min(5).max(60).optional(),
});

export async function GET(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 60 }, 'studio_ai_eval_get');
  if (!rl.allowed) return rl.response!;
  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized studio access' }, { status: 401, headers: HEADERS });
  }

  const latest = await getLatestEvalRun();
  return NextResponse.json({ ok: true, latest }, { status: 200, headers: HEADERS });
}

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 8 }, 'studio_ai_eval_post');
  if (!rl.allowed) return rl.response!;
  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized studio access' }, { status: 401, headers: HEADERS });
  }

  const raw = await request.text().catch(() => '');
  let body: unknown = {};
  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400, headers: HEADERS });
    }
  }

  const check = EvalPostSchema.safeParse(body);
  if (!check.success) {
    return NextResponse.json({ ok: false, error: 'Invalid eval parameters' }, { status: 400, headers: HEADERS });
  }

  const summary = await runGoldenEvalSuite({
    mode: check.data.mode,
    maxCases: check.data.maxCases,
    persist: true,
  });

  return NextResponse.json(
    {
      ok: true,
      summary,
      message: `ارزیابی ${summary.totalCases}موردی انجام شد: ${summary.passedCases}/${summary.totalCases} موفق (Recall@5: ${(summary.recallAt5 * 100).toFixed(1)}%).`,
    },
    { status: 200, headers: HEADERS }
  );
}
