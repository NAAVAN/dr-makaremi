import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { hasPrototypePollution } from '@/lib/etl/types';
import {
  getEffectiveWhatsAppAppSecret,
  getEffectiveWhatsAppVerifyToken,
  verifyWhatsAppSignature,
  isAuthorizedProfessorWhatsApp,
} from '@/lib/agents/auth-guard';
import {
  WhatsAppWebhookPayloadSchema,
  type WhatsAppWebhookPayload,
} from '@/lib/agents/types';
import {
  getOrCreateAgentSession,
  runAgentVoiceToArticle,
  runAgentVoiceRevision,
  runAgentPublish,
  requestPublishPin,
} from '@/lib/agents/orchestrator';
import {
  sendWhatsAppMessage,
  transcribeWhatsAppVoiceReply,
} from '@/lib/agents/messenger-client';
import {
  approveAndPublishEscalationToBrain,
  dismissEscalationTicket,
  extractTicketCodeFromText,
  recordProfessorReplyDraft,
} from '@/lib/rag/professor-escalation';
import {
  checkAndRecordPersistentWebhookNonce,
  recordSecurityAuditEvent,
} from '@/lib/rag/security-audit';

/**
 * Meta / WhatsApp Webhook Subscription Challenge Verification (Fail-Closed in Production)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  const expectedToken = getEffectiveWhatsAppVerifyToken();

  if (mode === 'subscribe' && expectedToken && token === expectedToken) {
    return new NextResponse(challenge || '', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  return new NextResponse('403 Forbidden: Verification token mismatch', { status: 403 });
}

/**
 * WhatsApp Business API Inbound Message Handler
 */
export async function POST(request: NextRequest) {
  // 1. Rate Limiting
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 120 }, 'webhook-whatsapp');
  if (!rl.allowed) return rl.response!;

  // 1b. Fail-Closed in Production when WHATSAPP_APP_SECRET is unset
  if (!getEffectiveWhatsAppAppSecret()) {
    await recordSecurityAuditEvent({
      eventType: 'webhook_auth_rejected',
      severity: 'high',
      route: '/api/webhooks/whatsapp',
      detail: 'WhatsApp webhook called in strict production while WHATSAPP_APP_SECRET is unset (Fail-Closed)',
    });
    return NextResponse.json(
      { error: '503 Service Unavailable: WhatsApp app secret is not configured in production' },
      { status: 503 }
    );
  }

  // 2. Read Raw Text for HMAC Verification & Prototype Pollution Guard
  let rawBodyText: string;
  try {
    rawBodyText = await request.text();
  } catch {
    return NextResponse.json({ error: '400 Bad Request: Unable to read body' }, { status: 400 });
  }

  // 3. HMAC-SHA256 Signature Verification (`X-Hub-Signature-256`)
  const signatureHeader = request.headers.get('x-hub-signature-256');
  if (!signatureHeader || !verifyWhatsAppSignature(rawBodyText, signatureHeader)) {
    await recordSecurityAuditEvent({
      eventType: 'webhook_auth_rejected',
      severity: 'high',
      route: '/api/webhooks/whatsapp',
      detail: 'Invalid or missing X-Hub-Signature-256 on WhatsApp webhook',
    });
    return NextResponse.json(
      { error: '403 Forbidden: Invalid X-Hub-Signature-256' },
      { status: 403 }
    );
  }

  // 4. Prototype Pollution Guard
  if (hasPrototypePollution(rawBodyText)) {
    return NextResponse.json(
      { error: '400 Bad Request: Prototype pollution vector rejected' },
      { status: 400 }
    );
  }

  let bodyJson: unknown;
  try {
    bodyJson = JSON.parse(rawBodyText);
  } catch {
    return NextResponse.json({ error: '400 Bad Request: Malformed JSON' }, { status: 400 });
  }

  if (hasPrototypePollution(bodyJson)) {
    return NextResponse.json(
      { error: '400 Bad Request: Prototype pollution detected in JSON' },
      { status: 400 }
    );
  }

  // 5. Schema Validation
  const parseResult = WhatsAppWebhookPayloadSchema.safeParse(bodyJson);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: '400 Bad Request: Invalid WhatsApp payload', issues: parseResult.error.issues },
      { status: 400 }
    );
  }

  const payload: WhatsAppWebhookPayload = parseResult.data;
  const entry = payload.entry[0];
  const change = entry?.changes[0]?.value;
  const message = change?.messages?.[0];

  if (!message) {
    return NextResponse.json({ ok: true, status: 'no_message_in_payload' });
  }

  // 6. Whitelist Check for Dr. Makaremi's Phone Number
  const senderPhone = message.from;
  if (!isAuthorizedProfessorWhatsApp(senderPhone)) {
    await recordSecurityAuditEvent({
      eventType: 'webhook_auth_rejected',
      severity: 'high',
      route: '/api/webhooks/whatsapp',
      detail: 'Unauthorized WhatsApp sender blocked',
    });
    return NextResponse.json(
      { error: '403 Forbidden: Sender phone is not authorized' },
      { status: 403 }
    );
  }

  // 6b. Persistent Cluster Anti-Replay Check
  const novel = await checkAndRecordPersistentWebhookNonce('whatsapp', message.id);
  if (!novel) {
    await recordSecurityAuditEvent({
      eventType: 'webhook_replay_rejected',
      severity: 'medium',
      route: '/api/webhooks/whatsapp',
      detail: 'Duplicate WhatsApp message ID detected',
    });
    return NextResponse.json({ ok: true, status: 'duplicate_ignored' });
  }

  // 7. Check for Destructive Commands
  const textBody = message.text?.body || '';
  if (
    textBody.toLowerCase().includes('delete') ||
    textBody.toLowerCase().includes('drop_collection') ||
    textBody.toLowerCase().includes('revoke')
  ) {
    return NextResponse.json(
      { error: '403 Forbidden: Destructive operations are strictly prohibited for agent roles' },
      { status: 403 }
    );
  }

  const session = getOrCreateAgentSession('whatsapp', senderPhone);
  const contextMessageId = message.context?.id || null;

  // Interactive Button Click (Including Professor Q&A 1-Tap Confirm/Dismiss!)
  if (message.interactive?.button_reply) {
    const btnId = message.interactive.button_reply.id;

    if (btnId.startsWith('qa_approve:')) {
      const ticketCode = btnId.slice('qa_approve:'.length).trim();
      const pub = await approveAndPublishEscalationToBrain(ticketCode);
      return NextResponse.json(
        {
          ok: pub.ok,
          action: 'escalation_published',
          ticketCode,
          goldenQaId: pub.goldenQa?.id,
          error: pub.error,
        },
        { status: pub.ok ? 200 : 400 }
      );
    }

    if (btnId.startsWith('qa_draft:')) {
      const ticketCode = btnId.slice('qa_draft:'.length).trim();
      await sendWhatsAppMessage({
        to: senderPhone,
        text: `📋 پاسخ [${ticketCode}] در بخش «ارجاع به استاد» پیشخوان ذخیره شد.`,
      });
      return NextResponse.json({ ok: true, action: 'escalation_kept_as_draft', ticketCode });
    }

    if (btnId.startsWith('qa_dismiss:')) {
      const ticketCode = btnId.slice('qa_dismiss:'.length).trim();
      const ok = await dismissEscalationTicket(ticketCode);
      return NextResponse.json({ ok, action: 'escalation_dismissed', ticketCode });
    }

    if (btnId === 'request_pin') {
      const challenge = await requestPublishPin(session);
      return NextResponse.json({
        ok: true,
        action: 'pin_issued',
        pin: challenge.pin,
      });
    }
    if (btnId.startsWith('publish:')) {
      const pin = btnId.split(':')[1];
      try {
        await runAgentPublish(session, pin);
        return NextResponse.json({
          ok: true,
          action: 'published',
          results: session.publishResults,
        });
      } catch (err: unknown) {
        return NextResponse.json(
          { ok: false, error: err instanceof Error ? err.message : 'Publish failed' },
          { status: 400 }
        );
      }
    }
  }

  // Audio / Voice Message (Q&A Reply via Context OR Voice-to-Article)
  if (message.type === 'audio' || message.audio) {
    if (contextMessageId) {
      try {
        const asr = await transcribeWhatsAppVoiceReply(message.audio?.id || 'preset://voice-bordering-theory', 'fa');
        const rec = await recordProfessorReplyDraft({
          whatsappContextMessageId: contextMessageId,
          rawReplyText: asr.normalizedTranscript,
          channel: 'whatsapp',
          isVoice: true,
        });
        if (rec.ok) {
          return NextResponse.json({
            ok: true,
            action: rec.awaitingConfirmation
              ? 'escalation_voice_reply_awaiting_confirm'
              : 'escalation_published',
            ticketCode: rec.ticket?.ticketCode,
            normalizedReply: rec.ticket?.professorReplyNormalized,
            goldenQaId: rec.publishedGoldenQa?.id,
          });
        }
      } catch (err: unknown) {
        return NextResponse.json(
          { ok: false, error: err instanceof Error ? err.message : 'WhatsApp voice Q&A processing failed' },
          { status: 500 }
        );
      }
    }

    try {
      await runAgentVoiceToArticle(session, 'preset://voice-bordering-theory');
      return NextResponse.json({
        ok: true,
        action: 'draft_created',
        draft: session.currentDraft,
      });
    } catch (err: unknown) {
      return NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : 'Processing failed' },
        { status: 500 }
      );
    }
  }

  // Revision Text
  if (textBody.startsWith('/revise') || textBody.startsWith('ویرایش:')) {
    const instruction = textBody.replace(/^\/revise\s*|^ویرایش:\s*/, '');
    try {
      await runAgentVoiceRevision(session, instruction);
      return NextResponse.json({
        ok: true,
        action: 'draft_revised',
        draft: session.currentDraft,
      });
    } catch (err: unknown) {
      return NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : 'Revision failed' },
        { status: 400 }
      );
    }
  }

  // Professor Text Reply to Open Q&A Escalation Ticket ([Q-XXXX] or Quoted Context Reply)
  if (textBody.trim().length >= 8) {
    const ticketCode = extractTicketCodeFromText(textBody);
    if (ticketCode || contextMessageId) {
      const rec = await recordProfessorReplyDraft({
        ticketCode,
        whatsappContextMessageId: contextMessageId,
        rawReplyText: textBody,
        channel: 'whatsapp',
        isVoice: false,
      });
      if (rec.ok) {
        return NextResponse.json({
          ok: true,
          action: rec.awaitingConfirmation
            ? 'escalation_reply_awaiting_confirm'
            : 'escalation_published',
          ticketCode: rec.ticket?.ticketCode,
          normalizedReply: rec.ticket?.professorReplyNormalized,
          goldenQaId: rec.publishedGoldenQa?.id,
        });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    action: 'received',
    message: 'واتس‌اپ: پیام دریافت شد.',
  });
}
