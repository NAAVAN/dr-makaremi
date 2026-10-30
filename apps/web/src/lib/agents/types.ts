import { z } from 'zod';
import type { ContentPillar, Locale } from '@makaremi/shared';

// -----------------------------------------------------------------------------
// Agent Permissions & Scopes (Principle of Least Privilege)
// -----------------------------------------------------------------------------
export const ALLOWED_AGENT_PERMISSIONS = [
  'CREATE_DRAFT',
  'UPDATE_DRAFT',
  'PUBLISH_POST',
  'ADD_MEDIA_ASSET',
  'MODERATE_COMMENT',
  'READ_ANALYTICS',
] as const;

export type AgentPermission = (typeof ALLOWED_AGENT_PERMISSIONS)[number];

export const PROHIBITED_DESTRUCTIVE_OPERATIONS = [
  'DELETE_POST',
  'DROP_COLLECTION',
  'REVOKE_KEYS',
  'DELETE_ARCHIVE',
  'MODIFY_CRYPTO_IDENTITY',
] as const;

export type ProhibitedOperation = (typeof PROHIBITED_DESTRUCTIVE_OPERATIONS)[number];

export interface ScopedAgentToken {
  tokenId: string;
  issuedTo: string; // e.g. Dr. Makaremi's user ID
  channel: 'telegram' | 'whatsapp' | 'console';
  permissions: AgentPermission[];
  createdAt: number;
  expiresAt: number;
}

// -----------------------------------------------------------------------------
// LangGraph Multi-Agent State Definition
// -----------------------------------------------------------------------------
export type AgentStateStatus =
  | 'idle'
  | 'transcribing'
  | 'drafting'
  | 'awaiting_feedback'
  | 'revising'
  | 'publishing'
  | 'completed'
  | 'error';

export interface ArticleDraft {
  id: string;
  slug: string;
  pillar: ContentPillar;
  title: string;
  executiveSummary: string;
  bodyMarkdown: string;
  citations: string[];
  ed25519Signature: string;
  sha256Digest: string;
  canonicalUrl: string;
  frenchTitle?: string;
  frenchSummary?: string;
  englishTitle?: string;
  englishSummary?: string;
}

export interface OmnichannelPublishResult {
  publishedAt: string;
  articleSlug: string;
  websiteUrl: string;
  telegramInstantViewUrl: string;
  facebookPostFormatted: string;
  linkedinPostFormatted: string;
  instagramQuoteCardSvg: string;
  newsletterDispatched: boolean;
  llmsTxtUpdated: boolean;
  sha256Digest: string;
  ed25519Signature: string;
}

export interface MakaremiAgentState {
  sessionId: string;
  channel: 'telegram' | 'whatsapp' | 'console';
  userId: string;
  inputAudioUrl?: string;
  inputText?: string;
  inputImageUrl?: string;
  rawTranscript?: string;
  normalizedTranscript?: string;
  detectedTerms: string[];
  pillar: ContentPillar;
  currentDraft?: ArticleDraft;
  revisionHistory: Array<{ timestamp: number; instruction: string }>;
  isPublishApproved: boolean;
  publishChallengePin?: string;
  publishChallengeExpiresAt?: number;
  publishChallengeAttempts?: number;
  publishResults?: OmnichannelPublishResult;
  status: AgentStateStatus;
  error?: string;
}

// -----------------------------------------------------------------------------
// Telegram Webhook Schemas (Zod)
// -----------------------------------------------------------------------------
export const TelegramUserSchema = z.object({
  id: z.number(),
  is_bot: z.boolean().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
});

export const TelegramVoiceSchema = z.object({
  file_id: z.string(),
  file_unique_id: z.string().optional(),
  duration: z.number(),
  mime_type: z.string().optional(),
  file_size: z.number().optional(),
});

export const TelegramPhotoSizeSchema = z.object({
  file_id: z.string(),
  file_unique_id: z.string().optional(),
  width: z.number(),
  height: z.number(),
  file_size: z.number().optional(),
});

export const TelegramMessageSchema = z.object({
  message_id: z.number(),
  from: TelegramUserSchema.optional(),
  date: z.number(),
  text: z.string().optional(),
  voice: TelegramVoiceSchema.optional(),
  audio: TelegramVoiceSchema.optional(),
  photo: z.array(TelegramPhotoSizeSchema).optional(),
  caption: z.string().optional(),
});

export const TelegramCallbackQuerySchema = z.object({
  id: z.string(),
  from: TelegramUserSchema,
  message: TelegramMessageSchema.optional(),
  data: z.string(),
});

export const TelegramUpdateSchema = z.object({
  update_id: z.number(),
  message: TelegramMessageSchema.optional(),
  callback_query: TelegramCallbackQuerySchema.optional(),
});

export type TelegramUpdate = z.infer<typeof TelegramUpdateSchema>;

// -----------------------------------------------------------------------------
// WhatsApp Business Webhook Schemas (Zod)
// -----------------------------------------------------------------------------
export const WhatsAppMessageSchema = z.object({
  from: z.string(),
  id: z.string(),
  timestamp: z.string(),
  type: z.string(),
  text: z.object({ body: z.string() }).optional(),
  audio: z.object({ id: z.string(), mime_type: z.string().optional() }).optional(),
  interactive: z
    .object({
      type: z.string(),
      button_reply: z.object({ id: z.string(), title: z.string() }).optional(),
    })
    .optional(),
});

export const WhatsAppChangeValueSchema = z.object({
  messaging_product: z.string().default('whatsapp'),
  metadata: z
    .object({
      display_phone_number: z.string().optional(),
      phone_number_id: z.string().optional(),
    })
    .optional(),
  contacts: z
    .array(
      z.object({
        profile: z.object({ name: z.string() }).optional(),
        wa_id: z.string(),
      })
    )
    .optional(),
  messages: z.array(WhatsAppMessageSchema).optional(),
});

export const WhatsAppWebhookPayloadSchema = z.object({
  object: z.string(),
  entry: z.array(
    z.object({
      id: z.string(),
      changes: z.array(
        z.object({
          field: z.string(),
          value: WhatsAppChangeValueSchema,
        })
      ),
    })
  ),
});

export type WhatsAppWebhookPayload = z.infer<typeof WhatsAppWebhookPayloadSchema>;

// -----------------------------------------------------------------------------
// Reader Comment & Moderation Schemas (Zod)
// -----------------------------------------------------------------------------
export const CommentSubmissionSchema = z.object({
  article_slug: z.string().min(1).max(200),
  locale: z.enum(['fa', 'fr', 'en'] as const).default('fa'),
  author_name: z.string().min(2).max(100),
  author_email: z.string().email(),
  content: z.string().min(3).max(2000),
  website_url_hp: z.string().max(200).optional(), // Honeypot field
});

export type CommentSubmission = z.infer<typeof CommentSubmissionSchema>;

export interface ArticleComment {
  id: string;
  articleSlug: string;
  locale: Locale;
  authorName: string;
  authorEmail: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  professorReply?: {
    text: string;
    repliedAt: string;
    audioVoiceUrl?: string;
  };
}
