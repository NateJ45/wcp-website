# Design benchmark: WCP vs high-end educational institutions

**Date:** 2026-07-17 (after the boldness pass shipped)
**Method:** live captures at 1440px of Avenues The World School, Phillips Exeter
Academy (home + admissions), The Dalton School, Sidwell Friends, The Nueva
School, Bing Nursery School (Stanford), UCLA Lab School, compared side by side
against fresh captures of our live home, why-wcp, tuition, and enroll pages.
Snapshot document (docs/superpowers rules: not kept in sync).

## What the design-forward elite actually do

Prestige alone does not produce good design (Bing at Stanford ships a plain
university template; UCLA Lab similar). The design-forward subset (Avenues,
Exeter, Dalton) share five habits:

1. **Type at architectural scale, with line discipline.** Exeter sets its own
   name at a third of the viewport; "Admissions" runs edge to edge and overlaps
   the photo below. Never more than 2-4 lines, always intentional breaks. Their
   boldness is SCALE plus confidence, not color count.
2. **Photography owns the page, unscrimmed.** Dalton's fold is one intimate
   close-up of a teacher and child; Exeter's is a vivid field of flowers with
   no dark overlay. Color enters through photographs; the UI itself stays
   near-monochrome (off-white + one brand color). One decisive image per
   viewport, edge to edge.
3. **One CTA per surface.** Exeter: a single red Apply pill. Avenues: Request
   info. No competing buttons anywhere in the chrome.
4. **Values-led admissions copy in display type.** Exeter's admissions page
   OPENS with "We care about your curiosity and your character, not your
   ability to pay" in large serif, with Financial Aid inline. The money-values
   message is the headline, not a footnote.
5. **Chrome restraint.** Thin headers, enormous whitespace, near-zero
   ornament. Craft lives in typography, spacing, and photo curation.

## Where WCP stands after the boldness pass

We deliberately occupy a DIFFERENT register: warm, handmade, color-drenched,
scrapbook. That is correct for a $70-200/month parent co-op; Exeter austerity
would read as cold and false on us. The audit therefore extracts PRINCIPLES,
not veneer. Scores against the five habits:

| Habit                         | WCP today                                                                                                                                                                  | Verdict                                                                                                                                      |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Type scale + line discipline  | Scale is now good (post-pass); line discipline was NOT (the hero fragmented to 6 lines at 1440, including a break after the hyphen: "FRONT- / ROW")                        | **Fixed in this commit**: hero-scoped clamp + nowrap on hyphenated accent tokens. Watch this class of bug on every future scale bump         |
| Photography ownership         | Strips + polaroids everywhere now, but every photo sits in a FRAME; no photo anywhere owns a full viewport, and heroes on interior pages still carry the 50-82% navy scrim | Gap: one unscrimmed full-bleed "interlude" moment per key page would add the elite register without losing ours                              |
| One CTA per surface           | Header carries TWO competing CTAs (Schedule a Tour + Enroll Now) plus social/search/theme = ~12 interactive elements before the nav                                        | Gap: tour-first doctrine argues for ONE header CTA (Schedule a Tour), Enroll demoted to nav                                                  |
| Values-led money message      | /tuition leads with a table under a standard header; the transparency VALUE (our moat, the thing Exeter headlines) is body copy                                            | Gap: lead /tuition with the value in display type ("Every fee, published. On purpose.") before the table                                     |
| Chrome restraint / whitespace | Our bands are dense back-to-back events (chip + strip + cards + band); elite pages breathe 2-3x more between ideas                                                         | Partial gap: our warmth needs some density, but key pages would gain from one deliberate "quiet band" of pure whitespace + a single sentence |

## What we should NOT copy

- Their austerity/minimal ornament (kills the co-op warmth that converts our
  actual audience; a chain can't copy our handmade register and neither should
  we copy elite-minimal).
- Serif-italic institutional gravitas (wrong voice for play-based preschool).
- Their navigation depth (they serve constituencies we don't have: alumni,
  athletics, giving).

## Adopted now (this commit)

- Hero line-break discipline: hero-scoped type clamp sized to the framed
  hero's column; hyphenated accent tokens can never break at the hyphen.

## Recommended next (in priority order)

1. **Single header CTA.** "Schedule a Tour" alone in the header; "Enroll" stays
   in the nav. Aligns with the tour-first funnel and the elite pattern.
2. **The full-bleed interlude.** One unscrimmed edge-to-edge photo band
   (photo registry, code-owned) with a single caption sentence, placed once on
   home and once on why-wcp. The one elite move our scrapbook register lacks.
3. **Values-led /tuition opener.** Display-type statement above the table:
   the transparency message as the headline, Exeter-style, in our voice.
4. **A quiet band.** One whitespace-heavy single-sentence band per key page
   (the signature statement band is close; let it breathe more, and resist
   filling every gap with artifacts).
5. **Photo curation ceiling.** Their photos are professionally shot; ours are
   candid-phone. The one-morning shot list (already in PENDING.md) remains the
   single biggest lever this benchmark surfaces, and no code can substitute.
