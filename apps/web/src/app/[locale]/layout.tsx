import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  isValidLocale,
  getDirection,
  SUPPORTED_LOCALES,
  type Locale,
} from '@/lib/i18n';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { PwaOfflineBar } from '@/components/common/PwaOfflineBar';
import { JsonLdGraph } from '@/components/seo/JsonLdGraph';
import { buildFullGraph } from '@/lib/schema-org';
import '../../styles/globals.css';
import '../../styles/tokens.css';
import '../../styles/typography.css';

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  const titles: Record<Locale, string> = {
    fa: 'دکتر حسن مکارمی | وب‌سایت رسمی و آرشیو آثار',
    fr: 'Dr Hassan Makaremi | Site Officiel et Archives',
    en: 'Dr. Hassan Makaremi | Official Website & Archives',
  };

  const descriptions: Record<Locale, string> = {
    fa: 'پایگاه رسمی آثار دکتر حسن مکارمی؛ روانکاو بالینی لکانی، پژوهشگر دانشگاه سوربن، هنرمند خوشنویس مدرن و کنشگر حقوق بشر و دادخواهی.',
    fr: "Archives officielles du Dr Hassan Makaremi : Psychanalyste clinicien lacanien, chercheur à la Sorbonne, artiste calligraphe et défenseur des droits de l'homme.",
    en: 'Official archive of Dr. Hassan Makaremi: Clinical Lacanian Psychoanalyst, Sorbonne Researcher, Modern Calligrapher, and Human Rights Defender.',
  };

  return {
    title: {
      default: titles[locale],
      template: `%s | Dr. Hassan Makaremi`,
    },
    description: descriptions[locale],
    metadataBase: new URL('https://makaremi.com'),
    alternates: {
      canonical: `https://makaremi.com/${locale}`,
      languages: {
        'fa-IR': 'https://makaremi.com/fa',
        'fr-FR': 'https://makaremi.com/fr',
        'en-US': 'https://makaremi.com/en',
        'x-default': 'https://makaremi.com/fa',
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) {
    notFound();
  }

  const direction = getDirection(locale);
  const rootGraph = buildFullGraph({ locale: locale as Locale });

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0F766E" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
          rel="stylesheet"
          type="text/css"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[var(--surface-canvas)] text-[var(--foreground)] font-vazirmatn antialiased transition-colors duration-200">
        <JsonLdGraph data={rootGraph} />
        <PwaOfflineBar locale={locale} />
        <Header locale={locale} />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {children}
        </main>
        <Footer locale={locale} />
      </body>
    </html>
  );
}
