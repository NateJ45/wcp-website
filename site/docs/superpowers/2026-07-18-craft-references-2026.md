# Out-of-category craft references for the 2026 public redesign

**Date:** 2026-07-18. Live captures at 390x844 and 1440x900 (Playwright, logged out).
Five photo/illustration-forward, static-friendly consumer conversion sites; zero WebGL
among them, which is itself the finding. Snapshot doc (docs/superpowers rules: not
kept in sync). Compiled during Phase 0 of the redesign/public-2026 branch.

**Meta-finding:** the best warm consumer sites of 2026 are typographically loud and
kinetically quiet. They spend on custom type, color commitment, texture, and voice,
not motion. WCP's hard gates (a11y 100, reduced-motion, LCP) are aligned with how
this bar is set, not a handicap.

## 1. Duolingo

- Mobile hero: centered characters, one-sentence H1 in 32px brand font (gray #4B4B4B
  ink, not black), two full-width stacked CTAs in the thumb zone (primary = green
  hard-shadow "pressable" 3D button). No nav noise, no proof bar.
- 12 sections, identical anatomy: short lowercase brand-green display heading, one
  illustration, 2-3 sentences. ONE navy tonal break. Green CTA reprise at end.
- Desktop restructures: split hero + a language ticker rail pinned to viewport bottom
  (browse axis mobile doesn't have).
- One family; hierarchy via color + size only. Display never sits on imagery.
- Motion: character loops + button press physics only. Nothing scroll-driven.
- Studio tell: trusts ONE sentence per section.

## 2. Headspace

- Mobile: kinetic two-line H1, then TWO stacked cream cards, each a mini-hero with its
  own h2 + charcoal pill CTA + proof line under the CTA. Primary CTA mid-viewport.
- Self-segmentation chooser ("What kind of headspace are you looking for?" six tappable
  rows). Yellow marquee. Full-bleed yellow footer CTA band with giant type.
- Desktop: the two cards go side-by-side as an explicit comparison (structural rethink).
- Color rationing: ~80% neutral; big saturated fills reserved for ~4 moments per page.
- Studio tell: IA as a friendly question; proof attached to CTAs, not floating.

## 3. Tony's Chocolonely

- Full-bleed color-block bands, hard seams, zero gradients. Display lettering is
  hand-cut artwork (shipped as images — an ANTI-move under our gates), typewriter face
  for everything else. Yellow reserved for CTAs on blue.
- Desktop hero: photography annotated with hand-drawn arrows + handwritten captions.
- Essentially NO motion: the loudest site of the five is the stillest.
- Studio tell: total commitment — consent modal, footer joke generator, one voice.

## 4. Who Gives A Crap

- 50px display type at 390 viewport (custom face), white on periwinkle, one pistachio
  pill CTA. Manifesto band: the impact stat set ENTIRELY in display type on a fill
  (the hero treatment, not a stat-band treatment).
- A section is a color or white, never a wash. Periwinkle/pistachio ≈ our sky/green.
- Three-tier custom family; display appears at full size exactly twice per page.
- Studio tell: display restraint WITH display courage.

## 5. Oatly

- Words-first hero (mission statement in mono caps), boxed offset-double-border button.
- Desktop: the whole page inset in a graph-paper frame — the site as a paper object
  (cousin of our hub-note texture). Mixed-size collage/zine grid, poster type baked
  into imagery, tiny yellow tags as the only UI color.
- Cream + ink; texture replaces color as the personality carrier. No motion.
- Studio tell: every card art-directed; the chrome is in-world.

## 2025-2026 commentary shifts (sources in session notes)

1. The anti-AI-slop turn is the defining story: handmade texture, asymmetry, custom
   illustration as premium trust markers ("Imperfect by Design"). Validates the
   scrapbook register as on-trend, not nostalgic.
2. Type-as-identity / oversized editorial headlines went mainstream (Awwwards 2026
   typography-led winners).
3. Bento fatigue is named; bento is the wrong tool for sequential decisions like a
   tuition/enroll funnel.
4. Motion restraint is a stated virtue tied to perf budgets; 4 of the 5 captured
   references ship almost no scroll-driven motion.
5. Tactile brutalism as secondary current (boxed buttons, single-pixel borders).

## Transferable moves, ranked (gate each must respect)

1. One-sentence hero + ONE dominant CTA in the thumb zone (live text, no LCP motion,
   target-size).
2. The manifesto band: "Fifty-five Septembers" set huge in Captain Comic on a full
   fill (AA ink table; reduced-motion-safe countup; 320 reflow).
3. Hand-drawn arrow + caption annotations over real classroom photos (SVG aria-hidden,
   info never only in the annotation; zero JS).
4. Color rationing: a section is a color or white, never a wash; saturated bands as
   rare events (band enum already brand-locked).
5. Two-card hero for the two real conversions (tour vs info), stacked mobile,
   side-by-side desktop, proof line under each CTA (h1 → card-h2 order).
6. Page-level paper texture frame (static tile, never animated/fixed blur, few KB).
7. Self-segmentation chooser rows ("Just looking / Comparing / Ready to enroll" →
   A Day, Tuition, Visit). Native links; highest conversion-per-effort.
8. Mixed-size scrapbook collage grid for photo sections (explicit aspect-ratio per
   cell, CLS 0, no masonry JS).
9. Display-type courage at small viewports: ~44-56px Captain Comic for the TWO display
   moments per page (320 sweep required).
10. Pressable hard-shadow CTA (transform-only, motion-reduce guard, visible focus).
11. Structural humor in chrome corners (404, footer sign-off, empty states) in full
    voice; consent stays legally plain.
12. Texture photography (finger paint, construction paper macro) as band background
    behind an AA panel; lazy, never LCP.

## Anti-moves confirmed

- Display type as images (fails a11y/LCP).
- Rotating/kinetic LCP headline (no-motion-on-LCP rule).
- Bento grids for the funnel pages.
- Mascot-scale illustration systems (budget + generated-art rule).
- Marquee without pause + reduced-motion static fallback.
