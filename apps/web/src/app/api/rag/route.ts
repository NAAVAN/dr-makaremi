import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { hasPrototypePollution } from '@/lib/etl/types';
import { askResearchAssistant } from '@/lib/rag/research-assistant';
import { detectComprehensivePromptInjection } from '@/lib/rag/safety-guard';
import { recordSecurityAuditEvent } from '@/lib/rag/security-audit';
import type { ContentPillar, Locale, RagDocumentType } from '@makaremi/shared';

const HistoryTurnSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(2000),
});

const RagRequestSchema = z.object({
  query: z.string().min(1).max(1000),
  locale: z.enum(['fa', 'fr', 'en']).default('fa'),
  history: z.array(HistoryTurnSchema).max(8).optional(),
  pillar: z
    .enum(['all', 'psychoanalysis', 'art_calligraphy', 'cultural_strategy', 'human_rights_dadkhahi'])
    .default('all'),
  type: z
    .enum([
      'all',
      'book',
      'article',
      'speech',
      'poem',
      'exhibition',
      'page',
      'artwork',
      'commerce',
      'glossary',
      'golden_qa',
      'training_note',
    ])
    .default('all'),
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

  const { query, locale, history, pillar, type } = parsed.data;

  const injection = detectComprehensivePromptInjection(query, history);
  if (injection.isInjection) {
    void recordSecurityAuditEvent({
      eventType: 'prompt_injection_blocked',
      severity: 'high',
      route: '/api/rag',
      detail: `Blocked (${injection.source || 'query'}:${injection.pattern || 'pattern'})`,
    });
    return NextResponse.json(
      {
        error: 'Bad Request',
        message: 'Prompt injection rejected by Security Guard',
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

  const sessionSeed = request.headers.get('user-agent') || 'web-researcher';

  try {
    const response = await askResearchAssistant({
      query,
      locale: locale as Locale,
      history,
      pillar: pillar as ContentPillar | 'all',
      type: type as RagDocumentType | 'all',
      sessionSeed,
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
