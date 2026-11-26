import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isStudioRequestAuthorized } from '@/lib/studio/auth';
import {
  approveAndPublishEscalationToBrain,
  dismissEscalationTicket,
  dispatchPendingEscalationDigest,
  enqueueAndDispatchProfessorEscalation,
  getEscalationSettings,
  listProfessorEscalations,
  recordProfessorReplyDraft,
  updateEscalationSettings,
} from '@/lib/rag/professor-escalation';
import {
  getMessengerChannelStatus,
  sendTelegramMessage,
  sendWhatsAppMessage,
} from '@/lib/agents/messenger-client';

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

const ActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('update_settings'),
    enabled: z.boolean().optional(),
    dispatchMode: z.enum(['instant', 'daily_digest']).optional(),
    dailyCap: z.number().int().min(1).max(50).optional(),
    requireOneTapConfirmForText: z.boolean().optional(),
    requireOneTapConfirmForVoice: z.boolean().optional(),
    enableTelegram: z.boolean().optional(),
    enableWhatsApp: z.boolean().optional(),
  }),
  z.object({
    action: z.literal('create_manual'),
    questionText: z.string().min(4).max(1000),
    locale: z.enum(['fa', 'fr', 'en']).default('fa'),
    pillar: z
      .enum(['psychoanalysis', 'art_calligraphy', 'cultural_strategy', 'human_rights_dadkhahi'])
      .default('psychoanalysis'),
    forceSend: z.boolean().optional(),
  }),
  z.object({
    action: z.literal('reply_and_publish'),
    ticketCode: z.string().min(4).max(20),
    answerMarkdown: z.string().min(8).max(8000),
  }),
  z.object({
    action: z.literal('approve'),
    ticketCode: z.string().min(4).max(20),
    answerMarkdown: z.string().max(8000).optional(),
  }),
  z.object({
    action: z.literal('dismiss'),
    ticketCode: z.string().min(4).max(20),
  }),
  z.object({
    action: z.literal('dispatch_digest'),
  }),
  z.object({
    action: z.literal('test_ping'),
    channel: z.enum(['telegram', 'whatsapp', 'both']).default('both'),
  }),
]);

export async function GET(request: NextRequest) {
  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers: HEADERS });
  }
  const [settings, escalations] = await Promise.all([
    getEscalationSettings(),
    listProfessorEscalations(60),
  ]);
  const channelStatus = getMessengerChannelStatus();

  return NextResponse.json(
    {
      ok: true,
      settings,
      channelStatus,
      escalations,
    },
    { status: 200, headers: HEADERS }
  );
}

export async function POST(request: NextRequest) {
  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers: HEADERS });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400, headers: HEADERS });
  }

  const parsed = ActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid escalation action payload', issues: parsed.error.issues },
      { status: 400, headers: HEADERS }
    );
  }

  const data = parsed.data;

  if (data.action === 'update_settings') {
    const updated = await updateEscalationSettings({
      enabled: data.enabled,
      dispatchMode: data.dispatchMode,
      dailyCap: data.dailyCap,
      requireOneTapConfirmForText: data.requireOneTapConfirmForText,
      requireOneTapConfirmForVoice: data.requireOneTapConfirmForVoice,
      enableTelegram: data.enableTelegram,
      enableWhatsApp: data.enableWhatsApp,
    });
    return NextResponse.json({ ok: true, settings: updated }, { status: 200, headers: HEADERS });
  }

  if (data.action === 'create_manual') {
    const res = await enqueueAndDispatchProfessorEscalation({
      questionText: data.questionText,
      locale: data.locale,
      pillar: data.pillar,
      forceSend: data.forceSend ?? true,
    });
    return NextResponse.json({ ok: true, ...res }, { status: 201, headers: HEADERS });
  }

  if (data.action === 'reply_and_publish') {
    const res = await recordProfessorReplyDraft({
      ticketCode: data.ticketCode,
      rawReplyText: data.answerMarkdown,
      channel: 'pishkhan',
    });
    return NextResponse.json(res, { status: res.ok ? 200 : 400, headers: HEADERS });
  }

  if (data.action === 'approve') {
    const res = await approveAndPublishEscalationToBrain(data.ticketCode, data.answerMarkdown);
    return NextResponse.json(res, { status: res.ok ? 200 : 400, headers: HEADERS });
  }

  if (data.action === 'dismiss') {
    const ok = await dismissEscalationTicket(data.ticketCode);
    return NextResponse.json({ ok, ticketCode: data.ticketCode }, { status: ok ? 200 : 404, headers: HEADERS });
  }

  if (data.action === 'dispatch_digest') {
    const res = await dispatchPendingEscalationDigest();
    return NextResponse.json({ ok: true, ...res }, { status: 200, headers: HEADERS });
  }

  if (data.action === 'test_ping') {
    const pingText =
      '🔔 پیام آزمایشی پیشخوان دستیار هوشمند دکتر مکارمی: اتصال کانال پاسخ‌گویی و یادگیری دائمی با موفقیت برقرار است.';
    const telegram =
      data.channel === 'telegram' || data.channel === 'both'
        ? await sendTelegramMessage({ text: pingText })
        : { sent: false, skippedReason: 'not_requested' };
    const whatsapp =
      data.channel === 'whatsapp' || data.channel === 'both'
        ? await sendWhatsAppMessage({ text: pingText })
        : { sent: false, skippedReason: 'not_requested' };
    return NextResponse.json({ ok: true, telegram, whatsapp }, { status: 200, headers: HEADERS });
  }

  return NextResponse.json({ ok: false, error: 'Unsupported action' }, { status: 400, headers: HEADERS });
}
