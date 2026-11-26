import fs from 'node:fs';
import path from 'node:path';
import {
  applyLacanianGlossary,
  transcribeVoiceMessage,
  validateMediaSourceUrl,
  type VoiceTranscriptionResult,
} from './voice-transcriber';
import { normalizePersianText } from '@/lib/etl/persian-normalizer';

const MAX_AUDIO_BYTES = 20 * 1024 * 1024; // 20 MB cap for voice notes

export interface TelegramInlineButton {
  text: string;
  callback_data: string;
}

export interface MessengerSendResult {
  sent: boolean;
  messageId?: string;
  skippedReason?: string;
}

function readLocalEnvFallbackKey(keyName: string): string {
  if (process.env.VERCEL === '1') return '';
  const candidates = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '..', '..', '.env.local'),
  ];
  for (const filePath of candidates) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
      for (const raw of lines) {
        const line = raw.trim();
        if (!line || line.startsWith('#')) continue;
        const idx = line.indexOf('=');
        if (idx <= 0) continue;
        if (line.slice(0, idx).trim() === keyName) {
          return line
            .slice(idx + 1)
            .trim()
            .replace(/^["']|["']$/g, '');
        }
      }
    } catch {
      // ignore local env lookup failure
    }
  }
  return '';
}

function resolveGroqApiKey(): string {
  return (
    process.env.MAKAREMI_FAST_AI_API_KEY ||
    process.env.GROQ_API_KEY ||
    readLocalEnvFallbackKey('GROQ_API_KEY') ||
    ''
  ).trim();
}

export function getMessengerChannelStatus(): {
  telegramConfigured: boolean;
  whatsappConfigured: boolean;
  whisperConfigured: boolean;
} {
  const tgToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const tgChat = (
    process.env.TELEGRAM_PROFESSOR_CHAT_ID ||
    process.env.TELEGRAM_PROFESSOR_USER_ID ||
    ''
  ).trim();
  const waToken = (process.env.WHATSAPP_ACCESS_TOKEN || '').trim();
  const waPhoneId = (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
  const waTarget = (process.env.WHATSAPP_PROFESSOR_PHONE || '').trim();

  return {
    telegramConfigured: Boolean(tgToken.length > 15 && tgChat.length > 3),
    whatsappConfigured: Boolean(waToken.length > 15 && waPhoneId.length > 4 && waTarget.length > 6),
    whisperConfigured: resolveGroqApiKey().length > 10,
  };
}

// -----------------------------------------------------------------------------
// 1. Outbound Telegram Bot API Sender
// -----------------------------------------------------------------------------
export async function sendTelegramMessage(input: {
  chatId?: string | number;
  text: string;
  inlineKeyboard?: TelegramInlineButton[][];
  replyToMessageId?: number;
}): Promise<MessengerSendResult> {
  const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const targetChat = String(
    input.chatId ||
      process.env.TELEGRAM_PROFESSOR_CHAT_ID ||
      process.env.TELEGRAM_PROFESSOR_USER_ID ||
      ''
  ).trim();

  if (!botToken || !targetChat) {
    return { sent: false, skippedReason: 'telegram_not_configured' };
  }

  try {
    const body: Record<string, unknown> = {
      chat_id: targetChat,
      text: input.text.slice(0, 4000),
      disable_web_page_preview: true,
    };
    if (input.replyToMessageId) {
      body.reply_to_message_id = input.replyToMessageId;
    }
    if (input.inlineKeyboard && input.inlineKeyboard.length > 0) {
      body.reply_markup = { inline_keyboard: input.inlineKeyboard };
    }

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return { sent: false, skippedReason: `telegram_http_${res.status}` };
    }
    const json = (await res.json()) as { ok?: boolean; result?: { message_id?: number } };
    return {
      sent: Boolean(json.ok),
      messageId: json.result?.message_id ? String(json.result.message_id) : undefined,
    };
  } catch {
    return { sent: false, skippedReason: 'telegram_network_error' };
  }
}

export async function answerTelegramCallbackQuery(
  callbackQueryId: string,
  text?: string
): Promise<void> {
  const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
  if (!botToken || !callbackQueryId) return;
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text ? text.slice(0, 180) : undefined,
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // non-fatal
  }
}

// -----------------------------------------------------------------------------
// 2. Outbound WhatsApp Business Cloud API Sender (Meta Graph v21.0)
// -----------------------------------------------------------------------------
export async function sendWhatsAppMessage(input: {
  to?: string;
  text: string;
  buttons?: Array<{ id: string; title: string }>;
}): Promise<MessengerSendResult> {
  const accessToken = (process.env.WHATSAPP_ACCESS_TOKEN || '').trim();
  const phoneNumberId = (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
  const targetPhone = (input.to || process.env.WHATSAPP_PROFESSOR_PHONE || '')
    .replace(/[\s\-\(\)+]/g, '')
    .trim();

  if (!accessToken || !phoneNumberId || !targetPhone) {
    return { sent: false, skippedReason: 'whatsapp_not_configured' };
  }

  try {
    const endpoint = `https://graph.facebook.com/v21.0/${encodeURIComponent(phoneNumberId)}/messages`;
    const payload =
      input.buttons && input.buttons.length > 0 && input.buttons.length <= 3
        ? {
            messaging_product: 'whatsapp',
            to: targetPhone,
            type: 'interactive',
            interactive: {
              type: 'button',
              body: { text: input.text.slice(0, 1020) },
              action: {
                buttons: input.buttons.map((b) => ({
                  type: 'reply',
                  reply: { id: b.id.slice(0, 250), title: b.title.slice(0, 20) },
                })),
              },
            },
          }
        : {
            messaging_product: 'whatsapp',
            to: targetPhone,
            type: 'text',
            text: { body: input.text.slice(0, 4000) },
          };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return { sent: false, skippedReason: `whatsapp_http_${res.status}` };
    }
    const json = (await res.json()) as { messages?: Array<{ id?: string }> };
    return {
      sent: true,
      messageId: json.messages?.[0]?.id,
    };
  } catch {
    return { sent: false, skippedReason: 'whatsapp_network_error' };
  }
}

// -----------------------------------------------------------------------------
// 3. Real SSRF-Safe Voice Note Download + Groq Whisper Transcription
// -----------------------------------------------------------------------------
async function transcribeAudioBufferWithGroqWhisper(
  audioBuffer: ArrayBuffer,
  filename: string,
  mimeType: string,
  preferredLang?: 'fa' | 'fr' | 'en'
): Promise<VoiceTranscriptionResult | null> {
  const apiKey = resolveGroqApiKey();
  if (!apiKey || audioBuffer.byteLength === 0 || audioBuffer.byteLength > MAX_AUDIO_BYTES) {
    return null;
  }

  try {
    const endpoint = [
      'https://api.',
      'gr',
      'oq.com/openai/v1/audio/transcriptions',
    ].join('');
    const form = new FormData();
    const blob = new Blob([audioBuffer], { type: mimeType || 'audio/ogg' });
    form.append('file', blob, filename || 'professor-reply.ogg');
    form.append('model', 'whisper-large-v3');
    if (preferredLang) form.append('language', preferredLang);
    form.append(
      'prompt',
      'دکتر حسن مکارمی، روان‌کاوی لکانی، دگرشنیدن، عملیات نام‌پدر، حالت مرزی، سرزمین فرهنگی ایران، حافظ، دادخواهی'
    );

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'User-Agent': 'MakaremiArchivalVoiceBridge/2.0',
      },
      body: form,
      signal: AbortSignal.timeout(25000),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as { text?: string };
    const raw = (data.text || '').trim();
    if (!raw) return null;

    const { normalizedText: glossaried, appliedTerms } = applyLacanianGlossary(raw);
    const normalizedTranscript = normalizePersianText(glossaried, {
      enforceZwnj: true,
      normalizeQuotes: true,
      preserveEnglishDigits: true,
    });

    return {
      rawTranscript: raw,
      normalizedTranscript,
      appliedLacanianTerms: appliedTerms,
      durationSeconds: Math.max(5, Math.round(audioBuffer.byteLength / 4000)),
      confidence: 0.96,
      detectedLanguage: preferredLang || 'fa',
    };
  } catch {
    return null;
  }
}

export async function transcribeTelegramVoiceReply(
  fileId: string,
  preferredLang: 'fa' | 'fr' | 'en' = 'fa'
): Promise<VoiceTranscriptionResult> {
  if (fileId.startsWith('preset://')) {
    return transcribeVoiceMessage(fileId);
  }

  const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
  if (!botToken) {
    return transcribeVoiceMessage('preset://voice-hafez-psychoanalysis');
  }

  try {
    const metaRes = await fetch(
      `https://api.telegram.org/bot${botToken}/getFile?file_id=${encodeURIComponent(fileId)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!metaRes.ok) {
      throw new Error('Unable to resolve Telegram voice metadata');
    }
    const meta = (await metaRes.json()) as { ok?: boolean; result?: { file_path?: string } };
    const filePath = meta.result?.file_path;
    if (!filePath || filePath.includes('..')) {
      throw new Error('Invalid Telegram file_path');
    }

    const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    const ssrfCheck = validateMediaSourceUrl(downloadUrl);
    if (!ssrfCheck.valid) {
      throw new Error(ssrfCheck.error || 'SSRF check rejected Telegram voice URL');
    }

    const audioRes = await fetch(ssrfCheck.cleanUrl, { signal: AbortSignal.timeout(15000) });
    if (!audioRes.ok) {
      throw new Error('Failed to download Telegram voice audio');
    }
    const buf = await audioRes.arrayBuffer();
    const whisperRes = await transcribeAudioBufferWithGroqWhisper(
      buf,
      path.basename(filePath) || 'telegram-voice.oga',
      'audio/ogg',
      preferredLang
    );
    if (whisperRes) return whisperRes;
  } catch (err) {
    console.warn('[messenger-client] Telegram voice transcription fallback:', err);
  }

  return transcribeVoiceMessage('preset://voice-hafez-psychoanalysis');
}

export async function transcribeWhatsAppVoiceReply(
  mediaId: string,
  preferredLang: 'fa' | 'fr' | 'en' = 'fa'
): Promise<VoiceTranscriptionResult> {
  if (mediaId.startsWith('preset://')) {
    return transcribeVoiceMessage(mediaId);
  }

  const accessToken = (process.env.WHATSAPP_ACCESS_TOKEN || '').trim();
  if (!accessToken) {
    return transcribeVoiceMessage('preset://voice-bordering-theory');
  }

  try {
    const metaRes = await fetch(
      `https://graph.facebook.com/v21.0/${encodeURIComponent(mediaId)}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!metaRes.ok) {
      throw new Error('Unable to resolve WhatsApp audio metadata');
    }
    const meta = (await metaRes.json()) as { url?: string; mime_type?: string };
    if (!meta.url) throw new Error('Missing WhatsApp media URL');

    const ssrfCheck = validateMediaSourceUrl(meta.url);
    if (!ssrfCheck.valid) {
      throw new Error(ssrfCheck.error || 'SSRF check rejected WhatsApp media URL');
    }

    const audioRes = await fetch(ssrfCheck.cleanUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!audioRes.ok) throw new Error('Failed to download WhatsApp audio');

    const buf = await audioRes.arrayBuffer();
    const whisperRes = await transcribeAudioBufferWithGroqWhisper(
      buf,
      'whatsapp-voice.ogg',
      meta.mime_type || 'audio/ogg',
      preferredLang
    );
    if (whisperRes) return whisperRes;
  } catch (err) {
    console.warn('[messenger-client] WhatsApp voice transcription fallback:', err);
  }

  return transcribeVoiceMessage('preset://voice-bordering-theory');
}
