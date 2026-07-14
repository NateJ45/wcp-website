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
  (`as="a"`), or a list item (`as="li"`). Progress bars go through **`HubProgress`**.
- **Empty states** everywhere via `HubEmptyState`. **Icon-chip convention:** neutral is
  `bg-sky/15 text-sky-ink`; class-specific is `classStyles(slug).iconChip`; semantic
  (money/health/celebration) only where it carries meaning.

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

| Section                       | Live data source                                                             |
| ----------------------------- | ---------------------------------------------------------------------------- |
| Calendar                      | Google Calendar (set `googleCalendarId` in Site Settings; click-to-load)     |
| Fundraising                   | `campaign` docs (Treasurer updates the raised amount in the Studio)          |
| Updates                       | `update` docs (the migrated meeting blog; `category` = announcement/minutes) |
| Documents                     | `hubDocument` docs                                                           |
| Co-op Jobs                    | `coopRole` docs + org-chart holders (`src/data/hub/org-holders.ts`)          |
| Classes                       | `class` docs (facts + tuition button) + `teacherNote` docs (welcome modal)   |
| Tuition                       | `class` docs (rates + PayPal button) + the `feeSchedule` singleton           |
| Directory, Health (per-child) | `directoryEntry` docs / per-child info — opt-in PII, gated only              |
| Sign-ups & RSVPs              | `signupSheet` docs (board creates) + `signupEntry` docs (families respond)   |

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

A related nicety: the site is installable (a PWA manifest with maskable icon and
hub/calendar shortcuts), so families can pin the hub to their phone's home screen —
there is deliberately **no service worker** (the SSR hub must never serve stale).

## The app layer (2026-07 "feel like an app" pass)

- **Bottom tab bar on phones** (`HubTabBar`, < md): Home / Calendar / Sign-ups /
  Updates / More (More opens the drawer). Theme-stable navy island; BaseLayout pads
  `main` so content clears it.
- **Search (Cmd/Ctrl+K)** — `HubSearch` dialog + `hub-search.ts`, fed by the gated
  `/family-hub/api/search-index` (hub pages from `hub-nav.ts`, updates, documents,
  open sign-up sheets). Triggers: the rail's Search row + the top bar's icon.
- **My classes** (`my-class.ts`, localStorage `wcp-my-classes`, no accounts):
  MULTI-select toggle chips on the home dashboard (plenty of families have kids in
  more than one class); each picked class's helper tile moves to the front with a
  "Your class" tag, its photo album gets a ring, and its rail link gets a dot (the
  shared Pre-K page link is never double-dotted).
- **"New since your last visit"** (`hub-fresh.ts`, localStorage `wcp-updates-seen`):
  home announcement/minutes items newer than your last Updates visit get a "New"
  pill and the Updates links (rail/drawer/tab bar) a count badge; opening Updates
  clears it. Widgets carry `data-published` for this.
- **Texture & flair**: the canvas is construction paper (grain + hand-drawn doodle
  tile, light/dark variants — globals.css "Hub canvas texture"; direct grey Sections
  render transparent over it), a warm glow sits behind the greeting and a
  class-colored one behind each class page header, the greeting carries a live
  weather chip (Open-Meteo via `hub-weather.ts`, SWR-cached, hides on failure), and
  sign-up success fires a reduced-motion-safe confetti burst.
- **Class pages** open with a `TeacherCard` (photo/name/role/email straight from the
  class's `teacherNote` doc — the same fields that power the welcome modal) beside
  the facts grid, then a photo "How our day flows" `storyTimelineSection` seeded from
  each class's own schedule (`scripts/seed-class-stories.mjs`; the board swaps in
  real class photos in the Studio).

## Updates / meeting blog

The **Updates** section is the meeting blog, migrated in full from the old Squarespace
`/blog` ("School Updates"). Each post is a Sanity `update` doc with `title`, `slug`,
`excerpt`, optional `image` (a flyer/graphic), `publishedAt`, `audience`, and a full
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
directory". It has a **List / Map toggle**: the map is Leaflet + OpenStreetMap (no API key,
no third-party tracker), plotting each family's home pin relative to the school (the ★). The
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

**The Pre-K page carries the entire parent handbook** as editable sections (daily schedules,
drop-off/pick-up, the helper-day playbook, snack duty, helper wisdom, communication, dress
code, FAQs, and the class-pet band) — seeded from Mrs. Lisa's 2026-27 PDF by
`node scripts/seed-pre-k-page.mjs` (re-running RESETS the page to that baseline; day-to-day
edits happen in the Studio). Its fixed widget is the pair of AM/PM fact cards (facts, pay
button, helper sheet, photo album per class).

| Hub page    | Fixed widget (locked)                              | Already editable elsewhere                         |
| ----------- | -------------------------------------------------- | -------------------------------------------------- |
| Landing     | Quick-link nav grids                               | —                                                  |
| Calendar    | Click-to-load Google Calendar embed + event legend | `googleCalendarId` in Site Settings                |
| Co-op Jobs  | Role descriptions + tiered org chart               | `coopRole` docs (holders: `org-holders.ts`)        |
| Documents   | Document library + required-forms callout          | `hubDocument` docs                                 |
| Tuition     | Pay-card + fee-card layout, payment FAQ            | `class` docs + `feeSchedule` (rates, buttons, FAQ) |
| Updates     | Meeting-blog post list                             | `update` docs                                      |
| Fundraising | Live campaign progress bars                        | `campaign` docs                                    |
| Health      | Illness policy cards + closures band               | —                                                  |
| Directory   | Opt-in family cards + map + privacy framing        | `directoryEntry` docs                              |
| Class pages | Fact-card + pay-button layout, teacher modal       | `class` docs (facts, button) + `teacherNote` docs  |

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
