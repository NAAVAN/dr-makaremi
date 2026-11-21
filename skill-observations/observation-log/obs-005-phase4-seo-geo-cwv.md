# Observation Log: `obs-005` — Phase 4 Trilingual SEO, GEO (`is-agentic`), Sitemap, Broken Links & Core Web Vitals

- **Date:** 2026-11-21
- **Phase:** Phase 4 (Master Skills Audit & Execution Plan)
- **Skills Applied:** `seo`, `meta-tags-optimizer`, `is-agentic`, `broken-link-checker`, `performance`, `graphify`, `makaremi-master-verification`
- **Verification Status:** `437 / 437` Phase 4 live audit PASSED • `546 / 546` `verify:all` PASSED • `0` broken links across `279` unique internal links and `730` `/llms.txt` URLs

## Key Engineering Insights & Production Catches

1. **Markdown Twin Rate-Limit Bottleneck for AI Crawlers (Critical Production Catch):**
   - When crawling all `730` Markdown twin URLs published in `/llms.txt`, `apps/web/src/app/api/markdown/route.ts` previously enforced `100 req / 60s` per IP, returning `429 Too Many Requests` starting around URL #101 and breaking full-corpus ingestion by AI crawlers (`GPTBot`, `ClaudeBot`, `PerplexityBot`).
   - **Resolution:** Raised the read-only Markdown twin bucket to `1200 req / 60s` (complemented by edge `Cache-Control`), preserving strict Zod path-traversal validation (`400 Bad Request`) while achieving `730 / 730` `200 OK` on `/llms.txt` ingestion.

2. **`/llms.txt` Stale Routes & Trailing Punctuation:**
   - Replaced 290+ legacy broken routes (`/fr/a-propos.md`, `/fa/speeches/*`, `/fa/exhibitions/*`) with canonical `/fr/about.md`, `/fa/human-rights/speeches/*.md`, `/fa/media/videos/*.md`, and `/fa/art/exhibitions/*.md`, and formatted `llms-full.txt` as a proper Markdown link so naive URL extractors do not capture a trailing period.

3. **Zero Render-Blocking External CDN Fonts (LCP + Iran Anti-Censorship):**
   - Eliminated 3 duplicate render-blocking external CSS requests (`fonts.googleapis.com` + 2x `cdn.jsdelivr.net`), replacing them with the verified self-hosted `108.5 KB` `Vazirmatn-Variable.woff2` with `<link rel="preload" as="font" crossOrigin="anonymous" />` and `Cache-Control: public, max-age=31536000, immutable`.
   - Verified local production median TTFB dropped to `9.8 ms` across 26 routes.

4. **Universal Trilingual Metadata & Rich Schema.org Parity:**
   - Consolidated all 24 App Router pages onto `buildTrilingualMetadata()` (`canonical`, reciprocal `fa-IR`/`fr-FR`/`en-US`/`x-default` `hreflang`, localized `/fr/psychanalyse`, `OpenGraph`, `Twitter Card`, `/opengraph-image`, explicit `robots` with `noindex, nofollow` on `/curation-studio` and `/offline`).
   - Added `ExhibitionEvent`, `VideoObject`, `CreativeWork` (poems), and `BreadcrumbList` JSON-LD to all remaining detail templates.

## Metrics Snapshot
- `next build`: `708 / 708` static pages compiled cleanly
- `/sitemap.xml`: `3,186` URLs (`100 / 100` sampled `200 OK`)
- `/llms.txt`: `730 / 730` URLs `200 OK`
- Live Broken Link Checker: `279 / 279` unique internal links `< 400` (`0` broken)
- `verify:all`: `546 / 546 PASSED` (`14.18s`)
- `graphify-out/`: `1,418` nodes, `3,103` edges, `98` communities
