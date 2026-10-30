---
name: makaremi-master-verification
description: >-
  Use this skill whenever adding new pages, modifying UI components, changing
  routing/middleware, updating SEO/AEO metadata, or preparing a build in the
  Dr. Hassan Makaremi (MAKAREMI-CORE-2026) project. Enforces the strict
  single-<h1> rule, Markdown twins (.md), HighWire/Dublin Core metadata, and
  runs the 546-assertion master verification suite.
---

# Makaremi Master Verification & Architectural Compliance Skill

## Overview
Enforces the architectural invariants across all 7 phases of `MAKAREMI-CORE-2026` and executes the 546-test master orchestrator ([`verify-all.mjs`](../../infra/verify-all.mjs)).

## Workflow

### 1. Pre-Flight Architectural Invariants Check
Before finalizing any UI or route change in `apps/web/src/app/[locale]/`:
1. **Strict Single-`<h1>` Rule:** Every rendered HTML page across `fa`, `fr`, and `en` MUST contain **exactly one `<h1>` tag**. All sub-sections, cards, modals, and AEO Key Takeaways boxes must use `<h2>` or `<h3>`.
2. **Markdown Twins (`.md`) & `<link rel="alternate" type="text/markdown">`:** Every content page must expose a corresponding `.md` route (or rewrite via `/api/markdown`) and inject `alternates.types['text/markdown']` in `generateMetadata()`.
3. **Academic Citation Metadata:** Content pages must inject sanitized (CRLF-stripped) HighWire Press (`citation_title`, `citation_author`, `citation_publication_date`, `citation_markdown_url`) and Dublin Core (`DC.title`, `DC.creator`, `DC.identifier`) tags.
4. **JSON-LD Safe Serialization:** Always serialize Schema.org `@graph` objects using `serializeSafeJsonLd()` to escape `<`, `>`, and `&` into Unicode sequences (`\u003c`, `\u003e`, `\u0026`).

### 2. Running the 546-Assertion Master Verification Suite
1. Ensure the Next.js server is listening on `http://localhost:3000`.
2. Run the master verification suite from the workspace root using `pnpm.cmd`:
   ```powershell
   pnpm.cmd verify:all
   ```
3. Confirm that all 7 phase suites pass (`546 / 546 PASSED`, `0 FAILED`):
   - Phase 1: Edge Infra, 301 Redirects & Security Headers (`39/39`)
   - Phase 2: Core Frontend, 3D Showcase, IIIF & Markdown Twins (`51/51`)
   - Phase 3: Ed25519 Cryptography, Self-Healing & Offline Survival (`53/53`)
   - Phase 4: Semantic SEO, AEO/GEO, Schema.org Graph & Metadata (`84/84`)
   - Phase 5: ETL Pipeline, Persian Normalizer, Hybrid RAG & MCP (`124/124`)
   - Phase 6: Voice Agents, Lacanian Vocabulary & 5-Channel Release (`107/107`)
   - Phase 7: Offsite Backup, `/api/health`, QA Gate & System Status (`88/88`)

## Common Mistakes
- **Multiple `<h1>` Tags:** Adding an `<h1>` inside a sub-component (like a modal, header, or AEO summary box) will immediately fail Phase 2, 4, 6, and 7 verification suites.
- **Using `pnpm` or `npx` instead of `pnpm.cmd` / `npx.cmd` in Windows PowerShell:** Always invoke `.cmd` binaries in PowerShell on Windows to avoid `ExecutionPolicy` script blocks.

