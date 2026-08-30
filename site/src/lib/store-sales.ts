// =============================================================================
// store-sales — which treasurer-sheet row is the store, and the store facts
// =============================================================================
// The fundraising page and the home Fundraising widget find store revenue by
// matching a ROW NAME in the treasurer's tracking sheet. That name used to be
// a code regex (/(shirt|store) sales/i) — rename the row and revenue silently
// double-counted. The Board now names the row in the Studio (Merch store card
// → "Treasurer-sheet row name"); these helpers keep the matching rules pure
// and unit-tested, with the shipped name as the fallback.
// =============================================================================

export const STORE_SALES_ROW_FALLBACK = 'Shirt Sales';

/** Case-insensitive containment match against a sheet row label ("Shirt
 *  Sales (Fall)" still matches "Shirt Sales"). The stored name matches
 *  itself plus the legacy "store sales" spelling, so renaming the Studio
 *  field never orphans an old sheet. */
export function isStoreSalesRow(rowLabel: string | undefined, storedName?: string | null): boolean {
  const label = (rowLabel ?? '').trim().toLowerCase();
  if (!label) return false;
  const names = [storedName?.trim() || STORE_SALES_ROW_FALLBACK, 'store sales'];
  return names.some((n) => n && label.includes(n.toLowerCase()));
}
