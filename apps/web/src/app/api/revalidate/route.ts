import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import crypto from 'node:crypto';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';

const RevalidateSchema = z
  .object({
    path: z
      .string()
      .min(1, 'Path cannot be empty')
      .max(512, 'Path exceeds maximum length')
      .regex(/^\/[a-zA-Z0-9_\-\/.]*$/, 'Invalid path format')
      .optional(),
    tag: z
      .string()
      .min(1, 'Tag cannot be empty')
      .max(128, 'Tag exceeds maximum length')
      .regex(/^[a-zA-Z0-9_\-:]+$/, 'Invalid tag format')
      .optional(),
  })
  .refine((data) => Boolean(data.path || data.tag), {
    message: 'Either "path" or "tag" parameter must be provided in request body',
  });

function safeCompare(providedSecret: string, expectedSecret: string): boolean {
  if (!providedSecret || !expectedSecret) {
    return false;
  }
  const hashProvided = crypto.createHash('sha256').update(providedSecret).digest();
  const hashExpected = crypto.createHash('sha256').update(expectedSecret).digest();
  return crypto.timingSafeEqual(hashProvided, hashExpected);
}

export async function POST(request: NextRequest) {
  // Rate limit: 30 requests per minute
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 30 }, 'revalidate');
  if (!rl.allowed) return rl.response!;

  try {
    const secret = request.headers.get('x-revalidate-secret') || '';
    const expectedSecret = process.env.REVALIDATE_SECRET_TOKEN || '';

    // Defense-in-depth: Require token to be configured and timing-safely verified
    if (!expectedSecret || !safeCompare(secret, expectedSecret)) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid or missing secret token.' },
        { status: 401 }
      );
    }

    const rawBody = await request.json().catch(() => null);
    if (!rawBody || typeof rawBody !== 'object') {
      return NextResponse.json(
        { error: 'Malformed JSON payload in request body' },
        { status: 400 }
      );
    }

    const validationResult = RevalidateSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: validationResult.error.errors.map((e) => e.message),
        },
        { status: 400 }
      );
    }

    const { path, tag } = validationResult.data;

    if (tag) {
      revalidateTag(tag);
      return NextResponse.json({
        revalidated: true,
        type: 'tag',
        target: tag,
        now: Date.now(),
      });
    }

    if (path) {
      revalidatePath(path);
      return NextResponse.json({
        revalidated: true,
        type: 'path',
        target: path,
        now: Date.now(),
      });
    }

    return NextResponse.json(
      { error: 'Missing path or tag parameter in request body' },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown revalidation failure';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
