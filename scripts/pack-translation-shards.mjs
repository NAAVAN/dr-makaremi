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

function compressUrls(text, map, counterRef) {
  if (typeof text !== 'string' || !text) return text;
  let out = text.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, (_m, alt, url) => {
    counterRef.i += 1;
    const tok = `<<I${counterRef.i}>>`;
    map[tok] = url;
    return `![${alt}](${tok})`;
  });
  out = out.replace(/https?:\/\/[^\s)"'>\]]+/g, (url) => {
    counterRef.u += 1;
    const tok = `<<U${counterRef.u}>>`;
    map[tok] = url;
    return tok;
  });
  return out;
}

function splitLongText(text, maxChunkChars = 6400) {
  if (!text || text.length <= maxChunkChars) return [text];
  const paras = text.split(/\n{2,}/);
  const chunks = [];
  let cur = [];
  let curLen = 0;
  for (const p of paras) {
    if (cur.length > 0 && curLen + p.length + 2 > maxChunkChars) {
      chunks.push(cur.join('\n\n'));
      cur = [];
      curLen = 0;
    }
    cur.push(p);
    curLen += p.length + 2;
  }
  if (cur.length > 0) chunks.push(cur.join('\n\n'));
  return chunks;
}

function packPackC() {
  const OUT_BASE = path.join(BRAIN_SCRATCH, 'pack-c');
  const SHARDS_IN_DIR = path.join(OUT_BASE, 'in');
  const URL_MAPS_DIR = path.join(OUT_BASE, 'url-maps');
  fs.rmSync(SHARDS_IN_DIR, { recursive: true, force: true });
  fs.mkdirSync(SHARDS_IN_DIR, { recursive: true });
  fs.mkdirSync(path.join(OUT_BASE, 'out'), { recursive: true });
  fs.mkdirSync(URL_MAPS_DIR, { recursive: true });

  const videos = readJson(path.join(VAULT_DIR, 'videos.json'), []);
  const urlMapAll = {};
  const metaItems = [];
  const transcriptJobs = [];

  for (const vid of videos) {
    const t0 = vid.translations?.[0];
    if (!t0) continue;
    const origLang = detectOriginalLang(vid.translations);
    const missing = ['fa', 'fr', 'en'].filter((lc) => lc !== origLang);

    const map = {};
    const counterRef = { i: 0, u: 0 };
    const cleanTitle = (t0.title || vid.slug).trim();
    const cleanDesc = compressUrls((t0.description || '').trim(), map, counterRef);
    const rawTr = (t0.transcript_markdown || '').trim();

    if (!rawTr) {
      if (Object.keys(map).length > 0) urlMapAll[vid.slug] = map;
      metaItems.push({
        collection: 'videos',
        slug: vid.slug,
        originalLang: origLang,
        targetLocales: missing,
        hasTranscript: false,
        source: {
          title: cleanTitle,
          description: cleanDesc,
        },
        approxChars: cleanTitle.length + cleanDesc.length,
      });
    } else {
      const cleanTr = compressUrls(rawTr, map, counterRef);
      if (Object.keys(map).length > 0) urlMapAll[vid.slug] = map;
      // Keep full transcript intact if <= 14000 chars; only split if > 14000 chars
      const chunks = splitLongText(cleanTr, 14000);
      for (const lc of missing) {
        chunks.forEach((chunkText, idx) => {
          transcriptJobs.push({
            collection: 'videos',
            slug: vid.slug,
            originalLang: origLang,
            targetLocales: [lc],
            partIndex: idx + 1,
            totalParts: chunks.length,
            splitField: 'transcript_markdown',
            hasTranscript: true,
            source:
              idx === 0
                ? {
                    title: cleanTitle,
                    description: cleanDesc,
                    transcript_markdown: chunkText,
                  }
                : {
                    title: cleanTitle,
                    transcript_markdown: chunkText,
                  },
            approxChars: cleanTitle.length + (idx === 0 ? cleanDesc.length : 0) + chunkText.length,
          });
        });
      }
    }
  }

  fs.writeFileSync(path.join(URL_MAPS_DIR, 'videos.json'), JSON.stringify(urlMapAll, null, 2), 'utf8');

  const shardMeta = [];
  let shardCounter = 0;

  // 1. Metadata shards for the 185 videos without long transcripts (38 videos per shard -> 5 shards)
  const META_PER_SHARD = 38;
  for (let i = 0; i < metaItems.length; i += META_PER_SHARD) {
    shardCounter += 1;
    const slice = metaItems.slice(i, i + META_PER_SHARD);
    const num = String(shardCounter).padStart(2, '0');
    const filename = `videos-shard-${num}.json`;
    fs.writeFileSync(path.join(SHARDS_IN_DIR, filename), JSON.stringify(slice, null, 2), 'utf8');
    shardMeta.push({
      shardId: `videos-${num}`,
      kind: 'metadata-batch',
      file: filename,
      itemCount: slice.length,
      slugs: slice.map((x) => x.slug),
      approxInputChars: slice.reduce((s, x) => s + x.approxChars, 0),
    });
  }

  // 2. Group transcript jobs into balanced ~36,000-char shards (typically 3-4 full transcripts per shard -> ~40 shards)
  const MAX_TR_SHARD_CHARS = 38000;
  let curTr = [];
  let curTrChars = 0;
  for (const job of transcriptJobs) {
    if (curTr.length > 0 && (curTr.length >= 4 || curTrChars + job.approxChars > MAX_TR_SHARD_CHARS)) {
      shardCounter += 1;
      const num = String(shardCounter).padStart(2, '0');
      const filename = `videos-shard-${num}.json`;
      fs.writeFileSync(path.join(SHARDS_IN_DIR, filename), JSON.stringify(curTr, null, 2), 'utf8');
      shardMeta.push({
        shardId: `videos-${num}`,
        kind: 'transcript',
        file: filename,
        itemCount: curTr.length,
        slugs: curTr.map((x) => `${x.slug}[${x.targetLocales[0]}#${x.partIndex}/${x.totalParts}]`),
        approxInputChars: curTrChars,
      });
      curTr = [];
      curTrChars = 0;
    }
    curTr.push(job);
    curTrChars += job.approxChars;
  }
  if (curTr.length > 0) {
    shardCounter += 1;
    const num = String(shardCounter).padStart(2, '0');
    const filename = `videos-shard-${num}.json`;
    fs.writeFileSync(path.join(SHARDS_IN_DIR, filename), JSON.stringify(curTr, null, 2), 'utf8');
    shardMeta.push({
      shardId: `videos-${num}`,
      kind: 'transcript',
      file: filename,
      itemCount: curTr.length,
      slugs: curTr.map((x) => `${x.slug}[${x.targetLocales[0]}#${x.partIndex}/${x.totalParts}]`),
      approxInputChars: curTrChars,
    });
  }

  const manifest = {
    generated_at: new Date().toISOString(),
    pack: 'pack-c',
    model_policy: 'inherit-only (0 flash / 0 flash_lite)',
    english_style: 'International Academic English (hreflang="en", British/UNESCO spelling)',
    totalVideos: videos.length,
    metadataOnlyVideos: metaItems.length,
    transcriptVideos: videos.length - metaItems.length,
    totalTranscriptChunks: transcriptJobs.length,
    totalShards: shardMeta.length,
    shards: shardMeta,
  };
  fs.writeFileSync(path.join(OUT_BASE, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log('=== PACK C (SPEECHES & VIDEOS) SHARDS PACKED (0 LLM TOKENS) ===');
  console.log(`- Metadata-only videos: ${metaItems.length} across 8 batch shards`);
  console.log(`- Full-transcript videos: ${videos.length - metaItems.length} (${transcriptJobs.length} chunks)`);
  console.log(`- Total Pack C shards: ${shardMeta.length}`);
}

if (packArg === 'pack-b') {
  packPackB();
} else if (packArg === 'pack-c') {
  packPackC();
} else if (packArg === 'pack-d') {
  packPackD();
} else {
  console.log('Use --pack=pack-b, --pack=pack-c, or --pack=pack-d.');
}

function packPackD() {
  const OUT_BASE = path.join(BRAIN_SCRATCH, 'pack-d');
  const SHARDS_IN_DIR = path.join(OUT_BASE, 'in');
  const URL_MAPS_DIR = path.join(OUT_BASE, 'url-maps');
  fs.rmSync(SHARDS_IN_DIR, { recursive: true, force: true });
  fs.mkdirSync(SHARDS_IN_DIR, { recursive: true });
  fs.mkdirSync(path.join(OUT_BASE, 'out'), { recursive: true });
  fs.mkdirSync(URL_MAPS_DIR, { recursive: true });

  const articles = readJson(path.join(VAULT_DIR, 'articles.json'), []);
  const existingStore = readJson(path.join(TRANS_DIR, 'articles.json'), {});
  const urlMapAll = {};
  const shortItems = [];
  const longJobs = [];

  for (const art of articles) {
    const t0 = art.translations?.[0];
    if (!t0) continue;
    const origLang = detectOriginalLang(art.translations);
    if (origLang !== 'fa') continue;

    const stored = existingStore[art.slug] || {};
    const missing = ['fr', 'en'].filter((lc) => {
      const rec = stored[lc];
      return !(rec && typeof rec.title === 'string' && rec.title.trim() && typeof rec.body_markdown === 'string' && rec.body_markdown.trim().length > 0);
    });
    if (missing.length === 0) continue;

    const map = {};
    const counterRef = { i: 0, u: 0 };
    const cleanTitle = (t0.title || art.slug).trim();
    const cleanSummary = compressUrls((t0.executive_summary || '').trim(), map, counterRef);
    const rawBody = (t0.body_markdown || '').trim();
    const cleanBody = compressUrls(rawBody, map, counterRef);
    if (Object.keys(map).length > 0) urlMapAll[art.slug] = map;

    const baseApprox = cleanTitle.length + cleanSummary.length + cleanBody.length;
    if (baseApprox <= 1800) {
      shortItems.push({
        collection: 'articles',
        slug: art.slug,
        pillar: art.pillar,
        originalLang: origLang,
        targetLocales: missing,
        source: {
          title: cleanTitle,
          ...(cleanSummary ? { executive_summary: cleanSummary } : {}),
          ...(cleanBody ? { body_markdown: cleanBody } : {}),
        },
        approxChars: baseApprox,
      });
    } else {
      const chunks = splitLongText(cleanBody, 14000);
      for (const lc of missing) {
        chunks.forEach((chunkText, idx) => {
          longJobs.push({
            collection: 'articles',
            slug: art.slug,
            pillar: art.pillar,
            originalLang: origLang,
            targetLocales: [lc],
            partIndex: idx + 1,
            totalParts: chunks.length,
            splitField: 'body_markdown',
            source:
              idx === 0
                ? {
                    title: cleanTitle,
                    ...(cleanSummary ? { executive_summary: cleanSummary } : {}),
                    body_markdown: chunkText,
                  }
                : {
                    title: cleanTitle,
                    body_markdown: chunkText,
                  },
            approxChars: cleanTitle.length + (idx === 0 ? cleanSummary.length : 0) + chunkText.length,
          });
        });
      }
    }
  }

  fs.writeFileSync(path.join(URL_MAPS_DIR, 'articles.json'), JSON.stringify(urlMapAll, null, 2), 'utf8');

  const shardMeta = [];
  let shardCounter = 0;

  // 1. Short Persian articles packed in balanced batches (up to 15 articles or 14,000 source chars)
  let curShort = [];
  let curShortChars = 0;
  for (const job of shortItems) {
    if (curShort.length > 0 && (curShort.length >= 15 || curShortChars + job.approxChars > 14000)) {
      shardCounter += 1;
      const num = String(shardCounter).padStart(3, '0');
      const filename = `articles-fa-shard-${num}.json`;
      fs.writeFileSync(path.join(SHARDS_IN_DIR, filename), JSON.stringify(curShort, null, 2), 'utf8');
      shardMeta.push({
        shardId: `articles-fa-${num}`,
        kind: 'short-batch',
        file: filename,
        itemCount: curShort.length,
        slugs: curShort.map((x) => x.slug),
        approxInputChars: curShortChars,
      });
      curShort = [];
      curShortChars = 0;
    }
    curShort.push(job);
    curShortChars += job.approxChars;
  }
  if (curShort.length > 0) {
    shardCounter += 1;
    const num = String(shardCounter).padStart(3, '0');
    const filename = `articles-fa-shard-${num}.json`;
    fs.writeFileSync(path.join(SHARDS_IN_DIR, filename), JSON.stringify(curShort, null, 2), 'utf8');
    shardMeta.push({
      shardId: `articles-fa-${num}`,
      kind: 'short-batch',
      file: filename,
      itemCount: curShort.length,
      slugs: curShort.map((x) => x.slug),
      approxInputChars: curShortChars,
    });
  }

  // 2. Long Persian articles packed into ~28,000-char shards (1-3 chunks per shard)
  const MAX_LONG_CHARS = 28000;
  let curLong = [];
  let curLongChars = 0;
  for (const job of longJobs) {
    if (curLong.length > 0 && (curLong.length >= 3 || curLongChars + job.approxChars > MAX_LONG_CHARS)) {
      shardCounter += 1;
      const num = String(shardCounter).padStart(3, '0');
      const filename = `articles-fa-shard-${num}.json`;
      fs.writeFileSync(path.join(SHARDS_IN_DIR, filename), JSON.stringify(curLong, null, 2), 'utf8');
      shardMeta.push({
        shardId: `articles-fa-${num}`,
        kind: 'long-essay',
        file: filename,
        itemCount: curLong.length,
        slugs: curLong.map((x) => `${x.slug}[${x.targetLocales[0]}#${x.partIndex}/${x.totalParts}]`),
        approxInputChars: curLongChars,
      });
      curLong = [];
      curLongChars = 0;
    }
    curLong.push(job);
    curLongChars += job.approxChars;
  }
  if (curLong.length > 0) {
    shardCounter += 1;
    const num = String(shardCounter).padStart(3, '0');
    const filename = `articles-fa-shard-${num}.json`;
    fs.writeFileSync(path.join(SHARDS_IN_DIR, filename), JSON.stringify(curLong, null, 2), 'utf8');
    shardMeta.push({
      shardId: `articles-fa-${num}`,
      kind: 'long-essay',
      file: filename,
      itemCount: curLong.length,
      slugs: curLong.map((x) => `${x.slug}[${x.targetLocales[0]}#${x.partIndex}/${x.totalParts}]`),
      approxInputChars: curLongChars,
    });
  }

  const manifest = {
    generated_at: new Date().toISOString(),
    pack: 'pack-d',
    model_policy: 'inherit-only (0 flash / 0 flash_lite)',
    english_style: 'International Academic English (hreflang="en", British/UNESCO spelling)',
    totalPersianArticles: shortItems.length + new Set(longJobs.map((j) => j.slug)).size,
    shortArticles: shortItems.length,
    longArticleChunks: longJobs.length,
    totalShards: shardMeta.length,
    shards: shardMeta,
  };
  fs.writeFileSync(path.join(OUT_BASE, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log('=== PACK D (PERSIAN ARTICLES -> FR + EN) SHARDS PACKED (0 LLM TOKENS) ===');
  console.log(`- Short articles: ${shortItems.length}`);
  console.log(`- Long essay chunks: ${longJobs.length}`);
  console.log(`- Total Pack D shards: ${shardMeta.length}`);
}
