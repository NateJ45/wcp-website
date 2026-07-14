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

/** Treasurer's Budget Sheet ID. REDACTED: set in Sanity (siteSettings.budgetSheetId). */
export const budgetSheetIdFallback = '';

/** The school Google Calendar's ID — the primary calendar of the school's
 *  contact account (from the old site's embed `cid`). Drives the calendar
 *  page's subscribe buttons + click-to-load embed. Board-editable on
 *  siteSettings (`googleCalendarId`). */
export const googleCalendarIdFallback = 'contact@westchesterpreschool.org';

/** Apps Script endpoint serving the school Google Calendar as JSON.
 *  REDACTED: set in Sanity (siteSettings.calendarFeedUrl). */
export const calendarFeedUrlFallback = '';

/** Grand totals from finished school years — the old site's "What We Have
 *  Raised Together" band, now on the hub Fundraising page. Editable on
 *  Site Settings → School year (`pastFundraisingTotals`), newest first. */
export const pastFundraisingTotalsFallback: { yearLabel: string; amount: number }[] = [
  { yearLabel: '2025-26', amount: 4450 },
  { yearLabel: '2024-25', amount: 6653 },
];
