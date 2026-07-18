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
- [~] Phase 0: route walk at 320/390/768/1024/1440/1920, light + dark, screenshots
      (sweep v2 running; v1 discarded for a lazy-image capture artifact — full-page
      captures MUST scroll through the page first or below-fold imagery ships blank)
- [~] Phase 0: per-route critique + slop detection (detector DONE, 25 findings; own
      funnel-core review DONE → audit doc; per-route agent fan-out pending sweep)
- [ ] Phase 0: Lighthouse baseline (mobile + desktop) per route
- [ ] Phase 0: benchmarks (3 direct competitors, 3-5 out-of-category craft references)
- [ ] Phase 0: scored audit written (keep / rework / kill per element)
- [ ] Phase 0: design brief with ONE named direction + anti-reference list
- [ ] Phase 0: new home hero prototype served for preview
- [ ] STOP: Nathan approves direction
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
