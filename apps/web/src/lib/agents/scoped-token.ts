import crypto from 'node:crypto';
import {
  ALLOWED_AGENT_PERMISSIONS,
  PROHIBITED_DESTRUCTIVE_OPERATIONS,
  type AgentPermission,
  type ProhibitedOperation,
  type ScopedAgentToken,
} from './types';

const TOKEN_SECRET =
  process.env.AGENT_TOKEN_SECRET ||
  process.env.MAKAREMI_SIGNING_KEY ||
  'makaremi-scoped-agent-token-secret-2026-edge';

/**
 * Custom Security Error to denote forbidden or unauthorized agent attempts.
 */
export class AgentSecurityError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number = 403) {
    super(message);
    this.name = 'AgentSecurityError';
    this.statusCode = statusCode;
  }
}

/**
 * Issues a cryptographically signed, least-privilege scoped token for Dr. Makaremi's agent.
 * Expiration defaults to 24 hours (86,400,000 ms).
 */
export function issueScopedAgentToken(
  issuedTo: string,
  channel: 'telegram' | 'whatsapp' | 'console',
  permissions: AgentPermission[] = [...ALLOWED_AGENT_PERMISSIONS],
  ttlMs: number = 86400000
): { tokenString: string; tokenObj: ScopedAgentToken } {
  // Validate that no prohibited permissions exist
  const safePermissions = permissions.filter((p) =>
    (ALLOWED_AGENT_PERMISSIONS as readonly string[]).includes(p)
  );

  const now = Date.now();
  const tokenObj: ScopedAgentToken = {
    tokenId: `agt_${crypto.randomUUID()}`,
    issuedTo,
    channel,
    permissions: safePermissions,
    createdAt: now,
    expiresAt: now + ttlMs,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(tokenObj), 'utf-8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payloadBase64)
    .digest('base64url');

  const tokenString = `${payloadBase64}.${signature}`;
  return { tokenString, tokenObj };
}

/**
 * Parses and cryptographically verifies a scoped agent token string.
 */
export function verifyScopedTokenString(tokenString: string): ScopedAgentToken {
  if (!tokenString || typeof tokenString !== 'string') {
    throw new AgentSecurityError('Missing or invalid token format', 401);
  }

  const parts = tokenString.split('.');
  if (parts.length !== 2) {
    throw new AgentSecurityError('Malformed agent token', 401);
  }

  const [payloadBase64, providedSig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payloadBase64)
    .digest('base64url');

  const a = crypto.createHash('sha256').update(providedSig).digest();
  const b = crypto.createHash('sha256').update(expectedSig).digest();
  if (!crypto.timingSafeEqual(a, b)) {
    throw new AgentSecurityError('Invalid agent token signature', 401);
  }

  try {
    const tokenObj = JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString('utf-8')
    ) as ScopedAgentToken;

    if (Date.now() > tokenObj.expiresAt) {
      throw new AgentSecurityError('Agent token has expired', 401);
    }

    return tokenObj;
  } catch (err: unknown) {
    if (err instanceof AgentSecurityError) throw err;
    throw new AgentSecurityError('Failed to parse token payload', 401);
  }
}

/**
 * Enforces permission checks and STRICTLY blocks destructive/deletion operations.
 *
 * Mandatory Refinement: Any attempt to execute `DELETE_POST`, `DROP_COLLECTION`,
 * `REVOKE_KEYS` or modify historic archives is blocked at the core with 403 Forbidden.
 */
export function assertAgentPermission(
  token: ScopedAgentToken,
  requiredPermission: AgentPermission | ProhibitedOperation | string
): void {
  // 1. Core Rule: Intercept any destructive/deletion keyword
  const upperOp = requiredPermission.toUpperCase();
  const isDestructive =
    (PROHIBITED_DESTRUCTIVE_OPERATIONS as readonly string[]).includes(upperOp) ||
    upperOp.startsWith('DELETE') ||
    upperOp.startsWith('DROP') ||
    upperOp.includes('REVOKE') ||
    upperOp.includes('PURGE');

  if (isDestructive) {
    throw new AgentSecurityError(
      `403 Forbidden: Destructive operations (${requiredPermission}) are strictly prohibited for agent roles`,
      403
    );
  }

  // 2. Check if token contains the specific required permission
  if (!token.permissions.includes(requiredPermission as AgentPermission)) {
    throw new AgentSecurityError(
      `403 Forbidden: Agent token lacks required permission [${requiredPermission}]`,
      403
    );
  }
}
