# Pending work — the live registry

The repo's open loops in one place. **Keep this file current**: when you queue a
patch script, add a row; when you run one, delete its row AND remove its
stopgap (each row says how). A stale row here misleads the next session, which
defeats the point.

_Last reviewed: 2026-08-08._

## The 2026-08-04 quota-reset close-out (context)

The Sanity API quota froze 2026-07-15 and reset by 2026-08-04. On reset day the
ENTIRE queue was run: all standalone patch scripts, the 7-script transformation
batch (in order), and every code stopgap's Sanity edit — after which the
stopgaps themselves were deleted (`hub-stopgaps.ts` is gone; `page-doctrine.ts`
keeps only product-decision drops and the Act II grammar). The Studio is the
source of truth again everywhere, including the Menus doc (the nav resolver
reads it; `src/data/nav.ts` is only the empty-doc fallback).

One casualty surfaced 2026-08-08: the first run of `patch-menus-doctrine.mjs`
wrote page links as literal slug strings instead of `page` REFERENCES, so every
nav link resolved to "/" on the live site (the whole public nav pointed home).
Fixed same day: the script now writes real references and re-ran, and
`resolveNavigation` warns at build time if a page link ever loses its
reference again.

## Queued patch scripts

| Script (`site/scripts/`)          | What it does                                                                                                                                                                                           | Blocked on                                                                                                                                                                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `patch-home-visit-splitmedia.mjs` | Replaces `page-home`'s `hp-visit` proseSection with a real `splitMediaSection` (photo + the same copy), returning the home visit block to volunteer editing. **Dry-run by default; needs `--commit`.** | A human choosing `PHOTO_PATH` (see "Waiting on a human"). After `--commit`: delete `VisitBlock.astro`, the `'visit'` moment in `photo-moments.ts`, both `SectionRenderer` branches, and `'hp-visit'` from `SECTION_DROP.home` in `page-doctrine.ts` |

## Remaining code-owned content decisions (not stopgaps)

| Where                                                     | What                                                                                                                                       | To change                                                                                                                                     |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/page-doctrine.ts` `SECTION_DROP.home` `hp-visit` | The stored visit prose is replaced at render time by `VisitBlock` (photo-moments `'visit'`) so the block keeps its photo                   | Run `patch-home-visit-splitmedia.mjs` (above)                                                                                                 |
| `src/lib/page-doctrine.ts` `SECTION_DROP.home` `k20`      | News hidden "for now" (Nathan, 2026-07-19): the home teaser and the footer News link are off; `/news`, articles, RSS and sitemap stay live | Nathan's call. Restore: delete `'k20'` + uncomment the News line in `src/data/nav.ts`. Permanent: delete the section from `page-home` instead |
| `TestimonialSection.astro` co-op-life tag step            | `patch-testimonial-redistribution.mjs` skipped its co-op-life variety step: **0 testimonials carry the "co-op" tag**                       | Tag quotes in the Studio, re-run the script's co-op-life step (or set the section's tag by hand)                                              |

## Waiting on a human

- **Paste the new PayPal student-fee link in the Studio (AFTER this branch
  deploys).** PayPal's old webscr buttons were causing QuickBooks trouble;
  Lexie recreated the Twos & Threes $45 student-fee button in PayPal's current
  system (2026-08-08). Once the `payUrl` link-passthrough change is LIVE, open
  Studio → Money & payments → Tuition & Fees → student-fee band "Twos &
  Threes" and replace the old code (`GQZ67ZRZ4W9UN`) with
  `https://www.paypal.com/ncp/payment/PVP3W4TNLKRPA` (also the "PayPal button —
  student fee" field on the Twos and Threes class docs, if filled). Ordering
  matters: pasted before the deploy, the old code wraps the link in the legacy
  webscr URL and the button 404s. Then click the $45 button on
  /family-hub/tuition, confirm the amount, and have Lexie verify the
  transaction in QuickBooks. Once she confirms, recreate the remaining seven
  buttons (4 tuition, Pre-K student fee, registration, participation) and
  paste their links the same way — no code changes — then delete the legacy
  branch in `payUrl` (src/data/classes.ts) and this entry.
- **Choose the photo for the home visit block** —
  `patch-home-visit-splitmedia.mjs` has `PHOTO_PATH = null` with a "HUMAN
  DECISION NEEDED" block; it refuses to write until someone picks the photo
  (suggested candidates: outdoor-exploration.jpg, about-hero.jpg,
  gym-playtime.jpg in `src/assets/photos/`, or the Sanity media library). Set
  `PHOTO_PATH` (and `ALT`) near the top, then `--commit`.
- **Summer announcements follow-ups** (seeded 2026-08-04, then un-pinned since
  Aug 1 had passed): the Board email's "(Click here)" placeholders still have
  no real hrefs — link them to the actual form/page URLs in the Studio once
  known.
- **Dark mode: the elevation system still needs a visual call (audit findings
  6 and 7).** Waves 1-3 of the 2026-07-19 audit are done — every accessibility
  failure is fixed and guarded by `src/lib/theme-tokens.test.ts`. What remains
  is perceptual, not a WCAG failure, and it changes how every card looks, so it
  wants eyes rather than a green suite:
  - **107 `shadow-*` utilities, one dark override.** All are black-based, and a
    black shadow cannot lift a card off an already-dark surface, so the entire
    depth system silently disappears in dark mode (including every
    `hover:shadow-md`, so interactive cards lose half their hover feedback). The
    diagnosis is already written in `BaseLayout.astro` at the hub rail.
    Generalising it means pairing each surface step with its shadow, the way
    Atlassian's elevation tokens do.
  - **Card-over-band separation is roughly halved in dark** (1.07:1 vs 1.14:1
    light). **Known trap:** simply lifting `--color-surface` was tried before and
    REVERTED, because it pushed the postit composite light enough to drop muted
    text under AA (the note is at the token). The safe route is a layered token
    set (`surface-low` / `surface` / `surface-high`, Carbon-style) with the
    postit tint recomputed per layer — not a single global lift.
  - **Wave 4, do last:** the `.dark` block aliases `--color-*-ink` to the
    100%-saturated bright tier. Contrast passes (6.6-7.8:1) but Material is
    explicit that saturated colour on dark induces eye strain, and the fix is a
    genuinely desaturated dark-ink tier. 161 call sites across 75 files, and it
    interacts with the documented `-ink`-on-tint trap, so it should only start
    once the surfaces underneath it have stopped moving.
- **`logoStripSection` renders on no page today**, so its new dark-mode light
  plate (added 2026-07-19 for Board-uploaded partner logos) is untested in
  practice. Check it the first time a logo strip goes on a page.

- **The /tuition comparative claim now has evidence behind it. Re-check each
  spring.** The page's hero says "the co-op model keeps our tuition lower than
  most preschools in West Chester". Verified 2026-07-19 and holds comfortably:
  non-cooperative, part-week, roughly 2.5-hour morning programs in
  Butler/Hamilton/Warren counties that publish rates ran **$210-$267/month for
  three mornings** (WCP Threes: $150) and **$230-$323 for four mornings**
  (WCP Pre-K AM: $200). Nathan's call was to keep the qualitative claim and NOT
  publish the numbers.
  - **Do not cite a percentage.** The widely repeated "co-ops cost 30-50% less"
    traces only to content farms.
  - **Do not cite the Ohio Market Rate Survey** — its "part-time" band is
    mostly daycare selling reduced hours.
  - **Beware search results for "West Chester preschool tuition"** — several
    surfaced schools are in West Chester, **Pennsylvania**.
  - If the claim is ever strengthened to a number, it needs a footnote stating
    the hours compared, that only schools publishing rates are included, and
    the parent-labour obligation adjacent to the price.

- **Set `AIRNOW_API_KEY` (EPA AirNow) so the hub's air-quality chip reads real
  monitors.** Found 2026-07-19: Open-Meteo's `us_aqi` is the CAMS global
  FORECAST MODEL and missed a real particulate event by ~90 points and two
  categories. The code prefers AirNow observations when the key is present;
  the model fallback still under-reads a real event, so the key is the actual
  fix. Free, no card: https://docs.airnowapi.org/account/request/ (Agency:
  "Other Agency"). Add `AIRNOW_API_KEY` to `site/.dev.vars` AND
  `npx wrangler secret put AIRNOW_API_KEY`. Verify by comparing the hub chip
  against a phone weather app on a day when air is not Good.

### Public-site transformation, Phase 0 (see docs/superpowers/specs/2026-07-17-public-site-transformation-design.md)

- **DNS cutover** — www.westchesterpreschool.org still serves the old
  Squarespace site. The single highest-leverage conversion item. Runbook:
  [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md). Verify a Search Console Domain
  property (DNS TXT) BEFORE the flip.
- **Seed the blog batch (Phase 3)** — Board approval pending; also give the
  fresh quota a day or two of calm before a large seeding run.
- **Analytics env vars are unset — no analytics is live.** Create a Cloudflare
  Web Analytics site and set `PUBLIC_CF_BEACON_TOKEN` in `.env` AND the CI
  build workflows; optionally `PUBLIC_GA_ID`, `PUBLIC_GADS_ID`,
  `PUBLIC_META_PIXEL_ID`. Setting ANY of the three GA/Ads/Meta vars also turns
  on the consent card sitewide; the env var must reach ALL build workflows or
  the card exists in prod but not under test. Also refresh the /privacy cookie
  wording in the Studio when that day comes.
- **Snapshot the July baseline from the forms-inbox Sheet** — count
  tour-request and enrollment-inquiry rows to date (the Apps Script Sheet is
  the only log), so the tour-routing fix's effect is measurable.
- **Fill the Availability sheet + set its Sheet ID in Site Settings** — the
  scarcity badges (`/api/availability`) return `[]` until then.
- **Supply the Google Business Profile review short URL** (g.page/r/...) for
  the code-owned review link + `hasMap`; code slot in `src/data/site.ts`.

- **Cloudflare "Workers Builds" Git integration fails on EVERY commit.** It
  runs `npx wrangler deploy` from the repo root with no install/build. Fix in
  the dashboard (Workers & Pages → wcp-website → Settings → Build), pick ONE:
  (a) RECOMMENDED: disconnect the Git integration — deploys already ride
  deploy.yml; or (b) keep it for PR previews: root `site`, build
  `npm ci && npm run build`, deploy
  `npx wrangler deploy -c dist/server/wrangler.json`, build vars SANITY_TOKEN,
  and disable production-branch builds.
- **Board-approved wording for the safety trust answers** (background checks,
  CPR/first-aid certification, ratios, kindergarten readiness) so /safety and
  /faq can answer the questions parents actually screen for.
- **Board sets the co-op hours goal** (Studio → Site Settings) — until then
  `/family-hub/hours` shows its designed empty state.
- **Update the Sanity webhook filter in the dashboard** to match the
  2026-07-17 list in [SANITY.md](SANITY.md) / `deploy.yml` (drop the dead
  `classNote`, add `hubPage`, `teacherNote`, `presidentNote`, `signupSheet`,
  `signupEntry`).
- **Decide the Celebrations page's fate**: `/family-hub/celebrations` renders
  fine but NOTHING links to it. Either add it to `hub-nav.ts` (Community
  group) or retire the page.
- **Re-paste the deployed calendar-feed script**: the checked-in
  `scripts/apps-script/calendar-feed.gs` now filters prospective-family tour
  bookings ("Tour with …" titles carry visitor and child names) out of the
  feed (2026-08-08). The site filters them too (`isTourBooking` in
  `src/lib/hub-calendar.ts`), so the hub already hides them — redeploying the
  script keeps the names from leaving Google at all (Deploy → Manage
  deployments → new version — same URL). Related but separate: the tour
  bookings still sit on the PUBLIC school calendar (embed + ICS); moving them
  to a private calendar is the real fix at the source.
- **Re-paste the deployed forms-inbox script**: the checked-in
  `scripts/apps-script/forms-inbox.gs` gained `hours`/`photo` tabs + the photo
  FYI email (2026-07-17); the DEPLOYED copy coerces those kinds into the
  contact tab until updated (Deploy → Manage deployments → new version — same
  URL).
- **Google-side ownership**: the school calendar and the forms-inbox
  Sheet/script still live under accounts to inventory and, long-term, move to
  a co-op-owned account — see [GOOGLE.md](GOOGLE.md).
- **On-device iOS checks** from the 2026-07-17 cross-browser pass: tap outside
  the bell menu (pointerdown fix) and drag the backdrop with the drawer open
  (scroll containment) on a real iPhone.
- **Nixon directory pin is street-level** (2026-08-04): OSM has no house
  number for 7969 Saddleback Pl yet, so the pin sits on Saddleback Place
  itself. Nudge it by hand in Studio → Family Hub → Directory → Nixon if
  wanted.
