# Family Hub → Dashboard Redesign — Design Spec

**Date:** 2026-07-12
**Status:** Approved design, pending spec review → implementation plan
**Owner:** Nathan Nixon

## Goal

Turn the Family Hub from a set of page-to-page *website* pages into a persistent-shell
*web-app dashboard*: a left navigation rail that never reloads, an at-a-glance Home, and
app-like polish across every section. The whole hub, every page.

This is a presentation/shell change. It does **not** change the gate model, the SSR data
path, or the volunteer editing surface, and it must hold every quality gate this site
already meets.

## Non-goals & hard constraints

- **Keep the single shared-password gate.** There is no per-family login or identity, so the
  Home is **school-wide**, never personalized ("your child's class"). See
  [FAMILY_HUB.md](../../FAMILY_HUB.md).
- **Keep SSR.** Every `/family-hub/*` route stays `prerender = false` and reads Sanity at
  request time behind the gate via `src/lib/sanity.ts`. No new read path.
- **Brand-lock holds.** This adds no design knobs for volunteers. Content stays Board-editable
  through the existing `hubPage` docs and typed data; the shell/styling live in code.
- **Accessibility is a hard gate.** 320px reflow with no horizontal scroll, WCAG AA contrast,
  Lighthouse a11y **100**, reduced-motion safe. (This is why the active nav is navy-on-orange,
  not the white-on-orange the old hub used, which fails AA.)
- **No emoji in the UI.** Dedicated inline SVG icons only.
- **Performance-first.** Minimal client JS (only the mobile drawer toggle). No SPA framework
  for the shell; it is server-rendered markup plus the View Transitions already in the project.

## What the user sees (approved via mockups)

- **Shell** — persistent left rail: logo (sun + cloud emblem) at top, sections grouped
  (*News & Events / Resources / Money / Community*), an SVG icon per item, active item in
  navy-on-orange, and a **"Sign out"** link pinned to the bottom (ends the session).
- **Home** —
  - Greeting (time-of-day) + a warm tagline.
  - **Community chips:** days-'til-first-day countdown, families count, today's date.
  - A slim **school-year progress bar**.
  - **Class helper-schedule row:** Twos (blocks), Threes (crayon), Pre-K AM (sun),
    Pre-K PM (moon), each in its class color, linking to that class's helper schedule.
  - **Widgets** carried over from the current hub: Upcoming Events, Announcements, Class
    Photos, Meeting Minutes, Budget Snapshot, Fundraising.
- **Mobile** — the rail collapses to a top bar with a menu button; tapping it slides the nav
  in from the left over a dimmed backdrop. Content stacks to a single column.

Reference mockups (session scratchpad, not committed): `hub-home-v3.html` (desktop),
`hub-mobile.html` (phone).

## Architecture

- **`HubShell.astro`** (evolve the existing layout) becomes the app shell that wraps **every**
  `/family-hub/*` page: left rail on desktop, top bar + drawer on mobile, and a `<slot />` for
  the page body. Props: current section key (for active state) and page title.
- **SSR is unchanged.** The middleware gate and per-request Sanity reads work exactly as today.
  The shell is server-rendered markup. The "no full reload" feel comes from the **View
  Transitions** (`<ClientRouter />`) already shipped in `BaseLayout` — the shell persists and
  cross-fades between hub routes. This stays an MPA; we are not adding client routing.
- **One nav config is the source of truth.** `src/lib/hub-nav.ts` exports the ordered, grouped
  sections: `{ key, label, href, icon, group }`. The desktop rail, the mobile drawer, and
  active-state detection all read from it, so adding/removing/reordering a section is one edit.

## Components (each a small, single-purpose unit)

- `HubShell.astro` — rail + top bar + drawer + `<slot />`. Owns the responsive layout.
- `HubNav.astro` — the grouped section list with icons and active state; consumes `hub-nav.ts`.
  Rendered once; shared by rail and drawer.
- `HubTopBar.astro` — mobile top bar: emblem, page title, menu button.
- `hub-drawer.ts` — the only new client script: open/close, focus trap, Esc-to-close,
  backdrop click, `aria-expanded`, body scroll-lock. Initialised on `astro:page-load`
  (per the project's View Transitions rule). Reduced-motion aware.
- `HubIcon.astro` (or a small icon registry) — inline SVGs defined once, `aria-hidden` when
  decorative, so there are no emoji and icon-only controls still get accessible names.
- **Home** (`/family-hub/index.astro` body), composed of:
  - `HubGreeting.astro` — greeting + tagline + community chips + school-year bar.
  - `ClassHelperRow.astro` — the four class cards (class color + playful SVG icon), using the
    existing `class-colors.ts` helper.
  - Widget components, each self-contained and each rendering a designed empty-state when its
    source is empty (the existing hub pattern): `UpcomingEventsWidget`, `AnnouncementsWidget`,
    `ClassPhotosWidget`, `MeetingMinutesWidget`, `BudgetSnapshotWidget`, `FundraisingWidget`.

Each widget answers: *what does it show, where does its data come from, what's its empty state.*
None reaches into another's internals.

## Data flow

- Widgets read from Sanity at request time behind the gate (`src/lib/sanity.ts`), exactly as
  the current section pages do. Nothing new here; the widgets are compact versions of content
  the hub already renders (Updates → Announcements, calendar → Upcoming, `hubDocument` meeting
  minutes, `campaign` → Fundraising, etc.).
- **New, additive data for the Home chips** (small `siteSettings` additions, no PII):
  - **School-year dates** — `yearStart`, `yearEnd`, `firstDay` on `siteSettings`. Drive the
    progress bar (`clamp((today - yearStart) / (yearEnd - yearStart), 0, 1)`) and the
    days-'til-first-day countdown. Before `firstDay` → "summer break / N days 'til school";
    after `yearEnd` → a gentle end-of-year state.
  - **Families count** — derived from the count of `directoryEntry` docs, with an optional
    `siteSettings.familyCount` override for when the directory is not fully loaded.
  - **Today's date** — server render time. Fine because the hub is SSR (a static page could not
    do this; the hub can).
- The class helper-schedule row links to the existing class hub pages / helper schedules.
- No new Sanity **write** paths.

## Responsive / mobile

- **Desktop (≥ `lg`):** rail pinned left (~196px), content fills the rest.
- **Mobile (< `lg`, down to 320px):** rail hidden; top bar with menu button; drawer slides in
  via `transform` over a backdrop scrim; focus trapped; Esc and backdrop-tap close it; body
  scroll locked while open. Content is a single column; class row is 2-up; widgets stack.
- **Reduced motion:** the drawer appears/disappears without the slide animation; no widget
  motion. Nothing moves for `prefers-reduced-motion: reduce`.

## Accessibility & performance

- Semantic `<nav aria-label="Family Hub">` and `<main>`; active item carries
  `aria-current="page"`.
- All text and UI meets WCAG AA. Reuse the measured AA-safe brand "ink" shades; the active nav
  is navy-on-orange (passes), never white-on-orange (fails).
- Icon-only controls (menu, close) have accessible names; decorative SVGs are
  `aria-hidden`.
- 320px reflow: no horizontal scroll anywhere in the shell, Home, or drawer.
- Lighthouse a11y stays 100 (CI gate). Motion is opt-in and reduced-motion-safe.
- The shell adds one small client script (the drawer). Everything else is static SSR markup.

## Scope & sequencing

The design covers the **whole hub**, but implementation ships in two low-risk phases:

- **Phase 1 — Shell + Home.** Build `HubShell`, `HubNav`, the mobile drawer, and the nav
  config; rebuild the Home page as the dashboard (greeting, chips, class row, widgets); add the
  `siteSettings` school-year/family fields. Every *other* hub page immediately starts rendering
  **inside the new shell** while keeping its current body. This delivers the web-app feel right
  away.
- **Phase 2 — Reskin inner sections.** Bring each section's body up to the app styling (cards,
  spacing, SVG icons, restrained titles) inside the shell, one section at a time (Updates,
  Calendar, Documents, Directory, Health, Tuition, Fundraising, Co-op Jobs, the four class
  pages). Each section is independently shippable and testable.

## Testing

- Extend the existing Playwright suite (smoke + axe default ruleset + 320px reflow sweep) to
  cover the new shell, the Home, and the drawer (open/close, focus trap, Esc, active state).
- Lighthouse a11y 100 gate must stay green.
- Manual: full keyboard pass through rail and drawer; reduced-motion pass; confirm each
  widget's empty-state renders when its Sanity source is empty.

## Implementation notes (from reading the current code, 2026-07-12)

Reading the live hub surfaced realities the mockups did not show. They do not change the
approved design, but the plan and the implementer must honor them:

- **The hub is already a top-bar nav, not loose pages.** Today `HubShell.astro` wraps
  `BaseLayout chrome="hub"`, and that chrome is `HubHeader.astro`: a sticky navy top bar with
  the section nav as dropdown groups plus a mobile hamburger panel. The redesign **converts
  this top-bar chrome into the left rail** (and the mobile drawer); `HubShell` owns the
  rail + content layout.
- **The hub supports light AND dark mode** (a `ThemeToggle` is in the header). The dashboard
  must be **theme-aware in both** — the mockups were light-only. Use the existing Tailwind v4
  brand tokens (`bg-navy`, `text-heading`, `text-orange-ink`, `text-sky-ink`, `border-border`,
  …) from `globals.css`; **no hardcoded hex**. Contrast passes AA in both themes.
- **Reuse existing systems, do not reinvent:**
  - **Icons** — the `@/components/Icon.astro` named-SVG registry (already no emoji). New glyphs
    (toy blocks, crayon, sun, moon, section icons) get added there.
  - **Nav data** — `@/data/hub-nav.ts` already exists (`hubNav[0]` = Home, the rest are groups
    of `.links` `{ href, label, icon, external? }`). Restructure it into the rail's grouped
    list; keep it the single source of truth.
  - **Client behavior** — the drawer script uses the `onPageLoad`/`onBeforeSwap` helpers in
    `@/scripts/_page-load.ts` (View-Transitions safe) and the interaction conventions in
    `@/scripts/nav.ts`.
- **Sign out already exists** as decided: `HubHeader` posts to `/api/hub-logout`; the rail
  reuses that form.

## Decisions (resolved 2026-07-12)

1. **Sign out, not "Back to Main Site."** The rail's bottom link is a real **Sign out** that
   ends the session (POSTs to `/api/hub-logout`, which already exists). The "Back to Main Site"
   link is dropped.
2. **Families count is derived** from the count of `directoryEntry` docs, with an optional
   `siteSettings.familyCount` override for when the directory is not fully loaded.
3. **School-year dates** (`yearStart`, `yearEnd`, `firstDay`) live on **`siteSettings`** — one
   place, no separate doc.
4. **The Home replaces the old landing quick-link grid** entirely; the rail plus widgets
   supersede it.

## Docs to update when this ships (per the repo's keep-docs-in-sync rule)

- [FAMILY_HUB.md](../../FAMILY_HUB.md) — the new shell, the Home dashboard, the nav config, the
  `siteSettings` school-year/family fields.
- [CLAUDE.md](../../../CLAUDE.md) — the `HubShell` mental model and the drawer client-script rule.
- `src/sanity/guides/content.ts` — only if the volunteer-facing editing steps change (the new
  `siteSettings` fields do, so the Studio guide gets a short note).
