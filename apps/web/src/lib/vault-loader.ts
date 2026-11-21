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
const cache = new Map<string, unknown>();

function readVaultJson<T>(filename: string, fallback: T): T {
  if (cache.has(filename)) {
    return cache.get(filename) as T;
  }

  try {
    const filePath = path.join(VAULT_DIR, filename);
    if (!fs.existsSync(filePath)) {
      cache.set(filename, fallback);
      return fallback;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as T;
    cache.set(filename, parsed);
    return parsed;
  } catch (err) {
    console.error(`[vault-loader] Failed to read ${filename}:`, err);
    return fallback;
  }
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
