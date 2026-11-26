import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { hasPrototypePollution } from '@/lib/etl/types';
import { isStudioRequestAuthorized } from '@/lib/studio/auth';
import {
  activatePersonaVersion,
  getActivePersonaVersion,
  listPersonaVersions,
  saveNewPersonaVersion,
} from '@/lib/rag/training-store';

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

const PersonaPostSchema = z.union([
  z.object({
    action: z.literal('activate'),
    versionId: z.number().int().positive(),
  }),
  z.object({
    action: z.literal('create').optional(),
    label: z.string().min(2).max(160),
    systemConstitutionFa: z.string().min(20).max(8000),
    systemConstitutionFr: z.string().min(20).max(8000),
    systemConstitutionEn: z.string().min(20).max(8000),
    monthlyTokenBudget: z.number().int().min(100_000).max(100_000_000).optional(),
    clinicalBoundaryPolicy: z
      .object({
        enableCrisisDetection: z.boolean().optional(),
        blockMedicalDiagnosis: z.boolean().optional(),
        appendDisclaimerOnClinicalQueries: z.boolean().optional(),
        helplineFrance: z.string().max(300).optional(),
        helplineIran: z.string().max(300).optional(),
        helplineInternationalUrl: z.string().max(200).optional(),
      })
      .optional(),
    citationPolicy: z
      .object({
        requireInlineAnchors: z.boolean().optional(),
        minGroundingConfidence: z.number().min(0.1).max(1).optional(),
        maxCitationsPerAnswer: z.number().int().min(2).max(8).optional(),
        allowCrossLingualSources: z.boolean().optional(),
        enforceStrictWhiteLabel: z.boolean().optional(),
      })
      .optional(),
    providerRouting: z
      .object({
        primaryProfile: z.enum(['literary_balanced', 'literary_deep', 'concise_fast']).optional(),
        enableFastFallback: z.boolean().optional(),
        enableDeterministicFallback: z.boolean().optional(),
        requestTimeoutMs: z.number().int().min(5000).max(45000).optional(),
        maxOutputTokens: z.number().int().min(300).max(4000).optional(),
        temperature: z.number().min(0).max(1).optional(),
      })
      .optional(),
  }),
]);

export async function GET(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 60 }, 'studio_ai_persona_get');
  if (!rl.allowed) return rl.response!;
  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized studio access' }, { status: 401, headers: HEADERS });
  }

  const [active, versions] = await Promise.all([getActivePersonaVersion(), listPersonaVersions()]);
  return NextResponse.json({ ok: true, active, versions }, { status: 200, headers: HEADERS });
}

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 25 }, 'studio_ai_persona_post');
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

  const check = PersonaPostSchema.safeParse(parsedJson);
  if (!check.success) {
    return NextResponse.json({ ok: false, error: 'Validation error', details: check.error.issues }, { status: 400, headers: HEADERS });
  }

  if ('action' in check.data && check.data.action === 'activate') {
    const activated = await activatePersonaVersion(check.data.versionId);
    if (!activated) {
      return NextResponse.json({ ok: false, error: 'Persona version not found' }, { status: 404, headers: HEADERS });
    }
    const versions = await listPersonaVersions();
    return NextResponse.json(
      { ok: true, active: activated, versions, message: `نسخهٔ ${activated.versionId} منشور معرفتی فعال شد.` },
      { status: 200, headers: HEADERS }
    );
  }

  const d = check.data as Exclude<z.infer<typeof PersonaPostSchema>, { action: 'activate' }>;
  const created = await saveNewPersonaVersion({
    label: d.label,
    systemConstitutionFa: d.systemConstitutionFa,
    systemConstitutionFr: d.systemConstitutionFr,
    systemConstitutionEn: d.systemConstitutionEn,
    monthlyTokenBudget: d.monthlyTokenBudget,
    clinicalBoundaryPolicy: d.clinicalBoundaryPolicy,
    citationPolicy: d.citationPolicy,
    providerRouting: d.providerRouting,
  });
  const versions = await listPersonaVersions();
  return NextResponse.json(
    { ok: true, active: created, versions, message: `منشور معرفتی جدید (نسخهٔ ${created.versionId}) با امضای Ed25519 ذخیره و فعال شد.` },
    { status: 201, headers: HEADERS }
  );
}
