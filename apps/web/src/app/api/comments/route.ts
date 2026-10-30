import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { checkRateLimit } from '@/lib/rate-limit';
import { hasPrototypePollution } from '@/lib/etl/types';
import {
  escapeHtml,
  sanitizeAndCheckPromptInjection,
} from '@/lib/agents/auth-guard';
import {
  CommentSubmissionSchema,
  type ArticleComment,
} from '@/lib/agents/types';

// -----------------------------------------------------------------------------
// In-Memory Comments Repository
// -----------------------------------------------------------------------------
const commentsStore: ArticleComment[] = [
  {
    id: 'cmt_default_01',
    articleSlug: 'is-psychoanalysis-a-science',
    locale: 'fa',
    authorName: 'دکتر علیرضا سلیمانی',
    authorEmail: 'soleimani@univ-tehran.ac.ir',
    content: 'تحلیل شما پیرامون کارکرد دگرشنیدن و نسبت آن با ساختار ناخودآگاه لکان بسیار عمیق بود.',
    status: 'approved',
    createdAt: '2026-10-20T14:30:00.000Z',
    professorReply: {
      text: 'سپاس از توجه شما دکتر سلیمانی گرامی. این مبحث در سمینار بعدی سوربن بیشتر بسط خواهد یافت.',
      repliedAt: '2026-10-20T18:15:00.000Z',
    },
  },
];

/**
 * GET /api/comments?article_slug=...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('article_slug');

  if (!slug) {
    return NextResponse.json(
      { error: 'Missing article_slug query parameter' },
      { status: 400 }
    );
  }

  const approved = commentsStore.filter(
    (c) => c.articleSlug === slug && c.status === 'approved'
  );

  return NextResponse.json({
    ok: true,
    article_slug: slug,
    comments: approved,
    total: approved.length,
  });
}

/**
 * POST /api/comments
 * Submits a new user comment with Honeypot, XSS, and Prompt Injection Defense.
 */
export async function POST(request: NextRequest) {
  // 1. Rate Limiting (Prevent comment spam DoS)
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 20 }, 'comments-submit');
  if (!rl.allowed) return rl.response!;

  // 2. Read Raw Text for Prototype Pollution Defense
  let rawBodyText: string;
  try {
    rawBodyText = await request.text();
  } catch {
    return NextResponse.json({ error: '400 Bad Request: Unable to read body' }, { status: 400 });
  }

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
    return NextResponse.json({ error: '400 Bad Request: Invalid JSON body' }, { status: 400 });
  }

  if (hasPrototypePollution(bodyJson)) {
    return NextResponse.json(
      { error: '400 Bad Request: Prototype pollution detected' },
      { status: 400 }
    );
  }

  // 3. Schema Validation
  const parseResult = CommentSubmissionSchema.safeParse(bodyJson);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: '400 Bad Request: Invalid comment fields', issues: parseResult.error.issues },
      { status: 400 }
    );
  }

  const data = parseResult.data;

  // 4. Honeypot Bot Trap: If hidden website field is populated, silently accept and drop
  if (data.website_url_hp && data.website_url_hp.trim() !== '') {
    return NextResponse.json({
      ok: true,
      message: 'دیدگاه شما با موفقیت ثبت شد و پس از بازبینی منتشر می‌شود.',
      comment_id: 'cmt_bot_dropped',
    });
  }

  // 5. Indirect Prompt Injection & XSS Guard
  const safetyCheck = sanitizeAndCheckPromptInjection(data.content);
  if (!safetyCheck.isSafe) {
    return NextResponse.json(
      { error: `403 Forbidden: ${safetyCheck.rejectionReason}` },
      { status: 403 }
    );
  }

  // 6. Record Comment
  const newComment: ArticleComment = {
    id: `cmt_${crypto.randomUUID()}`,
    articleSlug: data.article_slug,
    locale: data.locale,
    authorName: escapeHtml(data.author_name.trim()),
    authorEmail: data.author_email.trim().toLowerCase(),
    content: safetyCheck.sanitized,
    status: 'pending', // Requires Professor's Telegram/WhatsApp 1-click or voice approval
    createdAt: new Date().toISOString(),
  };

  commentsStore.push(newComment);

  return NextResponse.json({
    ok: true,
    message: 'دیدگاه شما ثبت شد و پس از تایید دکتر حسن مکارمی در سایت نمایش داده خواهد شد.',
    comment_id: newComment.id,
    status: 'pending',
  });
}
