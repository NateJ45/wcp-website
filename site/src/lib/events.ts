// =============================================================================
// Events helpers — display + "add to calendar"
// =============================================================================
// The school is one location in southwest Ohio (Eastern Time). Sanity stores
// datetimes in UTC; we render them in the school's zone so "6:00 PM" shows as
// 6:00 PM regardless of where the visitor is.
// =============================================================================

export const EVENT_TZ = 'America/New_York';

export interface EventDoc {
  _id?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  allDay?: boolean;
  location?: string;
  category?: string;
  description?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  /** 'none' | 'weekly' | 'monthly' — how the event repeats (default one-time). */
  recurrence?: string;
  /** Repeat until this date (YYYY-MM-DD); blank = a sensible cap. */
  recurrenceEnd?: string;
  /** A saved reusable location (a second campus, a field-trip spot). */
  venue?: { name?: string; address?: string; note?: string } | null;
}

/** The place to display for an event: a saved venue, its typed location, or ''. */
export function eventPlace(e: EventDoc, fallbackLocation = ''): string {
  if (e.venue?.name) {
    return e.venue.address ? `${e.venue.name} · ${e.venue.address.split('\n')[0]}` : e.venue.name;
  }
  return e.location || fallbackLocation;
}

/** The address string to hand Google Calendar (venue address, typed, or fallback). */
export function eventAddress(e: EventDoc, fallbackLocation = ''): string {
  return e.venue?.address || e.venue?.name || e.location || fallbackLocation;
}

// How many upcoming occurrences of one recurring event we ever surface, and a
// hard walk cap so a far-future "repeat until" can't loop unbounded.
const RECUR_MAX_OCCURRENCES = 8;
const RECUR_WALK_CAP = 520; // ~10 years of weeks

function occurrenceStart(startMs: number, recurrence: string, i: number): number {
  if (recurrence === 'weekly') return startMs + i * 7 * 86_400_000;
  // monthly: step whole months, keeping the time-of-day (UTC).
  const d = new Date(startMs);
  d.setUTCMonth(d.getUTCMonth() + i);
  return d.getTime();
}

/**
 * Expand recurring events into their upcoming occurrences. One-time events
 * (no recurrence, or 'none') pass through unchanged. A weekly/monthly event
 * becomes up to RECUR_MAX_OCCURRENCES future occurrences (each a plain,
 * one-time EventDoc with shifted dates and a unique _id), stopping at
 * `recurrenceEnd`. The result is re-sorted soonest-first.
 *
 * `now` is injectable for tests. Times are handled in ms (UTC), which is DST-
 * safe for weekly stepping and close enough for monthly.
 */
export function expandRecurring(events: EventDoc[], now: Date = new Date()): EventDoc[] {
  const nowMs = now.getTime();
  const out: EventDoc[] = [];

  for (const e of events) {
    const rec = e.recurrence;
    if (!rec || rec === 'none' || (rec !== 'weekly' && rec !== 'monthly') || !e.startDate) {
      out.push(e);
      continue;
    }
    const startMs = new Date(e.startDate).getTime();
    if (Number.isNaN(startMs)) {
      out.push(e);
      continue;
    }
    const durationMs = e.endDate ? new Date(e.endDate).getTime() - startMs : 0;
    const untilMs = e.recurrenceEnd ? new Date(`${e.recurrenceEnd}T23:59:59Z`).getTime() : Infinity;

    let emitted = 0;
    for (let i = 0; i < RECUR_WALK_CAP && emitted < RECUR_MAX_OCCURRENCES; i++) {
      const occStart = occurrenceStart(startMs, rec, i);
      if (occStart > untilMs) break;
      const occEnd = occStart + durationMs;
      const stillUpcoming = (durationMs ? occEnd : occStart) >= nowMs;
      if (!stillUpcoming) continue;
      out.push({
        ...e,
        _id: `${e._id ?? 'evt'}__${i}`,
        startDate: new Date(occStart).toISOString(),
        endDate: e.endDate ? new Date(occEnd).toISOString() : e.endDate,
        // Occurrences render as ordinary single events.
        recurrence: 'none',
        recurrenceEnd: undefined,
      });
      emitted++;
    }
  }

  return out.sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''));
}

export const EVENT_CATEGORY_LABELS: Record<string, string> = {
  openHouse: 'Open house',
  community: 'Community',
  fundraiser: 'Fundraiser',
  closure: 'Closure',
  other: 'Event',
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: EVENT_TZ,
  });
}
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: EVENT_TZ,
  });
}
const sameDay = (a: string, b: string) =>
  new Date(a).toLocaleDateString('en-US', { timeZone: EVENT_TZ }) ===
  new Date(b).toLocaleDateString('en-US', { timeZone: EVENT_TZ });

/** A human "when" line, e.g. "Sat, March 4, 2026, 6:00 – 7:30 PM". */
export function formatEventWhen(e: EventDoc): string {
  if (!e.startDate) return '';
  const start = e.startDate;
  if (e.allDay) {
    return e.endDate && !sameDay(start, e.endDate)
      ? `${fmtDate(start)} – ${fmtDate(e.endDate)}`
      : fmtDate(start);
  }
  if (e.endDate && sameDay(start, e.endDate)) {
    return `${fmtDate(start)}, ${fmtTime(start)} – ${fmtTime(e.endDate)}`;
  }
  if (e.endDate) {
    return `${fmtDate(start)}, ${fmtTime(start)} – ${fmtDate(e.endDate)}, ${fmtTime(e.endDate)}`;
  }
  return `${fmtDate(start)}, ${fmtTime(start)}`;
}

// Google Calendar template dates: UTC "YYYYMMDDTHHMMSSZ", or "YYYYMMDD" all-day.
function gcalStamp(iso: string, allDay: boolean): string {
  const d = new Date(iso);
  if (allDay) {
    return d.toISOString().slice(0, 10).replace(/-/g, '');
  }
  return d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

/**
 * An "Add to Google Calendar" template URL. Works for everyone with a Google
 * account and needs no server route. `fallbackLocation` is the school address,
 * used when the event has no location of its own.
 */
export function googleCalendarUrl(e: EventDoc, fallbackLocation = ''): string {
  if (!e.startDate) return '#';
  const start = e.startDate;
  const allDay = Boolean(e.allDay);
  // Google wants an end; default a timed event to +1h, an all-day to +1 day.
  const end =
    e.endDate ?? new Date(new Date(start).getTime() + (allDay ? 86400000 : 3600000)).toISOString();
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title ?? 'Event',
    dates: `${gcalStamp(start, allDay)}/${gcalStamp(end, allDay)}`,
    details: e.description ?? '',
    location: eventAddress(e, fallbackLocation),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
