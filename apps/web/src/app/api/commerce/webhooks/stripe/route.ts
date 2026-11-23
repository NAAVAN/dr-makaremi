import { NextRequest, NextResponse } from 'next/server';
import { verifyStripeWebhookSignature } from '@/lib/commerce/stripe';
import { markCommerceOrderPaid, updateCommerceOrderStatus } from '@/lib/commerce/store';
import { sendOrderConfirmationEmail } from '@/lib/commerce/email';

export async function POST(request: NextRequest) {
  const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
  if (!webhookSecret) {
    return NextResponse.json(
      { ok: false, error: 'STRIPE_WEBHOOK_SECRET is not configured' },
      { status: 503 }
    );
  }

  const rawBody = await request.text();
  const signatureHeader = request.headers.get('stripe-signature');

  if (!verifyStripeWebhookSignature(rawBody, signatureHeader, webhookSecret)) {
    return NextResponse.json({ ok: false, error: 'Invalid Stripe webhook signature' }, { status: 400 });
  }

  try {
    const event = JSON.parse(rawBody) as {
      type?: string;
      data?: {
        object?: {
          id?: string;
          payment_intent?: string | null;
          metadata?: { order_id?: string; order_number?: string };
        };
      };
    };

    const obj = event.data?.object;
    if (event.type === 'checkout.session.completed' && obj) {
      const paidOrder = await markCommerceOrderPaid({
        orderId: obj.metadata?.order_id,
        orderNumber: obj.metadata?.order_number,
        stripeSessionId: obj.id,
        stripePaymentIntentId: obj.payment_intent || null,
      });
      if (paidOrder) {
        await sendOrderConfirmationEmail(paidOrder);
      }
    } else if (event.type === 'checkout.session.expired' && obj?.metadata?.order_id) {
      await updateCommerceOrderStatus(obj.metadata.order_id, 'cancelled');
    }

    return NextResponse.json({ ok: true, received: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Malformed webhook payload' }, { status: 400 });
  }
}
