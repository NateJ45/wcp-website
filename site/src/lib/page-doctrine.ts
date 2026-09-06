// =============================================================================
// Page doctrine — code-owned per-page IA rules layered over the Sanity docs
// =============================================================================
// Born 2026-07-17 as the quota-freeze stopgap layer; the freeze lifted 2026-08-04
// and every content-shaped stopgap was persisted into the page docs and deleted
// from here (see docs/PENDING.md history). What remains is deliberately
// code-owned: render-time drops that reflect a product decision (not missing
// content), the Act II card-grid grammar, and the shared drop/hoist/insert
// pipeline that keeps the renderer and the footer seam in agreement.
// =============================================================================
import type { SectionData } from '@/components/sections/section-helpers';

/**
 * Pages exempt from the tour-first hero doctrine (PageHero synthesizes a
 * "Schedule a Tour" CTA + the proof line onto every CMS hero — see the Act II
 * conversion doctrine in CLAUDE.md). Legal and utility pages are not part of
 * the funnel: star ratings and a tour button on the Terms of Use read as a
 * sales pitch stapled to the fine print (Nathan, 2026-08-17). Their heroes
 * render exactly what the Studio stores — for these pages, nothing.
 */
export const TOUR_EXEMPT_PAGES = new Set(['privacy', 'terms', 'accessibility']);

/** Hero field overrides. Empty since the 2026-08-04 close-out — the mechanism
 *  stays for the next time a page's hero needs a code-side call before its
 *  Sanity edit can land. Register any new entry in docs/PENDING.md. */
export const HERO_OVERRIDES: Record<
  string,
  { title?: string; accentWord?: string; lead?: string }
> = {};

/** Sections (by _key) hoisted to the FRONT of a page, in the given order.
 *  Empty since 2026-08-04 (the visit/tuition/enroll hoists are stored order
 *  now). Mechanism kept; register new entries in docs/PENDING.md. */
export const SECTION_HOIST: Record<string, string[]> = {};

/** Sections (by _key, or 'type:<sectionType>') REMOVED from a page's render.
 *  These are PRODUCT decisions, not stopgaps: the content stays in the Studio
 *  on purpose so restoring it is deleting a key here. */
export const SECTION_DROP: Record<string, string[]> = {
  // hp-visit: VisitBlock (photo-moments 'visit') replaces the stored prose so
  // the visit details get their photo back — a proseSection has no image slot.
  // Close-out: patch-home-visit-splitmedia.mjs, blocked on a human choosing
  // PHOTO_PATH (docs/PENDING.md).
  // k20 (Latest from WCP) is OFF the home page by Nathan's call 2026-07-19:
  // two posts is not a news habit yet, and a thin blog teaser between the
  // testimonials and the Instagram wall reads as an unfinished section. The
  // /news routes, the post docs and the RSS feed all stay live and reachable;
  // only the home teaser and the footer nav entry are hidden, so restoring it
  // is deleting this key. Also dropped from the footer nav in src/data/nav.ts.
  home: ['hp-visit', 'k20'],
};

/** Synthetic sections appended to a page (rendered by the normal bridges).
 *  Empty since 2026-08-04 (the visit contact details and the reviews closer are
 *  stored sections now). Mechanism kept for the pipeline below. */
export const SECTION_APPEND: Record<string, SectionData[]> = {};

/** Synthetic sections spliced in AFTER a named section (by _key), applied
 *  after drops/hoists so the anchor is the final order. Empty since 2026-08-04
 *  (the tuition calculator and the a-day class cards are stored sections). */
export const SECTION_INSERT_AFTER: Record<string, Record<string, SectionData[]>> = {};

// Act II grammar: cardGridSections render as the ruled "sign-up sheet" list by
// default on public pages (the icon-card grid was the site's loudest AI tell,
// 40+ instances). A grid earns REAL cards back only by page + section _key,
// decided during the route walks (e.g. month/tradition grids whose chips and
// colors do compositional work). Applied by SectionRenderer as a data-cards
// attribute the grammar CSS reads.
export const CARDGRID_KEEP_CARDS: Record<string, string[]> = {
  // The "year full of things" month/tradition grids: month chips + per-card
  // color edges do real compositional work (route-walk call, 2026-07-18).
  'why-wcp': ['k198'],
  'co-op-life': ['k157'],
};

/**
 * MAGIC-KEY TRIPWIRE (W3, 2026-08-31). The keys above are hand-written Sanity
 * section `_key`s: if a volunteer deletes and re-adds one of those sections,
 * the key changes and the special treatment silently stops. This makes it
 * LOUD at build time instead — the deploy log names the page and the missing
 * key, so the fix (update the key here) is a one-line diagnosis rather than a
 * mystery layout regression.
 */
export function warnMissingDoctrineKeys(
  pageSlug: string | undefined,
  sections: { _key?: string }[],
): void {
  if (!pageSlug) return;
  const wanted = CARDGRID_KEEP_CARDS[pageSlug];
  if (!wanted?.length) return;
  const present = new Set(sections.map((s) => s._key));
  for (const key of wanted) {
    if (!present.has(key)) {
      console.warn(
        `[page-doctrine] ${pageSlug}: section _key "${key}" (CARDGRID_KEEP_CARDS) is gone — ` +
          'the special card treatment no longer applies. If the section was re-created, ' +
          'update the key in src/lib/page-doctrine.ts.',
      );
    }
  }
}

import { effectiveBg } from '@/components/sections/section-helpers';

/**
 * Apply the page doctrine to a section list, in the SAME ORDER SectionRenderer
 * does: drop, hoist, insert-after, append.
 *
 * This exists because it did NOT exist, and the two drifted. `finalBandBg`
 * used to re-implement a partial version of the pipeline — drops and appends
 * only — so any page whose doctrine HOISTED or INSERTED a section disagreed
 * with the renderer about which band actually ends the page. /enroll hoists
 * `seed-enroll-steps` to the front, which changes what lands last, so the
 * footer seam painted grey against a cream band: a visibly wrong wedge of
 * colour at the footer boundary (Nathan, 2026-07-20).
 *
 * Any future doctrine step belongs HERE, so the renderer and the seam cannot
 * disagree again. tests/seams.spec.ts asserts they agree on every route.
 */
export function applyDoctrine(rawSections: SectionData[], pageSlug: string): SectionData[] {
  let sections = [...rawSections];

  const dropKeys = SECTION_DROP[pageSlug] ?? [];
  if (dropKeys.length > 0) {
    sections = sections.filter(
      (s) => !dropKeys.includes(s._key) && !dropKeys.includes(`type:${s._type}`),
    );
  }

  const hoistKeys = SECTION_HOIST[pageSlug] ?? [];
  if (hoistKeys.length > 0) {
    const hoisted = hoistKeys
      .map((k) => sections.find((s) => s._key === k))
      .filter((s): s is SectionData => Boolean(s));
    sections = [...hoisted, ...sections.filter((s) => !hoistKeys.includes(s._key))];
  }

  const inserts = SECTION_INSERT_AFTER[pageSlug];
  if (inserts) {
    for (const [afterKey, extra] of Object.entries(inserts)) {
      const at = sections.findIndex((s) => s._key === afterKey);
      if (at !== -1) sections = [...sections.slice(0, at + 1), ...extra, ...sections.slice(at + 1)];
    }
  }

  return [...sections, ...(SECTION_APPEND[pageSlug] ?? [])];
}

// The footer seam fills with the FINAL band's color (the sweep at the footer
// boundary works exactly like every section seam: the band above bulges into
// the footer's photo treatment). Runs the SAME doctrine pipeline the renderer
// does, plus the amber-closer rule, so the fill always matches what actually
// rendered last.
export function finalBandBg(rawSections: SectionData[], pageSlug: string): string {
  const sections = applyDoctrine(rawSections, pageSlug);
  const bands = sections.filter((s) => s._type !== 'noticeBarSection');
  const last = bands[bands.length - 1];
  if (!last) return 'white';
  let bg = effectiveBg(last);
  // Mirror the renderer's navy-adjacency recolor: a non-closer navy band that
  // follows another navy renders white.
  const prev = bands[bands.length - 2];
  if (bg === 'navy' && last._type !== 'ctaSection' && prev && effectiveBg(prev) === 'navy') {
    bg = 'white';
  }
  return bg;
}
