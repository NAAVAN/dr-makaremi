import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { hasPrototypePollution } from '@/lib/etl/types';
import {
  getStudioRequestAuthInfo,
  getStudioSecurityStatus,
  resetStudioSecurityCredentials,
  updateStudioSecurityCredentials,
} from '@/lib/studio/auth';

const SecurityUpdateSchema = z
  .object({
    action: z.enum(['update', 'reset']).default('update'),
    newPin: z.string().trim().max(64).optional().default(''),
    newManagementKey: z.string().trim().max(128).optional().default(''),
  })
  .superRefine((data, ctx) => {
    if (data.action === 'update') {
      if (!data.newPin && !data.newManagementKey) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'لطفاً حداقل یکی از فیلدهای پین جدید یا کلید مدیریت جدید را وارد فرمایید.',
        });
      }
      if (data.newPin && data.newPin.length < 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'پین اختصاصی استاد باید حداقل ۴ کاراکتر باشد.',
        });
      }
      if (data.newManagementKey && data.newManagementKey.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'کلید مدیریت باید حداقل ۸ کاراکتر باشد.',
        });
      }
    }
  });

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 60 }, 'studio_security_get');
  if (!rl.allowed) return rl.response!;

  const authInfo = getStudioRequestAuthInfo(request);
  if (!authInfo.authorized) {
    return NextResponse.json({ ok: false, error: 'Unauthorized access' }, { status: 401, headers: HEADERS });
  }

  return NextResponse.json(
    {
      ok: true,
      role: authInfo.role || 'professor',
      security: getStudioSecurityStatus(),
    },
    { status: 200, headers: HEADERS }
  );
}

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 20 }, 'studio_security_post');
  if (!rl.allowed) return rl.response!;

  const authInfo = getStudioRequestAuthInfo(request);
  if (!authInfo.authorized) {
    return NextResponse.json({ ok: false, error: 'Unauthorized access' }, { status: 401, headers: HEADERS });
  }

  const raw = await request.text().catch(() => '');
  if (hasPrototypePollution(raw)) {
    return NextResponse.json({ ok: false, error: 'Disallowed payload' }, { status: 400, headers: HEADERS });
  }

  let parsed: unknown = {};
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload' }, { status: 400, headers: HEADERS });
  }

  const check = SecurityUpdateSchema.safeParse(parsed);
  if (!check.success) {
    return NextResponse.json(
      { ok: false, error: check.error.issues[0]?.message || 'مقادیر امنیتی واردشده معتبر نیستند.' },
      { status: 400, headers: HEADERS }
    );
  }

  if (check.data.action === 'reset') {
    const status = resetStudioSecurityCredentials();
    return NextResponse.json(
      {
        ok: true,
        security: status,
        message:
          'پین و کلید سفارشی به تنظیمات پیش‌فرض سرور بازگردانده شدند. دسترسی سوپر ادمین همچنان فعال است.',
      },
      { status: 200, headers: HEADERS }
    );
  }

  const status = updateStudioSecurityCredentials({
    newPin: check.data.newPin || undefined,
    newManagementKey: check.data.newManagementKey || undefined,
    updatedByRole: authInfo.role || 'professor',
  });

  return NextResponse.json(
    {
      ok: true,
      security: status,
      message:
        'تغییرات امنیتی با موفقیت ثبت شد. دسترسی سوپر ادمین بدون هیچ تغییری پابرجا و مصون از مسدودسازی باقی می‌ماند.',
    },
    { status: 200, headers: HEADERS }
  );
}
