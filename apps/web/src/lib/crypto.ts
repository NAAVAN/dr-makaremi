import crypto from 'node:crypto';

export interface CanonicalPayloadData {
  slug: string;
  locale: string;
  title: string;
  body_markdown: string;
  published_at?: string | null;
}

// -----------------------------------------------------------------------------
// Official Asymmetric Ed25519 Cryptographic Keys for Dr. Hassan Makaremi
// -----------------------------------------------------------------------------
export const OFFICIAL_DR_MAKAREMI_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEA6+ZKeJbMIiBf0Z4fMh7yX9aL+5VzyF8kj4phQe1P20s=
-----END PUBLIC KEY-----
`.trim();

// Server-side only private key used for authoritative signing
const SERVER_SIGNING_KEY_PEM =
  process.env.MAKAREMI_SIGNING_KEY ||
  `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEICRpj7m4qfhepjr/c9iUdQqGEU2sxjBE1A45vBSQ39IL
-----END PRIVATE KEY-----
`.trim();

/**
 * Deterministic Canonical Serialization for articles and statements.
 * Normalizes newlines (CRLF -> LF) and trims outer whitespace.
 */
export function buildCanonicalString(data: CanonicalPayloadData): string {
  const normalizedBody = (data.body_markdown || '').replace(/\r\n/g, '\n').trim();
  const normalizedTitle = (data.title || '').trim();
  const normalizedDate = (data.published_at || '').trim();

  return [
    `SLUG:${data.slug.trim()}`,
    `LOCALE:${data.locale.trim()}`,
    `TITLE:${normalizedTitle}`,
    `DATE:${normalizedDate}`,
    `BODY:${normalizedBody}`,
  ].join('\n--CANONICAL_BOUNDARY--\n');
}

/**
 * Computes deterministic SHA-256 digest of the canonical string.
 */
export function computeCanonicalSha256(canonicalString: string): string {
  return crypto.createHash('sha256').update(canonicalString, 'utf-8').digest('hex');
}

/**
 * Computes asymmetric Ed25519 digital signature over canonical string.
 */
export function signWithEd25519(
  canonicalString: string,
  privateKeyPem: string = SERVER_SIGNING_KEY_PEM
): string {
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  const signature = crypto.sign(null, Buffer.from(canonicalString, 'utf-8'), privateKey);
  return signature.toString('base64');
}

/**
 * Mathematically verifies an Ed25519 digital signature against the public key.
 */
export function verifyEd25519Signature(
  canonicalString: string,
  signatureBase64: string,
  publicKeyPem: string = OFFICIAL_DR_MAKAREMI_PUBLIC_KEY
): boolean {
  try {
    const publicKey = crypto.createPublicKey(publicKeyPem);
    const signature = Buffer.from(signatureBase64, 'base64');
    return crypto.verify(null, Buffer.from(canonicalString, 'utf-8'), publicKey, signature);
  } catch {
    return false;
  }
}

/**
 * Timing-safe string equality comparison to prevent side-channel timing attacks.
 */
export function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'utf-8'), Buffer.from(b, 'utf-8'));
}
