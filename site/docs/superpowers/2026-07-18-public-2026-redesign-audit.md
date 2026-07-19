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
- **Great Vibes signatures never render, for anyone (confirmed live).** The loader
  (`signature-font.ts`) works: `document.fonts` reports `Great Vibes: loaded`. But no
  CSS rule ever points `.wcp-signature` at it: the token `--font-signature` exists in
  `globals.css:258` and the component only sets `wcp-signature block text-3xl ...`
  (Quicksand). The incumbent's signature "handwritten moment" silently shipped in the
  body font. P1 craft bug and a fair symbol of the wider finding: the system was
  specced but the page never received it.
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

## Per-route catalogue (agent fan-out, verified spot-checks by lead)

Scores are /40, honest bands (most real pages 20-32). Full agent reports informed
this; only decision-relevant rows are kept here.

### Classes cluster: twos 26, threes 24, pre-k 27

- Verdict: one template stamped three times; Pre-K partially differentiates (AM/PM
  price cards are the only place class color does real work). Twos-amber and
  Threes-green appear nowhere ownable on their own pages.
- KEEP: heroes (real classroom photos on twos/pre-k), typical-day timelines, post-it
  testimonial component, scalloped CTA edge + wave footer, 4.8 chip.
- REWORK: 13-22 icon cards per page (the monoculture); teacher band is a phone card
  floating in an empty 1440 band; timeline half-empty at 1440; Threes hero photo is a
  camera-roll outtake (adult with phone, tourist shirt).
- KILL: Pre-K's second curriculum band (13 curriculum cards on one page).
- P1 content-trust: the Threes testimonial is signed by the site's own designer
  ("Nathan Nixon, Twos & Threes Parent" + footer "Designed by Nixon Creative
  Studio"). Swap for another parent.
- Systemic type bug: display headings break inside hyphenated compounds at 390
  ("TWO-YEAR-/OLD", "THREE-/YEAR-OLD?", "PRE-/K GRADUATES", "FOUR-/YEAR-OLD").
- Copy: British spellings on twos/threes ("colours", "recognising", "practising");
  the Caregiver & Me potty callout is pasted verbatim across twos AND threes;
  duplicate identical Mrs. Erin block on both pages; footer "OH45069" missing space
  sitewide; three labels for one action (Tour / Schedule a Tour / Request a tour).
- Dark: logo wordmark near-invisible on dark topbar; post-it becomes grey glass +
  floating grey tape; amber/orange icon chips go muddy.

### Money cluster: tuition 26, enroll 22

- **P0 (live on main, hotfix chip filed):** /tuition "Registration Timeline" card
  headings render white-on-white in LIGHT mode (FeatureCard `h3 text-heading` inside
  a white card inherits the navy band's flipped heading token). Verified by lead on
  390-light-t08.
- /tuition: price first paints in viewport 4 at 390 (hero claim with zero numbers →
  manifesto → 4 icon cards → table). The manifesto band ("EVERY FEE, PUBLISHED. ON
  PURPOSE.") is top-decile copy: KEEP verbatim. Table itself excellent at 1440 and
  legible stacked at 390 BUT mobile cards carry the banned border-t-4 strip; $100
  reg + $100 deposit rows repeat identically in all four cards. No "what does this
  cost ME" answer: the built calculator section is placed on NO page. 4.8 chip only
  appears 10 viewports deep. Hero CTAs Enroll+Breakdown (doctrine drift).
- /enroll: TWO contradictory 3-step sections on one page (Reach out/Tour/Paperwork
  vs Tour/Choose/Register); the /tuition fee table duplicated wholesale mid-page;
  form titled "Ask about enrolling" is the page's only action (the actual enrollment
  mechanism is never stated: say "the packet is handed to you at your tour");
  "CLEAR, AFFORD-/ABLE PRICING" and "CO-/OP" display breaks; no commit-vs-deciding
  fork. KEEP: 7-item honesty checklist, class picker (best band on either route),
  parent-volunteer cream band.
- Dark: cream bands go muddy brown; the navy "Send inquiry" pill nearly disappears
  on near-black.

## Lighthouse baseline

TBD (mobile + desktop per route; see `lh-baseline.md` artifacts)

## Benchmarks

TBD (competitor + craft agents)

## Overflow sweep

TBD (sweep-results.json; 320-1920 x light/dark)
