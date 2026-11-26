import { NextRequest, NextResponse } from 'next/server';
import { isStudioRequestAuthorized } from '@/lib/studio/auth';
import { getSecurityAuditSummary } from '@/lib/rag/security-audit';

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET(request: NextRequest) {
  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers: HEADERS });
  }
  const summary = await getSecurityAuditSummary();
  return NextResponse.json({ ok: true, summary }, { status: 200, headers: HEADERS });
}
