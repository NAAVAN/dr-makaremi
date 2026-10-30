import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { STATIC_LEGACY_REDIRECTS } from '@makaremi/shared';

const SUPPORTED_LOCALES = ['fa', 'fr', 'en'] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE: Locale = 'fa';

const CANONICAL_HOST = 'makaremi.com';
const CANONICAL_REDIRECT_HOSTS = new Set([
  'makaremi.net',
  'www.makaremi.net',
  'www.makaremi.com',
]);

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  
  // Extract and normalize host (strip port and convert to lowercase)
  const rawHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const host = rawHost.split(':')[0].toLowerCase();

  // 1. Host Canonicalization: Redirect makaremi.net and www.makaremi.com to https://makaremi.com (301 Moved Permanently)
  // Strict matching against whitelist to prevent Host Header Poisoning
  if (CANONICAL_REDIRECT_HOSTS.has(host)) {
    // Sanitize path against double-slash open redirect bypass
    const safePath = pathname.replace(/^\/+/, '/');
    const targetUrl = new URL(`https://${CANONICAL_HOST}${safePath}${search}`);
    return NextResponse.redirect(targetUrl, 301);
  }

  // 2. Bypass static assets, internal APIs, fonts, and bot definitions
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/.well-known') ||
    pathname.startsWith('/fonts') ||
    pathname.startsWith('/icons') ||
    pathname === '/favicon.ico' ||
    pathname === '/sw.js' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/llms.txt' ||
    pathname === '/llms-full.txt' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  // 3. Intercept Markdown Twin Requests (*.md) for AEO / GEO AI Agents
  if (pathname.endsWith('.md')) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = '/api/markdown';
    rewriteUrl.searchParams.set('path', pathname);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-markdown-path', pathname);
    return NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 3. Match legacy WordPress URLs: Check raw cleanPath and decodedURIComponent cleanPath (Refinement 2)
  const cleanPath = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  let decodedPath = cleanPath;
  try {
    decodedPath = decodeURIComponent(cleanPath);
  } catch {
    // Keep cleanPath if decoding fails
  }

  if (STATIC_LEGACY_REDIRECTS[cleanPath]) {
    const destination = STATIC_LEGACY_REDIRECTS[cleanPath];
    return NextResponse.redirect(new URL(destination, `https://${CANONICAL_HOST}`), 301);
  }

  if (STATIC_LEGACY_REDIRECTS[decodedPath]) {
    const destination = STATIC_LEGACY_REDIRECTS[decodedPath];
    return NextResponse.redirect(new URL(destination, `https://${CANONICAL_HOST}`), 301);
  }

  // 4. Multi-language locale routing (/fa, /fr, /en) and dir="rtl|ltr" header injection
  const pathnameHasLocale = SUPPORTED_LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    // Sanitize path against multiple leading slashes (e.g. //evil.com -> /evil.com)
    const sanitizedPath = pathname.replace(/^\/+/, '/');
    const targetPath = sanitizedPath === '/' ? `/${DEFAULT_LOCALE}` : `/${DEFAULT_LOCALE}${sanitizedPath}`;
    
    // Safely clone nextUrl to prevent open redirect via request.url header spoofing
    const localeUrl = request.nextUrl.clone();
    localeUrl.pathname = targetPath;
    return NextResponse.redirect(localeUrl, 308);
  }

  const currentLocale = pathname.split('/')[1] as Locale;
  const direction = currentLocale === 'fa' ? 'rtl' : 'ltr';

  const response = NextResponse.next();
  response.headers.set('X-Content-Locale', currentLocale);
  response.headers.set('X-Content-Direction', direction);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
