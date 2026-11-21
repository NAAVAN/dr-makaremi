---
id: 6
title: "Codify Universal Web Skills Playbook and close 5-phase MAKAREMI-CORE-2026 engineering cycle"
status: actioned
type: open-source
skill: [graphify, vibe-check, seo, is-agentic, broken-link-checker, performance, a11y-audit, task-observer]
proposes_skill: []
target_file: ["docs/UNIVERSAL_WEB_SKILLS_PLAYBOOK.md", "skill-observations/observation-log/INDEX.md", "skill-observations/skill-families.md"]
siblings_checked: "token-efficiency, seo-geo, security-readiness, design-a11y, makaremi-native — all sibling families mapped into skill-observations/skill-families.md and cross-referenced in docs/UNIVERSAL_WEB_SKILLS_PLAYBOOK.md"
area: "Cross-project web skill orchestration, lifecycle gating, and observation log governance"
date: 2026-11-21
session_context: "Phase 5 completion of the 5-phase Skills Audit and Execution Plan for MAKAREMI-CORE-2026"
parked_until:
resolved: 2026-11-21
resolution: "Published docs/UNIVERSAL_WEB_SKILLS_PLAYBOOK.md with 60-second bootstrap, 7-stage lifecycle skill matrix, and 7 production anti-regression guardrails synthesized from obs-001..obs-005; standardized skill-observations workspace with INDEX.md, skill-families.md, checkpoints.log, last-review-date.txt, and archive/.id-floor=6."
reference: "docs/UNIVERSAL_WEB_SKILLS_PLAYBOOK.md"
commands_verified: "graphify update . (1418 nodes, 3103 edges, 98 communities), pnpm.cmd verify:all (546/546 PASSED), Phase 4 live audit (437/437 PASSED)"
next_actor: "maintainer"
---

**Issue:** Across 297 installed system skills spanning web engineering, bioinformatics, paid advertising, mobile, and 3D CAD, starting a new web project previously risked context bloat (31 redundant/unrelated local skills copied inside `.agents/skills/`), skipped project-level `graphify` setup, and repeated avoidable production pitfalls (orphaned monorepo CVE pins, unmeasured WCAG dark-mode contrast failures, unread query-parameter navigation links, overly tight AI crawler rate limits on read-only Markdown twins, and render-blocking external CDN font stylesheets).

**Suggested improvement:** Standardize every web project on the 60-second bootstrap protocol, 7-stage lifecycle skill matrix, and 7 battle-tested anti-regression guardrails codified in `docs/UNIVERSAL_WEB_SKILLS_PLAYBOOK.md`, backed by a `task-observer v3.10.0`-compliant workspace (`skill-observations/skill-families.md`, `INDEX.md`, `checkpoints.log`, `last-review-date.txt`, and `archive/.id-floor`).

**Principle:** Treat skill hygiene and live verification gates as first-class project infrastructure: keep `.agents/skills/` strictly project-specific, build an AST-only knowledge graph before touching code, separate read-only AI/GEO discovery endpoints from mutating API rate limits, and verify every architectural claim against a live production build.
