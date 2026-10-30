import type { MetadataRoute } from 'next';
import {
  getArticles,
  getBooks,
  getVideoSpeeches,
  getExhibitions,
  getArtworks,
} from '@/lib/cms';
import { SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://makaremi.com';

  const [articles, books, speeches, exhibitions, artworks] = await Promise.all([
    getArticles('fa'),
    getBooks('fa'),
    getVideoSpeeches('fa'),
    getExhibitions('fa'),
    getArtworks('fa'),
  ]);

  const sitemapEntries: MetadataRoute.Sitemap = [];

  const staticSections = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/assistant', priority: 0.95, changeFrequency: 'daily' as const },
    { path: '/agent-console', priority: 0.95, changeFrequency: 'daily' as const },
    { path: '/system-status', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/glossary', priority: 0.95, changeFrequency: 'weekly' as const },
    { path: '/books', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/psychoanalysis', priority: 0.85, changeFrequency: 'weekly' as const },
    { path: '/art', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/strategy', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/human-rights', priority: 0.85, changeFrequency: 'weekly' as const },
    { path: '/gallery', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/poetry', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/media', priority: 0.75, changeFrequency: 'weekly' as const },
  ];

  // 1. Static Pages across locales
  for (const locale of SUPPORTED_LOCALES) {
    for (const section of staticSections) {
      const sectionPath =
        locale === 'fr' && section.path === '/psychoanalysis'
          ? '/psychanalyse'
          : section.path;

      sitemapEntries.push({
        url: `${baseUrl}/${locale}${sectionPath}`,
        lastModified: new Date(),
        changeFrequency: section.changeFrequency,
        priority: section.priority,
        alternates: {
          languages: {
            'fa-IR': `${baseUrl}/fa${section.path}`,
            'fr-FR': `${baseUrl}/fr${section.path === '/psychoanalysis' ? '/psychanalyse' : section.path}`,
            'en-US': `${baseUrl}/en${section.path}`,
            'x-default': `${baseUrl}/fa${section.path}`,
          },
        },
      });
    }
  }

  // 2. Books
  for (const b of books) {
    for (const locale of SUPPORTED_LOCALES) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}/books/${b.slug}`,
        lastModified: new Date(b.created_at || Date.now()),
        changeFrequency: 'monthly',
        priority: 0.85,
        alternates: {
          languages: {
            'fa-IR': `${baseUrl}/fa/books/${b.slug}`,
            'fr-FR': `${baseUrl}/fr/books/${b.slug}`,
            'en-US': `${baseUrl}/en/books/${b.slug}`,
            'x-default': `${baseUrl}/fa/books/${b.slug}`,
          },
        },
      });
    }
  }

  // 3. Articles
  for (const art of articles) {
    for (const locale of SUPPORTED_LOCALES) {
      const pillarSegment =
        art.pillar === 'psychoanalysis'
          ? locale === 'fr'
            ? 'psychanalyse'
            : 'psychoanalysis'
          : art.pillar === 'art_calligraphy'
          ? 'art'
          : art.pillar === 'cultural_strategy'
          ? 'strategy'
          : 'human-rights';

      sitemapEntries.push({
        url: `${baseUrl}/${locale}/${pillarSegment}/articles/${art.slug}`,
        lastModified: new Date(art.published_at || art.created_at || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.85,
        alternates: {
          languages: {
            'fa-IR': `${baseUrl}/fa/${art.pillar === 'psychoanalysis' ? 'psychoanalysis' : art.pillar === 'art_calligraphy' ? 'art' : art.pillar === 'cultural_strategy' ? 'strategy' : 'human-rights'}/articles/${art.slug}`,
            'fr-FR': `${baseUrl}/fr/${art.pillar === 'psychoanalysis' ? 'psychanalyse' : art.pillar === 'art_calligraphy' ? 'art' : art.pillar === 'cultural_strategy' ? 'strategy' : 'human-rights'}/articles/${art.slug}`,
            'en-US': `${baseUrl}/en/${art.pillar === 'psychoanalysis' ? 'psychoanalysis' : art.pillar === 'art_calligraphy' ? 'art' : art.pillar === 'cultural_strategy' ? 'strategy' : 'human-rights'}/articles/${art.slug}`,
            'x-default': `${baseUrl}/fa/${art.pillar === 'psychoanalysis' ? 'psychoanalysis' : art.pillar === 'art_calligraphy' ? 'art' : art.pillar === 'cultural_strategy' ? 'strategy' : 'human-rights'}/articles/${art.slug}`,
          },
        },
      });
    }
  }

  // 4. Speeches
  for (const sp of speeches) {
    for (const locale of SUPPORTED_LOCALES) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}/speeches/${sp.slug}`,
        lastModified: new Date(sp.event_date || Date.now()),
        changeFrequency: 'monthly',
        priority: 0.75,
        alternates: {
          languages: {
            'fa-IR': `${baseUrl}/fa/speeches/${sp.slug}`,
            'fr-FR': `${baseUrl}/fr/speeches/${sp.slug}`,
            'en-US': `${baseUrl}/en/speeches/${sp.slug}`,
            'x-default': `${baseUrl}/fa/speeches/${sp.slug}`,
          },
        },
      });
    }
  }

  // 5. Exhibitions
  for (const ex of exhibitions) {
    for (const locale of SUPPORTED_LOCALES) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}/exhibitions/${ex.slug}`,
        lastModified: new Date(ex.start_date || Date.now()),
        changeFrequency: 'monthly',
        priority: 0.75,
        alternates: {
          languages: {
            'fa-IR': `${baseUrl}/fa/exhibitions/${ex.slug}`,
            'fr-FR': `${baseUrl}/fr/exhibitions/${ex.slug}`,
            'en-US': `${baseUrl}/en/exhibitions/${ex.slug}`,
            'x-default': `${baseUrl}/fa/exhibitions/${ex.slug}`,
          },
        },
      });
    }
  }

  return sitemapEntries;
}
