import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { hasPrototypePollution } from '@/lib/etl/types';
import { detectComprehensivePromptInjection } from '@/lib/rag/safety-guard';
import { recordSecurityAuditEvent } from '@/lib/rag/security-audit';
import { streamResearchAssistant } from '@/lib/rag/research-assistant';
import type { ContentPillar, Locale, RagDocumentType } from '@makaremi/shared';

const StreamRequestSchema = z.object({
  query: z.string().min(1).max(1000),
  locale: z.enum(['fa', 'fr', 'en']).default('fa'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(2000),
      })
    )
    .max(8)
    .optional(),
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
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 30 }, 'rag_assistant_stream');
  if (!rl.allowed) return rl.response!;

  const rawText = await request.text().catch(() => '');
  if (!rawText || hasPrototypePollution(rawText)) {
    return NextResponse.json({ error: 'Bad Request', message: 'Invalid or disallowed payload' }, { status: 400 });
  }

  let bodyJson: unknown;
  try {
    bodyJson = JSON.parse(rawText);
  } catch {
    return NextResponse.json({ error: 'Bad Request', message: 'Invalid JSON payload' }, { status: 400 });
  }
  if (hasPrototypePollution(bodyJson)) {
    return NextResponse.json({ error: 'Bad Request', message: 'Prototype pollution rejected' }, { status: 400 });
  }

  const parsed = StreamRequestSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'Invalid stream RAG schema', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { query, locale, history, pillar, type } = parsed.data;
  const injection = detectComprehensivePromptInjection(query, history);
  if (injection.isInjection) {
    void recordSecurityAuditEvent({
      eventType: 'prompt_injection_blocked',
      severity: 'high',
      route: '/api/rag/stream',
      detail: `Blocked stream (${injection.source || 'query'}:${injection.pattern || 'pattern'})`,
    });
    return NextResponse.json(
      { error: 'Bad Request', message: 'Prompt injection rejected', pattern: injection.pattern },
      { status: 400 }
    );
  }

  const sessionSeed = request.headers.get('user-agent') || 'web-stream-researcher';
  const encoder = new TextEncoder();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      const sendSse = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        for await (const pkt of streamResearchAssistant({
          query,
          locale: locale as Locale,
          history,
          pillar: pillar as ContentPillar | 'all',
          type: type as RagDocumentType | 'all',
          sessionSeed,
        })) {
          sendSse(pkt.event, pkt.data);
        }
      } catch (err) {
        sendSse('error', {
          message: err instanceof Error ? err.message : 'Streaming failed',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-RateLimit-Limit': '30',
      'X-RateLimit-Remaining': String(rl.remaining),
    },
  });
}
