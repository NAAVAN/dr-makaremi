#!/usr/bin/env node
/**
 * Zero-Token Translation Shard Packer (Pack A & Pack B)
 * - Reads immutable packages/shared/src/data/vault/*.json (100% read-only)
 * - Identifies exact missing target locales per item (never re-translating existing locales)
 * - Pack A (--pack=pack-a, default): exhibitions, artworks, books, pages, non-Persian articles
 * - Pack B (--pack=pack-b): all 300 poems with strict line-by-line & hemistich_a/hemistich_b structure
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const VAULT_DIR = path.join(ROOT, 'packages', 'shared', 'src', 'data', 'vault');
const TRANS_DIR = path.join(ROOT, 'packages', 'shared', 'src', 'data', 'translations');
const BRAIN_SCRATCH =
  'C:\\Users\\Acer\\.gemini\\antigravity\\brain\\dee33ca8-8211-48b8-b73d-9681c717f163\\scratch\\translation-shards';

const packArg = (process.argv.find((a) => a.startsWith('--pack=')) || '--pack=pack-a').split('=')[1];

function readJson(p, fb) {
  if (!fs.existsSync(p)) return fb;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function detectOriginalLang(translations = []) {
  const first = translations[0];
  if (!first) return 'fa';
  const code = (first.languages_code || '').toLowerCase();
  const verseSample = (first.verses || [])
    .slice(0, 4)
    .map((v) => `${v.hemistich_a || ''} ${v.hemistich_b || ''}`)
    .join(' ');
  const sample = `${first.title || ''} ${first.body_markdown || ''} ${first.synopsis || ''} ${first.description_markdown || ''} ${verseSample}`;
  const persianChars = (sample.match(/[\u0600-\u06FF]/g) || []).length;
  const titlePersianChars = ((first.title || '').match(/[\u0600-\u06FF]/g) || []).length;
  const ratio = sample.length > 0 ? persianChars / sample.length : 0;

  if (code.startsWith('fa') || titlePersianChars > 2 || ratio > 0.25) return 'fa';
  if (code.startsWith('fr')) return 'fr';
  if (code.startsWith('en')) return 'en';
  if (persianChars > 12) return 'fa';
  return 'fa';
}

function packPackB() {
  const OUT_BASE = path.join(BRAIN_SCRATCH, 'pack-b');
  const SHARDS_IN_DIR = path.join(OUT_BASE, 'in');
  fs.rmSync(SHARDS_IN_DIR, { recursive: true, force: true });
  fs.mkdirSync(SHARDS_IN_DIR, { recursive: true });
  fs.mkdirSync(path.join(OUT_BASE, 'out'), { recursive: true });

  const poems = readJson(path.join(VAULT_DIR, 'poems.json'), []);
  const existingStore = readJson(path.join(TRANS_DIR, 'poems.json'), {});
  const jobs = [];

  for (const poem of poems) {
    const t0 = poem.translations?.[0];
    if (!t0 || !Array.isArray(t0.verses) || t0.verses.length === 0) continue;
    const origLang = detectOriginalLang(poem.translations);
    const presentLangs = new Set([origLang]);

    for (const t of poem.translations) {
      const lc = (t.languages_code || '').slice(0, 2).toLowerCase();
      if (Array.isArray(t.verses) && t.verses.length === t0.verses.length) {
        presentLangs.add(lc);
      }
    }

    const stored = existingStore[poem.slug] || {};
    for (const [lc, rec] of Object.entries(stored)) {
      if (rec && Array.isArray(rec.verses) && rec.verses.length === t0.verses.length) {
        presentLangs.add(lc);
      }
    }

    const missing = ['fa', 'fr', 'en'].filter((lc) => lc !== origLang && !presentLangs.has(lc));
    if (missing.length === 0) continue;

    const cleanVerses = t0.verses.map((v, idx) => {
      const out = {
        line_index: typeof v.line_index === 'number' ? v.line_index : idx + 1,
        hemistich_a: v.hemistich_a || '',
      };
      if (typeof v.hemistich_b === 'string' && v.hemistich_b.trim().length > 0) {
        out.hemistich_b = v.hemistich_b;
      }
      return out;
    });

    const source = {
      title: t0.title || poem.slug,
      verses: cleanVerses,
    };
    if (typeof t0.commentary_markdown === 'string' && t0.commentary_markdown.trim().length > 0) {
      source.commentary_markdown = t0.commentary_markdown;
    }

    const approxChars = JSON.stringify(source).length;
    jobs.push({
      collection: 'poems',
      slug: poem.slug,
      originalLang: origLang,
      targetLocales: missing,
      verseCount: cleanVerses.length,
      hasHemistichB: cleanVerses.some((v) => Boolean(v.hemistich_b)),
      source,
      approxChars,
    });
  }

  // Group into balanced shards of up to 15 poems (~8,000-10,000 source chars per shard)
  const MAX_POEMS_PER_SHARD = 15;
  const MAX_CHARS_PER_SHARD = 11000;
  const shards = [];
  let cur = [];
  let curChars = 0;

  for (const job of jobs) {
    if (
      cur.length > 0 &&
      (cur.length >= MAX_POEMS_PER_SHARD || curChars + job.approxChars > MAX_CHARS_PER_SHARD)
    ) {
      shards.push(cur);
      cur = [];
      curChars = 0;
    }
    cur.push(job);
    curChars += job.approxChars;
  }
  if (cur.length > 0) shards.push(cur);

  const shardMeta = [];
  shards.forEach((items, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    const filename = `poems-shard-${num}.json`;
    fs.writeFileSync(path.join(SHARDS_IN_DIR, filename), JSON.stringify(items, null, 2), 'utf8');
    shardMeta.push({
      shardId: `poems-${num}`,
      file: filename,
      itemCount: items.length,
      totalVerses: items.reduce((s, i) => s + i.verseCount, 0),
      slugs: items.map((i) => i.slug),
      approxInputChars: items.reduce((s, i) => s + i.approxChars, 0),
    });
  });

  const manifest = {
    generated_at: new Date().toISOString(),
    pack: 'pack-b',
    model_policy: 'inherit-only (0 flash / 0 flash_lite)',
    english_style: 'International Academic English (hreflang="en", British/UNESCO spelling)',
    totalPoemsToTranslate: jobs.length,
    totalShards: shardMeta.length,
    shards: shardMeta,
  };

  fs.writeFileSync(path.join(OUT_BASE, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log('=== PACK B (300 POEMS) SHARDS PACKED (0 LLM TOKENS) ===');
  console.log(`- Poems needing translation: ${jobs.length} across ${shardMeta.length} shards`);
  console.log(
    `- Total source verses across shards: ${shardMeta.reduce((s, x) => s + x.totalVerses, 0)}`
  );
}

if (packArg === 'pack-b') {
  packPackB();
} else {
  console.log('Use --pack=pack-b to pack Pack B poems (Pack A is already 130/130 complete).');
}
