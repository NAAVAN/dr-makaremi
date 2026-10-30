import type { Article, Locale } from '@makaremi/shared';
import {
  buildCanonicalString,
  computeCanonicalSha256,
  signWithEd25519,
  verifyEd25519Signature,
  OFFICIAL_DR_MAKAREMI_PUBLIC_KEY,
} from './crypto';

export interface ImmutableSnapshot {
  slug: string;
  locale: Locale;
  article: Article;
  canonical_sha256: string;
  signature_ed25519: string;
  verified_public_key: string;
  snapshot_timestamp: string;
}

export { OFFICIAL_DR_MAKAREMI_PUBLIC_KEY };

// -----------------------------------------------------------------------------
// Helper to create and freeze a mathematically signed snapshot
// -----------------------------------------------------------------------------
export function createSignedSnapshot(article: Article, primaryLocale: Locale = 'fa'): ImmutableSnapshot {
  const trans =
    article.translations?.find((t) => t.languages_code.startsWith(primaryLocale)) ||
    article.translations?.[0];

  const canonicalString = buildCanonicalString({
    slug: article.slug,
    locale: primaryLocale,
    title: trans?.title || article.slug,
    body_markdown: trans?.body_markdown || '',
    published_at: article.published_at || article.created_at,
  });

  const sha256 = computeCanonicalSha256(canonicalString);
  const signature = signWithEd25519(canonicalString);

  // Freeze deep copy with signature
  const frozenArticle: Article = {
    ...article,
    content_sha256: sha256,
    signature_ed25519: signature,
    canonical_digest: sha256,
  };

  return {
    slug: article.slug,
    locale: primaryLocale,
    article: Object.freeze(JSON.parse(JSON.stringify(frozenArticle))),
    canonical_sha256: sha256,
    signature_ed25519: signature,
    verified_public_key: OFFICIAL_DR_MAKAREMI_PUBLIC_KEY,
    snapshot_timestamp: article.published_at || article.created_at,
  };
}

// -----------------------------------------------------------------------------
// Pre-populated registry of immutable, verified snapshots for sensitive content
// -----------------------------------------------------------------------------
export const VERIFIED_IMMUTABLE_SNAPSHOTS: Record<string, ImmutableSnapshot> = {};

export function registerImmutableSnapshot(article: Article, locale: Locale = 'fa'): ImmutableSnapshot {
  const snapshot = createSignedSnapshot(article, locale);
  VERIFIED_IMMUTABLE_SNAPSHOTS[`${article.slug}:${locale}`] = snapshot;
  if (locale === 'fa' || !VERIFIED_IMMUTABLE_SNAPSHOTS[article.slug]) {
    VERIFIED_IMMUTABLE_SNAPSHOTS[article.slug] = snapshot;
  }
  return snapshot;
}

/**
 * Actively inspects an article's cryptographic integrity and self-heals by
 * falling back to the verified immutable snapshot if tampering is detected.
 */
export function inspectAndSelfHeal(
  candidateArticle: Article,
  locale: Locale = 'fa'
): { article: Article; isTampered: boolean; source: 'database' | 'immutable_snapshot' } {
  const trans =
    candidateArticle.translations?.find((t) => t.languages_code.startsWith(locale)) ||
    candidateArticle.translations?.[0];

  if (!trans) {
    return { article: candidateArticle, isTampered: false, source: 'database' };
  }

  const canonicalStr = buildCanonicalString({
    slug: candidateArticle.slug,
    locale,
    title: trans.title,
    body_markdown: trans.body_markdown,
    published_at: candidateArticle.published_at || candidateArticle.created_at,
  });

  const expectedSha256 = computeCanonicalSha256(canonicalStr);
  const snapshotKey = `${candidateArticle.slug}:${locale}`;
  const snapshot = VERIFIED_IMMUTABLE_SNAPSHOTS[snapshotKey] || VERIFIED_IMMUTABLE_SNAPSHOTS[candidateArticle.slug];

  const candidateSig = candidateArticle.signature_ed25519;
  let isValid = false;

  if (candidateSig) {
    isValid = verifyEd25519Signature(canonicalStr, candidateSig, OFFICIAL_DR_MAKAREMI_PUBLIC_KEY);
  }

  // If candidate is missing or has invalid signature or content_sha256 mismatches
  if (!isValid || candidateArticle.content_sha256 !== expectedSha256) {
    if (snapshot) {
      const snapshotTrans =
        snapshot.article.translations?.find((t) => t.languages_code.startsWith(locale)) ||
        snapshot.article.translations?.[0];

      const isContentAltered =
        Boolean(snapshotTrans) &&
        (trans.title !== snapshotTrans?.title || trans.body_markdown !== snapshotTrans?.body_markdown);

      if (isContentAltered) {
        console.error(
          `[CRITICAL_TAMPER_ALERT] Unauthorized alteration detected on article "${candidateArticle.slug}" (${locale}). Restoring verified snapshot.`
        );
      }

      // Return article equipped with valid signature & sha256 for this locale
      const healedArticle: Article = {
        ...candidateArticle,
        content_sha256: snapshot.canonical_sha256,
        signature_ed25519: snapshot.signature_ed25519,
        canonical_digest: snapshot.canonical_sha256,
        translations: isContentAltered ? snapshot.article.translations : candidateArticle.translations,
      };

      return {
        article: healedArticle,
        isTampered: isContentAltered,
        source: 'immutable_snapshot',
      };
    }
  }

  return { article: candidateArticle, isTampered: false, source: 'database' };
}
