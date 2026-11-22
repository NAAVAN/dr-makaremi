#!/usr/bin/env node
/**
 * Zero-Token Deterministic Shard Merger & QA Verifier
 * 1. Reads translated JSON files from scratch/translation-shards/pack-a/out/*.json
 * 2. Reassembles multi-part chunks (`partIndex` / `totalParts`) in strict sequential order
 * 3. Restores <<I1>> / <<U1>> placeholders deterministically from url-maps/*.json
 * 4. Merges verified translations into packages/shared/src/data/translations/*.json
 * 5. Runs strict QA checks against glossary-lock.json + verifies vault/*.json are byte-for-byte untouched
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const VAULT_DIR = path.join(ROOT, 'packages', 'shared', 'src', 'data', 'vault');
const TRANS_DIR = path.join(ROOT, 'packages', 'shared', 'src', 'data', 'translations');
const GLOSSARY_PATH = path.join(ROOT, 'packages', 'shared', 'src', 'data', 'glossary-lock.json');
const SHARD_BASE =
  'C:\\Users\\Acer\\.gemini\\antigravity\\brain\\dee33ca8-8211-48b8-b73d-9681c717f163\\scratch\\translation-shards\\pack-a';
const SHARDS_OUT_DIR = path.join(SHARD_BASE, 'out');
const URL_MAPS_DIR = path.join(SHARD_BASE, 'url-maps');

const COLLECTIONS = ['exhibitions', 'artworks', 'books', 'pages', 'articles'];

function readJson(p, fb) {
  if (!fs.existsSync(p)) return fb;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function restoreUrls(value, urlMap = {}) {
  if (typeof value !== 'string') return value;
  return value.replace(/<<(?:I|U)\d+>>/g, (tok) => (urlMap[tok] !== undefined ? urlMap[tok] : tok));
}

function mergeOutputs() {
  if (!fs.existsSync(SHARDS_OUT_DIR)) return 0;
  const outFiles = fs.readdirSync(SHARDS_OUT_DIR).filter((f) => f.endsWith('.json')).sort();
  if (outFiles.length === 0) return 0;

  const stores = {};
  const urlMaps = {};
  for (const col of COLLECTIONS) {
    stores[col] = readJson(path.join(TRANS_DIR, `${col}.json`), {});
    urlMaps[col] = readJson(path.join(URL_MAPS_DIR, `${col}.json`), {});
  }

  // Group records by (collection, slug, lang) so multi-part records reassemble in exact partIndex order
  const grouped = new Map();
  for (const file of outFiles) {
    const records = readJson(path.join(SHARDS_OUT_DIR, file), []);
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

    // Part 1 carries title, subtitle, summary/excerpt, and part 1 of splitField
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
      for (const [lc, entry] of Object.entries(langMap)) {
        localeCount++;
        for (const [field, val] of Object.entries(entry)) {
          if (typeof val !== 'string') continue;
          if (/<<(?:I|U)\d+>>/.test(val)) {
            errors.push(`${col}/${slug}[${lc}].${field}: un-restored placeholder token found`);
          }
          if (lc === 'en') {
            const cleaned = val
              .replace(/https?:\/\/[^\s)]+/g, '')
              .replace(/\bIran Human Rights Documentation Center\b/g, '')
              .replace(/\bOMID,\s*A Memorial in Defense of Human Rights in Iran\b/g, '');
            for (const usWord of usWords) {
              const re = new RegExp(`\\b${usWord}\\b`, 'i');
              if (re.test(cleaned)) {
                errors.push(
                  `${col}/${slug}[en].${field}: US spelling "${usWord}" -> should be "${spellingMap[usWord]}"`
                );
              }
            }
          }
        }
        if (!entry.title || !entry.title.trim()) {
          errors.push(`${col}/${slug}[${lc}]: empty title`);
        }
        if (vaultItem?.translations?.[0]) {
          const src = vaultItem.translations[0];
          for (const bodyField of [
            'curatorial_statement_markdown',
            'description_markdown',
            'body_markdown',
            'synopsis',
          ]) {
            if (typeof src[bodyField] === 'string' && src[bodyField].trim().length > 20) {
              if (typeof entry[bodyField] !== 'string' || entry[bodyField].trim().length < 5) {
                warnings.push(`${col}/${slug}[${lc}]: source has ${bodyField} (${src[bodyField].length} chars) but translation missing`);
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
  console.log(`Merged ${n} translated locale records from ${SHARDS_OUT_DIR}`);
}
verifyAll();
