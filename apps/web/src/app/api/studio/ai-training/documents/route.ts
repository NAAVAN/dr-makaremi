import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { hasPrototypePollution } from '@/lib/etl/types';
import { isStudioRequestAuthorized } from '@/lib/studio/auth';
import {
  deleteTrainingDocument,
  ingestTrainingDocument,
  listTrainingDocuments,
} from '@/lib/rag/training-store';
import type { ContentPillar, Locale } from '@makaremi/shared';

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

const TrainingDocSchema = z.object({
  title: z.string().min(3).max(260),
  sourceFormat: z.enum(['markdown', 'pdf_text', 'docx_text', 'srt_vtt', 'voice_note', 'facebook_thread']).default('markdown'),
  locale: z.enum(['fa', 'fr', 'en']).default('fa'),
  pillar: z.enum(['psychoanalysis', 'art_calligraphy', 'cultural_strategy', 'human_rights_dadkhahi']),
  bodyMarkdown: z.string().min(40).max(80000),
});

export async function GET(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 60 }, 'studio_ai_docs_get');
  if (!rl.allowed) return rl.response!;
  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized studio access' }, { status: 401, headers: HEADERS });
  }

  const documents = await listTrainingDocuments();
  return NextResponse.json({ ok: true, documents }, { status: 200, headers: HEADERS });
}

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 20 }, 'studio_ai_docs_post');
  if (!rl.allowed) return rl.response!;
  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized studio access' }, { status: 401, headers: HEADERS });
  }

  const raw = await request.text().catch(() => '');
  if (!raw || hasPrototypePollution(raw)) {
    return NextResponse.json({ ok: false, error: 'Disallowed payload' }, { status: 400, headers: HEADERS });
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400, headers: HEADERS });
  }

  const check = TrainingDocSchema.safeParse(parsedJson);
  if (!check.success) {
    return NextResponse.json({ ok: false, error: 'Validation failed', details: check.error.issues }, { status: 400, headers: HEADERS });
  }

  const doc = await ingestTrainingDocument({
    ...check.data,
    locale: check.data.locale as Locale,
    pillar: check.data.pillar as ContentPillar,
  });
  const documents = await listTrainingDocuments();

  return NextResponse.json(
    {
      ok: true,
      document: doc,
      documents,
      message: `سند آموزشی «${doc.title}» (${doc.wordCount.toLocaleString('fa-IR')} واژه) با امضای Ed25519 در مغز دستیار نمایه شد.`,
    },
    { status: 201, headers: HEADERS }
  );
}

export async function DELETE(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 25 }, 'studio_ai_docs_del');
  if (!rl.allowed) return rl.response!;
  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized studio access' }, { status: 401, headers: HEADERS });
  }

  const id = (request.nextUrl.searchParams.get('id') || '').trim();
  if (!id) {
    return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400, headers: HEADERS });
  }

  await deleteTrainingDocument(id);
  const documents = await listTrainingDocuments();
  return NextResponse.json({ ok: true, documents, message: 'سند آموزشی از نمایهٔ فعال حذف شد.' }, { status: 200, headers: HEADERS });
}
