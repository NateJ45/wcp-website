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
| Updates when   | The site **rebuilds** (webhook on publish, ~1-2 min) | ~1 min (authenticated Sanity CDN)                |
| Docs           | [docs/PAGE_BUILDER.md](docs/PAGE_BUILDER.md)         | [docs/FAMILY_HUB.md](docs/FAMILY_HUB.md)         |

A third piece, the **Presentation preview** (`/preview/**`), is SSR + draft-aware (stega click-to-edit) and used only inside the Studio. It is `noindex` and never part of the static output.

## Commands

```sh
npm run dev          # astro dev (see gotcha: /studio is blank locally — spaces in path)
npm run build        # astro build → dist/client (static) + dist/server (Worker)
npm run check        # astro check (types) + oxlint
npm run format:check # prettier
npm test             # Playwright: smoke + axe a11y + reflow at 320/768/1024/1440 (builds fresh, serves dist)
npm run test:unit    # Vitest: pure-function unit tests (hub date math, Portable Text heading normalizer)
npm run test:hub     # Playwright: SSR Family Hub — shell + Home + every reskinned section (rail, drawer, 320px, axe light+dark) — separate config, see gotcha
npm run check:links  # linkinator over dist/client
npm run deploy       # build + wrangler deploy -c dist/server/wrangler.json  (see gotcha)
```

**Before committing, the full local gate is:** `npx astro check` · `npm run lint` · `npm run format:check` · `npm run build` · `npm run check:links` · `npm test` · `npm run test:unit`. CI runs the same, plus a Lighthouse accessibility gate (must hold 100).

## Where things live

```
src/
  pages/
    [...slug].astro          # STATIC public pages — getStaticPaths() reads page docs from Sanity
    news/                    # blog: index + /page/[n] pagination, [slug] article, rss.xml
    newsletter/              # newsletter web archive: archive index + [slug] issue (compose in Studio; /newsletter signup page is a page-builder doc)
    events.astro             # public Events page (upcoming dated events)
    preview/[...slug].astro  # SSR draft preview for the Studio (prerender=false, noindex)
    preview/news/[slug].astro # SSR draft preview for a News post
    preview/live.ts          # SSE proxy: Sanity listen events → preview auto-refresh (token stays server-side)
    thank-you.astro          # contact-form landing (no-JS submit target)
    enrollment-packet.astro  # print-ready enrollment packet (CMS-assembled; Save as PDF via print CSS)
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
- **Accessibility is a hard gate.** Sections must keep their heading order (`SectionHeader as="h2"`, card `h3`) and `aria-labelledby` wiring, or the Lighthouse a11y score drops below 100 and CI fails. The Playwright a11y test runs axe's **default** rule set (not a wcag-only filter) on purpose — it catches the best-practice rules Lighthouse also checks. **Target is WCAG 2.2 AA** (audited 2026-07-14, public + gated hub, both themes): the default axe set already enforces the one machine-checkable 2.2 rule, `target-size` (SC 2.5.8) — don't narrow the test to `.withTags([...])` or you drop that coverage. SC 2.4.11 (Focus Not Obscured) is handled by the root `scroll-padding` in `globals.css` — the site has sticky top chrome (mobile header, desktop compact bar, hub topbar) and a fixed phone tab bar, so any new sticky/fixed chrome must stay within that padding budget (~4.5rem top). The other new 2.2 criteria (2.5.7 Dragging — the directory map has zoom buttons + a full List alternative; 3.2.6 Consistent Help; 3.3.7 Redundant Entry; 3.3.8 Accessible Auth — the login field allows paste + `autocomplete="current-password"`) are structural and pass; keep them that way.
- **Motion is opt-in and reduced-motion-safe.** The motion toolkit lives in `globals.css`: the `data-reveal` scroll system (variants `up`/`fade`/`left`/`right`/`scale`/`blur`, stagger via `--reveal-delay`) plus reusable classes `wcp-lift`, `wcp-pop` (icon pop on `.group` hover), `wcp-nudge`, `wcp-sheen` (CTA sheen), `wcp-underline`, `wcp-float`. Everything that MOVES is gated behind `@media (prefers-reduced-motion: no-preference)`, so reduced-motion users get a still page — keep it that way, and never put motion on the LCP hero heading (it would delay first paint). Hover lifts on interactive Tailwind must always pair with `motion-reduce:hover:translate-y-0`.
- **Each class owns a brand color — use the helper, don't hardcode.** Twos = amber, Threes = green, Pre-K AM = orange, Pre-K PM = sky (matches the Sanity `class.color` field). [`src/lib/class-colors.ts`](src/lib/class-colors.ts) is the single source of truth: `classColor(slug)` gives the color, `classStyles(slug)` gives ready-made AA-safe Tailwind class sets (`badge` = white on a theme-stable dark fill for photo overlays, `chip`/`text`/`iconChip` for labels, `border`/`dot` for accents). The strings are full literals so Tailwind's JIT generates them — never build `bg-${color}`. Applied on the directory class overlay, the hub class pages (`ClassHubBody`), tuition cards, and the hub class nav cards. When you show or mention a specific class, tint it with this helper.
- **The hub's app layer is device-local, never account-based.** The my-classes picker (`wcp-my-classes`, a JSON array — MULTI-select, families span classes), "new since last visit" (`wcp-updates-seen`), the remembered family name for the co-op-hours lookup (`wcp-family-name`), theme, rail collapse, and note-modal dismissals all live in localStorage — progressive enhancement over a fully working no-JS page. The canvas texture (`.wcp-hub-canvas` grain+doodle tile; direct grey Sections go transparent over it), the `wcp-glow-*` washes, the phone tab bar (`HubTabBar`), and the ⌘K palette (`HubSearch` + gated `/family-hub/api/search-index`) are the app chrome — see docs/FAMILY_HUB.md "The app layer".
- **Hub pages are one app surface — reuse the hub primitives.** Every `/family-hub/*` page uses `HubShell` `bare` (no navy band) → `<Section bg="grey">` → **`HubPageHeader`** (owns the page `h1#hub-page-title`) → content in **`HubCard`** (the single card primitive: plain / titled / `as="a"` link / `as="li"`) → `HubProgress` for bars → `HubEmptyState` for empty data → `SectionRenderer` as a top-level sibling for Board-added sections. Data gets expressed through the 2026-07-14 kit: **`HubStat`** (KPI number + label + optional delta), **`HubRing`** (progress ring), **`HubSpark`** (aria-hidden sparkline, honest series only), **`HubPill`** (the ONE status vocabulary — extend it in the component, never improvise a pill), **`HubTable`** (table that stacks to cards below `md` via `data-th`). The chrome is `HubTopBar` (desktop sticky bar: search affordance, what's-new bell, quick actions — native `<details data-hub-menu>` + `hub-menus.ts`/`hub-fresh.ts` behavior) and the shell holds still across hub navigations via `view-transition-name`s in globals.css. Icon-chip convention: neutral `bg-sky/15 text-sky-ink`; class-specific `classStyles(slug).iconChip`; semantic (money→green, health→orange, celebration→amber) only where it carries meaning. Don't hand-roll card classes — route through `HubCard`. The reskinned inner pages are covered by `npm run test:hub` (axe light+dark + 320px, per route).
- **Navigation: native cross-document View Transitions + Speculation Rules (NO ClientRouter).** The 2026-07 performance pass removed Astro's `<ClientRouter />`: every navigation is a real document load, which is what lets Chrome/Edge fully PRERENDER the next public page on hover (the `speculationrules` script in BaseLayout — public pages only; SSR surfaces are excluded so prerenders never burn Worker time or hit gated routes). The cross-fade comes from the `@view-transition` rule in `globals.css` (Chrome+Safari; reduced-motion users get an instant swap). Client scripts still wire the DOM through `onPageLoad(fn)` from [`src/scripts/_page-load.ts`](src/scripts/_page-load.ts) — same API, now "once per document" (DOMContentLoaded or immediate) — and `onBeforeSwap` maps to `pagehide`. Two rules for new scripts: (1) keep using `onPageLoad`, never raw top-level DOM wiring; (2) anything that must wait for a REAL visitor (heavy downloads, autoplay, analytics pings) must check `document.prerendering` and defer to `prerenderingchange` — see [`src/scripts/hero-video.ts`](src/scripts/hero-video.ts), which otherwise would download ~9MB inside hidden prerendered pages. The scroll-reveal ([`src/scripts/reveal.ts`](src/scripts/reveal.ts)) reveals on-screen elements via a geometry check so first paint never waits on IntersectionObserver.
- **Match the surrounding code.** Components are heavily commented with the _why_; keep that density. Tailwind v4 (CSS-first config in `src/styles/globals.css`), no `tailwind.config.js`.
- **Secrets never get committed.** `SANITY_TOKEN` lives in `.env` (build reads) and `.dev.vars` (Worker runtime) — both gitignored. `FAMILY_HUB_PASSWORD` is a Cloudflare secret. See [docs/SANITY.md](docs/SANITY.md).
- **Share-by-link Google URLs never get committed either.** This repo is public. The class photo albums, helper-schedule Sheets, the budget Sheet, the calendar feed, and the Drive/Canva documents are all "anyone with the link" resources — the URL _is_ the access control. They are Board-editable in Sanity and must live only there; the code fallbacks (`src/data/hub/live-links.ts`, `documents.ts`) ship with empty values on purpose. Never paste a share link back into a tracked file. If one is exposed, rotate it in Google (new link / restrict access), not just remove it from source.

## Gotchas (these have each cost real time)

- **SSR pages cannot resize images — never use `astro:assets <Image>` for chrome on `prerender=false` routes.** The Cloudflare adapter's image optimization is compile-time only; on SSR pages `/_image` passes the ORIGINAL file through, which served the 9000x6000 (4.1MB) logo into a 38px hub-topbar slot (Lighthouse, 2026-07-14). SSR surfaces use committed pre-sized assets (`src/assets/brand/*-sm.webp`, generated with sharp) and a plain `<img>` with width/height. Related: a font used only inside a lazy UI (the note modals' Great Vibes signature) must load via the **FontFace API** at open time (`note-modal.ts`) — both static and dynamic CSS imports get hoisted into render-blocking page stylesheets by Vite.
- **`wrangler deploy` alone 404s every sub-route.** This is a hybrid static+SSR build; deploy with the adapter-generated config: `wrangler deploy -c dist/server/wrangler.json` (baked into `npm run deploy` and the Deploy workflow).
- **CI/Lighthouse builds need `SANITY_TOKEN`.** Since pages are CMS-driven, `getStaticPaths()` reads them from Sanity at build time — a tokenless build emits an empty site. All three workflows pass `secrets.SANITY_TOKEN`.
- **`/studio` is blank under `npm run dev`.** The project folder path contains spaces (`West Chester Preschool Website`), which breaks Vite's dev-time Studio module loading. **Dev-only** — the deployed `/studio` is fine. To edit locally, use the deployed `/studio` or `npx sanity dev`. There is intentionally **one** Studio — the embedded `/studio` (always current because it rebuilds on every deploy); we do **not** run a separate hosted `*.sanity.studio`, which drifts out of date. Don't `npx sanity deploy`. See [docs/SANITY.md](docs/SANITY.md).
- **Slug is a string + regex, not Sanity's `slug` type.** Sanity's slugify strips the slashes that `classes/twos` needs.
- **Never compare a stega-encoded string in logic.** In the `/preview` path, stega encodes ~1KB of invisible marker characters into every string so click-to-edit works, so `tone === 'navy'` is `false` on an encoded value and the component picks the wrong branch (this once rendered the navy CTA as cream in preview only). Dropdown/enum fields that drive rendering are excluded from stega via the `filter` in [`src/lib/cms-preview.ts`](src/lib/cms-preview.ts) — **add any new logic-driving enum field to that `NON_STEGA_FIELDS` list.** Display strings stay encoded (that is the point).
- **Custom Studio document-view panes must NOT call `useFormValue` — read the `document.displayed` prop instead.** `useFormValue` needs a `FormValueProvider` that is present in the Structure editor but NOT when a view (`S.view.component`) is mounted inside the **Presentation** tool, so it throws `useFormValue must be used within a FormValueProvider`; the thrown error trips the panel's error boundary, which freezes the Presentation panel AND kills the comlink that refreshes the preview iframe (looks like "editing broke the preview / it won't update until I reload"). Every `UserViewComponent` receives `{ document: { displayed, draft, published, historical }, documentId, schemaType }` — `document.displayed` is the live draft-merged doc and updates as you type (see `SeoPreviewPane.tsx`, which this bit 2026-07-13). Input components (rendered inside the form) may use `useFormValue`; standalone panes/tools/actions may not.
- **Trailing slash:** static `output` + directory format means `/about` → 307 → `/about/` → 200. Expected, not a bug.
- **Hero videos are gitignored** (`public/hero/*.mp4|webm`, belong in R2/Sanity), so they 404 on a clean build and the site degrades to the poster image. The link-check and tests skip them.
- **Windows-only:** local `lhci autorun` can exit 1 on an `EPERM` temp-cleanup crash even when the audit passed. Linux CI is the real Lighthouse gate.
- **Site search and share cards need a build.** The `postbuild` npm hook runs Pagefind over `dist/client` (so `/search` returns nothing under `astro dev`) and then `scripts/generate-og.mjs`, which renders the `/og/*.jpg` share cards — a real classroom photo (deterministic pick from the public A Day gallery, cropped by the Sanity CDN) under a satori/resvg overlay (scrim + logo + title), composited to JPEG by sharp — for every page/post that references one. OG generation is a postbuild **script** on purpose: resvg's native `.node` binary can't go through the Cloudflare adapter's bundler (an in-app endpoint fails the build), and deriving the card list from the built HTML means `check:links` proves none are missing. **Anything that deploys must run `npm run build` (which fires `postbuild`), never bare `astro build`** — the deploy script once used `astro build` directly and shipped a dist with no search index and no share cards (found live 2026-07-13; both `npm run deploy` and CI now go through `npm run build`).
- **The static a11y/reflow/smoke suites can't reach the gated hub** — they serve the static `dist/client`, and `/family-hub/*` is SSR-only (excluded on purpose, see `tests/routes.ts`). Hub shell coverage lives in `npm run test:hub` (`playwright.hub.config.ts`), a separate config. It boots with `npm run build && npm run preview` (wrangler), **not** `astro dev`: on this Astro 7 + Cloudflare stack, `astro dev` always daemonizes to a detached background process and the launching command exits immediately, which Playwright's `webServer` reads as a startup failure even though the server is actually up.
- **Client scripts loaded once for both hub chrome pieces.** The hub drawer (`src/scripts/hub-drawer.ts`) and theme toggle (`src/scripts/theme.ts`) are imported once from `BaseLayout`'s hub branch, not per-component — `HubRail` is rendered twice (desktop rail + the drawer's contents), and `theme.ts` already re-queries all `[data-theme-toggle]` instances on click, so this stays in sync without extra wiring. Both use `onPageLoad`/`onBeforeSwap`.
- **Server islands render hub content — the middleware gates `/_server-islands/*` too.** The hub home's Google-backed widgets are `server:defer` islands (instant shell, skeleton → streamed widget). Their endpoints live OUTSIDE `/family-hub`, so `src/middleware.ts` applies the same auth check to `/_server-islands/*` (401, not a login redirect). If a PUBLIC page ever gains a server island, that check must learn to tell them apart. No-JS visitors keep the skeleton fallbacks for those three widgets — an accepted trade. **Island content streams in AFTER the per-document scripts have scanned the DOM.** `data-reveal` is safe (reveal.ts has a MutationObserver for late insertions — added after the 2026-07 live regression where the three widgets sat at opacity 0), but every OTHER script hook (`data-countdown`, `data-countup`, forms, embeds, ...) is a one-shot scan and would never wire up inside an island. Don't put scripted content in a server island without giving its script the same MutationObserver treatment — and remember Playwright's `toBeVisible()` counts `opacity:0` as visible, so test the computed style like hub-home.spec.ts's regression test does.
- **`--color-*-ink` tokens are for text on a dark PAGE, not for a fill inside a fixed-chrome island.** In dark mode `globals.css` redefines `--color-orange-ink` (and the other ink tokens) to alias the bright tier, because bright colors read fine as text on a dark page. The hub rail's navy chrome doesn't change with the site theme, so its active-link fill hardcodes the ink hex (`#a85300`) instead of the token — using the var there would silently break contrast in dark mode. See the comment in `HubRail.astro`.
- **Colored `-ink` text on a soft color tint fails AA in DARK mode — the #1 trap when building hub cards.** `text-sky-ink` on `bg-sky/15`, `text-orange-ink` on `bg-amber/25`, etc.: in dark mode the `-ink` token flips bright AND the tint darkens over the dark surface, so contrast drops to ~4:1 or worse (a text pill that's fine in light mode). Rules: (1) soft-tint backgrounds are safe **only** behind an `aria-hidden` icon; the **label text stays neutral** (`text-heading`/`text-ink`/`text-ink-muted`). (2) Keep tinted chips inside white `HubCard`s, never directly on the `bg-grey` canvas (tint-over-grey is darker still). (3) `classStyles(slug).text` (an `-ink` color as text on a WHITE card, e.g. a price) is fine — that's verified AA in both themes; the failure mode is specifically colored-text-on-colored-tint. All hub inner pages are axe-checked in light AND dark by `npm run test:hub`, which catches these.
- **Greeting/date logic on the hub home must use Eastern wall-clock time, never raw `Date` methods.** The Cloudflare Workers runtime's `Date` is UTC with no local timezone data, so `getHours()`/`getDate()` produce the wrong "Good morning/afternoon/evening" (or the wrong day) for a chunk of the day. Always go through `toLocaleString(..., { timeZone: 'America/New_York' })` instead — see the working pattern in `HubGreeting.astro`. The pure date math (greeting hour, days-until, school-year percent, short-date formatting) lives in `src/lib/hub-dashboard-dates.ts` with Vitest coverage for the NaN/divide-by-zero/UTC-boundary edge cases — extend that module and its tests rather than inlining new date math back into the `.astro` components.
- **Date-only event strings ("YYYY-MM-DD") must be anchored to NOON UTC before timezone-formatting.** `new Date('2026-07-20')` is UTC midnight, which formats as July 19 in Eastern time — all-day events would show a day early. `src/lib/hub-calendar.ts`'s `eventDate()` does `new Date(iso + 'T12:00:00Z')` for date-only strings; use it, don't parse event dates by hand.
- **The Google Sheets gviz endpoint returns JSONP-ish text, not JSON.** `.../gviz/tq?tqx=out:json` wraps the payload in `google.visualization.Query.setResponse(...)`; there is no plain-JSON mode. `src/lib/gsheets.ts` cuts the JSON out from between the outer parens — go through it (`getBudgetSnapshot`/`getFundraisers`/`getAvailability`), don't fetch sheets by hand. All live-data fetches carry an 8s `AbortSignal.timeout` and degrade to a designed empty state on any failure (hub widgets show their empty card; the public availability badges just stay hidden — they hydrate from `/api/availability`, a 5-min-cached SSR route, so a sheet edit never waits for a rebuild).
- **Hub SSR speed contract: external fetches must go through `src/lib/hub-cache.ts`.** The Apps Script calendar feed (1.5-3s/hit) and gviz sheets (0.5-1.5s) once ran on EVERY hub navigation — pages took 2-4s server-side. They're now `cached()` in TWO tiers (an in-isolate Map plus the **CACHE KV namespace**; the binding is optional and everything degrades to Map-only without it) with **stale-while-revalidate**: the calendar is 15 min fresh + 24h serve-stale-and-refresh-in-background (it changes ~daily at most), sheets 5 min + 1h. Within the swr window a visitor is NEVER blocked on Google — the refresh rides `waitUntil` behind the response. The same SWR path serves Sanity SINGLETON lookups (`sanityFetch(..., { cache: BOARD_CONTENT_CACHE })`: hubPage docs, Site Settings, feeSchedule, the family count — 60s fresh + 10min swr). The rule: **singletons cached, collections live** (updates/documents/roles/campaigns stay on the CDN so lists always feel fresh), **PII never cached** (directory entries, health details — the cache writes through to KV, and family data doesn't belong in a second store), **read-after-write stays `fresh: true`** (sign-ups). The hub Sanity client uses the **authenticated CDN** (`useCdn: true` — still token-gated, ~60s staleness). Never add a new per-request external fetch to a hub page without wrapping it; and read-after-write surfaces (the sign-ups page) must pass `{ fresh: true }` to `sanityFetch` or a family's just-submitted response looks lost. Mutation clients (contact/signup APIs) keep `useCdn: false`.

## Deploy & CI

- **Repo:** `NateJ45/wcp-website` (private). **Live:** `wcp-website.nathanjnixon86.workers.dev`.
- **Workflows** (`.github/workflows/`): `ci.yml` (types, lint, format, build, links, Playwright), `lighthouse.yml` (a11y gate 100), `deploy.yml`.
- **Deploy triggers:** push to `main`, **or** a Sanity `repository_dispatch` webhook fired on publish (so CMS edits go live without a code push). Setup in [docs/SANITY.md](docs/SANITY.md).

## Deeper docs

- [docs/PAGE_BUILDER.md](docs/PAGE_BUILDER.md) — page-builder architecture (page doc, section palette, renderer, routing, migration).
- [docs/SANITY.md](docs/SANITY.md) — Sanity project, the Studio, secrets, the auto-deploy webhook.
- [docs/FAMILY_HUB.md](docs/FAMILY_HUB.md) — the gated family area and its password gate.
- [docs/ROLES.md](docs/ROLES.md) — Sanity roles/access (owner-only admin task); what the tiers allow.
- [docs/FORMS.md](docs/FORMS.md) — forms: variants, how submissions fan out (Sanity → Google Apps Script inbox → optional Resend), and the one-time Google setup.
- [docs/REDIRECTS.md](docs/REDIRECTS.md) — mapping old Squarespace URLs → new at domain cutover.
