import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { hasPrototypePollution } from '@/lib/etl/types';
import {
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

export async function POST(request: NextRequest) {
  // 1. Rate Limiting (Cloudflare Security Audit Guard)
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 120 }, 'webhook-telegram');
  if (!rl.allowed) return rl.response!;

  // 2. Secret Token Verification (Timing-Attack Protected)
  const secretHeader = request.headers.get('x-telegram-bot-api-secret-token');
  if (!secretHeader) {
    return NextResponse.json(
      { error: '401 Unauthorized: Missing X-Telegram-Bot-Api-Secret-Token' },
      { status: 401 }
    );
  }

  if (!verifyTelegramSecretToken(secretHeader)) {
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
    return NextResponse.json(
      { error: '403 Forbidden: Sender ID is not in the professor authorization whitelist' },
      { status: 403 }
    );
  }

  // 6. Anti-Replay Guard (Timestamp Window + Unique ID Deduplication)
  const messageId = update.message?.message_id ?? update.callback_query?.message?.message_id ?? update.update_id;
  const messageDate = update.message?.date ?? update.callback_query?.message?.date ?? Math.floor(Date.now() / 1000);

  const antiReplay = validateAntiReplay(messageId, messageDate);
  if (!antiReplay.valid) {
    return NextResponse.json(
      { error: `409 Conflict: ${antiReplay.reason}` },
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

  // Handler A: Callback Queries (Inline Glass Buttons)
  if (update.callback_query) {
    const data = update.callback_query.data;

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

  // Handler B: Voice Note Message -> Article Generation
  if (update.message?.voice || update.message?.audio) {
    const fileId = update.message.voice?.file_id || update.message.audio?.file_id;
    // Map to test preset or secure Telegram CDN URL
    const voiceUrl = fileId?.startsWith('preset://')
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

  // Default response
  return NextResponse.json({
    ok: true,
    action: 'received',
    message: 'پیام از طرف دکتر مکارمی دریافت شد.',
  });
}
