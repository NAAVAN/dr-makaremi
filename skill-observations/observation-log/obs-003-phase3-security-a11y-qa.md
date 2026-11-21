# Observation Log 003 — Phase 3 Security, WCAG 2.2 AA & Break-UI Hardening

- **Date:** 2026-11-21
- **Skills Applied:** `vibe-check`, `a11y-audit`, `design-qa`, `break-ui`, `makaremi-master-verification`, `graphify`

## Key Takeaways
1. **Always Measure Contrast Programmatically:** Static inspection of `tokens.css` using exact WCAG relative luminance caught a P0 dark-mode failure (`#FFFFFF` on `#14B8A6` = `2.49:1`) and a P1 light-mode sunken failure (`#78716C` on `#F4F0E8` = `4.22:1`). Fixing both achieved `30 / 30` WCAG 2.2 AA/AAA pass.
2. **Check Root Monorepo `package.json` for Orphaned Vulnerable Pins:** Even when `apps/web` ran `next@15.5.28`, root `package.json` still pinned `next@15.1.0`, causing 5 CRITICAL and 13+ HIGH `pnpm audit` alerts. Aligning root & web to `^15.5.28` eliminated 100% of Critical CVEs.
3. **Audit Every New Mutation Route for `checkRateLimit` + Payload Cap + Prototype Pollution + Zod:** `/api/curation-manifest` had been left open without rate limits, Zod validation, or size caps; hardened and live-tested (`HTTP 400` on `__proto__`).
4. **Always Verify `target="_blank"` Does Not Already Have `rel="noreferrer"` Before Patching:** Prevented duplicate JSX `rel` attributes while upgrading all 17 links to `rel="noopener noreferrer"`.
5. **Verification Score:** `546 / 546 PASSED` across all 7 suites, `859 / 859` static pages built cleanly.
