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

/** Per-type styling, colour-coded to a brand tier so a calendar card reads by
 *  its KIND, not its position: Board meetings navy, volunteer sky, milestones
 *  orange, everyday events green. `accent` feeds the card's `--note-accent`
 *  surface tint; `chipBg`/`chipText` colour the date box + type pill (AA-safe
 *  `-ink` text on soft tints); `iconColor` tints the pill glyph. */
export const EVENT_TYPE_META: Record<
  HubEventType,
  {
    label: string;
    icon: string;
    iconColor: string;
    accent: string;
    chipBg: string;
    chipText: string;
  }
> = {
  meeting: {
    label: 'Meeting',
    icon: 'users',
    iconColor: 'text-navy dark:text-sky',
    accent: 'var(--color-navy)',
    chipBg: 'bg-navy/10 dark:bg-sky/15',
    chipText: 'text-heading',
  },
  volunteer: {
    label: 'Volunteer',
    icon: 'heart-handshake',
    iconColor: 'text-sky-ink',
    accent: 'var(--color-sky)',
    chipBg: 'bg-sky/15',
    chipText: 'text-sky-ink',
  },
  milestone: {
    label: 'Milestone',
    icon: 'graduation-cap',
    iconColor: 'text-orange-ink',
    accent: 'var(--color-orange)',
    chipBg: 'bg-amber/20',
    chipText: 'text-orange-ink',
  },
  event: {
    label: 'Event',
    icon: 'party-popper',
    iconColor: 'text-green-ink',
    accent: 'var(--color-green)',
    chipBg: 'bg-green/15',
    chipText: 'text-green-ink',
  },
};

/**
 * All events from the Google Calendar feed, sorted soonest-first, NO date
 * filter. Rides hub-cache's long stale-while-revalidate window (30 min fresh,
 * then up to 24h serve-stale-and-refresh-behind-the-response), so visitors
 * never wait on the 1.5-3s Apps Script execution and an edit still shows within
 * minutes of the next visit. Returns null (not []) when the feed is
 * unreachable or empty, so callers know to fall back to Sanity.
 */
async function fetchFeedEvents(feedUrl: string): Promise<HubEvent[] | null> {
  try {
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
      .filter((e) => e && e.title && e.start)
      .sort((a, b) => eventDate(a.start).getTime() - eventDate(b.start).getTime());
    return events.length > 0 ? events : null;
  } catch {
    return null;
  }
}

/** Sanity `event` docs (the public Events page's source), the feed's fallback.
 *  Upcoming-only by query, which is fine for both callers. */
async function fetchSanityEvents(): Promise<HubEvent[]> {
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

/**
 * Upcoming events: the Google Calendar feed first, Sanity `event` docs as the
 * fallback. Always sorted soonest-first, filtered to today-or-later (Eastern).
 * Returns [] only when both sources fail or are empty.
 */
export async function getUpcomingEvents(feedUrl: string): Promise<HubEvent[]> {
  const cutoff = Date.now() - 86_400_000; // yesterday, so late-running events linger a day
  const feed = await fetchFeedEvents(feedUrl);
  const upcoming = (feed ?? []).filter((e) => eventDate(e.start).getTime() >= cutoff);
  // Feed unreachable, or reachable but with nothing still upcoming → Sanity.
  return upcoming.length > 0 ? upcoming : fetchSanityEvents();
}

/**
 * Every event in the feed's rolling 12-month window (Sanity fallback), sorted
 * soonest-first and UNFILTERED by date — the month grid needs the earlier days
 * of the current month, not just what's still upcoming. Shares the same cache
 * entry as getUpcomingEvents, so calling both on one page is a single fetch.
 */
export async function getCalendarEvents(feedUrl: string): Promise<HubEvent[]> {
  const feed = await fetchFeedEvents(feedUrl);
  return feed && feed.length > 0 ? feed : fetchSanityEvents();
}
