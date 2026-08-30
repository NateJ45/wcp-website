# Family Hub — how the gate works & how to run it

The Family Hub (`/family-hub/**`) is the private, enrolled-families-only area. Unlike
the marketing pages (which are static HTML built ahead of time), every hub page is
**server-rendered on each request** so it can (a) check you're signed in and (b) read
private content that must never sit in the public site or in git.

> 🔒 **The gate is CLOSED and enforced.** It was not always: `src/middleware.ts` shipped
> with a `const HUB_OPEN = true` preview bypass that was never flipped back, which left
> the directory, the photo wall and the health page readable by anyone. Closed 2026-07-19,
> along with the tests that would have caught it (`tests/hub-gate.spec.ts`).
> **Never add a bypass flag here again** — the middleware is the only gate, and a flag
> that silently opens 23 pages of family data is not worth the preview convenience.
> To browse the hub locally, sign in with the `.dev.vars` password like anyone else.

## How the gate works

1. **Middleware** (`src/middleware.ts`) runs on every request to a `/family-hub/*` page
   and every `/_server-islands/*` render. If you have no valid session it redirects you
   to `/family-hub/login`, remembering where you were headed (`?to=…`) so you land there
   after signing in. Server-island requests get a bare `401` instead, because an island
   fetch cannot follow a redirect.
2. **Login** (`/family-hub/login`) takes the one shared family password and POSTs it to
   `/api/hub-login`, which compares it (constant-time) to the `FAMILY_HUB_PASSWORD`
   secret. On a match it stores a **fingerprint of the password** in the `HttpOnly`
   session cookie and sends you on.
3. **Sign out** posts to `/api/hub-logout`, which destroys the session.

### Why a fingerprint and not a `true` flag

The session stores `sha256("wcp-family-hub:v1:" + password)` rather than a boolean, and
the middleware re-derives and compares it on every request (`src/lib/hub-auth.ts`). That
is what makes rotation work: change the secret and every existing session stops matching
on its next page view, with no session store to purge. A static `true` flag would have
survived rotation forever, so a family who left the school would keep their access.

Two rules follow, and both are enforced by unit tests:

- **It fails closed.** A missing or blank `FAMILY_HUB_PASSWORD` locks the hub rather than
  opening it. A misconfigured deploy should be loudly broken, not silently public.
- **Legacy sessions are rejected.** Sessions created before 2026-07-19 hold the boolean
  `true`, which is not a valid fingerprint, so everyone signs in once more after this
  change. That is intended.

### Staying signed in

`session.cookie.maxAge` in `astro.config.mjs` is set to 400 days (the ceiling browsers
honour). Astro's default is no `maxAge` at all, which makes it a browser-session cookie
that dies when the family closes their browser — "sign in once" would have meant "sign in
constantly". `session.ttl` is deliberately left unset: the password fingerprint is the
expiry mechanism, and a second invisible server-side timer would only sign families out
for reasons they cannot see.

The password is a **single shared password for the whole school**, rotated each year —
not a per-family login. That matches the old Squarespace hub and keeps it simple for a
volunteer board.

## The hub shell

Every `/family-hub/*` page renders inside `HubShell` → `BaseLayout chrome="hub"`, which
draws the hub's persistent chrome:

- **Desktop (≥ `lg`):** a sticky left navigation **rail** (`HubRail.astro`), built from the
  single grouped nav config in `src/data/hub-nav.ts` — Home, Classes (SELF-FILLING: the
  group carries `autoClasses`, so its links are derived from the `class` documents, one per
  classroom page — see "Class pages are DERIVED" below), News & Events,
  Resources (Getting Started, Become a Super Helper), Money, Community (Directory, Co-op
  Jobs, Celebrations, the external Store link), each group with its own accent color — the active page highlighted, a
  light/dark `ThemeToggle`, and Sign out. Above Sign out sits a **Follow WCP!** row —
  Facebook/Instagram icons reading the SAME Site settings links (and show-socials switch)
  as the public footer, over the Board-content cache, so the Board edits them in one place
  (Studio → Public website → Site settings). The rail collapses to an icon rail
  (`hub-rail.ts` persists the choice in localStorage; BaseLayout sets the attribute early
  so there's no flash).
- **Mobile (< `lg`):** a navy top strip (`HubTopBar.astro`: menu button, page title,
  search icon, bell, theme toggle, logo) whose menu button opens
  the same nav as a slide-in **drawer** (`HubRail` rendered a second time as the drawer's
  contents). `src/scripts/hub-drawer.ts` handles open/close, a focus trap, Esc-to-close, a
  backdrop tap, and body-scroll lock — progressive enhancement over inert markup already in
  the DOM.

Sign out still posts to `/api/hub-logout` (unchanged). The rail is a fixed navy "island" —
it looks the same in light and dark mode, unlike the marketing pages' theme-reactive
surfaces — so its colors are hardcoded rather than pulled from the `--color-*-ink` tokens
(those flip to the bright brand tier in dark mode for text-on-dark-page use, which would
undo the AA contrast fix on a fixed fill; see the comment in `HubRail.astro`).

`/family-hub` (Home) is the at-a-glance dashboard rendered inside that shell, laid out as a
**bento grid** (12 columns; tile size encodes importance, with a staggered reveal on load):
`HubGreeting` (the navy-gradient hero tile — sun-and-cloud emblem, time-of-day greeting,
community chips, and the school-year progress bar; a theme-stable navy island like the rail),
`ClassHelperRow` (the four class helper-schedule tiles), and six `HomeWidgetCard`-based
widgets — Upcoming Events, Announcements, Fundraising, Meeting Minutes, Class Photos, and
Budget Snapshot — all wired to live school data (see the table below).

### Live data sources (the wired widgets)

The dashboard reads real school data server-side behind the gate, carried over from the old
Squarespace hub. Each source's link/id is **Board-editable in Sanity**, with the current
working values as per-field fallbacks in `src/data/hub/live-links.ts`:

| Widget / feature                    | Live source                                                      | Edited at                                                                 |
| ----------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Class helper-schedule tiles         | Per-class Google Sheets                                          | each `class` doc → **Helper schedule link**                               |
| Class Photos                        | Google Photos albums                                             | each `class` doc → **Class photo album link**                             |
| Budget Snapshot                     | Budget Sheet "Budget" tab (gviz, `src/lib/gsheets.ts`)           | Site Settings → **Budget Google Sheet ID**                                |
| Fundraising (widget + page totals)  | Budget Sheet "Fundraising" tab                                   | same sheet id; treasurer edits the sheet                                  |
| Upcoming Events (widget + Calendar) | Google Calendar via Apps Script feed (`src/lib/hub-calendar.ts`) | Site Settings → **Calendar feed link**; falls back to Sanity `event` docs |

> The feed's Apps Script source is committed at
> [`scripts/apps-script/calendar-feed.gs`](../scripts/apps-script/calendar-feed.gs) (full setup
> steps in its header), so the web app can be redeployed from ANY Google account that can at
> least SEE the school calendar — it is not tied to the account that first created it (that
> account was lost in 2026-07; ownership map in [GOOGLE.md](GOOGLE.md)). Redeploying means:
> subscribe to the calendar, paste the file into an Apps Script project, deploy as a web app,
> run `setupTriggers` once (daily watchdog email + weekly Drive JSON backup), and update the
> Calendar feed link in Site Settings (queued right now — see [PENDING.md](PENDING.md)).
> Since 2026-07-17 the feed also serves `end` + `description`, which light up the event
> dialog's time ranges and details automatically.

| Calendar subscribe buttons | built from `googleCalendarId` | Hub settings → **Google Calendar code** |
| President's note (first-visit modal) | `presidentNote` singleton (live read) | Family Hub → **President's note** (bump the version stamp to re-show) |
| "What we've raised together" band | past-year grand totals (Fundraising page navy band) | Site Settings → **Past fundraising totals** (add the just-ended year each fall) |

Every fetch is try/catch'd with a short timeout — a failed source degrades to the designed
empty state, never a broken card. Seed/refresh the letter with
`node scripts/seed-president-note.mjs`.

### Home dashboard settings

The greeting hero and progress bar read four optional `siteSettings` fields (Studio → **Site
Settings → School year tab**): `yearStart` and `yearEnd` (drive the school-year progress bar),
`firstDay` (drives the "N days until school" countdown before the year starts), and
`familyCount` (an optional override for the family count shown on the dashboard; leave it blank
to use a live count of opted-in Directory families instead — that live count is
`DIRECTORY_FAMILY_COUNT_QUERY`, which counts opted-in entries **that have children**, so the
teacher/admin entries in the Directory aren't counted as families. It measures the DIRECTORY,
not enrollment: a family who opts out is enrolled but uncounted, so set the override here when
the number needs to be true enrollment). All four are meant to be **filled
in by hand in the Studio at the start of each school year** — there's no migration script for
them, unlike the Directory import.

### The app-surface layout (every section page)

Every inner section page (Updates, Calendar, Documents, Directory, Health, Tuition,
Fundraising, Co-op Jobs, the two merged class pages) is laid out as **one app surface**, matching
the Home dashboard rather than a marketing page stacked in the shell. The pattern:

- `HubShell` with the **`bare`** prop — no navy title band. The page opens on the grey app
  canvas (`<Section bg="grey">`) with a compact, left-aligned **`HubPageHeader`** (icon chip +
  title + one-line subtitle + optional right-aligned action). `HubPageHeader` owns the page
  `<h1 id="hub-page-title">`. Home is `bare` too — its `HubGreeting` card owns the `h1`.
- Content lives in one card vocabulary: **`HubCard`** (`src/components/hub/HubCard.astro`) —
  a plain panel, a titled panel (`icon`/`title` + `slot="action"`), an interactive link
  (`as="a"`, whose header icon pops on hover), or a list item (`as="li"`). Progress bars go
  through **`HubProgress`** (the fill grows in from the left on load). The `server:defer` widgets'
  `HubWidgetSkeleton` fallback carries one `wcp-shimmer` light sweep while it loads.
- **Empty states** everywhere via `HubEmptyState`. **Icon-chip convention:** neutral is
  `bg-sky/15 text-sky-ink`; class-specific is `classStyles(slug).iconChip`; semantic
  (money/health/celebration) only where it carries meaning.
- **The data expression kit** (2026-07-14 app-elevation Track C, all in
  `src/components/hub/`, all server-rendered, zero client libraries): **`HubStat`** (big
  tabular-numeral KPI + label + optional delta chip; `tone="navy"` variant reserved for the
  Home command strip; opt-in `countUp` animates a plain-number figure up from 0 on scroll-in
  via `scripts/countup.ts` — reduced-motion-safe, used on the command strip's "days 'til school"
  and "families"), **`HubRing`** (SVG progress ring, same clamped-percent ARIA contract as
  `HubProgress`; fill sweeps in on load), **`HubSpark`** (tiny `aria-hidden` sparkline — honest
  series only, real numbers always adjacent in text; bars grow / the line strokes itself in on
  load, pure CSS so it plays even inside a deferred widget island), **`HubPill`** (the ONE status-pill vocabulary: `new` /
  `open` / `waitlist` / `important` / `due` / `past`; extend the set in the component, never
  improvise a pill on a page), and **`HubTable`** (styled table shell whose rows stack into
  cards below `md` via `data-th` cell labels). See
  [the elevation plan](superpowers/specs/2026-07-14-family-hub-app-elevation-plan.md).
- **Premium-screens primitives** (2026-07-14, see
  [that plan](superpowers/specs/2026-07-14-hub-premium-screens-plan.md)): **`HubSegmented`**
  (link-based segmented control, `?view=` links the SERVER resolves — for 2-5 parallel
  views of one page, first consumer: Documents) and **`HubDisclosure`** (the ONE styled
  `<details>` accordion — progressive disclosure for long prose; native element, so
  keyboard/find-in-page/no-JS all work). Page-level filters follow the Directory pattern:
  real links (`?class=…`), never JS state. The **answer-first rule**: a hub page's first
  viewport carries state and actions; framing prose moves below or behind a disclosure.

**Accessibility landmines this layout hit (all now guarded by `npm run test:hub`):**

- **Colored `-ink` text on a soft color tint fails AA in dark mode.** `text-sky-ink` on
  `bg-sky/15`, `text-orange-ink` on `bg-amber/25`, etc. — in dark mode the `-ink` token
  aliases to the bright tier and the tint darkens, dropping contrast to ~4:1 or worse. Soft
  tints are safe **only** behind an `aria-hidden` icon, with the **label text in a neutral
  color** (`text-heading`/`text-ink`/`text-ink-muted`). This is why the calendar legend and
  the update audience/pinned chips use neutral labels.
- **Soft-tint chips darken further on the grey canvas** (tint over grey, not white). Keep
  tinted chips inside white `HubCard`s, not directly on the `bg-grey` page.
- **The class-color `badge`** (`classStyles(slug).badge`, white on the class fill, used on the
  Directory photo overlays) pins the light-mode `-ink` hex directly — the `-ink` token flips
  bright in dark mode and white-on-bright fails. A photo overlay is theme-independent, so the
  fill stays the dark AA-safe shade in both modes (same reasoning as the hub rail).

## One-time setup (before the first deploy)

Run these from the `site/` folder. You only do this once.

```sh
# 1. Create the KV namespace that stores sessions, then paste the printed id
#    into wrangler.jsonc under kv_namespaces → "id".
npx wrangler kv namespace create SESSION

# 2. Set this year's family password as a Cloudflare secret (you'll be prompted
#    to type it — it is never stored in git).
npx wrangler secret put FAMILY_HUB_PASSWORD
```

That's it for the gate. Deploy as usual with `npm run deploy`.

## Rotating the password (each school year)

```sh
npx wrangler secret put FAMILY_HUB_PASSWORD   # type the new one
```

**Rotating the secret signs everyone out.** Because the session holds a fingerprint of the
password rather than a "logged in" flag, every existing session stops matching the moment
the new secret is live, and every family is asked for the new password on their next page
view. That is the point: it is how a family who has left the school loses access. Email
the new password to families in the welcome message _before_ you rotate, or you will get
a round of "the hub stopped working" messages.

No session store needs clearing, and there is nothing to purge in the SESSION KV
namespace — stale entries simply stop validating.

## Local development

- `.dev.vars` (git-ignored) holds a throwaway dev password: `FAMILY_HUB_PASSWORD="wcp-test-2026"`.
- `npm run dev`, then visit http://localhost:4321/family-hub — you'll be bounced to the
  login page; sign in with the dev password to get through.
- `.dev.vars.example` is the committed template showing what to put in `.dev.vars`.

## Where the private content lives

Hub page content (calendar, documents, directory, health, finances, per-class info) is
**not** in this repo. It lives in **Sanity**, read at request time behind this gate with
a server-only token. That keeps real family names, addresses, health and financial
details out of the public GitHub repo entirely.

## Section pages — current status

All section pages are **built with their real layouts** from the current live hub
(tuition rates + pay buttons, the document library, class facts, co-op role descriptions,
health/illness policy, event-type legend, and so on), and every page's heading, intro, and
body sections are Board-editable through the page-builder (see "Editing hub pages" below).
Each page's live/private data reads from Sanity behind the gate:

| Section                       | Live data source                                                                                                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Calendar                      | Google Calendar feed → agenda list + our own branded month grid (`HubCalendarGrid`); `googleCalendarId`/feed in Hub settings                                      |
| Fundraising                   | `campaign` docs (Treasurer updates the raised amount in the Studio)                                                                                               |
| Updates                       | `update` docs (the migrated meeting blog; `category` = announcement/minutes)                                                                                      |
| Documents                     | `hubDocument` docs                                                                                                                                                |
| Co-op Jobs                    | `coopRole` docs (the seats AND the chart's shape) + `roleHolder` docs (the people)                                                                                |
| Classes                       | `class` docs (the whole page: facts, colour, icon, links, tuition button) + an optional `hubPage` naming them (the handbook) + `teacherNote` docs (welcome modal) |
| Tuition                       | `class` docs (rates + PayPal button) + the `feeSchedule` singleton                                                                                                |
| Directory, Health (per-child) | `directoryEntry` docs / per-child info — opt-in PII, gated only                                                                                                   |
| Sign-ups & RSVPs              | `signupSheet` docs (board creates) + `signupEntry` docs (families respond)                                                                                        |

Where a data source is empty, the page shows a designed empty-state that names its source.
Fallback layout content lives in typed data files under `src/data/hub/` and
`src/data/classes.ts`, so a fixed widget always renders. Nothing in those files is PII (no
family or board-member names, addresses, phones, or finances).

## Sign-ups & RSVPs

`/family-hub/sign-ups` is the co-op's SignUpGenius replacement. The board creates
`signupSheet` docs in the Studio (**Family Hub → Sign-ups & RSVPs**): either a
**sign-up sheet** (named slots, optional per-slot capacity — helper shifts, snack days,
workday jobs) or an **event RSVP** (one tap, a live "N families are coming" count; used
instead of per-event RSVP because calendar events live in Google, not Sanity, and have
no stable identity to hang responses on). Families respond on the page; each response
posts to `/family-hub/api/signup` (inside the hub prefix, so the middleware gate covers
it), which validates open/slot/capacity server-side, stores a `signupEntry` doc (the
count source and the board's Studio inbox), and forwards a row + FYI email through the
Google forms inbox when configured (see [FORMS.md](FORMS.md)). Forms work without JS
(native POST → redirect with `?thanks=1`); `src/scripts/hub-signup.ts` upgrades them to
background submits. Two clearly-titled example sheets are seeded by
`scripts/seed-signup-examples.mjs`.

## My Co-op Hours

`/family-hub/hours` is the family-facing volunteer-hours ledger (a co-op asks each
family for N hours a year). The board sets the per-family annual goal in **Site
Settings → School year → Co-op hours per family**; leave it blank/0 to hide the whole
tracker. Because the hub has **no per-family login** (one shared password; identity is
device-local), a family identifies itself by the name it types — carried in the
`?family=` query so it works with no JS, and remembered in `localStorage`
(`wcp-family-name`) so it auto-loads next visit (`src/scripts/hours.ts`). The page shows
that family's progress bar (`summarizeHours` in `src/lib/coop-hours.ts`, unit-tested for
the divide-by-zero/NaN edges), a verified-vs-pending breakdown, and a log-hours form.
Logging posts to `/family-hub/api/log-hours`, which stores a `hoursLog` doc (`source:
"self"`, `verified: false`) and forwards an FYI through the Google forms inbox (kind
`hours`). The board confirms rows in the Studio (**Family Hub → Co-op hours (ledger)**)
by flipping **Verified**, and can also credit hours directly there (`source: "board"`).
Reads are `fresh` so a family's just-logged row shows on reload; the per-family name is
communal knowledge inside the gate, but the ledger is never baked into the public site.
A page-wide line totals the whole school's logged hours.

## Family Photos (moderated)

`/family-hub/photos` is a families-only, moderated photo album. A family uploads a
photo (with an optional caption) through the form; the browser **never writes to
Sanity directly** — it posts to `/family-hub/api/photo-submit`, which holds the server
token, and the upload lands as a `photoSubmission` with `approved: false`. Only after a
board member reviews it in the Studio (**Inboxes → Family photos (review)**) and flips
**Approved** (then Publishes) does it show in the gallery. These are photos of children,
so they are **gated and moderated by design and never appear on the public site**.

Abuse guardrails on the upload endpoint, in order: a honeypot (silent drop); Cloudflare
**Turnstile** when configured (`PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`, the
same dormant widget as the contact form); a content-type allowlist (JPEG/PNG/WebP) that
also **sniffs the leading bytes** so a spoofed `File.type` can't smuggle a non-image
through; and an 8 MB size cap checked before the upload. The endpoint is already behind
the middleware gate, so only signed-in families can reach it. Uploading optionally
forwards a "photo pending" note to the Google forms inbox (kind `photo`). No-JS uploads
work via a native multipart POST; `src/scripts/photo-share.ts` upgrades them.

A related nicety: the site is installable (a PWA manifest with maskable icon and
hub/calendar shortcuts), so families can pin the hub to their phone's home screen —
there is deliberately **no service worker** (the SSR hub must never serve stale).

## The app layer (2026-07 "feel like an app" pass)

- **Bottom tab bar on phones** (`HubTabBar`, < md): Home / Calendar / Documents /
  Updates / More (More opens the drawer). Theme-stable navy island; BaseLayout pads
  `main` so content clears it.
- **Event details dialog everywhere** — the Calendar page's `HubEventDialog` is shared
  with the home dashboard: Upcoming Events widget rows are real links to the Calendar
  page that `hub-event-dialog.ts` upgrades to open the details dialog in place. The
  widget is a server island, so it ships its own `[data-hub-events]` JSON blob and the
  script collects blobs LAZILY at click time (the island streams in after the load-time
  scan) — keep that pattern for any new island-hosted dialog trigger.
- **bfcache + cross-browser hardening (2026-07-17)** — scripts that tear down on
  `pagehide` rebuild on `pageshow persisted` (`hub-fresh`, `countdown`, `DirectoryMap`,
  `reveal`); menus close on `pointerdown`; the full rules live in CLAUDE.md's
  "Colors, dates & cross-browser" gotchas.
- **Search (Cmd/Ctrl+K)** — `HubSearch` dialog + `hub-search.ts`, fed by the gated
  `/family-hub/api/search-index` (hub pages from `hub-nav.ts`, updates, documents,
  open sign-up sheets). Triggers: the phone strip's icon and the desktop topbar's
  search field (top-anchored on phones so the iOS keyboard can't cover the results;
  the triggers hide themselves on browsers without `<dialog>`).
  **Full text, not just titles** (2026-07-18): the index also carries the WORDS
  inside every page-builder section — prose, card bodies, FAQ answers, schedule
  rows, and image ALT text — so "snow day" finds the closing-policy section, not
  nothing. Shaping lives in `src/lib/hub-search-index.ts` (unit-tested); the
  endpoint indexes the stored sections directly (the quota-era stopgap layer
  that once rewrote them in code was retired 2026-08-04).
  Three rules hold it together:
  - **The Directory is never indexed.** Family names, emails, and phones are PII
    and this response is cached (board cache + a browser `Cache-Control`). The
    Health page IS indexed — that doc is Board policy, not per-child records.
    Note meeting-minutes updates do list attendee names in their bodies.
  - **Only sections with a heading get a `#sec-` deep link**, because
    `HubSectionedBody` only emits that id when a header title exists. Linking to
    an absent anchor scrolls nowhere.
  - **Routes resolve by CONVENTION, not a registry.** `hubPageRoute()` takes
    `/family-hub/<hubKey>` when hub-nav says that page exists, so a hub page
    added later indexes itself. Two escape hatches: `HUB_PAGE_OVERRIDES` for the
    routes that don't match (`home` →
    `/family-hub`), and `HUB_PAGE_DENY` for docs that must never be indexed
    (`directory` = PII). Deny always wins over convention. The route set the
    convention is checked against is the resolved nav WITH its classroom pages
    filled in, so a class the Board adds is searchable — page name and handbook
    words — the day it publishes.
    This replaced a hardcoded allow-list that failed silently — add a page,
    forget to register it, and search omitted it forever.

  Payload: ~61KB raw / ~20KB gzipped, fetched once per 5 min via
  `Cache-Control: private, max-age=300`. That header matters because the site has
  no `ClientRouter` — every navigation is a fresh document, so the script's
  module-level promise cache dies with it and the index would otherwise be
  re-downloaded on the first ⌘K of every page.

- **Desktop topbar** (2026-07-14 app-elevation Track A, in `HubTopBar.astro` alongside
  the phone strip): a floating sticky bar (`h-10` + `m-2` gutter, ~56px total) over the
  content column. On the left, a row of quick links to the things a parent wants on any
  page — the **Become a Super Helper** amber pill (the flagship ask), the device-class
  helper schedule and pay-tuition links (personalized from `wcp-my-classes` by
  `hub-quicklinks.ts`: a direct link for one class, a `<details>` dropdown for two+),
  the next event, the **Family Handbook** PDF (icon-only), and the latest update (whose
  title is `min-w-0` so it shows in full when the bar has room and truncates only on a
  narrow desktop). On the right, a visible search-field affordance for the palette and
  the what's-new **bell**. The dropdown menus are native `<details data-hub-menu>` —
  usable with no JS — and `hub-menus.ts` adds outside-tap (pointerdown — iOS Safari
  doesn't synthesize document-level clicks on non-clickable targets) / Escape closing. `HubTable`'s
  sticky column headers offset by `lg:top-14` to slide under this bar.
- **The bell** (`HubBell.astro`): server-renders the recent feed. **Eight feeds** reach
  it, all assembled once in `HubTopBar` and shared by both bell instances:

  | Feed               | Where it comes from                                                    | Row                                       |
  | ------------------ | ---------------------------------------------------------------------- | ----------------------------------------- |
  | Announcements      | `update` docs (+ the Board's `highlight` flag)                         | the post title → the post                 |
  | Spotlights         | live `hubSpotlight` docs                                               | the heading → re-opens the pop-up         |
  | Documents          | newest `hubDocument` docs                                              | the title → Documents                     |
  | Note bumps         | `teacherNote` / `presidentNote` with a version stamp, by `_updatedAt`  | "A note from ..." → the class page/home   |
  | New Board pages    | `hubPage` with a slug, no `hubKey`, not archived, carrying no classes  | "New page: ..." → the page                |
  | Events just added  | Google feed `created` + Sanity `event._createdAt`, both inside 14 days | "Added to the calendar: ..." → Calendar   |
  | Events rescheduled | Google feed `updated` inside 14 days on an event whose add is older    | "Updated on the calendar: ..." → Calendar |
  | Fundraising        | the cached gviz Fundraising tab, at 50% / 75% / 100% of the goal       | "Fundraising passed 75% ..." → the page   |

  Every Sanity feed rides ONE `BOARD_CONTENT_CACHE`-tier query; the calendar and the
  fundraising sheet reuse the cached getters the bar already calls, so the bell adds no
  external fetch and no KV key. The query holds no date window and no threshold — the
  cache keeps the raw readings and the rules run per request (see CLAUDE.md, "cache the
  reading, never the copy").
  The rules are pure and unit-tested in [`src/lib/hub-bell.ts`](../src/lib/hub-bell.ts):
  the 14-day window, the milestone thresholds, the calendar added/updated/recurring rules (`calendarBellRows` - a recurring series never announces, an add and an edit never both announce), and the merge. **The merge caps each feed
  (2 rows, updates 4) BEFORE it merges**, so a busy feed cannot starve a quiet one — three
  documents uploaded in one evening must not hide this morning's note bump. Spotlights and
  Board highlights pin to the top with an amber "Important" pill; the rest reads newest
  first, and the panel holds 9 rows.
  **The fundraising row carries NO date.** Nothing records when the campaign crossed 75%,
  so the row lists but never counts toward the unseen badge — `hub-fresh.ts` skips a row
  whose `data-published` will not parse, which is the honest behaviour.
  `hub-fresh.ts` adds the unseen-count badge and marks everything seen when a panel is
  opened.

- **Persistent-shell view transitions**: the rail, both top bars, and the tab bar carry
  `view-transition-name`s (globals.css), so hub→hub navigations hold the shell still
  while only the content cross-fades — the app feel without client routing. Motion-only
  (named under `prefers-reduced-motion: no-preference`).
- **My classes** (`my-class.ts`, localStorage `wcp-my-classes`, no accounts):
  MULTI-select toggle chips on the home dashboard (plenty of families have kids in
  more than one class); each picked class's helper tile moves to the front with a
  "Your class" tag, its photo album gets a ring, and its rail link gets a dot (two
  classes sharing one classroom page never double-dot it).
  **The class list is DATA, not code.** `HubRail` prints it once per page as a
  `<script type="application/json" data-hub-classes>` block — slug, label, and the
  classroom page each class lives on — straight from the `class` documents. The
  script reads that, so a class the Board adds appears in the picker, the tiles and
  the rail dots with no code change. It used to be a hardcoded map of the four
  2026-27 slugs, which is what made the hub blind to a new class.
  `hub-page-links.ts` reads the same block for its prose auto-links (a derived class
  target always requires the literal " page" suffix, because a class name is an
  ordinary word).
- **"New since your last visit"** (`hub-fresh.ts`, localStorage `wcp-updates-seen`):
  home announcement/minutes items newer than your last Updates visit get a "New"
  pill and the Updates links (rail/drawer/tab bar) a count badge; opening Updates
  (or a bell panel) clears it. Widgets carry `data-published` for this; bell-panel
  rows are excluded from the page tally (they duplicate page content) and drive the
  bell's own badge instead.
- **The Home command strip** (2026-07-14 app-elevation Track B): `HubGreeting` is the
  hub's one hero-tier DATA surface — greeting + date/weather chips, then a row of live
  deep-linking stats (days 'til school, next event from the cached calendar feed,
  families count, the fundraising-year `HubRing`) over the school-year bar. Every
  figure is real and SWR-cache-deduped with the widgets below; empty sources omit
  their stat. **Season-aware (2026-07-16):** before any money lands, the fundraising
  ring slot shows a forward-looking stat instead of a dead 0% meter — "N fundraisers
  lined up" + last year's grand total (Site Settings `pastFundraisingTotals`, fallback in
  `live-links.ts`) — and the school-year bar renders only once `yearPct > 0` ("0%" in July
  is noise; the countdown stat, now with a "First day: <date>" sub-line, owns the pre-year
  story). The Fundraising widget applies the same rule (stat + "Together we raised $X last
  year" until `totalRaised > 0`, then the ring), and Budget Snapshot's balance is a
  `HubStat`. The Upcoming Events widget caps the PHONE stack at 5 items + a "+N more on
  the calendar" link (`hidden lg:flex` on the tail) while lg+ keeps the full 12 for the
  tall bento tile. Layout note: the class-tile
  grid fills its bento row with `lg:flex-1` (wrapper is `lg:flex-col`), NOT `h-full` —
  a percentage height there resolves after intrinsic row sizing and overflows the cell
  into Announcements whenever the hero grows (bit twice on 2026-07-14).
- **Texture & flair**: the canvas is construction paper (grain + hand-drawn doodle
  tile, plus three soft brand washes baked into the same `.wcp-hub-canvas` background —
  navy top-left, orange top-right, sky bottom; light/dark variants, all UNDER the white
  cards so they never touch text contrast — globals.css "Hub canvas texture"; direct grey
  Sections render transparent over it). A **fixed WCP emblem watermark** (`.wcp-hub-emblem`,
  `position: fixed` bottom-right, overflowing the corner at ~5% opacity) floats over the
  paper but behind every card, held in place as the page scrolls; a page-grey backing plate
  (`.wcp-hub-emblem-plate`, a `--color-grey` disc one z-layer below it) fills the mark's own
  transparent gaps so the doodles don't read through the emblem. A warm glow sits behind the
  greeting and a
  class-colored one behind each class page header. The greeting carries an air-quality
  chip, an occasional "Today is ..." fun-day chip (curated, `src/data/hub/fun-days.ts` — NOT
  a live "national day" API, which would surface adult-only entries), and an NWS
  severe-weather/closure alert banner (`hub-air-quality.ts` / `hub-alerts.ts`); its foot
  holds a "today" weather RIBBON (today's high/low, condition line, rain chance, and a High-UV
  "hats and sunscreen" chip) that fills the tile's foot in place of the pre-season progress
  bar. The richer "Week ahead" band below (`WeatherWeekWidget`) gives 7 days, each with a
  colour-coded condition icon + one-word label, high/low, a temperature RANGE BAR (the day's
  span within the week's), the rain CHANCE %, and coat/umbrella/sunscreen pack hints; the
  Today tile is ring-highlighted. All weather is SWR-cached (Open-Meteo, `hub-weather.ts`,
  ONE daily call carrying temp + precip + UV) and hides on failure. The ambient sources run
  LONG cache windows (8h fresh / 16h stale) because every refresh is a CACHE-KV write against
  a near-capped free tier (see the KV write-budget gotcha above). Both the ribbon and the
  strip come from ONE fetch/cache key: the ribbon is `getWeather` = `getWeekAheadForecast`
  day 0, showing the day's HIGH (not an instantaneous reading, so the long cache can't make it
  look wrong). The forecast's cache key carries a `:v3` suffix — bump it on any day-shape
  change so a deploy fetches the new fields fresh
  instead of serving the old-shape envelope for up to 8h. Only the NWS alert keeps a short 1h
  window, since a sudden warning must catch up fast. Sign-up success fires a
  reduced-motion-safe confetti burst, and the very foot of the home dashboard carries a small,
  inconspicuous "giggle of the day" (`HubGiggle`, curated + deterministic in
  `src/data/hub/giggles.ts` — zero fetch, zero KV).
- **Prose auto-links itself** (client enhancement, progressive): two scripts scan the
  rendered hub content and turn plain text into links, because the copy is Board-editable
  Sanity content with no link marks and Sanity writes are quota-blocked (so it can't be
  re-authored at the source). `wcp-email-copy.ts` linkifies email addresses (+ desktop
  copy-to-clipboard); `hub-page-links.ts` linkifies cross-references between hub pages
  ("the **Documents page**", "See **Co-op Jobs**") to their routes. The page-linker is
  precision-first: case-sensitive proper-noun matching, common-word names (Documents,
  Calendar, Health, ...) require a literal " page" suffix while distinctive names (Co-op
  Jobs, Super Helper, Getting Started, Twos & Threes, Budget & Fundraising) link on their
  own ("Pre-K" is the in-between: too common to link bare, so it links as "Pre-K page" or
  as a parenthetical "(Pre-K)" — the teacher-list idiom on Getting Started),
  first-occurrence-per-target only, never self-links, and skips existing links /
  buttons / headings / code (opt out with `data-no-autolink`). Both are no-JS-degradable
  (plain text) and skipped in `/preview` so stega click-to-edit stays intact; links inherit
  the body colour + underline so they pass axe on any surface.
- **Cards are notes on the board** (`.hub-note`, globals.css — carried by both `HubCard`
  and `HomeWidgetCard` on top of their Tailwind base): a faint graph-paper grid + grain,
  and a faint brand-colour SURFACE tint whose colour rotates by list position (or is pinned
  per card via `--note-accent`, set on the six home widgets by meaning). Colour lives in the
  tinted surface + the icon chip, not a top/left strip — a card strip is an AI-slop tell
  (2026-07-16 design benchmark against Notion/Linear). Interactive (link)
  cards keep the standard HubCard hover-lift — the pinned/tilted look is reserved for the
  community photo wall (`SocialWallWidget`), not these cards.
  `HubCard`/`HomeWidgetCard` take a `postit` prop for a warm sticky-note fill (Announcements
  - Meeting Minutes use it); the tint tracks the theme so text tokens keep AA contrast. All
    of it is decorative and below the text, so `test:hub` axe holds in both themes.
- **Class pages** open with a **people row**: a `TeacherCard` (photo/name/role/**email +
  phone** straight from the class's `teacherNote` doc — the same fields that power the
  welcome modal; the card shows a **Say hi** (email) and a **Call or text** (phone) link)
  next to one `ClassRepCard` **per class the page covers** (Twos + Threes, or Pre-K AM +
  PM). Each class elects ONE parent rep in the fall; until then the rep card is a designed
  **"To be announced"** placeholder that reserves the seat. The rep SEAT is derived — one
  `coopRole` marked "one of these for every class", expanded per class by `classRepPerson()`
  in `src/lib/hub-org.ts` — so a class the Board adds gets a fillable rep card with no code
  change. Rep names and photos live only in the Studio (`roleHolder`). Their **contact
  details are never committed** -- a volunteer's email and phone are PII and this repo is public.
  The card's "Say hi" / "Call or text" links come from the Directory instead, read per
  request behind the gate: the page does ONE uncached read (`ROLE_HOLDERS_QUERY`) for its
  reps and passes the map down. Each rep's `roleHolder` links her Directory entry
  (`contactFrom`) and the query resolves the adult whose name matches **Who holds it**, so
  the details are typed once. Shaping + the `tel:` formatting live in
  `src/lib/hub-org.ts` (pure, unit-tested). A rep who opted out of the Directory,
  or whose name doesn't match, simply renders without links. Below the row, a `ClassAskGuide` box (**"Not sure who to
  ask?"**) splits **teacher vs. class rep** questions — grounded in `coop-roles.ts` + the
  class handbooks (teacher = the child, curriculum, routines, attendance, health-in-class;
  rep = the helping schedule, class updates, the class page, parties + Teacher
  Appreciation, the co-op job). Then the facts grid and a photo "How our day flows"
  `storyTimelineSection` seeded from each class's own schedule (`scripts/seed-class-stories.mjs`;
  the board swaps in real class photos in the Studio).
- **Signed sign-off CTA.** The handbook's **closing** CTA on a class page becomes a signed
  sign-off card: the teacher's headshot in a class-colour ring + **Email** / **Call or
  text** pill buttons (`TeacherSignoff.astro`), which stand in for the CTA's plain-text
  note. `HubSectionedBody` takes `signoff` (the classroom's teacher-note keys) and renders that
  page's LAST `ctaSection` through `CtaSection` with a `teacherSlug`, so a mid-handbook CTA
  never gets a signature. Contact comes from the same `teacherNote` (email + the
  2026-07-15 `phone` field); phone falls back to `teacherPhoneFallback` (`live-links.ts`)
  until the Studio field is filled — the numbers were already public in each handbook's
  closing note. Erin signs Twos & Threes; Mrs. Lisa signs Pre-K.
- **Curriculum guide PDFs.** The class-page header action row carries the handbook pill
  (`handbookUrl` from the class's `hubPage` doc) plus a **"Curriculum guide (PDF)"** pill
  linking a static, brand-styled PDF in `public/curriculum/` (`<key>-curriculum.pdf`, one per
  `curriculumGuide` document — a pill only appears when the document exists, and
  `generate-curriculum.mjs` renders a guide for any document, not just the shipped three; the
  Twos & Threes page shows one per class since the objectives
  differ, Pre-K shows one shared guide). These are NOT CMS-editable: the objectives + the
  layout are the SOURCE OF TRUTH in `scripts/generate-curriculum.mjs` (`npm run
gen:curriculum` re-renders them via Playwright/Chromium, fonts + emblem inlined). Edit the
  content there and regenerate; the originals were plain Word exports that still used the
  school's old name.
- **Supply list.** The same action row carries a **"Supply list (PDF)"** pill on both class
  pages, linking `public/supplies/supply-list.pdf` — one brand-styled one-pager covering
  every class, each list card in its class colour. The items are Board-editable in the
  `supplyList` singleton and its "Class" dropdown reads the LIVE classes, so a class the Board
  adds gets its own card (the generator derives the card's name and colour from the class
  document). The layout and the committed defaults live in
  `scripts/generate-supplies.mjs` (`npm run gen:supplies`), which also renders a 1080x1350
  social carousel (`public/supplies/social/*.png` — cover, one slide per class, wish list)
  for the Facebook/Instagram back-to-school posts. The filename is deliberately year-less
  so the pill links never rot; each fall update the school year + the items in the Studio.

## Spotlight pop-ups

A **spotlight** is a Board-managed pop-up that greets a signed-in family on **any** hub
page. It is the collection sibling of the President's note (one letter, hub home only) and
the answer to "the board wants to draw attention to the supply lists in August, the auction
in March, a store offer in December".

**Why a new `hubSpotlight` type and not the public `announcement`.** An `announcement` is a
STATIC-site thing: `getAnnouncements()` reads it through `src/lib/cms.ts` at BUILD time,
BaseLayout renders it only when `chrome === 'site'`, its `pages` field references public
`page` documents, and its placement model is public paths. A hub pop-up is read at REQUEST
time behind the password gate and links to hub routes, hub pages, updates, and the store.
Extending `announcement` would have coupled hub SSR to the build-time query path and grown
a second placement axis nobody could explain to a volunteer. So the two stay separate, and
each stays simple.

| Concern             | File                                                                          |
| ------------------- | ----------------------------------------------------------------------------- |
| Schema              | `src/sanity/schemaTypes/documents/hubSpotlight.ts`                            |
| Studio pane         | `src/sanity/structure.ts` (Family Hub → Everyday edits, drag-orderable)       |
| Rules + GROQ        | `src/lib/hub-spotlight.ts` (pure, unit-tested)                                |
| Rendering           | `src/components/hub/HubSpotlightModal.astro`                                  |
| Behaviour           | `src/scripts/hub-spotlight.ts`                                                |
| Mounted             | `src/layouts/BaseLayout.astro`, hub branch (every hub page)                   |
| Checkup / reminders | `HealthTool.tsx`, `SetupWizard.tsx`, `src/lib/reminders.ts`, `/api/reminders` |
| Guide               | Help & Guide → "Put a spotlight in front of families"                         |
| Tests               | `src/lib/hub-spotlight.test.ts`, `tests/hub-spotlight.spec.ts`                |

**What the Board controls.** A name (for the list), a heading, an optional date line, an
optional short line, a rich **message**, an optional picture and icon, one of four
validated **tones** (the pop-up's edge colour), ONE optional button, show-from / show-until
dates, a master on/off, a **version stamp**, and the drag order.

**The message is `postBody`** — the same editor News posts, newsletter issues, and Updates
use, rendered by the same `renderPostBody()`. So it carries bold, italic, links, lists,
pictures with required alt text, **file attachments** families download with one tap,
callout boxes, buttons, tables, and click-to-load video. There is deliberately **no colour
picker**: brand-lock forbids design knobs, and coloured body text on a tinted surface is the
hub's #1 dark-mode AA trap. Colour is expressed through the four-tone edge and the callout
box's two looks.

**The button offers five kinds**, the same plain-language vocabulary as the hub menu:
"Page that came with the site" (a dropdown of real hub routes), "Page you made" (a `hubPage`
reference), "An update" (an `update` reference, so linking a new announcement is a pick and
not a pasted URL), "Outside link", and "The merch store" (the address is dereferenced from
the `hubStore` singleton, so it never needs pasting). A kind whose target went missing
renders NO button rather than a dead one. Every link field validates only when a button is
asked for AND that kind is chosen, so a hidden field can never block publishing (the
hubNavMenu lesson).

**One pop-up per visit, and the ordering.** `hub-spotlight.ts` opens nothing while the
President's note or the first-visit tour is still due, so the order a family meets things is
note → tour → spotlight, one per page load, never stacked. On every hub page other than the
home there is no note and no tour, so a spotlight opens straight away (1100ms after load,
later than the note's 700ms and the tour's 900ms so a race cannot stack them).

**Several live at once paginate.** The modal holds one PAGE per live spotlight (capped at
`MAX_RENDERED_SPOTLIGHTS`, 3) in the Board's drag order, with prev/next arrows, an
aria-live "2 of 3" counter, Left/Right arrow keys, and the dialog label following the
visible page's heading. With ONE spotlight live the arrows and counter do not render at
all, so it reads exactly like its sibling note modals. No swipe: gestures are not worth
hand-rolling, and the arrows are 44px targets.

**Seen is per spotlight, marked on DISPLAY** — not on close. `localStorage`
`wcp-spotlights-seen` holds `{ spotlightId: version }`, so closing after reading 2 of 3
leaves the third to greet the family next visit, and bumping ONE version stamp resurfaces
exactly that one. Device-local, like the rest of the hub app layer.

**No-JS = no pop-up**, deliberately. A spotlight points at content that already lives on a
hub page; it is promotion, not the only path to any information.

**The read rides `BOARD_CONTENT_CACHE`** (5 min fresh, L1-only, **zero KV writes**;
since 2026-08-30 a null/undefined reading — "no such document" — stays fresh for at most
30s and never rides the stale window, so a just-created page stops 404ing in seconds
instead of minutes; see `MISS_TTL_MS` in `src/lib/hub-cache.ts`).
CLAUDE.md keeps COLLECTIONS live so lists feel fresh, but a spotlight is not a list: it is
board-edited chrome that renders on EVERY hub page, which is exactly what that cache tier
exists for (the topbar and the `hubPage` docs use it). An uncached read here would put a
Sanity round-trip on every hub navigation, and five minutes of staleness on a promotional
pop-up costs nothing.

**Housekeeping.** The Checkup tool flags a spotlight past its end date but still switched
on; the same count feeds `/api/reminders` (the board's daily email) and the Start-of-year
tool's "Clear out old notices" card, which now names announcements and spotlights
separately. `scripts/patch-hub-spotlight-example.mjs` creates one example document,
**switched off**, so a Board opens a filled-in form instead of a blank one.

## Updates / meeting blog

The **Updates** section is the meeting blog, migrated in full from the old Squarespace
`/blog` ("School Updates"). Each post is a Sanity `update` doc with `title`, `slug`,
`excerpt`, optional `image` (a flyer/graphic), `publishedAt`, `audience`, a
**`highlight`** boolean ("Highlight in the bell menu" — pins the post to the top of the
hub's what's-new bell with an "Important" tag until unchecked), and a full
`blockContent` `body` (rich text preserved as Portable Text). The index
(`/family-hub/updates`) lists posts as cards; each links to its own gated page
(`/family-hub/updates/[slug].astro`, SSR) that renders the body in full via
`renderPortableText`.

Re-run the one-time import any time with `node scripts/migrate-hub-updates.mjs` — it reads
the Squarespace JSON view (`/blog?format=json`), converts each post's HTML body to Portable
Text, uploads inline flyer images, and `createOrReplace`s `hubUpdate-<urlId>` docs
(idempotent). Going forward the Board just adds `update` docs in the Studio.

## Directory & map

The **Directory** reads opted-in `directoryEntry` docs (PII, gated), sorted
alphabetically by `familyName` (the surname). Every family is **fully editable in Studio →
Family Hub → Directory**: family name, each parent (name + their own email + phone), each
child (name + class), a family photo, the home address, the map pin, notes, and a "Show in
directory" toggle. Adding a new family = create a `directoryEntry` and turn on "Show in
directory". The **Map** is a Board on/off switch — **Hub settings → Google connections → "Show
the family directory map"** (`showDirectoryMap`, **off by default**). When off, the page shows
just the List (no Map tab, and Leaflet never loads); when on, a **List / Map toggle** appears and
the map is Leaflet + OpenStreetMap (no API key, no third-party tracker), plotting each family's
home pin relative to the school (the ★). The
whole map is behind the gate, so plotting home locations is fine here — it never touches the
public site.

The current 2026-27 families were loaded from the old Squarespace directory code block with
`node scripts/migrate-directory.mjs` — it parses `wcp-directory-block.html` (a gitignored PII
file), uploads each family photo to Sanity, and `createOrReplace`s `directoryEntry-<surname>`
docs (idempotent; a `.dir-photos.json` cache avoids re-uploading). **This is real family PII
and never enters git** — it lives only in the gated Sanity dataset. Going forward the Board
adds/edits families directly in the Studio.

Two maintainer scripts handle the start/end-of-year churn in bulk, when the Studio's
one-at-a-time editing would be tedious. **Both take the family data as ARGUMENTS, never
hardcoded** — this repo is public, and a list of real family names is exactly what must not be
committed. Both are dry-run by default and print the full record before touching anything;
add `--commit` to write.

- `node scripts/add-directory-families.mjs <families.json> [--commit]` — creates one
  `directoryEntry` per family from a JSON file **kept outside the working tree**. Validates
  every child's class against the live Class docs (note: `class.slug` is a slug OBJECT here,
  so the check reads `slug.current`), requires `optedIn` to be set explicitly per family, and
  writes with `createIfNotExists` so it can never clobber a family a volunteer has since
  edited. Run `geocode-directory.mjs` afterwards for the pins.
- `node scripts/remove-directory-families.mjs <Surname> [...] [--commit]` — for families who
  leave. Deletes the published doc, its draft, and the family photo asset, so no PII lingers.
  Matching is case-insensitive on `familyName`; an asset still referenced elsewhere is kept
  and logged rather than failing the run.

`optedIn` mirrors the registration form's "may we print your family's name, address, email and
phone on the class roster?" question. A family who answered **No** still gets a record (the
Board needs it) but goes in with `optedIn: false`, so it never renders. That mapping is not
automated — whoever imports a family is responsible for reading the form answer across.

A family's pin comes from its `location` (a geopoint; the migration set it from the block's
saved coordinates). For a family added later, a volunteer just types the home `address` and
runs `node scripts/geocode-directory.mjs`, which geocodes any address with no pin yet (via
free Nominatim, rate-limited to 1/sec) and writes back the `location`. It's idempotent, so it
only touches new/changed addresses. The school's own pin is a fixed constant in
`DirectoryMap.astro`.

## Editing hub pages (the hub page-builder)

Every hub page is built on the **page-builder**, so volunteers edit them in the
Studio like the public pages. Each page reads a **`hubPage`** doc (by a fixed
`hubKey`) at request time behind the gate: an editable **heading**, **intro**, and a stack
of **sections** from the hub-safe palette (`HUB_SECTION_TYPE_NAMES` — content sections only;
the build-time "pull" sections can't run behind the gate). The page's **fixed widget**
(per-child health info, calendar month grid, PayPal buttons, directory map, live campaign bars,
class facts) stays locked in code and the editable sections wrap around it. If no `hubPage`
doc exists for a key, the page shows its built-in fallback content, so it can never go blank.

Edit them in **Studio → Family Hub → Hub pages**. Since 2026-08-30 **the real
`/family-hub/*` routes ARE the Presentation preview** (the 2026-08-24 stub at
`/preview/family-hub/<key>` is now a cookie-gated 302 to the real page; `tests/hub-gate.spec.ts`
still pins its 401 without the cookie). The pieces:

- `src/lib/hub-preview.ts` — `hubDraftMode()` verifies the Studio-issued preview cookie
  (fingerprint of the server Sanity token, `src/lib/preview-auth.ts`, fails closed) and
  `readHubPageDoc()` swaps the page's hubPage read to the draft perspective with stega on.
  A draft read NEVER touches the board-content cache (it would show unpublished words to
  families for the TTL).
- `src/middleware.ts` accepts that cookie as a second verified credential for
  `/family-hub/*` and stamps `Cache-Control: no-store` on every preview response. It is a
  credential, not a bypass flag — see the incident note at the top of that file.
- Every hub route computes `draftMode`, reads via `readHubPageDoc`, and hands HubShell a
  `previewDocId` (the published doc id) → BaseLayout mounts `VisualEditingOverlay` OUTSIDE
  `#main` (the soft refresh morphs `#main` and must not morph the overlay away).
- Board pages (and Hub home's welcome sections) pass `editDoc` in draft mode, so sections
  get the move/duplicate/delete toolbar; built-in widgets render for real but carry no
  edit handles.

**Preview-only rendering details (2026-08-30)**: BaseLayout forces every `[data-reveal]`
to its end state while previewing (morphed-in nodes never meet the IntersectionObserver, so
without this the dashboard faded out after the first edit), and the soft-refresh morph
skips `data-morph-keep` subtrees — the four `server:defer` islands on Hub home — because
the refetched HTML holds only their fallback skeletons (island swap scripts never run in a
DOMParser parse). The greeting and events tiles also adapt their grid spans to the widget
switches so the bento never shows a hole.

**Widgets are SELECTABLE in the preview (2026-08-30)**: every code-owned widget wraps
itself in a `data-sanity` target via `hubEditAttr` (src/lib/hub-preview.ts) when
`Astro.locals.hubPreview` is true (stamped by the middleware from the verified cookie —
families never render the attribute). Clicking a widget in Presentation opens its OWNING
document at the right field: teacher card → its `teacherNote`, class-rep card → its
`roleHolder` (docId threads through `RoleHolderRow` → `Holder` → `OrgPerson`), class fact
cards + album tiles → the `class` doc (docId threads `HUB_CLASSROOMS_QUERY` →
`toHubClass` → `HubClass`/`ClassTile` — the mapper must keep new fields or they silently
vanish), handbook chips → `hubPage.handbookFile` / `hubSettings.familyHandbook`,
announcement + minutes rows → their `update` docs, store → `hubStore`, greeting stats →
Site/Hub settings, social pills → the Site settings handles.

**Preview cost control (2026-08-30, after a live Error 1102)**: a hub soft refresh
renders ONLY `#main` (`hubSoftRefresh` in BaseLayout skips both rails, the seven-feed
top bar, tab bar, search, and the spotlight modal — the reconcile discards them anyway),
and `/preview/live`'s listen filter excludes family-generated machine docs (sign-ups,
photo submissions, hours logs, form submissions, subscribers, `sanity.*`) so background
family activity never triggers preview re-renders.

**Editability program (2026-08-31)**: see [HUB_EDITABILITY.md](HUB_EDITABILITY.md) for
the audit + what shipped in its four waves — the Super Helper procedure page
(`seed-super-helper-page.mjs`), store facts on the Merch store card, fully-overridable fee
cards, the single-sourced closure statement, the documents category registry
(`src/lib/hub-doc-categories.ts`), the Board-picked phone tab bar (`resolveTabBar`),
skippable tour steps, class extra fact rows, note sign-offs, and the shared contact
microcopy (`src/data/hub/microcopy.ts`).

**Editable widget wording (P1–P4, 2026-08-31)**: `hubPage.widgetText` stores per-widget
title/blurb overrides (empty = shipped copy; `widgetTextFor` in `src/lib/hub-widgets.ts`
strips stega from the KEY only — titles keep it for click-to-edit; Studio input
`HubWidgetTextInput`, rows limited to registry entries with a `text` capability). The
greeting's welcome line is `hubSettings.welcomeLine`; the handbook card derives its year
from `siteSettings.schoolYearLabel`. The **Super Helper program** is ONE source
(`hubSettings.superHelper`, merge rules + committed fallback in
`src/lib/hub-super-helper.ts` / `src/data/hub/super-helper.ts`) feeding both the hub-home
band and `/family-hub/super-helper`'s header + "What it takes" cards; a Board-written
requirements list replaces the shipped one wholesale, and a requirement may carry a link.
The home page's settings/store reads are draft-aware in preview, so all of this shows
pre-publish.

**Widget switches (2026-08-30)**: `hubPage.hiddenWidgets` stores the OFF list (missing =
all on, so no migration ever). The registry of switchable tiles per hubKey, the
`hiddenWidgetSet`/`shows` rules, and a drift gate that proves the page honors every
registered value live in `src/lib/hub-widgets.ts` (+ `.test.ts`); the Studio input is
`src/sanity/components/HubWidgetToggles.tsx` (on/off switches; the field hides on pages
with no registered widgets). Today only **Hub home** registers tiles — add a page's
widgets to `HUB_WIDGETS_BY_KEY` and gate its markup with `shows()` to grow it. Seed a
page's starting content with `node scripts/migrate-hub-pages.mjs` (idempotent,
`hubPage-<key>` ids).

**All hub pages are converted:** Landing (`home`), **Getting Started** (`getting-started` —
new-family onboarding), Calendar, Co-op Jobs, Documents, Tuition, Updates, Fundraising,
Health, Directory, and the class pages (DERIVED from the `class` documents since 2026-08-29 —
see "Class pages are DERIVED" below; `twos-threes` and `pre-k` each cover a class pair, with the
per-class addresses 301-redirecting there). Each
reads its `hubPage` doc for an editable heading, intro, and a stack of hub-safe sections,
wrapped around a **fixed widget** that stays locked in code:

**The knowledge base:** the 2026-27 source documents (Family Handbook, May Gathering
orientation deck, Safety Plan, bylaws digest, member-approved budget, Super Helper
certification) are transcribed into editable sections across getting-started / health /
coop-jobs / tuition / fundraising / calendar / twos / threes by
`node scripts/seed-hub-knowledge.mjs` (re-running RESETS those pages to that baseline).
The source PDFs are uploaded as gated `hubDocument` files on the Documents page — the
PDFs themselves are gitignored (they contain the hub password and phone numbers).

### Class pages are DERIVED — the classroom model (2026-08-29)

**A class the Board adds gets its whole hub presence with no code change.** This was the last
developer-only corner of the site: the class pages were hand-written `.astro` routes over a
hardcoded slug union in `src/data/classes.ts`, so a `class` document that existed only in Sanity
was invisible to the hub. Now the hub derives its class pages from the `class` documents, the
same way the public site already derived its tuition table, calculator, card grids, Classes menu
and teacher cards.

**The one idea is a CLASSROOM** ([`src/lib/hub-classrooms.ts`](../src/lib/hub-classrooms.ts),
pure + unit-tested). A classroom is one hub page. It covers one class, or several classes that
share a teacher and a handbook. Two rules build the list:

1. A `hubPage` may name the classes it is the class page for — **"Classes on this page"**. That
   page becomes their shared classroom, at its own address (`hubKey` for a page that came with
   the site, else its web address). This is how `/family-hub/twos-threes` (Ms. Erin's Twos +
   Threes) and `/family-hub/pre-k` (Mrs. Lisa's AM + PM) keep the addresses families bookmarked.
2. Any class no such page names becomes **its own classroom**, at `/family-hub/<class slug>`,
   with no document at all. The page is complete from the class entry alone: facts, teacher card,
   class-rep card, pay button, helper-schedule sheet, photo album, the supply list, and a coaching
   empty state where the handbook would go. Every pill and card that needs a value it has not got
   (no pay link yet, no album yet, no curriculum guide yet) is simply not rendered — a class page
   never shows a dead link while it is being filled in.

**Routing.** All of it is served by the gated catch-all
[`src/pages/family-hub/[...slug].astro`](../src/pages/family-hub/%5B...slug%5D.astro). The six
`.astro` files that used to do this (`twos`, `threes`, `pre-k`, `pre-k-am`, `pre-k-pm`,
`twos-threes`) are deleted; the old per-class addresses 301-redirect to the page that covers them,
from data rather than from four redirect files. `HubClassroomBody.astro` renders the whole page.

**Precedence** is one unit-tested function, `hubPathKind()`: a real `.astro` route, then a
CLASSROOM, then a Board-created page, then 404. A class page outranks a Board page at the same
address because its address is DERIVED from the class rather than typed by a person — and the
Studio refuses to save a Board page at a class's address, so that collision is caught before it
can happen (`hubPage.ts` slug validation). `RESERVED_HUB_SLUGS` no longer lists the class slugs:
they are Sanity data now, not files on disk.

**Handbook content.** Pre-K (daily schedules, drop-off/pick-up, the helper-day playbook, snack
duty, helper wisdom, communication, dress code, FAQs, and the class-pet band) is seeded from
Mrs. Lisa's 2026-27 PDF by `node scripts/seed-pre-k-page.mjs`. The Twos & Threes handbook lives
in the single `hubPage-twos-threes` doc (ONE doc for the one page since 2026-08-24 —
`patch-merge-twos-threes.mjs` consolidated the old per-class docs, which had drifted while only
the twos one rendered; the historical `seed-twos-threes-page.mjs` seeded the old pair and must
not be re-run as-is). Re-running a seed RESETS that page to its baseline; day-to-day edits happen
in the Studio.

**The one-shot migration** was `node scripts/patch-hub-classrooms.mjs --apply` (run 2026-08-29,
idempotent, dry-run by default): it set "Classes on this page" on the two shipped class pages and
moved the four committed class icons into their `class` documents.

**What a volunteer does to add a class, end to end:**

1. Studio → **Classes** → **＋** — name, web address, colour, icon, days, time, ages, tuition,
   PayPal links, helper-schedule sheet, photo album, teacher. Publish.
2. The class is immediately in the tuition table, the calculator, the card grids, the public
   Classes menu, the hub rail, the hub home's helper tile and photo-album tile, the my-classes
   picker, the first-visit tour, the ⌘K palette, the directory filter, and **its own hub page**.
3. Optional, from buttons on the class document: **Create its page** (the public detail page) and
   **Create its hub page** (the handbook, as a draft to fill in).
4. Optional: a **Teacher's welcome note** and a **Curriculum guide** — both dropdowns now list the
   live class pages, so the new class is there to pick. The class also gets its own **rep seat**
   on the org chart automatically (the ONE `perClass` Class Rep role — see "The org chart is
   DERIVED" below), so its class-rep card can hold a real person the same day instead of
   “To be announced” for ever: add a **Who's who this year** card, pick **Class Rep**, then pick
   the class.

The handbook body (and Getting Started) renders through `HubSectionedBody` → the shared
`SectionRenderer`, i.e. the SAME page-builder sections the public site uses. Their marketing
register (centered eyebrow headers, hero-scale type, alternating full-bleed bands) would read as
"a web page dropped into the app," so `HubSectionedBody` wraps them in `.hub-prose` and a scoped
skin in `globals.css` re-skins them as app content: headers left-align, the eyebrow kicker drops,
and type shrinks to app scale.

**Budget & Fundraising** (the renamed Fundraising page — nav group "Money", URL still
`/family-hub/fundraising`): leads with an expanded **`BudgetSnapshotPanel`** — the page-scale
cousin of the home `BudgetSnapshotWidget` (same Budget sheet tab, shared `budgetHealth()` from
`gsheets.ts`): big cash balance + health badge, revenue and expenses each with a bar, percentage,
and amount-to-go, and the YTD net. Then dashboard-style fundraiser cards (with the live Store Sales
net-profit card) and the "raised together" band, then a full-width **`BudgetTable`** — the whole
member-approved operating budget from `src/data/hub/budget.ts` (transcribed from the Treasurer's
proposed-budget PDF): a target-revenue / total-expenses / net summary with a revenue-vs-expenses
balance bar, then a card per group (tuition & fees, fundraising, operating expenses, programs &
payroll) with each line's this-year figure, last-year comparison, note, and a derived subtotal.
It replaces the old "The Budget" prose section (which left a narrow reading-cap column with a
dangling right gap — the table fills the full width). Update `budget.ts` each year at the vote.

The content-heavy hub pages — **Co-op Jobs, Health & Safety, Tuition, Budget & Fundraising,
Calendar** — also run their Board-editable sections through `HubSectionedBody` (they used to render
them as plain full-width `SectionRenderer` bands at the page tail). On Co-op Jobs / Tuition /
Fundraising / Calendar the fixed dashboard content stays full-width (on Calendar: the subscribe
card, upcoming agenda, month grid, and weather note) and the Board sections follow as a card doc
column with its own TOC ("dashboard above, handbook below") — on Calendar that's the "traditions"
and "how field trips work" grids; Health swaps its fixed fallback for the doc column when the Board
manages the page. This is what makes the two-level TOC pay off: the seed
gives the long "Everything Else" (jobs / cleanings / meetings / safety), "Governance" (who we are
/ membership / the Board / money / changes), and "The Budget" (revenue / expenses / bottom line)
sections real `h3` subheads, which `hub-doc.ts` promotes into nested TOC entries. When a section
run has `h3`s inside a prose body, they show as level-2 entries under their section.

The body is laid out as a **document column** (SaaS-dashboard / Confluence-page look). Every page
mounts `HubSectionedBody` INSIDE the same `<Section bg="grey"> → max-w-6xl` container as the
`HubPageHeader`, so the header, the fixed class cards, the handbook, and the TOC all share one
left/right rail (previously the body was a full-width sibling and floated at a different width —
the "TOC far to the left, nothing aligned" bug). On xl+ the column is paired with a sticky "On
this page" TOC (`HubSectionIndex`) on the **right** (GitBook/Notion-style, off the hub rail's
side); below xl the sidebar TOC hides and a collapsed "On this page" `<details>` jump list
(`HubSectionIndex variant="inline"`, self-closing after a jump) takes over — a 10k-px handbook on
a phone needs a way to skip ahead (2026-07-16 audit). That inline list is itself **sticky** below
xl (2026-07-17): it pins near the top of the viewport as you scroll (clearing the floating desktop
topbar on lg, the same offset story as `HubTable`'s sticky headers), so the jump nav stays one tap
away however far down the page you are; the open list caps to the viewport and scrolls internally. Grid + card CSS lives
in the "Handbook document column" block of `globals.css`, keyed off `.hub-doc-grid` /
`.hub-doc-block`.

Each section is wrapped in a `.hub-doc-block[data-treatment]` whose treatment (chosen in
`HubSectionedBody` from the section `_type`) decides its chrome — the **hybrid card** model:
`flow` (long-form prose: text flows on the surface, no card), `card` (a discrete block — FAQ,
schedule, table, quick facts, quote, form: white card chrome matching `HubCard`, via the shared
`--color-surface` token so it tracks light/dark), and `bleed` (sections that carry their OWN
cards or a full color band — card grids, class cards, CTAs, galleries: no outer card, so a card
never nests in a card; a navy band becomes a self-contained rounded card). A `flow` section title
reads at CHAPTER scale and a `card` title as a compact PANEL label, so the page has real type
hierarchy. Flow prose left-aligns to the column rail (`Prose` carries a `wcp-prose` hook; it keeps
`mx-auto` for public policy pages) at a ~68ch measure. The skin hangs off stable hooks
(`wcp-section` / `wcp-section-header` / `wcp-eyebrow` / `wcp-seam` / `wcp-prose`) the shared
components always emit; nothing targets them on the public site, so it stays untouched. An unseeded
page (no sections) renders a `HubEmptyState` instead of a blank column. Volunteers edit the
sections exactly as before — only the hub rendering changes.

The page header carries a quiet **meta line** — an estimated reading time and an "Updated <Month
YYYY>" freshness stamp — so a handbook reads as maintained reference content. Reading time comes
from `src/lib/hub-reading-time.ts` (`estimateReadMinutes`, ~200 wpm over headings, prose, FAQ
text, AND the sentence-bearing fields of cards / steps / schedule entries — these pages are built
of card grids, so skipping them once put "2 min read" on a 13,000px page; pure lookup values like
times and prices still don't count); the stamp is
`formatMonthYear(doc._updatedAt)` from `src/lib/hub-dashboard-dates.ts` (Eastern-safe, per the
Workers-UTC gotcha). `HUB_PAGE_QUERY` projects `_updatedAt`. Both helpers are Vitest-covered.

A `card` section shows a small **type-derived icon chip** above its title (map in
`HubSectionedBody`; no Sanity field, so it stays brand-locked), and the whole column can be
**tinted to a class color** via `HubSectionedBody`'s `tint` prop (a brand COLOUR from the class
document, e.g. `amber` — every classroom passes its own): the card chips use that class's `iconChip` and the active TOC
entry picks up the class color through `--hub-doc-accent`. Getting Started stays neutral sky.

`src/scripts/hub-doc.ts` (one client script, superseding the old `hub-toc.ts`, imported once from
`HubSectionedBody`) adds the document-column behaviors: a hover/focus-revealed **copy-link anchor**
on every heading (jumps AND copies the deep link — the `.hub-anchor`), a **two-level TOC** (prose
subheads get stable ids and are injected under their section in the "On this page" nav — dormant
until a board adds subheads, since the seeds are section-level only), and **scrollspy** over the
full set. It is progressive enhancement: no-JS keeps a working section-level TOC and linkable
headings. A `@media print` block (globals.css) drops the app chrome (rail, top/tab bars, search,
TOC, anchors), collapses the grid to one column, and keeps cards whole across page breaks, so the
live handbook prints clean (independent of the downloadable PDF).

Each class page can also carry the teacher's **original handbook PDF** for download: the
`hubPage.handbookFile` field (a Sanity file) drives a "Download the handbook (PDF)" button in
the page header (`HUB_PAGE_QUERY` projects it as `handbookUrl`; the button href appends `?dl=`
so the Sanity CDN serves it as an attachment with a clean filename). Twos + Threes share Ms.
Erin's PDF, uploaded and wired by `node scripts/seed-handbook-files.mjs` (idempotent, reuses the
asset by filename); Pre-K's button turns on once Mrs. Lisa's PDF is uploaded to that field in
the Studio. No button shows when the field is empty.

**The store card** (`StoreCard.astro`) sits at the bottom of the hub home: a deep, textured navy
banner (gradient fill, brand glows, a dot grid, doodles, a shine sweep + floating shapes, all
reduced-motion-safe) linking to the merch store, with a **category tab row** (flick between
collections, "Featured" open by default) over a **product carousel** with prev/next arrows
(`hub-store.ts`; the native scrollbar is hidden, the next tile peeks), a **free-shipping line**,
and a "supporting our co-op" sales stat. Fourthwall serves every product image at a signed 1920px
URL (~140KB) that can't be rewritten and workers.dev has no image resizing, so the tiles route the
image through **wsrv.nl** (a free resizing proxy) to ~400px webp (~17KB) — `hub-store.ts` falls
back to the full Fourthwall image if the proxy ever errors. The tabs are pure CSS (radio inputs +
`:has()`) so they work
with **no JS inside the server island** — the card is a `server:defer` island so its external
fetches never block the dashboard. The panel-hiding is gated behind
`@supports selector(:has(*))`, so a `:has()`-less browser (Firefox ESR 115, Safari ≤15.3) sees
every rail stacked instead of an empty product area. Categories, products, and the stat come **live from Fourthwall**
via `src/lib/fourthwall.ts` (cached, SWR):

- `getStoreCollections()` — the Storefront API: the store's real categories, one tab each
  ("Featured" leads and opens by default). Empty categories are dropped; if none come back the
  card shows the whole catalog as a single rail.
- `getStoreProducts(slug)` — the Storefront API (`FOURTHWALL_STOREFRONT_TOKEN`, read-only): up to
  12 products per category (name, price, image, product link), so new/changed products appear
  automatically.
- `getMerchStats()` — the Open API (`FOURTHWALL_API_USER` / `_PASSWORD`, basic auth, SUPER-ADMIN):
  AGGREGATE order totals only (gross sales + order count; no customer PII ever read out). This is
  gross **sales** (what buyers paid), used only for the store card's supporting line.
- `getStoreProfit(since)` — the same Open API creds: the school's **net profit** on orders placed
  on/after `since` (default `2026-05-01`). The API exposes no single profit number, so it's
  reconstructed per line item as retail (`offers[].variant.unitPrice`) minus Fourthwall's cost
  (`unitCost`), less order discounts, plus donations — Fourthwall's own profit definition. Each
  purchased unit is its own `offers` entry (no quantity field; the unit prices sum to the order
  subtotal). Powers the **Store Sales** fundraiser card on `/family-hub/fundraising` (a live,
  green "Live"-pilled card that replaces the old hand-kept "Shirt Sales" sheet row — any
  shirt/store-sales row is auto-hidden when the live total is available). Sums only; profit lags
  ~24-48h on brand-new orders while Fourthwall aggregates costs, then settles.

All three are Worker secrets (`.dev.vars` locally, `wrangler secret put` in prod — see
`.dev.vars.example`), never committed. Everything degrades gracefully: if the Storefront API is
unavailable the tiles fall back to the Board-curated `storeProducts[]` on the **Merch store
card** singleton (`hubStore` — Family Hub workspace → Hub pages & look; `storeHeadline` /
`storeTagline` / `storeUrl` / each product `title`/`price`/`url`/uploaded `photo` (the legacy
hotlinked `image` URL stays as a hidden fallback; all 8 were converted to real assets
2026-08-24 by `patch-hub-store-photos.mjs`); originally seeded by
`node scripts/seed-store-feature.mjs` into Site Settings, then moved to `hubStore` 2026-08-23
by `node scripts/patch-hub-store.mjs`); if the Open API is unavailable the stat hides. The
card hides entirely without a `storeUrl`.

**The community wall** (`SocialWallWidget.astro`) sits directly **below the store card** and closes
the hub home on a human note — a navy bulletin board of pinned snapshots (white polaroid frames,
brand-colour pushpins, a gentle random tilt, hover-straighten; a dot grid + doodle texture behind),
the hub-home twin of the public "Life inside WCP." section and the old Squarespace bulletin board.
Source is the **live Instagram feed** (`fetchInstagram`, cached 24h under `ig:feed:v3` — bump on any
tile-shape change) when the `INSTAGRAM_TOKEN` Worker secret is set, else the **same Board-curated
album the public section falls back to** — `album-life-inside-wcp` (Studio → **Photo albums** →
"Life inside WCP"), at request time through the cached authenticated client (`BOARD_CONTENT_CACHE`).
Each polaroid carries a **caption on its white strip** (the img's `alt` is empty so it isn't
redundant with the visible caption — axe `image-redundant-alt`), and reels get a **play badge**.
Clicking a tile opens an **in-page lightbox** (`social-lightbox.ts`, native `<dialog>`) showing the
FULL uncropped image + caption + a "View / Watch on Instagram" link, with prev/next and arrow keys —
so the designed posts (playdate schedules, teacher thank-yous) are readable rather than cover-cropped
to nothing. **Video posts PLAY inline** in a `<video controls>` (poster = the still, from the
`videoUrl` = Instagram's `media_url`); Instagram's CDN video URLs are signed/expiring, so on a load
error the viewer falls back to the poster + play badge and the "Watch on Instagram" link. The CSP
(`public/_headers`) sets only `frame-ancestors`, so it never blocks the IG-CDN image/video sources. Progressive: with no JS the tiles are plain links to the post. Grid uses
`minmax(0,1fr)` columns so a nowrap caption can't widen its own tile. The widget renders nothing when
empty. Motion is reduced-motion-safe. It's rendered **inline** (not a `server:defer`
island) — the single album read rides the CDN cache, below the cost of an extra island round-trip.

| Hub page                               | Fixed widget (locked)                                                                                                                                                                                                                                   | Already editable elsewhere                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Landing                                | Quick-link nav grids                                                                                                                                                                                                                                    | —                                                  |
| Calendar (agenda + branded month grid) | Upcoming agenda (type-coloured) + full-year view: `HubCalendarGrid` month grid (desktop) / `HubCalendarSchedule` collapsible-month list (mobile); clicking an agenda card, grid day, or schedule row opens `HubEventDialog` (details + add-to-calendar) | `googleCalendarId` / feed in Hub settings          |
| Co-op Jobs                             | Role descriptions + the derived org chart                                                                                                                                                                                                               | `coopRole` (seats) + `roleHolder` (people)         |
| Documents                              | Document library + required-forms callout                                                                                                                                                                                                               | `hubDocument` docs                                 |
| Tuition                                | Pay-card + fee-card layout, payment FAQ                                                                                                                                                                                                                 | `class` docs + `feeSchedule` (rates, buttons, FAQ) |
| Updates                                | Meeting-blog post list (minutes rows get a category pill)                                                                                                                                                                                               | `update` docs                                      |
| Fundraising                            | Year ring + stat, per-fundraiser status pills                                                                                                                                                                                                           | `campaign` docs                                    |
| Health                                 | Illness policy cards + closures band                                                                                                                                                                                                                    | —                                                  |
| Directory                              | Opt-in family cards + map, alpha jump rail, class-ring initial avatars for no-photo families                                                                                                                                                            | `directoryEntry` docs                              |
| Class pages                            | Fact-card + pay-button layout, teacher modal                                                                                                                                                                                                            | `class` docs (facts, button) + `teacherNote` docs  |

Only the widget **layout** stays in code. All of its content is Board-editable through its own
doc type: class facts, tuition rates, and PayPal pay values (a new-style payment link, or a
legacy button code — see `payUrl` in `src/data/classes.ts`) live in the `class` docs and the
`feeSchedule` singleton; documents, teacher notes, campaigns, co-op roles, and family cards each
have their own docs. A mistyped icon name from any of these is guarded by `safeIcon`, so it
can never crash a page. Everything on every hub page is now Board-editable.

**Welcome-letter modals:** the hub home shows the `presidentNote` singleton once per version
stamp; each class page shows its class's `teacherNote` doc the same way (Studio → Family Hub →
Teacher welcome notes; seed/refresh with `node scripts/seed-teacher-notes.mjs`). Both share
`src/scripts/note-modal.ts` (per-note localStorage keys). A dismissed letter is never lost:
each page with a note also renders a hidden `[data-note-open]` reopen pill ("A note from your
President" chip in the hero; "Welcome letter" action on the teacher card) that note-modal.ts
unhides and wires when the modal is present — JS-only, like the modal itself.

### Adding a hub page (no developer required)

Until 2026-08 every hub page was a hand-written `.astro` route, a fixed `hubKey` option, and a
hardcoded link in `src/data/hub-nav.ts`. That made the hub the one part of the site a future
board could not grow. There are now **two kinds of hub page**:

|                            | Built-in                                                 | Board-created                              |
| -------------------------- | -------------------------------------------------------- | ------------------------------------------ |
| Identified by              | `hubKey` (fixed list)                                    | `slug`                                     |
| Route                      | its own `src/pages/family-hub/*.astro`                   | the catch-all `family-hub/[...slug].astro` |
| Carries code-owned widgets | yes (calendar embed, PayPal, directory map, class facts) | no                                         |
| Created by                 | a developer                                              | **a volunteer, in the Studio**             |

A Board page is a `hubPage` with a slug and **no** `hubKey` — `HUB_PAGE_BY_SLUG_QUERY` requires
`!defined(hubKey)`, so a document that somehow had both could never shadow a built-in page and
render it without its widgets. It gets the same shell, the same hub-safe section palette, the
same TOC, and it self-indexes into the ⌘K palette.

The rules live in `src/lib/hub-pages.ts` (pure, 20 unit tests):

- **`RESERVED_HUB_SLUGS`** blocks any slug owned by a real route. Astro matches static routes
  first, so a colliding page would silently never appear — the worst kind of bug to hand a
  volunteer. The Studio rejects it, the route 404s on it as a second line, and a **test asserts
  the list matches the route files on disk**, so adding a hub route without updating the list
  fails CI instead of shipping a trap.
- **The rail menu itself is Board-editable** — Studio → **Family Hub → Family Hub menu**
  (`hubNavMenu` singleton, seeded by `scripts/seed-hub-nav-menu.mjs`), resolved by
  `src/lib/hub-nav-doc.ts` (pure, 15 unit tests) over the committed fallback in
  `src/data/hub-nav.ts`. Groups can be renamed, reordered, added and removed; built-in links
  reordered, relabelled, moved between groups, or hidden; Board pages and external links
  added anywhere. The guardrails: **Home is pinned in code** and not part of the document;
  **accents are a fixed AA-checked set** (an unknown value resolves to sky, never an
  unreadable invention); **built-in links are stored by route from a dropdown**, so they can
  be renamed but never pointed at nowhere; a broken row (deleted page, dead target) is
  dropped rather than rendered; a doc that yields nothing falls back to the committed menu,
  so the rail is never blank; and the Studio warns when the menu no longer shows Tuition or
  the Directory. A page not added to the menu still works at its address — the deliberate
  "still drafting it" state.

**Gating is structural, not per-page:** the catch-all lives under `/family-hub` and sets
`prerender = false`, so `src/middleware.ts` protects it like everything else.
`tests/hub-gate.spec.ts` asserts that both an existing Board page and a made-up address redirect
a signed-out visitor, so a 404 can never leak which hub pages exist.

`scripts/seed-example-hub-page.mjs` seeds **Example page (safe to delete)** at
`/family-hub/example-committee` — a worked template for volunteers and the fixture
`tests/hub-pages.spec.ts` runs against (render, sections, axe light+dark, 320px, 404,
shadow-protection, search). It has no `navGroup`, so families never see a link to it.

**The operating budget** (Budget & Fundraising page) is Board-editable in the Studio —
**Money & payments → Operating budget (yearly)** (`operatingBudget` singleton, seeded by
`scripts/seed-operating-budget.mjs`). `src/data/hub/budget.ts` is now only the committed
fallback. **No total is stored:** group subtotals and all three headline figures are derived
from the lines by `src/lib/budget.ts` (pure, unit-tested against the real 2026-27 numbers), so
the summary can never disagree with the table under it. A section with no `kind` counts as a
COST, deliberately — being wrong in the direction that flatters the budget is the wrong way to
be wrong about money.

**The student fee is set in ONE place: the class document.** It used to be typed on each class
AND again as a hand-written band in `feeSchedule.studentFeeBands`, and the two drifted — the
retired PayPal code `GQZ67ZRZ4W9UN` sat on the Twos/Threes class docs long after the bands had
moved to the new-style link, and nothing on the site read the class field to reveal it (the
field was in the schema and in the Studio form, but no query asked for it). The bands are now
DERIVED from the class docs by `src/lib/student-fees.ts` — classes sharing an amount _and_ a
pay link collapse into one button, labelled from the class names. `feeSchedule.studentFeeBands`
is hidden and read-only; its rows are kept as a record but nothing reads them.

**Role photos are Studio-only** (2026-08-17): the six org headshots that lived in
`src/assets/org/` were uploaded to their `roleHolder` documents and the committed files and
code fallback deleted. `OrgPersonCard`/`ClassRepCard` render the Studio photo through the
Sanity CDN or fall back to initials — the designed state for a seat with no upload.

**Hub Updates carry pictures and attachments** (2026-08-17): `update.body` switched from
`blockContent` to `postBody` — the same editor News posts and newsletter issues use — and
`postBody` gained a `fileAttachment` block (file + label). `renderPostBody` renders it as a
download card, building the URL straight from the asset ref (`fileUrlFromRef` in
`src/lib/image.ts`), so queries need no dereference. Existing plain-text bodies stay valid;
the change is additive.

**The daily delights and the handbook link are Board-extendable** (2026-08-17): `hubDelights`
(Family Hub → Little delights) adds fun days and giggles on top of the committed kid-safe
lists — a Board fun day wins over a committed one on the same date, and Board giggles join
the deterministic daily pool. The Family Handbook button (topbar + hub home card) follows the
PDF uploaded at Hub settings → Each year → Family Handbook, with the committed URL as the
fallback, so the yearly re-upload needs no code edit.

**The curriculum guides and the supply list are Board-editable** (2026-08-17): their content
moved from the generator scripts into `curriculumGuide` documents (one per class page) and the
`supplyList` singleton, seeded by `scripts/seed-pdf-content.mjs`. Since 2026-08-29 the
generator renders a guide for ANY `curriculumGuide` document, not just the three the script
ships content for — a class the Board adds can be given its own guide, in its own class colour,
and the hub shows the pill only for guides that exist. "Which class" is a dropdown of the LIVE
class pages (`ClassroomPickInput`), so a guide can cover one class or a whole shared page. The generators read the
Studio at build time (committed content = fallback) and run in postbuild with `--dist`, so a
publish regenerates the PDFs on the next deploy; the deploy workflow installs Playwright's
Chromium for the render, and a build without a browser skips gracefully and ships the
committed copies. Curriculum sections support both plain objective lists and labelled
sub-lists (`groups`) — the round-trip drops neither.

**Feature hints** (`HubHint.astro` + `src/scripts/hub-hints.ts`): one-shot pointers at a
single control — the Directory map, the Calendar filters — shown once per device
(`wcp-hint-<id>`), a beat after load, never while a dialog is open. Placement is code (the
page renders its `HubHint` with a target selector + fallback wording); the Board controls the
master switch, per-hint switches, and wording in **Family Hub → Feature hints** (`hubHints`
singleton). Adding a hint = render `<HubHint>` on the page AND add its id to the schema
dropdown. Covered by `tests/hub-hints.spec.ts`.

**Link health** (`scripts/check-live-links.mjs` + `.github/workflows/link-health.yml`): every
Monday the workflow pings each Board-entered Google link (helper schedules, albums, budget
gviz, calendar feed, Documents links) and writes the result to the read-only `linkHealth`
singleton (**Family Hub → Link health**). A Google link that died often still answers 200 via
a sign-in redirect, so a landing on accounts.google.com counts as dead, and the gviz/JSON
feeds must parse. The public Actions log prints labels and statuses only — never URLs (the
repo is public); full URLs live only in the private Sanity document. Any failure exits 1, so
the red run mails the owner. Its FIRST run found a real 403 (see PENDING).

**Post bodies carry video + galleries** (2026-08-17): `postBody` gained a `videoEmbed`
(click-to-load facade — same `[data-embed-video]` contract as VideoSection, wired by
`scripts/embeds` which the three body pages now import) and a `postGallery` (a quiet
two-column figure grid; the pinned-print look stays reserved for the photo wall).
`renderPostBody` renders both; unit-tested. The ⌘K index now also lists the four generated
PDFs by their Studio titles, and `wcp-email-copy` gives `tel:` links the same never-silent
treatment as mailto (visible numbers copy on desktop; labeled buttons eager-copy with the
focus-heuristic toast).

**Six more post blocks** (2026-08-17): `postBody` also offers a **callout box** (sky/warm,
mirrors `Callout.astro`), a **button** (the one amber brand pill — no style knobs), a
**sign-up sheet card** (a `signupSheet` reference; the card shows the open/closed state and
links to `/family-hub/sign-ups`), an **event card** (an `event` reference; shows when/where
plus "Add to Google Calendar" and a ".ics" download from the new public
`/api/event-ics?id=<_id>` route — `src/lib/ics.ts` builds the file, date-only starts anchor
to noon UTC), a **table** (rows of cells + a header-row switch; renders inside its own
`overflow-x-auto` scroller), and **two columns** (two constrained rich-text columns that
stack below `md`). The two reference blocks need their refs expanded at query time:
`POST_BODY_PROJECTION` in `src/lib/queries.ts` is the shared body projection — every new
body fetch must interpolate it, or the cards render nothing. All handlers live in
`renderPostBody` (unit-tested in `src/lib/portable-text.test.ts` + `src/lib/ics.test.ts`).

**The Super Helper banner previews the path** (2026-08-18): the hub home's amber banner now
shows the three certification requirements as mini-cards (online training, CPR/First Aid,
proof of education — mirroring the cards on `/family-hub/super-helper`), the one-time
reassurance, and a renewal pointer. One link (the navy pill, stretched across the card via
`after:inset-0`) keeps the accessible name short. The copy is code-owned in
`src/pages/family-hub/index.astro` — keep it in step with the super-helper page. The same
change added the real `monitor` icon to `lucide-icons.ts`; the super-helper "Online
training" card had been silently rendering CardGridSection's `sparkles` fallback.

**The first-visit tour** (`HubTourModal.astro` + `src/scripts/hub-tour.ts`, hub home only): an
eight-step walkthrough that opens once per device, AFTER the President's note closes when that
note is due (`note-modal.ts` dispatches `wcp:note-closed`; the tour waits for it), or directly
when no note is due. Dismissal stores the version stamp under `wcp-tour-seen`; the Board
re-shows it by bumping `version` on the `hubTour` singleton (Family Hub → First-visit tour),
which also holds the on/off switch and per-step wording overrides (committed strings are the
fallback). Steps 2-7 SPOTLIGHT the real page element (`data-target-lg`/`data-target-sm` selectors on
each step; first visible match wins, a missing target falls back to the centered card): the
page dims through a cutout ring, the card docks to the bottom edge, a pointer bobs at the
target, and the target scrolls into view. All movement is reduced-motion-gated, and Done
fires the one-shot `celebrate()` burst. Step 2's wayfinding hints are viewport-split in CSS
(phone: topbar + tab bar; desktop: rail). Step 3 embeds class-picker chips that write the SAME `wcp-my-classes` key as
the home picker and dispatch the same `wcp:my-classes` event — `my-class.ts` listens and
re-personalizes the page behind the modal, so the home tiles are already reordered when the
tour closes. The greeting hero's "Take the tour" chip reopens it any time. The hub test
storageState pre-seeds `wcp-tour-seen` so the other suites never fight the overlay;
`tests/hub-tour.spec.ts` clears it deliberately.

### The org chart is DERIVED — the seat model (2026-08-29)

**The co-op's own structure was the last developer-only corner of the hub.** The chart's
SHAPE — its tiers, its two cabinet branches, its icons and committee sizes — lived in
`src/data/hub/org-holders.ts`, and the Studio's Role field was a fixed dropdown of fourteen
names. A school that renamed a role ("Operations Lead"), added one ("Sustainability Chair"),
or shrank its board could not do any of it. Now both halves are documents:

|                                                                                                 | Document                | Studio                                        |
| ----------------------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------- |
| The SEATS — what each job is, where it sits, who it reports to, team size, stipend, description | `coopRole`              | **Co-op roles & org chart** (drag to reorder) |
| The PEOPLE — who holds a seat this year, photo, contact                                         | `roleHolder`            | **Who's who this year (update each fall)**    |
| The five group HEADINGS on the job list                                                         | `coopGuidance.sections` | **How the co-op works → Job-list headings**   |

**The shape is derived, not stored.** `src/lib/hub-org.ts` (pure, unit-tested — 33 cases)
turns the two lists into a chart:

- **`tier`** puts a seat in one of five sections: `board`, `staff`, `chairs`, `reps`,
  `committee`. That list is the ONE thing still fixed in code, because it is the grammar the
  drawing follows (a top row, a paid-staff row, columns, rep cards, committee pills). A
  volunteer moves seats between the five and renames what each is CALLED; they do not invent a
  sixth kind of box. That is the brand-lock rule.
- **`reportsTo` is a reference to another seat**, and the COLUMNS fall out of it: a board seat
  becomes a column the moment something reports to it. Adding an officer, removing one, or
  moving a chair between two all work with no code. It replaced free text ("Reports to VP"),
  which a chart cannot follow — the tag on the job list is derived from the reference now, so
  it can never name a deleted role.
- **Paid staff are on the chart but NOT in the job list** (`LISTED_TIERS` in
  `coop-jobs.astro`): the page's claim is that every other role is a parent volunteer, so a
  teacher does not belong among the jobs a family signs up for.
- **Nothing is ever silently dropped.** A chair whose officer was deleted lands in a final
  **"Other roles"** column, so a volunteer SEES that it needs re-pointing.

**Class reps stay automatic.** There is ONE `coopRole` marked **`perClass`** ("One of these
for every class"), and `buildOrgChart` expands it into one rep card per live class, wearing
that class's own icon. A class the Board adds gets its rep card the same day, with no seat for
anyone to remember to create. `classRepPerson()` is the same rule for the class page's
`ClassRepCard` — which used to look the class up in a committed list, so a NEW class's rep card
could never be filled at all (fixed here, with a regression test).

**A rename never orphans a holder.** `roleHolder.seat` is a REFERENCE, so renaming "Publicity
Chair" to "Communications Chair" carries her card, photo and email with it. `toHolderMap` files
each holder under three keys — the seat id, `<seat id>:<class slug>` for a rep, and the legacy
role LABEL — so a document written before the migration still resolves, and so the committed
fallback (which has no Sanity ids) still joins by name.

Other rules worth knowing:

- **Sanity wins, including when it's empty.** Clearing a name really does vacate the seat, so
  a volunteer who steps down disappears from the chart via the Studio. An unreachable Sanity
  falls back to `src/data/hub/org-holders.ts` for BOTH the seats and the names — without the
  names, an outage would draw every seat as an open role, which reads as "the whole board
  resigned". Never add a new seat to that file; add it in the Studio.
- **A row with no name, no id, or an unknown section is dropped**, so a bad document cannot
  break the page.
- **Class reps link to a Directory entry** (`contactFrom`) rather than storing an email/phone,
  so the details live in exactly one place and none of them land in this public repo. The
  query resolves the adult whose name matches the holder. A family who opted **out** of the
  Directory resolves to nothing: the name shows, the contact links don't.
- **The holders read carries PII once a rep is linked, so it is never cached.** The seats read
  is not PII but is uncached too (it rides alongside). The class list the rep seats expand over
  is the hub's existing L1-only cached read — no new KV writes.

**The one-shot migration** was `node scripts/patch-org-chart.mjs --apply` (run 2026-08-29,
idempotent, dry-run by default): it turned every "Reports to" into a reference, created the
three paid-staff seats the old chart carried in code, ticked `perClass` on Class Rep, pointed
all 17 holders at their seats (the four reps at the ONE Class Rep seat plus their class), and
seeded the five job-list headings. One deliberate visual change: Copy Room Helper was drawn as
a chair CARD and also as a "Copy Room" pill; it is one seat now (a committee reporting to the
Secretary) and draws as a single pill.

Three seats are open for 2026-27 (Facilities Chair, Family Activities Chair, Copy Room
Helper) and exist as named documents with no holder, so the vacancy is visible in the
Studio rather than just missing.

**What a volunteer does, end to end:** rename a role → open it under **Co-op roles & org
chart**, change **Role**, Publish. Add one → **＋**, name it, pick **Where it sits** and
**Reports to**, Publish, drag to place. Remove one → delete it (and re-point anything that
reported to it, or find it under "Other roles"). Reorder → drag the list. Mark a seat vacant →
clear **Who holds it** on its "Who's who" card, or delete that card. All of it is written up in
the in-Studio guide as "Change the co-op roles or the org chart".

---

See also: [CLAUDE.md](../CLAUDE.md) (project overview and the two content paths) ·
[SANITY.md](SANITY.md) (the CMS and secrets) ·
[PAGE_BUILDER.md](PAGE_BUILDER.md) (the public-site page builder).
