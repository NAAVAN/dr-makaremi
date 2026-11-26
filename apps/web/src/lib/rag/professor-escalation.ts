import crypto from 'node:crypto';
import type {
  AiEscalationSettings,
  AiGoldenQaItem,
  AiProfessorEscalation,
  ContentPillar,
  Locale,
} from '@makaremi/shared';
import { getNeonSql, isNeonDatabaseConfigured } from '@/lib/commerce/db';
import { readOverlayJson, writeOverlayJson } from '@/lib/vault-loader';
import { ensureRagTrainingSchema } from './db';
import { sanitizePiiFromQuery } from './safety-guard';
import { upsertGoldenQaItem } from './training-store';
import { syncEntityToRagKnowledgeBase } from './auto-indexer';
import { normalizePersianText } from '@/lib/etl/persian-normalizer';
import { applyLacanianGlossary } from '@/lib/agents/voice-transcriber';
import {
  getMessengerChannelStatus,
  sendTelegramMessage,
  sendWhatsAppMessage,
} from '@/lib/agents/messenger-client';

const ESCALATIONS_FILE = 'ai-professor-escalations.json';
const ESCALATION_SETTINGS_FILE = 'ai-escalation-settings.json';

function buildDefaultSettings(): AiEscalationSettings {
  const status = getMessengerChannelStatus();
  return {
    enabled: true,
    dispatchMode: 'instant',
    dailyCap: 5,
    requireOneTapConfirmForText: true,
    requireOneTapConfirmForVoice: true,
    minQueryLength: 12,
    enableTelegram: true,
    enableWhatsApp: true,
    telegramConfigured: status.telegramConfigured,
    whatsappConfigured: status.whatsappConfigured,
    updatedAt: new Date().toISOString(),
  };
}

function mapRowToEscalation(row: Record<string, unknown>): AiProfessorEscalation {
  return {
    id: String(row.id),
    ticketCode: String(row.ticket_code),
    queryHash: String(row.query_hash),
    questionText: String(row.question_text),
    locale: ((String(row.locale || 'fa') as Locale) || 'fa'),
    pillar: ((String(row.pillar || 'psychoanalysis') as ContentPillar) || 'psychoanalysis'),
    contextSummary: String(row.context_summary || ''),
    channelsSent: Array.isArray(row.channels_sent)
      ? (row.channels_sent as AiProfessorEscalation['channelsSent'])
      : [],
    telegramMessageId: row.telegram_message_id ? String(row.telegram_message_id) : null,
    whatsappMessageId: row.whatsapp_message_id ? String(row.whatsapp_message_id) : null,
    status: String(row.status) as AiProfessorEscalation['status'],
    professorReplyRaw: row.professor_reply_raw ? String(row.professor_reply_raw) : null,
    professorReplyNormalized: row.professor_reply_normalized
      ? String(row.professor_reply_normalized)
      : null,
    professorReplyChannel: row.professor_reply_channel
      ? (String(row.professor_reply_channel) as AiProfessorEscalation['professorReplyChannel'])
      : null,
    linkedGoldenQaId: row.linked_golden_qa_id ? String(row.linked_golden_qa_id) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    answeredAt: row.answered_at ? new Date(String(row.answered_at)).toISOString() : null,
    publishedAt: row.published_at ? new Date(String(row.published_at)).toISOString() : null,
  };
}

function computeQueryHash(question: string): string {
  const normalized = question
    .toLowerCase()
    .replace(/[\s\u200c.,،؟?!:؛()«»"'-]+/g, ' ')
    .trim();
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex').slice(0, 32);
}

function generateTicketCode(): string {
  const num = crypto.randomInt(1000, 9999);
  return `Q-${num}`;
}

export function extractTicketCodeFromText(text: string): string | null {
  const match = (text || '').match(/\b(Q-\d{4,6})\b/i);
  return match ? match[1].toUpperCase() : null;
}

// -----------------------------------------------------------------------------
// 1. Settings Persistence
// -----------------------------------------------------------------------------
export async function getEscalationSettings(): Promise<AiEscalationSettings> {
  const liveStatus = getMessengerChannelStatus();
  const base = buildDefaultSettings();

  if (isNeonDatabaseConfigured()) {
    try {
      await ensureRagTrainingSchema();
      const sql = getNeonSql();
      const rows = (await sql`
        SELECT settings_json, updated_at FROM ai_escalation_settings WHERE id = 1 LIMIT 1
      `) as Array<{ settings_json: Partial<AiEscalationSettings>; updated_at: string }>;
      if (rows?.[0]?.settings_json) {
        return {
          ...base,
          ...rows[0].settings_json,
          telegramConfigured: liveStatus.telegramConfigured,
          whatsappConfigured: liveStatus.whatsappConfigured,
          updatedAt: new Date(String(rows[0].updated_at)).toISOString(),
        };
      }
    } catch {
      // fall through to overlay
    }
  }

  const stored = readOverlayJson<Partial<AiEscalationSettings>>(ESCALATION_SETTINGS_FILE, {});
  return {
    ...base,
    ...stored,
    telegramConfigured: liveStatus.telegramConfigured,
    whatsappConfigured: liveStatus.whatsappConfigured,
  };
}

export async function updateEscalationSettings(
  patch: Partial<Omit<AiEscalationSettings, 'telegramConfigured' | 'whatsappConfigured' | 'updatedAt'>>
): Promise<AiEscalationSettings> {
  const current = await getEscalationSettings();
  const liveStatus = getMessengerChannelStatus();
  const next: AiEscalationSettings = {
    ...current,
    ...patch,
    dailyCap: Math.min(50, Math.max(1, Number(patch.dailyCap ?? current.dailyCap))),
    minQueryLength: Math.min(200, Math.max(6, Number(patch.minQueryLength ?? current.minQueryLength))),
    telegramConfigured: liveStatus.telegramConfigured,
    whatsappConfigured: liveStatus.whatsappConfigured,
    updatedAt: new Date().toISOString(),
  };

  if (isNeonDatabaseConfigured()) {
    try {
      await ensureRagTrainingSchema();
      const sql = getNeonSql();
      await sql`
        INSERT INTO ai_escalation_settings (id, settings_json, updated_at)
        VALUES (1, ${JSON.stringify(next)}::jsonb, NOW())
        ON CONFLICT (id) DO UPDATE SET
          settings_json = EXCLUDED.settings_json,
          updated_at = NOW()
      `;
    } catch {
      // ignore and persist locally
    }
  }

  writeOverlayJson(ESCALATION_SETTINGS_FILE, next);
  return next;
}

// -----------------------------------------------------------------------------
// 2. Ticket Listing & Lookup
// -----------------------------------------------------------------------------
export async function listProfessorEscalations(limit = 50): Promise<AiProfessorEscalation[]> {
  if (isNeonDatabaseConfigured()) {
    try {
      await ensureRagTrainingSchema();
      const sql = getNeonSql();
      const rows = (await sql`
        SELECT * FROM ai_professor_escalations ORDER BY created_at DESC LIMIT ${Math.min(100, Math.max(1, limit))}
      `) as Array<Record<string, unknown>>;
      return rows.map(mapRowToEscalation);
    } catch {
      // fallback below
    }
  }
  return readOverlayJson<AiProfessorEscalation[]>(ESCALATIONS_FILE, []).slice(0, limit);
}

async function saveLocalEscalation(item: AiProfessorEscalation): Promise<void> {
  const list = readOverlayJson<AiProfessorEscalation[]>(ESCALATIONS_FILE, []);
  const idx = list.findIndex((x) => x.id === item.id || x.ticketCode === item.ticketCode);
  if (idx >= 0) list[idx] = item;
  else list.unshift(item);
  writeOverlayJson(ESCALATIONS_FILE, list.slice(0, 200));
}

export async function findEscalationTicket(lookup: {
  ticketCode?: string | null;
  telegramMessageId?: string | null;
  whatsappMessageId?: string | null;
}): Promise<AiProfessorEscalation | null> {
  const code = lookup.ticketCode?.trim().toUpperCase();
  const tgId = lookup.telegramMessageId?.trim();
  const waId = lookup.whatsappMessageId?.trim();

  if (isNeonDatabaseConfigured()) {
    try {
      await ensureRagTrainingSchema();
      const sql = getNeonSql();
      if (code) {
        const rows = (await sql`SELECT * FROM ai_professor_escalations WHERE ticket_code = ${code} LIMIT 1`) as Array<
          Record<string, unknown>
        >;
        if (rows[0]) return mapRowToEscalation(rows[0]);
      }
      if (tgId) {
        const rows = (await sql`SELECT * FROM ai_professor_escalations WHERE telegram_message_id = ${tgId} LIMIT 1`) as Array<
          Record<string, unknown>
        >;
        if (rows[0]) return mapRowToEscalation(rows[0]);
      }
      if (waId) {
        const rows = (await sql`SELECT * FROM ai_professor_escalations WHERE whatsapp_message_id = ${waId} LIMIT 1`) as Array<
          Record<string, unknown>
        >;
        if (rows[0]) return mapRowToEscalation(rows[0]);
      }
      // Fallback: most recently sent or pending escalation awaiting Professor's reply
      const openRows = (await sql`
        SELECT * FROM ai_professor_escalations
        WHERE status IN ('sent', 'pending', 'answered_draft')
        ORDER BY created_at DESC
        LIMIT 1
      `) as Array<Record<string, unknown>>;
      if (openRows[0]) return mapRowToEscalation(openRows[0]);
      return null;
    } catch {
      // fall through to local overlay
    }
  }

  const list = readOverlayJson<AiProfessorEscalation[]>(ESCALATIONS_FILE, []);
  if (code) {
    const m = list.find((x) => x.ticketCode.toUpperCase() === code);
    if (m) return m;
  }
  if (tgId) {
    const m = list.find((x) => x.telegramMessageId === tgId);
    if (m) return m;
  }
  if (waId) {
    const m = list.find((x) => x.whatsappMessageId === waId);
    if (m) return m;
  }
  return list.find((x) => x.status === 'sent' || x.status === 'pending' || x.status === 'answered_draft') || null;
}

// -----------------------------------------------------------------------------
// 3. Enqueue & Outbound Dispatch to Professor (Telegram & WhatsApp)
// -----------------------------------------------------------------------------
function formatProfessorQuestionMessage(ticket: AiProfessorEscalation): string {
  return [
    `📩 پرسش جدید پژوهشگر برای استاد [${ticket.ticketCode}]`,
    `زبان: ${ticket.locale.toUpperCase()} | محور: ${ticket.pillar}`,
    '',
    `«${ticket.questionText}»`,
    '',
    ticket.contextSummary ? `یادداشت دستیار: ${ticket.contextSummary}` : '',
    '—',
    `برای آموزش دائمی دستیار هوشمند، کافی است روی همین پیام به صورت «متن» یا «ویس (پیام صوتی)» پاسخ دهید (یا کد ${ticket.ticketCode} را در ابتدای پاسخ بنویسید).`,
  ]
    .filter(Boolean)
    .join('\n');
}

export async function enqueueAndDispatchProfessorEscalation(input: {
  questionText: string;
  locale: Locale;
  pillar?: ContentPillar;
  contextSummary?: string;
  forceSend?: boolean;
}): Promise<{ created: boolean; deduplicated?: boolean; ticket?: AiProfessorEscalation; skippedReason?: string }> {
  const settings = await getEscalationSettings();
  if (!settings.enabled && !input.forceSend) {
    return { created: false, skippedReason: 'escalation_disabled' };
  }

  const sanitizedQuestion = sanitizePiiFromQuery(input.questionText);
  if (sanitizedQuestion.length < settings.minQueryLength && !input.forceSend) {
    return { created: false, skippedReason: 'query_too_short' };
  }

  const queryHash = computeQueryHash(sanitizedQuestion);
  const existing = await listProfessorEscalations(100);

  // Deduplicate within 7 days
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const dup = existing.find(
    (item) =>
      item.queryHash === queryHash &&
      new Date(item.createdAt).getTime() >= sevenDaysAgo &&
      item.status !== 'dismissed'
  );
  if (dup && !input.forceSend) {
    return { created: false, deduplicated: true, ticket: dup };
  }

  // Enforce daily outbound dispatch cap
  const startOfDayMs = Date.now() - 24 * 60 * 60 * 1000;
  const sentToday = existing.filter(
    (item) =>
      (item.channelsSent.includes('telegram') || item.channelsSent.includes('whatsapp')) &&
      new Date(item.createdAt).getTime() >= startOfDayMs
  ).length;

  const canSendNow =
    Boolean(input.forceSend) ||
    (settings.dispatchMode === 'instant' && sentToday < settings.dailyCap);

  const nowIso = new Date().toISOString();
  const ticket: AiProfessorEscalation = {
    id: `esc-${crypto.randomUUID().slice(0, 12)}`,
    ticketCode: generateTicketCode(),
    queryHash,
    questionText: sanitizedQuestion,
    locale: input.locale || 'fa',
    pillar: input.pillar || 'psychoanalysis',
    contextSummary:
      input.contextSummary ||
      'در آرشیو فعلی سند قطعی برای این پرسش یافت نشد؛ در صورت پاسخ شما، به‌صورت دائمی در مغز دستیار ثبت می‌شود.',
    channelsSent: ['pishkhan_queue'],
    telegramMessageId: null,
    whatsappMessageId: null,
    status: 'pending',
    createdAt: nowIso,
  };

  if (canSendNow) {
    const messageText = formatProfessorQuestionMessage(ticket);

    if (settings.enableTelegram && settings.telegramConfigured) {
      const tgRes = await sendTelegramMessage({
        text: messageText,
        inlineKeyboard: [
          [{ text: '❌ خارج از حوزه / بایگانی', callback_data: `qa_dismiss:${ticket.ticketCode}` }],
        ],
      });
      if (tgRes.sent) {
        ticket.channelsSent.push('telegram');
        ticket.telegramMessageId = tgRes.messageId || null;
        ticket.status = 'sent';
      }
    }

    if (settings.enableWhatsApp && settings.whatsappConfigured) {
      const waRes = await sendWhatsAppMessage({
        text: messageText,
        buttons: [{ id: `qa_dismiss:${ticket.ticketCode}`, title: 'بایگانی سؤال' }],
      });
      if (waRes.sent) {
        ticket.channelsSent.push('whatsapp');
        ticket.whatsappMessageId = waRes.messageId || null;
        ticket.status = 'sent';
      }
    }
  }

  if (isNeonDatabaseConfigured()) {
    try {
      await ensureRagTrainingSchema();
      const sql = getNeonSql();
      await sql`
        INSERT INTO ai_professor_escalations (
          id, ticket_code, query_hash, question_text, locale, pillar, context_summary,
          channels_sent, telegram_message_id, whatsapp_message_id, status, created_at
        ) VALUES (
          ${ticket.id}, ${ticket.ticketCode}, ${ticket.queryHash}, ${ticket.questionText},
          ${ticket.locale}, ${ticket.pillar}, ${ticket.contextSummary},
          ${JSON.stringify(ticket.channelsSent)}::jsonb, ${ticket.telegramMessageId},
          ${ticket.whatsappMessageId}, ${ticket.status}, NOW()
        )
      `;
    } catch {
      await saveLocalEscalation(ticket);
    }
  } else {
    await saveLocalEscalation(ticket);
  }

  return { created: true, ticket };
}

// -----------------------------------------------------------------------------
// 4. Inbound Professor Reply -> Normalize -> 1-Tap Preview -> Permanent Learning
// -----------------------------------------------------------------------------
export async function recordProfessorReplyDraft(input: {
  ticketCode?: string | null;
  telegramReplyToMessageId?: string | null;
  whatsappContextMessageId?: string | null;
  rawReplyText: string;
  channel: 'telegram' | 'whatsapp' | 'pishkhan';
  isVoice?: boolean;
}): Promise<{
  ok: boolean;
  ticket?: AiProfessorEscalation;
  awaitingConfirmation?: boolean;
  publishedGoldenQa?: AiGoldenQaItem;
  previewText?: string;
  error?: string;
}> {
  const settings = await getEscalationSettings();
  const extractedCode = input.ticketCode || extractTicketCodeFromText(input.rawReplyText);

  const ticket = await findEscalationTicket({
    ticketCode: extractedCode,
    telegramMessageId: input.telegramReplyToMessageId,
    whatsappMessageId: input.whatsappContextMessageId,
  });

  if (!ticket) {
    return { ok: false, error: 'هیچ پرسش بازی در صف ارجاع به استاد یافت نشد.' };
  }

  // Strip ticket prefix if Professor typed "[Q-1234] ..."
  const cleanedRaw = input.rawReplyText.replace(/^\[?Q-\d{4,6}\]?[\s:：-]+/i, '').trim();
  const { normalizedText: glossaried } = applyLacanianGlossary(cleanedRaw);
  const normalizedReply =
    ticket.locale === 'fa'
      ? normalizePersianText(glossaried, { enforceZwnj: true, normalizeQuotes: true })
      : glossaried.trim();

  const nowIso = new Date().toISOString();
  ticket.professorReplyRaw = cleanedRaw;
  ticket.professorReplyNormalized = normalizedReply;
  ticket.professorReplyChannel = input.channel;
  ticket.status = 'answered_draft';
  ticket.answeredAt = nowIso;

  if (isNeonDatabaseConfigured()) {
    try {
      await ensureRagTrainingSchema();
      const sql = getNeonSql();
      await sql`
        UPDATE ai_professor_escalations
        SET
          professor_reply_raw = ${cleanedRaw},
          professor_reply_normalized = ${normalizedReply},
          professor_reply_channel = ${input.channel},
          status = 'answered_draft',
          answered_at = NOW()
        WHERE ticket_code = ${ticket.ticketCode}
      `;
    } catch {
      await saveLocalEscalation(ticket);
    }
  } else {
    await saveLocalEscalation(ticket);
  }

  const needsOneTapConfirm =
    input.channel !== 'pishkhan' &&
    (input.isVoice ? settings.requireOneTapConfirmForVoice : settings.requireOneTapConfirmForText);

  if (!needsOneTapConfirm) {
    const pub = await approveAndPublishEscalationToBrain(ticket.ticketCode, normalizedReply);
    return {
      ok: pub.ok,
      ticket: pub.ticket,
      awaitingConfirmation: false,
      publishedGoldenQa: pub.goldenQa,
      previewText: normalizedReply,
      error: pub.error,
    };
  }

  const previewText = [
    `📝 پیش‌نمایش پاسخ نرمال‌سازی‌شده برای [${ticket.ticketCode}]`,
    `پرسش: «${ticket.questionText.slice(0, 180)}»`,
    '',
    `پاسخ آمادهٔ ثبت در مغز دستیار:`,
    normalizedReply.slice(0, 2600),
    '',
    'لطفاً برای یادگیری دائمی و امضای دیجیتال Ed25519 روی دکمهٔ تأیید کلیک فرمایید:',
  ].join('\n');

  if (input.channel === 'telegram') {
    await sendTelegramMessage({
      text: previewText,
      inlineKeyboard: [
        [{ text: '✅ تأیید و ثبت دائمی در مغز دستیار', callback_data: `qa_approve:${ticket.ticketCode}` }],
        [
          { text: '📋 ذخیره در پیش‌نویس پیشخوان', callback_data: `qa_draft:${ticket.ticketCode}` },
          { text: '❌ رد و بایگانی', callback_data: `qa_dismiss:${ticket.ticketCode}` },
        ],
      ],
    });
  } else if (input.channel === 'whatsapp') {
    await sendWhatsAppMessage({
      text: previewText,
      buttons: [
        { id: `qa_approve:${ticket.ticketCode}`, title: '✅ تأیید و ثبت' },
        { id: `qa_draft:${ticket.ticketCode}`, title: 'پیش‌نویس پیشخوان' },
        { id: `qa_dismiss:${ticket.ticketCode}`, title: 'لغو' },
      ],
    });
  }

  return {
    ok: true,
    ticket,
    awaitingConfirmation: true,
    previewText,
  };
}

export async function approveAndPublishEscalationToBrain(
  ticketCode: string,
  overrideAnswerMarkdown?: string
): Promise<{
  ok: boolean;
  ticket?: AiProfessorEscalation;
  goldenQa?: AiGoldenQaItem;
  error?: string;
}> {
  const ticket = await findEscalationTicket({ ticketCode });
  if (!ticket) {
    return { ok: false, error: `Ticket ${ticketCode} not found` };
  }

  const finalAnswerRaw = (
    overrideAnswerMarkdown ||
    ticket.professorReplyNormalized ||
    ticket.professorReplyRaw ||
    ''
  ).trim();
  if (!finalAnswerRaw) {
    return { ok: false, error: 'پاسخی برای ثبت در مغز دستیار وجود ندارد.' };
  }

  const { normalizedText: glossaried } = applyLacanianGlossary(finalAnswerRaw);
  const finalAnswer =
    ticket.locale === 'fa'
      ? normalizePersianText(glossaried, { enforceZwnj: true, normalizeQuotes: true })
      : glossaried;

  const goldenQa = await upsertGoldenQaItem({
    id: ticket.linkedGoldenQaId || undefined,
    locale: ticket.locale,
    pillar: ticket.pillar,
    questionCanonical: ticket.questionText,
    questionVariants: [ticket.ticketCode],
    answerMarkdown: finalAnswer,
    linkedUrls: [`/${ticket.locale}/assistant`],
    priorityBoost: 1.95,
    status: 'published',
    createdBy: `professor_${ticket.professorReplyChannel || 'omnichannel'}`,
  });

  await syncEntityToRagKnowledgeBase({
    collection: 'golden_qa',
    slug: goldenQa.id,
    action: 'golden_qa',
    summary: `professor_learning:${ticket.ticketCode}->${goldenQa.id}`,
  }).catch(() => undefined);

  const nowIso = new Date().toISOString();
  ticket.professorReplyNormalized = finalAnswer;
  ticket.linkedGoldenQaId = goldenQa.id;
  ticket.status = 'published_to_brain';
  ticket.publishedAt = nowIso;

  if (isNeonDatabaseConfigured()) {
    try {
      await ensureRagTrainingSchema();
      const sql = getNeonSql();
      await sql`
        UPDATE ai_professor_escalations
        SET
          professor_reply_normalized = ${finalAnswer},
          linked_golden_qa_id = ${goldenQa.id},
          status = 'published_to_brain',
          published_at = NOW()
        WHERE ticket_code = ${ticket.ticketCode}
      `;
    } catch {
      await saveLocalEscalation(ticket);
    }
  } else {
    await saveLocalEscalation(ticket);
  }

  const confirmMsg = `✅ پاسخ استاد برای [${ticket.ticketCode}] با امضای دیجیتال Ed25519 در مغز یادگیری دستیار هوشمند ثبت دائمی شد و از این لحظه به پژوهشگران ارائه می‌شود.`;
  if (ticket.professorReplyChannel === 'telegram') {
    await sendTelegramMessage({ text: confirmMsg });
  } else if (ticket.professorReplyChannel === 'whatsapp') {
    await sendWhatsAppMessage({ text: confirmMsg });
  }

  return { ok: true, ticket, goldenQa };
}

export async function dismissEscalationTicket(ticketCode: string): Promise<boolean> {
  const ticket = await findEscalationTicket({ ticketCode });
  if (!ticket) return false;
  ticket.status = 'dismissed';

  if (isNeonDatabaseConfigured()) {
    try {
      await ensureRagTrainingSchema();
      const sql = getNeonSql();
      await sql`
        UPDATE ai_professor_escalations SET status = 'dismissed' WHERE ticket_code = ${ticket.ticketCode}
      `;
      return true;
    } catch {
      await saveLocalEscalation(ticket);
      return true;
    }
  }
  await saveLocalEscalation(ticket);
  return true;
}

export async function dispatchPendingEscalationDigest(): Promise<{
  dispatchedCount: number;
  telegramSent: boolean;
  whatsappSent: boolean;
}> {
  const settings = await getEscalationSettings();
  const list = await listProfessorEscalations(60);
  const pending = list.filter((x) => x.status === 'pending').slice(0, settings.dailyCap);

  if (pending.length === 0) {
    return { dispatchedCount: 0, telegramSent: false, whatsappSent: false };
  }

  const lines = [
    `📚 خلاصهٔ پرسش‌های جدید پژوهشگران برای استاد (${pending.length} مورد):`,
    '',
    ...pending.map(
      (p, i) => `${i + 1}. [${p.ticketCode}] (${p.locale.toUpperCase()}) — «${p.questionText}»`
    ),
    '',
    'برای پاسخ به هر پرسش، کافی است کد آن (مثلاً Q-4821) را در ابتدای پیام متنی یا توضیح ویس بنویسید.',
  ];
  const digestText = lines.join('\n');

  let telegramSent = false;
  let whatsappSent = false;

  if (settings.enableTelegram && settings.telegramConfigured) {
    const res = await sendTelegramMessage({ text: digestText });
    telegramSent = res.sent;
  }
  if (settings.enableWhatsApp && settings.whatsappConfigured) {
    const res = await sendWhatsAppMessage({ text: digestText });
    whatsappSent = res.sent;
  }

  if (telegramSent || whatsappSent) {
    for (const item of pending) {
      item.status = 'sent';
      if (telegramSent && !item.channelsSent.includes('telegram')) item.channelsSent.push('telegram');
      if (whatsappSent && !item.channelsSent.includes('whatsapp')) item.channelsSent.push('whatsapp');
      if (isNeonDatabaseConfigured()) {
        try {
          const sql = getNeonSql();
          await sql`
            UPDATE ai_professor_escalations
            SET status = 'sent', channels_sent = ${JSON.stringify(item.channelsSent)}::jsonb
            WHERE ticket_code = ${item.ticketCode}
          `;
        } catch {
          await saveLocalEscalation(item);
        }
      } else {
        await saveLocalEscalation(item);
      }
    }
  }

  return { dispatchedCount: pending.length, telegramSent, whatsappSent };
}
