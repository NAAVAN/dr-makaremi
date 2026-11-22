#!/usr/bin/env node
/**
 * Zero-Token Translation Shard Packer (Pack A)
 * - Reads immutable packages/shared/src/data/vault/*.json + supplemental empathies book (100% read-only)
 * - Identifies exact missing target locales per item (never re-translating existing locales)
 * - Replaces URLs & image paths with compact deterministic placeholders (<<U1>>, <<I1>>)
 * - Splits oversized single bodies (>22k chars) along clean paragraph (\n\n) boundaries to prevent truncation
 * - Groups smaller items efficiently so every shard is crisp (~12k-24k target chars)
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const VAULT_DIR = path.join(ROOT, 'packages', 'shared', 'src', 'data', 'vault');
const TRANS_DIR = path.join(ROOT, 'packages', 'shared', 'src', 'data', 'translations');
const OUT_BASE =
  'C:\\Users\\Acer\\.gemini\\antigravity\\brain\\dee33ca8-8211-48b8-b73d-9681c717f163\\scratch\\translation-shards\\pack-a';
const SHARDS_IN_DIR = path.join(OUT_BASE, 'in');
const URL_MAPS_DIR = path.join(OUT_BASE, 'url-maps');

// Clean stale input shards before repacking (keep out/ untouched for checkpoint resumability!)
fs.rmSync(SHARDS_IN_DIR, { recursive: true, force: true });
fs.mkdirSync(SHARDS_IN_DIR, { recursive: true });
fs.mkdirSync(path.join(OUT_BASE, 'out'), { recursive: true });
fs.mkdirSync(URL_MAPS_DIR, { recursive: true });

function readJson(p, fb) {
  if (!fs.existsSync(p)) return fb;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function detectOriginalLang(translations = []) {
  const first = translations[0];
  if (!first) return 'fa';
  const code = (first.languages_code || '').toLowerCase();
  const sample = `${first.title || ''} ${first.body_markdown || ''} ${first.synopsis || ''} ${first.description_markdown || ''}`;
  const persianChars = (sample.match(/[\u0600-\u06FF]/g) || []).length;
  const titlePersianChars = ((first.title || '').match(/[\u0600-\u06FF]/g) || []).length;
  const ratio = sample.length > 0 ? persianChars / sample.length : 0;

  if (code.startsWith('fa') || titlePersianChars > 2 || ratio > 0.25) return 'fa';
  if (code.startsWith('fr')) return 'fr';
  if (code.startsWith('en')) return 'en';
  if (persianChars > 12) return 'fa';
  return 'fa';
}

function hasNonEmptyContent(rec, fields) {
  if (!rec) return false;
  return fields.some((f) => typeof rec[f] === 'string' && rec[f].trim().length > 0);
}

function compressUrls(text, state) {
  if (typeof text !== 'string' || !text) return text;
  let out = text.replace(/!\[([^\]]*)\]\(((?:https?:\/\/|\/wp-content\/)[^)\s]+)\)/g, (_, alt, url) => {
    let tok = state.reverse.get(url);
    if (!tok) {
      state.imgIdx += 1;
      tok = `<<I${state.imgIdx}>>`;
      state.reverse.set(url, tok);
      state.map[tok] = url;
    }
    return `![${alt}](${tok})`;
  });
  out = out.replace(/((?:https?:\/\/|\/wp-content\/)[^\s)\]>"]+)/g, (url) => {
    let tok = state.reverse.get(url);
    if (!tok) {
      state.urlIdx += 1;
      tok = `<<U${state.urlIdx}>>`;
      state.reverse.set(url, tok);
      state.map[tok] = url;
    }
    return tok;
  });
  return out;
}

function packRecordFields(rec, fields, state) {
  const out = {};
  for (const f of fields) {
    if (typeof rec[f] === 'string' && rec[f].trim().length > 0) {
      out[f] = compressUrls(rec[f], state);
    }
  }
  return out;
}

/**
 * Split long markdown bodies along `\n\n` paragraph boundaries when exceeding `maxBodyChars`.
 */
function splitParagraphChunks(text, maxBodyChars = 18000) {
  if (!text || text.length <= maxBodyChars) return [text];
  const paras = text.split(/\n{2,}/);
  const chunks = [];
  let cur = '';
  for (const p of paras) {
    if (cur.length > 0 && cur.length + p.length + 2 > maxBodyChars) {
      chunks.push(cur);
      cur = p;
    } else {
      cur = cur ? `${cur}\n\n${p}` : p;
    }
  }
  if (cur) chunks.push(cur);
  // Edge case: single huge paragraph without double newlines -> split cleanly on single newline or sentence
  const safeChunks = [];
  for (const c of chunks) {
    if (c.length <= maxBodyChars * 1.4) {
      safeChunks.push(c);
    } else {
      const lines = c.split('\n');
      let sub = '';
      for (const l of lines) {
        if (sub && sub.length + l.length + 1 > maxBodyChars) {
          safeChunks.push(sub);
          sub = l;
        } else {
          sub = sub ? `${sub}\n${l}` : l;
        }
      }
      if (sub) safeChunks.push(sub);
    }
  }
  return safeChunks;
}

const SUPPLEMENTAL_BOOK_EMPATHIES = {
  slug: 'empathies-of-a-psychoanalyst',
  translations: [
    {
      languages_code: 'fa-IR',
      title: 'همدلی‌های یک روان‌کاو',
      subtitle: 'گفتارهایی در روان‌درمانی و ادراک انسانی',
      publisher_name: 'انتشارات نشانه',
      publication_city: 'تهران',
      synopsis:
        'جستارهایی پیرامون همدلی بالینی، آسیب‌شناسی ازهم‌گسستگی و رانه مرگ، و چگونگی التیام تروماهای جمعی و فردی.',
    },
  ],
};

function buildCollectionWorkItems(collection, items, fields, filterFn = () => true) {
  const existingStore = readJson(path.join(TRANS_DIR, `${collection}.json`), {});
  const urlMaps = {};
  const jobs = [];

  for (const item of items) {
    if (!filterFn(item)) continue;
    const translations = item.translations || [];
    if (translations.length === 0) continue;

    const origLang = detectOriginalLang(translations);
    const presentLangs = new Set();
    const byLang = {};
    for (const t of translations) {
      const lc = (t.languages_code || '').slice(0, 2).toLowerCase();
      if (hasNonEmptyContent(t, ['title', ...fields])) {
        presentLangs.add(lc);
        byLang[lc] = t;
      }
    }
    const stored = existingStore[item.slug] || {};
    for (const lc of Object.keys(stored)) {
      if (hasNonEmptyContent(stored[lc], ['title', ...fields])) {
        presentLangs.add(lc);
      }
    }

    const missing = ['fa', 'fr', 'en'].filter((lc) => lc !== origLang && !presentLangs.has(lc));
    if (missing.length === 0) continue;

    const urlState = { imgIdx: 0, urlIdx: 0, map: {}, reverse: new Map() };
    const baseSources = {};
    baseSources[origLang] = packRecordFields(translations[0], fields, urlState);
    if (origLang !== 'fr' && byLang.fr) {
      baseSources.fr = packRecordFields(byLang.fr, fields, urlState);
    }
    urlMaps[item.slug] = urlState.map;

    // Identify long body field to split if > 18k chars
    const primaryRec = baseSources[origLang];
    const bodyField = ['body_markdown', 'sample_chapter_markdown', 'curatorial_statement_markdown', 'description_markdown']
      .find((f) => typeof primaryRec[f] === 'string' && primaryRec[f].length > 18000);

    if (bodyField) {
      const parts = splitParagraphChunks(primaryRec[bodyField], 18000);
      parts.forEach((chunkText, idx) => {
        const partSources = {};
        for (const [k, v] of Object.entries(baseSources)) {
          partSources[k] = { ...v };
        }
        if (idx === 0) {
          partSources[origLang][bodyField] = chunkText;
        } else {
          // For continuation chunks, only carry title as context + chunk body to save tokens!
          partSources[origLang] = {
            title: primaryRec.title,
            [bodyField]: chunkText,
          };
          if (origLang !== 'fr' && partSources.fr) {
            delete partSources.fr;
          }
        }
        const approxChars = JSON.stringify(partSources).length;
        // Split each missing locale individually on huge parts so output stays comfortably small
        for (const targetLang of missing) {
          jobs.push({
            collection,
            slug: item.slug,
            originalLang: origLang,
            targetLocales: [targetLang],
            partIndex: idx + 1,
            totalParts: parts.length,
            splitField: bodyField,
            fields: idx === 0 ? fields : [bodyField],
            sources: partSources,
            approxChars,
          });
        }
      });
    } else {
      const approxChars = JSON.stringify(baseSources).length;
      jobs.push({
        collection,
        slug: item.slug,
        originalLang: origLang,
        targetLocales: missing,
        fields,
        sources: baseSources,
        approxChars,
      });
    }
  }

  fs.writeFileSync(path.join(URL_MAPS_DIR, `${collection}.json`), JSON.stringify(urlMaps, null, 2), 'utf8');
  return jobs;
}

function kHasFr(partSources) {
  return Boolean(partSources.fr);
}

function writeShards(collection, jobs, maxWeightPerShard = 22000, maxItemsPerShard = 12) {
  // Sort small items first (bin-pack friendly) while keeping multi-part chunks cleanly grouped
  const singleParts = jobs.filter((j) => !j.totalParts).sort((a, b) => a.approxChars - b.approxChars);
  const multiParts = jobs.filter((j) => Boolean(j.totalParts));

  const shards = [];
  let cur = [];
  let curWeight = 0;

  for (const job of singleParts) {
    const weight = job.approxChars * Math.max(1, job.targetLocales.length);
    if (cur.length > 0 && (curWeight + weight > maxWeightPerShard || cur.length >= maxItemsPerShard)) {
      shards.push(cur);
      cur = [];
      curWeight = 0;
    }
    cur.push(job);
    curWeight += weight;
  }
  if (cur.length > 0) shards.push(cur);

  // Each multi-part chunk gets its own focused single-locale shard (approx <= 18k in, <= 20k out)
  for (const mj of multiParts) {
    shards.push([mj]);
  }

  const shardMeta = [];
  shards.forEach((items, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    const filename = `${collection}-shard-${num}.json`;
    fs.writeFileSync(path.join(SHARDS_IN_DIR, filename), JSON.stringify(items, null, 2), 'utf8');
    shardMeta.push({
      shardId: `${collection}-${num}`,
      file: filename,
      itemCount: items.length,
      slugs: items.map((i) => (i.partIndex ? `${i.slug}#p${i.partIndex}/${i.totalParts}[${i.targetLocales[0]}]` : i.slug)),
      approxInputChars: items.reduce((s, i) => s + i.approxChars, 0),
    });
  });

  return shardMeta;
}

function main() {
  const exhibitions = readJson(path.join(VAULT_DIR, 'exhibitions.json'), []);
  const artworks = readJson(path.join(VAULT_DIR, 'artworks.json'), []);
  const vaultBooks = readJson(path.join(VAULT_DIR, 'books.json'), []);
  const books = [
    ...vaultBooks,
    ...(vaultBooks.some((b) => b.slug === SUPPLEMENTAL_BOOK_EMPATHIES.slug) ? [] : [SUPPLEMENTAL_BOOK_EMPATHIES]),
  ];
  const pages = readJson(path.join(VAULT_DIR, 'pages.json'), []);
  const articles = readJson(path.join(VAULT_DIR, 'articles.json'), []);

  const exhJobs = buildCollectionWorkItems('exhibitions', exhibitions, [
    'title',
    'curatorial_statement_markdown',
  ]);
  const artJobs = buildCollectionWorkItems('artworks', artworks, ['title', 'description_markdown']);
  const bookJobs = buildCollectionWorkItems('books', books, [
    'title',
    'subtitle',
    'publisher_name',
    'publication_city',
    'synopsis',
    'table_of_contents_markdown',
    'sample_chapter_markdown',
  ]);
  const pageJobs = buildCollectionWorkItems('pages', pages, ['title', 'excerpt', 'body_markdown']);
  const articleJobs = buildCollectionWorkItems(
    'articles',
    articles,
    ['title', 'executive_summary', 'body_markdown'],
    (item) => {
      const orig = detectOriginalLang(item.translations || []);
      return orig === 'fr' || orig === 'en';
    }
  );

  const manifest = {
    generated_at: new Date().toISOString(),
    pack: 'pack-a',
    model_policy: 'inherit-only (0 flash / 0 flash_lite)',
    english_style: 'International Academic English (hreflang="en", British/UNESCO spelling)',
    shards: [
      ...writeShards('exhibitions', exhJobs, 20000, 10),
      ...writeShards('artworks', artJobs, 20000, 12),
      ...writeShards('books', bookJobs, 18000, 6),
      ...writeShards('pages', pageJobs, 18000, 6),
      ...writeShards('articles', articleJobs, 18000, 5),
    ],
  };

  fs.writeFileSync(path.join(OUT_BASE, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log('=== PACK A SHARDS REPACKED (0 LLM TOKENS) ===');
  for (const col of ['exhibitions', 'artworks', 'books', 'pages', 'articles']) {
    const colShards = manifest.shards.filter((s) => s.shardId.startsWith(col));
    const uniqueSlugs = new Set(colShards.flatMap((s) => s.slugs.map((x) => x.split('#')[0])));
    console.log(`- ${col}: ${uniqueSlugs.size} works across ${colShards.length} shards`);
  }
  console.log(`Total Pack A shards: ${manifest.shards.length}`);
}

main();
