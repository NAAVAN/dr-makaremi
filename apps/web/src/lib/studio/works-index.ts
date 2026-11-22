import { revalidatePath } from 'next/cache';
import type {
  ContentPillar,
  ContentStatus,
  Locale,
  StudioLocaleContentInput,
  TranslationWorkDetail,
  TranslationWorkSummary,
} from '@makaremi/shared';
import {
  getArchivePages,
  getArticles,
  getArtworks,
  getBooks,
  getExhibitions,
  getPoems,
  getVideoSpeeches,
  invalidateCmsCollectionsCache,
  mapPillarToCanonicalSlug,
} from '../cms';
import { loadPackTranslations, type TranslationCollectionName } from '../vault-loader';
import { detectOriginalLanguage } from '../work-language';
import { loadWorkEnrichmentsMap } from './overlays';

type GenericTranslation = {
  languages_code?: string;
  title?: string;
  subtitle?: string | null;
  executive_summary?: string | null;
  synopsis?: string | null;
  description?: string | null;
  excerpt?: string | null;
  body_markdown?: string | null;
  transcript_markdown?: string | null;
  curatorial_statement_markdown?: string | null;
  commentary_markdown?: string | null;
  description_markdown?: string | null;
  curator_critique_markdown?: string | null;
  verses?: Array<{ line_index: number; hemistich_a: string; hemistich_b?: string | null }> | null;
};

type GenericWorkItem = {
  id: string;
  slug: string;
  pillar?: ContentPillar;
  status: ContentStatus;
  created_at: string;
  updated_at?: string;
  youtube_video_id?: string | null;
  translations?: GenericTranslation[];
  [key: string]: unknown;
};

function normaliseToStudioLocaleInput(tr: GenericTranslation, fallbackLang: string): StudioLocaleContentInput {
  return {
    languages_code: tr.languages_code || fallbackLang,
    title: tr.title || '',
    subtitle: tr.subtitle || undefined,
    summary: tr.executive_summary || tr.synopsis || tr.description || tr.excerpt || undefined,
    body_markdown:
      tr.body_markdown ||
      tr.transcript_markdown ||
      tr.curatorial_statement_markdown ||
      tr.description_markdown ||
      undefined,
    commentary_markdown: tr.commentary_markdown || tr.curator_critique_markdown || undefined,
    verses: Array.isArray(tr.verses)
      ? tr.verses.map((v) => ({
          line_index: v.line_index,
          hemistich_a: v.hemistich_a,
          hemistich_b: v.hemistich_b || undefined,
        }))
      : undefined,
  };
}

async function fetchCollectionRaw(collection: TranslationCollectionName): Promise<GenericWorkItem[]> {
  switch (collection) {
    case 'articles':
      return (await getArticles('fa')) as unknown as GenericWorkItem[];
    case 'books':
      return (await getBooks('fa')) as unknown as GenericWorkItem[];
    case 'poems':
      return (await getPoems('fa')) as unknown as GenericWorkItem[];
    case 'videos':
      return (await getVideoSpeeches('fa')) as unknown as GenericWorkItem[];
    case 'artworks':
      return (await getArtworks('fa')) as unknown as GenericWorkItem[];
    case 'exhibitions':
      return (await getExhibitions('fa')) as unknown as GenericWorkItem[];
    case 'pages':
      return (await getArchivePages('fa')) as unknown as GenericWorkItem[];
  }
}

export async function listStudioWorks(params: {
  collection?: TranslationCollectionName | 'all';
  originalLocale?: Locale | 'all';
  translationState?: 'all' | 'complete' | 'missing' | 'enriched';
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  items: TranslationWorkSummary[];
  total: number;
  page: number;
  pageSize: number;
  stats: {
    totalWorks: number;
    trilingualComplete: number;
    missingAnyLocale: number;
    enrichedWorks: number;
    byCollection: Record<TranslationCollectionName, number>;
  };
}> {
  const collections: TranslationCollectionName[] = [
    'articles',
    'books',
    'poems',
    'videos',
    'artworks',
    'exhibitions',
    'pages',
  ];

  const enrichments = loadWorkEnrichmentsMap();
  const packCaches = {
    articles: loadPackTranslations('articles'),
    books: loadPackTranslations('books'),
    poems: loadPackTranslations('poems'),
    videos: loadPackTranslations('videos'),
    artworks: loadPackTranslations('artworks'),
    exhibitions: loadPackTranslations('exhibitions'),
    pages: loadPackTranslations('pages'),
  };

  const allSummaries: TranslationWorkSummary[] = [];
  const byCollection = {} as Record<TranslationCollectionName, number>;

  for (const col of collections) {
    const rawItems = await fetchCollectionRaw(col);
    byCollection[col] = rawItems.length;
    const packMap = packCaches[col];

    for (const item of rawItems) {
      const trs = item.translations || [];
      const origLoc = detectOriginalLanguage(trs, 'fa');
      const availableSet = new Set<Locale>();
      const localeTitles: Partial<Record<Locale, string>> = {};
      const provenanceByLocale: Partial<Record<Locale, string>> = {};

      for (const tr of trs) {
        const prefix = (tr.languages_code || '').slice(0, 2).toLowerCase() as Locale;
        if (prefix === 'fa' || prefix === 'fr' || prefix === 'en') {
          availableSet.add(prefix);
          if (!localeTitles[prefix] && tr.title) {
            localeTitles[prefix] = tr.title;
          }
          if (prefix === origLoc) {
            provenanceByLocale[prefix] = 'authentic_original';
          }
        }
      }

      const packEntry = packMap[item.slug];
      if (packEntry) {
        for (const [lc, rec] of Object.entries(packEntry)) {
          const prefix = lc.slice(0, 2).toLowerCase() as Locale;
          if (prefix === 'fa' || prefix === 'fr' || prefix === 'en') {
            availableSet.add(prefix);
            if (!localeTitles[prefix] && typeof rec.title === 'string') {
              localeTitles[prefix] = rec.title;
            }
            if (typeof rec.provenance === 'string') {
              provenanceByLocale[prefix] = rec.provenance;
            }
          }
        }
      }

      const availableLocales = (['fa', 'fr', 'en'] as Locale[]).filter((l) => availableSet.has(l));
      const missingLocales = (['fa', 'fr', 'en'] as Locale[]).filter((l) => !availableSet.has(l));
      const primaryTitle =
        localeTitles[origLoc] || localeTitles.fa || localeTitles.fr || localeTitles.en || item.slug;

      const enrich = enrichments[`${col}:${item.slug}`];
      const enrichmentCount = enrich
        ? enrich.notes.length + enrich.links.length + enrich.documents.length
        : 0;

      allSummaries.push({
        collection: col,
        slug: item.slug,
        id: item.id,
        originalLocale: origLoc,
        title: primaryTitle,
        pillar: item.pillar,
        status: item.status || 'published',
        availableLocales,
        missingLocales,
        localeTitles,
        provenanceByLocale,
        updatedAt: item.updated_at || item.created_at,
        hasVerses: col === 'poems',
        hasTranscript: Boolean(trs.some((t) => Boolean(t.transcript_markdown))),
        enrichmentCount,
      });
    }
  }

  const totalWorks = allSummaries.length;
  const trilingualComplete = allSummaries.filter((s) => s.missingLocales.length === 0).length;
  const missingAnyLocale = totalWorks - trilingualComplete;
  const enrichedWorks = allSummaries.filter((s) => (s.enrichmentCount || 0) > 0).length;

  const qLower = (params.q || '').trim().toLowerCase();
  const filtered = allSummaries.filter((s) => {
    if (params.collection && params.collection !== 'all' && s.collection !== params.collection) {
      return false;
    }
    if (params.originalLocale && params.originalLocale !== 'all' && s.originalLocale !== params.originalLocale) {
      return false;
    }
    if (params.translationState === 'complete' && s.missingLocales.length > 0) {
      return false;
    }
    if (params.translationState === 'missing' && s.missingLocales.length === 0) {
      return false;
    }
    if (params.translationState === 'enriched' && (s.enrichmentCount || 0) === 0) {
      return false;
    }
    if (qLower) {
      const hay = [
        s.slug,
        s.title,
        s.localeTitles.fa,
        s.localeTitles.fr,
        s.localeTitles.en,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(qLower)) return false;
    }
    return true;
  });

  const pageSize = Math.min(Math.max(params.pageSize || 30, 5), 100);
  const page = Math.max(params.page || 1, 1);
  const start = (page - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
    stats: {
      totalWorks,
      trilingualComplete,
      missingAnyLocale,
      enrichedWorks,
      byCollection,
    },
  };
}

export async function getStudioWorkDetail(
  collection: TranslationCollectionName,
  slug: string
): Promise<TranslationWorkDetail | null> {
  const items = await fetchCollectionRaw(collection);
  const found = items.find((i) => i.slug === slug);
  if (!found) return null;

  const trs = found.translations || [];
  const originalLocale = detectOriginalLanguage(trs, 'fa');
  const origFallbackCode = originalLocale === 'fa' ? 'fa-IR' : originalLocale === 'fr' ? 'fr-FR' : 'en';
  const originalTr = trs.find((t) => (t.languages_code || '').startsWith(originalLocale)) || trs[0] || {};
  const originalContent = normaliseToStudioLocaleInput(originalTr, origFallbackCode);

  const packEntry = loadPackTranslations(collection)[slug] || {};
  const translations: TranslationWorkDetail['translations'] = {};

  for (const loc of ['fa', 'fr', 'en'] as Locale[]) {
    const nativeMatch = trs.find((t) => (t.languages_code || '').toLowerCase().startsWith(loc));
    const packMatch = packEntry[loc] as Record<string, unknown> | undefined;

    if (packMatch) {
      translations[loc] = {
        ...normaliseToStudioLocaleInput(packMatch as unknown as GenericTranslation, loc === 'fa' ? 'fa-IR' : loc === 'fr' ? 'fr-FR' : 'en'),
        provenance: typeof packMatch.provenance === 'string' ? packMatch.provenance : 'editorial_verified',
        updated_at: typeof packMatch.updated_at === 'string' ? packMatch.updated_at : undefined,
      };
    } else if (nativeMatch) {
      translations[loc] = {
        ...normaliseToStudioLocaleInput(nativeMatch, loc === 'fa' ? 'fa-IR' : loc === 'fr' ? 'fr-FR' : 'en'),
        provenance: loc === originalLocale ? 'authentic_original' : 'native_vault',
      };
    }
  }

  const enrichments = loadWorkEnrichmentsMap();
  return {
    collection,
    slug: found.slug,
    id: found.id,
    originalLocale,
    pillar: found.pillar,
    status: found.status || 'published',
    originalContent,
    translations,
    enrichment: enrichments[`${collection}:${found.slug}`] || null,
    metadata: {
      created_at: found.created_at,
      youtube_video_id: found.youtube_video_id,
      isbn_13: found.isbn_13,
      publication_year: found.publication_year,
    },
  };
}

export function revalidatePublicWorkPaths(
  collection: TranslationCollectionName,
  slug: string,
  pillar?: ContentPillar
): void {
  invalidateCmsCollectionsCache(collection);
  const locales: Locale[] = ['fa', 'fr', 'en'];
  try {
    for (const loc of locales) {
      revalidatePath(`/${loc}`);
      switch (collection) {
        case 'articles': {
          revalidatePath(`/${loc}/articles`);
          revalidatePath(`/${loc}/articles/${slug}`);
          if (pillar) {
            const pSlug = mapPillarToCanonicalSlug(pillar, loc);
            revalidatePath(`/${loc}/${pSlug}/articles`);
            revalidatePath(`/${loc}/${pSlug}/articles/${slug}`);
          }
          break;
        }
        case 'books':
          revalidatePath(`/${loc}/books`);
          revalidatePath(`/${loc}/books/${slug}`);
          break;
        case 'poems':
          revalidatePath(`/${loc}/poetry`);
          revalidatePath(`/${loc}/poetry/${slug}`);
          break;
        case 'videos':
          revalidatePath(`/${loc}/media`);
          revalidatePath(`/${loc}/media/${slug}`);
          break;
        case 'artworks':
        case 'exhibitions':
          revalidatePath(`/${loc}/gallery`);
          revalidatePath(`/${loc}/gallery/${slug}`);
          break;
        case 'pages':
          revalidatePath(`/${loc}/about`);
          break;
      }
    }
  } catch {
    // Revalidation only runs inside Next server request lifecycle
  }
}
