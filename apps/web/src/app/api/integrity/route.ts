import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getArticleBySlug } from '@/lib/cms';
import {
  buildCanonicalString,
  computeCanonicalSha256,
  verifyEd25519Signature,
  OFFICIAL_DR_MAKAREMI_PUBLIC_KEY,
} from '@/lib/crypto';
import { checkRateLimit } from '@/lib/rate-limit';

const QuerySchema = z.object({
  slug: z.string().trim().min(1).max(128).regex(/^[a-z0-9-]+$/),
  locale: z.enum(['fa', 'fr', 'en']).default('fa'),
});

export async function GET(request: NextRequest) {
  // 1. Sliding-window rate limit: 60 requests per minute
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 60 }, 'integrity');
  if (!rl.allowed) return rl.response!;

  const { searchParams } = request.nextUrl;
  const parsed = QuerySchema.safeParse({
    slug: searchParams.get('slug'),
    locale: searchParams.get('locale') || 'fa',
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

  const canonicalString = buildCanonicalString({
    slug: article.slug,
    locale,
    title: trans?.title || article.slug,
    body_markdown: trans?.body_markdown || '',
    published_at: article.published_at || article.created_at,
  });

  const sha256 = computeCanonicalSha256(canonicalString);
  const signature = article.signature_ed25519 || '';
  const isVerified = signature
    ? verifyEd25519Signature(canonicalString, signature, OFFICIAL_DR_MAKAREMI_PUBLIC_KEY)
    : false;

  return NextResponse.json(
    {
      slug: article.slug,
      locale,
      algorithm: 'Ed25519-SHA256',
      canonical_sha256: sha256,
      signature_ed25519: signature,
      public_key_url: 'https://makaremi.com/.well-known/makaremi-public-key.pem',
      verified: isVerified,
      signed_at: article.published_at || article.created_at,
      cli_verification_cmd: `curl -s https://makaremi.com/${locale}/psychoanalysis/articles/${slug}.md | openssl dgst -sha256`,
    },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'X-Robots-Tag': 'all',
        'X-RateLimit-Limit': String(rl.limit),
        'X-RateLimit-Remaining': String(rl.remaining),
      },
    }
  );
}
