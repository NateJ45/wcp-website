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

### Trust cluster: why-wcp 23, safety 27, reviews 21

- CAPTURE-ARTIFACT CORRECTION (lead-verified live): the agent-reported "P0 blank
  page tail" on /why-wcp at 390 is NOT real. Live at 390 the page is 21,838px with
  the footer painting at its expected offset. Full-page Playwright captures blank
  out `content-visibility:auto` regions and mid-wall masonry; recorded as a sweep
  methodology gotcha, not a site bug.
- REAL problems: the entire /reviews testimonial deck is duplicated verbatim on
  /why-wcp (same lead order, ~6 mobile viewports before the CTA) AND the two copies
  silently differ in punctuation on the same quotes (em-dash edits): poison for a
  proof surface. /why-wcp stat band says "$70 tuition from" two scrolls above the
  compare table's "$175-$200" for a 4-year-old (reads as bait). "100% Ohio licensed"
  is a filler stat (licensure is binary). 4.8-on-Google line floats in ~900px of
  empty beige at 1440.
- /reviews: hero's only CTA is OUTBOUND to Google; page terminus asks current
  parents for reviews and offers prospects nothing (no tour path on the whole route
  except the topbar pill); hero says 19 reviews, wall shows ~24 (unexplained);
  cards have no dates, no source badges, no hierarchy across 10 straight mobile
  viewports; "EXPE-RIENCE" display hyphen break at the terminus.
- /safety: leading a safety page with the Google rating is off-key (12-max and
  2-teachers should lead); the icon cards half-deliver ("no vague reassurance" but
  no background checks / CPR / allergy protocol / drill cadence / pickup
  authorization); the creek-waterfall photo captioned "EVERY CHILD KNOWN BY NAME"
  is counter-messaging on this page; the ODJFS code hides in the footer.
- KEEP: compare table (the one band doing real argumentative work), /why-wcp hero,
  full-bleed interlude, safety FAQ (only band with no eyebrow).

### Visit cluster: virtual-tour 27, contact 28, faq 26

- Architecture is right (form hoisted to slot 2, teachers as proof, contact merge
  effectively done). "The funnel shape is right; what separates this from
  top-studio credit is finish."
- FORM AUDIT: 9 fields (6 required), honest "(optional)" labels, 56px inputs; BUT
  class checkboxes ~20px (smallest targets on the most important page), no "Not
  sure yet" class option, no reassurance under submit (no reply-time promise, no
  named human; the site's best line "we are a parent-run school and we actually
  reply" lives on /contact instead of under this button), "How did you hear about
  us?" is the school's question not the parent's.
- Gallery band "A look inside our rooms": lead-verified LIVE as real (8 imgs,
  2538px tall): the blank capture was the content-visibility artifact. Real note:
  images are lazy + content-visibility; ensure static paint for print/first-render.
- Bottom CTA "Book a Tour" scrolls the user BACK UP 15 viewports to the form.
- /faq: co-op section is best-in-class content; but logistics-only: no background
  checks / CPR / ratios / K-readiness answers (the 10pm trust questions); no
  jump-nav on a 7-viewport accordion page; "GOT QUES-TIONS?" hyphen break in the
  first headline at 390.
- Dark: navy pill buttons nearly invisible on near-black (component boundary
  under 3:1); Parent Voices dark adaptation is genuinely good.

### Story cluster: co-op-life 31, about 27, a-day-at-wcp 17

- /co-op-life is the best-argued page on the site (quantified honesty: 1-3 helper
  days, Saturday clean, four named meetings; sequenced warmth → contract → lived
  experience → proof). BUT: polaroid captions don't match their photos ("PARENTS
  IN THE ROOM" under a hayride tractor, "SNACK TIME, HANDLED" under bubble-chasing):
  a trust wound; "Seven things" is a contract dressed as 7 icon cards w/ 1440
  orphan; "ATTEND MANDA-TORY MEETINGS" breaks at both widths.
- /about: "1 FULL GYMNASIUM" fake-stat cards (counting to one); the facilities band
  has ZERO photos on a site with 96; teacher bios are 130-word walls; heritage
  content here + hero eyebrow are the merge payload to protect.
- /a-day-at-wcp: the media flagship fails its job. LIVE-verified at 390: 34,788px
  ≈ 41 viewports, 91 gallery images in one undifferentiated 4/3 crop grid, 138
  reveal elements, reveal stagger delays up to 4,680ms (deep gallery rows fade in
  ~5s after entering the viewport: a real-user jank, not just a capture artifact).
  Photo-step pairing drifts (indoor wrestling pile + hallway lineup beside
  "Outside Time"; the wrestling shot shouldn't be on a marketing page). Four
  near-identical class schedule timelines in a row = ~5.5 phone viewports; collapse
  to one band + class switcher. storyTimeline band + hero are 30/40 work.

### Content + utility routes

- REAL P1 (lead-verified via 1440 tile): /404 transparent-header collision: the nav
  row prints through the headline and "PAGE NOT FOUND" collides with the logo at
  1440, light + dark (the one route with no hero band under the overlay header).
  Also live on main. Post-cutover this catches the whole Squarespace long tail:
  rebuild as the migration catch-net (solid header, inline search, four quick
  links, old-site line, one doodle: currently ZERO brand assets on the page).
- Dark-mode mobile logo variant missing SITEWIDE (navy wordmark on near-black
  topbar; desktop dark correctly swaps to white. Multiple agents + tiles).
- /news: 2 posts in a 3-col grid with a dead third; generic photo/chip/date cards
  with no scrapbook DNA; article measure ~85-90ch at 1440 (cap ~70); no article
  furniture (prev/next, related, author).
- /events: the words sell, the page lists. "Registration for 2027-28 begins at
  Open House" (the most conversion-relevant sentence on the site) is buried
  mid-paragraph; no date block; no between-events "tours run weekly" bridge; pin
  EMOJI in meta breaks the drawn-icon language.
- /search: bare input zero state (no popular searches / suggested destinations);
  hero pushes the input to the bottom of the first 390 viewport.
- /thank-you: best voice in the group ("a member of our volunteer board will get
  back to you"); CTAs point at News instead of the next funnel step (Open House).
- /newsletter-archive: bare "first issue will appear here soon" = dead-school
  signal. /enrollment-packet: solid (27) except the 6-col table crushes at 390.
  Legal trio (accessibility 28 / privacy 27 / terms 27): quietly excellent copy.
- Scores: news 23, events 26, 404 14, search 20, thank-you 24, newsletter 25,
  archive 17, article ~23, donate 26, work-with-us 25, packet 27.

## Lighthouse baseline

TBD (mobile + desktop per route; see `lh-baseline.md` artifacts)

## Benchmarks

TBD (competitor + craft agents)

## Overflow sweep

348 checks (29 routes x 6 widths x 2 themes): **zero horizontal overflows.** The
hard 320px gate holds everywhere. (sweep-results.json in the session audit
scratchpad.)

**Sweep methodology gotchas (for future audits):**
1. Full-page Playwright captures MUST scroll through the page first or lazy images
   ship blank in the shots (sweep v1 discarded for this).
2. Even after scroll-through, `content-visibility: auto` regions and long masonry
   walls can capture BLANK in full-page screenshots while rendering fine live.
   Three agent-reported "P0 blank bands" (why-wcp tail, virtual-tour gallery,
   a-day tail) were all this artifact: every P0 from a capture needs a live
   verification before it counts.

## Sitewide punch list (cross-cluster, deduped)

**Real bugs (live on main today):**
- P0 /tuition registration-timeline headings white-on-white in light mode (hotfix
  chip filed for Nathan).
- P1 /404 transparent-header collision at desktop widths.
- P1 dark-mode mobile topbar logo variant (navy-on-black) sitewide.
- P1 Great Vibes signatures never applied (loader works, CSS never references it).
- P1 reveal stagger up to 4.7s on /a-day gallery.
- P2 "OH45069" footer typo sitewide; "West Chester, OH45069" missing space.

**Systemic design debt (the redesign's actual target):**
- Eyebrow-per-section cadence: ~100% hit rate across all routes.
- Icon-card grids: 40+ instances across the site as the default container.
- Display-font mid-word hyphen breaks at 390 on at least 10 headings
  ("TYPI-CAL", "EXPE-RIENCE", "QUES-TIONS", "MANDA-TORY", "AFFORD-ABLE",
  "CO-/OP", "PRE-/K", "TWO-YEAR-/OLD", "MORN-ING", "COM-MITMENT").
- Centered-band scaffold + half-empty 1440 bands (teacher cards, timelines,
  testimonials, form column).
- Tour-first doctrine drift on every hero; three labels for one action.
- Same-testimonials duplication across routes with silent punctuation divergence.
- Class color absent from the class pages that own it (except Pre-K pricing).
- Dark mode = competent inversion, not a designed surface (muddy cream bands,
  paper artifacts go dark, tape vanishes).

**Copy debt (quota-blocked → PENDING.md rows when touched):**
- Banned constructions still live (home "MORE THAN A PRESCHOOL...").
- British spellings on twos/threes; Caregiver & Me callout pasted verbatim on two
  routes; duplicated Mrs. Erin bio; designer-signed testimonial on /classes/threes;
  19-vs-24 review count mismatch; April-Fools tuition flyer in the IG wall.
