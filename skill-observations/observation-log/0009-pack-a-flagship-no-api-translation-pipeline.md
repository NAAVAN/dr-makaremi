# Observation 0009: Pack A No-API Flagship Literary Translation Pipeline (`Model: "inherit"`, Zero `flash`, International Academic English `hreflang="en"`)

- **Date:** 2026-11-22
- **Status:** `actioned`
- **Primary Skills / Scope:** `makaremi-master-verification`, `makaremi-persian-lacanian-normalizer`, `seo`, `performance`, `task-observer`

## 1. Architectural Problem & Constraint
The user mandated a complete trilingual (`fa`, `fr`, `en`) archive expansion with **zero quality compromise** (explicitly forbidding `flash` and `flash_lite` subagents for literary/psychoanalytic translation), while keeping token overhead low, preserving Dr. Hassan Makaremi's original writings (`packages/shared/src/data/vault/*.json`) 100% read-only at `translations[0]`, freezing `curation-studio`, and unifying the English standard to **International Academic English with British/UNESCO spelling** paired with global SEO `hreflang="en"` and clean `English` UI labels.

## 2. Solution & Engineering Pattern
1. **Zero-Token URL Compression & Paragraph-Boundary Sharding (`scripts/pack-translation-shards.mjs`):**
   - Deterministically extracts long WordPress media URLs and links into `<<I1>>` / `<<U1>>` tokens before sending text to `Model: "inherit"` subagents, preventing URL hallucination and saving ~45–55% token volume without touching prose.
   - Splits oversized essays (>18k chars) along clean `\n\n` paragraph boundaries with `partIndex` / `totalParts` metadata so flagship subagents never hit output truncation.
2. **Deterministic Restoration & Zero-Token QA Gate (`scripts/verify-translations.mjs`):**
   - Reassembles multi-part chunks in strict sequential `partIndex` order, restores all URL tokens from `url-maps/*.json`, checks British/UNESCO spelling compliance against `glossary-lock.json`, and asserts `git status --porcelain packages/shared/src/data/vault/` is empty.
3. **Zero-Client-Bloat Server Overlay (`apps/web/src/lib/vault-loader.ts` + `cms.ts`):**
   - Stores Pack A translations in `packages/shared/src/data/translations/{exhibitions,artworks,books,pages,articles}.json` and merges them on the server **after** `translations[0]`.
   - Result: `First Load JS shared by all` remained at **104 kB** (`0 KB` increase) while adding **244 full-text translated locale records** across **151 works** (27 exhibitions, 29 artworks, 24 books, 24 reference pages, 47 French/English articles).
