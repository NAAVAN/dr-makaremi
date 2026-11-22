import type { Locale } from '@makaremi/shared';

export type LinkDestinationKind = 'video' | 'image' | 'pdf' | 'book' | 'social' | 'source';

export interface ClassifiedDestination {
  href: string;
  label: string;
  kind: LinkDestinationKind;
  hostLabel: string;
}

const URL_LIKE_RE = /^(https?:\/\/|www\.)/i;
const IMAGE_EXT_RE = /\.(jpe?g|png|webp|gif|avif|bmp|tiff?)(\?.*)?$/i;
const PDF_EXT_RE = /\.pdf(\?.*)?$/i;

export function isUrlLikeText(value: string | null | undefined): boolean {
  if (!value) return false;
  return URL_LIKE_RE.test(value.trim());
}

export function classifyDestinationUrl(
  rawUrl: string,
  locale: Locale = 'fa',
  customLabel?: string
): ClassifiedDestination {
  const href = rawUrl.trim();
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';
  const tx = (fa: string, fr: string, en: string) => (isFa ? fa : isFr ? fr : en);

  let hostLabel = '';
  let pathname = '';
  try {
    const parsed = new URL(href.startsWith('http') ? href : `https://makaremi.com${href.startsWith('/') ? '' : '/'}${href}`);
    hostLabel = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    pathname = parsed.pathname.toLowerCase();
  } catch {
    hostLabel = 'makaremi.com';
    pathname = href.toLowerCase();
  }

  let kind: LinkDestinationKind = 'source';
  let generatedLabel = '';

  if (hostLabel.includes('youtube.com') || hostLabel === 'youtu.be') {
    kind = 'video';
    generatedLabel = tx('لینک یوتیوب', 'Lien YouTube', 'YouTube Link');
  } else if (hostLabel.includes('vimeo.com')) {
    kind = 'video';
    generatedLabel = tx('ویدئو در ویمیو', 'Vidéo Vimeo', 'Vimeo Video');
  } else if (PDF_EXT_RE.test(pathname) || PDF_EXT_RE.test(href)) {
    kind = 'pdf';
    generatedLabel = tx('فایل PDF منبع', 'Document PDF', 'PDF Document');
  } else if (IMAGE_EXT_RE.test(pathname) || IMAGE_EXT_RE.test(href)) {
    kind = 'image';
    generatedLabel = tx('مشاهده تصویر پیوست', 'Voir l’image jointe', 'View Attached Image');
  } else if (hostLabel.includes('amazon.')) {
    kind = 'book';
    generatedLabel = tx('صفحه کتاب در آمازون', 'Voir sur Amazon', 'View on Amazon');
  } else if (hostLabel.includes('taaghche.') || hostLabel.includes('fidibo.') || hostLabel.includes('harmattan')) {
    kind = 'book';
    generatedLabel = tx('لینک تهیه کتاب', 'Commander l’ouvrage', 'Book Publisher Link');
  } else if (hostLabel.includes('unesco.')) {
    kind = 'source';
    generatedLabel = tx('لینک آرشیو یونسکو', 'Archives de l’UNESCO', 'UNESCO Archive Link');
  } else if (hostLabel.includes('cnrs.fr')) {
    kind = 'source';
    generatedLabel = tx('پایگاه پژوهشی CNRS', 'Source officielle CNRS', 'CNRS Research Portal');
  } else if (
    hostLabel.includes('instagram.') ||
    hostLabel.includes('facebook.') ||
    hostLabel === 't.me' ||
    hostLabel.includes('telegram.') ||
    hostLabel.includes('linkedin.') ||
    hostLabel.includes('x.com') ||
    hostLabel.includes('twitter.')
  ) {
    kind = 'social';
    const network = hostLabel.split('.')[0];
    generatedLabel = tx(`لینک شبکه اجتماعی (${network})`, `Lien ${network}`, `${network} Link`);
  } else if (
    hostLabel.includes('bbc.') ||
    hostLabel.includes('radiofarda.') ||
    hostLabel.includes('rfi.fr') ||
    hostLabel.includes('iranintl.') ||
    hostLabel.includes('lemonde.') ||
    hostLabel.includes('liberation.') ||
    hostLabel.includes('voanews.')
  ) {
    kind = 'source';
    generatedLabel = tx(`لینک گزارش رسانه‌ای (${hostLabel})`, `Article média (${hostLabel})`, `Media Report (${hostLabel})`);
  } else if (hostLabel === 'makaremi.com') {
    generatedLabel = tx('صفحه مرجع در آرشیو', 'Page de référence', 'Archive Reference');
  } else {
    generatedLabel = tx(`لینک منبع (${hostLabel})`, `Lien source (${hostLabel})`, `Source Link (${hostLabel})`);
  }

  const trimmedCustom = (customLabel || '').trim();
  const useCustom = Boolean(trimmedCustom) && !isUrlLikeText(trimmedCustom);

  return {
    href,
    label: useCustom ? trimmedCustom : generatedLabel,
    kind,
    hostLabel,
  };
}

/**
 * Extracts all unique destination URLs (Markdown links or bare http/https URLs) from a text block.
 */
export function extractUrlsFromText(text: string | null | undefined): string[] {
  if (!text) return [];
  const matches = text.match(/https?:\/\/[^\s<>)\]"']+/gi) || [];
  const seen = new Set<string>();
  const clean: string[] = [];
  for (const raw of matches) {
    const trimmed = raw.replace(/[.,;:!?]+$/, '');
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      clean.push(trimmed);
    }
  }
  return clean;
}

/**
 * Strips bare http(s)://... URLs and URL-labelled markdown links from plain-text summaries/snippets
 * so card excerpts and metadata previews read cleanly without showing raw web addresses.
 */
export function cleanSummaryWithoutRawUrls(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi, (_m, label: string) =>
      isUrlLikeText(label) ? '' : label
    )
    .replace(/https?:\/\/[^\s<>)\]"']+/gi, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\[\s*\]/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s\-–—:،,;]+/, '')
    .trim();
}
