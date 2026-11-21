import type { Metadata } from 'next';
import wpFullCatalog from '@/data/wp-full-catalog.json';
import { CurationStudioClient } from '@/components/curation/CurationStudioClient';
import { isValidLocale } from '@/lib/i18n';
import { buildTrilingualMetadata } from '@/lib/seo-helpers';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return { robots: { index: false, follow: false } };
  return buildTrilingualMetadata({
    locale,
    path: '/curation-studio',
    title: 'میز کار تعاملی بازنگری، تکمیل آرشیو و تصمیم‌گیری استاد دکتر حسن مکارمی',
    description:
      'پورتال اختصاصی بررسی و دسته‌بندی ۳٬۱۷۲ رکورد سایت، بارگذاری تصاویر جلد و صفحات برگزیده کتاب‌ها، ضبط صدای استاد و تایید دستیار هوشمند.',
    noIndex: true,
  });
}

export default function CurationStudioPage() {
  return <CurationStudioClient catalog={wpFullCatalog as any} />;
}

