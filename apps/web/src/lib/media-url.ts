export type MediaFallbackKind = 'art' | 'video' | 'book' | 'archive';

export const ALLOWED_MEDIA_HOSTS = new Set<string>([
  'www.makaremi.com',
  'makaremi.com',
  'admin.makaremi.com',
  'iiif.makaremi.com',
  'hassanmakaremi.com',
  'www.hassanmakaremi.com',
  'i.ytimg.com',
  'img.youtube.com',
  'i.vimeocdn.com',
  'www.tribunezamaneh.com',
  'tribunezamaneh.com',
  'farhangemrooz.com',
  'www.farhangemrooz.com',
  'iranhr.net',
  'www.iranhr.net',
  'iranwire.com',
  'www.iranwire.com',
  'www.radiozamaneh.com',
  'radiozamaneh.com',
  'www.asre-nou.net',
  'asre-nou.net',
  'scontent-cdg2-1.xx.fbcdn.net',
]);

export function buildMediaFallbackUrl(kind: MediaFallbackKind = 'archive', title?: string | null): string {
  const params = new URLSearchParams({ kind });
  if (title && title.trim()) {
    params.set('title', title.trim().slice(0, 72));
  }
  return `/api/media?${params.toString()}`;
}

export function normalizeExternalMediaUrl(rawUrl: string): string {
  return rawUrl.trim().replace(/&amp;/g, '&');
}

export function isAllowlistedMediaUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(normalizeExternalMediaUrl(rawUrl));
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    if (parsed.username || parsed.password) return false;
    return ALLOWED_MEDIA_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Routes external vault/CDN images & YouTube/Vimeo thumbnails through the same-origin
 * `/api/media` edge-cached proxy so visitors behind regional filtering (e.g. Iran)
 * and HTTPS Mixed-Content policies see every artwork and video cover reliably.
 */
export function resolveProxiedMediaUrl(
  rawUrl: string | null | undefined,
  kind: MediaFallbackKind = 'art',
  title?: string | null
): string | null {
  if (!rawUrl || !rawUrl.trim()) return null;
  const cleaned = normalizeExternalMediaUrl(rawUrl);

  // Preserve self-hosted assets and inline data/blob images directly
  if (cleaned.startsWith('/') || cleaned.startsWith('data:image/') || cleaned.startsWith('blob:')) {
    return cleaned;
  }

  if (isAllowlistedMediaUrl(cleaned)) {
    const params = new URLSearchParams({
      url: cleaned,
      kind,
    });
    if (title && title.trim()) {
      params.set('title', title.trim().slice(0, 72));
    }
    return `/api/media?${params.toString()}`;
  }

  // Known broken/non-allowlisted legacy external assets resolve to clean archival SVG plate
  return buildMediaFallbackUrl(kind, title);
}

/**
 * Always returns a reliable same-origin cover URL for every video card & player,
 * cascading through YouTube CDN thumbnails or rendering an archival video plate when absent.
 */
export function resolveVideoCoverUrl(
  video: { thumbnail_url?: string | null; youtube_video_id?: string | null },
  title?: string | null
): string {
  const directThumb = video.thumbnail_url?.trim();
  if (directThumb) {
    return (
      resolveProxiedMediaUrl(directThumb, 'video', title) ||
      buildMediaFallbackUrl('video', title)
    );
  }
  if (video.youtube_video_id?.trim()) {
    const ytThumb = `https://i.ytimg.com/vi/${video.youtube_video_id.trim()}/hqdefault.jpg`;
    return resolveProxiedMediaUrl(ytThumb, 'video', title) || buildMediaFallbackUrl('video', title);
  }
  return buildMediaFallbackUrl('video', title);
}
