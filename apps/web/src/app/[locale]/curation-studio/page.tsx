import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale, type Locale } from '@/lib/i18n';
import { buildTrilingualMetadata } from '@/lib/seo-helpers';
import { getStudioSecretConfiguration, isStudioPageAuthenticated } from '@/lib/studio/auth';
import { getAiRuntimeStatus } from '@/lib/ai/provider-adapter';
import { StudioAuthGate } from '@/components/studio/StudioAuthGate';
import { StudioDashboardShell } from '@/components/studio/StudioDashboardShell';

export const dynamic = 'force-dynamic';

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
    title: 'میز کار و آتلیه نشر آثار استاد دکتر حسن مکارمی',
    description:
      'پورتال اختصاصی ثبت آثار جدید، استانداردسازی رسانه، غنی‌سازی آرشیو پیشین و مرکز کنترل ترجمه‌های دکتر حسن مکارمی.',
    noIndex: true,
  });
}

export default async function CurationStudioPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const authenticated = await isStudioPageAuthenticated();
  const { usingDefaultFallback } = getStudioSecretConfiguration();

  if (!authenticated) {
    return (
      <StudioAuthGate
        locale={locale as Locale}
        targetName="curation-studio"
        usingDefaultFallback={usingDefaultFallback}
      />
    );
  }

  return (
    <StudioDashboardShell
      locale={locale as Locale}
      routeMode="curation-studio"
      initialAiStatus={getAiRuntimeStatus()}
    />
  );
}
