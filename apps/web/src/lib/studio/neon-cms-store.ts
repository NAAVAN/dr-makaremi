import type {
  CommerceCatalogItem,
  StudioWorkDraft,
  VideoTranscriptRecord,
  WorkEnrichmentOverlay,
} from '@makaremi/shared';
import {
  ensureCommerceSchema,
  getNeonSql,
  isNeonDatabaseConfigured,
} from '@/lib/commerce/db';
import { ensureRagTrainingSchema } from '@/lib/rag/db';
import {
  readCommerceJson,
  type TranslationCollectionName,
  type TranslationStoreRecord,
} from '@/lib/vault-loader';

export interface KbSyncMetaSnapshot {
  kbVersion: number;
  lastSyncedAt: string;
  lastEventSummary: string;
  lastCollection: string;
  lastSlug: string;
}

// Process-wide shared KB coherence bus so separate Next.js route bundles
// inside the same server process invalidate caches instantaneously (0ms)
const gKb = globalThis as unknown as {
  __makaremiKbListeners?: Set<() => void>;
  __makaremiKbState?: {
    hydratedDynamicWorks: StudioWorkDraft[];
    hydratedEnrichments: Record<string, WorkEnrichmentOverlay>;
    hydratedTranslationOverrides: Record<string, Record<string, Record<string, TranslationStoreRecord>>>;
    hydratedVideoTranscripts: Record<string, VideoTranscriptRecord>;
    hydratedCommerceCatalog: CommerceCatalogItem[] | null;
    localKbVersion: number;
    lastVersionProbeMs: number;
    lastFullHydrationMs: number;
    localSyncMeta: KbSyncMetaSnapshot;
  };
};

const sharedState = (gKb.__makaremiKbState ??= {
  hydratedDynamicWorks: [],
  hydratedEnrichments: {},
  hydratedTranslationOverrides: {},
  hydratedVideoTranscripts: {},
  hydratedCommerceCatalog: null,
  localKbVersion: 0,
  lastVersionProbeMs: 0,
  lastFullHydrationMs: 0,
  localSyncMeta: {
    kbVersion: 1,
    lastSyncedAt: new Date().toISOString(),
    lastEventSummary: 'local_bootstrap',
    lastCollection: 'system',
    lastSlug: 'init',
  },
});

let hydratedDynamicWorks = sharedState.hydratedDynamicWorks;
let hydratedEnrichments = sharedState.hydratedEnrichments;
let hydratedTranslationOverrides = sharedState.hydratedTranslationOverrides;
let hydratedVideoTranscripts = sharedState.hydratedVideoTranscripts;
let hydratedCommerceCatalog = sharedState.hydratedCommerceCatalog;

let localKbVersion = sharedState.localKbVersion;
let lastVersionProbeMs = sharedState.lastVersionProbeMs;
let lastFullHydrationMs = sharedState.lastFullHydrationMs;
let localSyncMeta = sharedState.localSyncMeta;

const VERSION_PROBE_TTL_MS = 5_000; // Cross-instance coherence within <= 5 seconds
const FULL_HYDRATION_FALLBACK_TTL_MS = 60_000;

const kbChangeListeners = (gKb.__makaremiKbListeners ??= new Set<() => void>());

export function registerKbVersionChangeListener(listener: () => void): void {
  kbChangeListeners.add(listener);
}

function notifyKbChanged(): void {
  sharedState.hydratedDynamicWorks = hydratedDynamicWorks;
  sharedState.hydratedEnrichments = hydratedEnrichments;
  sharedState.hydratedTranslationOverrides = hydratedTranslationOverrides;
  sharedState.hydratedVideoTranscripts = hydratedVideoTranscripts;
  sharedState.hydratedCommerceCatalog = hydratedCommerceCatalog;
  sharedState.localKbVersion = localKbVersion;
  sharedState.lastVersionProbeMs = lastVersionProbeMs;
  sharedState.lastFullHydrationMs = lastFullHydrationMs;
  sharedState.localSyncMeta = localSyncMeta;

  for (const fn of kbChangeListeners) {
    try {
      fn();
    } catch {
      // ignore listener errors
    }
  }
}

// -----------------------------------------------------------------------------
// Synchronous Accessors (Consumed by cms.ts, overlays.ts & hybrid-search.ts)
// -----------------------------------------------------------------------------
export function getDynamicStudioWorksSync(): StudioWorkDraft[] {
  return sharedState.hydratedDynamicWorks;
}

export function getDynamicEnrichmentsSync(): Record<string, WorkEnrichmentOverlay> {
  return sharedState.hydratedEnrichments;
}

export function getDynamicTranslationOverridesSync(
  collection: TranslationCollectionName
): Record<string, Record<string, TranslationStoreRecord>> {
  return sharedState.hydratedTranslationOverrides[collection] || {};
}

export function getDynamicVideoTranscriptsSync(): Record<string, VideoTranscriptRecord> {
  return sharedState.hydratedVideoTranscripts;
}

export function getLiveCommerceCatalogSync(): CommerceCatalogItem[] {
  if (sharedState.hydratedCommerceCatalog && sharedState.hydratedCommerceCatalog.length > 0) {
    return sharedState.hydratedCommerceCatalog;
  }
  return readCommerceJson<CommerceCatalogItem[]>('catalog.json', []);
}

export function setLiveCommerceCatalogMirror(items: CommerceCatalogItem[]): void {
  hydratedCommerceCatalog = [...items];
  sharedState.hydratedCommerceCatalog = hydratedCommerceCatalog;
}

export function getLocalKbSyncMeta(): KbSyncMetaSnapshot {
  return { ...sharedState.localSyncMeta };
}

// -----------------------------------------------------------------------------
// Cross-Instance Lightweight Version Check & Full Hydration from Neon Postgres
// -----------------------------------------------------------------------------
async function hydrateCommerceMirrorFromNeon(): Promise<void> {
  try {
    await ensureCommerceSchema();
    const sql = getNeonSql();
    const base = readCommerceJson<CommerceCatalogItem[]>('catalog.json', []);
    const map = new Map<string, CommerceCatalogItem>(base.map((c) => [c.sku, c]));

    const [rawOverrideRows, rawDeletedRows] = await Promise.all([
      sql`SELECT sku, item_json FROM commerce_catalog_overrides`,
      sql`SELECT sku FROM commerce_catalog_deleted`,
    ]);
    const overrideRows = rawOverrideRows as unknown as Array<{ sku: string; item_json: CommerceCatalogItem }>;
    const deletedRows = rawDeletedRows as unknown as Array<{ sku: string }>;

    for (const r of overrideRows) {
      if (r.item_json && r.sku) {
        map.set(String(r.sku), r.item_json);
      }
    }
    for (const d of deletedRows) {
      if (d.sku) map.delete(String(d.sku));
    }

    hydratedCommerceCatalog = Array.from(map.values());
  } catch {
    // Fallback gracefully to static catalog if commerce tables aren't initialized yet
  }
}

export async function hydrateDynamicCmsFromNeonIfNeeded(force = false): Promise<boolean> {
  if (!isNeonDatabaseConfigured()) return false;

  const now = Date.now();
  if (!force && now - lastVersionProbeMs < VERSION_PROBE_TTL_MS && lastFullHydrationMs > 0) {
    return false;
  }
  lastVersionProbeMs = now;

  try {
    await ensureRagTrainingSchema();
    const sql = getNeonSql();

    const stateRows = (await sql`
      SELECT kb_version, last_event_summary, last_collection, last_slug, updated_at
      FROM ai_kb_sync_state
      WHERE id = 1
      LIMIT 1
    `) as Array<{
      kb_version: string | number;
      last_event_summary: string;
      last_collection: string;
      last_slug: string;
      updated_at: string;
    }>;

    const remoteVersion = Number(stateRows?.[0]?.kb_version || 1);
    if (stateRows?.[0]) {
      localSyncMeta = {
        kbVersion: remoteVersion,
        lastSyncedAt: new Date(String(stateRows[0].updated_at)).toISOString(),
        lastEventSummary: String(stateRows[0].last_event_summary || ''),
        lastCollection: String(stateRows[0].last_collection || ''),
        lastSlug: String(stateRows[0].last_slug || ''),
      };
    }

    const needsReload =
      force ||
      lastFullHydrationMs === 0 ||
      remoteVersion > localKbVersion ||
      now - lastFullHydrationMs > FULL_HYDRATION_FALLBACK_TTL_MS;

    if (!needsReload) {
      return false;
    }

    const [rawWorkRows, rawEnrichRows, rawTrRows, rawTranscriptRows] = await Promise.all([
      sql`SELECT draft_json FROM cms_dynamic_works ORDER BY updated_at DESC`,
      sql`SELECT work_key, overlay_json FROM cms_work_enrichments`,
      sql`SELECT collection, slug, locale_code, record_json FROM cms_translation_overrides`,
      sql`SELECT video_key, record_json FROM cms_video_transcripts`,
    ]);
    const workRows = rawWorkRows as unknown as Array<{ draft_json: StudioWorkDraft }>;
    const enrichRows = rawEnrichRows as unknown as Array<{ work_key: string; overlay_json: WorkEnrichmentOverlay }>;
    const trRows = rawTrRows as unknown as Array<{
      collection: string;
      slug: string;
      locale_code: string;
      record_json: TranslationStoreRecord;
    }>;
    const transcriptRows = rawTranscriptRows as unknown as Array<{
      video_key: string;
      record_json: VideoTranscriptRecord;
    }>;

    hydratedDynamicWorks = workRows
      .map((r) => r.draft_json)
      .filter((d): d is StudioWorkDraft => Boolean(d && d.id));

    const nextEnrich: Record<string, WorkEnrichmentOverlay> = {};
    for (const row of enrichRows) {
      if (row.work_key && row.overlay_json) {
        nextEnrich[String(row.work_key)] = row.overlay_json;
      }
    }
    hydratedEnrichments = nextEnrich;

    const nextTr: Record<string, Record<string, Record<string, TranslationStoreRecord>>> = {};
    for (const row of trRows) {
      const col = String(row.collection);
      const slug = String(row.slug);
      const shortLoc = String(row.locale_code || '').slice(0, 2).toLowerCase();
      if (!col || !slug || !shortLoc) continue;
      if (!nextTr[col]) nextTr[col] = {};
      if (!nextTr[col][slug]) nextTr[col][slug] = {};
      nextTr[col][slug][shortLoc] = row.record_json;
    }
    hydratedTranslationOverrides = nextTr;

    const nextTranscripts: Record<string, VideoTranscriptRecord> = {};
    for (const row of transcriptRows) {
      if (row.video_key && row.record_json) {
        nextTranscripts[String(row.video_key)] = row.record_json;
      }
    }
    hydratedVideoTranscripts = nextTranscripts;

    await hydrateCommerceMirrorFromNeon();

    const changed = remoteVersion !== localKbVersion || lastFullHydrationMs === 0;
    localKbVersion = remoteVersion;
    lastFullHydrationMs = now;

    if (changed) {
      notifyKbChanged();
    }
    return changed;
  } catch (err) {
    console.warn('[neon-cms-store] Hydration warning:', err);
    return false;
  }
}

// -----------------------------------------------------------------------------
// Authoritative Persistence Writers (Called on ALL 7 Content Write Paths)
// -----------------------------------------------------------------------------
export async function bumpKnowledgeBaseVersion(
  eventSummary: string,
  collection: string,
  slug: string
): Promise<number> {
  const nowIso = new Date().toISOString();
  localKbVersion = Math.max(localKbVersion + 1, localSyncMeta.kbVersion + 1);
  localSyncMeta = {
    kbVersion: localKbVersion,
    lastSyncedAt: nowIso,
    lastEventSummary: eventSummary.slice(0, 240),
    lastCollection: collection,
    lastSlug: slug,
  };

  if (isNeonDatabaseConfigured()) {
    try {
      await ensureRagTrainingSchema();
      const sql = getNeonSql();
      const rows = (await sql`
        INSERT INTO ai_kb_sync_state (id, kb_version, last_event_summary, last_collection, last_slug, updated_at)
        VALUES (1, 2, ${localSyncMeta.lastEventSummary}, ${collection}, ${slug}, NOW())
        ON CONFLICT (id) DO UPDATE SET
          kb_version = ai_kb_sync_state.kb_version + 1,
          last_event_summary = EXCLUDED.last_event_summary,
          last_collection = EXCLUDED.last_collection,
          last_slug = EXCLUDED.last_slug,
          updated_at = NOW()
        RETURNING kb_version, updated_at
      `) as Array<{ kb_version: string | number; updated_at: string }>;
      if (rows?.[0]) {
        localKbVersion = Number(rows[0].kb_version);
        localSyncMeta.kbVersion = localKbVersion;
        localSyncMeta.lastSyncedAt = new Date(String(rows[0].updated_at)).toISOString();
      }
    } catch (err) {
      console.warn('[neon-cms-store] Failed to bump kb_version in Neon:', err);
    }
  }

  notifyKbChanged();
  return localKbVersion;
}

export async function persistDynamicWorkToNeon(
  draft: StudioWorkDraft,
  collection: TranslationCollectionName
): Promise<void> {
  const slug = draft.id.startsWith('slug:') ? draft.id.slice(5) : draft.id;

  // Update in-process mirror immediately so same lambda sees it with 0ms delay
  const idx = hydratedDynamicWorks.findIndex((item) => item.id === draft.id);
  if (idx >= 0) hydratedDynamicWorks[idx] = draft;
  else hydratedDynamicWorks.unshift(draft);

  if (!isNeonDatabaseConfigured()) return;
  try {
    await ensureRagTrainingSchema();
    const sql = getNeonSql();
    await sql`
      INSERT INTO cms_dynamic_works (id, slug, collection, work_type, status, draft_json, updated_at)
      VALUES (${draft.id}, ${slug}, ${collection}, ${draft.workType}, ${draft.status}, ${JSON.stringify(draft)}::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET
        slug = EXCLUDED.slug,
        collection = EXCLUDED.collection,
        work_type = EXCLUDED.work_type,
        status = EXCLUDED.status,
        draft_json = EXCLUDED.draft_json,
        updated_at = NOW()
    `;
  } catch (err) {
    console.warn('[neon-cms-store] Failed to persist dynamic work:', err);
  }
}

export async function deleteDynamicWorkFromNeon(slugOrId: string): Promise<void> {
  const normalizedId = slugOrId.startsWith('slug:') ? slugOrId : `slug:${slugOrId}`;
  const slug = slugOrId.startsWith('slug:') ? slugOrId.slice(5) : slugOrId;
  hydratedDynamicWorks = hydratedDynamicWorks.filter((d) => d.id !== normalizedId && d.id !== slugOrId);
  sharedState.hydratedDynamicWorks = hydratedDynamicWorks;

  if (!isNeonDatabaseConfigured()) return;
  try {
    await ensureRagTrainingSchema();
    const sql = getNeonSql();
    await sql`DELETE FROM cms_dynamic_works WHERE id = ${normalizedId} OR slug = ${slug}`;
    await sql`DELETE FROM ai_knowledge_chunks WHERE document_id LIKE ${`%${slug}%`}`;
  } catch {
    // ignore cleanup errors
  }
}

export async function persistWorkEnrichmentToNeon(overlay: WorkEnrichmentOverlay): Promise<void> {
  const workKey = `${overlay.collection}:${overlay.slug}`;
  hydratedEnrichments[workKey] = overlay;

  if (!isNeonDatabaseConfigured()) return;
  try {
    await ensureRagTrainingSchema();
    const sql = getNeonSql();
    await sql`
      INSERT INTO cms_work_enrichments (work_key, collection, slug, overlay_json, updated_at)
      VALUES (${workKey}, ${overlay.collection}, ${overlay.slug}, ${JSON.stringify(overlay)}::jsonb, NOW())
      ON CONFLICT (work_key) DO UPDATE SET
        overlay_json = EXCLUDED.overlay_json,
        updated_at = NOW()
    `;
  } catch (err) {
    console.warn('[neon-cms-store] Failed to persist work enrichment:', err);
  }
}

export async function persistTranslationOverrideToNeon(
  collection: TranslationCollectionName,
  slug: string,
  localeCode: string,
  record: TranslationStoreRecord
): Promise<void> {
  const shortLoc = localeCode.slice(0, 2).toLowerCase();
  if (!hydratedTranslationOverrides[collection]) hydratedTranslationOverrides[collection] = {};
  if (!hydratedTranslationOverrides[collection][slug]) hydratedTranslationOverrides[collection][slug] = {};
  hydratedTranslationOverrides[collection][slug][shortLoc] = record;

  if (!isNeonDatabaseConfigured()) return;
  try {
    await ensureRagTrainingSchema();
    const sql = getNeonSql();
    const overrideKey = `${collection}:${slug}:${shortLoc}`;
    await sql`
      INSERT INTO cms_translation_overrides (override_key, collection, slug, locale_code, record_json, updated_at)
      VALUES (${overrideKey}, ${collection}, ${slug}, ${shortLoc}, ${JSON.stringify(record)}::jsonb, NOW())
      ON CONFLICT (override_key) DO UPDATE SET
        record_json = EXCLUDED.record_json,
        updated_at = NOW()
    `;
  } catch (err) {
    console.warn('[neon-cms-store] Failed to persist translation override:', err);
  }
}

export async function persistVideoTranscriptToNeon(
  videoKey: string,
  record: VideoTranscriptRecord,
  slug?: string
): Promise<void> {
  hydratedVideoTranscripts[videoKey] = record;
  if (slug) hydratedVideoTranscripts[slug] = record;

  if (!isNeonDatabaseConfigured()) return;
  try {
    await ensureRagTrainingSchema();
    const sql = getNeonSql();
    await sql`
      INSERT INTO cms_video_transcripts (video_key, slug, youtube_video_id, record_json, updated_at)
      VALUES (${videoKey}, ${slug || null}, ${record.key || null}, ${JSON.stringify(record)}::jsonb, NOW())
      ON CONFLICT (video_key) DO UPDATE SET
        slug = COALESCE(EXCLUDED.slug, cms_video_transcripts.slug),
        youtube_video_id = COALESCE(EXCLUDED.youtube_video_id, cms_video_transcripts.youtube_video_id),
        record_json = EXCLUDED.record_json,
        updated_at = NOW()
    `;
  } catch (err) {
    console.warn('[neon-cms-store] Failed to persist video transcript:', err);
  }
}
