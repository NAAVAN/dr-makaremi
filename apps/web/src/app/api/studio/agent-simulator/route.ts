import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isStudioRequestAuthorized } from '@/lib/studio/auth';
import {
  getAgentAnalyticsReport,
  getOrCreateAgentSession,
  requestPublishPin,
  runAgentAssetIngest,
  runAgentPublish,
  runAgentVoiceRevision,
  runAgentVoiceToArticle,
} from '@/lib/agents/orchestrator';

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

const SimulatorRequestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('voice_preset'),
    channel: z.enum(['telegram', 'whatsapp']).default('telegram'),
    presetUrl: z.string().startsWith('preset://').max(120),
  }),
  z.object({
    action: z.literal('revise'),
    channel: z.enum(['telegram', 'whatsapp']).default('telegram'),
    instruction: z.string().min(2).max(2000),
  }),
  z.object({
    action: z.literal('request_publish_pin'),
    channel: z.enum(['telegram', 'whatsapp']).default('telegram'),
  }),
  z.object({
    action: z.literal('verify_publish_pin'),
    channel: z.enum(['telegram', 'whatsapp']).default('telegram'),
    pin: z.string().min(4).max(16),
  }),
  z.object({
    action: z.literal('ingest_asset'),
    imageUrl: z.string().url().max(600),
    caption: z.string().min(1).max(600),
  }),
  z.object({
    action: z.literal('analytics'),
  }),
]);

/**
 * Authenticated server-side proxy for the Agent Console Simulators.
 * Eliminates SEC-01 completely: ZERO webhook secrets or professor IDs ever ship in client JS bundles.
 */
export async function POST(request: NextRequest) {
  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: 'برای اجرای شبیه‌ساز، لطفاً ابتدا وارد پیشخوان استاد شوید.' },
      { status: 401, headers: HEADERS }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400, headers: HEADERS });
  }

  const parsed = SimulatorRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid simulator action', issues: parsed.error.issues },
      { status: 400, headers: HEADERS }
    );
  }

  const data = parsed.data;

  try {
    if (data.action === 'analytics') {
      return NextResponse.json(
        { ok: true, action: 'analytics_report', report: getAgentAnalyticsReport() },
        { status: 200, headers: HEADERS }
      );
    }

    if (data.action === 'ingest_asset') {
      const session = getOrCreateAgentSession('console', 'studio-simulator');
      const asset = await runAgentAssetIngest(session, data.imageUrl, data.caption);
      return NextResponse.json(
        { ok: true, action: 'asset_ingested', asset },
        { status: 200, headers: HEADERS }
      );
    }

    const session = getOrCreateAgentSession(data.channel, 'studio-simulator');

    if (data.action === 'voice_preset') {
      await runAgentVoiceToArticle(session, data.presetUrl);
      return NextResponse.json(
        { ok: true, action: 'draft_created', draft: session.currentDraft },
        { status: 200, headers: HEADERS }
      );
    }

    if (data.action === 'revise') {
      await runAgentVoiceRevision(session, data.instruction);
      return NextResponse.json(
        { ok: true, action: 'draft_revised', draft: session.currentDraft },
        { status: 200, headers: HEADERS }
      );
    }

    if (data.action === 'request_publish_pin') {
      const challenge = await requestPublishPin(session);
      return NextResponse.json(
        {
          ok: true,
          action: 'publish_challenge_issued',
          pin: challenge.pin,
          message: `رمز تأیید انتشار (PIN) برای شما صادر شد: ${challenge.pin}`,
          expiresAt: challenge.expiresAt,
        },
        { status: 200, headers: HEADERS }
      );
    }

    if (data.action === 'verify_publish_pin') {
      await runAgentPublish(session, data.pin);
      return NextResponse.json(
        { ok: true, action: 'article_published', results: session.publishResults },
        { status: 200, headers: HEADERS }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Simulator execution failed' },
      { status: 400, headers: HEADERS }
    );
  }

  return NextResponse.json({ ok: false, error: 'Unsupported action' }, { status: 400, headers: HEADERS });
}
