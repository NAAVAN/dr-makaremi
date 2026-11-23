import { NextResponse } from 'next/server';
import { getCommerceCatalog, getCommerceLegalConfig } from '@/lib/commerce/store';
import { getStripeRuntimeMode } from '@/lib/commerce/stripe';

export async function GET() {
  const catalog = getCommerceCatalog();
  const legal = getCommerceLegalConfig();
  return NextResponse.json(
    {
      ok: true,
      stripeMode: getStripeRuntimeMode(),
      taxMode: legal.taxMode,
      franchiseMentionFr: legal.franchiseMentionFr,
      sepaRecommendedThresholdEurCents: legal.sepaRecommendedThresholdEurCents,
      count: catalog.length,
      items: catalog,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
