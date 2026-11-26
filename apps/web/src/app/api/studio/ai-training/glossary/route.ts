import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { hasPrototypePollution } from '@/lib/etl/types';
import { isStudioRequestAuthorized } from '@/lib/studio/auth';
import {
  listLivingGlossaryAndEdges,
  upsertConceptEdge,
  upsertGlossaryTerm,
} from '@/lib/rag/training-store';
import type { ConceptEdgeRelation, ContentPillar } from '@makaremi/shared';

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

const GlossaryPostSchema = z.union([
  z.object({
    kind: z.literal('edge'),
    sourceTermId: z.string().min(2).max(80),
    targetTermId: z.string().min(2).max(80),
    relationType: z.enum([
      'broader',
      'narrower',
      'contrasts_with',
      'clinical_application',
      'literary_echo',
      'related',
    ]),
    noteFa: z.string().max(300).optional(),
  }),
  z.object({
    kind: z.literal('term').optional(),
    id: z.string().max(80).optional(),
    term_fa: z.string().min(2).max(200),
    term_fr: z.string().min(1).max(200),
    term_en: z.string().min(1).max(200),
    aliases: z.array(z.string().max(120)).max(20).optional(),
    conceptual_definition_fa: z.string().min(10).max(2500),
    conceptual_definition_fr: z.string().max(2500).optional(),
    conceptual_definition_en: z.string().max(2500).optional(),
    pillar: z.enum(['psychoanalysis', 'art_calligraphy', 'cultural_strategy', 'human_rights_dadkhahi']),
    linked_sources: z.array(z.string().max(250)).max(10).optional(),
    is_locked_translation: z.boolean().optional(),
  }),
]);

export async function GET(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 60 }, 'studio_ai_glossary_get');
  if (!rl.allowed) return rl.response!;
  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized studio access' }, { status: 401, headers: HEADERS });
  }

  const data = await listLivingGlossaryAndEdges();
  return NextResponse.json({ ok: true, ...data }, { status: 200, headers: HEADERS });
}

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 30 }, 'studio_ai_glossary_post');
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

  const check = GlossaryPostSchema.safeParse(parsedJson);
  if (!check.success) {
    return NextResponse.json({ ok: false, error: 'Validation failed', details: check.error.issues }, { status: 400, headers: HEADERS });
  }

  if ('kind' in check.data && check.data.kind === 'edge') {
    const edge = await upsertConceptEdge({
      sourceTermId: check.data.sourceTermId,
      targetTermId: check.data.targetTermId,
      relationType: check.data.relationType as ConceptEdgeRelation,
      noteFa: check.data.noteFa,
    });
    const data = await listLivingGlossaryAndEdges();
    return NextResponse.json(
      { ok: true, edge, ...data, message: 'پیوند مفهومی جدید به گراف دانش افزوده شد.' },
      { status: 201, headers: HEADERS }
    );
  }

  const t = check.data as Exclude<z.infer<typeof GlossaryPostSchema>, { kind: 'edge' }>;
  const term = await upsertGlossaryTerm({
    ...t,
    pillar: t.pillar as ContentPillar,
  });
  const data = await listLivingGlossaryAndEdges();
  return NextResponse.json(
    { ok: true, term, ...data, message: `اصطلاح «${term.term_fa}» در واژه‌نامه زنده و موتور جستجو ثبت شد.` },
    { status: 201, headers: HEADERS }
  );
}
