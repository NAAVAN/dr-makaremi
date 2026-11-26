import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isStudioRequestAuthorized } from '@/lib/studio/auth';
import {
  getKnowledgeBaseSyncStatus,
  syncEntityToRagKnowledgeBase,
} from '@/lib/rag/auto-indexer';
import { deleteDynamicWorkFromNeon } from '@/lib/studio/neon-cms-store';

const SyncPostSchema = z.object({
  action: z.enum(['resync_all', 'cleanup_test_work']).default('resync_all'),
  slug: z.string().max(160).optional(),
});

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET(request: NextRequest) {
  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers: HEADERS });
  }
  const status = await getKnowledgeBaseSyncStatus();
  return NextResponse.json({ ok: true, status }, { status: 200, headers: HEADERS });
}

export async function POST(request: NextRequest) {
  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers: HEADERS });
  }

  let body: unknown = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400, headers: HEADERS });
  }

  const parsed = SyncPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid sync action' }, { status: 400, headers: HEADERS });
  }

  if (parsed.data.action === 'cleanup_test_work' && parsed.data.slug) {
    await deleteDynamicWorkFromNeon(parsed.data.slug);
    const syncRes = await syncEntityToRagKnowledgeBase({
      collection: 'articles',
      slug: parsed.data.slug,
      action: 'manual_resync',
      summary: `cleanup:${parsed.data.slug}`,
    });
    const status = await getKnowledgeBaseSyncStatus();
    return NextResponse.json({ ok: true, sync: syncRes, status }, { status: 200, headers: HEADERS });
  }

  const syncRes = await syncEntityToRagKnowledgeBase({
    collection: 'all',
    slug: 'manual-resync',
    action: 'manual_resync',
    summary: 'manual_studio_resync',
  });
  const status = await getKnowledgeBaseSyncStatus();

  return NextResponse.json(
    {
      ok: true,
      sync: syncRes,
      status,
      message: `پایگاه دانش دستیار هوشمند با موفقیت همگام‌سازی شد (نسخهٔ ${syncRes.kbVersion} — ${status.counts.totalChunks} قطعهٔ فعال).`,
    },
    { status: 200, headers: HEADERS }
  );
}
