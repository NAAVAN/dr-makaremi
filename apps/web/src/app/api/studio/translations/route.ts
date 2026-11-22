import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { Locale } from '@makaremi/shared';
import { checkRateLimit } from '@/lib/rate-limit';
import { hasPrototypePollution } from '@/lib/etl/types';
import { isStudioRequestAuthorized } from '@/lib/studio/auth';
import { normaliseStudioText } from '@/lib/studio/media-gatekeeper';
import { markManualTranslationCompleted } from '@/lib/studio/overlays';
import { revalidatePublicWorkPaths } from '@/lib/studio/works-index';
import { writePackTranslationEntry, type TranslationCollectionName } from '@/lib/vault-loader';

const MAX_TRANSLATION_BYTES = 2 * 1024 * 1024;

const VerseSchema = z.object({
  line_index: z.number().int().positive(),
  hemistich_a: z.string().max(1000),
  hemistich_b: z.string().max(1000).optional(),
});

const TranslationPatchSchema = z.object({
  collection: z.enum(['articles', 'books', 'poems', 'videos', 'artworks', 'exhibitions', 'pages']),
  slug: z.string().min(1).max(200),
  targetLocale: z.enum(['fa', 'fr', 'en']),
  title: z.string().min(1).max(600),
  subtitle: z.string().max(600).optional(),
  summary: z.string().max(10000).optional(),
  body_markdown: z.string().max(250000).optional(),
  commentary_markdown: z.string().max(100000).optional(),
  verses: z.array(VerseSchema).max(400).optional(),
});

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

export async function PATCH(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 40 }, 'studio_translations_patch');
  if (!rl.allowed) return rl.response!;

  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized studio access' }, { status: 401, headers: HEADERS });
  }

  const raw = await request.text().catch(() => '');
  if (!raw || Buffer.byteLength(raw, 'utf8') > MAX_TRANSLATION_BYTES) {
    return NextResponse.json({ ok: false, error: 'Translation payload exceeds 2 MB cap' }, { status: 413, headers: HEADERS });
  }
  if (hasPrototypePollution(raw)) {
    return NextResponse.json({ ok: false, error: 'Disallowed payload' }, { status: 400, headers: HEADERS });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON payload' }, { status: 400, headers: HEADERS });
  }

  const check = TranslationPatchSchema.safeParse(parsed);
  if (!check.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid translation update schema', details: check.error.issues },
      { status: 400, headers: HEADERS }
    );
  }

  const d = check.data;
  const loc = d.targetLocale as Locale;
  const languagesCode = loc === 'fa' ? 'fa-IR' : loc === 'fr' ? 'fr-FR' : 'en';
  const today = new Date().toISOString().slice(0, 10);

  const record: Record<string, unknown> = {
    languages_code: languagesCode,
    title: normaliseStudioText(d.title, loc),
    provenance: 'editorial_verified',
    updated_at: today,
  };

  if (d.subtitle !== undefined) record.subtitle = normaliseStudioText(d.subtitle, loc);
  if (d.summary !== undefined) {
    const cleanSummary = normaliseStudioText(d.summary, loc);
    if (d.collection === 'books') record.synopsis = cleanSummary;
    else if (d.collection === 'videos') record.description = cleanSummary;
    else if (d.collection === 'pages') record.excerpt = cleanSummary;
    else record.executive_summary = cleanSummary;
    record.summary = cleanSummary;
  }
  if (d.body_markdown !== undefined) {
    const cleanBody = normaliseStudioText(d.body_markdown, loc);
    if (d.collection === 'videos') record.transcript_markdown = cleanBody;
    else if (d.collection === 'exhibitions') record.curatorial_statement_markdown = cleanBody;
    else if (d.collection === 'artworks') record.description_markdown = cleanBody;
    else record.body_markdown = cleanBody;
  }
  if (d.commentary_markdown !== undefined) {
    record.commentary_markdown = normaliseStudioText(d.commentary_markdown, loc);
  }
  if (Array.isArray(d.verses)) {
    record.verses = d.verses.map((v) => ({
      line_index: v.line_index,
      hemistich_a: normaliseStudioText(v.hemistich_a, loc),
      ...(v.hemistich_b !== undefined ? { hemistich_b: normaliseStudioText(v.hemistich_b, loc) } : {}),
    }));
  }

  writePackTranslationEntry(d.collection as TranslationCollectionName, d.slug, languagesCode, record as never);
  markManualTranslationCompleted(d.collection as TranslationCollectionName, d.slug);
  revalidatePublicWorkPaths(d.collection as TranslationCollectionName, d.slug);

  return NextResponse.json(
    {
      ok: true,
      collection: d.collection,
      slug: d.slug,
      targetLocale: loc,
      updatedAt: today,
      message: 'ترجمه اصلاح‌شده ذخیره و در وب‌سایت عمومی منتشر شد (متن اصلی دست‌نخورده باقی ماند).',
    },
    { status: 200, headers: HEADERS }
  );
}
