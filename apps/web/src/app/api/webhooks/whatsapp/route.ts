import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { hasPrototypePollution } from '@/lib/etl/types';
import {
  verifyWhatsAppSignature,
  isAuthorizedProfessorWhatsApp,
  WHATSAPP_VERIFY_TOKEN,
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

/**
 * Meta / WhatsApp Webhook Subscription Challenge Verification
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
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
    return NextResponse.json(
      { error: '403 Forbidden: Sender phone is not authorized' },
      { status: 403 }
    );
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

  // Audio / Voice Message
  if (message.type === 'audio' || message.audio) {
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

  // Interactive Button Click
  if (message.interactive?.button_reply) {
    const btnId = message.interactive.button_reply.id;
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

  return NextResponse.json({
    ok: true,
    action: 'received',
    message: 'واتس‌اپ: پیام دریافت شد.',
  });
}
