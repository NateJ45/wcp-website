# Public site redesign 2026 — worklog

**Branch:** `redesign/public-2026` (deploys fire only on `main`; merging is Nathan's call)
**Mission:** re-evaluate the whole public marketing site against top-tier 2026 practice.
Phones first, desktop as its own composition. Fixed: brand palette + ink shades, Captain
Comic + Quicksand, architecture, brand-lock, compliance gates, the Sanity write freeze
(everything lands in code; content restructures become queued dry-run scripts in
PENDING.md). Challengeable: the entire 2026-07-17 "Fifty-Five Septembers" incumbent.

**Method:** Phase 0 audit + direction (STOP for Nathan's approval) → Phase 1 design
system → Phase 2 route-by-route rebuild in funnel order → Phase 3 full-site sweep →
PR marked ready for review. This file is the session-to-session state; a future session
should be able to resume from the documents in this directory alone.

---

## Status

- [x] Branch `redesign/public-2026` created from main @ dbde4b0, pushed
- [x] Draft PR open: https://github.com/NateJ45/wcp-website/pull/1
- [x] Phase 0: build + serve the branch locally (http-server :4400 over dist/client)
- [x] Phase 0: route walk 320/390/768/1024/1440/1920 x light/dark: 348 checks, ZERO
      overflows. Two capture gotchas learned: (1) full-page captures must scroll
      through the page first or lazy imagery ships blank; (2) content-visibility:auto
      regions capture blank even so — every capture-P0 needs live verification
      (three were disproven live).
- [x] Phase 0: per-route critique + slop detection (detector 25 findings; lead review
      of funnel core; 6 agent clusters; snapshot persisted to .impeccable/critique/,
      site-wide 26/40)
- [x] Phase 0: Lighthouse baseline → docs/superpowers/2026-07-18-lighthouse-baseline.md
      (a11y 100 everywhere; local-lab relative numbers; lhci EPERM workaround = drive
      lighthouse CLI per-URL with own --user-data-dir)
- [x] Phase 0: benchmarks → 2026-07-18-competitor-benchmark-mobile.md +
      2026-07-18-craft-references-2026.md
- [x] Phase 0: scored audit → 2026-07-18-public-2026-redesign-audit.md
- [x] Phase 0: design brief (CONSTRUCTION PAPER) → 2026-07-18-public-2026-redesign-brief.md
- [x] Phase 0: home hero prototype → docs/superpowers/prototypes/2026-07-18-home-hero/
      hero.html (open directly, or copy into dist/client/_proto/ and serve; verified
      320/390/1440, no overflow, reduced-motion poster fallback)
- [ ] STOP: Nathan approves direction (gate reached this session; awaiting answer)
- [ ] Phase 1: design system
- [ ] Phase 2: routes (funnel order)
- [ ] Phase 3: sweep + docs sync + PR ready

## Session log

### 2026-07-18 (session 1)

Required reading done (site/CLAUDE.md, PENDING.md, PAGE_BUILDER.md, the 2026-07-17
transformation spec, both 2026-07-17 benchmark docs, memory: transformation state,
anti-AI-tells, competitive teardown, 320px reflow doctrine). Key context loaded:

- The incumbent "Fifty-Five Septembers" scrapbook direction shipped 2026-07-17 on main
  (drench heroes, five-item funnel nav, scrapbook CSS layer, parent-note testimonials,
  drenched class cards, photo strips + interludes, tuition opener, amber closing drench,
  code-computed seams). It is the incumbent to beat, not law.
- Sanity writes remain quota-blocked (402 even on API reads as of 07-17); live reads OK
  via CDN. All redesign lands in code; content restructures = queued idempotent scripts.
- Nav is code-owned right now (resolveNavigation serves src/data/nav.ts unconditionally).
- 27 prerendered public routes in tests/routes.ts; /contact and /about are slated for
  merge-and-redirect by queued Phase-1 scripts (not yet run — pages still live).
- KV write budget near cap: no new KV-writing caches for public features.
- Windows traps: pkill doesn't exist (kill by port via netstat/taskkill), astro dev
  daemonizes, local lhci can EPERM, format:check exit code over output tail.
