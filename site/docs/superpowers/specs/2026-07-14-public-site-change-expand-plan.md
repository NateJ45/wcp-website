# Public Marketing Site — Change & Expand Plan

**Date:** 2026-07-14
**Status:** Phase 1 SHIPPED 2026-07-14 (see §11). Remaining phases pending.
**Owner:** Nathan Nixon
**Source:** the 2026-07-14 competitive teardown (8 preschool sites across national-premium / boutique / co-op tiers + 2026 design-trend research + a live audit of our own site).

## 1. Strategy

Borrow the chains' **conversion mechanics** (live ratings, hero video, punchy emotional headline, concrete safety, testimonial video, a clear tour funnel) while doubling down on the things a chain structurally cannot copy: **transparent tuition, a real parents-in-the-classroom co-op, hand-drawn warmth, and genuine accessibility rigor.** Every change below is measured against that: does it either add a proven conversion mechanic, or deepen our not-a-chain identity? If neither, it is out.

**Non-negotiable through all of it:** brand-lock (no new design knobs for volunteers), the a11y gate (Lighthouse 100 / axe / 320px reflow), the copy voice (no em-dashes, no ellipses, warm, parent-centered, no AI-tell words), reduced-motion safety, the SSR pre-sized-image rule, never motion on the LCP hero heading, and keep-docs-in-sync.

## 2. The key realization: we already own the vocabulary

The public page-builder already registers ~40 section types. Almost everything the findings ask for maps to a section that **already exists** — so the bulk of this plan is content, copy, and art-direction, not engineering:

| Finding / need                    | Mechanism                                                           | Status                                                       |
| --------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| Hero video (ambient loop)         | `Hero.astro` has `data-hero-video` + poster + reduced-motion player | Player built; needs the ASSET + a Board-editable video field |
| Concrete safety specifics         | `quickFactsSection` / `cardGridSection`                             | Exists — content only                                        |
| Click-to-play testimonial video   | `videoSection`                                                      | Exists — content only                                        |
| "How enrollment works" 1-2-3      | `stepListSection`                                                   | Exists — content only                                        |
| Honest comparison table           | `compareSection`                                                    | Already live on /why-wcp                                     |
| Stat band (55+ yrs, $70, 12 max)  | `statBandSection`                                                   | Already live                                                 |
| Newsletter / not-ready capture    | `newsletterSignupSection` / `formSection`                           | Exists — content only                                        |
| Trust / accreditation badges      | `logoStripSection` / `quickFactsSection`                            | Exists — content only                                        |
| Tuition transparency + calculator | `tuitionTableSection` / `tuitionCalculatorSection`                  | Exists — pricing already shown                               |
| Reviews collection                | `reviewFormSection` + `testimonialSection`                          | Exists                                                       |

**The one genuinely new capability is a live third-party rating.** Everything else is either content or a light design pass.

## 3. The code surface (small, targeted)

Only four items need engineering. Everything else is content assembled from existing sections.

1. **Hero video: asset + field.** Confirm the page hero schema exposes a Board-editable video field (the player already reads one); produce a 10-15s muted, looping, candid classroom clip; host it in R2 or Sanity (NOT committed — it is gitignored per the hero-video gotcha) and set a strong candid poster. **S.**
2. **Live Google rating.** The new capability, in two tiers:
   - **v1 (recommended first): a manual rating badge** — a tiny `ratingBadge` field or a `quickFacts`/`logoStrip` usage the Board updates (e.g. "4.9 on Google, 40+ reviews", linked to the Google reviews page). Zero API dependency, ships immediately, honest. **S.**
   - **v2 (optional upgrade): a build-time Google Places fetch** — a `scripts/` step that reads the Places API rating+count at build (cached, like the OG-card postbuild), so the number self-updates on each rebuild. Needs a Google Places API key as a build secret. **M.**
3. **Public-site visual-depth layer.** Bring the hub's construction-paper texture + hand-drawn doodle accents (the 2026 "artisanal / anti-AI-slop" differentiator) to select public bands as a **code-owned** option (not a volunteer knob — brand-lock holds). Reuse the existing `.wcp-hub-canvas` texture system and `globals.css` motion toolkit. **M.**
4. **Optional: a slim "trust bar"** under the hero (rating + "Ohio-licensed since 1969" + "12 children per class") if we decide it deserves its own tiny component rather than a `quickFacts` band. **S.**

## 4. The content & copy surface (the bulk)

All Board-editable via existing sections; the deliverable here is the recommended section stack per page plus the actual copy (drafts in §6).

- Sharpen the hero headline and section headlines to the emotional-benefit pattern.
- Add a safety-specifics band (concrete nouns).
- Add one click-to-play parent-testimonial video.
- Add an enrollment 1-2-3 timeline.
- Add a low-commitment "interest list" CTA rung + keep the newsletter capture.
- Name our co-op approach as a light signature and use it consistently.
- Refresh photography toward candid, activity-focused shots.

## 5. Page-by-page

### Home — change

Recommended flow (mostly reordering + additions to what exists):

1. **Hero** — live ambient video, sharpened headline (§6), single primary CTA "Schedule a Tour" + secondary "Enroll".
2. **Trust bar** — rating badge + "Ohio-licensed since 1969" + "12 children per class" (new, §3.4 or `quickFacts`).
3. **Why families choose us** (keep).
4. **The co-op difference** — reframed under the named signature (§6).
5. **Safety, specifically** — `quickFacts`/`cardGrid` with concrete nouns (new content, §6).
6. **Classes / find the right fit** (keep).
7. **A typical day** (keep; richer candid media later).
8. **Parent testimonial VIDEO** — `videoSection`, click-to-play (new content).
9. **From our families** testimonials (keep) + the live rating link.
10. **Come see us / Plan your visit** CTA (keep) + interest-list rung.

### Why WCP — change (light)

Already strong (the six reasons + comparison table + stats). Additions: the rating badge near the top, and the named signature woven into reason #1 or #4. Otherwise leave it; it is our best-converting page.

### NEW: Safety & Wellness — expand

A dedicated page assembled from `quickFacts` (security features), `cardGrid` (health/cleaning/allergy practices), `faqSection` (drop-off, sick days, weather closures), and the licensing statement as a number. Directly closes the "concrete safety nouns" gap and gives us a page to link the nav "Safety" item the chains all have.

### NEW: What Families Say — expand

Aggregates `testimonialSection` + `videoSection` (parent videos) + the live rating + the existing `reviewFormSection` (so happy families can add a review, feeding the Google count). The social-proof home the research says separates the best from the rest.

### NEW / fold-in: How Enrollment Works — expand

`stepListSection` (1. Tour → 2. Choose a class → 3. Register) + `tuitionTableSection` + `enrollmentCtaSection`. Either its own page or a band on `/enroll`. Pairs our already-public pricing with a clear path, which chains cannot match (they gate both).

### Classes / A Day at WCP — change

Already good. Add age-band clarity (weeks/months precision the chains use) and swap in candid, activity-focused photography as it becomes available.

## 6. Copy drafts (real, voice-safe)

**Hero headline options** (own the co-op moat; no em-dash; warm):

1. **"A front-row seat to who they'll become."** (recommended — owns our "front-row seat" idea no chain can claim)
2. "Where little ones grow up loved, and you grow right alongside them."
3. "Their first big years, shared with you."
4. "Where every child belongs, and every parent does too." (two-audience, Primrose-style)

Keep the current subhead pattern (co-op + play-based + community).

**Signature name options** (light, not trademark-heavy — used as a warm label, not a legal mark):

- **"The Front-Row Years"** (ties the hero and the co-op model together)
- "Learn-alongside preschool"
- "The co-op way"

**Safety-specifics band** (concrete nouns, warm):

- **Secure by habit.** Doors stay locked; every family signs in and out by hand.
- **Small on purpose.** Twelve children per class, so every child is truly known.
- **Licensed since 1969.** Ohio-licensed and inspected, with the record to show for it.
- **Health, handled.** Daily cleaning, allergy-aware snacks, and clear sick-day guidance.
- **The same faces daily.** Consistent teachers your child knows and trusts.

**Interest-list rung** (for not-ready browsers):

- "Not ready to visit yet? Join our interest list and we will keep you posted on open houses and enrollment." → minimal name + email `formSection`.

## 7. Phasing

| Phase                     | Scope                                                                                                                                        | Mostly                               | Rough size                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | --------------------------- |
| 1 — Quick wins            | Hero video asset + field, manual rating badge, sharpened hero headline, safety-specifics band, one testimonial-video slot, interest-list CTA | Content + 1 small component + assets | 1 session + asset gathering |
| 2 — Trust & conversion    | Safety page, What-Families-Say page, How-Enrollment-Works, named-signature rollout, (optional) Google Places API rating                      | Content assembly + 1 build script    | 1-2 sessions                |
| 3 — Visual identity depth | Public-site texture/doodle layer, hand-drawn accents, photography refresh                                                                    | Design/code + photo pipeline         | 1-2 sessions + photography  |
| 4 — Ongoing               | Blog cadence, seasonal content, candid-photo pipeline, review-count growth                                                                   | Content                              | Recurring                   |

Each phase is independently shippable and holds every gate.

## 8. Measurement

- Lighthouse accessibility stays 100 (CI gate) and PageSpeed performance measured before/after each phase (the hero video and texture layer must not regress LCP — the player already defers, and textures ride the existing system).
- Track tour-form and interest-list submissions (already flow to the Sanity inbox + Apps Script).
- Watch the Google review count climb once `reviewFormSection` nudges happy families.

## 9. Decisions needed from Nathan

1. **Google rating:** do we have a Google Business Profile with a rating and review count worth surfacing? (If yes → manual badge ships in Phase 1; if the count is thin → we prioritize the `reviewFormSection` nudge first.)
2. **Hero video:** can we get a short candid classroom clip (even phone footage, 10-15s)? Without it, Phase 1 instead upgrades the poster to a strong candid still.
3. **Photography:** appetite/budget for a candid, activity-focused photo refresh (the top trust lever)? Affects Phase 3.
4. **Expansion scope:** build all three new pages (Safety, What Families Say, How Enrollment Works), or fold them into existing pages?
5. **Signature name:** pick from §6 or brainstorm more.
6. **Execution:** should I build these pages myself via the CMS/migration script (like the original page-builder seed), or hand the Board a section-by-section recipe?

## 10. Docs to update when this ships

Per keep-docs-in-sync: `docs/PAGE_BUILDER.md` (any new section type or the rating capability), `CLAUDE.md` (the rating build step + texture-layer note if added), and the in-Studio volunteer guide (`src/sanity/guides/content.ts`) for any new editing surface (the hero video field, the rating badge, the new pages).

## 11. Phase 1 shipped (2026-07-14)

Applied via `scripts/seed-site-expansion.mjs` (idempotent, additive) + `tests/routes.ts`:

- **Hero headline** → "A front-row seat to who they'll become." (owns the co-op moat), over the already-live ambient classroom video. Correction to the earlier audit: the hero video was never broken — it streams from Sanity CDN and plays muted-looping; the earlier "404" was a wrong-path test.
- **Google rating surfaced (4.8):** a trust `statBand` (4.8 Rated on Google / 12 per class / 55+ years / 2 teachers per room) on the new Safety page, a "rated 4.8 on Google" line on /why-wcp, and the rating as the hero CTA on /reviews. All link to the Google listing.
- **New /safety page** (Safety & Wellness): concrete-safety card grid, a parents-actually-ask FAQ, trust band, tour CTA. In the header nav + footer.
- **New /reviews page** (What Families Say): featured testimonials + "leave a Google review" CTA (feeds the review count). In the footer nav.
- **/enroll:** a "How enrolling works" 1-2-3 timeline appended.
- Verified: build, 320px reflow + axe (both new pages added to the suite), link check.

**Deferred to later phases (need Nathan's assets/calls):** parent-testimonial VIDEO (needs footage), the home-page trust/safety bands (home has an active draft; not clobbered), the named co-op signature rollout, the public-site texture/doodle layer, the candid-photography re-curation, and the optional Google Places API auto-rating. Also: confirm/fill the exact Google review COUNT (the badge shows the 4.8 rating; the count didn't extract cleanly).
