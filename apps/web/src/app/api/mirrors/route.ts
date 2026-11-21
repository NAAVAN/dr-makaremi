import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { VERIFIED_MIRROR_CHANNELS } from '@/lib/censorship-bypass';

export async function GET(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 120 }, 'mirrors');
  if (!rl.allowed) return rl.response!;

  return NextResponse.json(
    {
      status: 'active',
      mirrors: VERIFIED_MIRROR_CHANNELS,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'X-Robots-Tag': 'all',
        'X-Content-Type-Options': 'nosniff',
      },
    }
  );
}
