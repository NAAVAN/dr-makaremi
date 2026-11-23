import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { consumeDownloadToken } from '@/lib/commerce/store';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 20 }, 'commerce-download');
  if (!rl.allowed) return rl.response!;

  const { token } = await context.params;
  const result = consumeDownloadToken(token);
  if (!result.valid || !result.order) {
    return NextResponse.json(
      { ok: false, error: result.error || 'Invalid download link' },
      { status: 403 }
    );
  }

  // If digitalAssetKey is a direct HTTPS archival PDF on makaremi.com, proxy or redirect safely with watermark audit headers
  if (result.assetUrl && result.assetUrl.startsWith('https://www.makaremi.com/')) {
    const res = NextResponse.redirect(result.assetUrl, 302);
    res.headers.set('Cache-Control', 'no-store');
    res.headers.set('X-Makaremi-Invoice', result.order.invoiceNumber);
    res.headers.set('X-Makaremi-Remaining-Downloads', String(result.remainingDownloads ?? 0));
    return res;
  }

  return NextResponse.json(
    {
      ok: true,
      title: result.title,
      invoiceNumber: result.order.invoiceNumber,
      orderNumber: result.order.orderNumber,
      licensedTo: result.order.customer.fullName,
      remainingDownloads: result.remainingDownloads,
      assetKey: result.assetUrl || null,
      notice:
        'Digital license verified. Upload the final private PDF/EPUB asset to Vercel Blob or Cloudflare R2 and map its key in Pishkhan.',
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
