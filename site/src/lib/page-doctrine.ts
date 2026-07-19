// =============================================================================
// Page doctrine — code-owned per-page IA fixes that can't wait for the quota
// =============================================================================
// The IA redesign (2026-07-17) needs content-shaped changes while Sanity
// writes are frozen. This file holds the CODE-side layer: hero overrides,
// section reordering, and synthetic section injection, applied by
// [...slug].astro (hero) and SectionRenderer (sections) for PUBLIC pages only.
// Every entry that duplicates future Sanity content is a STOPGAP with a
// close-out registered in docs/PENDING.md (the matching patch scripts persist
// the same change into the docs, then these entries get deleted).
// =============================================================================
import type { SectionData } from '@/components/sections/section-helpers';

/** Hero field overrides (STOPGAP: content-in-code until the merge patches). */
export const HERO_OVERRIDES: Record<
  string,
  { title?: string; accentWord?: string; lead?: string }
> = {
  // The Visit page doctrine: /virtual-tour is becoming the merged "Visit Us"
  // page; until the content patch lands, the hero leads with the visit ask
  // instead of "take a look around" (the tour form is hoisted to the top by
  // SECTION_HOIST below).
  'virtual-tour': {
    title: 'Come see a morning.',
    accentWord: 'see',
    lead: 'Tours are casual and low-pressure, and kids are welcome. Walk the classrooms, meet the teachers, and ask us anything.',
  },
};

/** Sections (by _key) hoisted to the FRONT of a page, in the given order. */
export const SECTION_HOIST: Record<string, string[]> = {
  // The tour-request form was 7th of 8 sections on the page every tour CTA
  // lands on. Form first; the look-around content sells the visit below it.
  'virtual-tour': ['pp-tour-form'],
  // Money pages front-load the money (Phase 0: the first dollar figure painted
  // in mobile viewport FOUR on /tuition). The fee table rides directly under
  // the "Every fee, published" opener; the co-op explainer sells below it.
  tuition: ['k53'],
  // The tour-first step list leads /enroll (mirrors the queued
  // patch-enroll-consolidation script; see PENDING.md).
  enroll: ['seed-enroll-steps'],
};

/** Sections (by _key, or 'type:<sectionType>') REMOVED from a page's render.
 *  STOPGAPS mirroring queued Sanity patches (rows in docs/PENDING.md): the
 *  content stays untouched in the Studio; these hide it at render time the
 *  same way the fundraising statBand drop works on the hub. */
export const SECTION_DROP: Record<string, string[]> = {
  // /enroll ran TWO contradictory step lists (k219 "Enrolling takes three
  // steps" vs seed-enroll-steps "How enrolling works" — tour-first wins), a
  // full duplicate of the /tuition fee table (the class picker + tuition link
  // cover it), and a post-form "Not sure which class fits?" band that
  // re-routed people backward right after they acted.
  enroll: ['k219', 'pp-enroll-tuition', 'k234'],
  // Home: the stat-box band's numbers all live one band up in the class cards
  // ($70/mo etc.) and the heritage strip now owns that slot (photo-moments).
  home: ['type:statBandSection'],
};

/** Header text overrides by page + section _key (STOPGAP content-in-code,
 *  PENDING.md rows; visitor-facing copy follows the house voice rules). */
export const SECTION_HEADER_OVERRIDES: Record<
  string,
  Record<string, { title?: string; lead?: string; eyebrow?: string }>
> = {
  enroll: {
    // The enroll page's only action was titled "Ask about enrolling" and the
    // actual enrollment mechanism was never stated anywhere (Phase 0).
    'pp-enroll-form': {
      title: 'Start your enrollment',
      lead: 'Send this and we will reach out to set up your tour. You get the enrollment packet there, and we walk you through the rest.',
    },
  },
};

/** Synthetic sections appended to a page (rendered by the normal bridges). */
export const SECTION_APPEND: Record<string, SectionData[]> = {
  // Visit-page assembly: contact details join the tour page so "how do I
  // reach you" lives where visitors act (the /contact merge persists this).
  'virtual-tour': [
    { _type: 'contactDetailsSection', _key: 'code-visit-contact', background: 'grey' },
  ],
};

// Act II grammar: cardGridSections render as the ruled "sign-up sheet" list by
// default on public pages (the icon-card grid was the site's loudest AI tell,
// 40+ instances). A grid earns REAL cards back only by page + section _key,
// decided during the route walks (e.g. month/tradition grids whose chips and
// colors do compositional work). Applied by SectionRenderer as a data-cards
// attribute the grammar CSS reads.
export const CARDGRID_KEEP_CARDS: Record<string, string[]> = {};
