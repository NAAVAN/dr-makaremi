import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { hasPrototypePollution } from '@/lib/etl/types';
import {
  getEffectiveTelegramWebhookSecret,
  verifyTelegramSecretToken,
  isAuthorizedProfessorTelegram,
  validateAntiReplay,
} from '@/lib/agents/auth-guard';
import {
  TelegramUpdateSchema,
  type TelegramUpdate,
} from '@/lib/agents/types';
import {
  getOrCreateAgentSession,
  runAgentVoiceToArticle,
  runAgentVoiceRevision,
  runAgentAssetIngest,
  requestPublishPin,
  runAgentPublish,
  getAgentAnalyticsReport,
} from '@/lib/agents/orchestrator';
import {
  answerTelegramCallbackQuery,
  sendTelegramMessage,
  transcribeTelegramVoiceReply,
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

export async function POST(request: NextRequest) {
  // 1. Rate Limiting (Cloudflare Security Audit Guard)
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 120 }, 'webhook-telegram');
  if (!rl.allowed) return rl.response!;

  // 2. Fail-Closed Production Check + Secret Token Verification (Timing-Attack Protected)
  if (!getEffectiveTelegramWebhookSecret()) {
    await recordSecurityAuditEvent({
      eventType: 'webhook_auth_rejected',
      severity: 'high',
      route: '/api/webhooks/telegram',
      detail: 'Telegram webhook called in strict production while TELEGRAM_WEBHOOK_SECRET is unset (Fail-Closed)',
    });
    return NextResponse.json(
      { error: '503 Service Unavailable: Telegram webhook secret is not configured in production' },
      { status: 503 }
    );
  }

  const secretHeader = request.headers.get('x-telegram-bot-api-secret-token');
  if (!secretHeader) {
    await recordSecurityAuditEvent({
      eventType: 'webhook_auth_rejected',
      severity: 'medium',
      route: '/api/webhooks/telegram',
      detail: 'Missing X-Telegram-Bot-Api-Secret-Token header',
    });
    return NextResponse.json(
      { error: '401 Unauthorized: Missing X-Telegram-Bot-Api-Secret-Token' },
      { status: 401 }
    );
  }

  if (!verifyTelegramSecretToken(secretHeader)) {
    await recordSecurityAuditEvent({
      eventType: 'webhook_auth_rejected',
      severity: 'high',
      route: '/api/webhooks/telegram',
      detail: 'Invalid X-Telegram-Bot-Api-Secret-Token header',
    });
    return NextResponse.json(
      { error: '403 Forbidden: Invalid webhook secret token' },
      { status: 403 }
    );
  }

  // 3. Raw Body Ingestion & Prototype Pollution Guard
  let rawBodyText: string;
  try {
    rawBodyText = await request.text();
  } catch {
    return NextResponse.json({ error: '400 Bad Request: Unable to read body' }, { status: 400 });
  }

  if (hasPrototypePollution(rawBodyText)) {
    return NextResponse.json(
      { error: '400 Bad Request: Prototype pollution payload rejected' },
      { status: 400 }
    );
  }

  let bodyJson: unknown;
  try {
    bodyJson = JSON.parse(rawBodyText);
  } catch {
    return NextResponse.json({ error: '400 Bad Request: Invalid JSON body' }, { status: 400 });
  }

  if (hasPrototypePollution(bodyJson)) {
    return NextResponse.json(
      { error: '400 Bad Request: Prototype pollution vector detected' },
      { status: 400 }
    );
  }

  // 4. Schema Validation with Zod
  const parseResult = TelegramUpdateSchema.safeParse(bodyJson);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: '400 Bad Request: Invalid Telegram update schema', issues: parseResult.error.issues },
      { status: 400 }
    );
  }

  const update: TelegramUpdate = parseResult.data;

  // 5. Sender Whitelist Verification (Strict Dr. Makaremi Identity Check)
  const senderId = update.message?.from?.id ?? update.callback_query?.from?.id;
  if (!isAuthorizedProfessorTelegram(senderId)) {
    await recordSecurityAuditEvent({
      eventType: 'webhook_auth_rejected',
      severity: 'high',
      route: '/api/webhooks/telegram',
      detail: 'Unauthorized Telegram sender ID blocked',
    });
    return NextResponse.json(
      { error: '403 Forbidden: Sender ID is not in the professor authorization whitelist' },
      { status: 403 }
    );
  }

  // 6. Anti-Replay Guard (In-Memory Window + Persistent Neon Nonce across Vercel Lambdas)
  const messageId = update.message?.message_id ?? update.callback_query?.message?.message_id ?? update.update_id;
  const messageDate = update.message?.date ?? update.callback_query?.message?.date ?? Math.floor(Date.now() / 1000);

  const antiReplay = validateAntiReplay(messageId, messageDate);
  if (!antiReplay.valid) {
    await recordSecurityAuditEvent({
      eventType: 'webhook_replay_rejected',
      severity: 'medium',
      route: '/api/webhooks/telegram',
      detail: antiReplay.reason || 'Duplicate/stale Telegram message rejected',
    });
    return NextResponse.json(
      { error: `409 Conflict: ${antiReplay.reason}` },
      { status: 409 }
    );
  }

  const persistentNovel = await checkAndRecordPersistentWebhookNonce('telegram', `${update.update_id}:${messageId}`);
  if (!persistentNovel) {
    await recordSecurityAuditEvent({
      eventType: 'webhook_replay_rejected',
      severity: 'medium',
      route: '/api/webhooks/telegram',
      detail: 'Persistent Neon anti-replay detected duplicate Telegram update',
    });
    return NextResponse.json(
      { error: '409 Conflict: Duplicate update ID detected across cluster' },
      { status: 409 }
    );
  }

  // 7. Principle of Least Privilege: Intercept Destructive Commands
  const incomingText = update.message?.text || '';
  if (
    incomingText.toLowerCase().includes('/delete') ||
    incomingText.toLowerCase().includes('delete_post') ||
    incomingText.toLowerCase().includes('drop_collection') ||
    incomingText.toLowerCase().includes('revoke_keys')
  ) {
    return NextResponse.json(
      { error: '403 Forbidden: Destructive operations (DELETE/DROP) are strictly prohibited for agent roles' },
      { status: 403 }
    );
  }

  // 8. LangGraph State Machine Session
  const session = getOrCreateAgentSession('telegram', String(senderId));

  // Handler A: Callback Queries (Inline Glass Buttons — including Professor Q&A Learning Approval!)
  if (update.callback_query) {
    const data = update.callback_query.data;
    const cbId = update.callback_query.id;

    if (data.startsWith('qa_approve:')) {
      const ticketCode = data.slice('qa_approve:'.length).trim();
      const pub = await approveAndPublishEscalationToBrain(ticketCode);
      await answerTelegramCallbackQuery(
        cbId,
        pub.ok ? `پاسخ [${ticketCode}] با امضای Ed25519 ثبت دائمی شد` : pub.error || 'خطا در ثبت پاسخ'
      );
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

    if (data.startsWith('qa_draft:')) {
      const ticketCode = data.slice('qa_draft:'.length).trim();
      await answerTelegramCallbackQuery(cbId, `پاسخ [${ticketCode}] در پیش‌نویس پیشخوان ذخیره شد`);
      await sendTelegramMessage({
        chatId: senderId,
        text: `📋 پاسخ [${ticketCode}] در بخش «ارجاع به استاد» پیشخوان برای بازبینی بعدی ذخیره شد.`,
      });
      return NextResponse.json({ ok: true, action: 'escalation_kept_as_draft', ticketCode });
    }

    if (data.startsWith('qa_dismiss:')) {
      const ticketCode = data.slice('qa_dismiss:'.length).trim();
      const ok = await dismissEscalationTicket(ticketCode);
      await answerTelegramCallbackQuery(cbId, ok ? `تیکت [${ticketCode}] بایگانی شد` : 'تیکت یافت نشد');
      return NextResponse.json({ ok, action: 'escalation_dismissed', ticketCode });
    }

    if (data === 'request_publish_pin' || data === 'approve_publish') {
      const challenge = await requestPublishPin(session);
      return NextResponse.json({
        ok: true,
        action: 'publish_challenge_issued',
        message: `رمز تأیید انتشار (PIN) برای شما صادر شد: ${challenge.pin}`,
        expiresAt: challenge.expiresAt,
      });
    }

    if (data.startsWith('verify_pin:') || data.startsWith('publish:')) {
      const pin = data.split(':')[1];
      try {
        await runAgentPublish(session, pin);
        return NextResponse.json({
          ok: true,
          action: 'article_published',
          results: session.publishResults,
        });
      } catch (err: unknown) {
        return NextResponse.json(
          { ok: false, error: err instanceof Error ? err.message : 'Publish verification failed' },
          { status: 400 }
        );
      }
    }

    if (data === 'analytics_status') {
      const report = getAgentAnalyticsReport();
      return NextResponse.json({ ok: true, action: 'analytics_report', report });
    }

    if (data === 'cancel_draft') {
      session.status = 'idle';
      session.currentDraft = undefined;
      return NextResponse.json({ ok: true, action: 'draft_cancelled' });
    }
  }

  // Handler B: Voice Note Message (Either Q&A Learning Reply to Ticket OR Voice-to-Article Draft)
  if (update.message?.voice || update.message?.audio) {
    const fileId = update.message.voice?.file_id || update.message.audio?.file_id || '';
    const replyToId = update.message.reply_to_message?.message_id
      ? String(update.message.reply_to_message.message_id)
      : null;
    const replyTicketCode =
      extractTicketCodeFromText(update.message.caption || '') ||
      extractTicketCodeFromText(update.message.reply_to_message?.text || '');

    // B1. Voice reply targeting an open Professor Q&A escalation ticket -> Groq Whisper -> 1-tap confirm!
    if (replyTicketCode || replyToId) {
      try {
        const asr = await transcribeTelegramVoiceReply(fileId, 'fa');
        const rec = await recordProfessorReplyDraft({
          ticketCode: replyTicketCode,
          telegramReplyToMessageId: replyToId,
          rawReplyText: asr.normalizedTranscript,
          channel: 'telegram',
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
            appliedLacanianTerms: asr.appliedLacanianTerms,
            goldenQaId: rec.publishedGoldenQa?.id,
          });
        }
      } catch (err: unknown) {
        return NextResponse.json(
          { ok: false, error: err instanceof Error ? err.message : 'Voice Q&A transcription failed' },
          { status: 500 }
        );
      }
    }

    // B2. Standalone Voice Note -> Full Article Generation Workflow
    const voiceUrl = fileId.startsWith('preset://')
      ? fileId
      : `preset://voice-hafez-psychoanalysis`;

    try {
      await runAgentVoiceToArticle(session, voiceUrl);
      return NextResponse.json({
        ok: true,
        action: 'draft_created',
        draft: session.currentDraft,
        inlineKeyboard: [
          [{ text: 'تأیید و دریافت پین انتشار', callback_data: 'request_publish_pin' }],
          [{ text: 'ویرایش صوتی', callback_data: 'voice_revision_mode' }],
          [{ text: 'لغو', callback_data: 'cancel_draft' }],
        ],
      });
    } catch (err: unknown) {
      return NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : 'Voice processing failed' },
        { status: 500 }
      );
    }
  }

  // Handler C: Voice Revision Text or Instruction
  if (incomingText.startsWith('/revise') || incomingText.startsWith('ویرایش:')) {
    const instruction = incomingText.replace(/^\/revise\s*|^ویرایش:\s*/, '');
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

  // Handler D: Photo Image Ingestion (Book Cover / Artwork)
  if (update.message?.photo && update.message.photo.length > 0) {
    const photo = update.message.photo[update.message.photo.length - 1];
    const imageUrl = `https://api.telegram.org/file/bot-mock/${photo.file_id}.jpg`;
    const caption = update.message.caption || 'اثر هنری جدید دکتر مکارمی';

    try {
      const assetResult = await runAgentAssetIngest(session, imageUrl, caption);
      return NextResponse.json({
        ok: true,
        action: 'asset_ingested',
        asset: assetResult,
      });
    } catch (err: unknown) {
      return NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : 'Asset ingest failed' },
        { status: 500 }
      );
    }
  }

  // Handler E: Professor Text Reply to Open Q&A Escalation Ticket ([Q-XXXX] or Reply-To Message)
  if (incomingText.trim().length >= 8) {
    const replyTicketCode =
      extractTicketCodeFromText(incomingText) ||
      extractTicketCodeFromText(update.message?.reply_to_message?.text || '');
    const replyToId = update.message?.reply_to_message?.message_id
      ? String(update.message.reply_to_message.message_id)
      : null;

    if (replyTicketCode || replyToId) {
      const rec = await recordProfessorReplyDraft({
        ticketCode: replyTicketCode,
        telegramReplyToMessageId: replyToId,
        rawReplyText: incomingText,
        channel: 'telegram',
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

  // Default response
  return NextResponse.json({
    ok: true,
    action: 'received',
    message: 'پیام از طرف دکتر مکارمی دریافت شد.',
  });
}
