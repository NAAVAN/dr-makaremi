import crypto from 'node:crypto';
import type {
  ArchivePage,
  Article,
  Artwork,
  Book,
  Exhibition,
  Locale,
  ManualTranslationQueueItem,
  Poem,
  StudioLocaleContentInput,
  StudioWorkDraft,
  WorkEnrichmentOverlay,
  VideoSpeech,
} from '@makaremi/shared';
import {
  loadPackTranslations,
  readOverlayJson,
  writeOverlayJson,
  writePackTranslationEntry,
  type TranslationCollectionName,
} from '../vault-loader';
import { buildCanonicalString, computeCanonicalSha256, signWithEd25519 } from '../crypto';
import { getAiRuntimeStatus, translateWorkWithAiEngine } from '../ai/provider-adapter';
import { normaliseExternalVideoUrl, normaliseStudioText } from './media-gatekeeper';

export function loadWorkEnrichmentsMap(): Record<string, WorkEnrichmentOverlay> {
  return readOverlayJson<Record<string, WorkEnrichmentOverlay>>('work-enrichments.json', {});
}

export function saveWorkEnrichmentEntry(
  overlay: Omit<WorkEnrichmentOverlay, 'updatedAt' | 'contentSha256' | 'signatureEd25519'>
): WorkEnrichmentOverlay {
  const map = { ...loadWorkEnrichmentsMap() };
  const key = `${overlay.collection}:${overlay.slug}`;
  const updatedAt = new Date().toISOString();
  const canonicalPayload = buildCanonicalString({
    slug: `${overlay.collection}:${overlay.slug}:enrichment`,
    locale: 'fa',
    title: overlay.slug,
    body_markdown: JSON.stringify({
      links: overlay.links,
      notes: overlay.notes,
      documents: overlay.documents.map((d) => ({ id: d.id, title: d.title, fileName: d.fileName })),
    }),
    published_at: updatedAt,
  });

  const signed: WorkEnrichmentOverlay = {
    ...overlay,
    updatedAt,
    contentSha256: computeCanonicalSha256(canonicalPayload),
    signatureEd25519: signWithEd25519(canonicalPayload),
  };

  map[key] = signed;
  writeOverlayJson('work-enrichments.json', map);
  return signed;
}

export function loadCustomStudioWorks(): StudioWorkDraft[] {
  return readOverlayJson<StudioWorkDraft[]>('custom-works.json', []);
}

export function saveCustomStudioWork(draft: StudioWorkDraft): StudioWorkDraft[] {
  const list = [...loadCustomStudioWorks()];
  const idx = list.findIndex((item) => item.id === draft.id);
  if (idx >= 0) {
    list[idx] = draft;
  } else {
    list.unshift(draft);
  }
  writeOverlayJson('custom-works.json', list);
  return list;
}

export function loadManualTranslationQueue(): ManualTranslationQueueItem[] {
  return readOverlayJson<ManualTranslationQueueItem[]>('manual-translation-queue.json', []);
}

export function upsertManualTranslationQueueItem(item: ManualTranslationQueueItem): ManualTranslationQueueItem[] {
  const list = [...loadManualTranslationQueue()];
  const idx = list.findIndex((q) => q.slug === item.slug && q.collection === item.collection);
  if (idx >= 0) {
    list[idx] = item;
  } else {
    list.unshift(item);
  }
  writeOverlayJson('manual-translation-queue.json', list);
  return list;
}

export function markManualTranslationCompleted(collection: TranslationCollectionName, slug: string): void {
  const list = loadManualTranslationQueue().map((item) =>
    item.collection === collection && item.slug === slug
      ? { ...item, status: 'completed' as const, completedAt: new Date().toISOString() }
      : item
  );
  writeOverlayJson('manual-translation-queue.json', list);
}

export function loadServerDraftsMap(): Record<string, StudioWorkDraft> {
  return readOverlayJson<Record<string, StudioWorkDraft>>('drafts-backup.json', {});
}

export function saveServerDraft(draft: StudioWorkDraft): Record<string, StudioWorkDraft> {
  const map = { ...loadServerDraftsMap() };
  map[draft.id] = draft;
  writeOverlayJson('drafts-backup.json', map);
  return map;
}

export function deleteServerDraft(id: string): void {
  const map = { ...loadServerDraftsMap() };
  if (map[id]) {
    delete map[id];
    writeOverlayJson('drafts-backup.json', map);
  }
}

export function workTypeToCollection(workType: StudioWorkDraft['workType']): TranslationCollectionName {
  switch (workType) {
    case 'article':
      return 'articles';
    case 'book':
      return 'books';
    case 'poem':
      return 'poems';
    case 'video':
      return 'videos';
    case 'artwork':
      return 'artworks';
    case 'exhibition':
      return 'exhibitions';
    case 'page':
      return 'pages';
  }
}

export function createWorkSlug(title: string, workType: StudioWorkDraft['workType']): string {
  const ascii = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  const suffix = crypto.createHash('sha1').update(`${title}:${Date.now()}`).digest('hex').slice(0, 6);
  return ascii ? `${ascii}-${suffix}` : `${workType}-${Date.now().toString(36)}-${suffix}`;
}

export async function publishOrQueueStudioDraft(draft: StudioWorkDraft): Promise<{
  slug: string;
  collection: TranslationCollectionName;
  publishedDraft: StudioWorkDraft;
  queuedManualTargets: Locale[];
  autoTranslatedTargets: Locale[];
}> {
  const collection = workTypeToCollection(draft.workType);
  const slug = draft.id.startsWith('slug:') ? draft.id.slice(5) : createWorkSlug(draft.primary.title || draft.workType, draft.workType);
  const nowIso = new Date().toISOString();

  // Normalise primary text cleanly
  const normalisedPrimary: StudioLocaleContentInput = {
    ...draft.primary,
    languages_code: draft.originalLocale === 'fa' ? 'fa-IR' : draft.originalLocale === 'fr' ? 'fr-FR' : 'en',
    title: normaliseStudioText(draft.primary.title, draft.originalLocale),
    subtitle: draft.primary.subtitle ? normaliseStudioText(draft.primary.subtitle, draft.originalLocale) : undefined,
    summary: draft.primary.summary ? normaliseStudioText(draft.primary.summary, draft.originalLocale) : undefined,
    body_markdown: draft.primary.body_markdown
      ? normaliseStudioText(draft.primary.body_markdown, draft.originalLocale)
      : undefined,
    commentary_markdown: draft.primary.commentary_markdown
      ? normaliseStudioText(draft.primary.commentary_markdown, draft.originalLocale)
      : undefined,
  };

  const allLocales: Locale[] = ['fa', 'fr', 'en'];
  const otherLocales = allLocales.filter((l) => l !== draft.originalLocale);
  const optionalTranslations: Partial<Record<Locale, StudioLocaleContentInput>> = {
    ...(draft.optionalTranslations || {}),
  };

  const aiStatus = getAiRuntimeStatus();
  const autoTranslatedTargets: Locale[] = [];
  const queuedManualTargets: Locale[] = [];

  for (const targetLoc of otherLocales) {
    const provided = optionalTranslations[targetLoc];
    const hasProvided = Boolean(
      provided &&
        (provided.title?.trim() || provided.body_markdown?.trim() || (provided.verses && provided.verses.length > 0))
    );

    if (hasProvided && provided) {
      const normalisedTarget: StudioLocaleContentInput = {
        ...provided,
        languages_code: targetLoc === 'fa' ? 'fa-IR' : targetLoc === 'fr' ? 'fr-FR' : 'en',
        title: normaliseStudioText(provided.title || normalisedPrimary.title, targetLoc),
        subtitle: provided.subtitle ? normaliseStudioText(provided.subtitle, targetLoc) : undefined,
        summary: provided.summary ? normaliseStudioText(provided.summary, targetLoc) : undefined,
        body_markdown: provided.body_markdown
          ? normaliseStudioText(provided.body_markdown, targetLoc)
          : undefined,
        commentary_markdown: provided.commentary_markdown
          ? normaliseStudioText(provided.commentary_markdown, targetLoc)
          : undefined,
      };
      writePackTranslationEntry(collection, slug, normalisedTarget.languages_code, {
        ...normalisedTarget,
        provenance: 'editorial_verified',
        updated_at: nowIso.slice(0, 10),
      });
      optionalTranslations[targetLoc] = normalisedTarget;
      continue;
    }

    if (aiStatus.hasApiKeyConfigured && aiStatus.autoTranslateOnPublish) {
      const aiRes = await translateWorkWithAiEngine({
        workType: draft.workType,
        originalLocale: draft.originalLocale,
        targetLocale: targetLoc,
        source: normalisedPrimary,
      });
      if (aiRes.ok) {
        writePackTranslationEntry(collection, slug, aiRes.translation.languages_code, {
          ...aiRes.translation,
          provenance: 'glossary_locked_ai',
          updated_at: nowIso.slice(0, 10),
        });
        optionalTranslations[targetLoc] = aiRes.translation;
        autoTranslatedTargets.push(targetLoc);
        continue;
      }
    }

    queuedManualTargets.push(targetLoc);
  }

  if (queuedManualTargets.length > 0) {
    upsertManualTranslationQueueItem({
      id: `mtq-${collection}-${slug}`,
      draftId: draft.id,
      slug,
      collection,
      originalLocale: draft.originalLocale,
      targetLocales: queuedManualTargets,
      sourceTitle: normalisedPrimary.title,
      sourcePayload: normalisedPrimary,
      status: 'pending_manual_translation',
      queuedAt: nowIso,
    });
  } else {
    markManualTranslationCompleted(collection, slug);
  }

  const publishedDraft: StudioWorkDraft = {
    ...draft,
    id: `slug:${slug}`,
    primary: normalisedPrimary,
    optionalTranslations,
    status: queuedManualTargets.length > 0 ? 'queued_manual_translation' : 'published',
    updatedAt: nowIso,
  };

  saveCustomStudioWork(publishedDraft);
  deleteServerDraft(draft.id);

  return {
    slug,
    collection,
    publishedDraft,
    queuedManualTargets,
    autoTranslatedTargets,
  };
}

/**
 * Converts a stored StudioWorkDraft into CMS-compatible Article / Book / Poem / Video / Artwork / Exhibition
 * so newly published professor works immediately participate in the public archive.
 */
export function buildCustomArticleFromDraft(d: StudioWorkDraft): Article {
  const slug = d.id.startsWith('slug:') ? d.id.slice(5) : d.id;
  const packMap = loadPackTranslations('articles')[slug] || {};
  const baseBody = d.primary.body_markdown || d.primary.summary || '';
  const canon = buildCanonicalString({
    slug,
    locale: d.originalLocale,
    title: d.primary.title,
    body_markdown: baseBody,
    published_at: d.createdAt,
  });

  const trList = [
    {
      id: `custom-tr-${slug}-${d.originalLocale}`,
      articles_id: `custom-${slug}`,
      languages_code: d.primary.languages_code,
      title: d.primary.title,
      executive_summary: d.primary.summary || d.seo.metaDescription || '',
      body_markdown: baseBody,
      meta_title: d.seo.metaTitle || null,
      meta_description: d.seo.metaDescription || null,
    },
  ];

  for (const [loc, tr] of Object.entries(d.optionalTranslations || {})) {
    if (!tr || !tr.title) continue;
    trList.push({
      id: `custom-tr-${slug}-${loc}`,
      articles_id: `custom-${slug}`,
      languages_code: tr.languages_code,
      title: tr.title,
      executive_summary: tr.summary || '',
      body_markdown: tr.body_markdown || '',
      meta_title: d.seo.metaTitle || null,
      meta_description: d.seo.metaDescription || null,
    });
  }

  // Merge pack overrides if manual translations were later added in Control Room
  for (const [loc, packRec] of Object.entries(packMap)) {
    if (trList.some((x) => x.languages_code.slice(0, 2).toLowerCase() === loc)) continue;
    trList.push({
      id: `pack-custom-${slug}-${loc}`,
      articles_id: `custom-${slug}`,
      languages_code: String(packRec.languages_code || loc),
      title: String(packRec.title || d.primary.title),
      executive_summary: String(packRec.summary || packRec.executive_summary || ''),
      body_markdown: String(packRec.body_markdown || ''),
      meta_title: null,
      meta_description: null,
    });
  }

  return {
    id: `custom-${slug}`,
    slug,
    pillar: d.pillar,
    status: 'published',
    cover_image_url: d.primaryAsset?.dataUrl || null,
    pdf_url: d.documentAsset?.dataUrl || null,
    categories: d.category ? [d.category] : [],
    tags: d.seo.keywords ? d.seo.keywords.split(/[،,]/).map((s) => s.trim()).filter(Boolean) : [],
    content_sha256: computeCanonicalSha256(canon),
    signature_ed25519: signWithEd25519(canon),
    published_at: d.createdAt,
    created_at: d.createdAt,
    updated_at: d.updatedAt,
    translations: trList,
  };
}

export function buildCustomBookFromDraft(d: StudioWorkDraft, index: number): Book {
  const slug = d.id.startsWith('slug:') ? d.id.slice(5) : d.id;
  return {
    id: `custom-book-${slug}`,
    slug,
    isbn_13: d.isbnOrDimensions || null,
    publication_year: Number.parseInt(d.publicationYear, 10) || new Date().getFullYear(),
    page_count: Number.parseInt(d.book3DSpec?.pageCount || '', 10) || null,
    pillar: d.pillar,
    cover_image_url: d.book3DSpec?.frontCover?.dataUrl || d.primaryAsset?.dataUrl || null,
    genres: d.category ? [d.category] : [],
    order_index: index,
    status: 'published',
    created_at: d.createdAt,
    translations: [
      {
        id: `custom-book-tr-${slug}-${d.originalLocale}`,
        books_id: `custom-book-${slug}`,
        languages_code: d.primary.languages_code,
        title: d.primary.title,
        subtitle: d.primary.subtitle || null,
        publisher_name: d.publisherOrVenue || 'انتشارات مکارمی',
        synopsis: d.primary.summary || d.primary.body_markdown || '',
        geo_acquisition_links: d.externalUrl
          ? {
              iran: [],
              international: [{ platform: 'Publisher / Direct', url: d.externalUrl, label: d.publisherOrVenue || 'Acquire' }],
            }
          : { iran: [], international: [] },
      },
    ],
  };
}

export function buildCustomPoemFromDraft(d: StudioWorkDraft): Poem {
  const slug = d.id.startsWith('slug:') ? d.id.slice(5) : d.id;
  const fallbackVerses = (d.primary.body_markdown || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, i) => ({ line_index: i + 1, hemistich_a: line }));

  return {
    id: `custom-poem-${slug}`,
    slug,
    creation_year: Number.parseInt(d.publicationYear, 10) || new Date().getFullYear(),
    artwork_image_url: d.primaryAsset?.dataUrl || null,
    status: 'published',
    created_at: d.createdAt,
    translations: [
      {
        id: `custom-poem-tr-${slug}-${d.originalLocale}`,
        poems_id: `custom-poem-${slug}`,
        languages_code: d.primary.languages_code,
        title: d.primary.title,
        verses: d.primary.verses && d.primary.verses.length > 0 ? d.primary.verses : fallbackVerses,
        commentary_markdown: d.primary.commentary_markdown || d.primary.summary || null,
      },
    ],
  };
}

export function buildCustomVideoFromDraft(d: StudioWorkDraft): VideoSpeech {
  const slug = d.id.startsWith('slug:') ? d.id.slice(5) : d.id;
  const parsedVid = normaliseExternalVideoUrl(d.youtubeOrVideoUrl || d.externalUrl || '');
  return {
    id: `custom-video-${slug}`,
    slug,
    event_date: d.createdAt,
    event_location: d.publisherOrVenue || null,
    pillar: d.pillar,
    youtube_video_id: parsedVid.youtubeId || null,
    vimeo_url: parsedVid.provider === 'vimeo' ? parsedVid.cleanUrl : null,
    thumbnail_url: d.primaryAsset?.dataUrl || null,
    themes: d.category ? [d.category] : [],
    status: 'published',
    created_at: d.createdAt,
    translations: [
      {
        id: `custom-video-tr-${slug}-${d.originalLocale}`,
        videos_speeches_id: `custom-video-${slug}`,
        languages_code: d.primary.languages_code,
        title: d.primary.title,
        description: d.primary.summary || null,
        transcript_markdown: d.primary.body_markdown || null,
      },
    ],
  };
}

export function buildCustomArtworkFromDraft(d: StudioWorkDraft): Artwork {
  const slug = d.id.startsWith('slug:') ? d.id.slice(5) : d.id;
  return {
    id: `custom-artwork-${slug}`,
    slug,
    iiif_image_id: slug,
    image_url: d.primaryAsset?.dataUrl || null,
    year: Number.parseInt(d.publicationYear, 10) || new Date().getFullYear(),
    dimensions: d.isbnOrDimensions || null,
    medium: d.seo.creditsOrTechnique || d.category || 'Mixed Media',
    artform: 'calligraphy',
    status: 'published',
    created_at: d.createdAt,
    translations: [
      {
        id: `custom-artwork-tr-${slug}-${d.originalLocale}`,
        artworks_id: `custom-artwork-${slug}`,
        languages_code: d.primary.languages_code,
        title: d.primary.title,
        description_markdown: d.primary.body_markdown || d.primary.summary || null,
      },
    ],
  };
}

export function buildCustomExhibitionFromDraft(d: StudioWorkDraft): Exhibition {
  const slug = d.id.startsWith('slug:') ? d.id.slice(5) : d.id;
  return {
    id: `custom-exhibition-${slug}`,
    slug,
    start_date: d.createdAt,
    venue_city: d.publisherOrVenue || 'Paris',
    venue_name: d.publisherOrVenue || 'Galerie',
    cover_image_url: d.primaryAsset?.dataUrl || null,
    status: 'published',
    created_at: d.createdAt,
    translations: [
      {
        id: `custom-exhibition-tr-${slug}-${d.originalLocale}`,
        exhibitions_id: `custom-exhibition-${slug}`,
        languages_code: d.primary.languages_code,
        title: d.primary.title,
        curatorial_statement_markdown: d.primary.body_markdown || d.primary.summary || null,
      },
    ],
  };
}

export function buildCustomPageFromDraft(d: StudioWorkDraft): ArchivePage {
  const slug = d.id.startsWith('slug:') ? d.id.slice(5) : d.id;
  return {
    id: `custom-page-${slug}`,
    slug,
    group: 'general',
    cover_image_url: d.primaryAsset?.dataUrl || null,
    pdf_urls: d.documentAsset?.dataUrl ? [d.documentAsset.dataUrl] : [],
    status: 'published',
    created_at: d.createdAt,
    translations: [
      {
        id: `custom-page-tr-${slug}-${d.originalLocale}`,
        pages_id: `custom-page-${slug}`,
        languages_code: d.primary.languages_code,
        title: d.primary.title,
        excerpt: d.primary.summary || '',
        body_markdown: d.primary.body_markdown || '',
      },
    ],
  };
}
