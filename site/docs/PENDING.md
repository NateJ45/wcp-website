# Pending work — the live registry

The repo's open loops in one place: content writes queued behind the Sanity
quota, the temporary code stopgaps papering over them, and setup steps waiting
on a human. **Keep this file current**: when you queue a patch script, add a
row; when you run one, delete its row AND remove its stopgap (each row says
how). A stale row here misleads the next session, which defeats the point.

_Last reviewed: 2026-07-17._

## The blocker: Sanity API quota

The free-plan API quota was exhausted 2026-07-15 and still returns
`402 plan_limit_reached` (as of 2026-07-17 it rejects even plain API reads).
It resets monthly (or on upgrade at sanity.io/manage). While blocked:

- **All writes fail** — patch scripts AND Studio saves.
- **The live site is fine** — hub reads ride the authenticated CDN
  (`useCdn: true`), a separate allowance; the static site reads at build time.

## Queued patch scripts (run each once when the quota is back)

All idempotent, all read `SANITY_TOKEN` from `.dev.vars`, any order:

| Script (`site/scripts/`)              | What it does                                                                                                                                                                                                                                                                                                                                                                  | After running, also…                                                                                                                                                                                                                                                        |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `patch-directory-classes.mjs`         | Directory: swap the two Pre-K children listed in the wrong AM/PM session                                                                                                                                                                                                                                                                                                      | —                                                                                                                                                                                                                                                                           |
| `patch-teacher-phones.mjs`            | Set `teacherNote.phone` for both teachers (pills currently run on code fallbacks)                                                                                                                                                                                                                                                                                             | —                                                                                                                                                                                                                                                                           |
| `restructure-prek-pet-section.mjs`    | Lift the Pre-K class-pet blurb into its own section; reset the closing CTA                                                                                                                                                                                                                                                                                                    | —                                                                                                                                                                                                                                                                           |
| `patch-drop-fundraising-statband.mjs` | Remove the budget stat band from the fundraising hub doc                                                                                                                                                                                                                                                                                                                      | Delete the section filter in `fundraising.astro` (search `statBandSection`)                                                                                                                                                                                                 |
| `patch-calendar-feed-url.mjs`         | Point `siteSettings.calendarFeedUrl` at the new calendar-feed web app (URL in `.dev.vars`)                                                                                                                                                                                                                                                                                    | Confirm the hub Calendar page shows events, then nothing — old feed can be retired                                                                                                                                                                                          |
| `patch-calendar-field-trips.mjs`      | Calendar hub: convert the "How field trips work" proseSection into a policy card grid (matches the class handbooks; the calendar now renders Board sections via HubSectionedBody)                                                                                                                                                                                             | Delete the `FIELD_TRIP_CARDS`/`boardSections` stopgap in `calendar.astro` (search `STOPGAP`)                                                                                                                                                                                |
| `patch-tour-links.mjs`                | Repoint every in-body/menus "Schedule a Tour" CTA from `/enroll` → the tour form; fix the `/safety` hero CTA (points at `/`). **Dry-run by default; needs `--commit`.** UNTESTED (authored under the quota freeze) — review the dry-run first                                                                                                                                 | Also patch the draft home doc's hero CTAs if any; confirm `/virtual-tour` keeps the `pp-tour-form` section \_key                                                                                                                                                            |
| `patch-add-summer-announcements.mjs`  | Adds two Announcement-category `update` docs to the hub (fixed ids, `createOrReplace`, no dry-run gate): Lexie's enrollment-paperwork/background-check reminder, and the Board's full summer checklist email (paperwork, background checks, tuition, Family Hub, co-op job requests, calendar). Wording verbatim from the source emails, only headings/bold/lists/links added | Both are seeded `pinned: true` + `highlight: true` — un-pin/un-highlight in the Studio once August 1st passes; the "(Click here)" placeholders in the Board email have no real hrefs (none were supplied) — link them to the actual form/page URLs in the Studio once known |

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

| Where                                         | What it papers over                                                                       | To close out                                                          |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `src/lib/page-doctrine.ts`                    | Visit-page assembly: hero visit ask, tour form hoisted first, contact details appended    | Run `patch-merge-contact-into-visit.mjs --commit`, delete its entries |
| `src/lib/nav.ts` (`resolveNavigation`)        | Serves the code nav doctrine; Sanity Menus doc bypassed (menus guide carries paused note) | Run `patch-menus-doctrine.mjs --commit`, swap the resolver back       |
| `TestimonialSection.astro` (reviews override) | /reviews forced to the full wall (stored section only selects 3 featured)                 | Run `patch-testimonial-redistribution.mjs --commit`, delete override  |

Earlier stopgaps:

| Where                                                                       | What it papers over                                                                     | To close out                                                                                |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `src/lib/hub-stopgaps.ts` (+ imports in `pre-k.astro`, `twos-threes.astro`) | Pre-K AM/PM schedule merge; Twos comms cards (Facebook→Class photos, ClassDojo link)    | Make the same edits in Sanity, then delete the file + both call sites                       |
| `fundraising.astro`                                                         | Filters out `statBandSection` + the superseded budget prose section                     | Run the patch script above, drop the filter                                                 |
| `documents.astro`                                                           | Filters out the closing `ctaSection` ("ask a board member / Facebook")                  | Remove that section from the `hubPage-documents` doc, drop the filter                       |
| `coop-jobs.astro`                                                           | Regex-strips "runs the private class Facebook page" from the Class Rep role             | Edit the `coopRole` body in Sanity, delete the regex                                        |
| `getting-started.astro`                                                     | Rewrites the "Accessible entrance" card body; adds the ClassDojo register link          | Patch the `hubPage-getting-started` cards in Sanity, delete the stopgap block               |
| `family-hub/index.astro`                                                    | Overrides `firstDay` 2026-09-10 → 2026-09-09 (countdown targets the kickoff picnics)    | Set `siteSettings.firstDay = 2026-09-09` in Studio, delete the conditional                  |
| `family-hub/calendar.astro`                                                 | `boardSections` map rewrites the "How field trips work" proseSection → policy card grid | Run `patch-calendar-field-trips.mjs`, delete the `FIELD_TRIP_CARDS`/`boardSections` stopgap |

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
