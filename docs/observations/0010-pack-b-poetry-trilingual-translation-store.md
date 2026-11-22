# Observation 0010 — Pack B Complete Trilingual Poetry Translation Store (300 Poems, 600 Locale Records)

- **Date:** 2026-11-22
- **Scope:** Pack B of the Zero-API Flagship-Quality Translation Pipeline (`packages/shared/src/data/translations/poems.json`).
- **Metrics & Verification:**
  - Packed all **300 poems** (`240` Persian poems -> `fr` + `en`; `60` French poems -> `fa` + `en`; `3,984` source verses) into **32 shards** via `scripts/pack-translation-shards.mjs --pack=pack-b`.
  - Translated all 32/32 shards exclusively using flagship `Model: "inherit"` (`makaremi_poetry_translator`) with strict 1:1 `verses.length`, `line_index`, `hemistich_a` / `hemistich_b` presence/omission parity, and `commentary_markdown` parity.
  - Merged **600 translated poem locale records** (bringing the total store across Packs A & B to **844 translated locale records across 451 works**) with **0 warnings and 0 errors** in `node scripts/verify-translations.mjs --merge`.
  - Verified `git diff packages/shared/src/data/vault/` is completely empty (`0` bytes altered in Dr. Makaremi's original writings).
  - Kept `First Load JS shared by all` at `104 kB` (`0 KB` increase) by stripping `commentary_markdown` and slicing `verses.slice(0, 2)` on the `/[locale]/poetry` listing payload and fixing original-language filtering in `PaginatedPoemsGrid.tsx`.
  - Passed `106/106` live trilingual + Pack A + Pack B audit assertions (`verify-wave1-wave2.mjs`) and `546/546` master full-system verification assertions (`pnpm.cmd verify:all`).
