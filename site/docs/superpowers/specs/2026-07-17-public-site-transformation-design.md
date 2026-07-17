# Public Site Transformation: "Fifty-Five Septembers"

**Date:** 2026-07-17
**Status:** DESIGN, awaiting Nathan's approval. No implementation has started.
**Owner:** Nathan Nixon
**Sources:** a 9-agent audit of the live public site (conversion funnel, design craft vs the hub, distinctiveness, code quality, SEO/local/performance), three competing creative concepts, an adversarial completeness critique, full-page captures of every public route at 1440 and 390, and full-page captures of the still-live old Squarespace site at westchesterpreschool.org.

---

## 1. The diagnosis

The public site is polished, accessible, and honest, and it converts worse than it should while looking more generic than it is.

**What the audits agree on:**

- **The funnel breaks at its decisive step.** Every tour CTA on the site (header "Setup a Tour", every closing "Schedule a Tour" band, even both "Book a Tour" buttons on /virtual-tour itself) routes to /enroll, which has no tour form. The one real, low-friction tour form (topic "Tour request") sits orphaned on /virtual-tour at `#sec-pp-tour-form`, pointed to by nothing. On /safety, the hero's primary "Schedule a Tour" button links to the homepage. Touring is the conversion action for a preschool, and it has no path.
- **The site speaks one sentence shape.** 47 uppercase eyebrow labels and 51 centered section headers across 10 routes, zero left-aligned headers, 60+ identical lucide-icon-in-a-circle cards, the same three testimonials verbatim on three pages, the same stat band on three pages, two conflicting "three steps" lists on /enroll alone. Both halves (eyebrow-per-section, identical icon-card grids) are named tells in our own anti-AI-tells law.
- **The distinctive assets are hoarded or dormant.** 96 photos sit on /a-day-at-wcp while /tuition, /safety, and /why-wcp are icon deserts. The class brand colors barely appear on public pages. The 4.8 Google rating never reaches home, /enroll, or /tuition. The 1969 heritage is one line of prose. The hub's paper-note warmth never ported; public cards are flat white with border-top color strips (the exact idiom the hub already retired as slop).
- **What the old Squarespace site had that we lost:** truly visible media (both heroes are 40-second ambient films of real school moments; the old site let the footage read brighter, our scrim runs 50-82% navy), orange-forward energy, full-color class cards, parent faces on testimonials, wavy playful section punctuation, a live "ALMOST FULL / WAITLIST" ticker, narrative sections ("A morning you will actually look forward to"), and varied left/right composition. The redesign kept the content and flattened the voice.
- **Two time bombs and one gate.** (1) The homepage Instagram grid hotlinks signed CDN URLs that expire within days (decoded expiry Jul 19-22) while Sanity-webhook rebuilds are frozen by the quota outage: the "Life inside WCP" band will go blank on its own. (2) The sitemap submits 25 gated hub URLs plus an indexable /studio. (3) Above everything: **www.westchesterpreschool.org still serves the old Squarespace site.** Every canonical, og:url, and og:image on the new site points at the old domain, where those URLs 404. Until DNS cuts over, we are transforming a site prospective parents cannot find.

**What must be protected (the audits' strengths list):** public transparent tuition (the moat no chain copies), the ambient hero video system (poster-first LCP, prerender-guarded, reduced-motion-safe: mechanically better than the old site's), 24 named testimonials, the honest compare table, the co-op expectation-setting, form resilience (no-JS fallback, honeypot, Apps Script fan-out that survives the Sanity outage), the a11y/perf CI gates, and the Captain Comic + navy + class-color identity the hub proved is genuinely ours.

---

## 2. The direction: adopt "Fifty-Five Septembers" whole

Three concepts were developed in full and judged. **Recommendation: the Living Scrapbook, adopted wholesale.** The critic's strongest finding was that the concepts must not be blended: eyebrow treatment, motion doctrine, and the trust artifact each have three incompatible answers, and mixing them recreates the inconsistency we are curing.

> **Thesis.** Since 1969, families have been taping their kids' years to these walls: photos, notes, name tags, construction paper. The site becomes the co-op's own scrapbook, and every page quietly shows a prospective parent where their child's photo would go. Warm proof beats polish: real prints, real handwriting, real prices, pinned where you can see them, with the tour invitation always one pin away.

**Aesthetic lane (named, per the brand-register discipline):** grid-disciplined pocket scrapbooking (Project Life: artifacts snapped to a strict grid, which is what keeps scrapbook from clutter) crossed with a kindergarten hallway display case in September, prop craft in the Moonrise Kingdom register (ephemera treated as designed objects, never random), spot art continuing the one-illustrator HubSpot hand. Explicitly NOT: Etsy-clipart scrapbook kitsch, drop-shadow Polaroid generators, comic-sans classroom decor.

**Why this one:**

1. **It is the identity we already committed to.** The hub's paper notes, grain, doodles, and spot illustrations scored "does NOT read as AI-generated" in the 2026-07-16 critique. The public site inherits a proven system instead of starting a second one.
2. **It redeems the old site's best instincts** (the pushpin notice board, the stationery warmth, the playful edges) in a disciplined form, which is exactly the uniqueness brief.
3. **Lowest dependency risk.** Documentary lives or dies on photography we have not shot and captions the board cannot sustain. Storybook needs the largest bespoke illustration budget and runs the tweeness risk on money pages. Scrapbook ships on CSS, SVG, and photos we already own.

**The runners-up, for the record:**

- **"Through Door 5" (documentary):** full-bleed plate-and-caption photo essay, Magnum/photo-book restraint, trust as a quiet colophon line. Rejected as the base because it needs a shot list and sustained caption craft, and reads austere for this audience. **We steal nothing from it now**; if the board ever invests in real photography direction, revisit.
- **"The Picture Book" (storybook):** the site as a read-aloud day with chapter tabs and scene strips. Rejected for illustration volume and the generated-art risk the critic flagged. Its BuilderSection shell and name-tag availability chips exist in the scrapbook plan already.

**Hard guardrails carried into every phase (the anti-kitsch budget, enforced in code):**

- Tilt capped at 2 degrees, artifacts snap to the container grid.
- One heritage stamp per viewport, max two handwritten moments per page.
- Great Vibes is decorative register only: signatures and margin notes, 18px+, real selectable text, never CTAs, labels, or body copy.
- Data surfaces stay clean: tuition table, compare table, forms, and FAQ get artifact chrome AROUND them, never ON them. White bands under dense copy carry zero artifacts.
- Paper port rules: grain only on public cards. The hub's graph grid, rotating accent tints, canvas tile, emblem watermark, wash, twinkle, and HubPill/HubStat idioms do NOT port (write this list into CLAUDE.md as "hub-to-public porting rules" when Phase 2 starts).
- All texture is CSS/inline SVG data URIs. No runtime filters (the stamp's rough edge bakes into the asset). No new render-blocking font loads (Great Vibes rides the existing FontFace-at-need pattern).

---

## 3. Sequencing: the enrollment clock rules

It is July 17. First day of school is September 9. The fill-the-remaining-spots window is now through August. The Sanity write quota resets around early August. Therefore: **funnel first, patch batch on reset day, visual system after the funnel works.** The visual transformation must never block a conversion fix.

### Phase 0: stop the bleeding (this week, code-only, no Sanity writes)

| #   | Item                                                                                                                                                                                                                                                                                                                                                                                                                                | Answers                |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 0.1 | **DNS cutover push.** Nathan/board action, the single highest-leverage conversion item on this list. Run docs/LAUNCH_CHECKLIST.md. Verify the Search Console Domain property (DNS TXT works while Squarespace still serves) BEFORE the flip so the sitemap submits the moment DNS moves. Until cutover, canonicals stay pointed at the real domain (correct pre-launch posture).                                                    | SEO P0                 |
| 0.2 | **Tour routing, code layer.** Header CTA label "Setup a Tour" becomes "Schedule a Tour" and targets `/virtual-tour#sec-pp-tour-form`; same change in the `src/data/nav.ts` footer fallback (also sync its stale Safety/Reviews/News gaps). One label, one destination, sitewide. /enroll is never the tour target again.                                                                                                            | Conversion P0          |
| 0.3 | **Instagram expiry defusal.** Re-host the 12 tiles as build assets (postbuild step beside generate-og.mjs; images live in dist output, never committed to this public repo). Add a weekly scheduled-rebuild cron to deploy.yml so baked third-party data can never rot more than 7 days regardless of the Sanity webhook. Explicitly NOT the KV image proxy idea: the CACHE namespace already runs ~933 of 1,000 free daily writes. | Craft P1, SEO P1       |
| 0.4 | **Sitemap and index hygiene.** Filter /family-hub/**, /studio, /search, /thank-you, /404 out of the sitemap; add noindex meta to /studio, /search, /thank-you; enable lastmod.                                                                                                                                                                                                                                                      | SEO P1                 |
| 0.5 | **Local JSON-LD enrichment.** Add geo, openingHoursSpecification, priceRange, image, logo, hasMap, areaServed to StructuredData.astro from src/data/site.ts fallbacks. NO aggregateRating from Google reviews (policy risk). Also: collapse /faq to ONE FAQPage entity, add per-event Event JSON-LD on /events (noon-UTC date anchoring), BlogPosting JSON-LD + `<time datetime>` + RSS autodiscovery on /news.                     | SEO P1s + P2s          |
| 0.6 | **Measurement before change.** Verify PUBLIC_CF_BEACON_TOKEN / PUBLIC_GADS_ID are actually set in production; record the July baseline (tour-topic and enroll-topic submission counts from the Apps Script Sheet, /thank-you beacon views) BEFORE 0.2 deploys; make /thank-you distinguish topic (query param or anchor) so tour vs enroll vs contact conversions separate; fire the gtag conversion on thank-you if Ads run.       | Critic gap             |
| 0.7 | **Navy-eyebrow AA bug.** Auto-derive eyebrowTone from background so the 11 bridges that forget it (Countdown ships broken by default) cannot fail AA on a volunteer's Navy radio click. Standalone S fix now; the BuilderSection shell absorbs it in Phase 2.                                                                                                                                                                       | Code P1                |
| 0.8 | **Small conversion frictions, code-owned.** Phone icon-button (tel:) in the mobile header + compact bar and an "or text us" sms: link on /contact; make phone + child birthdate optional on the enroll form variant; drop the hero `<video poster>` double-download (the underlying img is the poster).                                                                                                                             | Conversion P2s, SEO P2 |
| 0.9 | **Safety-net tests.** A public-interactions Playwright spec (nav dropdown open/outside-close/Escape, hamburger, FAQ accordion incl. the :has() fallback, tabs keyboard, announcement dismiss persistence, calculator total), modeled on availability.spec.ts. Also switch nav.ts outside-dismiss from `click` to `pointerdown` (the iOS bug class fixed in the hub 2026-07-17).                                                     | Code P1 + P2           |

### Phase 1: the quota-reset patch batch (day one of the reset, explicit run order)

All idempotent scripts, all registered in docs/PENDING.md before they run, with an API budget so the fresh quota is not re-exhausted (patch scripts first, seed content last, nothing speculative).

1. **The five already-queued scripts in PENDING.md** (directory classes, teacher phones, Pre-K pet section, fundraising statband, calendar feed URL) plus their stopgap deletions.
2. **Tour routing, content layer:** repoint every in-body "Schedule a Tour" link and the footer Menus doc to the tour form; fix /safety's hero CTA (currently the homepage); fix /virtual-tour's own two "Book a Tour" buttons to the on-page anchor.
3. **/enroll consolidation:** one canonical step list (Tour, Choose, Register), delete the duplicate; replace the duplicated tuition table with a one-line link to /tuition; hero gains a third CTA anchored to `#sec-pp-enroll-form`.
4. **Header nav:** Tuition becomes a top-level item; Why WCP / Reviews / FAQ / A Day at WCP group under "Why WCP"; nav.ts fallback synced in the same commit.
5. **Testimonial redistribution:** the full wall moves to /reviews (the page finally matches its promise), /why-wcp keeps ~4-6 curated, home/co-op-life get different voices each; /reviews gains a closing tour CTA band so it stops dead-ending.
6. **The interest-list rung:** minimal name+email capture ("Not ready to visit yet? Join our interest list...") on home and /tuition, reusing /api/subscribe; enrollmentCtaSection band added to /enroll and /tuition so the board's enrollment-mode switch reaches visitors.
7. **Copy fixes:** seasonality (July-relevant tuition-timeline lead, summer tour + playdate entries on /events, playdates banner pointed at the tour form with prefilled topic), banned constructions ("You are not just a parent here...", "More than a preschool..."), canonical contact email (board decides contact@ vs president@ first), em-dash source strip, title separators to the pipe pattern.

### Phase 2: the scrapbook system (after the funnel works, roughly August)

**The enabler first:** `BuilderSection.astro`, one shared shell for all 34 section bridges (Section + SectionHeader + eyebrowTone auto + titleId/labelledby wiring + one tokenized header gap + safeIcon normalization). Every grammar move below becomes a one-file change instead of a 34-file sweep. Migrate bridges mechanically behind the existing axe/reflow/Lighthouse gates plus the new interactions spec.

**Workstream A: section grammar (retires the eyebrow).** Three header treatments assigned per section TYPE in code, volunteers keep zero knobs:

- TAPED LABEL for list/table/form/step sections: left-aligned Captain Comic heading on a slightly rotated paper strip with two tape corners; finally exercises `align='left'`.
- CAPTION HEADLINE for photo-led and story sections: centered heading, crayon stroke on the accent word, no eyebrow.
- MARGIN-NOTE HEADLINE for emotional beats: heading plus one short Great Vibes margin note ("since 1969"), max one per page.
  Eyebrow.astro itself restyles to a sentence-case tick so all 47 legacy instances degrade gracefully with zero content edits; eyebrows survive only in heroes. Sections alternate anchor side down the page like scrapbook spreads; one navy band max per page.

**Workstream B: the edge language (the section-divider answer).** The old site's waves and thick bands, redeemed in WCP's own handwriting rather than Squarespace's. Seam.astro grows from one whisper-scallop into a small code-owned family, used at real chapter breaks only (not every transition): a bigger "chapter" cloud-scallop; a scalloped bulletin-board trim (the die-cut border teachers staple around display boards: a real classroom object, not a web trope); a torn construction-paper edge for the scrapbook bands; and the revived THICK ORANGE DRENCH band for exactly one closing CTA moment per page (the old "Ready to find your people?" energy). All inline SVG, aria-hidden, zero CLS.

**Workstream C: paper surfaces and the strip purge.** Public cards get the grain-only paper treatment (one shared class); border-t-4 / border-l-4 strips retired everywhere (ClassCard, Testimonial, TestimonialWall, TuitionTable mobile cards, Callout, AnnouncementModal). Class identity moves to faint class-tinted surface washes + dots via classStyles(). Callout becomes the postit paper note. Card radius tokenizes (`--radius`) and PostCard/EventCard/QuickFacts/ProgramCards migrate onto one public Card primitive (the public sibling of HubCard).

**Workstream D: the artifact kit.**

- `.wcp-tape` and `.wcp-print` utilities (tape strips, photo-as-physical-print with white frame, capped tilt, hover-straighten, photo-corner variant).
- The heritage stamp: sun/cloud emblem as a one-color rubber stamp with an "EST. 1969" arc; hero-fallback corner mark, news-card no-cover fallback (retiring the grey WCP gradient box), footer seal. Once per viewport.
- The crayon annotation kit: Underline.astro grows into underline/circle/arrow/tick strokes with scroll-draw (pre-drawn under reduced motion).
- Sign-up-sheet list treatment: 6-7 item card grids re-compose as two-column ruled lists with hand-drawn checks (co-op-life's "Seven things" is the flagship).
- Name-tag availability chips: the live availability badge rendered as a marker-written cubby tag on class cards, class pages, and /tuition rows, lighting up the moment the sheet is filled.
- The Pinned Tour Notice: THE closing conversion component sitewide. Cream notice card, pushpin, "Come see a morning", the casual-tours reassurance, sheen CTA to the tour form, and the 4.8 Google rating as a torn-edge review slip beneath (this is how the rating finally reaches home, /enroll, and /tuition; visual only, never JSON-LD).

**Workstream E: photography redistribution.** PhotoStripSection (3-5 taped prints with caption strips, fed at build from the existing A Day gallery via a curated photo registry with per-page exclusivity) deployed onto /tuition, /why-wcp, /safety, /enroll. The 12-tile IG wall becomes one instance of this system. SplitMedia rows and teacher portraits get the print treatment.

**Hero doctrine (DECIDED 2026-07-17, Nathan approved mockup variant B):**

- **Home gets the living-photograph hero.** The ambient film moves out of the full-bleed background into a taped polaroid frame beside the headline, on the cream scrapbook-paper band: headline in navy Captain Comic with the crayon underline, taped "Now enrolling" chip, tour-first CTAs, a caption strip on the frame, one peeking print behind it for depth. Rationale: the ~560px render downsamples the encode 2-3x so compression artifacts disappear, no scrim sits over the film so it plays at full brightness, the first fold gains the asymmetry the audit asked for, and the reduced-motion/data-saver fallback is a visually identical still in the same frame. A 720p re-encode (roughly half the bytes) is a follow-up nice-to-have.
- **Interior pages keep full-bleed PHOTO heroes with the navy scrim** (stills compress fine; the immersive register survives where it works). Curate a strong poster/photo frame per hero.
- **Real photos onto the tuition/enroll/contact/faq navy-placeholder heroes** (until then: navy doodle-paper + stamp fallback, code-owned now).

**Workstream F: testimonials as parent notes.** Stationery card (grain + faint rules), one tape strip, capped tilt, Great Vibes signature attribution, hand-drawn star row. Replaces every review-site card; the wall keeps its masonry skeleton.

**Workstream G: the icon-card purge.** Extend the HubSpot set with ~10 public spots (backpack, name tag, snack cup, blocks, slide, handprint, calendar-star, tour flag, mailbox, crayons) in the same 96x96 one-stroke hand, hand-authored SVG like the existing seven (no generated raster art; Nathan eyeballs the set before it ships). Map existing Sanity icon names to spots through safeIcon() inside CardGridSection/QuickFacts: zero content writes, no build crash on stale names, lucide survives only in unmapped utility contexts.

**Workstream H: motion doctrine.** "Nothing animates that a hand could not do to a scrapbook page." Four sanctioned moves, replacing the 427 uniform reveals: settle (prints drop 6px + straighten to resting tilt, row-capped stagger, fixes the unbounded PhotoGallery stagger), crayon scroll-draw, hover-straighten, and wcp-sheen on primary CTAs only. Grids reveal once as a group, not per card. Everything inside the existing reduced-motion gates; LCP hero heading never moves.

**Page moments (the headline compositions):**

- **Home:** the living-photograph hero (see the hero doctrine above); the "Fifty-five Septembers" heritage strip replaces the stat band (three taped year-captioned prints ending in an empty frame labeled "2026: your kid here?"); the promoted, never-expiring bulletin-board wall; the Pinned Tour Notice with the 4.8 slip.
- **/why-wcp:** the Wall of Notes teaser (4-6 signed stationery notes) + the compare table kept clean as the one canonical numbers moment.
- **/classes/\*:** each page is that class's scrapbook page: class-color construction-paper wash, teacher photo as a taped print with a signed caption, curriculum as a ruled sheet, live cubby-tag availability.
- **/tuition:** the price table as a "posted by the door" pushpinned sheet, license line in its footer, margin note "the whole list, nothing hidden"; photo strip; interest-list slip; Pinned Tour Notice.
- **/enroll:** the clipboard: one taped checklist of steps, the form on a clipboard treatment with a visible anchor from the hero, one parent note beside it.
- **/virtual-tour:** the RSVP card: the tour form as a pushpinned reply card, one screen down, the site's most-linked destination.
- **/safety:** the by-the-door cluster: laminated-card safety facts on a clip, photo strip of the real space.
- **Also styled (critic's coverage holes):** /events (Open House as a conversion lever, tour CTA, Event JSON-LD), the 404 (post-cutover Squarespace long tail lands here: friendly spot illustration + tour/home paths), /search (Pagefind restyle to the paper register), /news cards (photo fallback), /donate + /work-with-us + /newsletter (inherit the utility register: taped-label headers, clean bodies, one closing notice).

**Cross-cutting gates for every Phase 2 PR:**

- **Mobile-first spec:** every move defines its 390/320 collapse before a bridge migrates (strips stack vertically, ledgers go single-column, tilt budgets shrink, the taped label stays readable). 320px reflow remains a hard CI gate.
- **Dark mode:** every cream/tape/paper/tint treatment ships an explicit dark counterpart, and the public axe suite gains a dark-scheme pass (public pages already render dark for any family that toggled the hub theme).
- **Print:** texture and tape carry a print-media guard; the enrollment packet and curriculum PDFs must still render clean.
- **Performance budget:** render-blocking CSS <= 28KB gz, LCP <= 2.5s on audited routes, per-page image transfer cap; add the assertion to lighthouse.yml before the first texture PR.
- **Docs-in-sync:** CLAUDE.md porting rules, PAGE_BUILDER.md section-treatment notes, and the in-Studio volunteer guide entry for any changed editing surface land in the same PR. Any visitor-facing copy that ships in code while Sanity is frozen gets a PENDING.md close-out row in the same PR (definition of done).

### Benchmark-adopted backlog (added 2026-07-17 after the high-end audit)

From docs/superpowers/2026-07-17-highend-benchmark.md (Avenues / Exeter /
Dalton habits worth adopting into our register). All code-only, gate-safe:

1. **Single header CTA.** "Schedule a Tour" alone in the header chrome;
   "Enroll" demoted to the nav. Aligns the elite one-CTA pattern with our
   tour-first funnel doctrine. (Header.astro; both desktop bars + mobile.)
2. **The full-bleed interlude.** One unscrimmed edge-to-edge photograph
   owning a viewport (photo registry, code-owned) with a single caption
   sentence; once on home, once on /why-wcp. The one elite move the scrapbook
   register currently lacks (every photo we show sits in a frame).
3. **Values-led /tuition opener.** The transparency moat as the page's
   HEADLINE in display type ("Every fee, published. On purpose.") above the
   table, Exeter-style; the table stays clean below.
4. **A quiet band.** Let the signature statement band breathe more; resist
   filling every gap with artifacts. One whitespace-heavy single-sentence
   moment per key page.
5. (Human, already in PENDING.md) The one-morning professional-adjacent shot
   list remains the biggest ceiling-raiser this benchmark surfaced.

### Phase 3: content and assets (Nathan/board, parallel and ongoing)

- **One-morning shot list:** Door 5 entry sequence, per-class teacher portraits in their rooms, the materials/snack table, the sign-in clipboard, 5-10 real paper artifacts (cubby label, snack calendar, kid painting with permission).
- **Media-release verification** before kid photography widens onto conversion pages (the 2026-07-14 repos audit flagged photo sensitivity; re-hosted images live in dist/R2, never committed).
- **Availability sheet:** enrollment chair fills the Availability tab + Site Settings Sheet ID; the name-tag chips light up sitewide.
- **Google Business Profile:** supply the GBP review short URL (code slot ready in site.ts).
- **Blog:** 2-3 board-approved posts answering the strongest local queries (age cutoff in Ohio, what preschool actually costs in West Chester, co-op vs daycare), each interlinking /classes/* + /tuition + /enroll. No unowned cadence: index cards de-emphasize dates so a quiet month never reads as a dead school.
- **Heritage scan:** a handful of archival photos (any decade) for the /about heritage timeline.
- **Review growth:** the /reviews leave-a-review nudge keeps feeding the Google count.

---

## 4. Measurement

- **Primary metric:** tour-topic form submissions per week (the Apps Script Sheet already logs every submission with its topic). Secondary: enroll-topic submissions, interest-list signups, /thank-you views by topic, tour-form page views.
- **Baseline captured before Phase 0.2 ships** (July numbers), else the transformation's effect is unknowable.
- Post-cutover: Search Console impressions/clicks for the local queries, and the Google review count.

## 5. Consolidated human-task register (merges into PENDING.md "waiting on a human" when work starts)

1. DNS cutover + Search Console domain verification (0.1). The gate.
2. Confirm production analytics env vars, or supply the beacon token (0.6).
3. Canonical prospect email decision: contact@ vs president@ (Phase 1.7).
4. Availability sheet fill + Site Settings ID (Phase 3).
5. GBP review short URL (Phase 3).
6. Media-release verification for widened kid photography (gate for Workstream E's new placements).
7. The one-morning shot list + artifact photos + heritage scans (Phase 3).
8. Board approval for 2-3 blog posts (Phase 3).
9. Approve the 10 new spot illustrations before they ship (Workstream G).

## 6. Risks

- **Kitsch/clutter:** managed by the hard budgets in section 2; if a page tests busy, remove artifacts, never shrink data surfaces.
- **Credibility register:** a spreadsheet-minded parent must never feel talked down to; the money and safety surfaces stay in the clean register with warmth around them.
- **Two-wave landing:** code chrome ships weeks before frozen Sanity copy patches; every code stopgap carries a PENDING.md row so the window closes deliberately.
- **KV write budget:** no new KV-writing caches for public features; the IG fix is build-hosted on purpose.
- **Scope:** the BuilderSection shell is the enabling refactor; without it the visual system is a 34-file sweep. It lands first in Phase 2, behind the full test gate.

## 7. Decisions needed from Nathan

1. **Approve the direction** (Fifty-Five Septembers, adopted whole) or pick documentary/storybook instead.
2. **Green-light the DNS cutover** (or name what blocks it): the plan's single highest-leverage item.
3. **Tour destination endgame:** Phase 0 points everything at /virtual-tour's form. Build a dedicated /tour page later once analytics justify it? (Recommended: revisit after cutover data.)
4. **Photo consent posture** for widening classroom photography onto conversion pages.
5. **Phase 1 copy approvals:** the rewritten headlines (co-op-life hero, home co-op card) and the canonical email.
