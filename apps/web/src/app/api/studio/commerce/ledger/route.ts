import { NextRequest, NextResponse } from 'next/server';
import { isStudioRequestAuthorized } from '@/lib/studio/auth';
import { buildFrenchAccountingLedgerCsv } from '@/lib/commerce/store';

export async function GET(request: NextRequest) {
  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const rawBucket = request.nextUrl.searchParams.get('bucket') || 'all';
  const bucket =
    rawBucket === 'artiste_auteur' || rawBucket === 'commercial_bic' ? rawBucket : 'all';

  const csv = await buildFrenchAccountingLedgerCsv(bucket);
  const year = new Date().getUTCFullYear();
  const filename = `Livre_de_recettes_Makaremi_${bucket}_${year}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
