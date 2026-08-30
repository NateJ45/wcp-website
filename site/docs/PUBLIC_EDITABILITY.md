# Public-site editability audit — the derive-everything gaps

_2026-08-31. Companion to [HUB_EDITABILITY.md](HUB_EDITABILITY.md): a three-way sweep of
every public route, all 44 section renderers, and every shared component + `src/data`
fallback file. The page-builder means most CONTENT is already Board-owned; what follows
is what the code adds around it. Waves ordered by certainty of going stale. This file is
the registry; strike items as they ship._

## Wave 1 — will be false soon, some on a schedule

1. **The Septembers wall stops at 2026** (`SeptembersWall.astro:25` `THIS_FALL = 2026`,
   `:124` "September 2026: yours?"; `HeritageStrip.astro:34` "Fifty-five Septembers.",
   `:82` "2026: your kid here?"). These read like computed facts and are not — the wall
   stops growing year tabs this fall and the count drifts annually. **Fix**: derive the
   fall year and the Septembers count from `site.founded` + the current school year
   (Site settings `yearStart`/`schoolYearLabel`); zero new fields needed.
2. **The public Family Handbook link is a hashed CDN URL** (`site.ts:131`, labeled
   "2026/2027") — every yearly re-upload is a code deploy, even though the HUB already
   reads the same PDF from Hub settings. **Fix**: public consumers read
   `hubSettings.familyHandbook` (same query the hub uses), committed URL as fallback.
3. **JSON-LD asserts facts no one can edit** (`StructuredData.astro` ←
   `site.ts:36,39,43`): `priceRange: '$70-$200 /month'` (tuition changes yearly — Google
   keeps the stale price), `geo`, `areaServed`. **Fix**: derive priceRange from the
   class docs' monthly range; geo/areaServed accepted as code with a note (the building
   does not move often).
4. **Silent-edit bugs** — fields a volunteer can edit that do nothing: `shortName`
   (queried, never mapped in `getSiteSettings`), `licenseAuthority` (schema field, not
   queried or mapped), `email.contact` (not queried). Same failure class as the old
   parkingNote bug. **Fix**: map all three.
5. **The production domain is hardcoded in the email APIs** (`api/newsletter.ts:23`,
   `api/digest.ts:81`) while `site.url` is Sanity-backed — with the DNS cutover still
   pending, every emailed link would survive the cutover pointing at the old host.
   **Fix**: both read `site.url`.
6. **Teacher identities in code**: `site.ts:76-77` (`lisa@`/`erin@` + names in
   comments). **Fix**: consumers read the `staff` docs (which already hold emails);
   keep as documented fallback only if a consumer genuinely needs one.
7. **`classes.ts` fields with no Sanity projection**: `tagline` (each class's public
   blurb!) and `daysCount`. A class blurb edit is currently impossible. **Fix**: add
   both to the class schema/queries like every other field.
8. **The tuition math's constants**: `SCHOOL_YEAR_MONTHS = 9` (`lib/tuition.ts`) and
   the "deposit, returned after your co-op hours" claim (calculator + class cards). A
   10-month year or a policy change misprices the compare-schools pages. **Fix**:
   months + the deposit-note line become Fee schedule fields.

## Wave 2 — claims, venue, and policy stated in code

- **"Inside Crestview Presbyterian Church"** — the landlord's name, in TWO places
  (`ContactDetailsSection.astro:54`, `VisitBlock.astro:74`) with no Studio field; one
  lease change from false. Plus VisitBlock's "We are a secular, non-discriminatory
  cooperative preschool… no religious affiliation" (legal-adjacent) and "Tours by
  appointment June to August". **Fix**: Site settings `venueNote` + `summerTourNote`;
  the secular statement joins the footer's (also code) as one Site settings field.
- **The footer's legal line** ("A secular, non-discriminatory cooperative preschool.
  Founded … {license}") — sentence frame is code around Sanity values.
- **"Age by Sept 30" as a frozen column header** (`TuitionTableSection.astro:35-45`)
  while the per-class age VALUES are editable; cutoff changes are routine over a
  decade. **Fix**: header label from the fee schedule/site settings.
- **The colophon** asserts "since 1969"/"five decades" (derive from `site.founded`),
  Lighthouse/WCAG guarantees, and the builder credit. Derive the years; the rest is a
  deliberate keep (it is the developer's page).
- **The contact form promises "we actually reply, usually within a school day"** and
  hardcodes its class-interest option lists in two INCONSISTENT copies
  (`ContactForm.astro:75,103`) — a fifth class never appears. **Fix**: options derive
  from the class docs; the reply promise becomes microcopy.
- `api/contact.ts` falls back to Resend's sandbox sender (`onboarding@resend.dev`).

## Wave 3 — structure and the magic keys

- **The tour CTA anchor `/virtual-tour#sec-pp-tour-form`** appears in six-plus places
  (Header fallback, nav.ts, 404, events, ChooserRows, HeritageStrip, TourPill,
  PageHero default) and hangs off a hand-written Sanity `_key`. **Fix**: one exported
  `TOUR_CTA` constant + a STABLE anchor the virtual-tour page guarantees (id on the
  form section independent of the key), so a re-created section cannot break the
  site's primary CTA.
- **Magic content keys**: `page-doctrine.ts` `'why-wcp': ['k198']` / `'co-op-life':
['k157']`, `ProseSection` `_key === 'seed-signature'`, `[...slug].astro`'s class
  slug→color map, `ClassCardsSection`'s `pre-k-am/pm → pre-k` map (the hub solved this
  with longest-prefix matching — port it). Deleting/re-adding a section silently
  changes layout. **Fix**: match by a marker field instead of `_key` where feasible;
  derive class colors from the class docs (they already carry `color`).
- **PageHero force-rewrites hero CTAs** (only one stored action survives, the tour CTA
  is injected) — doctrine by design, but document it in the Studio guide so a board
  understands why their second button does not show.
- `nav.ts:1-24` header comment still claims the Menus-doc bypass exists — it was
  removed 2026-08-04 (`lib/nav.ts:138-141`); fix the stale comment. The commented-out
  News link (line 94) means restoring News is a two-place change; note it there.
- Category→label maps rendered as UI: Downloads, Jobs, EventsListing order — same
  registry treatment as the hub's documents page when they next change.

## Wave 4 — the label sweep (mostly DON'T)

Empty states, button labels, SEO description patterns, thank-you page buttons, search
shortcut chips, cookie-consent copy, calculator row labels: leave as code (same
reasoning as the hub's Wave 4). Exceptions worth folding in when touched: the news/RSS
description duplicated in three files; TestimonialWall hardcoding five stars regardless
of the stored rating; the "Now enrolling!" announcement fallback.

## Confirmed healthy (no action)

The Menus doc IS the nav's source of truth (fallback verified — the auditor was briefly
fooled by nav.ts's own stale comment); Site settings covers name/founded/tagline/url/
address/phone/emails(general-admin-treasurer)/hours/license/closure/rating/socials/
show-switches; class times/ages/fees/pay links; school-year events; testimonials;
footer sign-off; thank-you + 404 microcopy; announcement copy; hero/section content
throughout the page builder.
