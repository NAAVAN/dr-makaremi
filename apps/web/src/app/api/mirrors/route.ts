import { NextResponse } from 'next/server';
import { VERIFIED_MIRROR_CHANNELS } from '@/lib/censorship-bypass';

export async function GET() {
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
      },
    }
  );
}
