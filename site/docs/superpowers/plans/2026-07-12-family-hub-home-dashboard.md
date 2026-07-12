# Family Hub Home Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/family-hub` (the Home landing) into the at-a-glance dashboard from the design spec — greeting, community chips, school-year progress bar, class helper row, and six content widgets — replacing the old quick-link grid, inside the rail shell that already ships every hub page.

**Architecture:** `src/pages/family-hub/index.astro` is rebuilt to compose five new single-purpose components (`HubGreeting`, `ClassHelperRow`, and four/six widget components sharing one `HomeWidgetCard` shell) instead of the current `FeatureCard` grids. Each widget fetches its own slice of Sanity data at request time via the existing gated `sanityFetch` client and renders a compact card or a designed empty-state — the same try/catch-to-fallback idiom every other hub page already uses. Two widgets (Class Photos, Budget Snapshot) have no backing Sanity schema yet, so they render as permanent, honestly-labeled empty-states, matching the precedent already shipped on the Calendar page (Google Calendar ID unset) and the pre-campaign Fundraising page. `siteSettings` grows four new fields (`yearStart`, `yearEnd`, `firstDay`, `familyCount`) to drive the chips and progress bar.

**Tech Stack:** Astro 7 (SSR, `prerender = false`), Tailwind v4 (CSS-first tokens), Sanity (`sanityFetch` gated client), TypeScript, Playwright + axe-core.

**Scope:** This is Phase 1b of the spec ([2026-07-12-family-hub-dashboard-design.md](../specs/2026-07-12-family-hub-dashboard-design.md)), continuing straight from the shipped shell (Phase 1a, [2026-07-12-family-hub-shell.md](2026-07-12-family-hub-shell.md)). Every other hub page keeps its current body — this plan only touches Home. **Phase 2 (per-section reskins)** stays a separate, later plan.

**Non-goals for this phase** (documented so nobody "fixes" them as a side-quest): the two schema-less widgets (Class Photos, Budget Snapshot) are empty-state-only by design — there is no `classPhoto` doc type or budget/treasury schema in this repo, and inventing one is out of scope for a dashboard-shell plan. The families count is derived, never personalized (Home stays school-wide per the spec's non-goals). No new client JS: the greeting/chips/progress bar/widgets are all server-rendered at request time — no ticking countdown (the existing `countdown.ts` ticker is for the public marketing `CountdownSection`, not reused here; a plain SSR "N days" string is simpler, matches the shell's minimal-client-JS principle, and needs no `aria-live` region).

---

## Testing reality (same caveat as the shell plan — read before writing any test task)

`/family-hub` is SSR behind the gate and excluded from the static Playwright suites (`tests/routes.ts`). Per-task correctness gates are `npx astro check`, `npm run lint`, and `npm run build`. Behavioral verification (chips render, widgets show their real/empty states, 320px reflow, light+dark) happens against the running dev server in the browser preview, and gets locked in by extending the SSR suite added in the shell phase (`playwright.hub.config.ts`, which boots `npm run build && npm run preview` — **not** `astro dev`, which daemonizes on this stack and breaks Playwright's `webServer`, see [FAMILY_HUB.md](../../FAMILY_HUB.md)).

The hub gate is open for preview (`HUB_OPEN = true` in `src/middleware.ts`), so `/family-hub` is reachable without a password while building. The dev/preview Sanity dataset currently has **no** `update`, `campaign`, or `hubDocument` (category `minutes`) content wired for these exact widget queries yet, so the empty-state path is what you'll actually see in the browser for most widgets — that's expected and is real coverage of the empty-state branch, not a bug to chase.

---

## File structure

**Create:**
- `src/components/hub/HomeWidgetCard.astro` — shared widget shell (icon, title, optional "See all" link, content slot, empty-state fallback).
- `src/components/hub/HubGreeting.astro` — greeting + tagline + community chips (date, families, school-year status) + progress bar.
- `src/components/hub/ClassHelperRow.astro` — the four class cards (Twos/Threes/Pre-K AM/Pre-K PM), each in its class color.
- `src/components/hub/UpcomingEventsWidget.astro` — next 3 `event` docs.
- `src/components/hub/AnnouncementsWidget.astro` — pinned + recent `update` docs.
- `src/components/hub/MeetingMinutesWidget.astro` — `hubDocument` docs, category `minutes`.
- `src/components/hub/FundraisingWidget.astro` — the active `campaign` doc's progress.
- `src/components/hub/ClassPhotosWidget.astro` — permanent empty-state (no schema yet).
- `src/components/hub/BudgetSnapshotWidget.astro` — permanent empty-state (no schema yet).
- `tests/hub-home.spec.ts` — Task 10 SSR Playwright spec for the Home dashboard.

**Modify:**
- `src/sanity/schemaTypes/singletons/siteSettings.ts` — add `yearStart`, `yearEnd`, `firstDay`, `familyCount` to the `year` group.
- `src/lib/queries.ts` — extend `SITE_SETTINGS_QUERY` with the four new fields; add `DIRECTORY_FAMILY_COUNT_QUERY`.
- `src/pages/family-hub/index.astro` — full rebuild: greeting + chips + progress bar + class row + widget grid + `SectionRenderer` for board-added content.
- `playwright.hub.config.ts` — `testMatch` grows to include `hub-home.spec.ts`.
- `docs/FAMILY_HUB.md`, `CLAUDE.md`, `src/sanity/guides/content.ts` — document the Home dashboard and the new `siteSettings` fields.

---

## Task 1: `siteSettings` schema — school-year dates + family count

**Files:**
- Modify: `src/sanity/schemaTypes/singletons/siteSettings.ts`
- Modify: `src/lib/queries.ts`

Four new fields on the existing `year` group: three dates that drive the countdown/progress bar, and an optional manual override for the families-count chip (falls back to a live directory count — see Task 3).

- [ ] **Step 1: Add the fields.** In `src/sanity/schemaTypes/singletons/siteSettings.ts`, insert after the `googleCalendarId` field (still inside the `year` group, before the `// Social & store` comment):

```ts
    defineField({
      name: 'yearStart',
      title: 'School year start date',
      type: 'date',
      group: 'year',
      description:
        'First day of the school year (drives the progress bar on the Family Hub home). Leave blank to hide the progress bar.',
    }),
    defineField({
      name: 'yearEnd',
      title: 'School year end date',
      type: 'date',
      group: 'year',
      description:
        'Last day of the school year (drives the progress bar on the Family Hub home). Leave blank to hide the progress bar.',
    }),
    defineField({
      name: 'firstDay',
      title: 'First day of school',
      type: 'date',
      group: 'year',
      description:
        'Powers the "N days until school" countdown on the Family Hub home before the year starts. Leave blank to hide it.',
    }),
    defineField({
      name: 'familyCount',
      title: 'Family count (optional override)',
      type: 'number',
      group: 'year',
      description:
        'Shown on the Family Hub home. Leave blank to use a live count of opted-in Directory families instead.',
    }),
```

- [ ] **Step 2: Extend `SITE_SETTINGS_QUERY`.** In `src/lib/queries.ts`, replace:

```ts
export const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0]{ name, shortName, founded, tagline, url, phone, emailGeneral, emailAdmin, emailTreasurer, street, city, state, zip, parkingNote, schoolYearLabel, enrolling, closureStatement, facebook, instagram, storeUrl, license, licenseAuthority }`;
```

with:

```ts
export const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0]{ name, shortName, founded, tagline, url, phone, emailGeneral, emailAdmin, emailTreasurer, street, city, state, zip, parkingNote, schoolYearLabel, enrolling, closureStatement, yearStart, yearEnd, firstDay, familyCount, facebook, instagram, storeUrl, license, licenseAuthority }`;
```

- [ ] **Step 3: Add the directory-count query.** Still in `src/lib/queries.ts`, add near `SITE_SETTINGS_QUERY`:

```ts
/** Live count of families visible in the gated Directory (opted-in only). */
export const DIRECTORY_FAMILY_COUNT_QUERY = `count(*[_type == "directoryEntry" && optedIn == true])`;
```

- [ ] **Step 4: Verify + commit**

Run: `cd site && npx astro check`
Expected: 0 errors.

```bash
git add site/src/sanity/schemaTypes/singletons/siteSettings.ts site/src/lib/queries.ts
git commit -m "Sanity: add siteSettings school-year dates + family-count override, for the Home dashboard"
```

*(The dates/count are one-time-per-year values a board member sets — leave them for manual Studio entry at `/studio` → Site Settings → School year; no seed script needed. Every consumer below treats them as optional and degrades gracefully when unset, matching the Calendar page's `googleCalendarId` precedent.)*

---

## Task 2: `HomeWidgetCard.astro` — shared widget shell

**Files:**
- Create: `src/components/hub/HomeWidgetCard.astro`

One visual shell every widget renders through: icon + title in the header, an optional "See all" link, and either the slotted content or a compact empty message. Keeps each widget's own file small (just data-fetching + a content slot).

- [ ] **Step 1: Create `src/components/hub/HomeWidgetCard.astro`:**

```astro
---
/* ============================================================================
   HomeWidgetCard — shared shell for every Family Hub home dashboard widget
   ============================================================================
   Header (icon chip + title + optional "See all" link) and a body that's
   either the slotted content or a compact empty message. Each widget owns its
   own data fetch and passes `empty` + `emptyText`; this component only knows
   how to lay the card out. Theme-aware via the same tokens every hub card
   already uses (border-border / bg-white dark:bg-surface).
   ============================================================================ */
import Icon from '@/components/Icon.astro';
import { cn } from '@/lib/utils';

interface Props {
  icon: string;
  title: string;
  /** Where "See all" points. Omitted when there's nothing to see yet. */
  seeAllHref?: string;
  seeAllLabel?: string;
  /** True when the widget has no real content to show. */
  empty?: boolean;
  /** Shown in place of the slot when `empty` is true. */
  emptyText?: string;
  class?: string;
}
const {
  icon,
  title,
  seeAllHref,
  seeAllLabel = 'See all',
  empty = false,
  emptyText = 'Nothing here yet.',
  class: className,
} = Astro.props;
---

<div
  class={cn(
    'flex h-full flex-col rounded-[var(--radius)] border border-border bg-white p-6 shadow-sm dark:bg-surface',
    className,
  )}
  data-reveal
>
  <div class="flex items-start justify-between gap-3">
    <div class="flex items-center gap-3">
      <span
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky/15 text-sky-ink"
        aria-hidden="true"
      >
        <Icon name={icon} class="h-5 w-5" />
      </span>
      <h3 class="text-base font-extrabold text-heading">{title}</h3>
    </div>
    {
      !empty && seeAllHref && (
        <a
          href={seeAllHref}
          class="shrink-0 text-sm font-semibold text-sky-ink hover:underline"
        >
          {seeAllLabel}
        </a>
      )
    }
  </div>

  <div class="mt-4 flex-1">
    {empty ? <p class="text-sm leading-relaxed text-ink-muted">{emptyText}</p> : <slot />}
  </div>
</div>
```

- [ ] **Step 2: Type-check**

Run: `cd site && npx astro check`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add site/src/components/hub/HomeWidgetCard.astro
git commit -m "Hub: add HomeWidgetCard, the shared shell for Home dashboard widgets"
```

---

## Task 3: `HubGreeting.astro` — greeting, chips, progress bar

**Files:**
- Create: `src/components/hub/HubGreeting.astro`

The hero of the dashboard: a time-of-day greeting, the site tagline, three community chips (today's date, families count, school-year status), and a slim progress bar. Every siteSettings-backed piece degrades gracefully when its field is unset — nothing renders "0" or a broken calculation.

- [ ] **Step 1: Create `src/components/hub/HubGreeting.astro`:**

```astro
---
/* ============================================================================
   HubGreeting — Family Hub home hero: greeting, chips, school-year bar
   ============================================================================
   Server-rendered only (no client JS, no ticking countdown — see the plan's
   non-goals). Greeting uses America/New_York wall-clock time via
   Intl (NOT Date#getHours, which is UTC in the Workers runtime with no local
   TZ data). Chips and the progress bar each read one or more optional
   siteSettings date fields and simply omit themselves when unset, matching
   the rest of the hub's "designed absence, not a broken zero" convention.
   ============================================================================ */
import Icon from '@/components/Icon.astro';

interface Props {
  tagline: string;
  yearStart?: string;
  yearEnd?: string;
  firstDay?: string;
  familyCount?: number;
}
const { tagline, yearStart, yearEnd, firstDay, familyCount } = Astro.props;

// Greeting: Eastern wall-clock hour, not server UTC. hourCycle 'h23' avoids the
// "24" some ICU implementations return for midnight under hour12:false.
const nyHour = Number(
  new Date().toLocaleString('en-US', { timeZone: 'America/New_York', hourCycle: 'h23' }),
);
const greeting = nyHour < 12 ? 'Good morning' : nyHour < 17 ? 'Good afternoon' : 'Good evening';

const todayLabel = new Date().toLocaleDateString('en-US', {
  timeZone: 'America/New_York',
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

// Whole-calendar-day math on UTC-normalized date-only strings (Sanity `date`
// fields are "YYYY-MM-DD", no time component) — a day off at most near a
// midnight boundary, which is fine for an at-a-glance chip, not a precise
// instant.
const todayUTC = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
const daysUntil = (iso?: string): number | null => {
  if (!iso) return null;
  const target = new Date(`${iso}T00:00:00Z`);
  return Math.ceil((target.getTime() - todayUTC.getTime()) / 86_400_000);
};

const daysToFirstDay = daysUntil(firstDay);
const daysToYearEnd = daysUntil(yearEnd);

// Third chip: "N days 'til school" before the first day, a gentle end-of-year
// note once the year has ended, otherwise nothing (mid-year has no single
// glanceable number worth showing here — the progress bar covers that).
let statusChip: { icon: string; text: string } | null = null;
if (daysToFirstDay !== null && daysToFirstDay > 0) {
  statusChip = { icon: 'party-popper', text: `${daysToFirstDay} day${daysToFirstDay === 1 ? '' : 's'} 'til school` };
} else if (daysToYearEnd !== null && daysToYearEnd <= 0) {
  statusChip = { icon: 'sun', text: 'Enjoy your summer!' };
}

// Progress bar: only when both bounds are set; clamps outside the range so a
// stale/inverted pair of dates never produces a negative width or NaN.
const yearPct =
  yearStart && yearEnd
    ? Math.min(
        100,
        Math.max(
          0,
          Math.round(
            ((todayUTC.getTime() - new Date(`${yearStart}T00:00:00Z`).getTime()) /
              (new Date(`${yearEnd}T00:00:00Z`).getTime() - new Date(`${yearStart}T00:00:00Z`).getTime())) *
              100,
          ),
        ),
      )
    : null;

const familiesLabel =
  familyCount && familyCount > 0 ? `${familyCount} famil${familyCount === 1 ? 'y' : 'ies'}` : null;
---

<div class="rounded-[var(--radius)] border border-border bg-white p-6 shadow-sm sm:p-8 dark:bg-surface" data-reveal>
  <p class="font-display text-2xl text-heading sm:text-3xl">{greeting}, WCP family!</p>
  <p class="mt-2 text-ink-muted">{tagline}</p>

  <ul class="mt-5 flex flex-wrap gap-2">
    <li class="inline-flex items-center gap-1.5 rounded-full bg-sky/15 px-3 py-1.5 text-sm font-semibold text-sky-ink">
      <Icon name="calendar-days" class="h-4 w-4" />
      {todayLabel}
    </li>
    {
      familiesLabel && (
        <li class="inline-flex items-center gap-1.5 rounded-full bg-green/15 px-3 py-1.5 text-sm font-semibold text-green-ink">
          <Icon name="users" class="h-4 w-4" />
          {familiesLabel}
        </li>
      )
    }
    {
      statusChip && (
        <li class="inline-flex items-center gap-1.5 rounded-full bg-amber/25 px-3 py-1.5 text-sm font-semibold text-orange-ink">
          <Icon name={statusChip.icon} class="h-4 w-4" />
          {statusChip.text}
        </li>
      )
    }
  </ul>

  {
    yearPct !== null && (
      <div class="mt-6">
        <div class="flex items-center justify-between text-xs font-semibold text-ink-muted">
          <span>School year progress</span>
          <span>{yearPct}%</span>
        </div>
        <div
          class="mt-1.5 h-2.5 overflow-hidden rounded-full bg-navy/10 dark:bg-white/15"
          role="progressbar"
          aria-label="School year progress"
          aria-valuenow={yearPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div class="h-full rounded-full bg-sky-ink" style={`width: ${yearPct}%`} />
        </div>
      </div>
    )
  }
</div>
```

- [ ] **Step 2: Type-check**

Run: `cd site && npx astro check`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add site/src/components/hub/HubGreeting.astro
git commit -m "Hub: add HubGreeting (greeting, community chips, school-year progress bar)"
```

---

## Task 4: `ClassHelperRow.astro`

**Files:**
- Create: `src/components/hub/ClassHelperRow.astro`

Four compact class cards — Twos (blocks), Threes (crayon), Pre-K AM (sun), Pre-K PM (moon) — each in its brand color via `classStyles`, linking straight to that class's hub page.

- [ ] **Step 1: Create `src/components/hub/ClassHelperRow.astro`:**

```astro
---
/* ============================================================================
   ClassHelperRow — the four class cards on the Family Hub home
   ============================================================================
   One card per class, tinted with the shared class-color helper (never a
   hardcoded color — see src/lib/class-colors.ts). Links to that class's hub
   page, which already carries the schedule/facts (there is no separate
   "helper schedule" doc — the class hub page IS the destination).
   ============================================================================ */
import Icon from '@/components/Icon.astro';
import { classStyles } from '@/lib/class-colors';

const CLASSES = [
  { slug: 'twos', label: 'Twos', icon: 'blocks', href: '/family-hub/twos' },
  { slug: 'threes', label: 'Threes', icon: 'crayon', href: '/family-hub/threes' },
  { slug: 'pre-k-am', label: 'Pre-K AM', icon: 'sun', href: '/family-hub/pre-k-am' },
  { slug: 'pre-k-pm', label: 'Pre-K PM', icon: 'moon', href: '/family-hub/pre-k-pm' },
] as const;
---

<ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {
    CLASSES.map((c) => {
      const styles = classStyles(c.slug);
      return (
        <li>
          <a
            href={c.href}
            class={`group flex items-center gap-3 rounded-[var(--radius)] border-2 bg-white p-4 no-underline shadow-sm transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:bg-surface ${styles.border}`}
            data-reveal
          >
            <span
              class={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${styles.iconChip}`}
              aria-hidden="true"
            >
              <Icon name={c.icon} class="h-5 w-5" />
            </span>
            <span class="font-bold text-heading">{c.label}</span>
          </a>
        </li>
      );
    })
  }
</ul>
```

- [ ] **Step 2: Type-check**

Run: `cd site && npx astro check`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add site/src/components/hub/ClassHelperRow.astro
git commit -m "Hub: add ClassHelperRow (the four class cards on the Home dashboard)"
```

---

## Task 5: News widgets — Upcoming Events + Announcements

**Files:**
- Create: `src/components/hub/UpcomingEventsWidget.astro`
- Create: `src/components/hub/AnnouncementsWidget.astro`

Both fetch their own data with the standard try/catch-to-empty-array idiom, then render up to 3 compact rows inside `HomeWidgetCard`, or the card's empty state.

- [ ] **Step 1: Create `src/components/hub/UpcomingEventsWidget.astro`:**

```astro
---
/* ============================================================================
   UpcomingEventsWidget — next 3 events, from the same `event` docs the public
   Events page reads. The gated hub's Calendar page is a Google Calendar
   embed (no discrete Sanity event list there), so "See all" points at the
   hub's Calendar destination even though this widget's data comes from
   Sanity — that's a navigation choice, not a data-consistency issue.
   ============================================================================ */
import HomeWidgetCard from '@/components/hub/HomeWidgetCard.astro';
import Icon from '@/components/Icon.astro';
import { sanityFetch } from '@/lib/sanity';
import { UPCOMING_EVENTS_QUERY } from '@/lib/queries';

interface EventDoc {
  _id: string;
  title: string;
  startDate: string;
  allDay?: boolean;
  location?: string;
}
let events: EventDoc[] = [];
try {
  events = (await sanityFetch<EventDoc[]>(UPCOMING_EVENTS_QUERY)).slice(0, 3);
} catch {
  events = [];
}

const fmt = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
---

<HomeWidgetCard
  icon="calendar-days"
  title="Upcoming Events"
  seeAllHref="/family-hub/calendar"
  empty={events.length === 0}
  emptyText="Upcoming events will list here once they're added."
>
  <ul class="space-y-3">
    {
      events.map((e) => (
        <li class="flex items-start gap-3">
          <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky/15 text-sky-ink" aria-hidden="true">
            <Icon name="calendar-days" class="h-4 w-4" />
          </span>
          <div class="min-w-0">
            <p class="truncate font-semibold text-heading">{e.title}</p>
            <p class="text-sm text-ink-muted">
              {fmt(e.startDate)}
              {e.location ? ` · ${e.location}` : ''}
            </p>
          </div>
        </li>
      ))
    }
  </ul>
</HomeWidgetCard>
```

- [ ] **Step 2: Create `src/components/hub/AnnouncementsWidget.astro`:**

```astro
---
/* ============================================================================
   AnnouncementsWidget — pinned + most-recent `update` docs (the same source
   as the full Updates page). Pinned first, then newest, capped at 3.
   ============================================================================ */
import HomeWidgetCard from '@/components/hub/HomeWidgetCard.astro';
import { sanityFetch } from '@/lib/sanity';

interface UpdateDoc {
  _id: string;
  title: string;
  publishedAt: string;
  pinned?: boolean;
  slug?: string;
}
let updates: UpdateDoc[] = [];
try {
  updates = await sanityFetch<UpdateDoc[]>(
    `*[_type == "update"] | order(pinned desc, publishedAt desc)[0...3]{ _id, title, publishedAt, pinned, "slug": slug.current }`,
  );
} catch {
  updates = [];
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
---

<HomeWidgetCard
  icon="newspaper"
  title="Announcements"
  seeAllHref="/family-hub/updates"
  empty={updates.length === 0}
  emptyText="Board and administrator announcements will list here once posted."
>
  <ul class="space-y-3">
    {
      updates.map((u) => (
        <li>
          {u.slug ? (
            <a href={`/family-hub/updates/${u.slug}`} class="font-semibold text-heading hover:underline">
              {u.pinned && <span class="mr-1 text-orange-ink">•</span>}
              {u.title}
            </a>
          ) : (
            <p class="font-semibold text-heading">
              {u.pinned && <span class="mr-1 text-orange-ink">•</span>}
              {u.title}
            </p>
          )}
          <p class="text-sm text-ink-muted">{fmt(u.publishedAt)}</p>
        </li>
      ))
    }
  </ul>
</HomeWidgetCard>
```

- [ ] **Step 3: Type-check**

Run: `cd site && npx astro check`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add site/src/components/hub/UpcomingEventsWidget.astro site/src/components/hub/AnnouncementsWidget.astro
git commit -m "Hub: add UpcomingEventsWidget + AnnouncementsWidget"
```

---

## Task 6: Resource/money widgets — Meeting Minutes + Fundraising

**Files:**
- Create: `src/components/hub/MeetingMinutesWidget.astro`
- Create: `src/components/hub/FundraisingWidget.astro`

- [ ] **Step 1: Create `src/components/hub/MeetingMinutesWidget.astro`:**

```astro
---
/* ============================================================================
   MeetingMinutesWidget — hubDocument docs in the "minutes" category, the
   same source the Documents page's "Meeting Minutes" group reads. Filtered
   client-side (matches documents.astro's own pattern) since there is no
   dedicated minutes-only route to link out to — "See all" goes to Documents.
   ============================================================================ */
import HomeWidgetCard from '@/components/hub/HomeWidgetCard.astro';
import Icon from '@/components/Icon.astro';
import { sanityFetch } from '@/lib/sanity';

interface HubDocDoc {
  title: string;
  category: string;
  order: number;
  href?: string;
}
let minutes: HubDocDoc[] = [];
try {
  const docs = await sanityFetch<HubDocDoc[]>(
    `*[_type == "hubDocument" && category == "minutes" && (defined(link) || defined(file.asset))] | order(order asc){
      title, category, order,
      "href": select(sourceType == "file" => file.asset->url, link)
    }`,
  );
  minutes = docs.filter((d) => d.href).slice(0, 3);
} catch {
  minutes = [];
}
---

<HomeWidgetCard
  icon="file-text"
  title="Meeting Minutes"
  seeAllHref="/family-hub/documents"
  empty={minutes.length === 0}
  emptyText="Board meeting minutes will list here once posted."
>
  <ul class="space-y-3">
    {
      minutes.map((m) => (
        <li>
          <a
            href={m.href}
            target="_blank"
            rel="noopener"
            class="flex items-center gap-2 font-semibold text-heading hover:underline"
          >
            <Icon name="file-text" class="h-4 w-4 shrink-0 text-sky-ink" />
            <span class="truncate">{m.title}</span>
          </a>
        </li>
      ))
    }
  </ul>
</HomeWidgetCard>
```

- [ ] **Step 2: Create `src/components/hub/FundraisingWidget.astro`:**

```astro
---
/* ============================================================================
   FundraisingWidget — the single most-recent active `campaign` doc's
   progress bar, a compact version of the Fundraising page's full list.
   ============================================================================ */
import HomeWidgetCard from '@/components/hub/HomeWidgetCard.astro';
import { sanityFetch } from '@/lib/sanity';
import { ACTIVE_CAMPAIGN_QUERY } from '@/lib/queries';

interface Campaign {
  title?: string;
  goalAmount?: number;
  raisedAmount?: number;
}
let campaign: Campaign | null = null;
try {
  campaign = await sanityFetch<Campaign | null>(ACTIVE_CAMPAIGN_QUERY);
} catch {
  campaign = null;
}

const money = (n?: number) => `$${Math.round(n ?? 0).toLocaleString('en-US')}`;
const pct =
  campaign?.goalAmount && campaign.goalAmount > 0
    ? Math.min(100, Math.round(((campaign.raisedAmount ?? 0) / campaign.goalAmount) * 100))
    : 0;
---

<HomeWidgetCard
  icon="party-popper"
  title="Fundraising"
  seeAllHref="/family-hub/fundraising"
  empty={!campaign}
  emptyText="Current campaigns and totals will show here once one is active."
>
  {
    campaign && (
      <div>
        <p class="font-semibold text-heading">{campaign.title}</p>
        {campaign.goalAmount && campaign.goalAmount > 0 && (
          <>
            <div class="mt-3 flex items-end justify-between gap-3">
              <p class="text-lg font-bold text-heading">
                {money(campaign.raisedAmount)}
                <span class="text-xs font-normal text-ink-muted"> raised</span>
              </p>
              <p class="text-xs font-semibold text-ink-muted">{money(campaign.goalAmount)} goal</p>
            </div>
            <div
              class="mt-1.5 h-2.5 overflow-hidden rounded-full bg-navy/10 dark:bg-white/15"
              role="progressbar"
              aria-label={`${campaign.title ?? 'Campaign'} progress`}
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div class="h-full rounded-full bg-amber" style={`width: ${pct}%`} />
            </div>
          </>
        )}
      </div>
    )
  }
</HomeWidgetCard>
```

- [ ] **Step 3: Type-check**

Run: `cd site && npx astro check`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add site/src/components/hub/MeetingMinutesWidget.astro site/src/components/hub/FundraisingWidget.astro
git commit -m "Hub: add MeetingMinutesWidget + FundraisingWidget"
```

---

## Task 7: Schema-less widgets — Class Photos + Budget Snapshot

**Files:**
- Create: `src/components/hub/ClassPhotosWidget.astro`
- Create: `src/components/hub/BudgetSnapshotWidget.astro`

Neither has a backing Sanity doc type in this repo (no `classPhoto` gallery, no treasury/budget schema — confirmed by searching the schema directory while planning). Both render `HomeWidgetCard`'s empty state unconditionally, honestly naming what will eventually feed them, exactly like the Calendar page does before `googleCalendarId` is set. **Do not fabricate sample photos or numbers.**

- [ ] **Step 1: Create `src/components/hub/ClassPhotosWidget.astro`:**

```astro
---
/* ============================================================================
   ClassPhotosWidget — permanent empty-state.
   ============================================================================
   No `classPhoto`/gallery doc type exists in this repo yet. This card names
   what will show here so the dashboard reads as "coming soon", not broken,
   matching the Calendar page's pre-googleCalendarId empty state. Wire this up
   for real once a photo-gallery schema exists — do not fake content here.
   ============================================================================ */
import HomeWidgetCard from '@/components/hub/HomeWidgetCard.astro';
---

<HomeWidgetCard
  icon="camera"
  title="Class Photos"
  empty
  emptyText="Class photos will appear here once the photo gallery is set up."
/>
```

- [ ] **Step 2: Create `src/components/hub/BudgetSnapshotWidget.astro`:**

```astro
---
/* ============================================================================
   BudgetSnapshotWidget — permanent empty-state.
   ============================================================================
   No budget/treasury schema exists in this repo yet. Same honesty-over-
   fabrication rule as ClassPhotosWidget — see that file's comment.
   ============================================================================ */
import HomeWidgetCard from '@/components/hub/HomeWidgetCard.astro';
---

<HomeWidgetCard
  icon="piggy-bank"
  title="Budget Snapshot"
  empty
  emptyText="A budget summary will appear here once the treasurer's tracking sheet is connected."
/>
```

- [ ] **Step 3: Type-check**

Run: `cd site && npx astro check`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add site/src/components/hub/ClassPhotosWidget.astro site/src/components/hub/BudgetSnapshotWidget.astro
git commit -m "Hub: add ClassPhotosWidget + BudgetSnapshotWidget (empty-state only, no schema yet)"
```

---

## Task 8: Rebuild `/family-hub/index.astro`

**Files:**
- Modify: `src/pages/family-hub/index.astro`

Replace the old quick-link grid entirely (the `Information`/`Community` group filter is already stale dead code — `hub-nav.ts` no longer has an `Information` group since the shell phase, so today it silently renders nothing). Compose `HubGreeting`, `ClassHelperRow`, the six widgets in a responsive grid, and keep `SectionRenderer` for board-added content at the bottom (unchanged pattern from every other hub page).

- [ ] **Step 1: Replace the full file:**

```astro
---
/* ============================================================================
   Family Hub — landing / dashboard (GATED)
   ============================================================================
   prerender=false so the middleware runs the sign-in check at request time.
   The at-a-glance dashboard: greeting + community chips + school-year
   progress bar (HubGreeting), the four class cards (ClassHelperRow), and six
   compact content widgets. Board-editable content from the "home" hubPage
   doc still renders below via SectionRenderer, unchanged from every other
   hub page.
   ============================================================================ */
export const prerender = false;

import HubShell from '@/layouts/HubShell.astro';
import Section from '@/components/Section.astro';
import SectionRenderer from '@/components/sections/SectionRenderer.astro';
import HubGreeting from '@/components/hub/HubGreeting.astro';
import ClassHelperRow from '@/components/hub/ClassHelperRow.astro';
import UpcomingEventsWidget from '@/components/hub/UpcomingEventsWidget.astro';
import AnnouncementsWidget from '@/components/hub/AnnouncementsWidget.astro';
import ClassPhotosWidget from '@/components/hub/ClassPhotosWidget.astro';
import MeetingMinutesWidget from '@/components/hub/MeetingMinutesWidget.astro';
import BudgetSnapshotWidget from '@/components/hub/BudgetSnapshotWidget.astro';
import FundraisingWidget from '@/components/hub/FundraisingWidget.astro';
import { sanityFetch } from '@/lib/sanity';
import { HUB_PAGE_QUERY, SITE_SETTINGS_QUERY, DIRECTORY_FAMILY_COUNT_QUERY } from '@/lib/queries';
import { site } from '@/data/site';

interface HubPageDoc {
  heading?: string;
  intro?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sections?: any[];
}
let doc: HubPageDoc | null = null;
try {
  doc = await sanityFetch<HubPageDoc | null>(HUB_PAGE_QUERY, { key: 'home' });
} catch {
  doc = null;
}
const title = doc?.heading || 'Family Hub';

interface SettingsDoc {
  tagline?: string;
  yearStart?: string;
  yearEnd?: string;
  firstDay?: string;
  familyCount?: number;
}
let settings: SettingsDoc | null = null;
try {
  settings = await sanityFetch<SettingsDoc | null>(SITE_SETTINGS_QUERY);
} catch {
  settings = null;
}

let liveFamilyCount = 0;
try {
  liveFamilyCount = await sanityFetch<number>(DIRECTORY_FAMILY_COUNT_QUERY);
} catch {
  liveFamilyCount = 0;
}
const familyCount = settings?.familyCount ?? liveFamilyCount;
---

<HubShell
  title={title}
  current="/family-hub"
  pageTitle="Family Hub — West Chester Preschool"
>
  <Section bg="grey" label="Family Hub home">
    <div class="space-y-8">
      <HubGreeting
        tagline={settings?.tagline || site.tagline}
        yearStart={settings?.yearStart}
        yearEnd={settings?.yearEnd}
        firstDay={settings?.firstDay}
        familyCount={familyCount}
      />

      <ClassHelperRow />

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <UpcomingEventsWidget />
        <AnnouncementsWidget />
        <FundraisingWidget />
        <MeetingMinutesWidget />
        <ClassPhotosWidget />
        <BudgetSnapshotWidget />
      </div>
    </div>
  </Section>

  {/* Editable welcome section(s) the Board can add to the hub landing. */}
  <SectionRenderer sections={doc?.sections} site={site} />
</HubShell>
```

Note: `HubShell`'s `title` prop still drives the mobile `HubTopBar` heading and the browser tab title, so it's kept ("Family Hub") but the navy title band's `intro` is intentionally omitted here — `HubGreeting` is the page's real hero and a second "welcome" line above it would be redundant (see the shell plan's Task 6 note on this exact tradeoff, which chose to keep passing `title` for the topbar while not over-explaining above the fold).

- [ ] **Step 2: Type-check + build**

Run: `cd site && npx astro check && npm run build`
Expected: 0 errors, `dist/` produced.

- [ ] **Step 3: Browser verification** (behavioral — real proof, per the shell plan's testing-reality note). Start the dev server and drive it in the Browser pane:

1. `preview_start` the dev server, open `/family-hub`.
2. Confirm the greeting renders ("Good morning/afternoon/evening, WCP family!") with today's date chip. Families/status chips and the progress bar are absent (siteSettings has none of the new fields set yet in dev) — confirm nothing renders broken/zero, just absent.
3. Confirm the four class cards render, each tinted (amber/green/orange/sky), and link to `/family-hub/twos`, `/family-hub/threes`, `/family-hub/pre-k-am`, `/family-hub/pre-k-pm`.
4. Confirm all six widget cards render in their empty states (no Sanity content wired for these queries in dev yet) with the exact empty-text strings from Tasks 5–7, each with the right icon, and no console errors.
5. `resize_window` to 320px: no horizontal scroll (`document.documentElement.scrollWidth <= innerWidth` via `javascript_tool`); widget grid stacks to one column; class row is 2-up.
6. Toggle dark mode: confirm the greeting card, chips, and widget cards are legible and on-brand.
7. In the Sanity Studio (`/studio`), temporarily set `siteSettings.firstDay` to a near-future date and `yearStart`/`yearEnd` spanning today, reload `/family-hub`, and confirm the countdown chip and progress bar now render with a sane percentage — then revert (or leave; these are meant to be filled in for real before launch).

- [ ] **Step 4: Commit**

```bash
git add site/src/pages/family-hub/index.astro
git commit -m "Hub: rebuild /family-hub as the dashboard (greeting, chips, class row, widgets)"
```

---

## Task 9: Extend `playwright.hub.config.ts` to cover the new spec

**Files:**
- Modify: `playwright.hub.config.ts`

The shell phase scoped `testMatch` to exactly `hub-shell.spec.ts`. Widen it so the new `hub-home.spec.ts` (Task 10) also runs under this SSR config.

- [ ] **Step 1: Update `testMatch`.** In `playwright.hub.config.ts`, replace:

```ts
  testMatch: 'hub-shell.spec.ts',
```

with:

```ts
  testMatch: /hub-(shell|home)\.spec\.ts$/,
```

- [ ] **Step 2: Verify + commit**

Run: `cd site && npx astro check`
Expected: 0 errors. (No behavioral check yet — `hub-home.spec.ts` doesn't exist until Task 10; this task only widens the glob.)

```bash
git add site/playwright.hub.config.ts
git commit -m "Test: widen playwright.hub.config.ts to also run hub-home.spec.ts"
```

---

## Task 10: `tests/hub-home.spec.ts` — SSR coverage for the dashboard

**Files:**
- Create: `tests/hub-home.spec.ts`

Same pattern as `tests/hub-shell.spec.ts`: real SSR page, `settle()` before measuring, axe in both themes, 320px reflow. Asserts the dashboard's structural pieces render, without depending on any Sanity content actually being present (matching what dev/CI will actually have).

- [ ] **Step 1: Create `tests/hub-home.spec.ts`:**

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settle } from './helpers';

test.describe('Family Hub home dashboard', () => {
  test('greeting, class row, and widgets render with no axe violations (light + dark)', async ({
    page,
  }) => {
    await page.goto('/family-hub', { waitUntil: 'load' });
    await settle(page);

    // Greeting hero.
    await expect(page.getByText(/^Good (morning|afternoon|evening), WCP family!$/)).toBeVisible();

    // Class helper row: all four class links.
    for (const href of [
      '/family-hub/twos',
      '/family-hub/threes',
      '/family-hub/pre-k-am',
      '/family-hub/pre-k-pm',
    ]) {
      await expect(page.locator(`a[href="${href}"]`).first()).toBeVisible();
    }

    // Widget grid: six cards by their titles.
    for (const title of [
      'Upcoming Events',
      'Announcements',
      'Fundraising',
      'Meeting Minutes',
      'Class Photos',
      'Budget Snapshot',
    ]) {
      await expect(page.getByRole('heading', { name: title, level: 3 })).toBeVisible();
    }

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
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/family-hub', { waitUntil: 'load' });
    await settle(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });
});
```

- [ ] **Step 2: Run it**

Run: `cd site && npm run test:hub`
Expected: PASS (this now runs both `hub-shell.spec.ts` and `hub-home.spec.ts`). If any axe violation surfaces, fix the flagged component (do not weaken the assertion — the shell phase caught two real contrast bugs this exact way, see the shell plan's Task 7 commit history).

- [ ] **Step 3: Commit**

```bash
git add site/tests/hub-home.spec.ts
git commit -m "Test: SSR Playwright spec for the Home dashboard (greeting, class row, widgets, a11y, 320px)"
```

---

## Task 11: Update the docs

**Files:**
- Modify: `docs/FAMILY_HUB.md`, `CLAUDE.md`, `src/sanity/guides/content.ts`

Per the repo's keep-docs-in-sync rule: this changes both what a volunteer edits (new `siteSettings` fields) and the codebase's shape (new widget components), so both the markdown and the in-Studio guide need updating.

- [ ] **Step 1:** In `site/docs/FAMILY_HUB.md`, extend the existing "## The hub shell" section (added in the shell plan) with a short paragraph: `/family-hub` (Home) is now the at-a-glance dashboard — `HubGreeting` (greeting, community chips, school-year progress bar), `ClassHelperRow` (the four class cards), and a grid of six `HomeWidgetCard`-based widgets (Upcoming Events, Announcements, Fundraising, Meeting Minutes, Class Photos, Budget Snapshot). Note that Class Photos and Budget Snapshot are intentionally empty-state-only until a photo-gallery and budget schema exist. Also document the four new `siteSettings` fields (`yearStart`, `yearEnd`, `firstDay`, `familyCount`) under a short "Home dashboard settings" note: what each drives, and that they're meant to be filled in manually in the Studio each year (no migration script).

- [ ] **Step 2:** In `site/CLAUDE.md`, add one gotcha to the existing Gotchas list: greeting/date logic on the hub home must use `toLocaleString(..., { timeZone: 'America/New_York' })`, never `Date#getHours()`/`getDate()` directly — the Cloudflare Workers runtime's `Date` methods are UTC with no local timezone data, so a naive `getHours()` produces the wrong "Good morning/afternoon/evening" for a chunk of the day. See `HubGreeting.astro` for the working pattern.

- [ ] **Step 3:** In `src/sanity/guides/content.ts`, find the Family Hub / Site Settings guide entry and add a short volunteer-facing note under the "School year" fields: fill in the school year's start date, end date, and first day of school each year — they power the countdown and progress bar on the Family Hub home page. Leave the family-count override blank unless the Directory undercounts (e.g. mid-migration).

- [ ] **Step 4: Verify + commit**

Run: `cd site && npx prettier --check docs/FAMILY_HUB.md CLAUDE.md src/sanity/guides/content.ts`
Expected: no formatting warnings (or run `--write` on any that fail before committing).

```bash
git add site/docs/FAMILY_HUB.md site/CLAUDE.md site/src/sanity/guides/content.ts
git commit -m "Docs: describe the Home dashboard, its widgets, and the new siteSettings school-year fields"
```

---

## Self-review

- **Spec coverage:** Greeting + tagline (Task 3) ✓; community chips — countdown, families, date (Task 3) ✓; school-year progress bar (Task 3) ✓; class helper-schedule row in class colors with playful icons (Task 4) ✓; all six named widgets, each answering what/where-from/empty-state (Tasks 5–7) ✓; new additive `siteSettings` fields, no PII (Task 1) ✓; families count derived with optional override (Task 1, Task 8) ✓; Home replaces the old quick-link grid entirely (Task 8) ✓; theme-aware light+dark, AA contrast, 320px reflow, Lighthouse-safe (every component uses existing AA-verified tokens; Task 10 automates the check) ✓; no emoji, SVG icons only (`Icon.astro` throughout) ✓; minimal client JS — this phase adds none (documented in Non-goals) ✓; docs updated (Task 11) ✓. **Deferred by design:** Phase 2 per-section reskins (separate later plan, per the spec's own phasing).
- **Placeholder scan:** No "TBD"/"handle X"/fabricated sample data. Class Photos and Budget Snapshot are explicitly empty-state-only with a stated reason (no schema exists), not a vague future promise — this is a scoping decision made during planning (see "Non-goals"), not an unfinished step.
- **Type/name consistency:** `HomeWidgetCard` props (`icon`, `title`, `seeAllHref`, `seeAllLabel`, `empty`, `emptyText`) match across every widget in Tasks 5–7. `classStyles(slug)` keys (`border`, `iconChip`) used in `ClassHelperRow` (Task 4) match the real `ClassStyles` interface read from `src/lib/class-colors.ts` during planning. `SITE_SETTINGS_QUERY`/`DIRECTORY_FAMILY_COUNT_QUERY` (Task 1) are the exact names imported in `index.astro` (Task 8). `siteSettings` field names (`yearStart`, `yearEnd`, `firstDay`, `familyCount`) match across the schema (Task 1), the query (Task 1), `HubGreeting`'s props (Task 3), and `index.astro`'s fetch (Task 8).

## Execution note

Two things confirmed while planning, not left as open questions:
1. **No new client JS.** The greeting/countdown is plain SSR text, not the existing `countdown.ts` ticker (that script is wired to the public `CountdownSection` page-builder section and stays there untouched).
2. **Timezone correctness** for the greeting and date math is handled via `Intl`/`toLocaleString` with an explicit `America/New_York` zone, not `Date` instance methods — verify this renders the expected greeting at different times of day during Task 8's browser verification (the Workers runtime is UTC by default).
