import type { Metadata } from 'next';
import Link from 'next/link';
import { isValidLocale, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { buildTrilingualMetadata } from '@/lib/seo-helpers';

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return { robots: { index: false, follow: false } };
  return buildTrilingualMetadata({
    locale,
    path: '/offline',
    title:
      locale === 'fa'
        ? 'حالت مطالعه آفلاین | دکتر حسن مکارمی'
        : locale === 'fr'
          ? 'Mode Lecture Hors-Ligne | Dr Hassan Makaremi'
          : 'Offline Reading Mode | Dr Hassan Makaremi',
    description:
      locale === 'fa'
        ? 'حالت مطالعه آفلاین وب‌سایت رسمی دکتر حسن مکارمی برای دسترسی به اسناد ذخیره‌شده بدون اتصال به اینترنت.'
        : locale === 'fr'
          ? 'Mode lecture hors-ligne des archives officielles du Dr Hassan Makaremi.'
          : 'Offline reading mode for the official archive of Dr Hassan Makaremi.',
    noIndex: true,
    includeMarkdownTwin: false,
  });
}

export default async function OfflinePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isValidLocale(rawLocale) ? rawLocale : 'fa';
  const isFa = locale === 'fa';
  const isFr = locale === 'fr';

  return (
    <div className="container py-16 px-5 text-center space-y-6 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl sm:text-3xl font-black text-[var(--foreground)]">
        {isFa
          ? 'حالت مطالعه آفلاین (دسترسی بدون اینترنت)'
          : isFr
            ? 'Mode lecture hors-ligne'
            : 'Offline Reading Mode'}
      </h1>
      <p className="text-base text-[var(--foreground-muted)] leading-relaxed">
        {isFa
          ? 'ارتباط شما با شبکه اینترنت یا VPN قطع شده است. مقالات و بخش‌هایی از کتاب‌ها که پیش‌تر باز کرده‌اید همچنان از طریق حافظه محلی مرورگر در دسترس شما قرار دارند.'
          : isFr
            ? 'Votre connexion réseau est interrompue. Les articles et extraits précédemment consultés restent accessibles depuis le cache local de votre navigateur.'
            : 'Your internet connection is currently unavailable. Previously visited essays and book excerpts remain accessible from your browser’s local archive cache.'}
      </p>
      <Link
        href={`/${locale}`}
        className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-semibold text-sm transition-colors"
      >
        {isFa
          ? 'تلاش مجدد برای اتصال'
          : isFr
            ? 'Réessayer la connexion'
            : 'Retry Connection'}
      </Link>
    </div>
  );
}
