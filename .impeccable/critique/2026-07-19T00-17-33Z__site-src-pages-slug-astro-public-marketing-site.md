---
target: public marketing site (all routes)
total_score: 26
p0_count: 1
p1_count: 5
timestamp: 2026-07-19T00-17-33Z
slug: site-src-pages-slug-astro-public-marketing-site
---
# Critique: the whole PUBLIC marketing site (28 routes + 404), 2026-07-18

Run during Phase 0 of `redesign/public-2026`. Method: two independent assessments
per the critique flow — (A) design review: lead review of funnel-core routes + six
parallel reviewer agents over full-page tiles at 320-1920, light+dark; (B)
deterministic detector over `src/components`, `src/pages`, `src/styles` (25
findings) + live browser verification of every capture-suspected P0. Full evidence:
`site/docs/superpowers/2026-07-18-public-2026-redesign-audit.md`.

## Design Health Score (site-wide, averaged judgment, not per-route)

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Forms give no post-submit expectation ("we actually reply" lives on the wrong page); availability badges dormant (sheet unfilled) |
| 2 | Match System / Real World | 4 | Copy voice is the site's best asset; parent-language throughout |
| 3 | User Control and Freedom | 3 | /reviews dead-ends prospects off-site; bottom CTAs send users 15 viewports back up to forms |
| 4 | Consistency and Standards | 2 | Three labels for one tour action; hero CTAs contradict the header doctrine on every route; same testimonials diverge in punctuation across pages |
| 5 | Error Prevention | 3 | Forms honest with optional markers; but class checkboxes lack "not sure yet" |
| 6 | Recognition Rather Than Recall | 3 | Funnel nav is good; FAQ has no jump-nav; tuition all-in cost must be self-assembled |
| 7 | Flexibility / Efficiency | 2 | No mid-page tour affordance on 12-40-viewport mobile pages; no jump anchors; calculator built but unplaced |
| 8 | Aesthetic & Minimalist | 2 | Eyebrow-per-section, 40+ icon-card grids, stat-box template, centered scaffold: the middle of every page is filler furniture |
| 9 | Error Recovery | 1 | 404 is broken at desktop (header prints through headline), recovers nothing, zero brand |
| 10 | Help & Documentation | 3 | FAQ answers logistics well but ducks trust questions (checks, CPR, ratios) |
| **Total** | | **26/40** | Acceptable: right register, wrong grammar, uneven finish |

Per-route: co-op-life 31, contact 28, accessibility 28, pre-k/safety/about/packet 27,
virtual-tour 27, twos/tuition/donate/events 26, newsletter 25, threes/thank-you 24,
why-wcp/news/article 23, enroll 22, reviews 21, search 20, archive 17, a-day 17,
404 14.

## Anti-patterns verdict

**LLM assessment:** the middle 60% of every route would be read as AI-generated:
eyebrow-kicker above ~every section (restyled but metronomic), 40+ identical
icon-card grids, a hero-metric stat band, centered-everything scaffolding, and
uniform reveal staggers (40 on home; 4.7s cumulative on the a-day gallery). The
edges fight back and win locally: drenched class cards, parent-note testimonials,
scallop/trim seams, doodle drench, real photography. "A real brand's chrome wrapped
around generated filler."

**Deterministic scan:** 25 findings: real ones are border-t-4/l-4 strip remnants
(TuitionTable mobile, AnnouncementModal, TabsSection, blockquotes), bounce easing
in `.wcp-pop`; broken-image/em-dash hits are false positives (dynamic Astro attrs,
code comments).

**Browser evidence:** live-verified (overlays not injected; static-dist workflow):
white-on-white card headings on /tuition (P0, light mode), 404 header collision at
1440 (P1), Great Vibes signature never applied despite loading (P1), dark-mobile
logo variant missing (P1). Three capture-suspected "blank band" P0s DISPROVEN live
(full-page-capture artifact of content-visibility:auto).

## Priority issues

1. **[P0] /tuition registration-timeline headings invisible in light mode** — token
   inheritance on navy bands. Hotfix chip filed for main.
2. **[P1] The page grammar is the AI tell** (eyebrow cadence + icon-card
   monoculture + stat boxes + centered bands): fix is compositional, not cosmetic:
   the redesign brief ("Construction Paper").
3. **[P1] Conversion doctrine drift**: every hero's primary CTA fights the
   tour-first header doctrine; no mid-page tour affordance on very long mobile
   pages; /reviews exports prospects to Google.
4. **[P1] Display-type craft**: mid-word hyphen breaks on 10+ Captain Comic
   headings at 390; orphaned articles; no balance/pretty discipline; signatures in
   body font.
5. **[P1] 404 broken at desktop** + recovers nothing, weeks before the DNS cutover
   sends the whole Squarespace long tail to it.

## Persona red flags

- **Casey (distracted mobile parent):** home is 18 viewports, a-day is 41; after
  the header scrolls away the next tour affordance is the page bottom; class
  checkboxes ~20px on the tour form; no "not sure yet" option.
- **Jordan (first-time preschool parent):** /faq and /safety never answer
  background checks/CPR/ratios; enrollment mechanism never stated ("send in the
  form": where?); two contradictory step lists on /enroll.
- **Riley (stress tester):** same quotes with different punctuation on two routes;
  19 vs 24 review count; $70 stat two scrolls above $175-$200 pricing; designer's
  own testimonial on /classes/threes; April-Fools tuition flyer in the IG wall.

## Minor observations

OH45069 footer typo sitewide; British spellings on twos/threes; duplicated
Mrs. Erin bio; pin emoji on /events; "1 FULL GYMNASIUM" counting-to-one stat cards
on /about; polaroid captions mismatched to photos on /co-op-life; wrestling-pile
photo on a-day; grey-rectangle tape on the home polaroid.

## Questions to consider

- What if the tour invitation were pinned to every sheet (sticky, one tap) instead
  of waiting at the bottom of every page?
- What would the tuition page look like if the table WERE the hero?
- If the site is a scrapbook, why does the composition never once break the grid
  the way a real scrapbook page does?
