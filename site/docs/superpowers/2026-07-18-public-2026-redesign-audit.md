# Public site redesign 2026: Phase 0 audit

**Date started:** 2026-07-18 · **Branch:** `redesign/public-2026` · **Status:** IN PROGRESS
**Method:** full-page captures of all 28 public routes + 404 at 320/390/768/1024/1440/1920,
light + dark (Playwright against the branch build, lazy-images forced, reduced-motion
stills; motion judged live separately). Impeccable slop detector over `src/`. Lighthouse
mobile + desktop per route as the performance baseline. Benchmarks: 3 direct competitors
+ 4-5 out-of-category 2026 craft references (agents, phones-first). Incumbent under
judgment: the 2026-07-17 "Fifty-Five Septembers" scrapbook direction.

## Verdict summary (filled at the end)

TBD

## The deterministic scan (impeccable detector)

25 findings over `src/components`, `src/pages`, `src/styles`. Public-relevant, verified:

| Finding | Where | Verdict |
| --- | --- | --- |
| `border-t-4` strip on mobile tuition cards | `TuitionTable.astro:37` | REAL. The strip purge (Workstream C) missed it. |
| `border-t-4` on the announcement modal | `AnnouncementModal.astro:69` | REAL. Same idiom. |
| Thick border strip | `TabsSection.astro` | REAL (active-tab underline family; verify in rework). |
| `border-l-4` amber blockquote | `PostArticle.astro:78`, `newsletter/[slug].astro:79` | Half-real: classic blockquote convention, but off-register; paper pull-quote treatment would be ours. |
| Bounce easing `cubic-bezier(0.34,1.56,0.64,1)` | `globals.css` `.wcp-pop` | REAL vs the "no bounce/elastic" motion rule. Motion doctrine decides in Phase 1. |
| `transition: width` | `globals.css` hub rail | HUB, out of scope. |
| broken-image / em-dash hits | various | False positives: dynamic Astro `src={...}` attrs; em-dashes in code comments (exempt). |

## Route walk: confirmed findings (own review, funnel core)

### Sitewide grammar (the systemic finding)

Every route composes the same way: `[navy drench hero, centered or left text]` →
repeated `[eyebrow tick + centered Captain Comic heading + centered subtext + content]`
bands → amber closing CTA. The scrapbook language shipped 2026-07-17 lives inside
components (parent-note testimonials, polaroid hero frame, doodle drench, drenched class
cards) but the PAGE grammar is still the centered-band template underneath, and three
banned idioms survive at composition level:

1. **Eyebrow-per-section cadence.** The eyebrow was restyled (crayon tick, natural case)
   but still appears above nearly every section heading, always centered. A restyled
   scaffold is still the scaffold.
2. **Identical icon-card grids everywhere.** Home ("A different kind of preschool", 6
   lucide-chip cards), /tuition ("The co-op model makes it possible", 4), /enroll
   ("Enrolling takes three steps", 3)... On mobile each grid is 2-3 viewports of
   near-identical white cards. The single loudest AI tell on the site.
3. **The stat band = hero-metric template.** 4 translucent navy boxes (55+/$70/12/4),
   misaligned heights, $70 duplicated from the class cards on the same page.

### Conversion doctrine drift (funnel)

- Home hero: primary CTA is **Enroll Your Child**, secondary Schedule a Tour, while the
  header CTA is Schedule a Tour. /tuition hero: primary **Enroll Now**. /enroll hero:
  **Call** + **Email**, no tour. The tour-first doctrine holds in the header chrome only;
  every hero undercuts it.
- The in-body tour links still target /enroll (content layer frozen behind the quota;
  scripts queued). The code layer can and should finish the job doctrinally.
- No persistent mobile tour affordance below the fold: after the header scrolls away
  (compact bar appears on desktop; phone keeps a top bar) the thumb-path to a tour is
  the amber closer at page bottom, up to ~18 viewports away on home.

### Typography and craft

- Hero headline rag at 390 AND 1440: "A / FRONT-ROW SEAT / TO WHO / THEY'LL BECOME."
  (orphaned article). Section headings break badly: "MORE THAN A / PRESCHOOL. A /
  COMMUNITY THAT / GROWS WITH YOU.", "WHAT DOES A TYPI-CAL DAY LOOK LIKE?" (mid-word
  hyphen break in display font at 390). No `text-wrap: balance`/`pretty` discipline.
- The polaroid "tape" renders as a flat grey rectangle: reads as an unstyled div. The
  marquee scrapbook element misses its own metaphor.
- Class cards (drench): the strongest, most ownable band on the site, but internal
  alignment is ragged (price wraps differently per card, CTA widths jump).
- Great Vibes signatures did not render in captures (plain Quicksand shown). Verify
  `signature-font.ts` fires on production build; if it does, timing still means most
  visitors read the fallback first.
- Testimonial parent notes: right register, correct anti-slop direction. Keep.
- Interlude band (unscrimmed photo + one caption): works, elite move, keep and extend.
- IG wall: authentic (real flyers/photos) but uncurated: includes an April-Fools fake
  "tuition announcement" graphic that a price-scanning parent could misread.

### Page pacing (mobile)

- Home @390 ≈ 15,300px ≈ 18 viewports; first viewport is text-only navy (the polaroid
  is below the fold, so the warmth asset misses the first impression).
- /tuition: the moat (the actual published table) sits below the opener + a 4-card
  icon-grid explainer: the payoff is ~4 viewports deep on the money page.
- Dead band: ~0.6 viewport of empty white after home testimonials.

## Per-route catalogue (agent fan-out results)

TBD

## Lighthouse baseline

TBD (mobile + desktop per route; see `lh-baseline.md` artifacts)

## Benchmarks

TBD (competitor + craft agents)

## Overflow sweep

TBD (sweep-results.json; 320-1920 x light/dark)
