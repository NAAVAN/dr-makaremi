import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { hasPrototypePollution } from '@/lib/etl/types';
import { isStudioRequestAuthorized } from '@/lib/studio/auth';
import { normaliseStudioText, validateDataUrlServerSide } from '@/lib/studio/media-gatekeeper';
import { loadWorkEnrichmentsMap, saveWorkEnrichmentEntry } from '@/lib/studio/overlays';
import { persistWorkEnrichmentToNeon } from '@/lib/studio/neon-cms-store';
import { revalidatePublicWorkPaths } from '@/lib/studio/works-index';
import { syncEntityToRagKnowledgeBase } from '@/lib/rag/auto-indexer';
import type {
  EnrichmentDocumentItem,
  EnrichmentLinkItem,
  EnrichmentNoteItem,
  MediaSlotKey,
} from '@makaremi/shared';
import type { TranslationCollectionName } from '@/lib/vault-loader';

const MAX_ENRICH_BYTES = 26 * 1024 * 1024;

const EnrichRequestSchema = z.object({
  collection: z.enum(['articles', 'books', 'poems', 'videos', 'artworks', 'exhibitions', 'pages']),
  slug: z.string().min(1).max(200),
  note: z
    .object({
      locale: z.enum(['fa', 'fr', 'en']).default('fa'),
      heading: z.string().min(1).max(300),
      bodyMarkdown: z.string().min(1).max(50000),
      audioIntro: z.any().optional(),
    })
    .optional(),
  link: z
    .object({
      platform: z.string().min(1).max(80),
      label: z.string().min(1).max(200),
      url: z.string().url().max(2048),
    })
    .optional(),
  document: z
    .object({
      title: z.string().min(1).max(300),
      slot: z.enum([
        'artwork_iiif',
        'book_front_cover',
        'book_back_cover',
        'book_spine',
        'article_or_exhibition_cover',
        'document_pdf',
        'audio_intro',
        'video_asset',
      ]),
      fileName: z.string().min(1).max(255),
      mimeType: z.string().min(1).max(128),
      sizeBytes: z.number().nonnegative(),
      dataUrl: z.string().min(1),
      note: z.string().max(1000).optional(),
    })
    .optional(),
  bookCoverOverrides: z
    .object({
      frontCoverDataUrl: z.string().optional(),
      backCoverDataUrl: z.string().optional(),
      spineImageDataUrl: z.string().optional(),
      pageCount: z.string().max(40).optional(),
      samplePagesRangeNote: z.string().max(300).optional(),
      allowFullPdfDownload: z.boolean().optional(),
      showIn3DShowcase: z.boolean().optional(),
    })
    .optional(),
});

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'X-Content-Type-Options': 'nosniff',
};

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, { windowMs: 60000, maxRequests: 30 }, 'studio_enrich_post');
  if (!rl.allowed) return rl.response!;

  if (!isStudioRequestAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized studio access' }, { status: 401, headers: HEADERS });
  }

  const raw = await request.text().catch(() => '');
  if (!raw || Buffer.byteLength(raw, 'utf8') > MAX_ENRICH_BYTES) {
    return NextResponse.json({ ok: false, error: 'Enrichment payload exceeds ceiling' }, { status: 413, headers: HEADERS });
  }
  if (hasPrototypePollution(raw)) {
    return NextResponse.json({ ok: false, error: 'Disallowed payload' }, { status: 400, headers: HEADERS });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400, headers: HEADERS });
  }

  const check = EnrichRequestSchema.safeParse(parsed);
  if (!check.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid enrichment payload', details: check.error.issues },
      { status: 400, headers: HEADERS }
    );
  }

  const data = check.data;
  if (data.document) {
    const docGate = validateDataUrlServerSide(data.document.dataUrl, data.document.slot as MediaSlotKey);
    if (!docGate.ok) {
      return NextResponse.json({ ok: false, error: docGate.error }, { status: 400, headers: HEADERS });
    }
  }
  if (data.bookCoverOverrides?.frontCoverDataUrl) {
    const g = validateDataUrlServerSide(data.bookCoverOverrides.frontCoverDataUrl, 'book_front_cover');
    if (!g.ok) return NextResponse.json({ ok: false, error: g.error }, { status: 400, headers: HEADERS });
  }
  if (data.bookCoverOverrides?.backCoverDataUrl) {
    const g = validateDataUrlServerSide(data.bookCoverOverrides.backCoverDataUrl, 'book_back_cover');
    if (!g.ok) return NextResponse.json({ ok: false, error: g.error }, { status: 400, headers: HEADERS });
  }
  if (data.bookCoverOverrides?.spineImageDataUrl) {
    const g = validateDataUrlServerSide(data.bookCoverOverrides.spineImageDataUrl, 'book_spine');
    if (!g.ok) return NextResponse.json({ ok: false, error: g.error }, { status: 400, headers: HEADERS });
  }

  const key = `${data.collection}:${data.slug}`;
  const existing = loadWorkEnrichmentsMap()[key] || {
    collection: data.collection,
    slug: data.slug,
    links: [],
    notes: [],
    documents: [],
  };

  const nowIso = new Date().toISOString();
  const nextLinks: EnrichmentLinkItem[] = [...existing.links];
  const nextNotes: EnrichmentNoteItem[] = [...existing.notes];
  const nextDocuments: EnrichmentDocumentItem[] = [...existing.documents];

  if (data.link) {
    nextLinks.push({
      id: `lnk-${Date.now()}`,
      platform: data.link.platform.trim(),
      label: data.link.label.trim(),
      url: data.link.url.trim(),
      addedAt: nowIso,
    });
  }

  if (data.note) {
    nextNotes.push({
      id: `note-${Date.now()}`,
      locale: data.note.locale,
      heading: normaliseStudioText(data.note.heading, data.note.locale),
      bodyMarkdown: normaliseStudioText(data.note.bodyMarkdown, data.note.locale),
      audioIntro: data.note.audioIntro || null,
      addedAt: nowIso,
    });
  }

  if (data.document) {
    nextDocuments.push({
      id: `doc-${Date.now()}`,
      title: data.document.title.trim(),
      slot: data.document.slot as MediaSlotKey,
      fileName: data.document.fileName,
      mimeType: data.document.mimeType,
      sizeBytes: data.document.sizeBytes,
      dataUrl: data.document.dataUrl,
      note: data.document.note,
      addedAt: nowIso,
    });
  }

  const saved = saveWorkEnrichmentEntry({
    collection: data.collection,
    slug: data.slug,
    links: nextLinks,
    notes: nextNotes,
    documents: nextDocuments,
    bookCoverOverrides: {
      ...(existing.bookCoverOverrides || {}),
      ...(data.bookCoverOverrides || {}),
    },
  });

  await persistWorkEnrichmentToNeon(saved);
  revalidatePublicWorkPaths(data.collection as TranslationCollectionName, data.slug);
  const kbSync = await syncEntityToRagKnowledgeBase({
    collection: data.collection,
    slug: data.slug,
    action: 'enrich',
    summary: `enrich:${data.collection}/${data.slug}`,
  }).catch(() => undefined);

  return NextResponse.json(
    {
      ok: true,
      enrichment: saved,
      kbSynced: Boolean(kbSync?.ok),
      kbVersion: kbSync?.kbVersion,
      message: 'مطلب، پیوند یا مدرک تکمیلی با امضای دیجیتال Ed25519 به اثر افزوده و در پایگاه دانش دستیار هوشمند همگام‌سازی شد.',
    },
    { status: 200, headers: HEADERS }
  );
}
