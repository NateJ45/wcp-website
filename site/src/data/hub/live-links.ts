// =============================================================================
// Hub live-data links — fallbacks for the Board-editable Sanity fields
// =============================================================================
// The Family Hub dashboard reads live content from three school-run sources:
//   1. Google Photos albums (one per class)
//   2. Google Sheets helper schedules (one per class)
//   3. The treasurer's Budget Google Sheet (Budget + Fundraising tabs)
//   4. A Google Apps Script that serves the school Google Calendar as JSON
//
// The EDITABLE sources of truth live in Sanity (class docs: `photoAlbumUrl`,
// `helperScheduleUrl`; siteSettings: `budgetSheetId`, `calendarFeedUrl`) so the
// Board can rotate links each year in the Studio.
//
// SECURITY (2026-07-14): the literal fallback URLs were REDACTED from this file.
// They are "anyone with the link" Google resources (per-class photo albums of
// children, helper-schedule Sheets with parent names, the treasurer's budget
// Sheet, the calendar feed). This repo is PUBLIC, so hardcoding them disclosed
// working links to anyone reading the source. Set these values ONLY in the
// Studio; never paste a share-by-link URL back into a tracked file. When Sanity
// has no value the widget renders its designed empty state (see the consumers).
// Same policy applies to documents.ts. See CLAUDE.md "Secrets never get committed".
// =============================================================================

/** Per-class Google Photos album. REDACTED: set in Sanity (class `photoAlbumUrl`). */
export const photoAlbumFallback: Record<string, string> = {
  twos: '',
  threes: '',
  'pre-k-am': '',
  'pre-k-pm': '',
};

/** Per-class helper-schedule Sheet. REDACTED: set in Sanity (class `helperScheduleUrl`). */
export const helperScheduleFallback: Record<string, string> = {
  twos: '',
  threes: '',
  'pre-k-am': '',
  'pre-k-pm': '',
};

/** REMOVED 2026-09-06. Three teachers' numbers were committed here, in a PUBLIC
 *  repository, and two of them are personal mobiles rather than the school's
 *  published line. The comment that used to sit here reasoned they were "the
 *  teacher's OWN published contact ... already shown on the live hub" - true of
 *  the hub, which is gated, and not true of this repo or of the public Sanity
 *  dataset they were also sitting in.
 *
 *  They now live in the DIRECTORY KV namespace, read server-side behind the hub
 *  gate: src/lib/hub-teacher-phones.ts. There is deliberately NO committed
 *  fallback - a fallback is what put them here.
 *
 *  The git history of this file still contains them; removing them from HEAD
 *  does not remove them from a public repo's history. */

/** Treasurer's Budget Sheet ID. REDACTED: set in Sanity (hubSettings.budgetSheetId). */
export const budgetSheetIdFallback = '';

/** Fundraising goal for the store (the merch line in the approved 2026-27
 *  budget, $150). The live "Store Sales" card replaces the treasurer's manual
 *  "Shirt Sales" sheet row; this keeps the store's goal in the year total when
 *  that row is dropped, so removing it never lowers the $5,700 fundraising goal.
 *  Derived from the removed row's goal when present, falling back to this. */
export const storeSalesGoalFallback = 150;

/** The school Google Calendar's ID — the primary calendar of the school's
 *  contact account (from the old site's embed `cid`). Drives the calendar
 *  page's subscribe buttons + click-to-load embed. Board-editable on
 *  siteSettings (`googleCalendarId`). */
export const googleCalendarIdFallback = 'contact@westchesterpreschool.org';

/** Apps Script endpoint serving the school Google Calendar as JSON.
 *  REDACTED: set in Sanity (hubSettings.calendarFeedUrl). */
export const calendarFeedUrlFallback = '';

/** Grand totals from finished school years — the old site's "What We Have
 *  Raised Together" band, now on the hub Fundraising page. Editable on
 *  Hub settings → Each year (`pastFundraisingTotals`), newest first. */
export const pastFundraisingTotalsFallback: { yearLabel: string; amount: number }[] = [
  { yearLabel: '2025-26', amount: 4450 },
  { yearLabel: '2024-25', amount: 6653 },
];
