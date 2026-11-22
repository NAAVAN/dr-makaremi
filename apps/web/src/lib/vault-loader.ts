import fs from 'node:fs';
import path from 'node:path';
import type {
  Article,
  Book,
  Artwork,
  Exhibition,
  Poem,
  VideoSpeech,
  ArchivePage,
  MediaAsset,
} from '@makaremi/shared';

function resolveVaultDir(): string {
  const candidates = [
    path.resolve(process.cwd(), 'packages', 'shared', 'src', 'data', 'vault'),
    path.resolve(process.cwd(), '..', '..', 'packages', 'shared', 'src', 'data', 'vault'),
    path.resolve(process.cwd(), '..', 'packages', 'shared', 'src', 'data', 'vault'),
  ];

  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }
  return candidates[0];
}

const VAULT_DIR = resolveVaultDir();
const TRANSLATIONS_DIR = path.resolve(VAULT_DIR, '..', 'translations');
const OVERLAYS_DIR = path.resolve(VAULT_DIR, '..', 'curator-overlays');
const cache = new Map<string, unknown>();

export function getTranslationsDir(): string {
  return TRANSLATIONS_DIR;
}

export function getOverlaysDir(): string {
  return OVERLAYS_DIR;
}

export function invalidateTranslationCache(collection?: TranslationCollectionName): void {
  if (collection) {
    cache.delete(`translations:${collection}.json`);
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

export function loadPackTranslations(
  collection: TranslationCollectionName
): Record<string, Record<string, TranslationStoreRecord>> {
  return readJsonFromDir<Record<string, Record<string, TranslationStoreRecord>>>(
    TRANSLATIONS_DIR,
    `translations:${collection}.json`,
    `${collection}.json`,
    {}
  );
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

  fs.mkdirSync(TRANSLATIONS_DIR, { recursive: true });
  const fp = path.join(TRANSLATIONS_DIR, `${collection}.json`);
  fs.writeFileSync(fp, JSON.stringify(existingMap, null, 2), 'utf8');
  invalidateTranslationCache(collection);
}

export function readOverlayJson<T>(filename: string, fallback: T): T {
  return readJsonFromDir<T>(OVERLAYS_DIR, `overlay:${filename}`, filename, fallback);
}

export function writeOverlayJson<T>(filename: string, data: T): void {
  fs.mkdirSync(OVERLAYS_DIR, { recursive: true });
  const fp = path.join(OVERLAYS_DIR, filename);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
  invalidateOverlayCache(filename);
}
