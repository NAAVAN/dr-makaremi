# Observation 0011 — Pack C Complete Trilingual Video & Speech Translation Store (261 Works, 522 Locale Records)

- **Date:** 2026-11-22
- **Scope:** Pack C of the Zero-API Flagship-Quality Translation Pipeline (`packages/shared/src/data/translations/videos.json`).
- **Metrics & Verification:**
  - Packed and translated all **261 videos & speeches** (`233` Persian -> `fr` + `en`; `28` French -> `fa` + `en`; including all `76` unabridged full-length broadcast/lecture transcripts up to 13,163 chars each and `185` metadata-only works) across **53 shards** (`videos-shard-01.json` .. `videos-shard-53.json`).
  - Executed exclusively with flagship `Model: "inherit"` (`makaremi_video_translator`).
  - Merged **522 translated video/speech locale records** into `packages/shared/src/data/translations/videos.json` (total across Packs A–C: **1,366 translated locale records across 712 works**) with **0 errors and 0 warnings** in `node scripts/verify-translations.mjs --merge`.
  - Fixed trilingual search and transcript filtering in `apps/web/src/components/archive/PaginatedVideosGrid.tsx` to search across all localized fields while anchoring `onlyTranscript` on `vid.translations[0].transcript_markdown` and preserving `transcript_markdown: available` lean payload on `/[locale]/media`.
  - Verified `git status --porcelain packages/shared/src/data/vault/` is empty (`0` bytes altered in immutable original texts).
  - Pre-packed **Pack D** (`196` shards covering all `356` Persian articles in `vault/articles.json`, `0` LLM tokens) via `node scripts/pack-translation-shards.mjs --pack=pack-d`.
