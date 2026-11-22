import crypto from 'node:crypto';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { timingSafeCompare } from '../crypto';

export const STUDIO_SESSION_COOKIE = 'makaremi_studio_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

const DEFAULT_PREVIEW_SECRET = 'makaremi_curator_admin_2026';
const DEFAULT_PREVIEW_PIN = '19502026';

export function getStudioSecretConfiguration(): {
  adminSecret: string;
  professorPin: string | null;
  usingDefaultFallback: boolean;
} {
  const envAdmin = (process.env.CURATION_ADMIN_SECRET || '').trim();
  const envPin = (process.env.MAKAREMI_PROFESSOR_PIN || '').trim();

  if (envAdmin || envPin) {
    return {
      adminSecret: envAdmin || envPin,
      professorPin: envPin || null,
      usingDefaultFallback: false,
    };
  }

  return {
    adminSecret: DEFAULT_PREVIEW_SECRET,
    professorPin: DEFAULT_PREVIEW_PIN,
    usingDefaultFallback: true,
  };
}

function getSigningKey(): Buffer {
  const { adminSecret } = getStudioSecretConfiguration();
  return crypto.createHash('sha256').update(`makaremi-studio-hmac:${adminSecret}`, 'utf-8').digest();
}

function hashDigest(value: string): string {
  return crypto.createHash('sha256').update(value, 'utf-8').digest('hex');
}

export function verifyStudioCredential(candidate: string | null | undefined): boolean {
  const input = (candidate || '').trim();
  if (!input) return false;

  const { adminSecret, professorPin } = getStudioSecretConfiguration();
  const candidateHash = hashDigest(input);

  if (adminSecret && timingSafeCompare(candidateHash, hashDigest(adminSecret))) {
    return true;
  }
  if (professorPin && timingSafeCompare(candidateHash, hashDigest(professorPin))) {
    return true;
  }
  return false;
}

export function createStudioSessionToken(role: 'professor' | 'admin' = 'professor'): string {
  const exp = Date.now() + SESSION_TTL_MS;
  const nonce = crypto.randomBytes(8).toString('hex');
  const payloadB64 = Buffer.from(JSON.stringify({ role, exp, nonce }), 'utf-8').toString('base64url');
  const sig = crypto.createHmac('sha256', getSigningKey()).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function verifyStudioSessionToken(token: string | null | undefined): {
  valid: boolean;
  role?: 'professor' | 'admin';
  expiresAt?: number;
} {
  if (!token || !token.includes('.')) return { valid: false };
  const parts = token.split('.');
  if (parts.length !== 2) return { valid: false };

  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return { valid: false };

  const expectedSig = crypto
    .createHmac('sha256', getSigningKey())
    .update(payloadB64)
    .digest('base64url');

  if (!timingSafeCompare(hashDigest(sigB64), hashDigest(expectedSig))) {
    return { valid: false };
  }

  try {
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8')) as {
      role?: 'professor' | 'admin';
      exp?: number;
    };
    if (!decoded.exp || Date.now() > decoded.exp) {
      return { valid: false };
    }
    return {
      valid: true,
      role: decoded.role || 'professor',
      expiresAt: decoded.exp,
    };
  } catch {
    return { valid: false };
  }
}

export function isStudioRequestAuthorized(request: NextRequest): boolean {
  const headerSecret =
    request.headers.get('x-curation-secret') || request.headers.get('x-studio-secret') || '';
  if (headerSecret && verifyStudioCredential(headerSecret)) {
    return true;
  }

  const cookieToken = request.cookies.get(STUDIO_SESSION_COOKIE)?.value;
  return verifyStudioSessionToken(cookieToken).valid;
}

export async function isStudioPageAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(STUDIO_SESSION_COOKIE)?.value;
    return verifyStudioSessionToken(token).valid;
  } catch {
    return false;
  }
}
