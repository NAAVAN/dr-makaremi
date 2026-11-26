import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';
import { hasPrototypePollution } from '@/lib/etl/types';
import {
  STUDIO_SESSION_COOKIE,
  createStudioSessionToken,
  getStudioRequestAuthInfo,
  getStudioSecretConfiguration,
  verifyStudioCredentialWithRole,
} from '@/lib/studio/auth';
import {
  checkStudioLoginLockout,
  clearStudioLoginFailures,
  recordStudioLoginFailure,
} from '@/lib/rag/security-audit';

const AuthBodySchema = z.object({
  secretOrPin: z.string().min(1).max(256),
});

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET(request: NextRequest) {
  const { authorized, role } = getStudioRequestAuthInfo(request);
  const { usingDefaultFallback } = getStudioSecretConfiguration();
  return NextResponse.json(
    {
      ok: true,
      authenticated: authorized,
      role: role || null,
      usingDefaultFallback,
    },
    { status: 200, headers: HEADERS }
  );
}

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 10 }, 'studio_auth_post');
  if (!rl.allowed) return rl.response!;

  let raw = '';
  try {
    raw = await request.text();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400, headers: HEADERS });
  }

  if (hasPrototypePollution(raw)) {
    return NextResponse.json({ ok: false, error: 'Disallowed payload' }, { status: 400, headers: HEADERS });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400, headers: HEADERS });
  }

  const check = AuthBodySchema.safeParse(parsed);
  if (!check.success) {
    return NextResponse.json({ ok: false, error: 'لطفاً رمز یا پین ورود را وارد فرمایید.' }, { status: 400, headers: HEADERS });
  }

  const clientIp = getClientIP(request);
  const lockout = await checkStudioLoginLockout(clientIp);
  if (lockout.locked) {
    return NextResponse.json(
      {
        ok: false,
        locked: true,
        retryAfterSec: lockout.retryAfterSec,
        error: `به دلیل تکرار ورود ناموفق، دسترسی به پیشخوان به مدت ${Math.ceil(lockout.retryAfterSec / 60)} دقیقه قفل امنیتی شد.`,
      },
      {
        status: 429,
        headers: {
          ...HEADERS,
          'Retry-After': String(lockout.retryAfterSec),
        },
      }
    );
  }

  const verification = verifyStudioCredentialWithRole(check.data.secretOrPin);
  if (!verification.valid) {
    const failState = await recordStudioLoginFailure(clientIp);
    return NextResponse.json(
      {
        ok: false,
        locked: failState.locked,
        remainingAttempts: failState.remainingAttempts,
        error: failState.locked
          ? 'حداکثر تعداد تلاش ناموفق (۵ بار) تکمیل شد؛ ورود به پیشخوان به مدت ۱۵ دقیقه قفل شد.'
          : `پین اختصاصی استاد یا کلید مدیریت نادرست است (تلاش‌های باقی‌مانده: ${failState.remainingAttempts}).`,
      },
      { status: failState.locked ? 429 : 401, headers: HEADERS }
    );
  }

  await clearStudioLoginFailures(clientIp);

  const token = createStudioSessionToken(verification.role || 'professor');
  const isHttps =
    request.nextUrl.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https';

  const res = NextResponse.json(
    { ok: true, authenticated: true, message: 'ورود استاد با موفقیت تایید شد.' },
    { status: 200, headers: HEADERS }
  );
  res.cookies.set({
    name: STUDIO_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps,
    path: '/',
    maxAge: 60 * 60 * 12,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true, authenticated: false }, { status: 200, headers: HEADERS });
  res.cookies.set({
    name: STUDIO_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
