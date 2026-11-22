import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { StudioWorkDraft } from '@makaremi/shared';
import { checkRateLimit } from '@/lib/rate-limit';
import { hasPrototypePollution } from '@/lib/etl/types';
import { isStudioRequestAuthorized } from '@/lib/studio/auth';
import { validateDataUrlServerSide } from '@/lib/studio/media-gatekeeper';
import { publishOrQueueStudioDraft } from '@/lib/studio/overlays';
import { revalidatePublicWorkPaths } from '@/lib/studio/works-index';

const MAX_PUBLISH_BYTES = 32 * 1024 * 1024;

const SingleDraftSchema = z
  .object({
    id: z.string().min(1).max(160),
    workType: z.enum(['article', 'book', 'poem', 'video', 'artwork', 'exhibition', 'page']),
    pillar: z.enum(['psychoanalysis', 'art_calligraphy', 'cultural_strategy', 'human_rights_dadkhahi']),
    originalLocale: z.enum(['fa', 'fr', 'en']),
    primary: z
      .object({
        languages_code: z.string().max(16),
        title: z.string().min(1).max(500),
      })
      .passthrough(),
  })
  .passthrough();

const PublishRequestSchema = z.object({
  drafts: z.array(SingleDraftSchema).min(1).max(25),
});

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 20 }, 'studio_publish_post');
  if (!rl.allowed) return rl.response!;

  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized studio access' }, { status: 401, headers: HEADERS });
  }

  const raw = await request.text().catch(() => '');
  if (!raw || Buffer.byteLength(raw, 'utf8') > MAX_PUBLISH_BYTES) {
    return NextResponse.json(
      { ok: false, error: 'Payload missing or exceeds 32 MB batch limit' },
      { status: 413, headers: HEADERS }
    );
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

  const bodyInput =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'drafts' in parsed
      ? parsed
      : { drafts: [parsed] };

  const validation = PublishRequestSchema.safeParse(bodyInput);
  if (!validation.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid draft structure', details: validation.error.issues },
      { status: 400, headers: HEADERS }
    );
  }

  const drafts = validation.data.drafts as unknown as StudioWorkDraft[];

  // Server-side media gatekeeper validation on any uploaded Data URLs
  for (const d of drafts) {
    const assetsToVerify = [
      d.primaryAsset,
      d.documentAsset,
      d.book3DSpec?.frontCover,
      d.book3DSpec?.backCover,
      d.book3DSpec?.spineImage,
      d.book3DSpec?.samplePagesFile,
    ];
    for (const asset of assetsToVerify) {
      if (asset?.dataUrl) {
        const res = validateDataUrlServerSide(asset.dataUrl, asset.slot);
        if (!res.ok) {
          return NextResponse.json(
            { ok: false, error: `Media gatekeeper rejected ${asset.fileName}: ${res.error}` },
            { status: 400, headers: HEADERS }
          );
        }
      }
    }
  }

  const results = [];
  for (const draft of drafts) {
    const outcome = await publishOrQueueStudioDraft(draft);
    revalidatePublicWorkPaths(outcome.collection, outcome.slug, draft.pillar);
    results.push({
      draftId: draft.id,
      slug: outcome.slug,
      collection: outcome.collection,
      queuedManualTargets: outcome.queuedManualTargets,
      autoTranslatedTargets: outcome.autoTranslatedTargets,
    });
  }

  return NextResponse.json(
    {
      ok: true,
      publishedCount: results.length,
      results,
      message: `${results.length} اثر با موفقیت در سایت ثبت و استانداردسازی شد.`,
    },
    { status: 200, headers: HEADERS }
  );
}
