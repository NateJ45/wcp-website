# Family Hub Phase 2 — Section Reskins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax. **Design tasks are browser-verified, not just type-checked** — a task isn't done until it's been driven in the Browser pane (screenshot + a11y) at desktop AND 320px, light AND dark.

**Goal:** Bring every Family Hub inner section page up to the polished app-dashboard aesthetic the Home page already has, so the whole hub reads as **one app surface**, not a dashboard home followed by marketing pages stacked in a shell.

**Architecture:** A shared foundation of three new components (`HubPageHeader`, `HubCard`, `HubProgress`) plus a `bare` mode on `HubShell` (suppress the tall navy title band). Every inner page is rebuilt to: open on the grey app canvas with a compact left-aligned `HubPageHeader`, lay content out in the single unified card vocabulary, and use the standard empty-state + icon-chip + progress conventions. No data path, gate, or page-builder editing surface changes — this is presentation only.

**Tech Stack:** Astro 7 (SSR, `prerender = false`), Tailwind v4 (CSS-first tokens in `globals.css`), TypeScript, Playwright + axe-core. Icons via `Icon.astro`/`lucide-icons.ts`. Class colors via `class-colors.ts`.

**Scope:** Phase 2 of the spec ([2026-07-12-family-hub-dashboard-design.md](../specs/2026-07-12-family-hub-dashboard-design.md)). Reskins the nine inner surfaces: Updates (+ detail), Calendar, Documents, Directory, Health, Tuition, Fundraising, Co-op Jobs, and the four class pages (one shared `ClassHubBody`). Home (`index.astro`) also drops its now-redundant navy band as part of the foundation, so the whole hub shares one header system. **Content and data are unchanged** — everything is already migrated to Sanity; this is a visual/layout reskin.

---

## Design direction (the committed choices)

Read this before any task. These are non-negotiable so all nine pages cohere.

### 1. One app surface — kill the navy hero band on inner pages

The tall centered navy title band (`HubShell`'s `<section class="bg-navy ... py-12 lg:py-16 text-center>`) is the single biggest "marketing page in a shell" tell — it is centered, tall, and repeats an uppercase "FAMILY HUB" eyebrow on every page (an impeccable absolute-ban: eyebrow-on-every-section). **Replace it** with a compact, left-aligned `HubPageHeader` rendered on the app's grey canvas (`bg-grey`, the same surface Home uses). `HubShell` keeps rendering `title` into the mobile topbar + browser tab, but a new `bare` prop suppresses the navy band so the page owns its header.

### 2. Compact app page header (`HubPageHeader`)

Left-aligned. Structure: optional icon chip → title (fixed rem size `text-2xl sm:text-3xl`, `font-display`, `text-heading`, `text-balance`) → one-line muted subtitle (`text-ink-muted`, ≤75ch) → optional right-aligned primary action (a `Button`) and/or a back link above the title (for the update detail page). No uppercase eyebrow. This is the Linear/Notion/Stripe page-title pattern, warmed with the brand display font and an optional accent icon chip.

### 3. One card vocabulary (`HubCard`)

Every content panel is a `HubCard` (generalized from `HomeWidgetCard`). Base: `rounded-[var(--radius)] border border-border bg-white p-6 shadow-sm dark:bg-surface`. Interactive cards (links) add exactly one hover treatment: `transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0`. **Delete every page's hand-rolled card class string** and route through `HubCard` (or its `as="a"`/`as="li"` variants). Nested cards are banned (impeccable) — a card never contains another card.

### 4. Icon-chip color convention (committed — put this in a comment in `HubCard`)

- **Neutral / structural** (the default): `bg-sky/15 text-sky-ink`.
- **Class-specific** content: `classStyles(slug).iconChip`.
- **Semantic, only where it carries meaning**: money/positive → `bg-green/15 text-green-ink`; health/caution → `bg-orange/15 text-orange-ink`; celebration/fundraising → `bg-amber/25 text-orange-ink`.
  Stop using solid-navy icon circles for generic content (coop-jobs currently does) — navy circles are reserved for a single page-level emphasis moment, not per-row.

### 5. Content width + grid

App content column: `mx-auto max-w-6xl` for card-grid pages; `mx-auto max-w-prose` (~65ch) for long-form prose (update detail body, policy text). Card grids: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3` (or `xl:grid-cols-3` when cards are wide). No page uses the old `max-w-3xl` centered column anymore.

### 6. Shared progress bar (`HubProgress`)

One component replaces the three duplicated `role="progressbar"` blocks (fundraising page, `FundraisingWidget`, `HubGreeting`). Props drive value/max, an accessible label, fill color, and height. Refactor those three call sites onto it.

### 7. Motion

State-conveying only, 150–250ms, reduced-motion safe. Keep the existing `data-reveal` entrance system (geometry-based, visible-by-default — already correct). No orchestrated page-load sequences (product-register ban). Hover lifts stay `motion-reduce`-guarded.

### 8. Empty states

Every page uses `HubEmptyState` for a genuinely empty data source. Documents and Tuition (which currently always render fallback data) keep their fallbacks but must show `HubEmptyState` if BOTH Sanity and the fallback are empty. Consistent dashed-panel vocabulary everywhere.

### Accessibility (hard gate, unchanged)

WCAG AA contrast in light + dark, Lighthouse a11y 100, no horizontal scroll at 320px, heading order never skips (page `h1` in `HubPageHeader` → section `h2` → card `h3`), reduced-motion safe. Every reskinned page must pass axe (default ruleset) in both themes.

---

## File structure

**Create:**

- `src/components/hub/HubPageHeader.astro` — compact app page header (icon, title, subtitle, action slot, optional back link).
- `src/components/hub/HubCard.astro` — the one content-card primitive (default / `as="a"` / `as="li"`, optional header row with icon + title + action).
- `src/components/hub/HubProgress.astro` — shared accessible progress bar.
- `tests/hub-sections.spec.ts` — SSR Playwright coverage for the reskinned inner pages (a11y + 320px reflow across the set).

**Modify:**

- `src/layouts/HubShell.astro` — add `bare?: boolean` (suppress the navy band; page renders its own header).
- `src/components/hub/HomeWidgetCard.astro` — re-implement as a thin wrapper over `HubCard` (keep its public props so the six widgets + Home are untouched), OR leave as-is and have `HubCard` share its look. (Task 1 decides; prefer wrapping to DRY.)
- `src/pages/family-hub/index.astro` — drop the redundant navy band (`bare`), the greeting card becomes the header.
- `src/pages/family-hub/updates.astro` + `updates/[slug].astro`
- `src/pages/family-hub/calendar.astro`
- `src/pages/family-hub/documents.astro`
- `src/pages/family-hub/directory.astro`
- `src/pages/family-hub/health.astro`
- `src/pages/family-hub/tuition.astro`
- `src/pages/family-hub/fundraising.astro`
- `src/pages/family-hub/coop-jobs.astro`
- `src/components/hub/ClassHubBody.astro` (the four class pages)
- `src/components/hub/FundraisingWidget.astro`, `HubGreeting.astro` — refactor their progress bars onto `HubProgress`.
- `playwright.hub.config.ts` — widen `testMatch` to include `hub-sections.spec.ts`; `playwright.config.ts` — add it to `testIgnore`.
- `docs/FAMILY_HUB.md`, `CLAUDE.md`, `src/sanity/guides/content.ts` — document the reskin + new components.

---

## Task 1: Foundation — `HubShell` bare mode + `HubPageHeader` + `HubCard` + `HubProgress`

**Files:** create the three components; modify `HubShell.astro`; wrap `HomeWidgetCard` over `HubCard`.

This is the linchpin. Build it, then **immediately validate it on the flagship page (Task 2) before any other page** — if the direction needs adjustment, it's cheap here.

- [ ] **Step 1: `HubShell` `bare` prop.** Add `bare?: boolean` to Props (default false). When `bare`, render only `<slot />` (skip the navy `<section>`). Keep `title` feeding `BaseLayout`'s `hubTitle`/`pageTitle` exactly as now. Keep the non-bare path unchanged for backward safety.

- [ ] **Step 2: `HubCard.astro`.** Generalize `HomeWidgetCard`'s shell into the canonical card. Props: `as?: 'div' | 'a' | 'li'` (default `div`), `href?`, `icon?`, `title?`, `action?` (slot for a right-aligned link/button — use a named slot `slot="action"`), `interactive?: boolean` (adds the hover lift; auto-true when `as="a"`/`href`), `empty?`, `emptyText?`, `class?`, default slot for body. Base classes per Design §3; header row (icon chip + `h3` title + action) only rendered when `icon`/`title` given. Include the icon-chip convention as a header comment (Design §4). Reduced-motion-guarded hover.

- [ ] **Step 3: Re-point `HomeWidgetCard` at `HubCard`.** Re-implement `HomeWidgetCard.astro` as a thin pass-through to `HubCard` preserving its exact current props (`icon, title, seeAllHref, seeAllLabel, empty, emptyText, class` + slot) so the six widgets and Home need zero changes and render identically. Verify the Home dashboard still looks pixel-identical afterward (browser).

- [ ] **Step 4: `HubProgress.astro`.** Props: `value: number, max?: number (default 100), label: string, fill?: string (default 'bg-sky-ink'), track?: string (default 'bg-navy/10 dark:bg-white/15'), height?: string (default 'h-2.5'), showPct?: boolean`. Renders the `role="progressbar"` with full aria (`aria-valuenow/min/max`, `aria-label`), clamps 0–100, guards divide-by-zero (value/max where max<=0 → 0). Optional label+pct row above the bar.

- [ ] **Step 5: `HubPageHeader.astro`.** Props: `title: string, subtitle?: string, icon?: string, iconChip?: string (default neutral sky), backHref?, backLabel?`, plus a named `slot="action"` for a primary action. Left-aligned per Design §2. Renders as the first block on the page (the page wraps it + content in `<Section bg="grey">` or a bare grey wrapper). Contains the page `<h1>` (`id` so `Section` can be `aria-labelledby` it). No uppercase eyebrow.

- [ ] **Step 6: Gate.** `cd site && npx astro check && npm run lint`. 0 errors. Commit:

```
git add site/src/layouts/HubShell.astro site/src/components/hub/HubCard.astro site/src/components/hub/HubProgress.astro site/src/components/hub/HubPageHeader.astro site/src/components/hub/HomeWidgetCard.astro
git commit -m "Hub Phase 2: foundation — HubShell bare mode, HubPageHeader, HubCard, HubProgress"
```

- [ ] **Step 7: Browser sanity.** Start the dev server, open `/family-hub`, confirm the Home dashboard is unchanged after the `HomeWidgetCard`→`HubCard` refactor (screenshot; the six widgets + greeting must look identical). This proves the shared card didn't regress the shipped Home.

---

## Task 2: Flagship reskin — Tuition (proves the pattern)

**File:** `src/pages/family-hub/tuition.astro`. Chosen as flagship: content-rich (pay cards, fee cards, FAQ), already uses the class-color system, representative of the card work every other page needs.

**Target view:** `bare` HubShell → `HubPageHeader` (icon `circle-dollar-sign`, title "Tuition & Payments", subtitle one line, action = a "Payment questions?" anchor or none) on grey canvas → content in `max-w-6xl`:

1. **Class pay cards** — a `grid sm:grid-cols-2` of `HubCard`s, each: class-color icon chip + name + a prominent monthly price, a compact facts row (Time / Age / Annual) as a clean `<dl>` (not heavy borders), and a full-width PayPal `Button`. Keep the class-color accent (`classStyles(slug)`).
2. **Fees** — student & enrollment fees as a tighter `HubCard` grid (semantic amber/green chips only where meaningful).
3. **How payments work** — the FAQ as a `HubCard` grid or a clean disclosure list (no navy band; if a dark moment is wanted, ONE `HubCard` with a navy fill is allowed, not a full-bleed band).
4. `SectionRenderer` for Board-added sections stays at the end.

- [ ] **Step 1:** Rebuild the page to the target view using `HubPageHeader` + `HubCard`. Preserve every data fetch, fallback array, `payUrl`, `safeIcon`, and the class-color usage exactly. Empty handling: if no classes at all (shouldn't happen — fallbacks), show `HubEmptyState`.
- [ ] **Step 2:** `cd site && npx astro check && npm run lint && npm run build`. 0 errors.
- [ ] **Step 3: Browser verification (the real proof).** Dev server → `/family-hub/tuition`:
  1. Desktop: pay cards read as an app grid, prices legible, PayPal buttons present, class colors correct. Screenshot.
  2. 320px: no horizontal overflow (`scrollWidth <= clientWidth`); grid stacks to one column. Screenshot.
  3. Dark mode: cards/prices/chips legible and on-brand.
  4. `read_console_messages` clean.
  5. Run axe via the browser tools or note it'll be covered in Task 12; fix any contrast issue found (class-color prices on white must hit AA — use `classStyles().text` which is the AA-safe `-ink` tone, never the bright tier).
- [ ] **Step 4:** Commit `Hub Phase 2: reskin Tuition to the app card layout`.

**After Task 2, STOP and look at the screenshots as a whole** — this is the pattern every remaining page follows. If the app-header + card direction is right, proceed. If not, adjust the foundation before fanning out (cheap now, expensive after nine pages).

---

## Tasks 3–10: Per-page reskins (each follows the proven pattern)

Each task: `bare` HubShell → `HubPageHeader` on grey canvas → content in the unified `HubCard` vocabulary at `max-w-6xl` (or `max-w-prose` for long-form) → keep all data/fallbacks/empty-states → `SectionRenderer` (where the page has it) at the end. Each ends with the same gate (`astro check` + `lint` + `build`) and the same browser verification (desktop + 320px + dark + console-clean, screenshots) and its own commit. **Preserve all behavior; change only presentation.**

- [ ] **Task 3: Documents.** Header (icon `folder-open`, action = "Open Google Drive" when `driveFolderUrl` set). Grouped document list (`required`/`handbook`/`orient`/`minutes`) as sections of `HubCard as="a"` rows (icon chip + title + meta + external-link affordance). Required-forms group gets a subtle emphasis (a leading note `HubCard`, not a side-stripe). Add a real `HubEmptyState` when both Sanity and fallback are empty.
- [ ] **Task 4: Fundraising.** Header (icon `party-popper`). Active campaigns as `HubCard`s each with a `HubProgress` bar (refactor onto the shared component). Keep `HubEmptyState`. Fallback "ways we raise" / "where it goes" become `HubCard` grids (the navy "where it goes" moment may be a single navy-filled `HubCard`, not a band).
- [ ] **Task 5: Co-op Jobs.** Header (icon `heart-handshake`). Assignment panel (`HubEmptyState`, PII). "Run by its families" principles as a `HubCard` grid. Role descriptions grouped by tier — a clean role **board** (`HubCard` grid per tier), neutral-sky icon chips (drop the solid-navy circles), stipend/reportsTo as subtle chips. `OrgChart` stays but sits in a `HubCard`/section. Questions CTA as a single card, not a navy band.
- [ ] **Task 6: Health.** Header (icon `heart-pulse`). Per-child panel (`HubEmptyState`, PII). "When to keep your child home" as a `HubCard` grid (orange semantic chips — health caution is meaningful). Policy/closures as a card with a link to Documents (not a full navy band).
- [ ] **Task 7: Calendar.** Header (icon `calendar-days`, action = none). Keep the privacy-preserving click-to-load Google embed, but wrap it in a `HubCard`. **Add real value:** render the next few `event` docs (via `UPCOMING_EVENTS_QUERY`, already used by the home widget) as a compact `HubCard` list above/beside the embed, so the page isn't just a legend + iframe. Keep the event-type legend as chips and the weather `Callout`. `HubEmptyState` when no calId AND no events.
- [ ] **Task 8: Updates (index).** Header (icon `newspaper`). Announcement feed as `HubCard as="a"` items in a readable single column (`max-w-3xl`→ keep readable, but styled as app cards) or a 2-col grid; pinned pulled to the top with a subtle "Pinned" chip (not emoji 📌 — use the `star`/`pin`… use an icon chip + text, no emoji per brand rule). Keep image support, audience chip, `HubEmptyState`.
- [ ] **Task 9: Updates (detail) — `updates/[slug].astro`.** Header with a back link ("← All updates") via `HubPageHeader` `backHref`. Article body in `max-w-prose` via `Prose`. Date + audience chips under the header. Keep the redirect-on-missing.
- [ ] **Task 10: Class pages (`ClassHubBody`).** Header per class (class-color icon chip + class name + one-line, action = "Pay tuition" + "See the full program"). "At a glance" facts as a clean `HubCard` (or a small stat grid inside one card — not six separate bordered mini-cards). Class notes as `HubCard` items. Keep `classStyles(slug)` threading and `HubEmptyState` for notes. This reskins all four class pages at once (shared body).

---

## Task 11: Directory + Home polish (light touch)

**Files:** `src/pages/family-hub/directory.astro`, `src/pages/family-hub/index.astro`.

Directory is already the most polished inner page — bring it onto the shared header/card system without regressing its portrait cards, tabs, map, or copy toast.

- [ ] **Step 1: Directory.** Replace its navy band with `bare` + `HubPageHeader` (icon `contact`). Keep the List/Map tab toggle, portrait family cards (class-color overlays), map, and copy toast exactly. Route the privacy "points" cards through `HubCard`. Verify the tab toggle + copy toast + map still work in the browser.
- [ ] **Step 2: Home.** Drop the redundant navy band (`bare`) so the greeting card is the top of the page — the greeting IS the header, and a navy "Family Hub" band above "Good afternoon" is redundant. Keep everything else identical. Re-run `npm run test:hub` (the home spec must still pass — greeting text, class row, six widgets, axe both themes).
- [ ] **Step 3:** Gate + browser verify both + commit `Hub Phase 2: bring Directory + Home onto the shared header`.

---

## Task 12: Automated coverage — `tests/hub-sections.spec.ts`

**Files:** create `tests/hub-sections.spec.ts`; widen `playwright.hub.config.ts` `testMatch` and `playwright.config.ts` `testIgnore`.

The inner hub pages currently have **zero** automated a11y/reflow coverage (static suite excludes SSR; hub suite only did shell + home). This task closes that gap for the reskinned set.

- [ ] **Step 1:** Spec that, for each reskinned route (`/family-hub/tuition`, `/documents`, `/fundraising`, `/coop-jobs`, `/health`, `/calendar`, `/updates`, `/twos`, `/directory`): loads it, `settle()`s, asserts the page `h1` (from `HubPageHeader`) is visible, asserts **zero axe violations in light AND dark**, and asserts **no horizontal overflow at 320px**. Parameterize over the route list to keep it DRY. Model structure on `tests/hub-home.spec.ts`.
- [ ] **Step 2:** `testMatch: /hub-(shell|home|sections)\.spec\.ts$/` in `playwright.hub.config.ts`; add `'hub-sections.spec.ts'` to `playwright.config.ts` `testIgnore`.
- [ ] **Step 3:** `cd site && npm run test:hub` — all specs pass. Fix any real contrast/overflow the axe pass surfaces (do NOT weaken assertions — the shell phase caught real bugs this way). Commit.

---

## Task 13: Docs

**Files:** `docs/FAMILY_HUB.md`, `CLAUDE.md`, `src/sanity/guides/content.ts` (only if volunteer-facing behavior changed — it doesn't here, so likely just the two markdown files).

- [ ] **Step 1:** `FAMILY_HUB.md` — extend "The hub shell" section: every hub page now opens with a compact `HubPageHeader` on the grey app canvas (no navy title band), content in the shared `HubCard` vocabulary, progress via `HubProgress`. Note the icon-chip convention.
- [ ] **Step 2:** `CLAUDE.md` — under conventions, add: the hub's shared UI primitives (`HubPageHeader`/`HubCard`/`HubProgress`), the icon-chip convention, and that inner hub pages use `HubShell bare` + own header. Add a gotcha if any surfaced during build.
- [ ] **Step 3:** Prettier check the changed docs, commit.

---

## Self-review

- **Spec coverage:** Phase 2 = "reskin inner sections … cards, spacing, SVG icons, restrained titles … one section at a time." Covered: foundation (Task 1) ✓; all nine surfaces (Tasks 2–11) ✓; app-like card vocabulary replacing stacked marketing bands ✓; SVG icons/no emoji (kills the 📌 pinned emoji) ✓; restrained titles (compact left header, no repeated eyebrow) ✓; a11y/320px/light+dark held via Task 12 ✓; docs (Task 13) ✓.
- **The 9 audited inconsistencies** each map to a fix: hand-rolled cards → `HubCard` (§3); container width → §5; empty states → §8; icon chips → §4; duplicated progress → `HubProgress` (§6); editable-content contract → each page keeps `SectionRenderer` at the end uniformly; header alignment → `HubPageHeader` (§2); navy-band/eyebrow → `bare` mode (§1); dead `current` prop → drop while editing each page.
- **Placeholder scan:** none. Per-page tasks are design briefs (target view + components + data + verification) rather than pre-written JSX, because the craft is browser-iterated — but each names the exact components, data, and checks, and the foundation task has concrete prop specs.
- **Risk control:** Task 1 foundation is proven on Task 2 (flagship) with a hard "stop and look" checkpoint before fanning out; `HomeWidgetCard` is kept API-compatible so the shipped Home + six widgets can't silently regress; every task is independently shippable and browser-verified.

## Execution note

Build order: foundation (T1) → flagship Tuition (T2, checkpoint) → per-page (T3–T11) → tests (T12) → docs (T13). The controller builds/verifies T1–T2 directly (sets the visual bar), then dispatches per-page subagents that follow the proven pattern, each browser-verified. Home changes (T11 step 2) touch already-shipped work — keep them minimal (drop the band only) and re-run `test:hub`.
