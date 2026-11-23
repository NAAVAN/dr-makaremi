import { NextResponse } from 'next/server';
import { getCommerceCatalog, getCommerceLegalConfig } from '@/lib/commerce/store';
import { getStripeRuntimeMode } from '@/lib/commerce/stripe';
import { getNeonStorageStatus } from '@/lib/commerce/db';

export async function GET() {
  const [catalog, legal] = await Promise.all([
    getCommerceCatalog(),
    getCommerceLegalConfig(),
  ]);
  return NextResponse.json(
    {
      ok: true,
      stripeMode: getStripeRuntimeMode(),
      storageMode: getNeonStorageStatus().mode,
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
