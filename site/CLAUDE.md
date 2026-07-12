# CLAUDE.md

Guidance for Claude Code (and any developer) working in this repo. Read this first.

## What this is

The **West Chester Preschool** website — a volunteer-run cooperative preschool site, migrated off Squarespace onto a self-hosted stack the board can edit themselves.

**Stack:** Astro 7 · Tailwind v4 · Sanity (headless CMS) · Cloudflare Workers. Node **≥ 22.12**.

The whole public site is a **Sanity page-builder**: non-technical volunteers log into the Studio and edit every page Squarespace-style (click-to-edit, add/reorder sections, build new pages) with no code changes. See [docs/PAGE_BUILDER.md](docs/PAGE_BUILDER.md).

## Keep the docs in sync — on every change

**A change is not done until the docs describing it match reality.** Treat documentation as part of the change, not a follow-up. On every add / remove / modify — a feature, file, command, config, secret, gotcha, section type, or field — before you consider the work finished:

1. **Update the affected markdown.** Grep the docs for anything the change touches and fix it in the same commit: this file (`CLAUDE.md`), [`README.md`](../README.md), and [`docs/`](docs/) (`PAGE_BUILDER.md`, `SANITY.md`, `FAMILY_HUB.md`). New gotcha → add it to the Gotchas list. New command / secret / route → update the relevant section.
2. **Update the in-Studio volunteer guide** ([`src/sanity/guides/content.ts`](src/sanity/guides/content.ts)) **whenever the change alters what a volunteer sees or does** — a new/removed/renamed section type, a changed field or workflow, a new editing surface. This is the Help & Guide a non-technical board member reads; stale steps there are worse than none. (Purely internal changes — refactors, build config, this kind of stega fix — don't need a guide edit, but consciously decide that each time.)

The point: never leave stale docs that could mislead a later developer, AI, or staff member. If you changed it, the docs (and the guide, when volunteer-facing) change with it.

## The mental model: two content paths

Everything here makes sense once you hold these two paths apart:

|                | **Public marketing site**                            | **Family Hub** (`/family-hub/**`)                |
| -------------- | ---------------------------------------------------- | ------------------------------------------------ |
| Rendering      | **Static** — prerendered to HTML at build time       | **SSR** — server-rendered per request            |
| Who sees it    | Everyone                                             | Enrolled families only (password gate)           |
| Content source | Sanity, read at **build time**                       | Sanity, read at **request time** behind the gate |
| Reader client  | `src/lib/cms.ts` (build env token)                   | `src/lib/sanity.ts` (Worker runtime token)       |
| Updates when   | The site **rebuilds** (webhook on publish, ~1-2 min) | Instantly (live read)                            |
| Docs           | [docs/PAGE_BUILDER.md](docs/PAGE_BUILDER.md)         | [docs/FAMILY_HUB.md](docs/FAMILY_HUB.md)         |

A third piece, the **Presentation preview** (`/preview/**`), is SSR + draft-aware (stega click-to-edit) and used only inside the Studio. It is `noindex` and never part of the static output.

## Commands

```sh
npm run dev          # astro dev (see gotcha: /studio is blank locally — spaces in path)
npm run build        # astro build → dist/client (static) + dist/server (Worker)
npm run check        # astro check (types) + oxlint
npm run format:check # prettier
npm test             # Playwright: smoke + axe a11y + 320px reflow (builds fresh, serves dist)
npm run test:unit    # fast hermetic unit tests for pure lib code (no build/browser)
npm run test:hub     # Playwright: SSR Family Hub — shell + Home + every reskinned section (rail, drawer, 320px, axe light+dark) — separate config, see gotcha
npm run check:links  # linkinator over dist/client
npm run deploy       # build + wrangler deploy -c dist/server/wrangler.json  (see gotcha)
```

**Before committing, the full local gate is:** `npx astro check` · `npm run lint` · `npm run format:check` · `npm run build` · `npm run check:links` · `npm test`. CI runs the same, plus a Lighthouse accessibility gate (must hold 100).

## Where things live

```
src/
  pages/
    [...slug].astro          # STATIC public pages — getStaticPaths() reads page docs from Sanity
    news/                    # blog: index + /page/[n] pagination, [slug] article, rss.xml
    events.astro             # public Events page (upcoming dated events)
    preview/[...slug].astro  # SSR draft preview for the Studio (prerender=false, noindex)
    preview/news/[slug].astro # SSR draft preview for a News post
    thank-you.astro          # contact-form landing (no-JS submit target)
    search.astro             # site search (Pagefind UI over the build-time index)
    family-hub/**            # SSR gated hub pages
    api/                     # hub login/logout, draft-mode toggle, contact (form → Sanity + Resend)
  components/
    sections/                # page-builder: SectionRenderer + one bridge per section type
    ui/, faq/, hub/, preview/
    *.astro                  # the ~30 shared presentational components sections render through
  sanity/
    schemaTypes/             # documents/, objects/, sections/, singletons/ + index.ts (registry)
    structure.ts             # the Studio left-nav a volunteer sees
    resolve.ts               # Presentation Tool location map (doc → /preview route)
    guides/content.ts        # in-Studio "Help & Guide" volunteer walkthroughs (plain-language)
  lib/
    cms.ts / sanity.ts / cms-preview.ts   # the three Sanity read clients (build / gated / preview)
    queries.ts               # all GROQ (PAGE_BY_SLUG_QUERY is the big page-builder projection)
    image.ts, portable-text.ts, nav.ts, utils.ts (withBase)
  data/                      # typed fallbacks (site.ts, nav.ts) used when Sanity has no value
scripts/
  migrate-pagebuilder.mjs    # idempotent: transcribes all pages + nav into Sanity (+ pagebuilder-lib.mjs)
docs/                        # PAGE_BUILDER.md, SANITY.md, FAMILY_HUB.md
```

## Conventions (follow these)

- **Brand-lock is non-negotiable.** The page-builder gives volunteers _content_ control (what sections, what order, text, photos) but **zero design control** — no color/font/spacing/layout fields. Bands are limited to background `white|grey|cream|navy` + seam/compact booleans; images require alt; icons are a validated dropdown. Never add a design knob to a section schema. This is what keeps volunteer-built pages on-brand and avoids the "AI slop" look.
- **Copy voice (visitor-facing text only):** no em-dashes, no ellipses. Short, warm, parent-centered. Avoid AI-tell words (delve, leverage, robust, seamless, nurturing, "not just X, it's Y"). Internal docs and code comments are exempt.
- **Accessibility is a hard gate.** Sections must keep their heading order (`SectionHeader as="h2"`, card `h3`) and `aria-labelledby` wiring, or the Lighthouse a11y score drops below 100 and CI fails. The Playwright a11y test runs axe's **default** rule set (not a wcag-only filter) on purpose — it catches the best-practice rules Lighthouse also checks.
- **Motion is opt-in and reduced-motion-safe.** The motion toolkit lives in `globals.css`: the `data-reveal` scroll system (variants `up`/`fade`/`left`/`right`/`scale`/`blur`, stagger via `--reveal-delay`) plus reusable classes `wcp-lift`, `wcp-pop` (icon pop on `.group` hover), `wcp-nudge`, `wcp-sheen` (CTA sheen), `wcp-underline`, `wcp-float`. Everything that MOVES is gated behind `@media (prefers-reduced-motion: no-preference)`, so reduced-motion users get a still page — keep it that way, and never put motion on the LCP hero heading (it would delay first paint). Hover lifts on interactive Tailwind must always pair with `motion-reduce:hover:translate-y-0`.
- **Each class owns a brand color — use the helper, don't hardcode.** Twos = amber, Threes = green, Pre-K AM = orange, Pre-K PM = sky (matches the Sanity `class.color` field). [`src/lib/class-colors.ts`](src/lib/class-colors.ts) is the single source of truth: `classColor(slug)` gives the color, `classStyles(slug)` gives ready-made AA-safe Tailwind class sets (`badge` = white on a theme-stable dark fill for photo overlays, `chip`/`text`/`iconChip` for labels, `border`/`dot` for accents). The strings are full literals so Tailwind's JIT generates them — never build `bg-${color}`. Applied on the directory class overlay, the hub class pages (`ClassHubBody`), tuition cards, and the hub class nav cards. When you show or mention a specific class, tint it with this helper.
- **Hub pages are one app surface — reuse the hub primitives.** Every `/family-hub/*` page uses `HubShell` `bare` (no navy band) → `<Section bg="grey">` → **`HubPageHeader`** (owns the page `h1#hub-page-title`) → content in **`HubCard`** (the single card primitive: plain / titled / `as="a"` link / `as="li"`) → `HubProgress` for bars → `HubEmptyState` for empty data → `SectionRenderer` as a top-level sibling for Board-added sections. Icon-chip convention: neutral `bg-sky/15 text-sky-ink`; class-specific `classStyles(slug).iconChip`; semantic (money→green, health→orange, celebration→amber) only where it carries meaning. Don't hand-roll card classes — route through `HubCard`. The reskinned inner pages are covered by `npm run test:hub` (axe light+dark + 320px, per route).
- **View Transitions: client scripts must init on `astro:page-load`.** BaseLayout ships Astro's `<ClientRouter />` (smooth cross-page cross-fade), so navigations swap `<body>` WITHOUT a full reload and a module's top-level code runs only once. Any script that wires the DOM must use `onPageLoad(fn)` from [`src/scripts/_page-load.ts`](src/scripts/_page-load.ts) (re-runs on the initial load + every navigation; it also catches up if the module registered after the initial `astro:page-load`). Rules: element listeners re-bind freely (elements are swapped in fresh); window/document listeners bind ONCE (module guard) and re-query at event time; intervals/observers clean up in `onBeforeSwap`. Put the logic in a real module file imported via `<script>`, not an inline layout `<script>` (Astro dev doesn't reliably re-execute those). The scroll-reveal ([`src/scripts/reveal.ts`](src/scripts/reveal.ts)) reveals on-screen elements via a geometry check so first paint never waits on IntersectionObserver (which doesn't fire in a backgrounded tab).
- **Match the surrounding code.** Components are heavily commented with the _why_; keep that density. Tailwind v4 (CSS-first config in `src/styles/globals.css`), no `tailwind.config.js`.
- **Secrets never get committed.** `SANITY_TOKEN` lives in `.env` (build reads) and `.dev.vars` (Worker runtime) — both gitignored. `FAMILY_HUB_PASSWORD` is a Cloudflare secret. See [docs/SANITY.md](docs/SANITY.md).

## Gotchas (these have each cost real time)

- **`wrangler deploy` alone 404s every sub-route.** This is a hybrid static+SSR build; deploy with the adapter-generated config: `wrangler deploy -c dist/server/wrangler.json` (baked into `npm run deploy` and the Deploy workflow).
- **CI/Lighthouse builds need `SANITY_TOKEN`.** Since pages are CMS-driven, `getStaticPaths()` reads them from Sanity at build time — a tokenless build emits an empty site. All three workflows pass `secrets.SANITY_TOKEN`.
- **`/studio` is blank under `npm run dev`.** The project folder path contains spaces (`West Chester Preschool Website`), which breaks Vite's dev-time Studio module loading. **Dev-only** — the deployed `/studio` is fine. To edit locally, use the deployed `/studio` or `npx sanity dev`. There is intentionally **one** Studio — the embedded `/studio` (always current because it rebuilds on every deploy); we do **not** run a separate hosted `*.sanity.studio`, which drifts out of date. Don't `npx sanity deploy`. See [docs/SANITY.md](docs/SANITY.md).
- **Slug is a string + regex, not Sanity's `slug` type.** Sanity's slugify strips the slashes that `classes/twos` needs.
- **Never compare a stega-encoded string in logic.** In the `/preview` path, stega encodes ~1KB of invisible marker characters into every string so click-to-edit works, so `tone === 'navy'` is `false` on an encoded value and the component picks the wrong branch (this once rendered the navy CTA as cream in preview only). Dropdown/enum fields that drive rendering are excluded from stega via the `filter` in [`src/lib/cms-preview.ts`](src/lib/cms-preview.ts) — **add any new logic-driving enum field to that `NON_STEGA_FIELDS` list.** Display strings stay encoded (that is the point).
- **Trailing slash:** static `output` + directory format means `/about` → 307 → `/about/` → 200. Expected, not a bug.
- **Hero videos are gitignored** (`public/hero/*.mp4|webm`, belong in R2/Sanity), so they 404 on a clean build and the site degrades to the poster image. The link-check and tests skip them.
- **Windows-only:** local `lhci autorun` can exit 1 on an `EPERM` temp-cleanup crash even when the audit passed. Linux CI is the real Lighthouse gate.
- **Site search needs a build.** Pagefind indexes `dist/client` in the `postbuild` npm hook, so `/search` returns nothing under `astro dev` — test it against a real build. `data-pagefind-body` on `<main>` limits the index to page content (and skips the Studio).
- **The static a11y/reflow/smoke suites can't reach the gated hub** — they serve the static `dist/client`, and `/family-hub/*` is SSR-only (excluded on purpose, see `tests/routes.ts`). Hub shell coverage lives in `npm run test:hub` (`playwright.hub.config.ts`), a separate config. It boots with `npm run build && npm run preview` (wrangler), **not** `astro dev`: on this Astro 7 + Cloudflare stack, `astro dev` always daemonizes to a detached background process and the launching command exits immediately, which Playwright's `webServer` reads as a startup failure even though the server is actually up.
- **Client scripts loaded once for both hub chrome pieces.** The hub drawer (`src/scripts/hub-drawer.ts`) and theme toggle (`src/scripts/theme.ts`) are imported once from `BaseLayout`'s hub branch, not per-component — `HubRail` is rendered twice (desktop rail + the drawer's contents), and `theme.ts` already re-queries all `[data-theme-toggle]` instances on click, so this stays in sync without extra wiring. Both use `onPageLoad`/`onBeforeSwap` (View-Transitions safe).
- **`--color-*-ink` tokens are for text on a dark PAGE, not for a fill inside a fixed-chrome island.** In dark mode `globals.css` redefines `--color-orange-ink` (and the other ink tokens) to alias the bright tier, because bright colors read fine as text on a dark page. The hub rail's navy chrome doesn't change with the site theme, so its active-link fill hardcodes the ink hex (`#a85300`) instead of the token — using the var there would silently break contrast in dark mode. See the comment in `HubRail.astro`.
- **Colored `-ink` text on a soft color tint fails AA in DARK mode — the #1 trap when building hub cards.** `text-sky-ink` on `bg-sky/15`, `text-orange-ink` on `bg-amber/25`, etc.: in dark mode the `-ink` token flips bright AND the tint darkens over the dark surface, so contrast drops to ~4:1 or worse (a text pill that's fine in light mode). Rules: (1) soft-tint backgrounds are safe **only** behind an `aria-hidden` icon; the **label text stays neutral** (`text-heading`/`text-ink`/`text-ink-muted`). (2) Keep tinted chips inside white `HubCard`s, never directly on the `bg-grey` canvas (tint-over-grey is darker still). (3) `classStyles(slug).text` (an `-ink` color as text on a WHITE card, e.g. a price) is fine — that's verified AA in both themes; the failure mode is specifically colored-text-on-colored-tint. All hub inner pages are axe-checked in light AND dark by `npm run test:hub`, which catches these.
- **Greeting/date logic on the hub home must use Eastern wall-clock time, never raw `Date` methods.** The Cloudflare Workers runtime's `Date` is UTC with no local timezone data, so `getHours()`/`getDate()` produce the wrong "Good morning/afternoon/evening" (or the wrong day) for a chunk of the day. Always go through `toLocaleString(..., { timeZone: 'America/New_York' })` instead. See the working pattern in `HubGreeting.astro`.
- **Date-only event strings ("YYYY-MM-DD") must be anchored to NOON UTC before timezone-formatting.** `new Date('2026-07-20')` is UTC midnight, which formats as July 19 in Eastern time — all-day events would show a day early. `src/lib/hub-calendar.ts`'s `eventDate()` does `new Date(iso + 'T12:00:00Z')` for date-only strings; use it, don't parse event dates by hand.
- **The Google Sheets gviz endpoint returns JSONP-ish text, not JSON.** `.../gviz/tq?tqx=out:json` wraps the payload in `google.visualization.Query.setResponse(...)`; there is no plain-JSON mode. `src/lib/gsheets.ts` cuts the JSON out from between the outer parens — go through it (`getBudgetSnapshot`/`getFundraisers`), don't fetch sheets by hand. All hub live-data fetches carry an 8s `AbortSignal.timeout` and degrade to the widget's designed empty state on any failure.

## Deploy & CI

- **Repo:** `NateJ45/wcp-website` (private). **Live:** `wcp-website.nathanjnixon86.workers.dev`.
- **Workflows** (`.github/workflows/`): `ci.yml` (types, lint, format, build, links, Playwright), `lighthouse.yml` (a11y gate 100), `deploy.yml`.
- **Deploy triggers:** push to `main`, **or** a Sanity `repository_dispatch` webhook fired on publish (so CMS edits go live without a code push). Setup in [docs/SANITY.md](docs/SANITY.md).

## Deeper docs

- [docs/PAGE_BUILDER.md](docs/PAGE_BUILDER.md) — page-builder architecture (page doc, section palette, renderer, routing, migration).
- [docs/SANITY.md](docs/SANITY.md) — Sanity project, the Studio, secrets, the auto-deploy webhook.
- [docs/FAMILY_HUB.md](docs/FAMILY_HUB.md) — the gated family area and its password gate.
- [docs/ROLES.md](docs/ROLES.md) — Sanity roles/access (owner-only admin task); what the tiers allow.
- [docs/FORMS.md](docs/FORMS.md) — contact forms: how submissions flow, and the Resend email setup step.
- [docs/REDIRECTS.md](docs/REDIRECTS.md) — mapping old Squarespace URLs → new at domain cutover.
