import crypto from 'node:crypto';
import type { ContentPillar } from '@makaremi/shared';
import { normalizePersianText, countWords } from './persian-normalizer';
import type { EnrichedMigrationArticle } from './types';
import {
  buildCanonicalString,
  computeCanonicalSha256,
  signWithEd25519,
} from '@/lib/crypto';

/**
 * Cloudflare Security Audit: Prompt Security Guard
 * Detects adversarial prompt injection vectors, jailbreak commands, and secret-harvesting attempts.
 */
export function detectPromptInjection(text: string): { isInjection: boolean; pattern?: string } {
  if (!text) return { isInjection: false };

  const adversarialPatterns: Array<{ name: string; regex: RegExp }> = [
    { name: 'ignore_instructions', regex: /ignore\s+(all\s+)?(?:previous|prior)\s+instructions/i },
    { name: 'reveal_system_prompt', regex: /(?:reveal|show|print|display)\s+(?:the\s+)?system\s+prompt/i },
    { name: 'jailbreak_dev_mode', regex: /(?:developer\s+mode|dan\s+mode|jailbreak|unrestricted\s+mode)/i },
    { name: 'env_var_extraction', regex: /(?:process\.env|env\.[A-Z_]+|PRIVATE_KEY|API_KEY|SECRET)/i },
    { name: 'script_tag_injection', regex: /<\s*script[^>]*>/i },
    { name: 'base64_hidden_payload', regex: /base64\s*,\s*[A-Za-z0-9+/=]{40,}/i },
    { name: 'eval_exec_call', regex: /(?:eval\s*\(|exec\s*\(|system\s*\()/i },
  ];

  for (const { name, regex } of adversarialPatterns) {
    if (regex.test(text)) {
      return { isInjection: true, pattern: name };
    }
  }

  return { isInjection: false };
}

/**
 * Lacanian and Cultural Vocabulary Taxonomy for Detection and Enrichment
 */
export const LACANIAN_VOCABULARY_TERMS: Array<{
  term_fa: string;
  term_fr: string;
  term_en: string;
  pillar: ContentPillar;
  aliases: string[];
}> = [
  {
    term_fa: 'دگرشنیدن',
    term_fr: 'Écouter autrement',
    term_en: 'Listening Differently',
    pillar: 'psychoanalysis',
    aliases: ['دگرشنیدن', 'دگر‌شنیدن', 'دگر شنیدن', 'écouter autrement'],
  },
  {
    term_fa: 'عملیات نام پدر',
    term_fr: 'Opération Nom-du-Père',
    term_en: 'Operation of the Name-of-the-Father',
    pillar: 'psychoanalysis',
    aliases: ['عملیات نام پدر', 'استعاره پدری', 'نام پدر', 'nom-du-père', 'nom du père'],
  },
  {
    term_fa: 'حالت مرزی',
    term_fr: 'État Limite',
    term_en: 'Borderline State',
    pillar: 'psychoanalysis',
    aliases: ['حالت مرزی', 'مرزگستری', 'état limite', 'borderline'],
  },
  {
    term_fa: 'آسیب‌شناسی ازهم‌گسستگی',
    term_fr: 'Pathologie de la désintégration',
    term_en: 'Pathology of Fragmentation',
    pillar: 'psychoanalysis',
    aliases: ['آسیب‌شناسی ازهم‌گسستگی', 'ازهم‌گسستگی', 'ازهمگسستگی', 'رانه مرگ'],
  },
  {
    term_fa: 'سرزمین فرهنگی ایران',
    term_fr: "Terre culturelle de l'Iran",
    term_en: 'Cultural Land of Iran',
    pillar: 'cultural_strategy',
    aliases: ['سرزمین فرهنگی ایران', 'حوزه فرهنگی ایران', 'فرهنگ ایرانی'],
  },
  {
    term_fa: 'سوگ سیاسی و دادخواهی',
    term_fr: 'Deuil politique et justice transitionnelle',
    term_en: 'Political Mourning & Transitional Justice',
    pillar: 'human_rights_dadkhahi',
    aliases: ['دادخواهی', 'سوگ سیاسی', 'کشتار ۶۷', 'خاوران', 'عدالت انتقالی'],
  },
];

/**
 * Classifies content into one of the 4 core pillars based on vocabulary frequency.
 */
export function classifyPillar(text: string): ContentPillar {
  const normalized = text.toLowerCase();

  const scores: Record<ContentPillar, number> = {
    psychoanalysis: 0,
    art_calligraphy: 0,
    cultural_strategy: 0,
    human_rights_dadkhahi: 0,
  };

  const keywords: Record<ContentPillar, string[]> = {
    psychoanalysis: [
      'روان‌کاوی', 'روانکاوی', 'لکان', 'فروید', 'ناخودآگاه', 'دگرشنیدن',
      'سوژه', 'دال', 'استعاره پدری', 'نام پدر', 'سایکوز', 'روان‌پریشی',
      'نوروز', 'انتقال', 'بالینی', 'میل', 'گره برومه', 'خیالی', 'نمادین',
    ],
    art_calligraphy: [
      'خوشنویسی', 'خط', 'نقاشی', 'بوم', 'رنگ', 'نمایشگاه', 'مسکو',
      'موزه', 'پومپادور', 'فرم', 'ترکیب‌بندی', 'دال بصری', 'قلم',
    ],
    cultural_strategy: [
      'سرزمین فرهنگی ایران', 'گذار', 'سکولاریسم', 'دموکراسی', 'توسعه',
      'تاریخ', 'جمهوری', 'شاهنامه', 'حافظ', 'هویت ملی', 'فردوسی', 'استراتژی',
    ],
    human_rights_dadkhahi: [
      'دادخواهی', 'کشتار ۶۷', 'خاوران', 'حقوق بشر', 'زندان', 'حقیقت',
      'مادران خاوران', 'ایران تریبونال', 'عدالت انتقالی', 'فدراسیون بین‌المللی',
      'lddhi', 'fidh', 'سوگ سیاسی',
    ],
  };

  for (const [pillar, list] of Object.entries(keywords)) {
    for (const kw of list) {
      if (normalized.includes(kw.toLowerCase())) {
        scores[pillar as ContentPillar] += 2;
      }
    }
  }

  // Determine highest scoring pillar
  let bestPillar: ContentPillar = 'psychoanalysis';
  let maxScore = -1;

  for (const [pillar, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestPillar = pillar as ContentPillar;
    }
  }

  return bestPillar;
}

/**
 * Generates an executive summary (~150 words) from the beginning of the article.
 */
export function generateExecutiveSummary(normalizedBody: string, maxWords: number = 80): string {
  const sentences = normalizedBody.split(/[.،؛؟!\n]+/).map((s) => s.trim()).filter(Boolean);
  const selected: string[] = [];
  let currentWords = 0;

  for (const sentence of sentences) {
    const wc = countWords(sentence);
    if (currentWords + wc <= maxWords) {
      selected.push(sentence);
      currentWords += wc;
    } else {
      break;
    }
  }

  if (selected.length === 0 && sentences[0]) {
    return sentences[0].slice(0, 200) + '...';
  }

  return selected.join('؛ ') + '.';
}

/**
 * Creates a clean URL slug from title and timestamp.
 */
export function generateSlugFromTitle(title: string, id: string): string {
  const cleaned = title
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);

  const hashSnippet = crypto.createHash('md5').update(id + title).digest('hex').slice(0, 6);
  return `${cleaned || 'note'}-${hashSnippet}`;
}

export interface ArticleEnrichmentInput {
  source: 'facebook' | 'wordpress';
  sourceId: string;
  sourceUrl?: string;
  timestamp: number | string;
  rawTitle: string;
  rawContent: string;
  isMergedThread?: boolean;
  mergedPartCount?: number;
}

/**
 * Complete Enrichment Pipeline
 * 1. Checks for prompt injection & sanitizes.
 * 2. Normalizes Persian typography & ZWNJ.
 * 3. Identifies Lacanian glossary terms.
 * 4. Classifies into one of the 4 pillars.
 * 5. Generates executive summary.
 * 6. Cryptographically signs with Ed25519 & assigns status 'review_pending'.
 */
export async function enrichArticle(input: ArticleEnrichmentInput): Promise<EnrichedMigrationArticle> {
  const { isInjection, pattern } = detectPromptInjection(input.rawContent + ' ' + input.rawTitle);
  let sanitizedContent = input.rawContent;

  if (isInjection) {
    // Sanitize by stripping malicious instructions
    sanitizedContent = sanitizedContent.replace(/ignore\s+(all\s+)?(?:previous|prior)\s+instructions/gi, '[فیلتر امنیتی: حذف فرمان]');
  }

  // 1. Normalize typography & ZWNJ
  const normalizedTitle = normalizePersianText(input.rawTitle || 'یادداشت پژوهشی');
  const normalizedBody = normalizePersianText(sanitizedContent);

  // 2. Detect Lacanian terms
  const detectedTerms: string[] = [];
  for (const vocab of LACANIAN_VOCABULARY_TERMS) {
    for (const alias of vocab.aliases) {
      if (normalizedBody.includes(alias) || normalizedTitle.includes(alias)) {
        if (!detectedTerms.includes(vocab.term_fa)) {
          detectedTerms.push(vocab.term_fa);
        }
        break;
      }
    }
  }

  // 3. Pillar classification
  const pillar = classifyPillar(`${normalizedTitle} ${normalizedBody}`);

  // 4. Executive summary & metadata
  const executiveSummary = generateExecutiveSummary(normalizedBody);
  const slug = generateSlugFromTitle(normalizedTitle, input.sourceId);
  const wordCount = countWords(normalizedBody);

  const isoDate = typeof input.timestamp === 'number'
    ? new Date(input.timestamp * 1000).toISOString()
    : new Date(input.timestamp).toISOString();

  // 5. Deterministic Cryptographic Digest & Ed25519 Digital Signature
  const canonicalString = buildCanonicalString({
    slug,
    locale: 'fa',
    title: normalizedTitle,
    body_markdown: normalizedBody,
    published_at: isoDate,
  });

  const contentSha256 = computeCanonicalSha256(canonicalString);
  const signatureEd25519 = signWithEd25519(canonicalString);

  return {
    id: `migration_${input.source}_${input.sourceId}`,
    source: input.source,
    source_id: input.sourceId,
    source_url: input.sourceUrl,
    original_timestamp: isoDate,
    slug,
    pillar,
    status: 'review_pending',
    locale: 'fa',
    title: normalizedTitle,
    executive_summary: executiveSummary,
    body_markdown: normalizedBody,
    lacanian_terms_detected: detectedTerms,
    word_count: wordCount,
    is_merged_thread: Boolean(input.isMergedThread),
    merged_part_count: input.mergedPartCount,
    content_sha256: contentSha256,
    signature_ed25519: signatureEd25519,
    canonical_digest: contentSha256,
    created_at: new Date().toISOString(),
  };
}
