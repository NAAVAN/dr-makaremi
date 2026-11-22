import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { timingSafeCompare } from '../crypto';
import { getOverlaysDir, readOverlayJson, writeOverlayJson } from '../vault-loader';

export const STUDIO_SESSION_COOKIE = 'makaremi_studio_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const OVERRIDES_FILENAME = 'studio-security-overrides.json';

const DEFAULT_PREVIEW_SECRET = 'makaremi_curator_admin_2026';
const DEFAULT_PREVIEW_PIN = '19502026';

export type StudioSessionRole = 'super_admin' | 'professor' | 'admin';

export interface StudioSecurityOverrides {
  professorPinHash?: string | null;
  managementKeyHash?: string | null;
  updatedAt?: string;
  updatedByRole?: StudioSessionRole;
}

export interface StudioSecurityStatus {
  hasCustomPin: boolean;
  hasCustomManagementKey: boolean;
  superAdminProtected: true;
  superAdminKeySource: 'env_super_admin' | 'env_curation_admin' | 'preview_fallback';
  usingDefaultFallback: boolean;
  storageMode: 'persistent_disk' | 'serverless_runtime_tmp';
  updatedAt: string | null;
}

function getImmutableSuperAdminSecrets(): {
  secrets: string[];
  primarySigningSecret: string;
  source: StudioSecurityStatus['superAdminKeySource'];
  usingDefaultFallback: boolean;
} {
  const envSuper = (process.env.SUPER_ADMIN_SECRET || '').trim();
  const envAdmin = (process.env.CURATION_ADMIN_SECRET || '').trim();
  const envPin = (process.env.MAKAREMI_PROFESSOR_PIN || '').trim();

  const secrets: string[] = [];
  if (envSuper) secrets.push(envSuper);
  if (envAdmin && envAdmin !== envSuper) secrets.push(envAdmin);

  // Only keep the public preview fallback key active when no dedicated env secret was configured
  const hasAnyEnvCredential = Boolean(envSuper || envAdmin || envPin);
  if (!hasAnyEnvCredential) {
    secrets.push(DEFAULT_PREVIEW_SECRET);
  }

  const primarySigningSecret = envSuper || envAdmin || envPin || DEFAULT_PREVIEW_SECRET;
  const source: StudioSecurityStatus['superAdminKeySource'] = envSuper
    ? 'env_super_admin'
    : envAdmin
      ? 'env_curation_admin'
      : 'preview_fallback';

  return {
    secrets,
    primarySigningSecret,
    source,
    usingDefaultFallback: !hasAnyEnvCredential,
  };
}

function loadSecurityOverrides(): StudioSecurityOverrides {
  return readOverlayJson<StudioSecurityOverrides>(OVERRIDES_FILENAME, {});
}

function isWritablePersistentStorage(): boolean {
  try {
    const dir = getOverlaysDir();
    fs.mkdirSync(dir, { recursive: true });
    const probe = path.join(dir, '.write-probe');
    fs.writeFileSync(probe, 'ok', 'utf8');
    fs.unlinkSync(probe);
    return true;
  } catch {
    return false;
  }
}

function hashStudioSecret(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plain, salt, 32).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

function verifySaltedSecretHash(candidate: string, stored: string | null | undefined): boolean {
  if (!stored || !stored.startsWith('scrypt$')) return false;
  const parts = stored.split('$');
  if (parts.length !== 3) return false;
  const [, salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  try {
    const derivedHex = crypto.scryptSync(candidate, salt, 32).toString('hex');
    return timingSafeCompare(derivedHex, expectedHex);
  } catch {
    return false;
  }
}

export function getStudioSecretConfiguration(): {
  adminSecret: string;
  professorPin: string | null;
  usingDefaultFallback: boolean;
} {
  const envAdmin = (process.env.CURATION_ADMIN_SECRET || '').trim();
  const envPin = (process.env.MAKAREMI_PROFESSOR_PIN || '').trim();
  const { usingDefaultFallback, primarySigningSecret } = getImmutableSuperAdminSecrets();

  if (envAdmin || envPin) {
    return {
      adminSecret: envAdmin || envPin || primarySigningSecret,
      professorPin: envPin || null,
      usingDefaultFallback: false,
    };
  }

  return {
    adminSecret: DEFAULT_PREVIEW_SECRET,
    professorPin: DEFAULT_PREVIEW_PIN,
    usingDefaultFallback,
  };
}

function getSigningKey(): Buffer {
  // Always sign session tokens with the immutable root secret so rotating PIN/key
  // in the Pishkhan never invalidates active sessions or Super-Admin headers.
  const { primarySigningSecret } = getImmutableSuperAdminSecrets();
  return crypto
    .createHash('sha256')
    .update(`makaremi-studio-hmac:${primarySigningSecret}`, 'utf-8')
    .digest();
}

function hashDigest(value: string): string {
  return crypto.createHash('sha256').update(value, 'utf-8').digest('hex');
}

export function verifyStudioCredentialWithRole(candidate: string | null | undefined): {
  valid: boolean;
  role?: StudioSessionRole;
} {
  const input = (candidate || '').trim();
  if (!input) return { valid: false };

  const inputHash = hashDigest(input);

  // 1. Immutable Super-Admin Master Credentials ALWAYS checked first and NEVER locked out
  const { secrets } = getImmutableSuperAdminSecrets();
  for (const masterSecret of secrets) {
    if (timingSafeCompare(inputHash, hashDigest(masterSecret))) {
      return { valid: true, role: 'super_admin' };
    }
  }

  // 2. Runtime-configurable Management Key & Professor PIN in Pishkhan overrides
  const overrides = loadSecurityOverrides();

  if (overrides.managementKeyHash && verifySaltedSecretHash(input, overrides.managementKeyHash)) {
    return { valid: true, role: 'admin' };
  }

  if (overrides.professorPinHash) {
    if (verifySaltedSecretHash(input, overrides.professorPinHash)) {
      return { valid: true, role: 'professor' };
    }
    // Custom PIN is active, so legacy default/env PIN is rotated out
    return { valid: false };
  }

  // 3. Fallback to initial configured Professor PIN when no custom PIN override is stored
  const { professorPin } = getStudioSecretConfiguration();
  if (professorPin && timingSafeCompare(inputHash, hashDigest(professorPin))) {
    return { valid: true, role: 'professor' };
  }

  return { valid: false };
}

export function verifyStudioCredential(candidate: string | null | undefined): boolean {
  return verifyStudioCredentialWithRole(candidate).valid;
}

export function getStudioSecurityStatus(): StudioSecurityStatus {
  const overrides = loadSecurityOverrides();
  const { source, usingDefaultFallback } = getImmutableSuperAdminSecrets();
  return {
    hasCustomPin: Boolean(overrides.professorPinHash),
    hasCustomManagementKey: Boolean(overrides.managementKeyHash),
    superAdminProtected: true,
    superAdminKeySource: source,
    usingDefaultFallback,
    storageMode: isWritablePersistentStorage() ? 'persistent_disk' : 'serverless_runtime_tmp',
    updatedAt: overrides.updatedAt || null,
  };
}

export function updateStudioSecurityCredentials(input: {
  newPin?: string;
  newManagementKey?: string;
  updatedByRole?: StudioSessionRole;
}): StudioSecurityStatus {
  const current = loadSecurityOverrides();
  const next: StudioSecurityOverrides = {
    ...current,
    updatedAt: new Date().toISOString(),
    updatedByRole: input.updatedByRole || 'professor',
  };

  if (input.newPin !== undefined && input.newPin.trim().length >= 4) {
    next.professorPinHash = hashStudioSecret(input.newPin.trim());
  }

  if (input.newManagementKey !== undefined && input.newManagementKey.trim().length >= 8) {
    next.managementKeyHash = hashStudioSecret(input.newManagementKey.trim());
  }

  writeOverlayJson(OVERRIDES_FILENAME, next);
  return getStudioSecurityStatus();
}

export function resetStudioSecurityCredentials(): StudioSecurityStatus {
  writeOverlayJson<StudioSecurityOverrides>(OVERRIDES_FILENAME, {
    professorPinHash: null,
    managementKeyHash: null,
    updatedAt: new Date().toISOString(),
  });
  return getStudioSecurityStatus();
}

export function createStudioSessionToken(role: StudioSessionRole = 'professor'): string {
  const exp = Date.now() + SESSION_TTL_MS;
  const nonce = crypto.randomBytes(8).toString('hex');
  const payloadB64 = Buffer.from(JSON.stringify({ role, exp, nonce }), 'utf-8').toString('base64url');
  const sig = crypto.createHmac('sha256', getSigningKey()).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function verifyStudioSessionToken(token: string | null | undefined): {
  valid: boolean;
  role?: StudioSessionRole;
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
      role?: StudioSessionRole;
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

export function getStudioRequestAuthInfo(request: NextRequest): {
  authorized: boolean;
  role?: StudioSessionRole;
} {
  const headerSecret =
    request.headers.get('x-curation-secret') || request.headers.get('x-studio-secret') || '';
  if (headerSecret) {
    const res = verifyStudioCredentialWithRole(headerSecret);
    if (res.valid) {
      return { authorized: true, role: res.role };
    }
  }

  const cookieToken = request.cookies.get(STUDIO_SESSION_COOKIE)?.value;
  const session = verifyStudioSessionToken(cookieToken);
  if (session.valid) {
    return { authorized: true, role: session.role };
  }

  return { authorized: false };
}

export function isStudioRequestAuthorized(request: NextRequest): boolean {
  return getStudioRequestAuthInfo(request).authorized;
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
