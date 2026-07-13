# Family Hub Shell (Left Rail + Drawer) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the Family Hub's top-bar chrome into a persistent left navigation rail (with a mobile hamburger drawer), wrapping every `/family-hub/*` page, without touching page bodies or the data path.

**Architecture:** `BaseLayout`'s `chrome === 'hub'` branch changes from "`HubHeader` on top of `<main>`" to a flex layout: a sticky `HubRail` aside on the left (desktop) and, on phones, a `HubTopBar` with a menu button that opens the same nav as an off-canvas drawer. The rail is server-rendered from the existing `hub-nav.ts` config; the only new client JS is `hub-drawer.ts`, built on the project's `onPageLoad` View-Transitions helper and modeled on the existing `nav.ts` mobile logic. Everything stays SSR, gated, and theme-aware (light + dark) using the existing Tailwind brand tokens.

**Tech Stack:** Astro 7, Tailwind v4 (CSS-first tokens in `globals.css`), TypeScript, Playwright (e2e). Icons via the hand-rolled `Icon.astro` (`src/lib/lucide-icons.ts`). Cloudflare Workers adapter.

**Scope:** This is the SHELL only. It is Phase 1a of the spec ([2026-07-12-family-hub-dashboard-design.md](../specs/2026-07-12-family-hub-dashboard-design.md)). The **Home dashboard** (greeting, community chips, class helper row, widgets) and the **per-section reskins** are separate follow-on plans. After this ships, every hub page renders inside the rail while keeping its current body.

**Reference:** Approved mockups `hub-home-v3.html` (desktop) and `hub-mobile.html` (drawer) from the brainstorm scratchpad. Match their structure; use brand tokens for color, never hardcoded hex.

---

## Testing reality (read before writing any test task)

The existing Playwright a11y/reflow suites (`tests/a11y.spec.ts`, `tests/a11y-dark.spec.ts`, `tests/reflow.spec.ts`) iterate `tests/routes.ts` and serve the **static `dist/client`**. The hub is `prerender = false` (SSR behind the gate) and is **not** in `dist/client`, so those suites cannot exercise it — `routes.ts` documents this exclusion on purpose.

Therefore:

- **Per-task correctness gates** are `npx astro check` (types), `npm run lint` (oxlint), and `npm run build` (must build clean). These are reliable and catch real errors in Astro/TS/Tailwind.
- **Behavioral verification** (rail renders, drawer opens/closes, 320px reflow, light + dark) is done in the **browser preview** against the running dev server. The hub gate is currently OPEN for preview (`src/middleware.ts` has `HUB_OPEN = true` — see [FAMILY_HUB.md](../../FAMILY_HUB.md)), so `/family-hub` is reachable without a password while building.
- **Automated SSR coverage** for the hub is added in **Task 7** as its own Playwright spec with a dev-server `webServer`. It is isolated so that if the SSR web-server wiring proves fiddly on this Astro 7 + Cloudflare stack, the shell can still ship on the build gate + browser verification (matching the codebase's current documented stance in `routes.ts`), and the automated spec lands with the Home content.

Use the `verify` skill / the Browser-pane preview tools for the browser checks in each task.

---

## File structure

**Create:**

- `src/components/hub/HubRail.astro` — the desktop left rail: logo, grouped nav (from `hub-nav.ts`), active state, Sign out. Also rendered as the mobile drawer's contents.
- `src/components/hub/HubTopBar.astro` — mobile-only top bar: logo, current page title, menu button.
- `src/scripts/hub-drawer.ts` — off-canvas drawer behavior (open/close, focus trap, Esc, backdrop, scroll-lock), View-Transitions safe.
- `tests/hub-shell.spec.ts` — Task 7 SSR Playwright spec.
- `playwright.hub.config.ts` — Task 7 Playwright config that boots the SSR dev server.

**Modify:**

- `src/data/hub-nav.ts` — regroup into the rail's ordered groups; update class icons.
- `src/lib/lucide-icons.ts` — add `blocks` and `crayon` glyphs.
- `src/layouts/BaseLayout.astro:163-172` — the `chrome === 'hub'` branch becomes the rail + content flex layout.
- `src/layouts/HubShell.astro` — pass the page title to `HubTopBar`; keep the navy title band as the page header inside `<main>`.
- `docs/FAMILY_HUB.md`, `CLAUDE.md` — document the new shell.

**Retire (after Task 6):**

- `src/components/hub/HubHeader.astro` — replaced by `HubRail` + `HubTopBar`. Leave the file until Task 6 flips `BaseLayout`, then delete it in Task 6's commit.

---

## Task 1: Regroup the nav config for the rail

**Files:**

- Modify: `src/data/hub-nav.ts`

The rail shows one flat, grouped list (no dropdowns). Reorder into the spec's groups and update the class icons (Twos → `blocks`, Threes → `crayon`; keep `sun`/`moon`). Keep the `Store` external link. Keep the `HubLink`/`HubGroup` interfaces so `HubHeader` still compiles until it is retired in Task 6.

- [ ] **Step 1: Replace the `hubNav` array** in `src/data/hub-nav.ts` (keep the interfaces above it unchanged):

```ts
export const hubNav: HubGroup[] = [
  {
    label: 'Hub',
    links: [{ label: 'Home', href: '/family-hub', icon: 'house' }],
  },
  {
    label: 'News & Events',
    links: [
      { label: 'Updates', href: '/family-hub/updates', icon: 'newspaper' },
      { label: 'Calendar', href: '/family-hub/calendar', icon: 'calendar-days' },
    ],
  },
  {
    label: 'Resources',
    links: [
      { label: 'Documents', href: '/family-hub/documents', icon: 'folder-open' },
      { label: 'Directory', href: '/family-hub/directory', icon: 'contact' },
      { label: 'Health', href: '/family-hub/health', icon: 'heart-pulse' },
    ],
  },
  {
    label: 'Money',
    links: [
      { label: 'Tuition', href: '/family-hub/tuition', icon: 'circle-dollar-sign' },
      { label: 'Fundraising', href: '/family-hub/fundraising', icon: 'party-popper' },
      {
        label: 'Store',
        href: 'https://store.westchesterpreschool.org/',
        icon: 'shopping-bag',
        external: true,
      },
    ],
  },
  {
    label: 'Community',
    links: [{ label: 'Co-op Jobs', href: '/family-hub/coop-jobs', icon: 'heart-handshake' }],
  },
  {
    label: 'Classes',
    links: [
      { label: 'Twos', href: '/family-hub/twos', icon: 'blocks' },
      { label: 'Threes', href: '/family-hub/threes', icon: 'crayon' },
      { label: 'Pre-K AM', href: '/family-hub/pre-k-am', icon: 'sun' },
      { label: 'Pre-K PM', href: '/family-hub/pre-k-pm', icon: 'moon' },
    ],
  },
];
```

- [ ] **Step 2: Verify types + build**

Run: `cd site && npx astro check`
Expected: 0 errors. (`HubHeader` still consumes `hubNav[0]` + `.slice(1)`; both still valid.)

- [ ] **Step 3: Commit**

```bash
git add site/src/data/hub-nav.ts
git commit -m "Hub nav: regroup sections for the rail (News & Events / Resources / Money / Community / Classes)"
```

---

## Task 2: Add the `blocks` and `crayon` icons

**Files:**

- Modify: `src/lib/lucide-icons.ts`

`hub-nav.ts` now references `blocks` and `crayon`. `Icon.astro` throws at render if a name is missing, so add them before anything renders the rail. Bodies are `viewBox="0 0 24 24"`, and the icon set is stroke-based (they inherit color from a `text-*` class). `crayon` is not a Lucide icon, so use a simple custom glyph consistent with the set.

- [ ] **Step 1: Add two entries** to the `lucideIcons` map in `src/lib/lucide-icons.ts` (match the file's existing formatting; keys are kebab-case string → SVG body string):

```ts
  // Toy blocks (Twos) — three stacked rounded squares.
  blocks:
    '<rect x="3" y="13" width="8" height="8" rx="1.6" fill="currentColor"/><rect x="13" y="13" width="8" height="8" rx="1.6" fill="currentColor"/><rect x="8" y="3.5" width="8" height="8" rx="1.6" fill="currentColor"/>',
  // Crayon (Threes) — triangular tip + rounded body.
  crayon:
    '<path d="M12 2.5 15.2 8H8.8L12 2.5Z" fill="currentColor"/><rect x="8.8" y="8.5" width="6.4" height="12" rx="1.4" fill="currentColor"/>',
```

Note: these two use `fill="currentColor"` (they are solid glyphs). That is fine — `Icon.astro` sizes with the `class` and colors via `currentColor`, and other brand icons are fill-based too.

- [ ] **Step 2: Prove the icons resolve** by type-checking and building (a missing/typo'd icon only throws at render, so also confirm via a throwaway render in Step 3's browser check later; for now the build must pass):

Run: `cd site && npx astro check && npm run build`
Expected: build succeeds, `dist/` produced.

- [ ] **Step 3: Commit**

```bash
git add site/src/lib/lucide-icons.ts
git commit -m "Icons: add blocks (Twos) and crayon (Threes) glyphs for the class nav"
```

---

## Task 3: Build `HubRail.astro` (desktop rail + drawer contents)

**Files:**

- Create: `src/components/hub/HubRail.astro`

The rail is the whole nav: logo → hub home, the grouped section list with an icon per item and `aria-current="page"` on the active one, and the Sign out form (reuses `/api/hub-logout`). Colors come from brand tokens so it themes automatically. This same component is slotted into the mobile drawer in Task 6, so it must not assume a fixed width itself — the parent sets width/position.

- [ ] **Step 1: Create `src/components/hub/HubRail.astro`:**

```astro
---
/* ============================================================================
   HubRail — the Family Hub's persistent navigation.
   ============================================================================
   Rendered as the sticky left rail on desktop and as the slide-in drawer's
   contents on mobile (see BaseLayout hub branch + hub-drawer.ts). One flat,
   grouped list built from src/data/hub-nav.ts — no dropdowns. Active state is
   derived from the URL. Sign out posts to /api/hub-logout (unchanged).
   Theme-aware via brand tokens; no hardcoded hex.
   ============================================================================ */
import { Image } from 'astro:assets';
import Icon from '@/components/Icon.astro';
import { hubNav } from '@/data/hub-nav';
import { site } from '@/data/site';
import wcpLogoWhite from '@/assets/brand/wcp-logo-white.png';

const path = Astro.url.pathname.replace(/\/+$/, '') || '/';
const norm = (p: string) => p.replace(/\/+$/, '') || '/';
const isActive = (href: string) => norm(href) === path;

const homeLink = hubNav[0].links[0];
const groups = hubNav.slice(1);
---

<div class="flex h-full flex-col gap-1 bg-navy px-3 py-4 text-white/85">
  <a
    href="/family-hub"
    class="mb-2 inline-flex items-center gap-2 px-2 pb-3"
    aria-label="Family Hub home"
  >
    <Image src={wcpLogoWhite} alt={site.name} width={240} height={160} class="h-9 w-auto" />
  </a>

  <nav aria-label="Family Hub" class="flex flex-1 flex-col gap-0.5 overflow-y-auto">
    <a
      href={homeLink.href}
      class="hub-rail-link"
      aria-current={isActive(homeLink.href) ? 'page' : undefined}
    >
      <Icon name={homeLink.icon} class="h-4 w-4" />
      <span>{homeLink.label}</span>
    </a>

    {
      groups.map((group) => (
        <div class="mt-3">
          <p class="px-3 pb-1 text-[0.62rem] font-extrabold tracking-wider text-white/45 uppercase">
            {group.label}
          </p>
          {group.links.map((l) => (
            <a
              href={l.href}
              class="hub-rail-link"
              aria-current={!l.external && isActive(l.href) ? 'page' : undefined}
              {...(l.external ? { target: '_blank', rel: 'noopener' } : {})}
            >
              <Icon name={l.icon} class="h-4 w-4" />
              <span class="flex-1">{l.label}</span>
              {l.external && <Icon name="external-link" class="h-3.5 w-3.5 text-white/50" />}
            </a>
          ))}
        </div>
      ))
    }
  </nav>

  <form method="POST" action="/api/hub-logout" class="mt-3 border-t border-white/10 pt-3">
    <button
      type="submit"
      class="flex w-full items-center gap-2 rounded-lg px-3 py-2 font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
    >
      <Icon name="log-out" class="h-4 w-4" />
      Sign out
    </button>
  </form>
</div>

<style>
  /* Rail link. Active = navy-on-orange (passes WCAG AA; white-on-orange fails). */
  .hub-rail-link {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    border-radius: 0.5rem;
    padding: 0.5rem 0.75rem;
    font-weight: 600;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.82);
    text-decoration: none;
    transition:
      color 0.15s ease,
      background-color 0.15s ease;
  }
  .hub-rail-link:hover {
    background-color: rgba(255, 255, 255, 0.08);
    color: #ffffff;
  }
  .hub-rail-link[aria-current='page'] {
    background-color: var(--color-orange);
    color: var(--color-navy);
    font-weight: 800;
  }
  @media (prefers-reduced-motion: reduce) {
    .hub-rail-link {
      transition: none;
    }
  }
</style>
```

Note on tokens: this uses `var(--color-orange)` and `var(--color-navy)`. Confirm those token names in `src/styles/globals.css` while implementing; if the orange token is named differently (e.g. `--color-orange-ink`), use the exact name. The active state MUST be navy text on the orange fill (verified AA in the spec), not white-on-orange.

- [ ] **Step 2: Type-check**

Run: `cd site && npx astro check`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add site/src/components/hub/HubRail.astro
git commit -m "Hub: add HubRail nav component (rail + drawer contents)"
```

_(No standalone render test yet — `HubRail` is wired into the layout in Task 6, where it gets its browser verification.)_

---

## Task 4: Build `HubTopBar.astro` (mobile top bar)

**Files:**

- Create: `src/components/hub/HubTopBar.astro`

Shown only below the `lg` breakpoint. Holds the logo (→ hub home), the current page title, and the menu button that controls the drawer. The button carries `data-hub-drawer-toggle`, `aria-controls="hub-drawer"`, `aria-expanded="false"`, and an accessible label; `hub-drawer.ts` (Task 5) wires it.

- [ ] **Step 1: Create `src/components/hub/HubTopBar.astro`:**

```astro
---
import { Image } from 'astro:assets';
import Icon from '@/components/Icon.astro';
import { site } from '@/data/site';
import wcpLogoWhite from '@/assets/brand/wcp-logo-white.png';

interface Props {
  title: string;
}
const { title } = Astro.props;
---

<div
  class="flex items-center gap-3 border-b border-white/10 bg-navy px-4 py-2.5 text-white lg:hidden"
>
  <button
    type="button"
    class="inline-flex h-10 w-10 items-center justify-center rounded-md text-white hover:bg-white/10"
    aria-label="Open menu"
    aria-controls="hub-drawer"
    aria-expanded="false"
    data-hub-drawer-toggle
  >
    <Icon name="menu" class="h-6 w-6" />
  </button>
  <span class="truncate font-bold">{title}</span>
  <a href="/family-hub" class="ml-auto inline-flex items-center" aria-label="Family Hub home">
    <Image src={wcpLogoWhite} alt={site.name} width={240} height={160} class="h-8 w-auto" />
  </a>
</div>
```

- [ ] **Step 2: Type-check**

Run: `cd site && npx astro check`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add site/src/components/hub/HubTopBar.astro
git commit -m "Hub: add HubTopBar (mobile top bar + menu button)"
```

---

## Task 5: Write `hub-drawer.ts` (off-canvas drawer behavior)

**Files:**

- Create: `src/scripts/hub-drawer.ts`

Progressive enhancement: the drawer markup exists in the DOM (Task 6) and is hidden with a `-translate-x-full` transform + `aria-hidden`; this script toggles it. Modeled on `nav.ts`'s `initMobile`/`bindGlobals`: `onPageLoad` re-binds element listeners each navigation; document-level Esc is bound once and re-queries live elements. Adds a real focus trap and backdrop click (the old mobile panel did not need those; a modal drawer does).

- [ ] **Step 1: Create `src/scripts/hub-drawer.ts`:**

```ts
// ============================================================================
// Family Hub drawer — mobile off-canvas nav (progressive enhancement)
// ============================================================================
// The drawer + backdrop are always in the DOM (see BaseLayout hub branch),
// hidden via transform + aria-hidden. This toggles them: focus moves into the
// drawer on open and returns to the toggle on close, Esc and a backdrop tap
// close it, body scroll is locked while open, and Tab is trapped inside.
// View-Transitions safe: element listeners re-bind on astro:page-load; the
// document Esc/Tab handler binds once and re-queries live nodes.
// ============================================================================
import { onPageLoad } from './_page-load';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function els() {
  return {
    toggle: document.querySelector<HTMLButtonElement>('[data-hub-drawer-toggle]'),
    drawer: document.getElementById('hub-drawer'),
    backdrop: document.getElementById('hub-drawer-backdrop'),
  };
}

function isOpen() {
  return els().toggle?.getAttribute('aria-expanded') === 'true';
}

function open() {
  const { toggle, drawer, backdrop } = els();
  if (!toggle || !drawer || !backdrop) return;
  toggle.setAttribute('aria-expanded', 'true');
  drawer.setAttribute('aria-hidden', 'false');
  drawer.classList.remove('-translate-x-full');
  backdrop.classList.remove('hidden');
  document.documentElement.classList.add('overflow-hidden');
  drawer.querySelector<HTMLElement>(FOCUSABLE)?.focus();
}

function close(restoreFocus = true) {
  const { toggle, drawer, backdrop } = els();
  if (!toggle || !drawer || !backdrop) return;
  toggle.setAttribute('aria-expanded', 'false');
  drawer.setAttribute('aria-hidden', 'true');
  drawer.classList.add('-translate-x-full');
  backdrop.classList.add('hidden');
  document.documentElement.classList.remove('overflow-hidden');
  if (restoreFocus) toggle.focus();
}

function initDrawer() {
  const { toggle, backdrop } = els();
  if (!toggle) return;
  toggle.addEventListener('click', () => (isOpen() ? close() : open()));
  backdrop?.addEventListener('click', () => close());
}

let globalsBound = false;
function bindGlobals() {
  if (globalsBound) return;
  globalsBound = true;

  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') {
      close();
      return;
    }
    if (e.key !== 'Tab') return;
    // Focus trap: keep Tab inside the open drawer.
    const drawer = document.getElementById('hub-drawer');
    if (!drawer) return;
    const focusable = [...drawer.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (el) => el.offsetParent !== null,
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

// Close on navigation (the drawer's own links) so it never lingers after a swap.
import { onBeforeSwap } from './_page-load';
onBeforeSwap(() => close(false));

onPageLoad(() => {
  initDrawer();
  bindGlobals();
});

export {};
```

- [ ] **Step 2: Lint + type-check**

Run: `cd site && npx astro check && npm run lint`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add site/src/scripts/hub-drawer.ts
git commit -m "Hub: add hub-drawer.ts (off-canvas drawer: focus trap, Esc, backdrop, scroll-lock)"
```

---

## Task 6: Wire the rail into `BaseLayout` and retire `HubHeader`

**Files:**

- Modify: `src/layouts/BaseLayout.astro:163-172` (the hub chrome branch + `<main>`)
- Modify: `src/layouts/HubShell.astro` (pass the page title to the top bar)
- Delete: `src/components/hub/HubHeader.astro`

This is the pivot: the hub renders as `[rail | (topbar + main + footer)]` with the drawer + backdrop in the DOM for mobile. The rail is `lg:` only; the top bar is `lg:hidden`; the drawer is a fixed off-canvas panel that also only matters below `lg`.

- [ ] **Step 1: Add imports** at the top of `src/layouts/BaseLayout.astro` (near the other component imports, ~line 14), and remove the `HubHeader` import:

```astro
import HubRail from '@/components/hub/HubRail.astro'; import HubTopBar from
'@/components/hub/HubTopBar.astro';
```

(`HubShell` will pass a `hubTitle` prop through `BaseLayout` so the top bar has the page title — add `hubTitle?: string` to `BaseLayout`'s `Props` interface and destructure it with a default of `'Family Hub'`.)

- [ ] **Step 2: Replace the body chrome region.** Change the current block:

```astro
{chrome === 'hub' ? <HubHeader /> : <Header />}

<main id="main" tabindex="-1" data-pagefind-body><slot /></main>

{chrome === 'hub' ? <HubFooter /> : <Footer />}
```

to:

```astro
{
  chrome === 'hub' ? (
    <div class="flex min-h-screen">
      <aside class="sticky top-0 hidden h-screen w-56 shrink-0 overflow-y-auto lg:block">
        <HubRail />
      </aside>

      {/* Mobile off-canvas drawer + backdrop (hidden ≥ lg). */}
      <div id="hub-drawer-backdrop" class="fixed inset-0 z-40 hidden bg-black/50 lg:hidden" />
      <aside
        id="hub-drawer"
        aria-hidden="true"
        class="fixed inset-y-0 left-0 z-50 w-72 -translate-x-full overflow-y-auto shadow-xl transition-transform duration-200 motion-reduce:transition-none lg:hidden"
      >
        <HubRail />
      </aside>

      <div class="flex min-w-0 flex-1 flex-col">
        <HubTopBar title={hubTitle} />
        <main id="main" tabindex="-1" data-pagefind-body class="flex-1">
          <slot />
        </main>
        <HubFooter />
      </div>
    </div>
  ) : (
    <>
      <Header />
      <main id="main" tabindex="-1" data-pagefind-body>
        <slot />
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 3: Load the drawer script.** In the `<body>` script block at the bottom of `BaseLayout` (where `reveal` is imported, ~line 177), add the drawer import so it loads on hub pages (harmless elsewhere — it no-ops when the toggle is absent):

```astro
<script>
  import '@/scripts/reveal';
  import '@/scripts/hub-drawer';
</script>
```

- [ ] **Step 4: Pass the title through `HubShell`.** In `src/layouts/HubShell.astro`, forward the page title to `BaseLayout` as `hubTitle` (the shell already receives `title`):

Change the `<BaseLayout ...>` open tag to include `hubTitle={title}`:

```astro
<BaseLayout
  chrome="hub"
  hubTitle={title}
  title={pageTitle ?? `${title} — WCP Family Hub`}
  description={description ?? 'The West Chester Preschool Family Hub for enrolled families.'}
/>
```

- [ ] **Step 5: Delete the old header**

```bash
git rm site/src/components/hub/HubHeader.astro
```

(Confirm nothing else imports it: `cd site && npx astro check` will fail if something does. `BaseLayout` is the only importer.)

- [ ] **Step 6: Build gate**

Run: `cd site && npx astro check && npm run lint && npm run build`
Expected: all pass, `dist/` produced.

- [ ] **Step 7: Browser verification** (behavioral — the real proof). Start the dev server and drive it in the Browser pane:

1. `preview_start` the dev server (`npm run dev`), open `/family-hub`.
2. Desktop width: confirm the left rail renders (logo, grouped nav, Home highlighted navy-on-orange), content to its right, Sign out at the bottom. `read_page` to confirm `nav[aria-label="Family Hub"]` and `aria-current="page"` on Home.
3. Navigate to `/family-hub/documents`: confirm the rail persists (no full reload / cross-fade) and the active item moved.
4. `resize_window` to 320px: rail hidden, top bar with menu button visible, no horizontal scroll (`read_console_messages` clean; check `document.documentElement.scrollWidth <= innerWidth` via `javascript_tool`).
5. Click the menu button: drawer slides in over the backdrop; Tab stays inside; Esc closes and returns focus to the button; a backdrop tap closes it.
6. Toggle dark mode (the ThemeToggle, or set `localStorage 'wcp-theme' = 'dark'` and reload): confirm the rail + drawer are legible and on-brand in dark.
7. `screenshot` desktop + mobile-drawer for the record.

- [ ] **Step 8: Commit**

```bash
git add site/src/layouts/BaseLayout.astro site/src/layouts/HubShell.astro
git commit -m "Hub: render the left rail + mobile drawer shell; retire HubHeader"
```

---

## Task 7: Automated SSR coverage — hub-shell Playwright spec

**Files:**

- Create: `playwright.hub.config.ts`
- Create: `tests/hub-shell.spec.ts`

The static suites can't reach the SSR hub (see "Testing reality"). Add a dedicated Playwright config whose `webServer` boots `astro dev` (the gate is open via `HUB_OPEN = true`), and a spec that audits the shell in light + dark and drives the drawer. Keep it separate from `playwright.config.ts` so the static sweeps are untouched. **If `astro dev` cannot serve the gated SSR route on this Cloudflare stack, fall back to `npm run preview` (wrangler) as the `webServer` command; if neither is workable in CI yet, mark this spec `test.describe.skip` with a comment and rely on Task 6's browser verification + the build gate — this matches the codebase's current documented deferral in `tests/routes.ts`.**

- [ ] **Step 1: Create `playwright.hub.config.ts`:**

```ts
import { defineConfig, devices } from '@playwright/test';

// SSR hub coverage. Unlike playwright.config.ts (which serves static
// dist/client), this boots the dev server so the gated /family-hub pages
// render. The hub gate is open in preview (HUB_OPEN = true).
export default defineConfig({
  testDir: './tests',
  testMatch: 'hub-shell.spec.ts',
  timeout: 30_000,
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321/family-hub',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: { baseURL: 'http://localhost:4321' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

- [ ] **Step 2: Write the failing spec** `tests/hub-shell.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settle } from './helpers';

test.describe('Family Hub shell', () => {
  test('rail renders with active Home and no axe violations (light + dark)', async ({ page }) => {
    await page.goto('/family-hub', { waitUntil: 'load' });
    await settle(page);

    const nav = page.locator('nav[aria-label="Family Hub"]').first();
    await expect(nav).toBeVisible();
    await expect(nav.locator('[aria-current="page"]')).toHaveText(/Home/);

    for (const theme of ['light', 'dark'] as const) {
      await page.evaluate((t) => {
        document.documentElement.classList.toggle('dark', t === 'dark');
      }, theme);
      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations,
        `[${theme}] ` + results.violations.map((v) => v.id).join(', '),
      ).toEqual([]);
    }
  });

  test('no horizontal overflow at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/family-hub', { waitUntil: 'load' });
    await settle(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });

  test('drawer opens, traps focus, and Esc closes it', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/family-hub', { waitUntil: 'load' });
    await settle(page);

    const toggle = page.locator('[data-hub-drawer-toggle]');
    const drawer = page.locator('#hub-drawer');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(drawer).toHaveAttribute('aria-hidden', 'false');

    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(drawer).toHaveAttribute('aria-hidden', 'true');
  });
});
```

- [ ] **Step 3: Add an npm script** in `site/package.json` `scripts`:

```json
"test:hub": "playwright test -c playwright.hub.config.ts"
```

- [ ] **Step 4: Run it**

Run: `cd site && npm run test:hub`
Expected: PASS. If the `webServer` cannot start the SSR route, apply the fallback noted at the top of this task (switch to `npm run preview`, or `describe.skip` with a comment) and record which path was taken.

- [ ] **Step 5: Commit**

```bash
git add site/playwright.hub.config.ts site/tests/hub-shell.spec.ts site/package.json
git commit -m "Test: SSR Playwright spec for the hub shell (rail, 320px reflow, drawer a11y, light+dark)"
```

---

## Task 8: Update the docs

**Files:**

- Modify: `docs/FAMILY_HUB.md`, `CLAUDE.md`

Per the repo's keep-docs-in-sync rule, document the new shell in the same change set.

- [ ] **Step 1:** In `site/docs/FAMILY_HUB.md`, add a short "The hub shell" section: every `/family-hub/*` page renders inside `HubShell` → `BaseLayout chrome="hub"`, which now draws the persistent **left rail** (`HubRail`, from `hub-nav.ts`) on desktop and a **hamburger drawer** (`HubTopBar` + `hub-drawer.ts`) on mobile; Sign out still posts to `/api/hub-logout`; it is theme-aware.

- [ ] **Step 2:** In `site/CLAUDE.md`, update the hub mental model: note the rail shell and add a gotcha line — the drawer script uses `onPageLoad`/`onBeforeSwap` (View-Transitions safe), and the SSR hub is covered by `npm run test:hub` (separate config), not the static `dist/client` sweeps.

- [ ] **Step 3: Verify links + commit**

```bash
git add site/docs/FAMILY_HUB.md site/CLAUDE.md
git commit -m "Docs: describe the Family Hub rail shell + drawer, and the SSR test config"
```

---

## Self-review

- **Spec coverage:** Shell + rail (Tasks 3, 6) ✓; grouped nav + single source (Task 1) ✓; SVG icons, no emoji (Task 2 + reused `Icon`) ✓; navy-on-orange AA active state (Task 3 style) ✓; mobile hamburger drawer with focus trap / Esc / backdrop / scroll-lock (Tasks 4–6) ✓; theme-aware light+dark via tokens (Tasks 3, 6, 7) ✓; Sign out to `/api/hub-logout` (Task 3) ✓; every hub page wrapped, bodies untouched (Task 6) ✓; 320px reflow + a11y coverage (Task 7) ✓; docs (Task 8) ✓. **Deferred by design (separate plans):** the Home dashboard (greeting, community chips, class helper row, widgets) and per-section reskins — not in this shell slice.
- **Placeholder scan:** No "TBD"/"handle X". The two conditional fallbacks (token name in Task 3; SSR webServer in Task 7) are explicit, with the concrete alternative named — not open-ended.
- **Type/name consistency:** `#hub-drawer`, `#hub-drawer-backdrop`, `[data-hub-drawer-toggle]`, `aria-controls="hub-drawer"` match across Task 4 (markup), Task 5 (script), and Task 6 (layout). `hubTitle` prop added to `BaseLayout` (Task 6 Step 1) and passed from `HubShell` (Task 6 Step 4) and consumed by `HubTopBar` `title` (Task 4). `blocks`/`crayon` defined (Task 2) before use (Task 1). `-translate-x-full` toggled consistently in Task 5 and set as the closed default in Task 6.

## Execution note

Two flagged unknowns to resolve at implementation time, both with a stated fallback so they can't block:

1. **Token names** (`--color-orange` / `--color-navy`) — confirm against `globals.css`; use the exact names.
2. **SSR `webServer`** for Task 7 — `astro dev` vs `npm run preview` (wrangler); skip-with-comment is the documented-precedent fallback.
