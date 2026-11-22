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
const cache = new Map<string, unknown>();

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
