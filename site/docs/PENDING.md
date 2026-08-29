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

## Field audit follow-ups (2026-08-23)

The field-by-field schema audit lives in [FIELD_AUDIT.md](FIELD_AUDIT.md).
Its registry is 100% checked off (all bugs fixed, the 29 dead fields hidden or
removed, `legalPage` retired — commits 87826d8 + 2b0cc54, 2026-08-23). The only
residue: Nathan's delete-or-keep call on the 3 orphan `legalPage` docs (below),
and the one-time `seed-orderrank.mjs` drag-order seed.

## Remaining code-owned content decisions (not stopgaps)

| Where                                                     | What                                                                                                                                       | To change                                                                                                                                     |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/page-doctrine.ts` `SECTION_DROP.home` `hp-visit` | The stored visit prose is replaced at render time by `VisitBlock` (photo-moments `'visit'`) so the block keeps its photo                   | Run `patch-home-visit-splitmedia.mjs` (above)                                                                                                 |
| `src/lib/page-doctrine.ts` `SECTION_DROP.home` `k20`      | News hidden "for now" (Nathan, 2026-07-19): the home teaser and the footer News link are off; `/news`, articles, RSS and sitemap stay live | Nathan's call. Restore: delete `'k20'` + uncomment the News line in `src/data/nav.ts`. Permanent: delete the section from `page-home` instead |
| `TestimonialSection.astro` co-op-life tag step            | `patch-testimonial-redistribution.mjs` skipped its co-op-life variety step: **0 testimonials carry the "co-op" tag**                       | Tag quotes in the Studio, re-run the script's co-op-life step (or set the section's tag by hand)                                              |

## Family-sync leftovers (2026-08-28, PORTS.md cards 28 + 28b)

The in-canvas control layer was reconciled onto the starter's canonical copies
that day. Two pieces were deliberately NOT adopted, and both are decisions
rather than debt — re-read this before "finishing the job":

- **The word picker is not extracted into `src/lib/heading-accent.ts`.** The
  starter keeps `splitHeadingWords` / `isAccentedWord` / `HeadingToken` in a
  file of that name. Here they live in [`emphasis.ts`](../src/lib/emphasis.ts)
  beside `splitHeadingAccent`, which is a DIFFERENT function from the starter's
  (it returns `HeadingAccentParts | null`, caps an accent at 24 characters, and
  is rendered through by `SectionHeader.astro` and `CtaBanner.astro`). Splitting
  the module to share about forty lines would touch public rendering code for no
  behaviour gain, and this repo's version is the better one anyway: it refuses to
  OFFER a word the matcher would then refuse to match. Left per-repo on purpose.
- **`tool-theme.ts` carries two extras the canonical `styles.ts` does not know
  about** — `TOOL_ACCENT` (the brand navy for a selected chip or row) and
  `dialogReset` (this repo's cards are real `<dialog open>` elements, so they
  reset the user-agent layout). Both are spread onto canonical styles by the card
  components. They fold back into the library the day a second repo wants them,
  not before; adding either to the shared `ToolTheme` today would force a copy
  into every sibling repo for nobody's benefit.

## Preview fidelity: 10 section bridges still fetch published-only (2026-08-29)

Found in the volunteer walkthrough: a section component that calls `cmsFetch`
itself reads the PUBLISHED perspective even inside the Studio preview, so a
draft never shows there. The two money surfaces are fixed (the tuition
calculator and the class-cards fees now ride `PAGE_BY_SLUG_QUERY`, which is
draft-aware through `previewFetch` — same pattern as `tuitionTableSection`).
Still published-only in preview: AlbumSection, BoardMembersSection,
CampaignSection, DownloadsSection, InstagramSection, JobsSection,
LatestPostsSection, LogoStripSection, ProgramCardsSection,
UpcomingEventsSection. Live pages are unaffected (published is correct there).
Fix pattern when one starts to matter: move the feed into the page query
under a `_type == "..." =>` arm and keep the component fetch as the fallback
for renderers that skip the page query (the hub body).

## Pre-staff-handoff testing (2026-08-29): findings

An in-depth "act as a volunteer, then try to break it" pass. Fixed items
shipped this session; the two below are decisions/setup left for a human.

### 1. Anti-spam is built but OFF, and covers only 2 of 4 public write forms

Turnstile verification is wired and DORMANT - it turns on when
`TURNSTILE_SECRET_KEY` (Worker secret) and `PUBLIC_TURNSTILE_SITE_KEY`
(env var) are set. See docs/FORMS.md. **Before the public launch, set
those keys.** Two gaps:

- Only `/api/contact` and `/family-hub/api/photo-submit` verify the
  token. `/api/testimonial` and `/api/subscribe` are public, write to
  Sanity on every POST, and have ONLY the honeypot. A non-browser
  script can spoof the Origin header (so the CSRF check does not stop
  it) and skip the honeypot field, then flood the board's review inbox
  and newsletter list, burning the Sanity write quota. Extending the
  dormant Turnstile check to those two endpoints (and rendering the
  widget on their forms) is a small, low-risk follow-up - worth doing
  in the same pass that activates the keys.
- There is no rate limit on any endpoint. Turnstile is the intended
  defence; if it proves not enough, a Cloudflare dashboard rate-limit
  rule on `/api/*` needs no code.

### 2. Adding a class - BUILT DOWN TO 2 STEPS (2026-08-29, same day)

The 4-step finding below was closed the same day: `classCardsSection`
gained an "All classes, automatically" source mode (the Home / Enroll /
Visit / A Day rows now use it; the Pre-K page's 2-class row stays
manual), the Classes dropdown gained `autoClasses` (derives one link per
class page, longest-prefix matched so Pre-K AM + PM share the
classes/pre-k link; hand links like "A Day at WCP" follow), and the
class doc gained a "Create its page" action that scaffolds the detail
page from an existing class page as a draft. What remains manual is
exactly the content: writing the new page's words and photos, and any
deliberately curated card row. `scripts/patch-class-surfaces-auto.mjs`
(ran 2026-08-29) flipped the existing content; parity held 27/27.

## Waiting on a human

- **Mint the Cloudflare analytics token, then round-trip "Site stats" (added
  2026-08-28).** The Studio's new **Site stats** tool (Public website
  workspace) is inert until one Worker secret exists. Two steps, in order:

  1. **Mint and set the token.** Full walkthrough in
     [SANITY.md → Site stats](SANITY.md#site-stats-the-traffic-panel-added-2026-08-28).
     Short version: dash.cloudflare.com → My Profile → API Tokens → Create
     Custom Token, ONE permission (**Account · Account Analytics · Read**),
     scoped to the one account, then from `site/`:
     `npx wrangler secret put CF_ANALYTICS_TOKEN`. `CF_ACCOUNT_ID` is already
     in `wrangler.jsonc` vars (it is not a secret). Until the token is set the
     endpoint returns a plain 503 naming it, and the tool says "not set up
     yet" — nothing else on the site is affected.
  2. **Round-trip it in the DEPLOYED Studio.** Open `/studio/#/public`, open
     any page's **Presentation** tab once (that is what issues the preview
     cookie the endpoint checks), then click **Site stats**. Expect two
     totals, a 28-bar chart, and no error card.

  **The one thing local gates could NOT prove:** which time dimension
  Cloudflare's `workersInvocationsAdaptive` dataset accepts. There is no
  analytics token on this machine, so the query was never run. The endpoint
  asks for `date` first and falls back once to `datetimeHour`; if BOTH are
  rejected the tool shows Cloudflare's own message verbatim ("Cloudflare could
  not answer: ..."). If that appears, the fix is a field name in
  `src/pages/api/stats.ts` (`QUERY_BY_DATE` / `QUERY_BY_HOUR`) — the bucketing
  in `src/lib/site-stats.ts` already handles either shape. A `403` instead
  means the token is missing **Account Analytics · Read**.

- **Verify "Publish later" and "Copy share link" in the DEPLOYED Studio (added
  2026-08-27).** Both shipped this session (ported from the starter; see
  docs/SANITY.md). Every local gate passes (types, lint, format, 381 unit tests,
  build, 27/27 parity, and a real dry run of `scripts/publish-due.mjs` against
  the production dataset, which found nothing due). Neither can be exercised
  locally: the Studio is blank under `npm run dev` (spaces-in-path gotcha), and
  a share link needs HTTPS because the preview cookie is `secure`. After the
  next deploy, do two round trips:
  1. **Publish later.** Open a low-stakes page, `Publishing` tab, set **Publish
     automatically at** a few minutes ahead, and leave it as a DRAFT. Within
     about half an hour it should publish itself, the field should be empty on
     the published page, and a Deploy run should follow. If nothing happens,
     open the **Publish scheduled drafts** workflow in the Actions tab: the gate
     job warns out loud when `SANITY_TOKEN` is missing, and a manual run
     (`Run workflow`) reproduces it on demand.
  2. **Copy share link.** On the same page use `Copy share link` (publish menu,
     or the `⋯` menu in the page list), then open the link in a private window
     with no Sanity login. It must show the DRAFT. Note that it stops working
     after about an hour, by design. Family Hub pages deliberately have no share
     link — see `src/sanity/urls.ts` before "fixing" that.

- **Verify the safe-rename redirect in the DEPLOYED Studio (added 2026-08-27).**
  Renaming a published page now files its own redirect at publish time
  (`src/sanity/actions/slugRedirect.tsx`, wired in `sanity.config.ts`). Every
  local gate passes (types, lint, format, 363 unit tests, build, 27/27 parity),
  but the action only RUNS in the browser, and `/studio` is blank under
  `npm run dev` on this machine (the spaces-in-path gotcha), so the runtime path
  is unexercised. After the next deploy, do one round trip: open a low-stakes
  published page, change its **Web address (slug)**, press `Publish`, and check
  (1) a green "Old link kept working" toast appears, (2) a new entry shows under
  **Site setup -> Redirects** reading `old -> new`, and (3) after the rebuild the
  old address forwards. If the toast never appears, the wrapper is not being
  applied — look at the `actions` resolver in `sanity.config.ts`. Publishing is
  never blocked by this code, so a failure here is cosmetic, not destructive.

- **DECISION: adopt a staging branch (2026-08-28).** This is the one repo in
  the site family that commits straight to `main`, and `main` auto-deploys.
  The presacademy flow (`staging` first, fast-forward `main` to release) adds
  a review beat with no other cost. Not worth disrupting work in flight for.
  The switch is one session: create `staging` from `main`, retarget the local
  habit and the docs (CLAUDE.md Deploy & CI, this file), and decide whether
  `deploy.yml` keeps firing on `main` only (it should). Adopt at the start of
  the next planned multi-commit change.

- **Set the `SITE_URL` repo variable so the uptime check can run** (added
  2026-08-27). `.github/workflows/uptime.yml` curls four live pages every hour
  and tells you through GitHub when one stops answering 200. It skips with a
  warning until the variable exists. Set it in GitHub -> Settings -> Secrets and
  variables -> Actions -> Variables -> New repository variable, named
  `SITE_URL`, valued `https://wcp-website.nathanjnixon86.workers.dev` (change it
  at the domain cutover). See [TESTING.md](TESTING.md).

- **Re-share the Orientation Slide Deck.** The first link-health run (2026-08-17) found the
  Documents page's "Orientation Slide Deck" link answering HTTP 403 — families who tap it get
  Google's access-denied page. Open the file in Google, set sharing back to "Anyone with the
  link", and paste the fresh link into Studio → Family Hub → Documents & Forms → that entry.
  The next Monday check (Family Hub → Link health) should show the row green.

- **Replace the Pre-K class-pet placeholder with a real photo of Pickles.**
  `scripts/patch-prek-pet-splitmedia.mjs` (run 2026-08-16) converted the Pre-K
  class-pet blurb from a centered proseSection into a `splitMediaSection`, so it
  now matches the Twos page's Kit the Kat block. It carries a generated
  placeholder image ("A photo of Pickles goes here") so the layout is real.
  Swap it in Studio -> Family Hub -> Pre-K Classroom -> the class-pet section ->
  the row's image, and rewrite the alt text to describe the actual photo (it
  currently says it is a placeholder, which a screen reader will read aloud).
  The PM class has not named its pup yet, so the copy stays as seeded until it does.

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
- **Board sets the co-op hours goal** (Studio → Family Hub workspace → Hub
  settings, since 2026-08-23) — until then `/family-hub/hours` shows its
  designed empty state.
- **Update the Sanity webhook filter in the dashboard** to match the
  2026-07-17 list in [SANITY.md](SANITY.md) / `deploy.yml` (drop the dead
  `classNote`, add `hubPage`, `teacherNote`, `presidentNote`, `signupSheet`,
  `signupEntry`).
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
