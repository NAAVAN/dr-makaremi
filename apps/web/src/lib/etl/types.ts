import { z } from 'zod';
import type { ContentPillar, ContentStatus, Locale } from '@makaremi/shared';

/**
 * Cloudflare Security Audit Guard: Prototype Pollution Checker
 * Recursively scans object keys and raw string payloads for prototype pollution vectors.
 */
export function hasPrototypePollution(input: unknown): boolean {
  if (!input) return false;

  if (typeof input === 'string') {
    // Quick regex scan for JSON key injection patterns
    const forbiddenPattern = /"(?:__proto__|constructor|prototype)"\s*:/i;
    return forbiddenPattern.test(input);
  }

  if (typeof input === 'object') {
    // Check if internal prototype was modified away from Object/Array prototype
    const proto = Object.getPrototypeOf(input);
    if (proto !== null && proto !== Object.prototype && proto !== Array.prototype) {
      return true;
    }

    // Check direct properties
    if (
      Object.prototype.hasOwnProperty.call(input, '__proto__') ||
      Object.prototype.hasOwnProperty.call(input, 'constructor') ||
      Object.prototype.hasOwnProperty.call(input, 'prototype')
    ) {
      return true;
    }

    // Traverse keys and values
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return true;
      }
      if (value && typeof value === 'object') {
        if (hasPrototypePollution(value)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Bounded Zod schema for individual Facebook post ingestion.
 * Maximum string lengths and object bounds enforced to prevent Memory Exhaustion DoS.
 */
export const FacebookAttachmentSchema = z.object({
  type: z.string().max(100).optional(),
  url: z.string().url().max(2048).optional(),
  title: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
});

export const FacebookPostSchema = z.object({
  id: z.string().min(1).max(256),
  timestamp: z.union([z.number(), z.string().max(64)]),
  post: z.string().max(50000).optional(),
  title: z.string().max(1000).optional(),
  data: z.array(z.record(z.string().max(100), z.unknown())).max(50).optional(),
  attachments: z.array(FacebookAttachmentSchema).max(20).optional(),
});

export type RawFacebookPost = z.infer<typeof FacebookPostSchema>;

/**
 * Bounded batch schema for Facebook Export JSON uploads.
 * Restricts batch size to a maximum of 25 posts per request.
 */
export const FacebookExportSchema = z.object({
  posts: z.array(FacebookPostSchema).min(1).max(25),
});

export type FacebookExportPayload = z.infer<typeof FacebookExportSchema>;

/**
 * WordPress Post record schema representing legacy makaremi.net/com database exports.
 */
export const WordPressPostRecordSchema = z.object({
  id: z.number().int().positive(),
  post_title: z.string().max(1000),
  post_name: z.string().max(500), // slug
  post_content: z.string().max(100000),
  post_date: z.string().max(64),
  post_status: z.string().max(32),
  categories: z.array(z.string().max(100)).max(20).optional(),
  tags: z.array(z.string().max(100)).max(50).optional(),
});

export type WordPressPostRecord = z.infer<typeof WordPressPostRecordSchema>;

/**
 * Enriched migration article ready for editorial review and cryptographic signing.
 */
export interface EnrichedMigrationArticle {
  id: string;
  source: 'facebook' | 'wordpress';
  source_id: string;
  source_url?: string;
  original_timestamp: string;
  slug: string;
  pillar: ContentPillar;
  status: ContentStatus; // strictly 'review_pending'
  locale: Locale;
  title: string;
  executive_summary: string;
  body_markdown: string;
  lacanian_terms_detected: string[];
  word_count: number;
  is_merged_thread: boolean;
  merged_part_count?: number;
  content_sha256: string;
  signature_ed25519: string;
  canonical_digest: string;
  created_at: string;
  reviewed_by?: string;
}

/**
 * Aggregate statistics for the ETL Migration Queue.
 */
export interface MigrationQueueStats {
  total_raw_processed: number;
  filtered_micro_posts: number;
  threads_merged: number;
  duplicates_eliminated: number;
  ready_for_review_count: number;
  pillar_breakdown: Record<ContentPillar, number>;
}
