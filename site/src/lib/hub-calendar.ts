// =============================================================================
// Hub calendar feed — live events from the school Google Calendar
// =============================================================================
// A school-run Google Apps Script serves the Google Calendar as a JSON array
// of { title, start, allDay } covering a rolling 12 months. Erin/admins edit
// the calendar in Google; the hub picks changes up automatically — no
// duplicate data entry in Sanity. Fetched SERVER-SIDE behind the hub gate.
//
// Falls back to the Sanity `event` docs (the public Events page's source)
// when the feed is unreachable, so the widgets degrade gracefully:
// feed → Sanity events → designed empty state.
//
// DATE HANDLING (two gotchas, both bit the old site):
//   1. The Workers runtime Date is UTC — always format with EVENT_TZ.
//   2. All-day events arrive as date-only "YYYY-MM-DD". Parsing that with
//      `new Date(iso)` gives UTC midnight, which formats as the PREVIOUS day
//      in Eastern time. Anchor date-only strings to NOON UTC first — noon UTC
//      is 7/8am ET, so the calendar day survives the timezone conversion.
// =============================================================================
import { sanityFetch } from '@/lib/sanity';
import { cached } from '@/lib/hub-cache';
import { UPCOMING_EVENTS_QUERY } from '@/lib/queries';
import { EVENT_TZ, expandRecurring, type EventDoc } from '@/lib/events';

export interface HubEvent {
  title: string;
  /** ISO datetime, or date-only "YYYY-MM-DD" for all-day events. */
  start: string;
  allDay?: boolean;
  location?: string;
}

/** Parse feed/Sanity start strings safely (see DATE HANDLING above). */
export function eventDate(start: string): Date {
  return start.length === 10 ? new Date(`${start}T12:00:00Z`) : new Date(start);
}

const fmtOpts = (opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormatOptions => ({
  ...opts,
  timeZone: EVENT_TZ,
});

export const fmtEventMonth = (e: HubEvent) =>
  eventDate(e.start).toLocaleDateString('en-US', fmtOpts({ month: 'short' }));
export const fmtEventDay = (e: HubEvent) =>
  eventDate(e.start).toLocaleDateString('en-US', fmtOpts({ day: 'numeric' }));
export const fmtEventWeekday = (e: HubEvent) =>
  eventDate(e.start).toLocaleDateString('en-US', fmtOpts({ weekday: 'short' }));
export const fmtEventTime = (e: HubEvent) =>
  e.allDay || e.start.length === 10
    ? 'All day'
    : eventDate(e.start).toLocaleTimeString(
        'en-US',
        fmtOpts({ hour: 'numeric', minute: '2-digit' }),
      );

// The old hub's title heuristic, kept so the two calendars agree on labels.
export type HubEventType = 'meeting' | 'volunteer' | 'milestone' | 'event';
export function eventType(title: string): HubEventType {
  const t = (title || '').toLowerCase();
  if (t.includes('board') || t.includes('meeting') || t.includes('orientation')) return 'meeting';
  if (t.includes('helper') || t.includes('volunteer')) return 'volunteer';
  if (t.includes('first day') || t.includes('last day') || t.includes('graduation'))
    return 'milestone';
  return 'event';
}

/** Label + AA-safe decorative icon color per type (labels stay neutral text). */
export const EVENT_TYPE_META: Record<
  HubEventType,
  { label: string; icon: string; iconColor: string }
> = {
  meeting: { label: 'Meeting', icon: 'users', iconColor: 'text-heading' },
  volunteer: { label: 'Volunteer', icon: 'heart-handshake', iconColor: 'text-sky-ink' },
  milestone: { label: 'Milestone', icon: 'graduation-cap', iconColor: 'text-orange-ink' },
  event: { label: 'Event', icon: 'party-popper', iconColor: 'text-green-ink' },
};

/**
 * Upcoming events: the Google Calendar feed first, Sanity `event` docs as the
 * fallback. Always sorted soonest-first, already filtered to today-or-later
 * (Eastern). Returns [] only when both sources fail or are empty.
 */
export async function getUpcomingEvents(feedUrl: string): Promise<HubEvent[]> {
  const cutoff = Date.now() - 86_400_000; // yesterday, so late-running events linger a day
  try {
    // The school calendar changes at most ~daily, so it rides hub-cache's
    // long stale-while-revalidate window: 15 min fresh, then up to 24h of
    // serve-stale-instantly-and-refresh-behind-the-response. Visitors never
    // wait on the 1.5-3s Apps Script execution, and an edit still shows
    // within minutes of the next visit.
    const raw = await cached(
      `calfeed:${feedUrl}`,
      1_800_000, // 30 min fresh — the calendar changes ~daily; keeps KV writes low
      async () => {
        const res = await fetch(feedUrl, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) throw new Error(`feed ${res.status}`);
        return (await res.json()) as HubEvent[];
      },
      { swrMs: 86_400_000 },
    );
    const events = (raw ?? [])
      .filter((e) => e && e.title && e.start && eventDate(e.start).getTime() >= cutoff)
      .sort((a, b) => eventDate(a.start).getTime() - eventDate(b.start).getTime());
    if (events.length > 0) return events;
  } catch {
    /* fall through to Sanity */
  }
  try {
    const docs = await sanityFetch<EventDoc[]>(UPCOMING_EVENTS_QUERY);
    return expandRecurring(docs ?? [])
      .filter((d) => d.title && d.startDate)
      .map((d) => ({
        title: d.title!,
        start: d.startDate!,
        allDay: d.allDay,
        location: d.location,
      }));
  } catch {
    return [];
  }
}
