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
- [x] STOP: Nathan APPROVED all four questions 2026-07-18 ("1. approve 2. approve 3. approve 4. approve"): direction (Construction Paper), hero recomposition,
      tour-slots as Phase 3 human task, Threes testimonial swap on quota return.
- [~] Phase 1: design system (in progress)
  - [x] Type discipline: public `hyphens:none` on display type + `text-wrap:pretty`
        prose; `src/lib/typography.ts` displayTitleHtml() (escape + glue hyphen
        compounds ≤14 chars) applied in SectionHeader + CtaBanner; 7 unit tests.
  - [x] Signature fix: `.wcp-signature`/`.wcp-annotation` now actually reference
        --font-signature (the loaded-but-never-applied Phase 0 P1).
  - [x] Artifact kit v2: tape gains torn ends + sheen (no more grey rectangle);
        `.wcp-taped-chip`, `.wcp-annotation`, `.wcp-press` (pressable CTA),
        `.wcp-proof-line` primitives.
  - [x] Dark-mode paper doctrine: prints/notes/tape are PHYSICAL OBJECTS — light
        paper in both themes, fixed inks (theme-stable islands); UI cards stay
        theme-reactive. Testimonial + TestimonialWall migrated off theme tokens.
  - [x] Motion: public `.wcp-pop` loses the elastic bezier; PhotoGallery stagger
        wraps every 6 items (was i*60ms → 4.7s tails).
  - [x] Conversion chrome: TourPill.astro (mobile floating tour CTA between hero
        and footer, IntersectionObserver, no-JS hidden, safe-area, print-hidden);
        PageHero tour-first doctrine (every hero: primary=Schedule a Tour, first
        stored non-tour action demoted to ghost, proof line "4.8 · tuition is
        public" under the buttons); dark-mobile logo variant fix in Header.
  - [x] Gate: astro check 0 errors · lint clean · format:check exit 0 · unit 182+7
        passed · build green · npm test 210 passed (smoke + axe light/dark + reflow + consent + interactions, chromium + webkit-iphone) · test:hub 58 passed
        (hub grep-verified to use none of the touched artifact classes; all other
        globals changes are .wcp-site-paper-scoped) · check:links 87 ok · live
        verify: tour-first hero + proof line on home/tuition, pill shows mid-page
        and hides at top/footer, Great Vibes signatures render, notes stay light
        paper in dark, dark mobile logo white, hyphens:none computed, no overflow.
  - GOTCHA (now in CLAUDE.md): a stale daemonized astro dev on 4321 absorbs the
    Playwright webServer via reuseExistingServer and the whole suite runs against
    the WRONG server (8 phantom consent failures). Check the port first.
- [~] Phase 2: routes (funnel order) — systemic moves landed first:
  - [x] Home hero recomposition (commit fb2a851): taped-chip eyebrow, calibrated
        display clamp per width (article folds into the underlined accent — no
        more orphan "A"; 3 lines at 390/1440, 0 overflow 320-1440), wider text
        column, print with both corner tapes + 2deg tilt taped OVER the hero's
        own cream sheet-edge on desktop (overlap contained in-component).
  - [x] Section grammar (commit 4f8b707): SectionRenderer data-stype wrapper
        (public-only, display:contents) + CSS grammar layer. Taped-label header
        treatment (left axis, eyebrow→chip) for data types; caption treatment
        (eyebrow retired) for story types; cardGrid → ruled sign-up-sheet lists
        (the icon-card monoculture is gone sitewide; tuition navy-band P0
        self-retired via band-scheme inheritance, re-verified both themes);
        statBand boxes → one fact strip. CARDGRID_KEEP_CARDS doctrine hook for
        per-route card restoration (empty; fill during route walks).
  - TRAP (2nd occurrence, now habits): paper-artifact surfaces (chips) must be
    FIXED light cream — the cream token flips to #241a12 in dark and kills
    fixed inks. axe-dark caught 58 nodes; consent axe failed collaterally.
  - [x] Route-walk batch 1 (commits 5ed8413 + db3cb26): HOME chooser rows +
        heritage strip ("Fifty-five Septembers" + empty-frame tour invitation,
        stat band dropped) + IG 3-col mobile; ENROLL steps deduped tour-first,
        dup fee table + post-form re-route dropped, form retitled with the
        mechanism stated; TUITION table hoisted to viewport 1-2; FORMS "Not
        sure yet" option + 44px checkbox targets + press submit + reassurance
        under the button; strip purge (TuitionTable, AnnouncementModal); 404
        rebuilt as the migration catch-net (drench band fixes the desktop
        header collision, inline search, quick links); /search honors ?q=;
        /why-wcp: wall deduped to curated voices + link, stat band dropped
        ($70-vs-$175 bait fixed); /thank-you funnel CTAs; photo moments anchor
        by section key; co-op-life captions photo-agnostic. All stopgaps have
        PENDING.md rows. Gates green per commit.
  - [x] Route-walk batch 2 (commit e05257f): a-day's four schedule timelines →
        one synthetic "When each class meets" drenched-class-cards band
        (SECTION_INSERT_AFTER + pullAll) + gallery collage (every 7th photo
        doubles); reviews gains the tour closer (amber drench + rating slip);
        pre-k's duplicate curriculum band dropped; events between-events bridge
        note; news cards join the paper register; packet table scrolls in a
        keyboard-focusable region (axe caught the wrapper — fixed); month grids
        on why-wcp/co-op-life keep real cards; schedule timelines 2-col at lg.
  - [x] Route-walk batch 3 (commit 0799dab): class-color ownership on
        /classes/* (--page-accent(-ink): taped-chip edge + sheet icons in the
        class ink); /search zero state (popular chips over ?q= deep links);
        safety trust-answer wording registered as a Board task (no invented
        facts in code).
  - DEFERRED to post-merge polish (recorded, not blocking): teacher-band 1440
    two-column composition (TeacherCard internals), reviews per-card
    dates/source badges (content, needs quota), heritage-strip band padding
    tune, a photo-registry curation pass (wrestling-pile/creek picks).
  - [ ] Remaining walk notes for future passes: classes
        x3 (class-color ownership, teacher band 1440 composition, curriculum
        cap), visit (form reassurance under submit, "Not sure yet" class
        option, checkbox target size, gallery static grid), tuition (table
        toward viewport 1, calculator placement, fee-card strip removal),
        why-wcp (dedupe wall → curated 4 + link, $70-vs-$175 line), reviews
        (proof engine: dates/badges/pull-quotes, tour CTA at terminus), safety
        (nouns, FAQ category), a-day (collage grid + one schedule band with
        class switcher), co-op-life (caption/photo mismatches, seven-things as
        contract sheet), news/events (moment layer, small-surfaces kit), 404
        rebuild (migration catch-net + solid header fix), search zero state,
        thank-you next-step, packet table stacking, per-route
        CARDGRID_KEEP_CARDS decisions (month/tradition grids are candidates).
- [ ] Phase 3: sweep + docs sync + Lighthouse vs baseline + PR ready

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
