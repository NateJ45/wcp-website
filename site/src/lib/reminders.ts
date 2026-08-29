// =============================================================================
// Reminders — the board "what needs doing / what's coming up" engine
// =============================================================================
// Pure logic shared by the token-protected /api/reminders feed (emailed to the
// board by a daily Apps Script trigger — Workers can't send email on the free
// tier, so the Google side mails it, same as the digest) and the Checkup Studio
// tool's "Coming up" section. Callers do the Sanity reads and hand the raw
// primitives in; this module just classifies and phrases, so the date math is
// unit-tested with no I/O. Two kinds: "attention" (overdue / left-on problems)
// and "upcoming" (deadlines inside the horizon).
// =============================================================================

export interface UpcomingItem {
  title: string;
  /** ISO date ("YYYY-MM-DD") or full datetime. */
  date: string;
}

export interface ReminderState {
  /** Current time in ms (injected so the logic stays pure/testable). */
  now: number;
  bannerOn: boolean;
  expiredAnnouncements: number;
  /** Hub spotlight pop-ups past their end date but still switched on. */
  expiredSpotlights: number;
  oldUnanswered: number;
  drafts: number;
  enrollmentDeadline?: string | null;
  upcomingEvents: UpcomingItem[];
  closingSheets: UpcomingItem[];
}

export interface Reminder {
  id: string;
  kind: 'attention' | 'upcoming';
  title: string;
  detail: string;
}

const DAY_MS = 86_400_000;

/**
 * Whole days from `now` until a date. Date-only strings ("YYYY-MM-DD") are
 * anchored to noon UTC first (the codebase-wide rule) so an all-day deadline
 * isn't read a day early in Eastern time. Past dates return a negative number;
 * today returns 0. NaN input returns NaN (callers guard).
 */
export function daysUntil(dateStr: string, nowMs: number): number {
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? `${dateStr}T12:00:00Z` : dateStr;
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return NaN;
  // Compare calendar days: floor both to their UTC-noon day boundary.
  return Math.round((target - nowMs) / DAY_MS);
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/**
 * Build the board's reminder list. `horizonDays` bounds how far ahead an
 * "upcoming" item counts (default two weeks). Attention items always show;
 * upcoming items show only when they fall within [0, horizonDays].
 */
export function computeReminders(state: ReminderState, horizonDays = 14): Reminder[] {
  const out: Reminder[] = [];

  // ---- Needs attention now -------------------------------------------------
  if (state.bannerOn) {
    out.push({
      id: 'banner-on',
      kind: 'attention',
      title: 'The alert banner is on',
      detail: 'A site-wide banner is showing. Turn it off if the notice is over.',
    });
  }
  if (state.expiredAnnouncements > 0) {
    const n = state.expiredAnnouncements;
    out.push({
      id: 'expired-announcements',
      kind: 'attention',
      title: `${n} ${plural(n, 'announcement is', 'announcements are')} past their end date`,
      detail: 'They are still switched on. Turn them off or clear the end date.',
    });
  }
  if (state.expiredSpotlights > 0) {
    const n = state.expiredSpotlights;
    out.push({
      id: 'expired-spotlights',
      kind: 'attention',
      title: `${n} spotlight ${plural(n, 'pop-up is', 'pop-ups are')} past their end date`,
      detail: 'They are still switched on. Turn them off or clear the end date.',
    });
  }
  if (state.oldUnanswered > 0) {
    const n = state.oldUnanswered;
    out.push({
      id: 'old-messages',
      kind: 'attention',
      title: `${n} form ${plural(n, 'message has', 'messages have')} gone unanswered for over a week`,
      detail: 'Reply and mark them handled, or clear them with the Clean up tool.',
    });
  }
  if (state.drafts > 0) {
    const n = state.drafts;
    out.push({
      id: 'drafts',
      kind: 'attention',
      title: `${n} unpublished ${plural(n, 'draft is', 'drafts are')} waiting`,
      detail: 'Edits saved but never published. Open each and Publish, or discard it.',
    });
  }

  // ---- Coming up -----------------------------------------------------------
  const soon = (dateStr: string) => {
    const d = daysUntil(dateStr, state.now);
    return Number.isFinite(d) && d >= 0 && d <= horizonDays ? d : null;
  };
  const when = (d: number) => (d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`);

  if (state.enrollmentDeadline) {
    const d = soon(state.enrollmentDeadline);
    if (d !== null) {
      out.push({
        id: 'enrollment-deadline',
        kind: 'upcoming',
        title: `Enrollment deadline is ${when(d)}`,
        detail: 'Make sure the enrollment banner and any reminders are up to date.',
      });
    }
  }

  for (const ev of state.upcomingEvents) {
    const d = soon(ev.date);
    if (d !== null) {
      out.push({
        id: `event-${ev.title}-${ev.date}`,
        kind: 'upcoming',
        title: `${ev.title} is ${when(d)}`,
        detail: 'Check anything that needs prep, sign-ups, or a reminder to families.',
      });
    }
  }

  for (const sheet of state.closingSheets) {
    const d = soon(sheet.date);
    if (d !== null) {
      out.push({
        id: `sheet-${sheet.title}-${sheet.date}`,
        kind: 'upcoming',
        title: `Sign-up "${sheet.title}" is ${when(d)}`,
        detail: 'Nudge families if slots are still open, then close the sheet afterwards.',
      });
    }
  }

  return out;
}
