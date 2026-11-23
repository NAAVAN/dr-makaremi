import { NextRequest, NextResponse } from 'next/server';
import { isStudioRequestAuthorized } from '@/lib/studio/auth';
import { getCommerceArchiveSelectableWorks } from '@/lib/commerce/archive-options';

export async function GET(request: NextRequest) {
  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const archive = await getCommerceArchiveSelectableWorks();
    return NextResponse.json(
      {
        ok: true,
        ...archive,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Failed to load archive works' },
      { status: 500 }
    );
  }
}
