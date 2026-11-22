#!/usr/bin/env node
/**
 * Automated Trilingual i18n & International English (hreflang="en", British/UNESCO Spelling) Coverage Auditor
 * Runs with 0 LLM tokens over apps/web/src (excluding admin-only curation-studio per user spec).
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'apps/web/src');
const glossaryLock = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'packages/shared/src/data/glossary-lock.json'), 'utf8')
);
const usSpellings = Object.keys(glossaryLock.british_english_rules.spelling_map);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'curation' || e.name === 'curation-studio') continue;
      walk(full, out);
    } else if (/\.tsx?$/.test(e.name)) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(root);
const usSpellingHits = [];
const twoWayByFile = [];
let twoWayTernaries = 0;

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const rel = path.relative(root, f).replace(/\\/g, '/');

  // Count remaining two-way `isFa ? ... : ...` ternaries in public UI (excluding Icon/dir/RTL layout ternaries)
  const matches = src.match(/isFa\s*\?\s*['"`][^'"`]+['"`]\s*:\s*['"`][^'"`]+['"`]/g) || [];
  if (matches.length > 0) {
    twoWayTernaries += matches.length;
    twoWayByFile.push({ rel, count: matches.length });
  }

  // Extract string literals only on a per-line basis so code identifiers and comments aren't false positives
  const stringLiterals = src.match(/(?:'[^'\n]{4,}'|"[^"\n]{4,}"|`[^`\n]{4,}`)/g) || [];
  const prose = stringLiterals
    .filter(
      (s) =>
        !s.includes('smooth') &&
        !s.includes('--color') &&
        !s.includes('http') &&
        s !== "'Organization'" &&
        s !== '"Organization"'
    )
    .join('\n');

  // Check for American-English spellings inside en-GB UI strings
  for (const usWord of usSpellings) {
    if (['color', 'colors', 'center', 'program', 'dialog'].includes(usWord)) continue;
    const re = new RegExp(`\\b${usWord}\\b`, 'i');
    if (re.test(prose)) {
      usSpellingHits.push(
        `${rel}: contains US spelling "${usWord}" -> "${glossaryLock.british_english_rules.spelling_map[usWord]}"`
      );
    }
  }
}

twoWayByFile.sort((a, b) => b.count - a.count);

console.log('=== I18N & INTERNATIONAL ENGLISH (hreflang="en" / British-UNESCO Spelling) COVERAGE REPORT ===');
console.log(`Public TSX/TS files scanned (excl. curation-studio): ${files.length}`);
console.log(`Remaining 2-way ternaries: ${twoWayTernaries}`);
if (twoWayByFile.length) {
  console.log('Top files with 2-way ternaries:');
  twoWayByFile.slice(0, 35).forEach((item) => console.log(`  - ${item.rel}: ${item.count}`));
}
console.log(`US-English spelling alerts (UI prose): ${usSpellingHits.length}`);
if (usSpellingHits.length) {
  usSpellingHits.slice(0, 30).forEach((h) => console.log('  - ' + h));
}
