# Family Hub — how the gate works & how to run it

The Family Hub (`/family-hub/**`) is the private, enrolled-families-only area. Unlike
the marketing pages (which are static HTML built ahead of time), every hub page is
**server-rendered on each request** so it can (a) check you're signed in and (b) read
private content that must never sit in the public site or in git.

> ⚠️ **TEMPORARY — the gate is currently OPEN for private preview.** `src/middleware.ts`
> has `const HUB_OPEN = true`, which bypasses the sign-in check so the hub can be previewed
> without a password while the site isn't public and there is no real family data in Sanity.
> **Set `HUB_OPEN = false` and redeploy before launch, or before ANY real family PII
> (directory, health) is entered in the Studio.** Everything below describes the gate as it
> works when `HUB_OPEN` is `false`.

## How the gate works

1. **Middleware** (`src/middleware.ts`) runs on every request to a `/family-hub/*` page.
   If you have no valid session it redirects you to `/family-hub/login`, remembering
   where you were headed (`?to=…`) so you land there after signing in.
2. **Login** (`/family-hub/login`) takes the one shared family password and POSTs it to
   `/api/hub-login`, which compares it (constant-time) to the `FAMILY_HUB_PASSWORD`
   secret. On a match it sets a signed, `HttpOnly` session cookie and sends you on.
3. **Sign out** posts to `/api/hub-logout`, which destroys the session.

The password is a **single shared password for the whole school**, rotated each year —
not a per-family login. That matches the old Squarespace hub and keeps it simple for a
volunteer board.

## The hub shell

Every `/family-hub/*` page renders inside `HubShell` → `BaseLayout chrome="hub"`, which
draws the hub's persistent chrome:

- **Desktop (≥ `lg`):** a sticky left navigation **rail** (`HubRail.astro`), built from the
  single grouped nav config in `src/data/hub-nav.ts` — Home, News & Events, Resources,
  Money, Community, Classes — with the active page highlighted, a light/dark `ThemeToggle`,
  and Sign out.
- **Mobile (< `lg`):** a top bar (`HubTopBar.astro`, the page title + menu button) that opens
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

| Widget / feature                     | Live source                                                      | Edited at                                                                       |
| ------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Class helper-schedule tiles          | Per-class Google Sheets                                          | each `class` doc → **Helper schedule link**                                     |
| Class Photos                         | Google Photos albums                                             | each `class` doc → **Class photo album link**                                   |
| Budget Snapshot                      | Budget Sheet "Budget" tab (gviz, `src/lib/gsheets.ts`)           | Site Settings → **Budget Google Sheet ID**                                      |
| Fundraising (widget + page totals)   | Budget Sheet "Fundraising" tab                                   | same sheet id; treasurer edits the sheet                                        |
| Upcoming Events (widget + Calendar)  | Google Calendar via Apps Script feed (`src/lib/hub-calendar.ts`) | Site Settings → **Calendar feed link**; falls back to Sanity `event` docs       |
| Calendar subscribe buttons           | built from `googleCalendarId`                                    | Site Settings → **Google Calendar ID**                                          |
| President's note (first-visit modal) | `presidentNote` singleton (live read)                            | Family Hub → **President's note** (bump the version stamp to re-show)           |
| "What we've raised together" band    | past-year grand totals (Fundraising page navy band)              | Site Settings → **Past fundraising totals** (add the just-ended year each fall) |

Every fetch is try/catch'd with a short timeout — a failed source degrades to the designed
empty state, never a broken card. Seed/refresh the letter with
`node scripts/seed-president-note.mjs`.

### Home dashboard settings

The greeting hero and progress bar read four optional `siteSettings` fields (Studio → **Site
Settings → School year tab**): `yearStart` and `yearEnd` (drive the school-year progress bar),
`firstDay` (drives the "N days until school" countdown before the year starts), and
`familyCount` (an optional override for the family count shown on the dashboard; leave it blank
to use a live count of opted-in Directory families instead). All four are meant to be **filled
in by hand in the Studio at the start of each school year** — there's no migration script for
them, unlike the Directory import.

### The app-surface layout (every section page)

Every inner section page (Updates, Calendar, Documents, Directory, Health, Tuition,
Fundraising, Co-op Jobs, the four class pages) is laid out as **one app surface**, matching
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

Existing sessions keep working until they expire or the person signs out; new sign-ins
require the new password. Email the new password to families in the welcome message.

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

All twelve section pages are **built with their real layouts** from the current live hub
(tuition rates + pay buttons, the document library, class facts, co-op role descriptions,
health/illness policy, event-type legend, and so on), and every page's heading, intro, and
body sections are Board-editable through the page-builder (see "Editing hub pages" below).
Each page's live/private data reads from Sanity behind the gate:

| Section                       | Live data source                                                              |
| ----------------------------- | ----------------------------------------------------------------------------- |
| Calendar                      | Google Calendar (set `googleCalendarId` in Site Settings; auto-loads on idle) |
| Fundraising                   | `campaign` docs (Treasurer updates the raised amount in the Studio)           |
| Updates                       | `update` docs (the migrated meeting blog; `category` = announcement/minutes)  |
| Documents                     | `hubDocument` docs                                                            |
| Co-op Jobs                    | `coopRole` docs + org-chart holders (`src/data/hub/org-holders.ts`)           |
| Classes                       | `class` docs (facts + tuition button) + `teacherNote` docs (welcome modal)    |
| Tuition                       | `class` docs (rates + PayPal button) + the `feeSchedule` singleton            |
| Directory, Health (per-child) | `directoryEntry` docs / per-child info — opt-in PII, gated only               |
| Sign-ups & RSVPs              | `signupSheet` docs (board creates) + `signupEntry` docs (families respond)    |

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

- **Bottom tab bar on phones** (`HubTabBar`, < md): Home / Calendar / Sign-ups /
  Updates / More (More opens the drawer). Theme-stable navy island; BaseLayout pads
  `main` so content clears it.
- **Search (Cmd/Ctrl+K)** — `HubSearch` dialog + `hub-search.ts`, fed by the gated
  `/family-hub/api/search-index` (hub pages from `hub-nav.ts`, updates, documents,
  open sign-up sheets). Triggers: the rail's Search row, the phone strip's icon, and
  the desktop topbar's search field.
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
  usable with no JS — and `hub-menus.ts` adds outside-click/Escape closing. `HubTable`'s
  sticky column headers offset by `lg:top-14` to slide under this bar.
- **The bell** (`HubBell.astro`): server-renders the recent feed (updates + newest
  documents, one `BOARD_CONTENT_CACHE`-tier query fetched once in `HubTopBar` and shared
  by both bell instances). Updates with the Board's **`highlight`** checkbox pin to the
  top with an amber "Important" pill until the Board unchecks them. `hub-fresh.ts` adds
  the unseen-count badge and marks everything seen when a panel is opened.
- **Persistent-shell view transitions**: the rail, both top bars, and the tab bar carry
  `view-transition-name`s (globals.css), so hub→hub navigations hold the shell still
  while only the content cross-fades — the app feel without client routing. Motion-only
  (named under `prefers-reduced-motion: no-preference`).
- **My classes** (`my-class.ts`, localStorage `wcp-my-classes`, no accounts):
  MULTI-select toggle chips on the home dashboard (plenty of families have kids in
  more than one class); each picked class's helper tile moves to the front with a
  "Your class" tag, its photo album gets a ring, and its rail link gets a dot (the
  shared Pre-K page link is never double-dotted).
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
  their stat. The Fundraising widget pairs a ring with its `HubStat` + status
  `HubPill`s, and Budget Snapshot's balance is a `HubStat`. Layout note: the class-tile
  grid fills its bento row with `lg:flex-1` (wrapper is `lg:flex-col`), NOT `h-full` —
  a percentage height there resolves after intrinsic row sizing and overflows the cell
  into Announcements whenever the hero grows (bit twice on 2026-07-14).
- **Texture & flair**: the canvas is construction paper (grain + hand-drawn doodle
  tile, light/dark variants — globals.css "Hub canvas texture"; direct grey Sections
  render transparent over it), a warm glow sits behind the greeting and a
  class-colored one behind each class page header, the greeting carries a live
  weather chip (Open-Meteo via `hub-weather.ts`, SWR-cached, hides on failure), and
  sign-up success fires a reduced-motion-safe confetti burst.
- **Class pages** open with a `TeacherCard` (photo/name/role/**email + phone** straight
  from the class's `teacherNote` doc — the same fields that power the welcome modal; the
  card shows a **Say hi** (email) and a **Call or text** (phone) link), beside the facts
  grid, then a photo "How our day flows" `storyTimelineSection` seeded from each class's
  own schedule (`scripts/seed-class-stories.mjs`; the board swaps in real class photos in
  the Studio).
- **Signed sign-off CTA.** The handbook's **closing** CTA on a class page becomes a signed
  sign-off card: the teacher's headshot in a class-colour ring + **Email** / **Call or
  text** pill buttons (`TeacherSignoff.astro`), which stand in for the CTA's plain-text
  note. `HubSectionedBody` takes a `signoff` slug (`twos` / `pre-k`) and renders that
  page's LAST `ctaSection` through `CtaSection` with a `teacherSlug`, so a mid-handbook CTA
  never gets a signature. Contact comes from the same `teacherNote` (email + the
  2026-07-15 `phone` field); phone falls back to `teacherPhoneFallback` (`live-links.ts`)
  until the Studio field is filled — the numbers were already public in each handbook's
  closing note. Erin signs Twos & Threes; Mrs. Lisa signs Pre-K.

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
Text, uploads inline flyer images, and `createOrReplace`s `hubUpdate-<slug>` docs
(idempotent). Going forward the Board just adds `update` docs in the Studio.

## Directory & map

The **Directory** reads opted-in `directoryEntry` docs (PII, gated), sorted
alphabetically by `familyName` (the surname). Every family is **fully editable in Studio →
Family Hub → Directory**: family name, each parent (name + their own email + phone), each
child (name + class), a family photo, the home address, the map pin, notes, and a "Show in
directory" toggle. Adding a new family = create a `directoryEntry` and turn on "Show in
directory". The **Map** is a Board on/off switch — **Site Settings → Connected services → "Show
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
(per-child health info, calendar embed, PayPal buttons, directory map, live campaign bars,
class facts) stays locked in code and the editable sections wrap around it. If no `hubPage`
doc exists for a key, the page shows its built-in fallback content, so it can never go blank.

Edit them in **Studio → Family Hub → Hub pages**. Seed a page's starting content with
`node scripts/migrate-hub-pages.mjs` (idempotent, `hubPage-<key>` ids).

**All hub pages are converted:** Landing (`home`), **Getting Started** (`getting-started` —
new-family onboarding), Calendar, Co-op Jobs, Documents, Tuition, Updates, Fundraising,
Health, Directory, and the class pages (`twos`, `threes`, and the merged `pre-k` — both
Pre-K classes share one page, with `/family-hub/pre-k-am|pm` 301-redirecting there). Each
reads its `hubPage` doc for an editable heading, intro, and a stack of hub-safe sections,
wrapped around a **fixed widget** that stays locked in code:

**The knowledge base:** the 2026-27 source documents (Family Handbook, May Gathering
orientation deck, Safety Plan, bylaws digest, member-approved budget, Super Helper
certification) are transcribed into editable sections across getting-started / health /
coop-jobs / tuition / fundraising / calendar / twos / threes by
`node scripts/seed-hub-knowledge.mjs` (re-running RESETS those pages to that baseline).
The source PDFs are uploaded as gated `hubDocument` files on the Documents page — the
PDFs themselves are gitignored (they contain the hub password and phone numbers).

**Each class page carries that teacher's entire parent handbook** as editable sections. Pre-K
(daily schedules, drop-off/pick-up, the helper-day playbook, snack duty, helper wisdom,
communication, dress code, FAQs, and the class-pet band) is seeded from Mrs. Lisa's 2026-27 PDF
by `node scripts/seed-pre-k-page.mjs`; its fixed widget is the pair of AM/PM fact cards (facts,
pay button, helper sheet, photo album per class). **Twos + Threes** likewise share ONE page,
`/family-hub/twos-threes` (same teacher Ms. Erin, same 9:30-noon rhythm, same handbook): the
combined page shows Erin's teacher card + a Twos and a Threes fact card side by side, and reads
the handbook from `hubPage-twos` (seeded by `node scripts/seed-twos-threes-page.mjs`, which
writes the identical sections to both `hubPage-twos` and `hubPage-threes`). `/family-hub/twos`
and `/family-hub/threes` 301-redirect to the combined page; the nav + home class cards point
there. Re-running a seed RESETS that page to its baseline; day-to-day edits happen in the Studio.

The handbook body (and Getting Started) renders through `HubSectionedBody` → the shared
`SectionRenderer`, i.e. the SAME page-builder sections the public site uses. Their marketing
register (centered eyebrow headers, hero-scale type, alternating full-bleed bands) would read as
"a web page dropped into the app," so `HubSectionedBody` wraps them in `.hub-prose` and a scoped
skin in `globals.css` re-skins them as app content: headers left-align, the eyebrow kicker drops,
and type shrinks to app scale.

The content-heavy hub pages — **Co-op Jobs, Health & Safety, Tuition, Fundraising** — also run
their Board-editable sections through `HubSectionedBody` (they used to render them as plain
full-width `SectionRenderer` bands at the page tail). On Co-op Jobs / Tuition / Fundraising the
fixed dashboard content stays full-width and the handbook sections follow as a card doc column
with its own TOC ("dashboard above, handbook below"); Health swaps its fixed fallback for the doc
column when the Board manages the page. This is what makes the two-level TOC pay off: the seed
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
side); below xl the TOC hides and the cards run full-width. Grid + card CSS lives in the
"Handbook document column" block of `globals.css`, keyed off `.hub-doc-grid` / `.hub-doc-block`.

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
from `src/lib/hub-reading-time.ts` (`estimateReadMinutes`, ~200 wpm over headings + prose + FAQ
text only — scannable blocks like schedules/tables are deliberately not counted); the stamp is
`formatMonthYear(doc._updatedAt)` from `src/lib/hub-dashboard-dates.ts` (Eastern-safe, per the
Workers-UTC gotcha). `HUB_PAGE_QUERY` projects `_updatedAt`. Both helpers are Vitest-covered.

A `card` section shows a small **type-derived icon chip** above its title (map in
`HubSectionedBody`; no Sanity field, so it stays brand-locked), and the whole column can be
**tinted to a class color** via `HubSectionedBody`'s `tint` prop (a class slug — the pre-k and
twos-threes handbooks pass theirs): the card chips use that class's `iconChip` and the active TOC
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
fetches never block the dashboard. Categories, products, and the stat come **live from Fourthwall**
via `src/lib/fourthwall.ts` (cached, SWR):

- `getStoreCollections()` — the Storefront API: the store's real categories, one tab each
  ("Featured" leads and opens by default). Empty categories are dropped; if none come back the
  card shows the whole catalog as a single rail.
- `getStoreProducts(slug)` — the Storefront API (`FOURTHWALL_STOREFRONT_TOKEN`, read-only): up to
  12 products per category (name, price, image, product link), so new/changed products appear
  automatically.
- `getMerchStats()` — the Open API (`FOURTHWALL_API_USER` / `_PASSWORD`, basic auth, SUPER-ADMIN):
  AGGREGATE order totals only (gross sales + order count; no customer PII ever read out). Note
  Fourthwall's API exposes no profit figure, so this is gross **sales**, not a "raised" number.

All three are Worker secrets (`.dev.vars` locally, `wrangler secret put` in prod — see
`.dev.vars.example`), never committed. Everything degrades gracefully: if the Storefront API is
unavailable the tiles fall back to the Board-curated `storeProducts[]` on Site Settings →
Social & store (`storeHeadline` / `storeTagline` / `storeUrl` / each product `title`/`price`/
`url`/`image`; seeded once by `node scripts/seed-store-feature.mjs`); if the Open API is
unavailable the stat hides. The card hides entirely without a `storeUrl`.

**The community wall** (`SocialWallWidget.astro`) sits directly **below the store card** and closes
the hub home on a human note — a navy bulletin board of pinned snapshots (white polaroid frames,
brand-colour pushpins, a gentle random tilt, hover-straighten; a dot grid + doodle texture behind),
the hub-home twin of the public "Life inside WCP." section and the old Squarespace bulletin board.
It reads the **same Board-curated album the public section falls back to** — `album-life-inside-wcp`
(Studio → **Photo albums** → "Life inside WCP"; seeded by `node scripts/add-instagram-home.mjs`), at
request time through the cached authenticated client (`BOARD_CONTENT_CACHE`), so editing that one
album updates **both** the public home and the hub home. No Instagram token is needed. Images are
requested at 400px (2x for the ~190px tiles, no over-fetch); the widget renders nothing when the
album is empty. Motion is reduced-motion-safe. It's rendered **inline** (not a `server:defer`
island) — the single album read rides the CDN cache, below the cost of an extra island round-trip.

| Hub page                          | Fixed widget (locked)                                                                        | Already editable elsewhere                         |
| --------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Landing                           | Quick-link nav grids                                                                         | —                                                  |
| Calendar (month-separated agenda) | Google Calendar embed (auto-loads on idle, non-blocking) + event legend                      | `googleCalendarId` in Site Settings                |
| Co-op Jobs                        | Role descriptions + tiered org chart                                                         | `coopRole` docs (holders: `org-holders.ts`)        |
| Documents                         | Document library + required-forms callout                                                    | `hubDocument` docs                                 |
| Tuition                           | Pay-card + fee-card layout, payment FAQ                                                      | `class` docs + `feeSchedule` (rates, buttons, FAQ) |
| Updates                           | Meeting-blog post list (minutes rows get a category pill)                                    | `update` docs                                      |
| Fundraising                       | Year ring + stat, per-fundraiser status pills                                                | `campaign` docs                                    |
| Health                            | Illness policy cards + closures band                                                         | —                                                  |
| Directory                         | Opt-in family cards + map, alpha jump rail, class-ring initial avatars for no-photo families | `directoryEntry` docs                              |
| Class pages                       | Fact-card + pay-button layout, teacher modal                                                 | `class` docs (facts, button) + `teacherNote` docs  |

Only the widget **layout** stays in code. All of its content is Board-editable through its own
doc type: class facts, tuition rates, and PayPal button ids live in the `class` docs and the
`feeSchedule` singleton; documents, teacher notes, campaigns, co-op roles, and family cards each
have their own docs. A mistyped icon name from any of these is guarded by `safeIcon`, so it
can never crash a page. Everything on every hub page is now Board-editable.

**Welcome-letter modals:** the hub home shows the `presidentNote` singleton once per version
stamp; each class page shows its class's `teacherNote` doc the same way (Studio → Family Hub →
Teacher welcome notes; seed/refresh with `node scripts/seed-teacher-notes.mjs`). Both share
`src/scripts/note-modal.ts` (per-note localStorage keys).

**Org chart holders:** who fills each role each year is `src/data/hub/org-holders.ts` — a
plain data file (names/emails only render behind the gate). Update it after spring elections.

---

See also: [CLAUDE.md](../CLAUDE.md) (project overview and the two content paths) ·
[SANITY.md](SANITY.md) (the CMS and secrets) ·
[PAGE_BUILDER.md](PAGE_BUILDER.md) (the public-site page builder).
