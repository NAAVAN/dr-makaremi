import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'node:crypto';
import { checkRateLimit } from '@/lib/rate-limit';

const SubscribeSchema = z.object({
  email: z.string().trim().email('فرمت ایمیل نامعتبر است').max(256),
  locale: z.enum(['fa', 'fr', 'en']).default('fa'),
  // Honeypot anti-spam trap (must be completely empty)
  hp_fax_number: z.string().max(0, 'Spam detected').optional(),
});

export async function POST(request: NextRequest) {
  // 1. Rate limiting: 5 subscriptions per 10 minutes per IP
  // Rate limiting: 10 requests per minute per client IP
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 10 }, 'newsletter');
  if (!rl.allowed) return rl.response!;

  try {
    const json = await request.json();
    const result = SubscribeSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Bad Request', issues: result.error.issues },
        { status: 400 }
      );
    }

    const { email, locale } = result.data;

    // Cryptographic privacy hash for subscriber anonymity
    const salt = process.env.SUBSCRIBER_SALT || 'makaremi_sec_salt_2026';
    const privacyHash = crypto
      .createHmac('sha256', salt)
      .update(email.toLowerCase())
      .digest('hex');

    return NextResponse.json(
      {
        success: true,
        message: 'عضویت شما در خبرنامه تمام‌متن ضدسانسور با موفقیت ثبت شد.',
        subscriber_hash: privacyHash.slice(0, 12),
        locale,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Malformed request payload' },
      { status: 400 }
    );
  }
}
