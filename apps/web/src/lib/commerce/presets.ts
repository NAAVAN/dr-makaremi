import type {
  CommerceArchiveWorkOption,
  CommerceAvailability,
  CommerceCatalogItem,
  CommerceProductKind,
  LegalEntityBucket,
  LocalizedTextMap,
} from '@makaremi/shared';

export interface CommerceKindPreset {
  kind: CommerceProductKind;
  labelFa: string;
  shortLabelFa: string;
  descriptionFa: string;
  badge: string;
  legalBucket: LegalEntityBucket;
  vatRateBasisPoints: 0 | 550 | 2000;
  hsCode: string;
  requiresWithdrawalWaiver: boolean;
  defaultEditionSize: number | null;
  defaultPriceEur: number | null;
  defaultDimensionsCm: string | null;
  defaultWeightGrams: number | null;
  defaultMediumKey: string;
  signedByArtist: boolean;
  numberedEdition: boolean;
  recommendedCollections: Array<CommerceCatalogItem['collection']>;
}

export const COMMERCE_KIND_PRESETS: Record<CommerceProductKind, CommerceKindPreset> = {
  original_artwork: {
    kind: 'original_artwork',
    labelFa: 'اثر اصل یکتا (۱/۱ — اجرای کامل دستی)',
    shortLabelFa: 'اثر اصل ۱/۱',
    descriptionFa: 'دارای گواهی اصالت Décret Marcus + امضای Ed25519 • رژیم URSSAF هنرمند-مؤلف • کد گمرکی 9701.91',
    badge: 'URSSAF • 1/1',
    legalBucket: 'artiste_auteur',
    vatRateBasisPoints: 550,
    hsCode: '9701.91',
    requiresWithdrawalWaiver: false,
    defaultEditionSize: 1,
    defaultPriceEur: 1850,
    defaultDimensionsCm: '60 × 80 cm',
    defaultWeightGrams: 2200,
    defaultMediumKey: 'ink_canvas',
    signedByArtist: true,
    numberedEdition: false,
    recommendedCollections: ['artworks'],
  },
  fine_art_print: {
    kind: 'fine_art_print',
    labelFa: 'چاپ موزه‌ای شماره‌دار (Fine Art روی کاغذ Hahnemühle)',
    shortLabelFa: 'چاپ موزه‌ای',
    descriptionFa: 'بازتولید هنری امضا و شماره‌گذاری‌شده • رژیم تجاری BIC • کد گمرکی 4911.91',
    badge: 'BIC • تیراژ محدود',
    legalBucket: 'commercial_bic',
    vatRateBasisPoints: 2000,
    hsCode: '4911.91',
    requiresWithdrawalWaiver: false,
    defaultEditionSize: 30,
    defaultPriceEur: 240,
    defaultDimensionsCm: '50 × 70 cm',
    defaultWeightGrams: 450,
    defaultMediumKey: 'hahnemuhle_print',
    signedByArtist: true,
    numberedEdition: true,
    recommendedCollections: ['artworks', 'poems'],
  },
  book_physical_signed: {
    kind: 'book_physical_signed',
    labelFa: 'کتاب چاپی امضاشده استاد (ارسال از پاریس)',
    shortLabelFa: 'کتاب چاپی امضاشده',
    descriptionFa: 'تابع قانون قیمت واحد کتاب و ارسال Loi Lang & Darcos فرانسه • کد گمرکی 4901.99',
    badge: 'BIC • Loi Darcos',
    legalBucket: 'commercial_bic',
    vatRateBasisPoints: 550,
    hsCode: '4901.99',
    requiresWithdrawalWaiver: false,
    defaultEditionSize: 40,
    defaultPriceEur: 24,
    defaultDimensionsCm: null,
    defaultWeightGrams: 380,
    defaultMediumKey: 'signed_book',
    signedByArtist: true,
    numberedEdition: false,
    recommendedCollections: ['books'],
  },
  book_digital_ebook: {
    kind: 'book_digital_ebook',
    labelFa: 'نسخه دیجیتال رسمی (PDF / eBook — دانلود فوری)',
    shortLabelFa: 'نسخه دیجیتال فوری',
    descriptionFa: 'خودنشر مؤلف (URSSAF) • تحویل فوری با لینک رمزدار ۷۲ ساعته • تیک انصراف Art. L221-28',
    badge: 'URSSAF • دیجیتال',
    legalBucket: 'artiste_auteur',
    vatRateBasisPoints: 550,
    hsCode: '4901.99',
    requiresWithdrawalWaiver: true,
    defaultEditionSize: null,
    defaultPriceEur: 12,
    defaultDimensionsCm: null,
    defaultWeightGrams: null,
    defaultMediumKey: 'digital_ebook',
    signedByArtist: false,
    numberedEdition: false,
    recommendedCollections: ['books', 'poems', 'videos'],
  },
  commission_inquiry: {
    kind: 'commission_inquiry',
    labelFa: 'سفارش خوشنویسی اختصاصی (سفارشی‌ساز)',
    shortLabelFa: 'سفارش اختصاصی',
    descriptionFa: 'خلق اثر اصل به سفارش کلکسیونر • رژیم URSSAF • استثنای حق انصراف Art. L221-28 3°',
    badge: 'URSSAF • سفارشی',
    legalBucket: 'artiste_auteur',
    vatRateBasisPoints: 550,
    hsCode: '9701.91',
    requiresWithdrawalWaiver: true,
    defaultEditionSize: 5,
    defaultPriceEur: 1200,
    defaultDimensionsCm: '50 × 70 cm (sur mesure)',
    defaultWeightGrams: 1200,
    defaultMediumKey: 'ink_paper',
    signedByArtist: true,
    numberedEdition: false,
    recommendedCollections: ['artworks', 'poems', 'patronage'],
  },
  patronage_edition: {
    kind: 'patronage_edition',
    labelFa: 'حمایت از نگهداری و انتشار آزاد آرشیو (Mécénat)',
    shortLabelFa: 'حمایت از آرشیو',
    descriptionFa: 'حمایت داوطلبانه برای حفظ دسترسی آزاد به آثار علمی و حقوق بشری • رژیم URSSAF',
    badge: 'URSSAF • حمایت',
    legalBucket: 'artiste_auteur',
    vatRateBasisPoints: 0,
    hsCode: '4901.99',
    requiresWithdrawalWaiver: true,
    defaultEditionSize: null,
    defaultPriceEur: 50,
    defaultDimensionsCm: null,
    defaultWeightGrams: null,
    defaultMediumKey: 'patronage',
    signedByArtist: false,
    numberedEdition: false,
    recommendedCollections: ['patronage', 'videos', 'poems'],
  },
};

export const COMMERCE_KIND_LIST: CommerceKindPreset[] = [
  COMMERCE_KIND_PRESETS.original_artwork,
  COMMERCE_KIND_PRESETS.fine_art_print,
  COMMERCE_KIND_PRESETS.book_physical_signed,
  COMMERCE_KIND_PRESETS.book_digital_ebook,
  COMMERCE_KIND_PRESETS.commission_inquiry,
  COMMERCE_KIND_PRESETS.patronage_edition,
];

export const COMMERCE_COLLECTION_OPTIONS: Array<{
  value: CommerceCatalogItem['collection'];
  labelFa: string;
  descriptionFa: string;
  defaultKind: CommerceProductKind;
}> = [
  {
    value: 'artworks',
    labelFa: 'تابلوهای نقاشی‌خط و نقاشی (آرشیو گالری)',
    descriptionFa: 'انتخاب مجموعه و تابلوی دقیق از میان آثار گالری برای عرضه اصل یا چاپ موزه‌ای',
    defaultKind: 'original_artwork',
  },
  {
    value: 'books',
    labelFa: 'کتاب‌ها و تألیفات استاد',
    descriptionFa: 'عرضه نسخه چاپی امضاشده (پست از پاریس) یا نسخه دیجیتال رسمی (PDF/eBook)',
    defaultKind: 'book_physical_signed',
  },
  {
    value: 'poems',
    labelFa: 'اشعار و پوسترهای هنری شعر',
    descriptionFa: 'تبدیل شعر مصور یا دفتر شعر به چاپ موزه‌ای شماره‌دار یا نسخه دیجیتال کلکسیونی',
    defaultKind: 'fine_art_print',
  },
  {
    value: 'videos',
    labelFa: 'سخنرانی‌ها و سمینارهای ویدیویی',
    descriptionFa: 'عرضه بسته پژوهشی/متنی سمینار یا حمایت ویژه از آرشیو سخنرانی‌ها',
    defaultKind: 'book_digital_ebook',
  },
  {
    value: 'patronage',
    labelFa: 'اثر مستقل / سفارش اختصاصی / حمایت از آرشیو',
    descriptionFa: 'ثبت یک عرضه مستقل بدون وابستگی به رکورد خاص در آرشیو',
    defaultKind: 'patronage_edition',
  },
];

export const COMMERCE_AVAILABILITY_OPTIONS: Array<{
  value: CommerceAvailability;
  labelFa: string;
  descriptionFa: string;
  badge: string;
}> = [
  {
    value: 'available',
    labelFa: 'قابل تملک (فعال در فروشگاه)',
    descriptionFa: 'دکمه افزودن به سبد خرید و پرداخت فعال است',
    badge: 'فعال',
  },
  {
    value: 'inquiry_only',
    labelFa: 'صرفاً استعلام قیمت از آتلیه',
    descriptionFa: 'نمایش در فروشگاه با دکمه تماس با آتلیه (بدون نیاز به قیمت)',
    badge: 'استعلام',
  },
  {
    value: 'reserved',
    labelFa: 'رزرو موقت (در انتظار تسویه)',
    descriptionFa: 'در فروشگاه با برچسب رزرو موقت نمایش داده می‌شود',
    badge: 'رزرو',
  },
  {
    value: 'sold',
    labelFa: 'واگذار شده (فروخته‌شده)',
    descriptionFa: 'به‌عنوان اثر واگذارشده در آرشیو کلکسیونرها باقی می‌ماند',
    badge: 'فروخته‌شده',
  },
  {
    value: 'external_publisher',
    labelFa: 'ارجاع به ناشر بیرونی',
    descriptionFa: 'خرید از طریق پیوند رسمی ناشر (L’Harmattan / آمازون / ناشران)',
    badge: 'ناشر بیرونی',
  },
  {
    value: 'not_for_sale',
    labelFa: 'مخفی / غیرقابل فروش (پیش‌نویس)',
    descriptionFa: 'در فروشگاه عمومی نمایش داده نمی‌شود ولی در پیشخوان حفظ می‌شود',
    badge: 'مخفی',
  },
];

export const COMMERCE_DIMENSION_PRESETS: Array<{
  value: string;
  labelFa: string;
  descriptionFa: string;
}> = [
  { value: '30 × 40 cm', labelFa: '30 × 40 cm — قطع کوچک کلکسیونی', descriptionFa: 'مناسب چاپ موزه‌ای و آثار کاغذی' },
  { value: '40 × 60 cm', labelFa: '40 × 60 cm — قطع متوسط', descriptionFa: 'مناسب تابلوهای نقاشی‌خط متوسط' },
  { value: '50 × 65 cm', labelFa: '50 × 65 cm — قطع کاغذ هنری (Raisin)', descriptionFa: 'استاندارد آثار کاغذی و حنای طبیعی در فرانسه' },
  { value: '50 × 70 cm', labelFa: '50 × 70 cm — قطع کلاسیک گالری', descriptionFa: 'محبوب‌ترین قطع چاپ Hahnemühle و آثار روی کاغذ' },
  { value: '60 × 80 cm', labelFa: '60 × 80 cm — قطع بزرگ گالری', descriptionFa: 'مناسب آثار اصل روی بوم یا کاغذ چسبانده' },
  { value: '70 × 100 cm', labelFa: '70 × 100 cm — قطع موزه‌ای بزرگ', descriptionFa: 'مناسب تابلوهای شاخص کلکسیونی' },
  { value: '100 × 130 cm', labelFa: '100 × 130 cm — قطع بزرگ نمایشگاهی', descriptionFa: 'مناسب کلکسیونرها و موزه‌ها (ارسال در جعبه چوبی)' },
  { value: '50 × 70 cm (sur mesure)', labelFa: '50 × 70 cm (sur mesure) — سفارشی', descriptionFa: 'مناسب سفارش خوشنویسی اختصاصی' },
  { value: '__none__', labelFa: 'بدون ابعاد (دیجیتال یا کتاب)', descriptionFa: 'برای نسخه‌های دیجیتال، کتاب یا حمایت از آرشیو' },
  { value: '__custom__', labelFa: 'ابعاد دلخواه (وارد کردن دستی)...', descriptionFa: 'ثبت ابعاد اختصاصی به سانتی‌متر' },
];

export interface CommerceMediumPreset {
  key: string;
  labelFa: string;
  descriptionFa: string;
  medium: LocalizedTextMap;
  paperOrSupport?: string;
}

export const COMMERCE_MEDIUM_PRESETS: CommerceMediumPreset[] = [
  {
    key: 'ink_canvas',
    labelFa: 'مرکب، رنگ‌دانه و اکریلیک روی بوم (اجرای دستی)',
    descriptionFa: 'مناسب تابلوهای اصل نقاشی‌خط روی بوم گالری',
    paperOrSupport: 'Toile de lin galerie',
    medium: {
      fa: 'مرکب، رنگ‌دانه و اکریلیک روی بوم (اجرای کامل دستی)',
      fr: 'Encre, pigments et acrylique sur toile (entièrement exécuté à la main)',
      en: 'Ink, natural pigments & acrylic on canvas (hand-executed original)',
    },
  },
  {
    key: 'ink_paper',
    labelFa: 'مرکب و رنگ‌دانه روی کاغذ دست‌ساز (اجرای دستی)',
    descriptionFa: 'مناسب تابلوهای اصل روی کاغذ آهارمهره یا کاغذ موزه‌ای',
    paperOrSupport: 'Papier d’art sans acide',
    medium: {
      fa: 'مرکب و رنگ‌دانه روی کاغذ دست‌ساز (اجرای کامل دستی)',
      fr: 'Encre et pigments sur papier d’art marouflé (exécuté à la main)',
      en: 'Ink & natural pigments on archival art paper (hand-executed)',
    },
  },
  {
    key: 'henna_paper',
    labelFa: 'حنای طبیعی و مرکب روی کاغذ هنری بدون اسید',
    descriptionFa: 'تکنیک ویژه حنای طبیعی استاد دکتر مکارمی',
    paperOrSupport: 'Papier d’art sans acide',
    medium: {
      fa: 'حنای طبیعی و مرکب روی کاغذ هنری بدون اسید',
      fr: 'Henné naturel et encre sur papier d’art sans acide',
      en: 'Natural henna & ink on acid-free fine art paper',
    },
  },
  {
    key: 'hahnemuhle_print',
    labelFa: 'چاپ پیگمنت موزه‌ای Hahnemühle Photo Rag 308g',
    descriptionFa: 'استاندارد چاپ فاخر با دوام صدساله، امضا و شماره‌گذاری دستی',
    paperOrSupport: 'Hahnemühle Photo Rag 308g',
    medium: {
      fa: 'چاپ پیگمنت موزه‌ای روی کاغذ پنبه‌ای Hahnemühle Photo Rag 308g',
      fr: 'Tirage pigmentaire Fine Art sur papier coton Hahnemühle Photo Rag 308g',
      en: 'Archival pigment Fine Art print on Hahnemühle Photo Rag 308g cotton paper',
    },
  },
  {
    key: 'signed_book',
    labelFa: 'کتاب چاپی با امضا و تقدیم‌نامه دستی استاد',
    descriptionFa: 'نسخه فیزیکی ارسال‌شده از کتابخانه شخصی استاد در پاریس',
    medium: {
      fa: 'نسخه چاپی رسمی با امضا و تقدیم‌نامه دستی دکتر حسن مکارمی',
      fr: 'Édition imprimée officielle avec dédicace manuscrite du Dr Hassan Makaremi',
      en: 'Official printed edition with Dr. Hassan Makaremi’s handwritten dedication',
    },
  },
  {
    key: 'digital_ebook',
    labelFa: 'نسخه دیجیتال رسمی (PDF / eBook)',
    descriptionFa: 'تحویل فوری پس از پرداخت همراه با لینک رمزدار ۷۲ ساعته',
    medium: {
      fa: 'نسخه دیجیتال رسمی مؤلف (PDF/eBook با مجوز اختصاصی)',
      fr: 'Édition numérique officielle de l’auteur (PDF/eBook)',
      en: 'Official author digital edition (PDF/eBook)',
    },
  },
  {
    key: 'patronage',
    labelFa: 'حمایت از نگهداری و انتشار آزاد آرشیو',
    descriptionFa: 'مشارکت فرهنگی بدون ارسال فیزیکی',
    medium: {
      fa: 'حمایت فرهنگی از حفظ و انتشار سه‌زبانه آرشیو مستقل',
      fr: 'Soutien culturel à la préservation et l’édition trilingue des archives',
      en: 'Cultural patronage supporting open trilingual archive preservation',
    },
  },
  {
    key: '__custom__',
    labelFa: 'تکنیک یا مدیوم دلخواه (تایپ دستی)...',
    descriptionFa: 'ثبت توضیح اختصاصی برای تکنیک اثر',
    medium: {
      fa: '',
      fr: '',
      en: '',
    },
  },
];

export function sanitizeSkuPart(raw: string, maxLen = 14): string {
  const cleaned = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return (cleaned || 'WORK').slice(0, maxLen).replace(/-+$/g, '');
}

export function buildSuggestedSku(input: {
  collection: CommerceCatalogItem['collection'];
  slug: string;
  kind: CommerceProductKind;
  plateImageId?: number | null;
  dimensionsCm?: string | null;
  existingSkus: Set<string>;
}): string {
  const prefixMap: Record<CommerceCatalogItem['collection'], string> = {
    artworks: 'ART',
    books: 'BOOK',
    poems: 'POEM',
    videos: 'VID',
    patronage: 'PATRON',
  };
  const kindTagMap: Record<CommerceProductKind, string> = {
    original_artwork: 'ORIG',
    fine_art_print: 'PRINT',
    book_physical_signed: 'SIGNED',
    book_digital_ebook: 'EBOOK',
    commission_inquiry: 'COMM',
    patronage_edition: 'SUP',
  };

  const prefix = prefixMap[input.collection] || 'ITEM';
  const slugPart = sanitizeSkuPart(input.slug, 14);
  const kindTag = kindTagMap[input.kind] || 'ED';
  const dimPart =
    input.kind === 'fine_art_print' && input.dimensionsCm
      ? sanitizeSkuPart(input.dimensionsCm.replace(/cm/gi, '').replace(/×/g, 'X'), 9)
      : '';
  const platePart = input.plateImageId ? String(input.plateImageId) : '';

  const baseParts = [prefix, slugPart, kindTag];
  if (platePart) baseParts.push(platePart);
  if (dimPart) baseParts.push(dimPart);
  const base = baseParts.join('-').slice(0, 68);

  if (!input.existingSkus.has(base)) {
    return base;
  }
  for (let i = 2; i < 100; i += 1) {
    const candidate = `${base}-${String(i).padStart(2, '0')}`.slice(0, 76);
    if (!input.existingSkus.has(candidate)) {
      return candidate;
    }
  }
  return `${base}-${Date.now().toString().slice(-4)}`.slice(0, 76);
}

export function buildDefaultLocalizedCopy(input: {
  work?: CommerceArchiveWorkOption | null;
  kind: CommerceProductKind;
  plateNumber?: number | null;
  dimensionsCm?: string | null;
}): {
  title: LocalizedTextMap;
  subtitle: LocalizedTextMap;
} {
  const baseFa = input.work?.title.fa || 'اثر جدید آتلیه دکتر مکارمی';
  const baseFr = input.work?.title.fr || 'Nouvelle œuvre — Atelier Dr Hassan Makaremi';
  const baseEn = input.work?.title.en || 'New Edition — Dr. Hassan Makaremi Studio';

  const plateFa = input.plateNumber ? ` (تابلوی شماره ${input.plateNumber})` : '';
  const plateFr = input.plateNumber ? ` (N° ${input.plateNumber})` : '';
  const plateEn = input.plateNumber ? ` (No. ${input.plateNumber})` : '';
  const dimCompact = input.dimensionsCm ? ` (${input.dimensionsCm})` : '';

  switch (input.kind) {
    case 'original_artwork':
      return {
        title: {
          fa: `اثر اصل: ${baseFa}${plateFa}`,
          fr: `Œuvre originale : ${baseFr}${plateFr}`,
          en: `Original Artwork: ${baseEn}${plateEn}`,
        },
        subtitle: {
          fa: 'اثر یکتای دست‌ساز — همراه با گواهی اصالت Décret Marcus و امضای دیجیتال Ed25519 از پاریس',
          fr: 'Pièce unique exécutée à la main — Certificat d’authenticité Décret Marcus & signature Ed25519',
          en: 'Unique hand-executed piece — Décret Marcus Certificate of Authenticity & Ed25519 signature',
        },
      };
    case 'fine_art_print':
      return {
        title: {
          fa: `چاپ موزه‌ای شماره‌دار${dimCompact}: ${baseFa}${plateFa}`,
          fr: `Tirage Fine Art numéroté${dimCompact} : ${baseFr}${plateFr}`,
          en: `Numbered Fine Art Print${dimCompact}: ${baseEn}${plateEn}`,
        },
        subtitle: {
          fa: 'بازتولید هنری فاخر روی کاغذ پنبه‌ای Hahnemühle 308g با امضا و شماره دستی استاد',
          fr: 'Reproduction d’art numérotée et signée à la main sur Hahnemühle Photo Rag 308g',
          en: 'Hand-signed and numbered archival Fine Art print on Hahnemühle Photo Rag 308g',
        },
      };
    case 'book_physical_signed':
      return {
        title: {
          fa: `نسخه چاپی امضاشده استاد: ${baseFa}`,
          fr: `Exemplaire dédicacé par l’auteur : ${baseFr}`,
          en: `Author-Signed Copy: ${baseEn}`,
        },
        subtitle: {
          fa: 'نسخه فیزیکی با امضا و تقدیم‌نامه اختصاصی دکتر مکارمی — ارسال از پاریس (Loi Lang & Darcos)',
          fr: 'Livre neuf au prix unique éditeur (Loi Lang) avec dédicace manuscrite — Expédié depuis Paris',
          en: 'Printed edition with Dr. Makaremi’s handwritten dedication — Shipped from Paris',
        },
      };
    case 'book_digital_ebook':
      return {
        title: {
          fa: `نسخه دیجیتال رسمی (PDF/eBook): ${baseFa}`,
          fr: `Édition numérique officielle (PDF/eBook) : ${baseFr}`,
          en: `Official Digital Edition (PDF/eBook): ${baseEn}`,
        },
        subtitle: {
          fa: 'خودنشر رسمی مؤلف (Artiste-Auteur) — دانلود فوری امن با مجوز اختصاصی',
          fr: 'Auto-édition officielle (Artiste-Auteur) — Téléchargement immédiat sécurisé',
          en: 'Official self-published author edition — Instant secure digital download',
        },
      };
    case 'commission_inquiry':
      return {
        title: {
          fa: `سفارش خوشنویسی اختصاصی: ${baseFa}`,
          fr: `Commande calligraphique sur mesure : ${baseFr}`,
          en: `Bespoke Calligraphy Commission: ${baseEn}`,
        },
        subtitle: {
          fa: 'خلق اثر یکتای دست‌ساز در پاریس (مشمول استثنای حق انصراف آثار سفارشی — Art. L221-28 3°)',
          fr: 'Création originale sur mesure à Paris (bien personnalisé — exclu du droit de rétractation, art. L221-28 3°)',
          en: 'Hand-executed bespoke artwork in Paris (excluded from 14-day withdrawal per Art. L221-28 3°)',
        },
      };
    case 'patronage_edition':
      return {
        title: {
          fa: `حمایت از آرشیو مستقل: ${baseFa}`,
          fr: `Soutien & mécénat archives : ${baseFr}`,
          en: `Archive Preservation Patronage: ${baseEn}`,
        },
        subtitle: {
          fa: 'مشارکت در حفظ دائمی و ترجمه سه‌زبانه آرشیو آزاد برای همگان',
          fr: 'Contribuez à la préservation et la gratuité pérenne des archives trilingues',
          en: 'Support permanent open scholarly access to the trilingual archive',
        },
      };
  }
}
