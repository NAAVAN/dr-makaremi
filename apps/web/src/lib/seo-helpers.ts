import type { Metadata } from 'next';
import type { Locale } from '@makaremi/shared';
import { sanitizeMetaString } from './academic-metadata';

const BASE_URL = 'https://makaremi.com';
const SITE_NAME = 'Dr. Hassan Makaremi | دکتر حسن مکارمی';
const DEFAULT_OG_IMAGE = `${BASE_URL}/opengraph-image`;

const OG_LOCALE_MAP: Record<Locale, string> = {
  fa: 'fa_IR',
  fr: 'fr_FR',
  en: 'en_US',
};

export interface TrilingualMetadataOptions {
  locale: Locale;
  /** Locale-relative path starting with '/' (or '' for homepage), e.g. '/about', '/books/slug', '/psychoanalysis/articles' */
  path: string;
  /** Optional French-specific path when French uses a localized segment (e.g. '/psychanalyse/articles') */
  frPath?: string;
  title: string;
  description: string;
  ogType?: 'website' | 'article' | 'profile' | 'book';
  imageUrl?: string | null;
  includeMarkdownTwin?: boolean;
  noIndex?: boolean;
  publishedTime?: string | null;
  modifiedTime?: string | null;
  other?: Record<string, string | number | Array<string | number>>;
}

export function buildTrilingualMetadata(opts: TrilingualMetadataOptions): Metadata {
  const {
    locale,
    path,
    frPath,
    ogType = 'website',
    imageUrl,
    includeMarkdownTwin = true,
    noIndex = false,
    publishedTime,
    modifiedTime,
    other,
  } = opts;

  const cleanTitle = sanitizeMetaString(opts.title);
  const cleanDescription = sanitizeMetaString(opts.description).slice(0, 160);

  const normPath = path === '/' ? '' : path;
  const normFrPath = frPath ? (frPath === '/' ? '' : frPath) : normPath;
  const currentPath = locale === 'fr' ? normFrPath : normPath;

  const canonicalUrl = `${BASE_URL}/${locale}${currentPath}`;
  const faUrl = `${BASE_URL}/fa${normPath}`;
  const frUrl = `${BASE_URL}/fr${normFrPath}`;
  const enUrl = `${BASE_URL}/en${normPath}`;
  const markdownTwinUrl = `${canonicalUrl}.md`;

  const ogImage = imageUrl && imageUrl.startsWith('http') ? imageUrl : DEFAULT_OG_IMAGE;

  const alternateLocales = (['fa', 'fr', 'en'] as Locale[])
    .filter((l) => l !== locale)
    .map((l) => OG_LOCALE_MAP[l]);

  return {
    metadataBase: new URL(BASE_URL),
    title: cleanTitle,
    description: cleanDescription,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'fa-IR': faUrl,
        'fr-FR': frUrl,
        'en-US': enUrl,
        'x-default': faUrl,
      },
      ...(includeMarkdownTwin
        ? {
            types: {
              'text/markdown': markdownTwinUrl,
            },
          }
        : {}),
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: { index: false, follow: false },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
    openGraph: {
      title: cleanTitle,
      description: cleanDescription,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: OG_LOCALE_MAP[locale],
      alternateLocale: alternateLocales,
      type: ogType,
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: cleanTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: cleanTitle,
      description: cleanDescription,
      images: [ogImage],
    },
    ...(other ? { other } : {}),
  };
}
