import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getArticleBySlug } from '@/lib/cms';
import { checkRateLimit } from '@/lib/rate-limit';

const BundleQuerySchema = z.object({
  slug: z.string().trim().min(1).max(128).regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  locale: z.enum(['fa', 'fr', 'en']).default('fa'),
  type: z.enum(['article', 'speech', 'book', 'poem']).default('article'),
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function GET(request: NextRequest) {
  // 1. Sliding-window rate limit: 20 bundles per minute
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 20 }, 'bundle');
  if (!rl.allowed) return rl.response!;

  const { searchParams } = request.nextUrl;
  const parsed = BundleQuerySchema.safeParse({
    slug: searchParams.get('slug'),
    locale: searchParams.get('locale') || 'fa',
    type: searchParams.get('type') || 'article',
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { slug, locale } = parsed.data;
  const article = await getArticleBySlug(slug, locale);

  if (!article) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  const trans =
    article.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    article.translations?.[0];

  const safeTitle = escapeHtml(trans?.title || article.slug);
  const safeExecutiveSummary = escapeHtml(trans?.executive_summary || '');
  const safeSha256 = escapeHtml(article.content_sha256 || '');
  const safeSignature = escapeHtml(article.signature_ed25519 || '');
  const safeDate = escapeHtml(article.published_at || article.created_at);

  // Convert markdown paragraphs into safe HTML paragraphs
  const safeBodyParagraphs = (trans?.body_markdown || '')
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((para) => `<p>${escapeHtml(para.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('\n');

  const dir = locale === 'fa' ? 'rtl' : 'ltr';

  const htmlBundle = `<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:;">
  <title>${safeTitle} — دکتر حسن مکارمی (بسته آفلاین ضدسانسور)</title>
  <style>
    :root { color-scheme: light dark; }
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.8;
      max-width: 820px;
      margin: 2rem auto;
      padding: 0 1.5rem;
      background: #faf8f5;
      color: #1e293b;
    }
    @media (prefers-color-scheme: dark) {
      body { background: #090d16; color: #e2e8f0; }
      blockquote { background: #131b2e !important; color: #94a3b8; }
      .badge { background: #0f172a !important; border-color: #334155 !important; }
    }
    h1 {
      font-size: 1.85rem;
      color: #0f172a;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 0.75rem;
      margin-top: 1rem;
    }
    @media (prefers-color-scheme: dark) { h1 { color: #f8fafc; } }
    blockquote {
      border-inline-start: 4px solid #0284c7;
      margin: 1.5rem 0;
      padding: 0.75rem 1.25rem;
      background: #f1f5f9;
      font-size: 1.05rem;
      border-radius: 4px;
    }
    p { margin-bottom: 1.25rem; font-size: 1.05rem; text-align: justify; }
    .badge {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      background: #e2e8f0;
      border: 1px solid #cbd5e1;
      padding: 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      word-break: break-all;
      margin-top: 3rem;
      line-height: 1.6;
    }
    .badge-title { font-weight: bold; color: #0284c7; margin-bottom: 0.5rem; display: block; }
  </style>
</head>
<body>
  <header>
    <small style="color: #64748b;">MAKAREMI-OFFLINE-SURVIVAL-BUNDLE // STANDALONE SECURITY ARCHIVE</small>
    <h1>${safeTitle}</h1>
    <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 1rem;">
      مؤلف: دکتر حسن مکارمی | تاریخ: ${safeDate}
    </div>
  </header>
  ${safeExecutiveSummary ? `<blockquote>${safeExecutiveSummary}</blockquote>` : ''}
  <main>
    ${safeBodyParagraphs}
  </main>
  <footer>
    <div class="badge">
      <span class="badge-title">🔒 ED25519 CRYPTOGRAPHIC SIGNATURE & SHA-256 DIGEST (امضای دیجیتال تغییرناپذیر)</span>
      <strong>SHA-256 Digest:</strong> ${safeSha256}<br>
      <strong>Ed25519 Signature:</strong> ${safeSignature}<br>
      <strong>Public Key Verification:</strong> https://makaremi.com/.well-known/makaremi-public-key.pem<br>
      <strong>روش توزیع:</strong> این سند کاملاً مستقل بوده و بدون اتصال اینترنت در هر دستگاه یا مرورگری قابل مطالعه است. اشتراک‌گذاری از طریق فایل تلگرام، بلوتوث، ایردراپ یا حافظه فلش توصیه می‌شود.
    </div>
  </footer>
</body>
</html>`;

  // Safe filename with strict alphanumeric characters
  const safeFilename = `makaremi-bundle-${slug}-${locale}.html`;

  return new NextResponse(htmlBundle, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safeFilename}"`,
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      'X-Robots-Tag': 'noindex',
    },
  });
}
