---
name: makaremi-persian-lacanian-normalizer
description: >-
  Use this skill whenever creating, editing, importing, or auditing Persian (Farsi)
  and French scholarly content, Lacanian psychoanalysis terminology, or ETL text
  pipelines in the Dr. Hassan Makaremi (MAKAREMI-CORE-2026) platform. Enforces
  Arabic-to-Persian character standardization, ZWNJ morphological rules,
  protected technical tokens (URLs, SHA-256 digests), and controlled Lacanian
  glossary equivalents.
---

# Makaremi Persian Typography & Lacanian Terminology Normalizer

## Overview
Ensures 100% typographic and terminological consistency across all Persian (`fa`), French (`fr`), and English (`en`) content in the `MAKAREMI-CORE-2026` platform, aligned with [`persian-normalizer.ts`](../../apps/web/src/lib/etl/persian-normalizer.ts) and [`lacanian-glossary.ts`](../../apps/web/src/lib/glossary/lacanian-glossary.ts).

## Workflow

### 1. Technical Token Protection (Pre-Normalization)
Before applying any character replacement or ZWNJ rules to raw text or Markdown:
- Protect all `https://...` and `http://...` URLs, email addresses, Markdown links `[label](url)`, and 64-character hexadecimal `SHA-256` digests using placeholder tokens so they are never mutated.

### 2. Arabic-to-Persian Character Standardization
Replace non-standard Arabic codepoints with canonical Persian Unicode characters:
- `ي` (`\u064A`) and `ى` (`\u0649`) -> `ی` (`\u06CC`)
- `ك` (`\u0643`) -> `ک` (`\u06A9`)
- Convert straight or Latin quotes (`"..."`) around Persian text into standard Persian guillemets (`«...»`).

### 3. Zero-Width Non-Joiner (ZWNJ / `\u200c`) Rules
Enforce ZWNJ in morphological prefixes, suffixes, and clinical compounds:
- Verbal prefixes: `می‌شود`, `نمی‌تواند`, `می‌کند`
- Plural suffixes: `پژوهش‌ها`, `ساختارها`, `کتاب‌ها`
- Comparative/superlative suffixes: `بزرگ‌تر`, `عمیق‌ترین`
- Domain compounds: `روان‌کاوی`, `آسیب‌شناسی`, `ازهم‌گسستگی`, `خودآگاه`, `ناخودآگاه`
- **Exception (Strict):** Preserve Dr. Makaremi's coined clinical term **`دگرشنیدن`** (*Écouter autrement*) as a single unified token without internal space or ZWNJ split.

### 4. Controlled Lacanian Vocabulary Alignment
When authoring or translating clinical concepts across `fa`, `fr`, and `en`, enforce the canonical trilingual equivalents defined in [`lacanian-glossary.ts`](../../apps/web/src/lib/glossary/lacanian-glossary.ts):
- **`دگرشنیدن`** <-> *Écouter autrement* <-> *Listening Differently*
- **`عملیات نام پدر`** <-> *Forclusion du Nom-du-Père* <-> *Foreclosure of the Name-of-the-Father*
- **`مفهوم سرحد (حالت مرزی)`** <-> *État limite* <-> *Borderline State*
- **`سرزمین فرهنگی ایران`** <-> *Terre culturelle de l'Iran* <-> *Cultural Land of Iran*
- **`ژوئیسانس (تمتع)`** <-> *Jouissance* <-> *Jouissance*

### 5. Validation
Run the Phase 5 verification suite to confirm zero regressions in Persian normalization and glossary linking:
```powershell
node infra/verify-phase-5.mjs
```

## Common Mistakes
- **Mutating URLs or Hashes:** Never run regex replacements for `ها` or quotes directly on raw strings containing Markdown URLs or SHA-256 hashes without token masking via `normalizePersianText()`.
- **Splitting `دگرشنیدن`:** Do not insert a space (`دگر شنیدن`) in Dr. Makaremi's signature concept.

