// =============================================================================
// hub-widgets — which built-in tiles a hub page has, and which are switched off
// =============================================================================
// "Options for the widgets, like on/off buttons" (2026-08-30). The hub home is
// a bento dashboard of code-owned tiles; the Board can now switch individual
// tiles off from the Hub home document (Studio → Family Hub → Pages → Hub
// home → Widgets) without a developer. The rules live here, pure and
// unit-tested, shared by:
//
//   - the Studio input (src/sanity/components/HubWidgetToggles.tsx), which
//     renders one switch per entry below,
//   - the page (src/pages/family-hub/index.astro), which skips a tile whose
//     value is stored in the doc's `hiddenWidgets`,
//   - and the drift gate in hub-widgets.test.ts, which pins that every value
//     listed here is actually honored by the page source.
//
// STORAGE IS THE HIDDEN SET, NOT THE SHOWN SET, on purpose: an empty (or
// missing) array means "everything on", so every existing document — and every
// future widget added to this list — defaults to shown without a migration.
//
// The greeting card is deliberately absent: it owns the page's <h1> and the
// tour/note chips, so the page stops being a page without it.
// =============================================================================

import { splitStega } from './preview-stega';

export interface HubWidgetOption {
  /** Stable stored value — never rename one without a data migration. */
  value: string;
  /** The Board-facing switch label. */
  title: string;
}

/** Keyed by the hubPage doc's `hubKey`. Only pages listed here show the
 *  Widgets switches in the Studio; today that is the hub home, where the
 *  dashboard lives. Add a page's tiles here when it grows options. */
export const HUB_WIDGETS_BY_KEY: Record<string, HubWidgetOption[]> = {
  home: [
    { value: 'events', title: 'Upcoming events' },
    { value: 'classTiles', title: 'Class helper-schedule tiles' },
    { value: 'weather', title: 'Weather for the week' },
    { value: 'announcements', title: 'Announcements' },
    { value: 'fundraising', title: 'Fundraising progress' },
    { value: 'minutes', title: 'Meeting minutes' },
    { value: 'photos', title: 'Class photos' },
    { value: 'budget', title: 'Budget snapshot' },
    { value: 'superHelper', title: 'Become a Super Helper band' },
    { value: 'handbook', title: 'Family handbook card' },
    { value: 'store', title: 'School store' },
    { value: 'social', title: 'Community bulletin board' },
  ],
};

/** The switches a given hubPage document gets (none → the field hides). */
export function widgetOptionsFor(hubKey: string | undefined): HubWidgetOption[] {
  return (hubKey && HUB_WIDGETS_BY_KEY[hubKey]) || [];
}

/**
 * The stored array → a Set the page can ask cheaply. Unknown values are kept
 * (harmless), missing/empty input means nothing is hidden. `shows` is the
 * page-side question: "is this tile still on?"
 */
export function hiddenWidgetSet(stored: unknown): Set<string> {
  if (!Array.isArray(stored)) return new Set();
  return new Set(
    stored
      .filter((v): v is string => typeof v === 'string')
      // Belt and braces against stega (the draft-aware preview read encodes
      // invisible markers into strings, and an encoded 'weather' matches
      // nothing): keep only the visible characters. The preview client also
      // excludes this field at the source (cms-preview.ts NON_STEGA_FIELDS).
      .map((v) => splitStega(v).cleaned),
  );
}

export const shows = (hidden: Set<string>, widget: string): boolean => !hidden.has(widget);
