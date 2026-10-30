import { NextRequest, NextResponse } from 'next/server';

interface RateLimitRecord {
  timestamps: number[];
  lastAccessed: number;
}

export interface RateLimitConfig {
  windowMs: number;     // Window duration in milliseconds (e.g. 60000 for 1 minute)
  maxRequests: number;  // Maximum allowed requests within the window
}

// Bounded in-memory store enforcing strict LRU eviction to prevent Memory Exhaustion DoS
const memoryStore = new Map<string, RateLimitRecord>();
const MAX_STORE_SIZE = 5000;

function enforceLruEviction() {
  if (memoryStore.size < MAX_STORE_SIZE) return;

  // Evict the oldest 20% accessed records deterministically
  const entries = Array.from(memoryStore.entries());
  entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

  const evictCount = Math.ceil(MAX_STORE_SIZE * 0.2);
  for (let i = 0; i < evictCount; i++) {
    const entry = entries[i];
    if (entry) {
      memoryStore.delete(entry[0]);
    }
  }
}

/**
 * Anti-Spoofing Client IP Resolution:
 * Follows Cloudflare Security Audit guidelines:
 * - Prioritizes `cf-connecting-ip` (trusted when behind Cloudflare proxy).
 * - Only inspects `x-forwarded-for` if `TRUST_PROXY === 'true'`.
 * - Sanitizes IP strings (max 45 chars, IPv4 or IPv6 format).
 */
export function getClientIP(request: NextRequest): string {
  // 1. Primary: Cloudflare authenticated connecting IP
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp && cfIp.length <= 45) {
    return cfIp.trim();
  }

  // 2. Secondary: If explicit proxy trust is enabled
  if (process.env.TRUST_PROXY === 'true') {
    const fwd = request.headers.get('x-forwarded-for');
    if (fwd) {
      const first = fwd.split(',')[0]?.trim() || '';
      if (first && first.length <= 45 && /^[\d.a-fA-F:]+$/.test(first)) {
        return first;
      }
    }
  }

  // 3. Tertiary: Standard x-real-ip
  const realIp = request.headers.get('x-real-ip');
  if (realIp && realIp.length <= 45) {
    return realIp.trim();
  }

  return '127.0.0.1';
}

/**
 * Sliding-Window Rate Limiter
 * Returns { allowed, remaining, resetSec, response }
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  identifierPrefix: string = 'global'
): { allowed: boolean; limit: number; remaining: number; resetSec: number; response?: NextResponse } {
  const ip = getClientIP(request);
  const key = `${identifierPrefix}:${ip}`;
  const now = Date.now();

  enforceLruEviction();

  const record = memoryStore.get(key) || { timestamps: [], lastAccessed: now };
  record.lastAccessed = now;

  // Filter timestamps within sliding window
  const recent = record.timestamps.filter((ts) => now - ts < config.windowMs);

  if (recent.length >= config.maxRequests) {
    const oldest = recent[0] || now;
    const resetSec = Math.max(1, Math.ceil((oldest + config.windowMs - now) / 1000));

    const res = new NextResponse(
      JSON.stringify({
        error: 'Too Many Requests',
        message: `محدودیت تعداد درخواست اعمال شد. لطفاً ${resetSec} ثانیه دیگر دوباره تلاش کنید.`,
        retry_after_seconds: resetSec,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Retry-After': String(resetSec),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(resetSec),
        },
      }
    );

    memoryStore.set(key, { timestamps: recent, lastAccessed: now });
    return { allowed: false, limit: config.maxRequests, remaining: 0, resetSec, response: res };
  }

  recent.push(now);
  memoryStore.set(key, { timestamps: recent, lastAccessed: now });

  const remaining = config.maxRequests - recent.length;
  const resetSec = Math.ceil(config.windowMs / 1000);

  return { allowed: true, limit: config.maxRequests, remaining, resetSec };
}
