// =============================================================================
// Hub live-data links — fallbacks for the Board-editable Sanity fields
// =============================================================================
// The Family Hub dashboard reads live content from three school-run sources:
//   1. Google Photos albums (per class + the school-wide Summer Playdates)
//   2. Google Sheets helper schedules (one per class)
//   3. The treasurer's Budget Google Sheet (Budget + Fundraising tabs)
//   4. A Google Apps Script that serves the school Google Calendar as JSON
//
// The EDITABLE sources of truth live in Sanity (class docs: `photoAlbumUrl`,
// `helperScheduleUrl`; siteSettings: `summerAlbumUrl`, `budgetSheetId`,
// `calendarFeedUrl`) so the Board can rotate links each year in the Studio.
// The values below are the current, working links (carried over from the old
// Squarespace hub, verified 2026-05-14) used per field when Sanity is blank
// or unreachable — same fallback pattern as documents.ts / coop-roles.ts.
// None of this is family PII; they are school-owned, share-by-link resources
// that only render behind the hub gate.
// =============================================================================

/** Per-class Google Photos album (this school year). Keyed by class slug. */
export const photoAlbumFallback: Record<string, string> = {
  twos: 'https://photos.app.goo.gl/***REMOVED***',
  threes: 'https://photos.app.goo.gl/***REMOVED***',
  'pre-k-am': 'https://photos.app.goo.gl/***REMOVED***',
  'pre-k-pm': 'https://photos.app.goo.gl/***REMOVED***',
};

/** School-wide Summer Playdates album. */
export const summerAlbumFallback = 'https://photos.app.goo.gl/***REMOVED***';

/** Per-class helper-schedule Google Sheet. Keyed by class slug. */
export const helperScheduleFallback: Record<string, string> = {
  twos: 'https://docs.google.com/spreadsheets/d/***REMOVED***/edit?usp=sharing',
  threes:
    'https://docs.google.com/spreadsheets/d/***REMOVED***/edit?usp=sharing',
  'pre-k-am':
    'https://docs.google.com/spreadsheets/d/***REMOVED***/edit?usp=sharing',
  'pre-k-pm':
    'https://docs.google.com/spreadsheets/d/***REMOVED***/edit?usp=sharing',
};

/** The treasurer's Budget Google Sheet (tabs: "Budget", "Fundraising"). */
export const budgetSheetIdFallback = '***REMOVED***';

/** Apps Script endpoint serving the school Google Calendar as JSON
 *  (rolling 12 months; deployed 2026-05-05). */
export const calendarFeedUrlFallback =
  'https://script.google.com/macros/s/***REMOVED***/exec';

/** Grand totals from finished school years — the old site's "What We Have
 *  Raised Together" band, now on the hub Fundraising page. Editable on
 *  Site Settings → School year (`pastFundraisingTotals`), newest first. */
export const pastFundraisingTotalsFallback: { yearLabel: string; amount: number }[] = [
  { yearLabel: '2025-26', amount: 4450 },
  { yearLabel: '2024-25', amount: 6653 },
];
