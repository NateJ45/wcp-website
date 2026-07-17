# Award-site design language: what WCP can adopt

**Date:** 2026-07-17
**Method:** live 1440px captures (fold + mid-scroll) of ten award-caliber
sites across four lanes: motion/WebGL (Lusion, Active Theory), scroll and
typographic craft (Locomotive, Obys), bold type (Basement, Dogstudio,
Cuberto, Build in Amsterdam), and systemized playful product brands
(Duolingo, Headspace). Filtered through our hard constraints: static Astro,
Lighthouse-a11y-100 + axe + reduced-motion gates, performance budget, the
scrapbook register, no generated art on the conversion surface. Snapshot doc
(not kept in sync).

## The shared grammar of award sites

1. **Type is the image.** Locomotive runs a full manifesto section where
   oversized serif text IS the content, with tiny glyph doodles embedded
   between words. Obys treats punctuation as graphics. Nothing else needed.
2. **The site is a place.** Basement renders its literal office as an
   explorable scene. The metaphor matters more than the tech: the strongest
   sites feel like SOMEWHERE, not like pages.
3. **One playful prop.** Build in Amsterdam puts a working "Sitting Time"
   slider inside its hero product grid. A single interactive brand object
   beats scattered micro-interactions.
4. **Rotating circular-text badges.** Cuberto's spinning round "contact"
   mark; an award staple that reads as a stamp or seal.
5. **Editorial index rows.** Obys/Locomotive list content as full-width
   ruled text rows with arrow hovers and (desktop) image reveals; craft
   through restraint rather than cards.
6. **Character systems at scale.** Duolingo's spot characters are LARGE,
   one accent color per section, enormous whitespace; Headspace punctuates
   with warm blobs and blob-masked imagery. Playfulness is systemized, not
   scattered.
7. **What does NOT transfer:** WebGL immersion (Lusion/Active Theory/
   Basement tech), loader intros, custom cursors, sound. Wrong perf/a11y
   trade for a preschool conversion site, and gimmick without their budgets.

## Adoptable moves for WCP, ranked (all code-owned, gate-safe)

1. **The manifesto band** (Locomotive). One band where the co-op manifesto
   runs as oversized display text with small WCP-hand doodle glyphs (sun,
   heart, crayon tick) embedded between words. Type-as-image at almost zero
   cost; pairs with the "quiet band" benchmark item. Candidate copy, in
   voice: "Parents in the room. Play as the plan. Fifty-five years of both."
2. **The fact marquee** (award staple + the OLD SITE had a ticker). A slow
   CSS-only horizontal marquee of school facts in display type ("Est. 1969 ·
   12 children max · from $70 a month · 4.8 on Google · parents in the
   room") at one band seam on home. Reduced-motion: renders as a static
   centered row. The old availability ticker's spiritual descendant.
3. **The rotating tour stamp** (Cuberto badge x our EST. 1969 stamp). The
   sun/cloud stamp with circular text ("schedule a tour · come see a
   morning ·") slowly rotating (transform-only; static under
   reduced-motion), used as a round floating link to the tour form on home
   and /why-wcp. Award language that lands directly in our stamp system.
4. **Cloud-masked photos** (Headspace blobs, our cloud). Select registry
   photos cropped in a soft cloud mask (CSS clip-path/mask, the Seam's cloud
   geometry) instead of rectangles. The sun/cloud emblem finally shapes
   imagery; zero JS.
5. **Editorial index rows** (Obys/Locomotive). FAQ categories, downloads,
   and the jobs list re-rendered as full-width ruled rows with an arrow
   affordance; hover reveals a small candid photo (pointer:fine only).
   Quiet craft applied broadly.
6. **Place the playful prop we already own.** The tuition calculator
   section exists in code but is placed on NO page (test-suite finding).
   Elevate it as the brand prop on /tuition ("what would your mornings
   cost?"), Build-in-Amsterdam style. Needs the quota for placement OR a
   code-side page moment like the photo strips.
7. **Spots at scale with one idle motion each** (Duolingo). The WCP-hand
   spot set rendered LARGE as section companions (not chip-sized), each with
   one subtle motion (the sun's rays breathe, from the hub's existing
   twinkle language). Waits on the human-approved public spot set (the
   no-generated-art rule).

## Fit warning

Award language is seasoning, not the meal: every move above must serve the
tour funnel and the scrapbook register, or it becomes the "impressive but
cold" failure mode the elite-school benchmark warned about. Adopt 1-4 first;
they compound (manifesto + marquee + stamp + cloud masks all extend systems
we already ship).
