# Design brief: CONSTRUCTION PAPER (Fifty-Five Septembers, Act II)

**Date:** 2026-07-18 · **Branch:** `redesign/public-2026` · **Status:** DRAFT, awaiting
Nathan's Phase 0 approval. Companion documents: the Phase 0 audit, the competitor
benchmark, and the 2026 craft references (same directory, same date).

## The finding the brief answers

The 2026-07-17 "Fifty-Five Septembers" direction chose the right register and the
audit confirms it is MORE on-trend now than when it was written: 2026 commentary
names the anti-AI-slop turn (handmade texture, visible human craft, asymmetry) as the
defining consumer-design story, and the best warm consumer brands of 2026 (Duolingo,
Headspace, Tony's, Who Gives A Crap, Oatly) are all typographically loud and
kinetically quiet. Our hard gates are aligned with that bar, not fighting it.

But the register was installed at COMPONENT level while the PAGE grammar underneath
stayed the 2023 template: centered eyebrow + centered heading + centered subtext +
identical icon-card grid, repeated five or six times per route, closed by an amber
band. The emblem: the parent-note testimonials specify a Great Vibes handwritten
signature, the font loads on every page, and no CSS rule ever applies it: the
handwritten moment silently ships in the body font. The system was specced; the page
never received it. Act II is composition-level or it is nothing.

## The direction, named

**CONSTRUCTION PAPER.** One point of view: _the site is built the way a preschool
hallway is built: sheets of solid colored paper, big marker letters, real photographs
taped down, and one pinned invitation you cannot miss._

Construction paper is the most preschool-native material there is, and it dictates
every rule we need:

1. **A band is a SHEET.** Every band is a full brand color or white. Never a wash,
   never a translucent panel, never a tint-on-tint. (Today's site already owns navy,
   cream, grey, white; the sheets sharpen how they deploy: color becomes a rare,
   deliberate event with hard, honest edges: the existing scallop/trim/torn seam
   family are the scissors.)
2. **Type is the loudest thing on the sheet.** Captain Comic at display courage
   (44-56px at 390 for at most TWO moments per page), one-sentence sections,
   `text-wrap: balance` everywhere, non-breaking compounds (PRE-K, CO-OP,
   TWO-YEAR-OLD never break), and the eyebrow scaffold retired: a section earns a
   heading, not a kicker + heading + subtext sandwich.
3. **Photographs are taped down, not framed in cards.** Real prints with honest tape
   (the current grey-rectangle "tape" gets real texture + rotation), mixed-size
   collage grids (explicit aspect-ratios, CLS 0), hand-drawn arrow + caption
   annotations pointing INTO photos (aria-hidden SVG, meaning duplicated in text).
   One unscrimmed interlude per key page stays.
4. **Kinetically quiet.** Four sanctioned moves only: settle (prints drop + straighten),
   crayon scroll-draw, hover-straighten, press (CTA depresses onto its hard shadow).
   No uniform per-section reveals (home currently runs 40), no bounce curves.
5. **The invitation is pinned to every sheet.** ONE conversion doctrine, enforced in
   code: every hero's primary CTA is **Schedule a Tour**; a proof line rides under it
   ("Our tuition is public · 4.8 on Google"); a sticky mobile tour affordance keeps
   the thumb-path ≤1 tap from anywhere (inside the existing scroll-padding budget);
   every page closes with the pinned tour notice instead of a generic CTA band.

## What survives the incumbent (keep, with evidence)

- The navy doodle-drench hero surface (Nathan's explicit 07-17 call; it photographs
  the brand well: what changes is the composition on it, not the surface).
- Drenched class cards: the most ownable band on the site (alignment rework).
- Parent-note testimonials, post-its, scallop/trim/wave edge family, doodle texture.
- The tuition manifesto band ("EVERY FEE, PUBLISHED. ON PURPOSE."): top-decile copy.
- Interludes, photo strips, the amber closing warmth (recast as the pinned notice).
- The five-item funnel nav + one header CTA (competitors validate it: hold the line).
- Enroll's honesty checklist; the class picker band; the compare table kept clean.

## What dies (kill, with evidence)

- The eyebrow-per-section cadence (restyle proved insufficient: it is still the drum
  hit on every band on every route).
- Icon-card grids as the default container (13-22 per class page; 14 across the two
  money pages; 2-3 mobile viewports each; the named 2026 tell).
- The stat band (hero-metric template; duplicates the class cards' own numbers).
  Replaced by the heritage strip: "Fifty-five Septembers." set huge, three taped
  year-captioned prints ending in an empty frame: "2026: your kid here?"
- The 50/50 text-left/media-right hero composition (SaaS shape wearing paper props).
- Centered-everything: spreads alternate anchor sides; desktop compositions are
  designed, not inflated phone columns (teacher bands, timelines, testimonials all
  currently float in half-empty 1440 bands).
- The border-t-4 / border-l-4 strip remnants (TuitionTable mobile, AnnouncementModal,
  TabsSection, blockquotes), the `.wcp-pop` bounce bezier, and the `data-reveal`
  blanket.

## Anti-references (the lanes this direction refuses)

- **Etsy-clipart scrapbook kitsch** and drop-shadow Polaroid generators (tilt stays
  capped at 2deg; artifacts snap to the grid; tape is drawn once, honestly).
- **Editorial-typographic slop** (display-serif italics + mono labels + ruled
  monochrome restraint): the saturated 2026 AI lane; nothing here is a magazine.
- **SaaS-cream landing grammar**: eyebrow/heading/subtext sandwiches, icon-card
  feature grids, translucent stat boxes, gradient anything.
- **Elite-school austerity** (Exeter minimalism kills the co-op warmth that converts
  this audience; we take their type scale and one-CTA discipline only).
- **WebGL/loader/custom-cursor award theater**: wrong for a conversion site under our
  gates; the 2026 winners we benchmarked don't do it either.
- **Bento grids** for funnel content (2026 fatigue + wrong tool for sequential
  decisions like tuition→tour).
- **Corporate childcare chrome** (Goddard/Primrose: carousels, cookie walls, edge-tab
  widgets, locator-first headers, franchise-owner heroes).

## The conversion argument (what this buys, measurably)

Competitors: Goddard hides prices and demands 8 fields before a calendar; Primrose's
"Schedule a Tour" is a callback form; only Guidepost actually books, with soulless
local pages. WCP with a pinned one-tap tour path + public tuition said out loud +
real classroom warmth is the only local site that can win the 10pm phone parent.
Primary metric stays tour-topic submissions/week (Apps Script sheet; July baseline
capture is already a PENDING.md human task). A true self-serve slot picker is the
category gap; recommended as a Nathan decision (needs a calendar backend: Phase 3
human task, not a redesign blocker).

## Hero doctrine, Act II (home)

Keep the drench + the living-photograph film, recompose: at 390 the polaroid enters
the FIRST viewport (headline tightens to two lines with the crayon underline; the
print tucks behind/beside the CTA row, tilted, tape real); primary CTA Schedule a
Tour with the proof line; Enroll demoted to a text link. At 1440 the spread goes
asymmetric: headline at architectural scale left, the film print larger right,
overlapping the band seam below (the first "taped over the edge" moment), one
handwritten annotation arrow ("filmed by our families →"). Interior heroes follow:
photo heroes keep full-bleed + scrim; no-media heroes get the drench + ONE artifact
(never a bare text field with an empty half).

## Phasing note

Phase 1 builds the sheet system (band/edge/type/motion/CTA primitives) and verifies
the hub untouched; Phase 2 rebuilds routes in funnel order on those primitives;
Sanity stays read-only (composition changes are code; any content edits become
queued dry-run scripts in PENDING.md rows per house pattern).

## Open questions for Nathan (Phase 0 gate)

1. Approve CONSTRUCTION PAPER as the composition system over the shipped grammar?
2. The hero recomposition keeps your navy-drench call but moves the polaroid into
   the phone fold and demotes Enroll to a text link on heroes. OK?
3. Self-serve tour SLOTS (Calendly-style or a Sheets-backed picker) as a Phase 3
   human task: interested, or keep the form?
4. The Threes-page testimonial is signed by you. Swap target (any other parent quote)
   when the quota returns?
