import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type {
  Article,
  Book,
  Artwork,
  Exhibition,
  Poem,
  VideoSpeech,
  VideoTranscriptRecord,
  VideoHealthManifest,
  ArchivePage,
  MediaAsset,
} from '@makaremi/shared';

function resolveDataSubdir(
  subdir: 'vault' | 'translations' | 'transcripts' | 'curator-overlays' | 'commerce'
): string {
  const candidates = [
    path.resolve(process.cwd(), 'packages', 'shared', 'src', 'data', subdir),
    path.resolve(process.cwd(), '..', '..', 'packages', 'shared', 'src', 'data', subdir),
    path.resolve(process.cwd(), '..', 'packages', 'shared', 'src', 'data', subdir),
    path.resolve('/var/task', 'packages', 'shared', 'src', 'data', subdir),
    path.resolve('/var/task', 'apps', 'web', 'packages', 'shared', 'src', 'data', subdir),
  ];

  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }
  return candidates[0];
}

const VAULT_DIR = resolveDataSubdir('vault');
const TRANSLATIONS_DIR = resolveDataSubdir('translations');
const TRANSCRIPTS_DIR = resolveDataSubdir('transcripts');
const OVERLAYS_DIR = resolveDataSubdir('curator-overlays');
const COMMERCE_DIR = resolveDataSubdir('commerce');
const SERVERLESS_TMP_ROOT = path.join(os.tmpdir(), 'makaremi-studio');
const gVault = globalThis as unknown as {
  __makaremiVaultCache?: Map<string, unknown>;
  __makaremiOverlayMtimes?: Map<string, number>;
};
const cache = (gVault.__makaremiVaultCache ??= new Map<string, unknown>());
const overlayMtimes = (gVault.__makaremiOverlayMtimes ??= new Map<string, number>());

export function getTranslationsDir(): string {
  return TRANSLATIONS_DIR;
}

export function getTranscriptsDir(): string {
  return TRANSCRIPTS_DIR;
}

export function getOverlaysDir(): string {
  return OVERLAYS_DIR;
}

export function getCommerceDir(): string {
  return COMMERCE_DIR;
}

export function invalidateTranslationCache(collection?: TranslationCollectionName): void {
  if (collection) {
    cache.delete(`translations:${collection}.json`);
    cache.delete(`translations:${collection}.json:repo`);
  } else {
    for (const key of Array.from(cache.keys())) {
      if (key.startsWith('translations:')) cache.delete(key);
    }
  }
}

export function invalidateOverlayCache(key?: string): void {
  if (key) {
    cache.delete(`overlay:${key}`);
  } else {
    for (const k of Array.from(cache.keys())) {
      if (k.startsWith('overlay:')) cache.delete(k);
    }
  }
}

function readJsonFromDir<T>(dir: string, cacheKey: string, filename: string, fallback: T): T {
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) as T;
  }

  try {
    const filePath = path.join(dir, filename);
    if (!fs.existsSync(filePath)) {
      cache.set(cacheKey, fallback);
      return fallback;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as T;
    cache.set(cacheKey, parsed);
    return parsed;
  } catch (err) {
    console.error(`[vault-loader] Failed to read ${cacheKey}:`, err);
    return fallback;
  }
}

function readVaultJson<T>(filename: string, fallback: T): T {
  return readJsonFromDir<T>(VAULT_DIR, `vault:${filename}`, filename, fallback);
}

export type TranslationStoreRecord = {
  languages_code: string;
  provenance?: string;
  [field: string]: unknown;
};

export type TranslationCollectionName =
  | 'exhibitions'
  | 'artworks'
  | 'books'
  | 'pages'
  | 'articles'
  | 'poems'
  | 'videos';

function getStaticTranslationFilename(collection: TranslationCollectionName): string {
  switch (collection) {
    case 'articles':
      return 'articles.json';
    case 'books':
      return 'books.json';
    case 'poems':
      return 'poems.json';
    case 'videos':
      return 'videos.json';
    case 'artworks':
      return 'artworks.json';
    case 'exhibitions':
      return 'exhibitions.json';
    case 'pages':
      return 'pages.json';
  }
}

export function loadPackTranslations(
  collection: TranslationCollectionName
): Record<string, Record<string, TranslationStoreRecord>> {
  const filename = getStaticTranslationFilename(collection);
  const cacheKey = `translations:${filename}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) as Record<string, Record<string, TranslationStoreRecord>>;
  }
  const repoData = readJsonFromDir<Record<string, Record<string, TranslationStoreRecord>>>(
    TRANSLATIONS_DIR,
    `${cacheKey}:repo`,
    filename,
    {}
  );
  const tmpFile = path.join(SERVERLESS_TMP_ROOT, 'translations', filename);
  let merged = repoData;
  try {
    if (fs.existsSync(tmpFile)) {
      const tmpData = JSON.parse(fs.readFileSync(tmpFile, 'utf8')) as Record<
        string,
        Record<string, TranslationStoreRecord>
      >;
      merged = { ...repoData, ...tmpData };
    }
  } catch {
    // ignore tmp read failure
  }
  cache.set(cacheKey, merged);
  return merged;
}

export function loadVaultArticles(): Article[] {
  return readVaultJson<Article[]>('articles.json', []);
}

export function loadVaultBooks(): Book[] {
  return readVaultJson<Book[]>('books.json', []);
}

export function loadVaultPoems(): Poem[] {
  return readVaultJson<Poem[]>('poems.json', []);
}

export function loadVaultVideos(): VideoSpeech[] {
  return readVaultJson<VideoSpeech[]>('videos.json', []);
}

export function loadVaultArtworks(): Artwork[] {
  return readVaultJson<Artwork[]>('artworks.json', []);
}

export function loadVaultExhibitions(): Exhibition[] {
  return readVaultJson<Exhibition[]>('exhibitions.json', []);
}

export function loadVaultPages(): ArchivePage[] {
  return readVaultJson<ArchivePage[]>('pages.json', []);
}

export function loadVaultMediaManifest(): MediaAsset[] {
  return readVaultJson<MediaAsset[]>('media-manifest.json', []);
}

export function loadVaultLegacyRedirects(): Record<string, string> {
  return readVaultJson<Record<string, string>>('legacy-redirects.json', {});
}

export function writePackTranslationEntry(
  collection: TranslationCollectionName,
  slug: string,
  localeCode: string,
  payload: TranslationStoreRecord
): void {
  const existingMap = { ...loadPackTranslations(collection) };
  const currentEntry = { ...(existingMap[slug] || {}) };
  const prefix = localeCode.slice(0, 2).toLowerCase();
  currentEntry[prefix] = {
    ...payload,
    languages_code: localeCode,
  };
  existingMap[slug] = currentEntry;

  const serialized = JSON.stringify(existingMap, null, 2);
  try {
    fs.mkdirSync(TRANSLATIONS_DIR, { recursive: true });
    fs.writeFileSync(path.join(TRANSLATIONS_DIR, `${collection}.json`), serialized, 'utf8');
  } catch {
    // Vercel serverless read-only filesystem fallback: store active runtime delta in /tmp
    const tmpTranslationsDir = path.join(SERVERLESS_TMP_ROOT, 'translations');
    fs.mkdirSync(tmpTranslationsDir, { recursive: true });
    const tmpFile = path.join(tmpTranslationsDir, `${collection}.json`);
    let tmpDelta: Record<string, Record<string, TranslationStoreRecord>> = {};
    try {
      if (fs.existsSync(tmpFile)) {
        tmpDelta = JSON.parse(fs.readFileSync(tmpFile, 'utf8')) as typeof tmpDelta;
      }
    } catch {
      tmpDelta = {};
    }
    tmpDelta[slug] = currentEntry;
    fs.writeFileSync(tmpFile, JSON.stringify(tmpDelta, null, 2), 'utf8');
  }
  invalidateTranslationCache(collection);
}

export function readOverlayJson<T>(filename: string, fallback: T): T {
  const cacheKey = `overlay:${filename}`;
  const tmpFile = path.join(SERVERLESS_TMP_ROOT, 'curator-overlays', filename);
  const diskFile = path.join(OVERLAYS_DIR, filename);
  const activeFile = fs.existsSync(tmpFile) ? tmpFile : fs.existsSync(diskFile) ? diskFile : null;

  if (activeFile && cache.has(cacheKey)) {
    try {
      const mtime = fs.statSync(activeFile).mtimeMs;
      if (overlayMtimes.get(cacheKey) === mtime) {
        return cache.get(cacheKey) as T;
      }
    } catch {
      // fall through and re-read
    }
  } else if (!activeFile && cache.has(cacheKey)) {
    return cache.get(cacheKey) as T;
  }

  if (activeFile) {
    try {
      const mtime = fs.statSync(activeFile).mtimeMs;
      const parsed = JSON.parse(fs.readFileSync(activeFile, 'utf8')) as T;
      cache.set(cacheKey, parsed);
      overlayMtimes.set(cacheKey, mtime);
      return parsed;
    } catch {
      // fall through
    }
  }

  cache.set(cacheKey, fallback);
  return fallback;
}

export function writeOverlayJson<T>(filename: string, data: T): void {
  const serialized = JSON.stringify(data, null, 2);
  try {
    fs.mkdirSync(OVERLAYS_DIR, { recursive: true });
    fs.writeFileSync(path.join(OVERLAYS_DIR, filename), serialized, 'utf8');
  } catch {
    // Vercel serverless read-only filesystem fallback
    const tmpOverlayDir = path.join(SERVERLESS_TMP_ROOT, 'curator-overlays');
    fs.mkdirSync(tmpOverlayDir, { recursive: true });
    fs.writeFileSync(path.join(tmpOverlayDir, filename), serialized, 'utf8');
  }
  invalidateOverlayCache(filename);
}

export function invalidateCommerceCache(key?: string): void {
  if (key) {
    cache.delete(`commerce:${key}`);
  } else {
    for (const k of Array.from(cache.keys())) {
      if (k.startsWith('commerce:')) cache.delete(k);
    }
  }
}

export function readCommerceJson<T>(filename: string, fallback: T): T {
  const cacheKey = `commerce:${filename}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) as T;
  }
  const tmpFile = path.join(SERVERLESS_TMP_ROOT, 'commerce', filename);
  try {
    if (fs.existsSync(tmpFile)) {
      const parsedTmp = JSON.parse(fs.readFileSync(tmpFile, 'utf8')) as T;
      cache.set(cacheKey, parsedTmp);
      return parsedTmp;
    }
  } catch {
    // fall through to repo commerce file
  }
  return readJsonFromDir<T>(COMMERCE_DIR, cacheKey, filename, fallback);
}

export function writeCommerceJson<T>(filename: string, data: T): void {
  const serialized = JSON.stringify(data, null, 2);
  try {
    fs.mkdirSync(COMMERCE_DIR, { recursive: true });
    fs.writeFileSync(path.join(COMMERCE_DIR, filename), serialized, 'utf8');
  } catch {
    const tmpCommerceDir = path.join(SERVERLESS_TMP_ROOT, 'commerce');
    fs.mkdirSync(tmpCommerceDir, { recursive: true });
    fs.writeFileSync(path.join(tmpCommerceDir, filename), serialized, 'utf8');
  }
  invalidateCommerceCache(filename);
}

export function invalidateTranscriptsCache(): void {
  for (const k of Array.from(cache.keys())) {
    if (k.startsWith('transcripts:')) cache.delete(k);
  }
}

export function loadVideoTranscriptsPack(): Record<string, VideoTranscriptRecord> {
  const cacheKey = 'transcripts:videos.json';
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) as Record<string, VideoTranscriptRecord>;
  }
  const repoData = readJsonFromDir<Record<string, VideoTranscriptRecord>>(
    TRANSCRIPTS_DIR,
    `${cacheKey}:repo`,
    'videos.json',
    {}
  );
  const tmpFile = path.join(SERVERLESS_TMP_ROOT, 'transcripts', 'videos.json');
  let merged = repoData;
  try {
    if (fs.existsSync(tmpFile)) {
      const tmpData = JSON.parse(fs.readFileSync(tmpFile, 'utf8')) as Record<
        string,
        VideoTranscriptRecord
      >;
      merged = { ...repoData, ...tmpData };
    }
  } catch {
    // ignore tmp read failure
  }
  cache.set(cacheKey, merged);
  return merged;
}

export function writeVideoTranscriptEntry(
  key: string,
  record: VideoTranscriptRecord
): void {
  const existing = { ...loadVideoTranscriptsPack() };
  existing[key] = record;
  const serialized = JSON.stringify(existing, null, 2);
  try {
    fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });
    fs.writeFileSync(path.join(TRANSCRIPTS_DIR, 'videos.json'), serialized, 'utf8');
  } catch {
    const tmpDir = path.join(SERVERLESS_TMP_ROOT, 'transcripts');
    fs.mkdirSync(tmpDir, { recursive: true });
    const tmpFile = path.join(tmpDir, 'videos.json');
    let tmpDelta: Record<string, VideoTranscriptRecord> = {};
    try {
      if (fs.existsSync(tmpFile)) {
        tmpDelta = JSON.parse(fs.readFileSync(tmpFile, 'utf8')) as typeof tmpDelta;
      }
    } catch {
      tmpDelta = {};
    }
    tmpDelta[key] = record;
    fs.writeFileSync(tmpFile, JSON.stringify(tmpDelta, null, 2), 'utf8');
  }
  invalidateTranscriptsCache();
}

export function loadVideoHealthManifest(): VideoHealthManifest | null {
  return readOverlayJson<VideoHealthManifest | null>('video-health-manifest.json', null);
}
