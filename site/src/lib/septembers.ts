// =============================================================================
// septembers — the heritage math, derived instead of hand-typed (2026-08-31)
// =============================================================================
// The Septembers wall and the home heritage strip used to hardcode the current
// fall ("THIS_FALL = 2026", "Fifty-five Septembers.", "2026: your kid here?"),
// which meant the site's signature moment silently went stale every autumn.
// Now both derive from Site settings' school-year start date (the field the
// Board already updates each year per the Start-of-year ritual) with a
// build-date heuristic as the fallback, and the headline count comes from
// `site.founded`. Pure and unit-tested; the components just render.
// =============================================================================

/**
 * The fall year of the CURRENT school year: the year of Site settings'
 * `yearStart` when set (the Board's yearly edit), else a build-date heuristic
 * — from June onward the coming/ongoing fall is this calendar year, before
 * June it is the school year that started last fall.
 */
export function fallYear(yearStartIso: string | undefined | null, now: Date): number {
  const parsed = Date.parse(yearStartIso ?? '');
  if (Number.isFinite(parsed)) return new Date(parsed).getUTCFullYear();
  const m = now.getUTCMonth(); // 0-based
  return m >= 5 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

/** How many Septembers are ON the wall: every fall from founding up to (not
 *  including) the current one — the current fall is the invitation frame. */
export function septembersOnWall(founded: number, fall: number): number {
  return Math.max(0, fall - founded);
}

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

/** "Fifty-seven" for 57 — the heritage headline's number, capitalized. Falls
 *  back to digits past 199 (a problem for the year 2168's board). */
export function countWordTitle(n: number): string {
  if (n < 20) return ONES[n] || String(n);
  if (n < 100) {
    const tens = TENS[Math.floor(n / 10)];
    const ones = n % 10;
    return ones ? `${tens}-${ONES[ones].toLowerCase()}` : tens;
  }
  if (n < 200) {
    const rest = n - 100;
    return rest ? `One hundred ${countWordTitle(rest).toLowerCase()}` : 'One hundred';
  }
  return String(n);
}
