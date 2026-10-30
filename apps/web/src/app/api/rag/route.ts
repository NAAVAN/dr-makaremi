import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { hasPrototypePollution } from '@/lib/etl/types';
import { askResearchAssistant } from '@/lib/rag/research-assistant';
import { detectPromptInjection } from '@/lib/etl/enrichment-pipeline';
import type { Locale } from '@makaremi/shared';

const RagRequestSchema = z.object({
  query: z.string().min(1).max(1000),
  locale: z.enum(['fa', 'fr', 'en']).default('fa'),
});

export async function POST(request: NextRequest) {
  // Rate limiting: 30 requests per minute
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 30 }, 'rag_assistant');
  if (!rl.allowed) return rl.response!;

  let rawBodyText = '';
  try {
    rawBodyText = await request.text();
  } catch {
    return NextResponse.json({ error: 'Bad Request', message: 'Unable to read request payload' }, { status: 400 });
  }

  // Refinement 2: Prototype Pollution Guard
  if (hasPrototypePollution(rawBodyText)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Prototype pollution detected in payload' },
      { status: 400 }
    );
  }

  let bodyJson: unknown;
  try {
    bodyJson = JSON.parse(rawBodyText);
  } catch {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid JSON payload format' },
      { status: 400 }
    );
  }

  if (hasPrototypePollution(bodyJson)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Prototype pollution detected in payload' },
      { status: 400 }
    );
  }

  const parsed = RagRequestSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Bad Request',
        message: 'Invalid RAG request schema',
        details: parsed.error.issues,
      },
      { status: 400 }
    );
  }

  const { query, locale } = parsed.data;

  // Refinement 3: Direct Prompt Injection Defense
  const injection = detectPromptInjection(query);
  if (injection.isInjection) {
    return NextResponse.json(
      {
        error: 'Bad Request',
        message: 'Prompt injection rejected by Cloudflare Security Guard',
        pattern: injection.pattern,
      },
      {
        status: 400,
        headers: {
          'X-RateLimit-Limit': '30',
          'X-RateLimit-Remaining': String(rl.remaining),
        },
      }
    );
  }

  try {
    const response = await askResearchAssistant({
      query,
      locale: locale as Locale,
    });

    return NextResponse.json(
      {
        success: true,
        ...response,
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-RateLimit-Limit': '30',
          'X-RateLimit-Remaining': String(rl.remaining),
        },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Assistant query failed';
    if (errorMessage.includes('PROMPT_INJECTION_DETECTED')) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Prompt injection detected' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: errorMessage },
      { status: 500 }
    );
  }
}
