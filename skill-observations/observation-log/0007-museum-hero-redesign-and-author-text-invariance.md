---
id: 7
title: "Enforce zero-alteration author-text invariance during UI/copy redesign and self-hosted font pairing"
status: actioned
type: open-source
skill: [humanizer, no-ai-slop, unslop, design-doctrine, motion-dev-animations]
proposes_skill: []
target_file: ["apps/web/src/components/home/MuseumHeroSection.tsx", "apps/web/src/styles/typography.css", "apps/web/src/middleware.ts"]
siblings_checked: "design-a11y: design-doctrine, unslop, emil-design-eng, a11y-audit — applied together in homepage redesign"
area: "Editorial copy boundaries, self-hosted multilingual typography, and middleware static bypass"
date: 2026-11-21
session_context: "Approved implementation of homepage and museum hero redesign with Dr. Makaremi portrait, calligraphy ink motion, and Borromean knot"
parked_until:
resolved: 2026-11-21
resolution: "Preserved 100% verbatim author greetings from WordPress XML while applying humanizer/ux-writing only to agent-authored UI chrome; replaced 0KB font stubs with self-hosted Amiri, Cormorant Garamond, Inter, and JetBrains Mono; added /images bypass in middleware.ts."
reference: "apps/web/src/app/[locale]/page.tsx"
commands_verified: "pnpm.cmd typecheck (0 errors), next build (708/708 static pages), Hero live audit (39/39 PASSED), WCAG contrast (16/16 PASSED), pnpm.cmd verify:all (546/546 PASSED)"
next_actor: "maintainer"
---

**Issue:** When running `humanizer` or `no-ai-slop` during a cultural/scholarly website redesign, an agent may inadvertently paraphrase or polish the author's own authentic prose instead of restricting edits exclusively to agent-generated UI labels. Additionally, static `public/images/` assets break under locale-redirect middleware unless explicitly bypassed, and blunt CSS `!important` font overrides erase typographic hierarchy between display, literary serif, sans, and monospace roles.

**Suggested improvement:** Separate authentic author texts (verbatim-locked from source records) from agent-authored UI chrome before running any copywriting skill; audit `public/fonts/` for `0 KB` placeholders and avoid `!important` global font clobbering; always add `/images` to middleware static bypass alongside `/fonts` and `/icons`.

**Principle:** Editorial redesign polish applies strictly to interface chrome and layout rhythm — never to an author's authentic voice or verbatim texts.
