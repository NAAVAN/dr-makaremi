import { NextRequest } from 'next/server';
import crypto from 'node:crypto';

export interface CloudflareAccessIdentity {
  email: string;
  user_uuid: string;
  country: string;
}

const CERTS_URL =
  process.env.CF_ACCESS_CERTS_URL ||
  'https://makaremi.cloudflareaccess.com/cdn-cgi/access/certs';
const EXPECTED_AUD = process.env.CF_ACCESS_AUD || '';

let cachedKeys: Record<string, string> = {};
let certsLastFetched = 0;

async function getPublicKey(kid: string): Promise<string | null> {
  const now = Date.now();
  if (now - certsLastFetched > 3600000 || !cachedKeys[kid]) {
    try {
      const res = await fetch(CERTS_URL, { next: { revalidate: 3600 } });
      if (!res.ok) return null;
      const data = await res.json();
      const keys: Record<string, string> = {};
      for (const k of data.keys || []) {
        const jwkObj = crypto.createPublicKey({ format: 'jwk', key: k });
        keys[k.kid] = jwkObj.export({ type: 'spki', format: 'pem' }) as string;
      }
      cachedKeys = keys;
      certsLastFetched = now;
    } catch {
      return null;
    }
  }
  return cachedKeys[kid] || null;
}

/**
 * Validates Cloudflare Access JWT assertions (`Cf-Access-Jwt-Assertion`)
 * for sensitive administrative operations or protected CMS hooks.
 */
export async function verifyCloudflareAccessJWT(
  request: NextRequest
): Promise<CloudflareAccessIdentity | null> {
  const jwt = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!jwt) return null;

  const parts = jwt.split('.');
  if (parts.length !== 3) return null;

  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf-8'));
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));

    // Check expiration
    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSec) return null;

    // Check application audience (AUD)
    if (EXPECTED_AUD && payload.aud && !payload.aud.includes(EXPECTED_AUD)) return null;

    // Verify signature using Cloudflare's JWKS
    const pem = await getPublicKey(header.kid);
    if (!pem) return null;

    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(`${parts[0]}.${parts[1]}`);
    const valid = verify.verify(pem, Buffer.from(parts[2], 'base64url'));

    if (!valid) return null;

    return {
      email: payload.email || '',
      user_uuid: payload.sub || '',
      country: payload.country || '',
    };
  } catch {
    return null;
  }
}
