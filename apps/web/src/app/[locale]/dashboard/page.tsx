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
    path: '/dashboard',
    title: 'پیشخوان رسمی مدیریت آثار و ترجمه‌ها | دکتر حسن مکارمی',
    description:
      'پیشخوان دائمی مدیریت محتوا، استانداردسازی رسانه، غنی‌سازی آثار و کنترل زنده ترجمه‌های سه‌زبانه.',
    noIndex: true,
  });
}

export default async function ProfessorDashboardPage({
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
        targetName="dashboard"
        usingDefaultFallback={usingDefaultFallback}
      />
    );
  }

  return (
    <StudioDashboardShell
      locale={locale as Locale}
      routeMode="dashboard"
      initialAiStatus={getAiRuntimeStatus()}
    />
  );
}
