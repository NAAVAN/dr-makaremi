#!/usr/bin/env node
/**
 * Zero-Token Deterministic Shard Merger & QA Verifier (Packs A & B)
 * 1. Reads translated JSON files from scratch/translation-shards/pack-a/out/*.json and pack-b/out/*.json
 * 2. Reassembles multi-part chunks (`partIndex` / `totalParts`) in strict sequential order
 * 3. Restores <<I1>> / <<U1>> placeholders deterministically from url-maps/*.json
 * 4. Merges verified translations into packages/shared/src/data/translations/*.json
 * 5. Runs strict QA checks (including 1:1 poem verse & hemistich_a/hemistich_b structural parity)
 *    + verifies vault/*.json are byte-for-byte untouched
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const VAULT_DIR = path.join(ROOT, 'packages', 'shared', 'src', 'data', 'vault');
const TRANS_DIR = path.join(ROOT, 'packages', 'shared', 'src', 'data', 'translations');
const GLOSSARY_PATH = path.join(ROOT, 'packages', 'shared', 'src', 'data', 'glossary-lock.json');
const SHARD_ROOT =
  'C:\\Users\\Acer\\.gemini\\antigravity\\brain\\dee33ca8-8211-48b8-b73d-9681c717f163\\scratch\\translation-shards';

const COLLECTIONS = ['exhibitions', 'artworks', 'books', 'pages', 'articles', 'poems', 'videos'];

function readJson(p, fb) {
  if (!fs.existsSync(p)) return fb;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function restoreUrls(value, urlMap = {}) {
  if (typeof value !== 'string') return value;
  return value.replace(/<<(?:I|U)\d+>>/g, (tok) => (urlMap[tok] !== undefined ? urlMap[tok] : tok));
}

function mergeOutputs() {
  const stores = {};
  const urlMaps = {};
  for (const col of COLLECTIONS) {
    stores[col] = readJson(path.join(TRANS_DIR, `${col}.json`), {});
    const mapA = readJson(path.join(SHARD_ROOT, 'pack-a', 'url-maps', `${col}.json`), {});
    const mapC = readJson(path.join(SHARD_ROOT, 'pack-c', 'url-maps', `${col}.json`), {});
    const mapD = readJson(path.join(SHARD_ROOT, 'pack-d', 'url-maps', `${col}.json`), {});
    urlMaps[col] = { ...mapA, ...mapC, ...mapD };
  }

  const grouped = new Map();
  for (const packName of ['pack-a', 'pack-b', 'pack-c', 'pack-d']) {
    const outDir = path.join(SHARD_ROOT, packName, 'out');
    if (!fs.existsSync(outDir)) continue;
    const outFiles = fs.readdirSync(outDir).filter((f) => f.endsWith('.json')).sort();
    for (const file of outFiles) {
      let records;
      try {
        records = readJson(path.join(outDir, file), []);
      } catch (e) {
        console.error(`Invalid JSON in ${packName}/out/${file}: ${e.message}`);
        continue;
      }
      if (!Array.isArray(records)) continue;
      for (const rec of records) {
        const { collection, slug, translations, partIndex, splitField } = rec;
        if (!collection || !slug || !translations || !stores[collection]) continue;
        for (const [lang, fieldsObj] of Object.entries(translations)) {
          const lc = lang.slice(0, 2).toLowerCase();
          if (!['fa', 'fr', 'en'].includes(lc) || !fieldsObj || typeof fieldsObj !== 'object') continue;
          const key = `${collection}::${slug}::${lc}`;
          if (!grouped.has(key)) grouped.set(key, []);
          grouped.get(key).push({
            partIndex: typeof partIndex === 'number' ? partIndex : 1,
            splitField: splitField || 'body_markdown',
            fieldsObj,
            collection,
            slug,
            lc,
          });
        }
      }
    }
  }

  let mergedCount = 0;
  for (const parts of grouped.values()) {
    parts.sort((a, b) => a.partIndex - b.partIndex);
    const { collection, slug, lc, splitField } = parts[0];
    const map = urlMaps[collection]?.[slug] || {};
    if (!stores[collection][slug]) stores[collection][slug] = {};

    const combined = {
      languages_code: lc === 'fa' ? 'fa-IR' : lc === 'fr' ? 'fr-FR' : 'en',
      provenance: 'glossary_locked_ai',
    };

    for (const [k, v] of Object.entries(parts[0].fieldsObj)) {
      combined[k] = typeof v === 'string' ? restoreUrls(v, map) : v;
    }

    if (parts.length > 1) {
      const joinedBody = parts
        .map((p) => restoreUrls(String(p.fieldsObj[splitField] || p.fieldsObj.body_markdown || ''), map))
        .filter(Boolean)
        .join('\n\n');
      combined[splitField] = joinedBody;
    }

    stores[collection][slug][lc] = combined;
    mergedCount++;
  }

  for (const col of COLLECTIONS) {
    fs.writeFileSync(path.join(TRANS_DIR, `${col}.json`), JSON.stringify(stores[col], null, 2), 'utf8');
  }
  return mergedCount;
}

function checkBritishSpelling(text, usWords, spellingMap, label, errors) {
  if (typeof text !== 'string' || !text) return;
  const cleaned = text
    .replace(/https?:\/\/[^\s)]+/g, '')
    .replace(/\bIran Human Rights Documentation Center\b/g, '')
    .replace(/\bOMID,\s*A Memorial in Defense of Human Rights in Iran\b/g, '');
  for (const usWord of usWords) {
    const re = new RegExp(`\\b${usWord}\\b`, 'i');
    if (re.test(cleaned)) {
      errors.push(`${label}: US spelling "${usWord}" -> should be "${spellingMap[usWord]}"`);
    }
  }
}

function verifyAll() {
  const glossary = readJson(GLOSSARY_PATH, {});
  const spellingMap = glossary?.british_english_rules?.spelling_map || {};
  const usWords = Object.keys(spellingMap).filter(
    (w) => !['color', 'colors', 'center', 'program', 'dialog'].includes(w)
  );

  const errors = [];
  const warnings = [];
  const stats = {};

  for (const col of COLLECTIONS) {
    const vaultItems = readJson(path.join(VAULT_DIR, `${col}.json`), []);
    const vaultBySlug = new Map(vaultItems.map((i) => [i.slug, i]));
    const store = readJson(path.join(TRANS_DIR, `${col}.json`), {});
    let localeCount = 0;
    let itemCount = 0;

    for (const [slug, langMap] of Object.entries(store)) {
      itemCount++;
      const vaultItem = vaultBySlug.get(slug);
      const srcTrans = vaultItem?.translations?.[0];

      for (const [lc, entry] of Object.entries(langMap)) {
        localeCount++;
        for (const [field, val] of Object.entries(entry)) {
          if (typeof val === 'string') {
            if (/<<(?:I|U)\d+>>/.test(val)) {
              errors.push(`${col}/${slug}[${lc}].${field}: un-restored placeholder token found`);
            }
            if (lc === 'en') {
              checkBritishSpelling(val, usWords, spellingMap, `${col}/${slug}[en].${field}`, errors);
            }
          }
        }
        if (!entry.title || !entry.title.trim()) {
          errors.push(`${col}/${slug}[${lc}]: empty title`);
        }

        if (col === 'poems' && srcTrans && Array.isArray(srcTrans.verses)) {
          const srcVerses = srcTrans.verses;
          const dstVerses = entry.verses;
          if (!Array.isArray(dstVerses)) {
            errors.push(`poems/${slug}[${lc}]: missing verses array`);
          } else if (dstVerses.length !== srcVerses.length) {
            errors.push(
              `poems/${slug}[${lc}]: verse count mismatch (got ${dstVerses.length}, expected ${srcVerses.length})`
            );
          } else {
            for (let i = 0; i < srcVerses.length; i++) {
              const sv = srcVerses[i];
              const dv = dstVerses[i];
              if (!dv || typeof dv.hemistich_a !== 'string' || !dv.hemistich_a.trim()) {
                errors.push(`poems/${slug}[${lc}].verses[${i}]: empty hemistich_a`);
              }
              const srcHasB = typeof sv.hemistich_b === 'string' && sv.hemistich_b.trim().length > 0;
              const dstHasB = typeof dv?.hemistich_b === 'string' && dv.hemistich_b.trim().length > 0;
              if (srcHasB && !dstHasB) {
                errors.push(`poems/${slug}[${lc}].verses[${i}]: missing required hemistich_b`);
              } else if (!srcHasB && dstHasB) {
                errors.push(`poems/${slug}[${lc}].verses[${i}]: unexpected hemistich_b on single-line verse`);
              }
              if (lc === 'en') {
                checkBritishSpelling(
                  `${dv?.hemistich_a || ''} ${dv?.hemistich_b || ''}`,
                  usWords,
                  spellingMap,
                  `poems/${slug}[en].verses[${i}]`,
                  errors
                );
              }
              if (lc === 'fa') {
                const faText = `${dv?.hemistich_a || ''} ${dv?.hemistich_b || ''}`;
                if (/[\u064A\u0649\u0643]/.test(faText)) {
                  errors.push(`poems/${slug}[fa].verses[${i}]: contains non-standard Arabic Yeh/Kaf`);
                }
              }
            }
          }
          if (
            typeof srcTrans.commentary_markdown === 'string' &&
            srcTrans.commentary_markdown.trim().length > 0 &&
            (typeof entry.commentary_markdown !== 'string' || !entry.commentary_markdown.trim())
          ) {
            errors.push(`poems/${slug}[${lc}]: missing commentary_markdown`);
          }
        } else if (srcTrans) {
          for (const bodyField of [
            'curatorial_statement_markdown',
            'description_markdown',
            'body_markdown',
            'synopsis',
            'description',
            'transcript_markdown',
          ]) {
            if (typeof srcTrans[bodyField] === 'string' && srcTrans[bodyField].trim().length > 20) {
              if (typeof entry[bodyField] !== 'string' || entry[bodyField].trim().length < 5) {
                warnings.push(
                  `${col}/${slug}[${lc}]: source has ${bodyField} (${srcTrans[bodyField].length} chars) but translation missing`
                );
              }
            }
          }
        }
      }
    }
    stats[col] = { items: itemCount, locales: localeCount };
  }

  try {
    const diffOut = execSync('git status --porcelain packages/shared/src/data/vault/', { encoding: 'utf8' }).trim();
    if (diffOut.length > 0) {
      errors.push(`CRITICAL: Vault directory modified!\n${diffOut}`);
    }
  } catch (e) {
    warnings.push(`Could not check git status for vault/: ${e.message}`);
  }

  console.log('=== TRANSLATION STORE QA REPORT ===');
  for (const col of COLLECTIONS) {
    console.log(`- ${col}: ${stats[col].items} slugs, ${stats[col].locales} translated locale records`);
  }
  console.log(`Warnings: ${warnings.length}`);
  warnings.slice(0, 20).forEach((w) => console.log(`  WARN: ${w}`));
  console.log(`Errors: ${errors.length}`);
  errors.slice(0, 30).forEach((e) => console.error(`  ERR: ${e}`));

  if (errors.length > 0) process.exit(1);
}

const shouldMerge = process.argv.includes('--merge');
if (shouldMerge) {
  const n = mergeOutputs();
  console.log(`Merged ${n} total translated locale records across Packs A-D`);
}
verifyAll();
