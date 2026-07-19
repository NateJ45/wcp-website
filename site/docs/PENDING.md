# Pending work — the live registry

The repo's open loops in one place: content writes queued behind the Sanity
quota, the temporary code stopgaps papering over them, and setup steps waiting
on a human. **Keep this file current**: when you queue a patch script, add a
row; when you run one, delete its row AND remove its stopgap (each row says
how). A stale row here misleads the next session, which defeats the point.

_Last reviewed: 2026-07-19._

## The blocker: Sanity API quota

The free-plan API quota was exhausted 2026-07-15 and still returns
`402 plan_limit_reached` (as of 2026-07-17 it rejects even plain API reads).
It resets monthly (or on upgrade at sanity.io/manage). While blocked:

- **All writes fail** — patch scripts AND Studio saves.
- **The live site is fine** — hub reads ride the authenticated CDN
  (`useCdn: true`), a separate allowance; the static site reads at build time.

## Queued patch scripts (run each once when the quota is back)

All idempotent, all read `SANITY_TOKEN` from `.dev.vars`, any order:

| Script (`site/scripts/`)              | What it does                                                                                                                                                                                                                                                                                                                                                                                       | After running, also…                                                                                                                                                                                                                                                        |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `patch-directory-classes.mjs`         | Directory: swap the two Pre-K children listed in the wrong AM/PM session                                                                                                                                                                                                                                                                                                                           | —                                                                                                                                                                                                                                                                           |
| `patch-teacher-phones.mjs`            | Set `teacherNote.phone` for both teachers (pills currently run on code fallbacks)                                                                                                                                                                                                                                                                                                                  | —                                                                                                                                                                                                                                                                           |
| `restructure-prek-pet-section.mjs`    | Lift the Pre-K class-pet blurb into its own section; reset the closing CTA                                                                                                                                                                                                                                                                                                                         | —                                                                                                                                                                                                                                                                           |
| `patch-drop-fundraising-statband.mjs` | Remove the budget stat band from the fundraising hub doc                                                                                                                                                                                                                                                                                                                                           | Delete `fundraisingDropSuperseded` + its call in `applyHubStopgaps`, and the `applyHubStopgaps` call in `fundraising.astro`                                                                                                                                                 |
| `patch-calendar-feed-url.mjs`         | Point `siteSettings.calendarFeedUrl` at the new calendar-feed web app (URL in `.dev.vars`)                                                                                                                                                                                                                                                                                                         | Confirm the hub Calendar page shows events, then nothing — old feed can be retired                                                                                                                                                                                          |
| `patch-calendar-field-trips.mjs`      | Calendar hub: convert the "How field trips work" proseSection into a policy card grid (matches the class handbooks; the calendar now renders Board sections via HubSectionedBody)                                                                                                                                                                                                                  | Delete the `FIELD_TRIP_CARDS`/`boardSections` stopgap in `calendar.astro` (search `STOPGAP`)                                                                                                                                                                                |
| `patch-tour-links.mjs`                | Repoint every in-body/menus "Schedule a Tour" CTA from `/enroll` → the tour form; fix the `/safety` hero CTA (points at `/`). **Dry-run by default; needs `--commit`.** UNTESTED (authored under the quota freeze) — review the dry-run first                                                                                                                                                      | Also patch the draft home doc's hero CTAs if any; confirm `/virtual-tour` keeps the `pp-tour-form` section \_key                                                                                                                                                            |
| `patch-twos-curriculum-months.mjs`    | Twos & Threes curriculum: move Easter + food and nutrition out of April back into MARCH, per Erin's curriculum sheet (the stored doc has them a month late). **Dry-run by default; needs `--commit`.**                                                                                                                                                                                             | Delete `twosCurriculumMonths` + its call in `applyHubStopgaps`, and its cases in `hub-stopgaps.test.ts`                                                                                                                                                                     |
| `patch-twos-class-pet.mjs`            | Twos & Threes: upload the Kit the Kat photo as a Sanity asset and insert a REAL `splitMediaSection` (photo + blurb) above the closing CTA on `hubPage-twos`, replacing the code stopgap. **Dry-run by default; needs `--commit`.** UNTESTED (authored under the quota freeze) — review the dry-run first                                                                                           | Delete `twosClassPet` + the `page` arg at the `twos-threes.astro` call site, delete `ClassPetSection.astro` and its import/BLEED entry/render branch in `HubSectionedBody.astro`, and delete `src/assets/photos/kit-the-kat-sm.webp`                                        |
| `patch-add-summer-announcements.mjs`  | Adds two Announcement-category `update` docs to the hub (fixed ids, `createOrReplace`, no dry-run gate): Lexie's enrollment-paperwork/background-check reminder, and the Board's full summer checklist email (paperwork, background checks, tuition, Family Hub, co-op job requests, calendar). Wording verbatim from the source emails, only headings/bold/lists/links added                      | Both are seeded `pinned: true` + `highlight: true` — un-pin/un-highlight in the Studio once August 1st passes; the "(Click here)" placeholders in the Board email have no real hrefs (none were supplied) — link them to the actual form/page URLs in the Studio once known |
| `patch-testimonial-photos.mjs`        | Uploads the 24 family snapshots in `src/assets/testimonials/` as Sanity assets and sets `photo` on each matching `testimonial` document by author name. **Dry-run by default; needs `--commit`.** UNTESTED (authored under the quota freeze) — review the dry-run first                                                                                                                            | Delete `src/lib/testimonial-photos.ts` + its test, the `photo` prop threading in `TestimonialSection.astro` and `TestimonialWall.astro`, and `src/assets/testimonials/`                                                                                                     |
| `patch-home-visit-splitmedia.mjs`     | Replaces `page-home`'s `hp-visit` proseSection with a real `splitMediaSection` (photo + the same copy), returning the home visit block to volunteer editing. **Dry-run by default; needs `--commit`.** UNTESTED (authored under the quota freeze) — review the dry-run first. Also blocked on a human choosing `PHOTO_PATH` (see "Waiting on a human" below) before `--commit` will write anything | Delete `VisitBlock.astro`, the `'visit'` moment in `photo-moments.ts`, and `'hp-visit'` from `SECTION_DROP.home` in `page-doctrine.ts`                                                                                                                                      |

### The transformation batch (AUTHORED 2026-07-17, run IN THIS ORDER on reset day)

All seven are **dry-run by default** (`--commit` to apply), share `patch-lib.mjs`,
are idempotent, and were authored under the quota freeze — **review each dry-run
before committing**. Every "close out" is a CODE change to make in the same
sitting, or the Studio and the site drift.

| #   | Script (`site/scripts/`)               | What it does                                                                                                                                                | Close out (code, same sitting)                                                                                                                                                                                                              |
| --- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `patch-copy-fixes.mjs`                 | Em-dash strip at the SOURCE (every page doc), seoTitle "—" → "\|", co-op-life hero banned construction, tuition July seasonality line                       | Render-time `deEmDashDeep` stays (defense-in-depth); update its comment in `SectionRenderer.astro` from "stopgap" to "permanent backstop"                                                                                                   |
| 2   | `patch-tour-links.mjs`                 | Repoint every in-body/menus tour CTA `/enroll` → the tour form; fix the `/safety` hero CTA (points at `/`)                                                  | Confirm `pp-tour-form` still first on the visit page after script 6                                                                                                                                                                         |
| 3   | `patch-menus-doctrine.mjs`             | Write the five-item funnel nav INTO the Sanity Menus doc (reconcile option a)                                                                               | Swap `resolveNavigation` → `resolveNavigationFromDoc` (src/lib/nav.ts), remove the paused-note callout from the menus guide (`src/sanity/guides/content.ts`)                                                                                |
| 4   | `patch-enroll-consolidation.mjs`       | ONE step model on /enroll (drop dup cardGrid k219, hoist seed-enroll-steps first), tuition table → pointer to /tuition, hero gains "Send an inquiry" anchor | —                                                                                                                                                                                                                                           |
| 5   | `patch-testimonial-redistribution.mjs` | /reviews owns the full wall IN THE DOC; /why-wcp wall → 6-quote featured teaser; co-op-life → tag-scoped voices (when tagged)                               | Delete the `pageSlug === 'reviews'` override + `getTestimonials` fetch in `TestimonialSection.astro` (the doc now does it)                                                                                                                  |
| 6   | `patch-merge-contact-into-visit.mjs`   | /virtual-tour → "Visit Us": hero visit ask, tour form FIRST, absorbs /contact's details + FAQ; redirect doc /contact→/virtual-tour; deletes page-contact    | Delete the `virtual-tour` entries in `src/lib/page-doctrine.ts` (HERO_OVERRIDES + SECTION_HOIST + SECTION_APPEND); drop `/contact` from `tests/routes.ts` + the footer Get Started column; add `/contact` to the astro.config redirects map |
| 7   | `patch-merge-about-into-why-wcp.mjs`   | /why-wcp absorbs about's story + teachers + facilities; redirect doc /about→/why-wcp; deletes page-about                                                    | Drop `/about` from `tests/routes.ts` + the footer "Our Story" link (`src/data/nav.ts` + rerun script 3 or edit the Menus doc); add `/about` to the astro.config redirects map; update the menus-doctrine script's footer note               |

After the batch: full local gate + deploy, then spot-check /virtual-tour,
/why-wcp, /enroll, and the header nav in the Studio's Presentation preview.
API budget note: the batch is ~20-30 writes total; the seed-blog step (Phase 3,
Board approval pending) should wait a day so the fresh quota is provably calm.

## Code stopgaps (delete each when its Sanity edit lands)

Because the Studio can't save, some content fixes live in code. Each must be
re-done in Sanity when the quota is back, then the code removed (the Studio
shows the OLD content until you do). The 2026-07-17 IA additions:

| Where                                                                                                   | What it papers over                                                                                                                                                                                                                                 | To close out                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/page-doctrine.ts`                                                                              | Visit-page assembly: hero visit ask, tour form hoisted first, contact details appended                                                                                                                                                              | Run `patch-merge-contact-into-visit.mjs --commit`, delete its entries                                                                                                                                                                  |
| `src/lib/page-doctrine.ts` `SECTION_DROP.enroll` + `SECTION_HOIST.enroll` (redesign branch, 2026-07-18) | /enroll render order: drops the duplicate steps cardGrid (k219), the duplicated fee table (pp-enroll-tuition), and the post-form "Not sure which class fits?" band (k234); hoists seed-enroll-steps first. Mirrors `patch-enroll-consolidation.mjs` | Extend/run the enroll-consolidation patch to ALSO delete pp-enroll-tuition + k234 in the doc (script currently only drops k219), then delete both doctrine entries                                                                     |
| `src/lib/page-doctrine.ts` `SECTION_HOIST.tuition` (redesign branch)                                    | /tuition fee table (k53) hoisted above the co-op explainer so a price paints in mobile viewport 1-2                                                                                                                                                 | Reorder the sections in the Studio (drag k53 above k50), then delete the entry                                                                                                                                                         |
| `src/lib/page-doctrine.ts` `SECTION_DROP.home` (redesign branch)                                        | Home statBandSection hidden (numbers duplicate the class cards; the code-owned Heritage strip owns that slot now)                                                                                                                                   | Delete the stat band from page-home in the Studio, then delete the entry                                                                                                                                                               |
| `src/lib/page-doctrine.ts` `SECTION_DROP.safety` (redesign branch, 2026-07-19)                          | /safety statBandSection hidden (Nathan cut it: the 4.8 rides the hero proof line + closer slip; class size/staffing live in the "Secure, on purpose" list)                                                                                          | Delete the stat band from page-safety in the Studio, then delete the entry                                                                                                                                                             |
| `src/lib/page-doctrine.ts` `SECTION_HEADER_OVERRIDES.enroll` (redesign branch)                          | /enroll form header: "Ask about enrolling" → "Start your enrollment" + a lead stating the actual mechanism (packet handed over at the tour)                                                                                                         | Make the same edit on page-enroll's pp-enroll-form header in the Studio, then delete the entry                                                                                                                                         |
| `src/lib/page-doctrine.ts` `SECTION_DROP[classes/pre-k]` (redesign branch)                              | Hides the second Pre-K curriculum band (k374 restates k365 in 7 more cards)                                                                                                                                                                         | Delete k374 from page-classes-pre-k in the Studio (or fold its best lines into k365), then delete the entry                                                                                                                            |
| `src/lib/page-doctrine.ts` `SECTION_DROP[a-day-at-wcp]` + `SECTION_INSERT_AFTER` (redesign branch)      | Hides the four near-identical schedule timelines (k91/k98/k106/k114, ~5.5 phone viewports) and splices a synthetic pullAll classCardsSection ("When each class meets") after the story timeline                                                     | In the Studio: delete the four scheduleSections from page-a-day-at-wcp and add a real classCardsSection referencing all classes in that slot, then delete both entries + the pullAll branch in ClassCardsSection.astro                 |
| `src/lib/page-doctrine.ts` `SECTION_APPEND.reviews` (redesign branch)                                   | /reviews closing tour CTA (the page dead-ended prospects; both stored CTAs were outbound to Google)                                                                                                                                                 | Add a real closing ctaSection to page-reviews in the Studio, then delete the entry                                                                                                                                                     |
| `TestimonialSection.astro` why-wcp cap (redesign branch)                                                | /why-wcp shows a curated quote teaser + "Read every family review" link instead of duplicating the full /reviews wall                                                                                                                               | Covered by `patch-testimonial-redistribution.mjs`; after it runs, delete the pageSlug === why-wcp branches                                                                                                                             |
| `src/lib/nav.ts` (`resolveNavigation`)                                                                  | Serves the code nav doctrine; Sanity Menus doc bypassed (menus guide carries paused note)                                                                                                                                                           | Run `patch-menus-doctrine.mjs --commit`, swap the resolver back                                                                                                                                                                        |
| `TestimonialSection.astro` (reviews override)                                                           | /reviews forced to the full wall (stored section only selects 3 featured)                                                                                                                                                                           | Run `patch-testimonial-redistribution.mjs --commit`, delete override                                                                                                                                                                   |
| `src/lib/testimonial-photos.ts` + `src/assets/testimonials/`                                            | The 24 family snapshots on testimonial notes. The old Squarespace site showed a photo beside every quote; the images cannot be Sanity assets yet (an upload is a write), so they ship as local files joined by author name                          | Run `patch-testimonial-photos.mjs --commit`, then delete the module, its test, `src/assets/testimonials/`, and the `photo` threading in `TestimonialSection.astro` and `TestimonialWall.astro`                                         |
| `VisitBlock.astro` + `photo-moments.ts` `'visit'` + `SECTION_DROP.home` `'hp-visit'`                    | The home visit block's photo. `hp-visit` is a `proseSection` with no image slot, and moments inject between sections rather than wrapping one, so the section is replaced wholesale. **Costs volunteer editability of the home address block**      | Run `patch-home-visit-splitmedia.mjs --commit` (needs `PHOTO_PATH` chosen first, see below), then delete `VisitBlock.astro`, the `'visit'` moment and kind, both `SectionRenderer` branches, and `'hp-visit'` from `SECTION_DROP.home` |

Earlier stopgaps:

| Where                                                                                   | What it papers over                                                                                                                                                                                         | To close out                                                                                |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `src/lib/hub-stopgaps.ts` (+ imports in `pre-k.astro`, `twos-threes.astro`)             | Pre-K AM/PM schedule merge; Twos comms cards (Facebook→Class photos, ClassDojo link)                                                                                                                        | Make the same edits in Sanity, then delete the file + both call sites                       |
| `hub-stopgaps.ts` `twosClassPet` + `ClassPetSection.astro` (+ `HubSectionedBody.astro`) | The Kit the Kat class-pet section on Twos & Threes. The PHOTO is the reason it's code-side: `splitMediaSection` renders through `SanityImage`, and uploading an asset is a write                            | Run `patch-twos-class-pet.mjs --commit`, then delete both files' code per that row          |
| `hub-stopgaps.ts` `twosCurriculumMonths`                                                | Twos & Threes curriculum months: Easter + food and nutrition are stored under April but belong to March (Erin's sheet). Unit-tested in `hub-stopgaps.test.ts`                                               | Run `patch-twos-curriculum-months.mjs --commit`, then delete the function + its tests       |
| `hub-stopgaps.ts` `prekSplitPetFromCta`                                                 | Pre-K: the closing CTA carries the class-pet blurb, so the teacher sign-off card hangs under pet copy. Lifts it to its own prose section + restores the standard closing (matches Twos). Unit-tested        | Run `restructure-prek-pet-section.mjs` (queued above), then delete the function + its tests |
| `hub-stopgaps.ts` `fundraisingDropSuperseded` (called by `fundraising.astro`)           | Filters out `statBandSection` + the superseded budget prose. Lives in hub-stopgaps, NOT inline on the page: the search index reads the same doc and deep-linked to a dropped section when it was page-local | Run `patch-drop-fundraising-statband.mjs`, then delete the function + its call              |
| `documents.astro`                                                                       | Filters out the closing `ctaSection` ("ask a board member / Facebook")                                                                                                                                      | Remove that section from the `hubPage-documents` doc, drop the filter                       |
| `coop-jobs.astro`                                                                       | Regex-strips "runs the private class Facebook page" from the Class Rep role                                                                                                                                 | Edit the `coopRole` body in Sanity, delete the regex                                        |
| `getting-started.astro`                                                                 | Rewrites the "Accessible entrance" card body; adds the ClassDojo register link                                                                                                                              | Patch the `hubPage-getting-started` cards in Sanity, delete the stopgap block               |
| `family-hub/index.astro`                                                                | Overrides `firstDay` 2026-09-10 → 2026-09-09 (countdown targets the kickoff picnics)                                                                                                                        | Set `siteSettings.firstDay = 2026-09-09` in Studio, delete the conditional                  |
| `family-hub/calendar.astro`                                                             | `boardSections` map rewrites the "How field trips work" proseSection → policy card grid                                                                                                                     | Run `patch-calendar-field-trips.mjs`, delete the `FIELD_TRIP_CARDS`/`boardSections` stopgap |

## Waiting on a human (not quota-blocked)

### Public-site transformation, Phase 0 (added 2026-07-17; see docs/superpowers/specs/2026-07-17-public-site-transformation-design.md)

- **DNS cutover** — www.westchesterpreschool.org still serves the old
  Squarespace site; every canonical/og:url on the new site points there. This
  is the single highest-leverage conversion item. Runbook:
  [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md). Verify a Search Console Domain
  property (DNS TXT) BEFORE the flip so the sitemap submits the moment DNS
  moves.
- **Analytics env vars are unset — no analytics is live.** Create a Cloudflare
  Web Analytics site for the domain and set `PUBLIC_CF_BEACON_TOKEN` in `.env`
  AND the CI build workflows (ci/lighthouse/deploy pass build env); optionally
  `PUBLIC_GA_ID` (Google Analytics 4), `PUBLIC_GADS_ID` (Google Ads), and/or
  `PUBLIC_META_PIXEL_ID` (Meta Pixel) when those go live.
  NOTE (2026-07-17): setting ANY of those three now ALSO turns on the
  cookie-consent card sitewide (CookieConsent.astro) — every tracker is
  consent-gated per category (Analytics / Advertising toggles) and only loads
  after the visitor grants its category. Remember the env var must reach ALL
  build workflows (ci/lighthouse/deploy) or the card exists in prod but not
  under test. When that day comes, also refresh the /privacy page's cookie
  wording in the Studio (which trackers, which categories, plus the always-on
  essentials; quota permitting).
- **Snapshot the July baseline from the forms-inbox Sheet** — count
  tour-request and enrollment-inquiry rows to date. Sanity holds ZERO
  submission docs (checked 2026-07-17 via CDN), so the Apps Script Sheet is the
  only log. Needed so the tour-routing fix's effect is measurable.
- **Fill the Availability sheet + set its Sheet ID in Site Settings** — the
  scarcity badges (`/api/availability`) return `[]` in peak enrollment season;
  hooks are live on home//enroll//classes/pre-k. Sheet ID needs the quota back.
- **Supply the Google Business Profile review short URL** (g.page/r/...) for
  the code-owned review link + `hasMap`; code slot in `src/data/site.ts`.

- **Cloudflare "Workers Builds" Git integration fails on EVERY commit** (main
  included). Root cause confirmed from the 2026-07-19 build log: it runs
  `npx wrangler deploy` from the REPO ROOT with no install/build step — the app
  lives in `site/`, needs `npm ci && npm run build` (with SANITY_TOKEN) first,
  and must deploy via `-c dist/server/wrangler.json`. Fix in the dashboard
  (Workers & Pages → wcp-website → Settings → Build), pick ONE:
  (a) RECOMMENDED: disconnect the Git integration / toggle builds off — deploys
  already ride deploy.yml, which also owns the Sanity publish webhook and the
  weekly cron the integration cannot replace; or (b) keep it for PR preview
  URLs: root directory `site`, build `npm ci && npm run build`, deploy
  `npx wrangler deploy -c dist/server/wrangler.json`, build vars SANITY_TOKEN
  (+ optional INSTAGRAM_TOKEN), and DISABLE production-branch builds for main
  so merges do not deploy twice.
- **Board-approved wording for the safety trust answers** (background checks,
  CPR/first-aid certification, ratios, kindergarten readiness) so /safety and
  /faq can answer the questions parents actually screen for (Phase 0 audit:
  both pages duck them today; the redesign left slots, not invented facts).
- **Board sets the co-op hours goal** (Studio → Site Settings) — until then
  `/family-hub/hours` shows its designed empty state. Requires the quota back.
- **Update the Sanity webhook filter in the dashboard** to match the 2026-07-17
  list in [SANITY.md](SANITY.md) / `deploy.yml` (drop the dead `classNote`, add
  `hubPage`, `teacherNote`, `presidentNote`, `signupSheet`, `signupEntry`) —
  until then, publishing those hub-only types burns a needless rebuild. The
  deploy.yml guard already enforces it; the dashboard filter just saves the
  webhook call.
- **Decide the Celebrations page's fate**: `/family-hub/celebrations` renders
  fine but NOTHING links to it (not the rail, drawer, tab bar, or home — found
  in the 2026-07-17 docs audit). Either add it to `hub-nav.ts` (Community
  group) or retire the page.
- **Re-paste the deployed forms-inbox script**: the checked-in
  `scripts/apps-script/forms-inbox.gs` gained `hours`/`photo` tabs + the photo
  FYI email (2026-07-17); the DEPLOYED copy coerces those kinds into the
  contact tab until it's updated (Deploy → Manage deployments → new version —
  same URL).
- **Google-side ownership**: the school calendar itself and the forms-inbox
  Sheet/script still live under accounts to inventory and, long-term, move to a
  co-op-owned account — see [GOOGLE.md](GOOGLE.md).
- **On-device iOS checks** from the 2026-07-17 cross-browser pass: tap outside
  the bell menu (pointerdown fix) and drag the backdrop with the drawer open
  (scroll containment) on a real iPhone.
- **Choose the photo for the home visit block** (added 2026-07-19) —
  `patch-home-visit-splitmedia.mjs` has `PHOTO_PATH` set to `null` with a
  "HUMAN DECISION NEEDED" block; it refuses to write until someone picks the
  photo. It was left open on purpose: `VisitBlock.astro` picks its photo
  dynamically at build time from the A Day gallery pool via
  `photosFor('home-visit', 1)`, so there is no single fixed image to carry
  over into the stored section automatically. Look at `src/assets/photos/`
  (the script suggests outdoor-exploration.jpg, about-hero.jpg,
  gym-playtime.jpg as candidates) or the Sanity media library once reachable,
  set `PHOTO_PATH` (and `ALT`) near the top of the script, then run
  `--commit`.
