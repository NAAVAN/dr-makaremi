import { NextRequest, NextResponse } from 'next/server';
import {
  ALLOWED_MEDIA_HOSTS,
  isAllowlistedMediaUrl,
  normalizeExternalMediaUrl,
  type MediaFallbackKind,
} from '@/lib/media-url';

const MAX_IMAGE_BYTES = 12 * 1024 * 1024; // 12 MB safety ceiling

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildArchivalPlaceholderSvg(kind: MediaFallbackKind, rawTitle?: string | null): string {
  const safeTitle = escapeXml((rawTitle || '').trim().slice(0, 56));
  const subtitle =
    kind === 'video'
      ? 'ARCHIVAL FILM &amp; LECTURE'
      : kind === 'art'
        ? 'CALLIGRAPHY &amp; VISUAL ARCHIVE'
        : kind === 'book'
          ? 'MONOGRAPH ARCHIVE'
          : 'MAKAREMI CULTURAL ARCHIVE';

  const emblem =
    kind === 'video'
      ? `<circle cx="320" cy="180" r="34" fill="rgba(15,118,110,0.22)" stroke="#c59b43" stroke-width="2"/>
         <polygon points="311,164 311,196 339,180" fill="#c59b43"/>`
      : `<path d="M210 190 C255 120, 295 235, 330 165 C365 110, 400 205, 435 170" fill="none" stroke="#c59b43" stroke-width="3" stroke-linecap="round" opacity="0.88"/>
         <circle cx="320" cy="166" r="4.5" fill="#c59b43"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 380" role="img" aria-label="${safeTitle || subtitle}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#172026"/>
      <stop offset="55%" stop-color="#1f2930"/>
      <stop offset="100%" stop-color="#13221f"/>
    </linearGradient>
  </defs>
  <rect width="640" height="380" fill="url(#bg)"/>
  <rect x="20" y="20" width="600" height="340" rx="14" fill="none" stroke="rgba(197,155,67,0.32)" stroke-width="1.2"/>
  ${emblem}
  <text x="320" y="255" text-anchor="middle" fill="#d4b46b" font-family="ui-monospace, SFMono-Regular, monospace" font-size="11" letter-spacing="2.2">${subtitle}</text>
  ${
    safeTitle
      ? `<text x="320" y="286" text-anchor="middle" fill="#f3efe6" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700">${safeTitle}</text>`
      : ''
  }
</svg>`;
}

function respondPlaceholder(kind: MediaFallbackKind, title?: string | null) {
  const svg = buildArchivalPlaceholderSvg(kind, title);
  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function buildCandidateFetchUrls(primaryUrl: string): string[] {
  const candidates: string[] = [primaryUrl];
  try {
    const parsed = new URL(primaryUrl);
    // Prefer HTTPS variant too if legacy archive recorded http:// for an HTTPS-capable host
    if (parsed.protocol === 'http:') {
      const httpsVariant = new URL(primaryUrl);
      httpsVariant.protocol = 'https:';
      candidates.unshift(httpsVariant.toString());
    }

    // YouTube thumbnail quality cascade for deleted/low-res streams where hqdefault returns 404
    const ytMatch =
      parsed.hostname.toLowerCase() === 'i.ytimg.com'
        ? parsed.pathname.match(/^\/vi\/([^/]+)\/[^/]+$/)
        : null;
    if (ytMatch?.[1]) {
      const vidId = ytMatch[1];
      for (const variant of ['mqdefault.jpg', 'sddefault.jpg', '0.jpg']) {
        const alt = `https://i.ytimg.com/vi/${vidId}/${variant}`;
        if (!candidates.includes(alt)) candidates.push(alt);
      }
    }
  } catch {
    // keep primaryUrl only
  }
  return candidates;
}

async function fetchAllowlistedImage(startUrl: string): Promise<{
  bytes: ArrayBuffer;
  contentType: string;
} | null> {
  let currentUrl = startUrl;

  for (let hop = 0; hop <= 3; hop++) {
    if (!isAllowlistedMediaUrl(currentUrl)) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    try {
      const res = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          'User-Agent': 'MakaremiArchiveProxy/1.0 (+https://makaremi.com)',
        },
      });
      clearTimeout(timer);

      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location');
        if (!loc) return null;
        const resolvedRedirect = new URL(loc, currentUrl).toString();
        if (!ALLOWED_MEDIA_HOSTS.has(new URL(resolvedRedirect).hostname.toLowerCase())) {
          return null;
        }
        currentUrl = resolvedRedirect;
        continue;
      }

      if (!res.ok) return null;

      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (!contentType.startsWith('image/')) return null;

      const lenHeader = Number(res.headers.get('content-length') || '0');
      if (lenHeader > MAX_IMAGE_BYTES) return null;

      const bytes = await res.arrayBuffer();
      if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) return null;

      return { bytes, contentType };
    } catch {
      clearTimeout(timer);
      return null;
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const rawUrl = searchParams.get('url');
  const rawKind = (searchParams.get('kind') || 'archive').toLowerCase();
  const kind: MediaFallbackKind =
    rawKind === 'art' || rawKind === 'video' || rawKind === 'book' ? rawKind : 'archive';
  const title = searchParams.get('title');

  if (!rawUrl) {
    return respondPlaceholder(kind, title);
  }

  const normalized = normalizeExternalMediaUrl(rawUrl);
  if (!isAllowlistedMediaUrl(normalized)) {
    return NextResponse.json(
      { ok: false, error: 'Media host is not on archival allowlist' },
      { status: 403, headers: { 'X-Content-Type-Options': 'nosniff' } }
    );
  }

  const candidates = buildCandidateFetchUrls(normalized);
  for (const candidate of candidates) {
    const result = await fetchAllowlistedImage(candidate);
    if (result) {
      return new NextResponse(result.bytes, {
        status: 200,
        headers: {
          'Content-Type': result.contentType,
          'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }
  }

  return respondPlaceholder(kind, title);
}
