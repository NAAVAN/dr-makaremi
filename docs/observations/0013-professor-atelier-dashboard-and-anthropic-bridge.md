# Observation 0013: Professor Unified Atelier Workspace & Permanent Dashboard (Anthropic-Ready)

- **Date:** 2026-11-22
- **Routes:** `/[locale]/dashboard` and `/[locale]/curation-studio` (`noIndex: true`, disallowed in `robots.ts`)
- **Security Gate:** `CURATION_ADMIN_SECRET` / `MAKAREMI_PROFESSOR_PIN` enforced from this phase onward via `apps/web/src/lib/studio/auth.ts` (`HttpOnly` HMAC-SHA256 cookie session + `x-curation-secret` header support, rate-limited at 10 attempts/min).

## Delivered Capabilities
1. **Museum-Sanctuary Minimalist Shell (`StudioDashboardShell`):** Uses DTCG tokens (`tokens.css`), `lucide-react` iconography (zero emoji), custom keyboard-accessible `AccessibleListbox` (zero native `<select>`), and responsive font comfort controls (`۱۳/۱۵/۱۷pt`).
2. **4-Step Work Creator Wizard (`WorkCreatorWizard`):**
   - Selectable content classification (`StudioWorkType` + `PILLARS_CONFIG` + sub-category) & explicit original language (`FA`/`FR`/`EN`) with live script-mismatch assist.
   - Optional side-by-side entry for pre-existing translations in the other 2 languages (including `hemistich_a`/`hemistich_b` alignment for poems).
   - Client & Server Media Gatekeeper (`apps/web/src/lib/studio/media-gatekeeper.ts`): auto-converts raster images to stripped `WebP` (`88%–90%` quality) with `magic bytes` verification server-side and `normalizePersianText()` text normalisation. Every upload slot renders allowed formats, size cap, and preferred standard directly inside `StandardUploadDropzone`.
   - Optional plain-language SEO prompts with one-click suggestion generator.
   - Per-item persistent auto-save in browser `IndexedDB` (`idb-keyval`) + `/api/studio/drafts` server backup.
3. **Batch Final Save + Anthropic Claude Future Adapter (`apps/web/src/lib/ai/provider-adapter.ts`):**
   - Currently operates in `manual_antigravity_queue` mode cleanly without paid API keys.
   - Pre-wired for **Anthropic Claude (`claude-sonnet-4-5`)** via `.env` (`MAKAREMI_AI_PROVIDER=anthropic`, `ANTHROPIC_API_KEY`, `MAKAREMI_AI_AUTO_TRANSLATE=true`), activating both instant Glossary-Locked trilingual translation and Claude-powered `/api/rag` Assistant synthesis upon handoff.
4. **Archive Enricher (`ArchiveEnricherPanel`):** Allows Dr. Makaremi to search all `1,071` archive entries (`1,068` vault works + supplemental works) and attach supplementary notes, links, PDFs, or 3D book covers non-destructively into `packages/shared/src/data/curator-overlays/work-enrichments.json` with `Ed25519` canonical signatures (`packages/shared/src/data/vault/*.json` remains 0 bytes changed).
5. **Translation Control Room (`TranslationControlRoom`):** Paginated browser & side-by-side editor across all `1,071` works (`FA`/`FR`/`EN`), displaying authentic original language and writing verified updates directly into `packages/shared/src/data/translations/*.json` with instant server cache invalidation (`invalidateCmsCollectionsCache`) and `revalidatePath`.

## Verification Snapshot
- `pnpm.cmd typecheck`: `3/3` passed
- `pnpm.cmd --filter @makaremi/web build`: `718/718` static pages, `First Load JS shared by all: 104 kB`
- `verify-studio-dashboard.mjs`: `44/44` passed
- `verify-wave1-wave2.mjs`: `124/124` passed
- `pnpm.cmd verify:all`: `546/546` passed (`0` regressions)
- `audit-i18n-coverage.mjs`: `153` public files scanned, `0` US-English UI alerts
