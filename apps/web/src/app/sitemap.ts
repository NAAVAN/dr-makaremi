import type { MetadataRoute } from 'next';
import {
  getArticles,
  getBooks,
  getVideoSpeeches,
  getExhibitions,
  getPoems,
  getArchivePages,
} from '@/lib/cms';
import { SUPPORTED_LOCALES } from '@/lib/i18n';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://makaremi.com';

  const [articles, books, speeches, exhibitions, poems, archivePages] = await Promise.all([
    getArticles('fa'),
    getBooks('fa'),
    getVideoSpeeches('fa'),
    getExhibitions('fa'),
    getPoems('fa'),
    getArchivePages('fa'),
  ]);

  const sitemapEntries: MetadataRoute.Sitemap = [];

  const STATIC_LAST_MODIFIED = new Date('2026-11-21T00:00:00Z');

  const staticSections = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/articles', priority: 0.95, changeFrequency: 'daily' as const },
    { path: '/about', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/assistant', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/agent-console', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/system-status', priority: 0.75, changeFrequency: 'weekly' as const },
    { path: '/glossary', priority: 0.95, changeFrequency: 'weekly' as const },
    { path: '/books', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/psychoanalysis', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/psychoanalysis/articles', priority: 0.85, changeFrequency: 'weekly' as const },
    { path: '/art', priority: 0.85, changeFrequency: 'weekly' as const },
    { path: '/art/articles', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/strategy', priority: 0.85, changeFrequency: 'weekly' as const },
    { path: '/strategy/articles', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/human-rights', priority: 0.85, changeFrequency: 'weekly' as const },
    { path: '/human-rights/articles', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/gallery', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/poetry', priority: 0.85, changeFrequency: 'weekly' as const },
    { path: '/hafez', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/media', priority: 0.85, changeFrequency: 'weekly' as const },
    { path: '/shop', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/legal/mentions-legales', priority: 0.4, changeFrequency: 'monthly' as const },
    { path: '/legal/cgv', priority: 0.4, changeFrequency: 'monthly' as const },
    { path: '/legal/confidentialite', priority: 0.4, changeFrequency: 'monthly' as const },
    { path: '/legal/retractation', priority: 0.4, changeFrequency: 'monthly' as const },
  ];

  // 1. Static Pages across locales (with localized French /psychanalyse path mapping)
  for (const locale of SUPPORTED_LOCALES) {
    for (const section of staticSections) {
      const frPath = section.path.replace(/^\/psychoanalysis/, '/psychanalyse');
      const sectionPath = locale === 'fr' ? frPath : section.path;

      sitemapEntries.push({
        url: `${baseUrl}/${locale}${sectionPath}`,
        lastModified: STATIC_LAST_MODIFIED,
        changeFrequency: section.changeFrequency,
        priority: section.priority,
        alternates: {
          languages: {
            'fa-IR': `${baseUrl}/fa${section.path}`,
            'fr-FR': `${baseUrl}/fr${frPath}`,
            en: `${baseUrl}/en${section.path}`,
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
            en: `${baseUrl}/en/books/${b.slug}`,
            'x-default': `${baseUrl}/fa/books/${b.slug}`,
          },
        },
      });
    }
  }

  // 3. Articles (404 migrated scholarly & news articles)
  for (const art of articles) {
    const faPillar =
      art.pillar === 'psychoanalysis'
        ? 'psychoanalysis'
        : art.pillar === 'art_calligraphy'
          ? 'art'
          : art.pillar === 'cultural_strategy'
            ? 'strategy'
            : 'human-rights';
    const frPillar = art.pillar === 'psychoanalysis' ? 'psychanalyse' : faPillar;

    for (const locale of SUPPORTED_LOCALES) {
      const pillarSegment = locale === 'fr' ? frPillar : faPillar;
      sitemapEntries.push({
        url: `${baseUrl}/${locale}/${pillarSegment}/articles/${art.slug}`,
        lastModified: new Date(art.published_at || art.created_at || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.85,
        alternates: {
          languages: {
            'fa-IR': `${baseUrl}/fa/${faPillar}/articles/${art.slug}`,
            'fr-FR': `${baseUrl}/fr/${frPillar}/articles/${art.slug}`,
            en: `${baseUrl}/en/${faPillar}/articles/${art.slug}`,
            'x-default': `${baseUrl}/fa/${faPillar}/articles/${art.slug}`,
          },
        },
      });
    }
  }

  // 4. Videos & Human Rights Speeches (261 migrated videos)
  for (const sp of speeches) {
    const subPath =
      sp.pillar === 'human_rights_dadkhahi'
        ? `human-rights/speeches/${sp.slug}`
        : `media/videos/${sp.slug}`;

    for (const locale of SUPPORTED_LOCALES) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}/${subPath}`,
        lastModified: new Date(sp.event_date || Date.now()),
        changeFrequency: 'monthly',
        priority: 0.75,
        alternates: {
          languages: {
            'fa-IR': `${baseUrl}/fa/${subPath}`,
            'fr-FR': `${baseUrl}/fr/${subPath}`,
            en: `${baseUrl}/en/${subPath}`,
            'x-default': `${baseUrl}/fa/${subPath}`,
          },
        },
      });
    }
  }

  // 5. Exhibitions (57 international exhibitions)
  for (const ex of exhibitions) {
    for (const locale of SUPPORTED_LOCALES) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}/art/exhibitions/${ex.slug}`,
        lastModified: new Date(ex.start_date || Date.now()),
        changeFrequency: 'monthly',
        priority: 0.75,
        alternates: {
          languages: {
            'fa-IR': `${baseUrl}/fa/art/exhibitions/${ex.slug}`,
            'fr-FR': `${baseUrl}/fr/art/exhibitions/${ex.slug}`,
            en: `${baseUrl}/en/art/exhibitions/${ex.slug}`,
            'x-default': `${baseUrl}/fa/art/exhibitions/${ex.slug}`,
          },
        },
      });
    }
  }

  // 6. Poems (300 migrated poems)
  for (const p of poems) {
    for (const locale of SUPPORTED_LOCALES) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}/poetry/poems/${p.slug}`,
        lastModified: new Date(p.created_at || Date.now()),
        changeFrequency: 'monthly',
        priority: 0.7,
        alternates: {
          languages: {
            'fa-IR': `${baseUrl}/fa/poetry/poems/${p.slug}`,
            'fr-FR': `${baseUrl}/fr/poetry/poems/${p.slug}`,
            en: `${baseUrl}/en/poetry/poems/${p.slug}`,
            'x-default': `${baseUrl}/fa/poetry/poems/${p.slug}`,
          },
        },
      });
    }
  }

  // 7. Archival Reference Pages (47 migrated standalone pages)
  for (const pg of archivePages) {
    for (const locale of SUPPORTED_LOCALES) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}/about/${pg.slug}`,
        lastModified: new Date(pg.created_at || Date.now()),
        changeFrequency: 'monthly',
        priority: 0.7,
        alternates: {
          languages: {
            'fa-IR': `${baseUrl}/fa/about/${pg.slug}`,
            'fr-FR': `${baseUrl}/fr/about/${pg.slug}`,
            en: `${baseUrl}/en/about/${pg.slug}`,
            'x-default': `${baseUrl}/fa/about/${pg.slug}`,
          },
        },
      });
    }
  }

  return sitemapEntries;
}
