import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  attachStripeSessionToOrder,
  createCommerceOrder,
  getCommerceCatalog,
  getCommerceLegalConfig,
  updateCommerceOrderStatus,
} from '@/lib/commerce/store';
import { calculateFrenchCommerceQuote, SANCTIONED_COUNTRY_CODES } from '@/lib/commerce/rules';
import { createStripeCheckoutSession, isStripeConfigured } from '@/lib/commerce/stripe';
import { sendOrderConfirmationEmail } from '@/lib/commerce/email';

const CheckoutRequestSchema = z.object({
  locale: z.enum(['fa', 'fr', 'en']).default('fr'),
  paymentMethod: z.enum(['stripe_card', 'stripe_alma', 'sepa_wire']),
  items: z
    .array(
      z.object({
        sku: z.string().trim().min(2).max(80),
        quantity: z.number().int().min(1).max(20),
        customDedication: z.string().trim().max(220).optional(),
      })
    )
    .min(1)
    .max(25),
  customer: z.object({
    fullName: z.string().trim().min(2).max(160),
    email: z.string().trim().email().max(180),
    phone: z.string().trim().max(40).optional(),
    addressLine1: z.string().trim().max(200).optional(),
    addressLine2: z.string().trim().max(200).optional(),
    postalCode: z.string().trim().max(32).optional(),
    city: z.string().trim().max(120).optional(),
    countryCode: z.string().trim().length(2),
    notes: z.string().trim().max(600).optional(),
  }),
  cgvAccepted: z.boolean(),
  digitalWithdrawalWaived: z.boolean().default(false),
  customOrderWaived: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 20 }, 'commerce-checkout');
  if (!rl.allowed) return rl.response!;

  try {
    const raw = await request.json();
    const parsed = CheckoutRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid checkout payload', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const body = parsed.data;
    if (!body.cgvAccepted) {
      return NextResponse.json(
        { ok: false, code: 'cgv_required', error: 'Acceptance of French CGV is mandatory.' },
        { status: 400 }
      );
    }

    const countryUpper = body.customer.countryCode.toUpperCase();
    if (SANCTIONED_COUNTRY_CODES.has(countryUpper)) {
      return NextResponse.json(
        {
          ok: false,
          code: 'restricted_destination',
          error: 'International card/SEPA processing is not legally available for this destination.',
        },
        { status: 400 }
      );
    }

    // Authoritative server-side catalog lookup (never trust client-submitted prices)
    const [catalog, legalConfig] = await Promise.all([
      getCommerceCatalog(),
      getCommerceLegalConfig(),
    ]);
    const catalogMap = new Map(catalog.map((p) => [p.sku, p]));
    const resolvedItems = [];

    for (const line of body.items) {
      const product = catalogMap.get(line.sku);
      if (!product) {
        return NextResponse.json(
          { ok: false, error: `Unknown product SKU: ${line.sku}` },
          { status: 404 }
        );
      }
      if (product.availability !== 'available') {
        return NextResponse.json(
          {
            ok: false,
            code: 'item_unavailable',
            error: `Item ${line.sku} is currently ${product.availability}.`,
          },
          { status: 409 }
        );
      }
      resolvedItems.push({
        product,
        quantity: line.quantity,
        customDedication: line.customDedication,
      });
    }

    const quote = calculateFrenchCommerceQuote({
      items: resolvedItems,
      countryCode: countryUpper,
      legalConfig,
    });

    if (quote.hasPhysicalGoods) {
      if (!body.customer.addressLine1 || !body.customer.postalCode || !body.customer.city) {
        return NextResponse.json(
          { ok: false, error: 'Complete postal shipping address is required for physical items.' },
          { status: 400 }
        );
      }
    }

    if (quote.requiresDigitalWaiver && !body.digitalWithdrawalWaived) {
      return NextResponse.json(
        {
          ok: false,
          code: 'digital_waiver_required',
          error: 'Explicit withdrawal waiver (Art. L.221-28 13°) is required for instant digital goods.',
        },
        { status: 400 }
      );
    }

    if (quote.requiresCustomWaiver && !body.customOrderWaived) {
      return NextResponse.json(
        {
          ok: false,
          code: 'custom_waiver_required',
          error: 'Acknowledgment of bespoke artwork exception (Art. L.221-28 3°) is required.',
        },
        { status: 400 }
      );
    }

    if (!quote.eligiblePaymentMethods.includes(body.paymentMethod)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Selected payment method ${body.paymentMethod} is not eligible for this quote.`,
        },
        { status: 400 }
      );
    }

    // Check Stripe availability BEFORE creating a pending card order
    if (
      (body.paymentMethod === 'stripe_card' || body.paymentMethod === 'stripe_alma') &&
      !isStripeConfigured()
    ) {
      return NextResponse.json(
        {
          ok: false,
          code: 'stripe_not_configured',
          error: 'Stripe France API key is not configured on this environment yet.',
          sepaAvailable: quote.eligiblePaymentMethods.includes('sepa_wire'),
        },
        { status: 503 }
      );
    }

    const order = await createCommerceOrder({
      paymentMethod: body.paymentMethod,
      locale: body.locale,
      customer: {
        ...body.customer,
        countryCode: countryUpper,
      },
      quote,
      digitalWithdrawalWaived: body.digitalWithdrawalWaived,
      customOrderWaived: body.customOrderWaived,
    });

    if (body.paymentMethod === 'sepa_wire') {
      await sendOrderConfirmationEmail(order);
      return NextResponse.json(
        {
          ok: true,
          mode: 'sepa_wire',
          order,
          sepaDetails: {
            accountHolder: legalConfig.sepaAccountHolder,
            iban: legalConfig.sepaIban,
            bic: legalConfig.sepaBic,
            bankName: legalConfig.sepaBankName,
            reference: order.orderNumber,
          },
        },
        { status: 201 }
      );
    }

    // Stripe Hosted Checkout Session (CB / Visa / Mastercard / Apple Pay / Alma)
    try {
      const origin = request.nextUrl.origin || 'https://makaremi.com';
      const session = await createStripeCheckoutSession({ order, origin });
      await attachStripeSessionToOrder(order.id, session.id);
      return NextResponse.json(
        {
          ok: true,
          mode: 'stripe_checkout',
          checkoutUrl: session.url,
          stripeSessionId: session.id,
          order,
        },
        { status: 201 }
      );
    } catch (stripeErr) {
      await updateCommerceOrderStatus(order.id, 'cancelled');
      return NextResponse.json(
        {
          ok: false,
          error: stripeErr instanceof Error ? stripeErr.message : 'Stripe Checkout session failed',
        },
        { status: 502 }
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Checkout failed';
    const isConflict = msg.includes('reserved') || msg.includes('available');
    return NextResponse.json({ ok: false, error: msg }, { status: isConflict ? 409 : 400 });
  }
}
