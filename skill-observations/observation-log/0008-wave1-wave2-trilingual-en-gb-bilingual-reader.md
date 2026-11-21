# Observation 0008 — Wave 1 Trilingual British English (`en-GB`) Localization & Wave 2 Gold-Standard Bilingual Reader

- **Date:** 2026-11-22
- **Status:** `actioned`
- **Primary Skills / Scope:** `makaremi-master-verification`, `seo`, `hreflang-international`, `a11y-audit`, `design-doctrine`, `performance`
- **Scope Excluded by User Directive:** `curation-studio` and `components/curation/*` intentionally frozen (`0` files modified) pending post-translation Persian-only redesign.

## What Changed

1. **Wave 1 — Full Trilingual UI & British English (`en-GB`) Enforcement:**
   - Upgraded `hreflang="en-GB"`, `og:locale="en_GB"`, and all 7 `sitemap.ts` alternate blocks from `en-US` to `en-GB`.
   - Created canonical `packages/shared/src/data/glossary-lock.json` (locked Lacanian & cultural terms + British English `-ise/-our/-re/defence/catalogue` spelling map) and zero-token auditor `scripts/audit-i18n-coverage.mjs`.
   - Eliminated French UI fallback leaks across `/en` public pages (`about`, `hafez`, `[pillar]`, `gallery`, `media`, `poetry`, `articles`, `books`, `glossary`, `system-status`, `book-studio`, `offline`, and all detail routes) and shared interactive components (`Book3DShowcase`, `BookSampleReader`, `BooksInteractiveCatalog`, `BookMetadataCard`, `GeoPurchaseLinks`, `AuthorAudioPlayer`, `PaginatedArticlesGrid`, `PaginatedVideosGrid`, `PaginatedPoemsGrid`, `ArtworksVaultShowcase`, `IIIFDeepZoomViewer`, `ResilientMediaPlayer`, `GlossaryExplorer`, `SearchModal`, `PwaOfflineBar`, `MirrorSwitcher`, `IntegrityAuditModal`, `ContentIntegrityBadge`, `SystemStatusDashboard`, `CostBreakdownTable`, `RoadmapScheduleTable`, `BookStudioAdminWorkbench`, `Header`, `Footer`, `LanguageSwitcher`, `ThemeToggle`).
   - Reduced public 2-way ternaries from `380` to `27` (remaining are purely numeric/proper-noun/CSS-direction expressions with `0` French-to-English UI leaks).

2. **Wave 2 — In-Box Archive Translation Switch & 3-Mode Scholarly Bilingual Reader:**
   - Added `apps/web/src/lib/work-language.ts` (deterministic script + metadata language detector, `resolveWorkTranslation()`).
   - Added `apps/web/src/lib/translations-store.ts` (read-only overlay store keeping original Vault JSON files 100% untouched; seeded with flagship trilingual works).
   - Built `WorkLanguageBar.tsx` (in-card provenance badge + one-click translate/original toggle; renders `null` when `originalLang === siteLocale`) wired into Articles, Poems, Videos, and Books grids.
   - Built RSC-safe `BilingualWorkReader.tsx` (Loeb / Gallimard 3-mode switcher: **Original [Always Default, native `dir`/`lang`]** · **Site-Language Translation** · **Side-by-Side Bilingual**) wired across `ArticleReader`, `PoetryArtworkSync`, `books/[slug]`, `about/[slug]`, `art/exhibitions/[slug]`, `media/videos/[slug]`, and `human-rights/speeches/[slug]`.
   - **SSR + Core Web Vitals Bonus Fix:** Isolated `useSearchParams()` inside `<Suspense fallback={null}>` sync children in `PaginatedArticlesGrid`, `PaginatedVideosGrid`, and `BooksInteractiveCatalog`, plus rendered full 3-locale buttons in `LanguageSwitcher` fallback — eliminating SSR loading-skeleton flashes and CLS.

## Verification Evidence

- `pnpm.cmd typecheck`: **3 / 3 PASSED** (`0` TS errors).
- `pnpm.cmd --filter @makaremi/web build`: **708 / 708 static pages generated**.
- Live Wave 1 + Wave 2 Production Audit (`verify-wave1-wave2.mjs`): **88 / 88 PASSED** (verified `en-GB` SEO/sitemap, zero French leaks on 13 `/en` routes, strict single `<h1>`, cross-language 3-mode reader, native-match zero-clutter hide, SSR `WorkLanguageBar`, verbatim author greetings untouched).
- Full Master Verification Suite (`pnpm.cmd verify:all`): **546 / 546 PASSED** (`0` regressions across all 7 phases).
