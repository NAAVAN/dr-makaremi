import type { ContentPillar, ContentStatus } from './content';
import type { Locale } from './i18n';
export type StudioWorkType = 'article' | 'book' | 'poem' | 'video' | 'artwork' | 'exhibition' | 'page';
export type MediaSlotKey = 'artwork_iiif' | 'book_front_cover' | 'book_back_cover' | 'book_spine' | 'article_or_exhibition_cover' | 'document_pdf' | 'audio_intro' | 'video_asset';
export interface MediaUploadPolicy {
    slot: MediaSlotKey;
    titleFa: string;
    allowedExtensions: string[];
    allowedMimeTypes: string[];
    acceptAttr: string;
    maxBytes: number;
    maxSizeLabelFa: string;
    preferredStandardFa: string;
    autoConvertToWebP: boolean;
    targetMaxWidthPx?: number;
    targetQuality?: number;
}
export interface StudioStandardisedAsset {
    slot: MediaSlotKey;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    originalSizeBytes: number;
    width?: number;
    height?: number;
    wasConvertedToWebP: boolean;
    dataUrl: string;
}
export interface StudioPoemVerseInput {
    line_index: number;
    hemistich_a: string;
    hemistich_b?: string;
}
export interface StudioLocaleContentInput {
    languages_code: string;
    title: string;
    subtitle?: string;
    summary?: string;
    body_markdown?: string;
    commentary_markdown?: string;
    verses?: StudioPoemVerseInput[];
}
export interface StudioSeoFields {
    imageAltText?: string;
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string;
    aeoKeyTakeaway?: string;
    videoChapters?: string;
    creditsOrTechnique?: string;
}
export interface StudioBook3DSpec {
    showIn3DShowcase: boolean;
    allowFullPdfDownload: boolean;
    pageCount?: string;
    samplePagesRangeNote?: string;
    frontCover?: StudioStandardisedAsset | null;
    backCover?: StudioStandardisedAsset | null;
    spineImage?: StudioStandardisedAsset | null;
    samplePagesFile?: StudioStandardisedAsset | null;
}
export interface StudioAudioAsset {
    id: string;
    mode: 'site_intro' | 'editorial_note';
    label: string;
    durationSec: number;
    mimeType: string;
    dataUrl?: string;
    fileName?: string;
    createdAt: string;
}
export interface StudioWorkDraft {
    id: string;
    workType: StudioWorkType;
    pillar: ContentPillar;
    category: string;
    originalLocale: Locale;
    publicationYear: string;
    publisherOrVenue: string;
    isbnOrDimensions: string;
    externalUrl: string;
    youtubeOrVideoUrl?: string;
    primary: StudioLocaleContentInput;
    includeTranslations: boolean;
    optionalTranslations: Partial<Record<Locale, StudioLocaleContentInput>>;
    seo: StudioSeoFields;
    primaryAsset?: StudioStandardisedAsset | null;
    documentAsset?: StudioStandardisedAsset | null;
    book3DSpec?: StudioBook3DSpec;
    audioIntro?: StudioAudioAsset | null;
    status: 'draft' | 'queued_manual_translation' | 'published';
    createdAt: string;
    updatedAt: string;
}
export interface EnrichmentLinkItem {
    id: string;
    platform: string;
    label: string;
    url: string;
    addedAt: string;
}
export interface EnrichmentNoteItem {
    id: string;
    locale: Locale;
    heading: string;
    bodyMarkdown: string;
    audioIntro?: StudioAudioAsset | null;
    addedAt: string;
}
export interface EnrichmentDocumentItem {
    id: string;
    title: string;
    slot: MediaSlotKey;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    dataUrl: string;
    note?: string;
    addedAt: string;
}
export interface WorkEnrichmentOverlay {
    collection: 'articles' | 'books' | 'poems' | 'videos' | 'artworks' | 'exhibitions' | 'pages';
    slug: string;
    links: EnrichmentLinkItem[];
    notes: EnrichmentNoteItem[];
    documents: EnrichmentDocumentItem[];
    bookCoverOverrides?: {
        frontCoverDataUrl?: string;
        backCoverDataUrl?: string;
        spineImageDataUrl?: string;
        pageCount?: string;
        samplePagesRangeNote?: string;
        allowFullPdfDownload?: boolean;
        showIn3DShowcase?: boolean;
    };
    updatedAt: string;
    contentSha256?: string;
    signatureEd25519?: string;
}
export interface TranslationWorkSummary {
    collection: 'articles' | 'books' | 'poems' | 'videos' | 'exhibitions' | 'artworks' | 'pages';
    slug: string;
    id: string;
    originalLocale: Locale;
    title: string;
    pillar?: ContentPillar;
    status: ContentStatus;
    availableLocales: Locale[];
    missingLocales: Locale[];
    localeTitles: Partial<Record<Locale, string>>;
    provenanceByLocale: Partial<Record<Locale, string>>;
    updatedAt?: string;
    hasVerses?: boolean;
    hasTranscript?: boolean;
    enrichmentCount?: number;
}
export interface TranslationWorkDetail {
    collection: 'articles' | 'books' | 'poems' | 'videos' | 'exhibitions' | 'artworks' | 'pages';
    slug: string;
    id: string;
    originalLocale: Locale;
    pillar?: ContentPillar;
    status: ContentStatus;
    originalContent: StudioLocaleContentInput;
    translations: Partial<Record<Locale, StudioLocaleContentInput & {
        provenance?: string;
        updated_at?: string;
    }>>;
    enrichment?: WorkEnrichmentOverlay | null;
    metadata?: Record<string, unknown>;
}
export interface ManualTranslationQueueItem {
    id: string;
    draftId: string;
    slug: string;
    collection: 'articles' | 'books' | 'poems' | 'videos' | 'exhibitions' | 'artworks' | 'pages';
    originalLocale: Locale;
    targetLocales: Locale[];
    sourceTitle: string;
    sourcePayload: StudioLocaleContentInput;
    status: 'pending_manual_translation' | 'completed';
    queuedAt: string;
    completedAt?: string;
}
export interface AiProviderRuntimeStatus {
    provider: 'anthropic' | 'disabled';
    model: string;
    hasApiKeyConfigured: boolean;
    autoTranslateOnPublish: boolean;
    mode: 'manual_antigravity_queue' | 'anthropic_live_auto';
    usingDefaultAuthSecret: boolean;
    lastCheckedAt: string;
}
//# sourceMappingURL=studio.d.ts.map