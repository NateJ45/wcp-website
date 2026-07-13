# Site-wide announcements (bars + popups) — design

**Date:** 2026-07-13 · **Status:** approved

## Goal

Let the volunteer board create multiple pre-built, toggleable, customizable
announcement **bars** and **popups** on the public site (waitlist status, open
house, fundraiser push, welcome, etc.), each turned on/off and optionally
scheduled by date. Replaces the "call the developer to add a banner" gap; the
existing one-off snow-day **Alert banner** (`closureAlert`) stays separate.

## Decisions (from brainstorming)

- **Scope:** public marketing site only (the Family Hub has its own note/update system).
- **Multiple bars:** stack all enabled bars, ordered by a priority number; each independently dismissible.
- **Scheduling:** optional `showFrom` / `showUntil` datetimes, plus a manual `enabled` toggle.
- **Waitlist bar:** auto-composes its message from the live class-availability data (the same `/api/availability` source that powers the class-card badges), falling back to a typed message.
- **Popups:** one at a time (top priority), frequency-capped in the browser.
- **Targeting:** default every page; optional "only these pages" / "except these pages".
- **Alert banner (`closureAlert`) unchanged** — urgent snow-day path, always renders on top.

## Data model

New `announcement` document (collection). Nav: **Everyday edits → Announcements**.

Fields, by group:

- **What it says:** `title` (internal, required), `format` (`bar` | `popup`),
  `template` (enum, drives defaults + which fields matter: `custom`, `waitlist`,
  `event`, `fundraiser`, `notice`, `welcome`), `message` (string; optional for
  `waitlist`), `tone` (`info`/`good`/`warning`/`urgent`/`brand`, AA-safe pairs),
  `icon` (validated dropdown), `linkLabel` + `linkType` (`page`|`url`) + `page`
  ref / `url`.
- **When it shows:** `enabled` (bool), `showFrom` (datetime, optional),
  `showUntil` (datetime, optional), `priority` (number; lower = higher).
- **Where it shows:** `placement` (`all` | `only` | `except`) + `pages` (array of
  page refs, shown unless `all`).
- **Popup settings** (hidden unless `format == popup`): `frequency`
  (`once` | `session` | `always`), `version` (string stamp to re-show),
  `image`, `buttonLabel`.

**Pre-built types** = Sanity initial-value templates (the "＋ New" menu):
Open-house bar, Waitlist bar, Fundraiser bar, General notice bar, Welcome popup,
Event popup, Blank — each pre-fills format/template/tone/icon/placeholder copy.

Add `format`, `template`, `tone`, `placement`, `linkType` to `NON_STEGA_FIELDS`
(they drive rendering logic; stega would corrupt the branch).

## Rendering

- **Query** (build time, `cms.ts`): `*[_type == "announcement" && enabled == true]`
  with all fields + `page->slug` deref for the CTA and placement refs.
- **Bars:** `AnnouncementBars.astro`, rendered in `BaseLayout` **below**
  `ClosureBanner`, public pages only. Server-side: render each bar that is
  in-window **now** at build (no-JS safe) AND matches the current path's
  placement; emit `data-from`/`data-until` so a client script
  (`announcement-bars.ts`) re-evaluates the window on load (bars cross
  boundaries between rebuilds) and wires per-id dismiss
  (`localStorage` key `wcp-ann-<id>-<version|hash>`). Reuse `ClosureBanner`'s
  theme-stable tone pairs.
- **Waitlist bar:** a pure `waitlistMessage(items, fallback)` composes e.g.
  "Now enrolling — Threes & Pre-K open, Twos waitlist" from
  `ClassAvailability[]` using `classLabel()`. Build-time uses the last known/
  fallback text; `announcement-bars.ts` refetches `/api/availability` and
  rewrites the bar text so it's current without a rebuild. Fallback message
  shows if the sheet is unset or the fetch fails.
- **Popups:** `AnnouncementModal.astro`, top-priority in-window enabled popup on
  matching pages. `announcement-modal.ts` handles frequency-capped show/dismiss
  (`once` = per visitor, `session` = per tab session, `always` = every load),
  keyed by id+version, following `note-modal.ts`. Accessible dialog (focus trap,
  Esc, backdrop). No-JS: no popup (bars still work).

## In-window logic (pure, tested)

`isInWindow(now, showFrom?, showUntil?)` → boolean. Bars/popups filtered by it
at build and re-checked client-side. Unit-tested with fixed `now`.

## Testing

- Vitest: `isInWindow` edge cases, `waitlistMessage` composition.
- Playwright: home renders an active bar, it's dismissible, axe passes (light+dark).
- `sanity schema validate` (both workspaces) + Studio runtime boot check.

## Out of scope (v1)

Hub announcements (public only), A/B testing, analytics on dismissals, rich-text
in bars (single line + one CTA is the on-brand constraint).
