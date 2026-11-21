# Observation Log 002 — Graphify Activation, Skills Hygiene & Complete Zero-Token WordPress Migration

- **Date:** 2026-11-21
- **Project:** Dr. Hassan Makaremi Digital Museum & Think Tank (`MAKAREMI-CORE-2026`)
- **Active Skills:** `graphify`, `makaremi-master-verification`, `makaremi-persian-lacanian-normalizer`, `makaremi-crypto-snapshot-guard`, `task-observer`

## 1. Key Engineering Patterns Preserved
1. **Project-Level Graphify Activation (47.3x Token Reduction):**
   - Installing `graphifyy` globally is NOT sufficient per project; each workspace requires `graphify antigravity install` (`.agents/rules/graphify.md` + `.agents/workflows/graphify.md`), `graphify hook install` (auto-rebuild git hooks), a strict `.graphifyignore` (excluding `scratch/`, `.agents/`, `studio-lab/`, raw `.xml` dumps, and large data vaults), and initial AST build (`graphify extract . --code-only` — 0 LLM tokens).
   - Pruning 31 duplicate/unrelated project-local skills from `.agents/skills/` (retaining only the 3 native `makaremi-*` skills while global skills remain available) eliminates context bloat on every turn.
2. **Zero-Token WordPress XML ETL Architecture (`scripts/migrate-wp-complete-vault.js`):**
   - Pure Node.js offline ETL processed all **3,172 / 3,172** XML items in **1.12 seconds** with **0 LLM tokens**.
   - **Critical Windows & API Invariant:** WordPress percent-encoded Persian slugs (up to 200 chars) break both Windows NTFS `MAX_PATH` during `next build` and `/api/markdown` regex validation (`[a-zA-Z0-9_\-\/.]`). Generating deterministic ASCII slugs (≤ 64 chars) while mapping all 1,692 legacy WordPress URLs in `legacy-redirects.json` solves both permanently.
   - **Zero Media Loss:** `[gallery ids="..."]` shortcodes in `mk_tabl` and exhibition `page` records MUST be extracted and resolved against the 1,938-item attachment manifest BEFORE stripping WordPress shortcodes (recovering 1,464 gallery canvas images + 648 exhibition photos).
   - **HTTPS Upgrade for Zod Validation:** `GeoPurchaseLinks` strictly validates `https://`; upgrading known safe legacy `http://` book store URLs (Amazon, Harmattan, Jeihoon, Ketab, Joyabook) prevented silent link dropping.
   - **RSC Listing Payload Hygiene:** Stripping `body_markdown` / `transcript_markdown` from listing page client props reduced HTML payload by 4x–6.7x while preserving full content on detail pages and `.md` twins.

## 2. Verification Evidence
- `@makaremi/shared` & `@makaremi/web` TypeScript typecheck: **0 errors**
- `next build` (Next.js 15.5.28): **859 / 859 static pages generated cleanly**
- `pnpm.cmd verify:all`: **546 / 546 PASSED, 0 FAILED** across all 7 phases (`CERTIFIED FOR PRODUCTION LAUNCH`)
- Remaining fake/sample links (`sample-*.pdf`, `sample-*-id`, hardcoded fake `.mp3`): **0**
