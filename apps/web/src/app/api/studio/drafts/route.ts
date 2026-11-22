import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { hasPrototypePollution } from '@/lib/etl/types';
import { isStudioRequestAuthorized } from '@/lib/studio/auth';
import {
  deleteServerDraft,
  loadServerDraftsMap,
  saveServerDraft,
} from '@/lib/studio/overlays';
import type { StudioWorkDraft } from '@makaremi/shared';

const MAX_DRAFT_BYTES = 16 * 1024 * 1024;

const DraftSaveSchema = z.object({
  id: z.string().min(1).max(160),
  workType: z.enum(['article', 'book', 'poem', 'video', 'artwork', 'exhibition', 'page']),
  pillar: z.enum(['psychoanalysis', 'art_calligraphy', 'cultural_strategy', 'human_rights_dadkhahi']),
  originalLocale: z.enum(['fa', 'fr', 'en']),
  primary: z.object({
    languages_code: z.string().max(16),
    title: z.string().max(500),
  }).passthrough(),
}).passthrough();

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

export async function GET(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 60 }, 'studio_drafts_get');
  if (!rl.allowed) return rl.response!;

  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized studio access' }, { status: 401, headers: HEADERS });
  }

  const map = loadServerDraftsMap();
  const drafts = Object.values(map).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return NextResponse.json({ ok: true, drafts }, { status: 200, headers: HEADERS });
}

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 40 }, 'studio_drafts_post');
  if (!rl.allowed) return rl.response!;

  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized studio access' }, { status: 401, headers: HEADERS });
  }

  const raw = await request.text().catch(() => '');
  if (!raw || Buffer.byteLength(raw, 'utf8') > MAX_DRAFT_BYTES) {
    return NextResponse.json({ ok: false, error: 'Draft payload missing or exceeds limit' }, { status: 413, headers: HEADERS });
  }
  if (hasPrototypePollution(raw)) {
    return NextResponse.json({ ok: false, error: 'Disallowed payload' }, { status: 400, headers: HEADERS });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400, headers: HEADERS });
  }

  const check = DraftSaveSchema.safeParse(parsed);
  if (!check.success) {
    return NextResponse.json({ ok: false, error: 'Invalid draft schema' }, { status: 400, headers: HEADERS });
  }

  const draft = { ...(check.data as unknown as StudioWorkDraft), updatedAt: new Date().toISOString() };
  try {
    saveServerDraft(draft);
  } catch {
    // Graceful on read-only serverless; browser IndexedDB keeps full state
  }

  return NextResponse.json({ ok: true, savedAt: draft.updatedAt, id: draft.id }, { status: 200, headers: HEADERS });
}

export async function DELETE(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 40 }, 'studio_drafts_delete');
  if (!rl.allowed) return rl.response!;

  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized studio access' }, { status: 401, headers: HEADERS });
  }

  const id = request.nextUrl.searchParams.get('id') || '';
  if (!id) {
    return NextResponse.json({ ok: false, error: 'Missing draft id' }, { status: 400, headers: HEADERS });
  }

  try {
    deleteServerDraft(id);
  } catch {
    // ignore read-only fs
  }
  return NextResponse.json({ ok: true, deletedId: id }, { status: 200, headers: HEADERS });
}
