import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { hasPrototypePollution } from '@/lib/etl/types';
import { timingSafeCompare } from '@/lib/crypto';

const MAX_MANIFEST_BYTES = 512 * 1024; // 512 KB cap to prevent DoS / disk exhaustion

const CurationManifestSchema = z
  .record(z.string().max(256), z.unknown())
  .refine((obj) => Object.keys(obj).length <= 500, 'Manifest key count limit exceeded');

const SECURITY_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

export async function POST(request: NextRequest) {
  // 1. Rate Limit: 20 mutations per minute per IP
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 20 }, 'curation_manifest_post');
  if (!rl.allowed) return rl.response!;

  // 2. Optional Admin Secret Gate (mandatory in production when CURATION_ADMIN_SECRET is configured)
  const configuredSecret = process.env.CURATION_ADMIN_SECRET;
  if (configuredSecret) {
    const providedSecret = request.headers.get('x-curation-secret') || '';
    if (!providedSecret || !timingSafeCompare(providedSecret, configuredSecret)) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized curation manifest mutation' },
        { status: 401, headers: SECURITY_HEADERS }
      );
    }
  }

  // 3. Enforce strict payload size limit before JSON parsing
  let rawText = '';
  try {
    rawText = await request.text();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Unable to read request payload' },
      { status: 400, headers: SECURITY_HEADERS }
    );
  }

  if (Buffer.byteLength(rawText, 'utf8') > MAX_MANIFEST_BYTES) {
    return NextResponse.json(
      { ok: false, error: 'Manifest payload exceeds 512 KB limit' },
      { status: 413, headers: SECURITY_HEADERS }
    );
  }

  if (hasPrototypePollution(rawText)) {
    return NextResponse.json(
      { ok: false, error: 'Disallowed payload structure detected' },
      { status: 400, headers: SECURITY_HEADERS }
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON payload' },
      { status: 400, headers: SECURITY_HEADERS }
    );
  }

  if (hasPrototypePollution(parsed)) {
    return NextResponse.json(
      { ok: false, error: 'Disallowed payload structure detected' },
      { status: 400, headers: SECURITY_HEADERS }
    );
  }

  const validation = CurationManifestSchema.safeParse(parsed);
  if (!validation.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid manifest schema' },
      { status: 400, headers: SECURITY_HEADERS }
    );
  }

  // Persist locally when running in writable environment
  try {
    const saveDir = path.join(process.cwd(), 'src', 'data');
    fs.mkdirSync(saveDir, { recursive: true });
    const filePath = path.join(saveDir, 'makaremi-curation-decisions.json');
    fs.writeFileSync(filePath, JSON.stringify(validation.data, null, 2), 'utf8');
  } catch {
    // On read-only serverless filesystem, client-side download + response handles persistence
  }

  return NextResponse.json(
    {
      ok: true,
      savedAt: new Date().toISOString(),
      message: 'تصمیمات و نظرات استاد دکتر حسن مکارمی با موفقیت ثبت شد.',
    },
    { status: 200, headers: SECURITY_HEADERS }
  );
}

export async function GET(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 60 }, 'curation_manifest_get');
  if (!rl.allowed) return rl.response!;

  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'makaremi-curation-decisions.json');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return NextResponse.json(JSON.parse(content), { status: 200, headers: SECURITY_HEADERS });
    }
  } catch {
    // Fallback cleanly without leaking paths or stack traces
  }
  return NextResponse.json(
    { ok: true, status: 'awaiting_curation' },
    { status: 200, headers: SECURITY_HEADERS }
  );
}
