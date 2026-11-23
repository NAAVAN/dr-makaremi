import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  getAuthenticityCertificateById,
  verifyAuthenticityCertificate,
} from '@/lib/commerce/store';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 60 }, 'commerce-cert');
  if (!rl.allowed) return rl.response!;

  const { id } = await context.params;
  const cert = await getAuthenticityCertificateById(id);
  if (!cert) {
    return NextResponse.json(
      { ok: false, error: 'Authenticity certificate not found' },
      { status: 404 }
    );
  }

  const verification = verifyAuthenticityCertificate(cert);
  return NextResponse.json(
    {
      ok: true,
      verified: verification.sha256Matches && verification.ed25519Valid,
      verification,
      certificate: cert,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
