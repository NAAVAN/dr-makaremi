export interface MirrorChannel {
  name: string;
  url: string;
  type: 'canonical' | 'cloudflare_pages' | 'cloudflare_workers' | 'telegram_instant_view' | 'markdown_twin' | 'ipfs_gateway';
  description_fa: string;
  description_fr: string;
  description_en: string;
  is_active: boolean;
}

export const VERIFIED_MIRROR_CHANNELS: MirrorChannel[] = [
  {
    name: 'دامنه رسمی و کانونیکال (Primary Canonical Domain)',
    url: 'https://makaremi.com',
    type: 'canonical',
    description_fa: 'پایگاه اصلی مستقر بر شبکه توزیع لبه کلادفلیر با پشتیبانی از ECH و QUIC.',
    description_fr: 'Domaine officiel sur le réseau Edge Cloudflare avec ECH et QUIC.',
    description_en: 'Official canonical domain on Cloudflare global edge network with ECH and QUIC.',
    is_active: true,
  },
  {
    name: 'درگاه غیرمتمرکز آی‌پی‌اف‌اس (Decentralized IPFS Gateway)',
    url: 'https://cloudflare-ipfs.com/ipns/makaremi.com',
    type: 'ipfs_gateway',
    description_fa: 'دسترسی غیرمتمرکز مقاوم در برابر مسدودسازی مبتنی بر IPFS و IPNS.',
    description_fr: 'Accès décentralisé résistant à la censure via passerelle IPFS.',
    description_en: 'Decentralized censorship-resistant access via IPFS/IPNS gateway.',
    is_active: true,
  },
  {
    name: 'آینه کلادفلیر پیجز (Cloudflare Pages Mirror)',
    url: 'https://makaremi-core.pages.dev',
    type: 'cloudflare_pages',
    description_fa: 'آینه ابری مستقیم بر روی زیرساخت pages.dev جهت عبور از مسدودسازی دامنه.',
    description_fr: 'Miroir Cloudflare Pages sur infrastructure pages.dev.',
    description_en: 'Cloudflare Pages edge mirror hosted on pages.dev.',
    is_active: true,
  },
  {
    name: 'آینه ورکرز لبه (Cloudflare Worker Edge Mirror)',
    url: 'https://makaremi-edge.workers.dev',
    type: 'cloudflare_workers',
    description_fa: 'پروکسی لبه سرورلس توزیع‌شده برای پاسخگویی در شرایط اختلال شدید اینترنت.',
    description_fr: 'Proxy Edge serverless distribué pour résister aux coupures sévères.',
    description_en: 'Distributed serverless edge proxy resilient to severe network blockages.',
    is_active: true,
  },
  {
    name: 'کانال رسمی تلگرام با Instant View (Telegram IV 2.1)',
    url: 'https://t.me/hassan_makaremi',
    type: 'telegram_instant_view',
    description_fa: 'مطالعه سریع مقالات درون پیام‌رسان تلگرام بدون نیاز به باز کردن مرورگر یا فیلترشکن.',
    description_fr: 'Lecture instantanée des articles dans Telegram sans VPN ni navigateur.',
    description_en: 'Instant reading inside Telegram app without requiring VPN or web browser.',
    is_active: true,
  },
  {
    name: 'موتور دوقلوی متنی مارک‌داون (Plain-Text Markdown Twins)',
    url: 'https://makaremi.com/fa/books.md',
    type: 'markdown_twin',
    description_fa: 'خروجی متنی سبک و بهینه‌سازی‌شده برای شرایط پهنای باند زیر ۵۰ کیلوبیت.',
    description_fr: 'Version texte brut Markdown légère pour connexions à très faible débit.',
    description_en: 'Ultra-lightweight plain text Markdown twin for ultra-low bandwidth environments.',
    is_active: true,
  },
];
