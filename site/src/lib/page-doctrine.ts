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
};

/** Synthetic sections appended to a page (rendered by the normal bridges). */
export const SECTION_APPEND: Record<string, SectionData[]> = {
  // Visit-page assembly: contact details join the tour page so "how do I
  // reach you" lives where visitors act (the /contact merge persists this).
  'virtual-tour': [
    { _type: 'contactDetailsSection', _key: 'code-visit-contact', background: 'grey' },
  ],
};
