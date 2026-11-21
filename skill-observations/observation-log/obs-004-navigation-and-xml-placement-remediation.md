# Observation Log — Pre-Phase 4 Navigation, 4-Matrix & XML Content Placement Remediation

- **Date:** 2026-11-21
- **Scope:** Full forensic audit and remediation of Mega Menu (`Header.tsx`), 4 Matrix Portals/Grids (`page.tsx`, `Footer.tsx`, `[pillar]/page.tsx`), dead/unlinked content boxes across `/media`, `/gallery`, `/hafez`, `/about`, `/poetry`, `/books`, live `/api/search` wiring, `LanguageSwitcher` slug mapping, and 100% zero-token WordPress XML placement accuracy (`scripts/migrate-wp-complete-vault.js`).

## Root Causes Eliminated
1. **Zero UI `searchParams` readers:** All 19 query-parameterized navigation links (`?tab=`, `?genre=`, `?pillar=`, `?series=`, `?category=`, `?book=`) were previously ignored. Wired `<Suspense>`-wrapped `useSearchParams()` across `PaginatedArticlesGrid`, `BooksInteractiveCatalog`, `BookStudioAdminWorkbench`, `PaginatedVideosGrid`, `ArtworksVaultShowcase`, and new `AboutTabNavigator`.
2. **Wrong/Missing Redirects & Hidden Content:**
   - Homepage Portal 1 ("404 Articles") linked to `/psychoanalysis/articles` (120 items), hiding 284 articles → created unified `/[locale]/articles` (+ `.md` twin + sitemap entry).
   - UNESCO Paris 2009 badge linked to Pompadour 2002 exhibition; 4 badges hardcoded `/fa/`; homepage badges were non-clickable `<div>`s → fixed via `resolveBadgeHref(badge, locale)` and converted to `<Link>`.
   - Fixed 4 broken 404 targets in `STATIC_LEGACY_REDIRECTS` (`/nameyshgah-ir`, `/galerie-art`, `/lddhi-reports`, `/video`).
3. **Dead Boxes Replaced with Real XML Vault Records:** Connected all 5 `VIDEO_SERIES_CATALOG` cards (`/media`), 5 `THEMATIC_GALLERIES` cards (`/gallery`), Hafez treatises & 17 real Hafez YouTube episodes (`/hafez`), 4-part biographical documentary videos & interviews/references/conferences (`/about`), Dr. Makaremi's authentic poetry preface (`page-2673`) & fixed `"simorq"` caption bug (`/poetry`), and enriched all 4 `[pillar]` hub pages.
4. **XML Placement & Hygiene (0 LLM Tokens):**
   - Fixed Arabic Kaf (`ك`) bug in `classifyPillar()` (+20 authentic psychoanalysis articles restored to `psychoanalysis`: 120 → 140).
   - Fixed `pillar`, `genre_key`, and RTL/LTR binding direction for all 25 books.
   - Polylang-paired `artworks` (54 → 29 bilingual series, 856 deduplicated images), `exhibitions` (52+5 duplicates → 27 canonical bilingual exhibitions, 390 real photos, accurate cities/years), and `pages` (47 → 25 clean editorial pages; excluded 15 WP landing/placeholder shells while preserving 2,072 301 redirect rules).
   - Rewrote 151 legacy `makaremi.com`/`wp-admin` internal links inside migrated markdown.
5. **Global Search & Locale Switcher:** Connected `SearchModal` (with `Cmd+K`/`Ctrl+K`) to live `/api/search` (2,748 RAG chunks); fixed `/fr/psychanalyse` ↔ `/fa/psychoanalysis` mapping in `LanguageSwitcher` and article `hreflang`.

## Verification Evidence
- `node scripts/migrate-wp-complete-vault.js`: **3,172 / 3,172 reconciled (100%, 0 LLM tokens, 1.21s)**
- `pnpm.cmd typecheck`: **3 / 3 packages passed (0 errors)**
- `pnpm.cmd --filter @makaremi/web build`: **706 / 706 static pages built (0 errors)**
- Live Mega Menu + 4-Matrix + Query-Param + Redirect + Search Audit: **748 PASSED, 0 FAILED**
- `pnpm.cmd verify:all`: **546 / 546 PASSED, 0 FAILED**
