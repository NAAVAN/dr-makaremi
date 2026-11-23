import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { createWithdrawalRequest, markWithdrawalReceiptSent } from '@/lib/commerce/store';
import { sendWithdrawalTimestampedReceiptEmail } from '@/lib/commerce/email';

const WithdrawalBodySchema = z.object({
  orderNumber: z.string().trim().min(4).max(64),
  customerFullName: z.string().trim().min(2).max(160),
  customerEmail: z.string().trim().email().max(180),
  reason: z.string().trim().max(500).optional(),
  confirmedStepTwo: z.literal(true),
});

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 15 }, 'commerce-withdrawal');
  if (!rl.allowed) return rl.response!;

  try {
    const raw = await request.json();
    const parsed = WithdrawalBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid withdrawal declaration fields', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const record = createWithdrawalRequest({
      orderNumber: parsed.data.orderNumber,
      customerFullName: parsed.data.customerFullName,
      customerEmail: parsed.data.customerEmail,
      reason: parsed.data.reason,
    });

    const emailSent = await sendWithdrawalTimestampedReceiptEmail(record);
    if (emailSent) {
      markWithdrawalReceiptSent(record.id);
      record.receiptEmailSent = true;
    }

    return NextResponse.json(
      {
        ok: true,
        withdrawal: record,
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unable to process withdrawal' },
      { status: 500 }
    );
  }
}
