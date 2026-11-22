import type {
  Locale,
  MediaSlotKey,
  MediaUploadPolicy,
  StudioSeoFields,
  StudioStandardisedAsset,
} from '@makaremi/shared';
import { normalizePersianText } from '../etl/persian-normalizer';

export const MEDIA_UPLOAD_POLICIES: Record<MediaSlotKey, MediaUploadPolicy> = {
  artwork_iiif: {
    slot: 'artwork_iiif',
    titleFa: 'تصویر باکیفیت تابلوی هنری / خوشنویسی (IIIF)',
    allowedExtensions: ['webp', 'jpg', 'jpeg', 'png', 'tif', 'tiff'],
    allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png', 'image/tiff'],
    acceptAttr: '.webp,.jpg,.jpeg,.png,.tif,.tiff,image/webp,image/jpeg,image/png',
    maxBytes: 15 * 1024 * 1024,
    maxSizeLabelFa: 'حداکثر ۱۵ مگابایت (تبدیل خودکار به WebP بهینه زیر ۲ مگابایت)',
    preferredStandardFa:
      'طول بلندتر ۲۰۰۰ تا ۳۵۰۰ پیکسل، نور یکنواخت بدون قاب یا انعکاس شیشه، فضای رنگ sRGB برای زوم عمیق',
    autoConvertToWebP: true,
    targetMaxWidthPx: 3200,
    targetQuality: 0.9,
  },
  book_front_cover: {
    slot: 'book_front_cover',
    titleFa: 'تصویر روی جلد کتاب (نمای سه‌بعدی)',
    allowedExtensions: ['webp', 'jpg', 'jpeg', 'png'],
    allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png'],
    acceptAttr: '.webp,.jpg,.jpeg,.png,image/webp,image/jpeg,image/png',
    maxBytes: 8 * 1024 * 1024,
    maxSizeLabelFa: 'حداکثر ۸ مگابایت (تبدیل خودکار به WebP)',
    preferredStandardFa: 'نسبت عمودی ۲:۳ یا ۳:۴، عرض حداقل ۱۲۰۰ پیکسل، بدون حاشیه سفید اضافه و بازتاب سلفون',
    autoConvertToWebP: true,
    targetMaxWidthPx: 1800,
    targetQuality: 0.9,
  },
  book_back_cover: {
    slot: 'book_back_cover',
    titleFa: 'تصویر پشت جلد کتاب (چرخش ۳۶۰ درجه)',
    allowedExtensions: ['webp', 'jpg', 'jpeg', 'png'],
    allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png'],
    acceptAttr: '.webp,.jpg,.jpeg,.png,image/webp,image/jpeg,image/png',
    maxBytes: 8 * 1024 * 1024,
    maxSizeLabelFa: 'حداکثر ۸ مگابایت (تبدیل خودکار به WebP)',
    preferredStandardFa: 'هم‌ابعاد و هم‌نسبت با روی جلد (عرض حداقل ۱۲۰۰ پیکسل، کادر صاف)',
    autoConvertToWebP: true,
    targetMaxWidthPx: 1800,
    targetQuality: 0.88,
  },
  book_spine: {
    slot: 'book_spine',
    titleFa: 'تصویر عطف کتاب (Spine)',
    allowedExtensions: ['webp', 'jpg', 'jpeg', 'png'],
    allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png'],
    acceptAttr: '.webp,.jpg,.jpeg,.png,image/webp,image/jpeg,image/png',
    maxBytes: 4 * 1024 * 1024,
    maxSizeLabelFa: 'حداکثر ۴ مگابایت (تبدیل خودکار به WebP)',
    preferredStandardFa: 'تصویر باریک عمودی با عرض حداقل ۲۴۰ پیکسل؛ در صورت نبود، سایت به‌صورت خودکار عطف می‌سازد',
    autoConvertToWebP: true,
    targetMaxWidthPx: 900,
    targetQuality: 0.88,
  },
  article_or_exhibition_cover: {
    slot: 'article_or_exhibition_cover',
    titleFa: 'تصویر شاخص مقاله / پوستر نمایشگاه',
    allowedExtensions: ['webp', 'jpg', 'jpeg', 'png'],
    allowedMimeTypes: ['image/webp', 'image/jpeg', 'image/png'],
    acceptAttr: '.webp,.jpg,.jpeg,.png,image/webp,image/jpeg,image/png',
    maxBytes: 6 * 1024 * 1024,
    maxSizeLabelFa: 'حداکثر ۶ مگابایت (تبدیل خودکار به WebP)',
    preferredStandardFa: 'کادر افقی ۱۶:۹ یا ۴:۳ با عرض حداقل ۱۶۰۰ پیکسل برای نمایش شفاف در کارت و شبکه‌های اجتماعی',
    autoConvertToWebP: true,
    targetMaxWidthPx: 1920,
    targetQuality: 0.88,
  },
  document_pdf: {
    slot: 'document_pdf',
    titleFa: 'سند PDF مقاله، کتاب یا برگزیده ورق‌زن',
    allowedExtensions: ['pdf', 'doc', 'docx'],
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    acceptAttr: '.pdf,.doc,.docx,application/pdf',
    maxBytes: 25 * 1024 * 1024,
    maxSizeLabelFa: 'حداکثر ۲۵ مگابایت (پیشنهاد ترجیحی زیر ۱۰ مگابایت)',
    preferredStandardFa: 'فایل PDF متنی (قابل جستجو و انتخاب متن) با فونت‌های تعبیه‌شده؛ برای تورق سریع زیر ۱۰ مگابایت باشد',
    autoConvertToWebP: false,
  },
  audio_intro: {
    slot: 'audio_intro',
    titleFa: 'فایل صوتی معرفی با صدای استاد',
    allowedExtensions: ['mp3', 'm4a', 'wav', 'webm', 'ogg'],
    allowedMimeTypes: ['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/webm', 'audio/ogg'],
    acceptAttr: '.mp3,.m4a,.wav,.webm,.ogg,audio/*',
    maxBytes: 15 * 1024 * 1024,
    maxSizeLabelFa: 'حداکثر ۱۵ مگابایت (معادل حدود ۱۵ دقیقه صدای استاندارد)',
    preferredStandardFa: 'مدت ۱ تا ۳ دقیقه در محیط آرام، فرمت MP3 یا M4A (یا ضبط مستقیم میکروفون در همین باکس)',
    autoConvertToWebP: false,
  },
  video_asset: {
    slot: 'video_asset',
    titleFa: 'فایل ویدئو، تصویر بندانگشتی یا زیرنویس',
    allowedExtensions: ['mp4', 'webm', 'webp', 'jpg', 'jpeg', 'png', 'vtt', 'srt'],
    allowedMimeTypes: [
      'video/mp4',
      'video/webm',
      'image/webp',
      'image/jpeg',
      'image/png',
      'text/vtt',
      'application/x-subrip',
      'text/plain',
    ],
    acceptAttr: '.mp4,.webm,.webp,.jpg,.jpeg,.png,.vtt,.srt,video/mp4,video/webm,image/*',
    maxBytes: 50 * 1024 * 1024,
    maxSizeLabelFa: 'حداکثر ۵۰ مگابایت برای ویدئو (یا لینک نامحدود YouTube / Vimeo)',
    preferredStandardFa: 'پیشنهاد ترجیحی: قرار دادن لینک YouTube با کیفیت 1080p به‌همراه تامبنیل ۱۶:۹ و فایل متن/زیرنویس',
    autoConvertToWebP: true,
    targetMaxWidthPx: 1920,
    targetQuality: 0.88,
  },
};

export function formatBytesFa(bytes: number): string {
  if (bytes < 1024) return `${bytes} بایت`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} کیلوبایت`;
  return `${(kb / 1024).toFixed(2)} مگابایت`;
}

function getFileExtension(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : '';
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('خطا در خواندن فایل از دستگاه'));
    reader.readAsDataURL(file);
  });
}

function convertImageFileToWebP(
  file: File,
  maxWidthOrHeight: number,
  quality: number
): Promise<{ dataUrl: string; width: number; height: number; mimeType: string; sizeBytes: number; wasConverted: boolean }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        let targetW = img.naturalWidth || img.width;
        let targetH = img.naturalHeight || img.height;

        if (targetW > maxWidthOrHeight || targetH > maxWidthOrHeight) {
          if (targetW >= targetH) {
            targetH = Math.round((targetH * maxWidthOrHeight) / targetW);
            targetW = maxWidthOrHeight;
          } else {
            targetW = Math.round((targetW * maxWidthOrHeight) / targetH);
            targetH = maxWidthOrHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('مرورگر امکان پردازش تصویر را نداد.'));
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const webpDataUrl = canvas.toDataURL('image/webp', quality);
        URL.revokeObjectURL(objectUrl);

        // Fallback if browser returns non-webp data URI
        const mimeType = webpDataUrl.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg';
        const finalDataUrl =
          mimeType === 'image/webp' ? webpDataUrl : canvas.toDataURL('image/jpeg', quality);
        const base64Part = finalDataUrl.split(',')[1] || '';
        const estimatedBytes = Math.round((base64Part.length * 3) / 4);

        resolve({
          dataUrl: finalDataUrl,
          width: targetW,
          height: targetH,
          mimeType,
          sizeBytes: estimatedBytes,
          wasConverted: mimeType === 'image/webp',
        });
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error(
          'تصویر قابل خواندن یا تبدیل در مرورگر نیست (برای فایل TIFF لطفاً نسخه JPG یا WebP یا PNG بارگذاری کنید).'
        )
      );
    };

    img.src = objectUrl;
  });
}

/**
 * Client-side Gatekeeper: enforces file type, size limits, and converts raster images
 * to stripped, dimension-bounded WebP before persistence.
 */
export async function validateAndStandardiseClientFile(
  file: File,
  slot: MediaSlotKey
): Promise<{ ok: true; asset: StudioStandardisedAsset } | { ok: false; error: string }> {
  const policy = MEDIA_UPLOAD_POLICIES[slot];
  if (!policy) {
    return { ok: false, error: 'نوع باکس آپلود معتبر نیست.' };
  }

  const ext = getFileExtension(file.name);
  const mimeLower = (file.type || '').toLowerCase();

  if (ext === 'svg' || mimeLower.includes('svg')) {
    return {
      ok: false,
      error: 'فرمت SVG به دلایل امنیتی مسدود است؛ لطفاً تصویر را به صورت PNG، JPG یا WebP بارگذاری فرمایید.',
    };
  }

  const extAllowed = policy.allowedExtensions.includes(ext);
  const mimeAllowed = !mimeLower || policy.allowedMimeTypes.some((m) => mimeLower === m || mimeLower.startsWith(m.split('/')[0] + '/'));

  if (!extAllowed || !mimeAllowed) {
    return {
      ok: false,
      error: `فرمت «.${ext || 'نامشخص'}» مجاز نیست. فرمت‌های مجاز: ${policy.allowedExtensions.map((x) => x.toUpperCase()).join('، ')}`,
    };
  }

  if (file.size > policy.maxBytes) {
    return {
      ok: false,
      error: `حجم فایل (${formatBytesFa(file.size)}) از سقف مجاز (${policy.maxSizeLabelFa}) بیشتر است.`,
    };
  }

  const isRasterImage =
    mimeLower.startsWith('image/') || ['webp', 'jpg', 'jpeg', 'png', 'tif', 'tiff'].includes(ext);

  if (policy.autoConvertToWebP && isRasterImage && typeof document !== 'undefined') {
    try {
      const converted = await convertImageFileToWebP(
        file,
        policy.targetMaxWidthPx || 2400,
        policy.targetQuality || 0.88
      );
      const baseName = file.name.replace(/\.[^.]+$/, '');
      return {
        ok: true,
        asset: {
          slot,
          fileName: converted.wasConverted ? `${baseName}.webp` : file.name,
          mimeType: converted.mimeType,
          sizeBytes: converted.sizeBytes,
          originalSizeBytes: file.size,
          width: converted.width,
          height: converted.height,
          wasConvertedToWebP: converted.wasConverted,
          dataUrl: converted.dataUrl,
        },
      };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'تبدیل خودکار تصویر با خطا مواجه شد.',
      };
    }
  }

  const dataUrl = await readFileAsDataUrl(file);
  return {
    ok: true,
    asset: {
      slot,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      originalSizeBytes: file.size,
      wasConvertedToWebP: false,
      dataUrl,
    },
  };
}

/**
 * Server-side Gatekeeper: verifies Data URL magic bytes & payload ceiling
 * so tampered client payloads cannot bypass format filters.
 */
export function validateDataUrlServerSide(
  dataUrl: string,
  slot: MediaSlotKey
): { ok: true; mimeType: string; sizeBytes: number } | { ok: false; error: string } {
  const policy = MEDIA_UPLOAD_POLICIES[slot];
  if (!policy) return { ok: false, error: 'Unknown media slot policy' };

  const match = /^data:([a-zA-Z0-9.+\-\/]+);base64,(.+)$/s.exec(dataUrl.trim());
  if (!match) {
    return { ok: false, error: 'Invalid base64 data URI format' };
  }

  const [, rawMime, b64] = match;
  const mimeLower = rawMime.toLowerCase();
  if (mimeLower.includes('svg') || mimeLower.includes('html') || mimeLower.includes('javascript')) {
    return { ok: false, error: 'Executable/SVG content disallowed by media gatekeeper' };
  }

  const buf = Buffer.from(b64, 'base64');
  if (buf.length > policy.maxBytes) {
    return { ok: false, error: `Decoded asset exceeds ${policy.maxBytes} byte policy ceiling` };
  }

  const hex = buf.subarray(0, 12).toString('hex').toLowerCase();
  const ascii4 = buf.subarray(0, 4).toString('ascii');

  if (mimeLower.startsWith('image/')) {
    const isWebP = ascii4 === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP';
    const isJpeg = hex.startsWith('ffd8ff');
    const isPng = hex.startsWith('89504e47');
    const isTiff = hex.startsWith('49492a00') || hex.startsWith('4d4d002a');
    if (!isWebP && !isJpeg && !isPng && !isTiff) {
      return { ok: false, error: 'Image magic bytes verification failed' };
    }
  } else if (mimeLower === 'application/pdf') {
    if (!ascii4.startsWith('%PDF')) {
      return { ok: false, error: 'PDF header signature (%PDF) missing' };
    }
  }

  return { ok: true, mimeType: mimeLower, sizeBytes: buf.length };
}

export function normaliseExternalVideoUrl(rawUrl: string): {
  cleanUrl: string;
  youtubeId?: string;
  provider?: 'youtube' | 'vimeo' | 'direct' | 'other';
} {
  const trimmed = rawUrl.trim();
  if (!trimmed) return { cleanUrl: '' };

  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();
    if (host.includes('youtube.com')) {
      const vid = u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop();
      if (vid && /^[a-zA-Z0-9_-]{6,20}$/.test(vid)) {
        return {
          cleanUrl: `https://www.youtube.com/watch?v=${vid}`,
          youtubeId: vid,
          provider: 'youtube',
        };
      }
    }
    if (host === 'youtu.be') {
      const vid = u.pathname.replace(/^\//, '').split('/')[0];
      if (vid && /^[a-zA-Z0-9_-]{6,20}$/.test(vid)) {
        return {
          cleanUrl: `https://www.youtube.com/watch?v=${vid}`,
          youtubeId: vid,
          provider: 'youtube',
        };
      }
    }
    if (host.includes('vimeo.com')) {
      return { cleanUrl: u.toString(), provider: 'vimeo' };
    }
    return { cleanUrl: u.toString(), provider: 'other' };
  } catch {
    return { cleanUrl: trimmed };
  }
}

export function normaliseStudioText(text: string, locale: Locale): string {
  const cleaned = (text || '').replace(/\r\n/g, '\n').trim();
  if (!cleaned) return '';
  if (locale === 'fa') {
    return normalizePersianText(cleaned, { enforceZwnj: true, normalizeQuotes: true });
  }
  return cleaned;
}

export function suggestSeoFromContent(input: {
  title: string;
  summary?: string;
  body?: string;
  locale: Locale;
  category?: string;
}): StudioSeoFields {
  const cleanTitle = input.title.trim();
  const baseBody = (input.summary || input.body || '').replace(/[#*_`>\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
  const excerpt = baseBody.slice(0, 155) + (baseBody.length > 155 ? '…' : '');
  const prefix =
    input.locale === 'fa'
      ? `اثر دکتر حسن مکارمی: ${cleanTitle}`
      : input.locale === 'fr'
        ? `Œuvre du Dr Hassan Makaremi : ${cleanTitle}`
        : `Work by Dr Hassan Makaremi: ${cleanTitle}`;

  return {
    metaTitle: cleanTitle.slice(0, 68),
    metaDescription: excerpt || prefix,
    imageAltText: prefix,
    keywords: [input.category, 'دکتر حسن مکارمی', 'Hassan Makaremi'].filter(Boolean).join('، '),
    aeoKeyTakeaway: excerpt || prefix,
  };
}
