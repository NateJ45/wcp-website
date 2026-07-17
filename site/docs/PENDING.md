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

| Script (`site/scripts/`)              | What it does                                                                                                                                                                                                                                  | After running, also…                                                                                             |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `patch-directory-classes.mjs`         | Directory: swap the two Pre-K children listed in the wrong AM/PM session                                                                                                                                                                      | —                                                                                                                |
| `patch-teacher-phones.mjs`            | Set `teacherNote.phone` for both teachers (pills currently run on code fallbacks)                                                                                                                                                             | —                                                                                                                |
| `restructure-prek-pet-section.mjs`    | Lift the Pre-K class-pet blurb into its own section; reset the closing CTA                                                                                                                                                                    | —                                                                                                                |
| `patch-drop-fundraising-statband.mjs` | Remove the budget stat band from the fundraising hub doc                                                                                                                                                                                      | Delete the section filter in `fundraising.astro` (search `statBandSection`)                                      |
| `patch-calendar-feed-url.mjs`         | Point `siteSettings.calendarFeedUrl` at the new calendar-feed web app (URL in `.dev.vars`)                                                                                                                                                    | Confirm the hub Calendar page shows events, then nothing — old feed can be retired                               |
| `patch-calendar-field-trips.mjs`      | Calendar hub: convert the "How field trips work" proseSection into a policy card grid (matches the class handbooks; the calendar now renders Board sections via HubSectionedBody)                                                             | Delete the `FIELD_TRIP_CARDS`/`boardSections` stopgap in `calendar.astro` (search `STOPGAP`)                     |
| `patch-tour-links.mjs`                | Repoint every in-body/menus "Schedule a Tour" CTA from `/enroll` → the tour form; fix the `/safety` hero CTA (points at `/`). **Dry-run by default; needs `--commit`.** UNTESTED (authored under the quota freeze) — review the dry-run first | Also patch the draft home doc's hero CTAs if any; confirm `/virtual-tour` keeps the `pp-tour-form` section \_key |

**IA redesign stopgap (2026-07-17): the nav is CODE-OWNED and the Sanity Menus doc is bypassed.** `resolveNavigation` (src/lib/nav.ts) serves the five-item funnel doctrine from `src/data/nav.ts` unconditionally (header + footer + legal); Studio menu edits do nothing (the in-Studio guide says so). To close out, decide: (a) patch the Menus doc to match the doctrine + swap `resolveNavigation` back to `resolveNavigationFromDoc`, or (b) retire the Menus editing surface (structure.ts item, navigation schema, guide entry). Also queued from the IA redesign: merge `/about` into `/why-wcp` (redirect), merge `/contact` + `/virtual-tour` into one "Visit Us" page (contact details section appended to the virtual-tour doc, retitle, redirect /contact), then drop the merged pages from tests/routes.ts + redirects map.

**Phase 1 (public transformation) content changes still to SPEC into scripts** — deferred rather than shipped as untested blind mutations. Author + dry-run each when the quota returns (see the 2026-07-17 spec §Phase 1): enroll page consolidation (one canonical step list, drop the dup, replace the dup tuition table with a link, add a hero form anchor CTA); header nav (Tuition top-level, group Why-WCP/Reviews/FAQ/A-Day); testimonial redistribution (full wall → /reviews, ~4-6 curated on /why-wcp, different quotes per page, /reviews closing tour CTA); interest-list rung (name+email on home + /tuition via /api/subscribe) + enrollmentCtaSection on /enroll + /tuition; copy fixes (July seasonality, banned "not just X"/"more than" constructions, canonical contact email, em-dash strip, pipe title separators).

## Code stopgaps (delete each when its Sanity edit lands)

Because the Studio can't save, some content fixes live in code. Each must be
re-done in Sanity when the quota is back, then the code removed (the Studio
shows the OLD content until you do):

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
  `PUBLIC_GADS_ID` if Google Ads ever run. `src/components/Analytics.astro`
  renders nothing until then.
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
