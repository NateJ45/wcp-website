// =============================================================================
// hub-doc-categories — ONE list for the Documents taxonomy (W1.5, 2026-08-31)
// =============================================================================
// The Studio dropdown (hubDocument.category) and the Documents page's grouping
// used to keep separate copies of this list, and the page DROPPED any document
// filed under a category it did not know. Now both read this file, the page
// renders unknown categories instead of losing them (titleized from the raw
// value), and adding a category is a one-line edit here.
// =============================================================================

export interface HubDocCategory {
  /** Stored value — never rename without a data migration. */
  value: string;
  /** Singular, for the Studio dropdown ("Required Form"). */
  title: string;
  /** Plural, for the page's section heading ("Required Forms"). */
  groupLabel: string;
  /** The row's action-link label. */
  action: string;
}

export const HUB_DOC_CATEGORIES: HubDocCategory[] = [
  { value: 'required', title: 'Required Form', groupLabel: 'Required Forms', action: 'Open form' },
  {
    value: 'handbook',
    title: 'Handbook & Policy',
    groupLabel: 'Handbooks & Policies',
    action: 'Open document',
  },
  {
    value: 'orient',
    title: 'Orientation Material',
    groupLabel: 'Orientation Materials',
    action: 'View',
  },
  {
    value: 'minutes',
    title: 'Meeting Minutes',
    groupLabel: 'Meeting Minutes',
    action: 'Open document',
  },
  // A catch-all so the Board can file something new TODAY; give it a real
  // category here when a pattern emerges.
  { value: 'other', title: 'Other Document', groupLabel: 'Other Documents', action: 'Open' },
];

/** A presentable label for a category value this list has never heard of —
 *  documents are never dropped for being filed somewhere new. */
export const titleizeCategory = (value: string): string =>
  value.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Group order for the page: the registry's order first, then any unknown
 * categories present in the data, in first-seen order.
 */
export function orderedCategories(present: string[]): string[] {
  const known = HUB_DOC_CATEGORIES.map((c) => c.value).filter((v) => present.includes(v));
  const unknown = [...new Set(present)].filter(
    (v) => v && !HUB_DOC_CATEGORIES.some((c) => c.value === v),
  );
  return [...known, ...unknown];
}

export const categoryFor = (value: string): HubDocCategory | undefined =>
  HUB_DOC_CATEGORIES.find((c) => c.value === value);

/** "four" for 4 — the Required Forms intro derives its count instead of
 *  hardcoding it ("Ohio state licensing requires these four…"). */
export function countWord(n: number): string {
  const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  return words[n] ?? String(n);
}
