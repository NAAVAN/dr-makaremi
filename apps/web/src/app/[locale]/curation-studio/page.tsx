import type { Metadata } from 'next';
import wpFullCatalog from '@/data/wp-full-catalog.json';
import { CurationStudioClient } from '@/components/curation/CurationStudioClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'میز کار تعاملی بازنگری، تکمیل آرشیو و تصمیم‌گیری استاد دکتر حسن مکارمی',
    description:
      'پورتال اختصاصی بررسی و دسته‌بندی ۳٬۱۷۲ رکورد سایت، بارگذاری تصاویر جلد و صفحات برگزیده کتاب‌ها، ضبط صدای استاد و تایید دستیار هوشمند.',
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `https://makaremi.com/${locale}/curation-studio`,
      types: {
        'text/markdown': `https://makaremi.com/${locale}/curation-studio.md`,
      },
    },
  };
}

export default function CurationStudioPage() {
  return <CurationStudioClient catalog={wpFullCatalog as any} />;
}

