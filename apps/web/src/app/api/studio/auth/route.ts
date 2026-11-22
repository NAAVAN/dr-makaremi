import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { hasPrototypePollution } from '@/lib/etl/types';
import {
  STUDIO_SESSION_COOKIE,
  createStudioSessionToken,
  getStudioRequestAuthInfo,
  getStudioSecretConfiguration,
  verifyStudioCredentialWithRole,
} from '@/lib/studio/auth';

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

  const verification = verifyStudioCredentialWithRole(check.data.secretOrPin);
  if (!verification.valid) {
    return NextResponse.json(
      { ok: false, error: 'پین اختصاصی استاد یا کلید مدیریت نادرست است.' },
      { status: 401, headers: HEADERS }
    );
  }

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
