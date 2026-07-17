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
import { EVENT_TZ, expandRecurring, eventPlace, type EventDoc } from '@/lib/events';
import { deEmDash } from '@/lib/portable-text';

export interface HubEvent {
  title: string;
  /** ISO datetime, or date-only "YYYY-MM-DD" for all-day events. */
  start: string;
  /** ISO end datetime (Sanity events only; the feed doesn't carry one). */
  end?: string;
  allDay?: boolean;
  location?: string;
  /** Long text (Sanity events only; the Google feed doesn't carry one). */
  description?: string;
}

/** Parse feed/Sanity start strings safely (see DATE HANDLING above). */
export function eventDate(start: string): Date {
  return start.length === 10 ? new Date(`${start}T12:00:00Z`) : new Date(start);
}

/** A date's Eastern calendar day as [year, month0, day]. en-CA gives ISO
 *  "YYYY-MM-DD"; splitting beats parsing back into a Date. */
export function easternYMD(d: Date): [number, number, number] {
  const [y, m, day] = d.toLocaleDateString('en-CA', { timeZone: EVENT_TZ }).split('-').map(Number);
  return [y, m - 1, day];
}
/** Stable per-day bucket key, shared by the month grid and the detail dialog so
 *  a day cell's data-day-key matches its events' keys exactly. */
export const dayKeyOf = (y: number, m0: number, d: number) => `${y}-${m0}-${d}`;
export const eventDayKey = (e: HubEvent) => dayKeyOf(...easternYMD(eventDate(e.start)));
/** Stable per-event id (start + title) so the agenda and grid reference the same
 *  event across the two arrays without depending on array position. */
export const eventId = (e: HubEvent) => `${e.start}::${e.title}`;

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
export type HubEventType = 'meeting' | 'volunteer' | 'milestone' | 'closure' | 'event';
export function eventType(title: string): HubEventType {
  const t = (title || '').toLowerCase();
  // Closures FIRST: a "No School" day is not an "event". Matches no school / no
  // class / closed / closure / a break / in-service / day off. "\bbreak\b" so
  // "breakfast" doesn't match; "holiday" is deliberately excluded (a "Holiday
  // Party" is an event, not a closure).
  if (/no school|no class|closed|closure|\bbreak\b|in-?service|day off/.test(t)) return 'closure';
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
    /** Plural for the filter chips (some don't pluralise with a bare "s"). */
    labelPlural: string;
    icon: string;
    iconColor: string;
    accent: string;
    chipBg: string;
    chipText: string;
  }
> = {
  meeting: {
    label: 'Meeting',
    labelPlural: 'Meetings',
    icon: 'users',
    iconColor: 'text-navy dark:text-sky',
    accent: 'var(--color-navy)',
    chipBg: 'bg-navy/10 dark:bg-sky/15',
    chipText: 'text-heading',
  },
  volunteer: {
    label: 'Volunteer',
    labelPlural: 'Volunteer days',
    icon: 'heart-handshake',
    iconColor: 'text-sky-ink',
    accent: 'var(--color-sky)',
    chipBg: 'bg-sky/15',
    chipText: 'text-sky-ink',
  },
  milestone: {
    label: 'Milestone',
    labelPlural: 'Milestones',
    icon: 'graduation-cap',
    iconColor: 'text-orange-ink',
    accent: 'var(--color-orange)',
    chipBg: 'bg-amber/20',
    chipText: 'text-orange-ink',
  },
  // No-school days: neutral grey, deliberately de-emphasised — an absence, not
  // an event. Neutral text on a faint ink tint stays AA in both themes.
  closure: {
    label: 'No school',
    labelPlural: 'No-school days',
    icon: 'house',
    iconColor: 'text-ink-muted',
    accent: 'var(--color-ink-muted)',
    chipBg: 'bg-ink/8',
    chipText: 'text-ink-muted',
  },
  event: {
    label: 'Event',
    labelPlural: 'Events',
    icon: 'party-popper',
    iconColor: 'text-green-ink',
    accent: 'var(--color-green)',
    chipBg: 'bg-green/15',
    chipText: 'text-green-ink',
  },
};

/** A display-ready event for the detail dialog: pre-formatted (Eastern) date +
 *  time so the client never touches timezones, plus a per-event "add to Google
 *  Calendar" template URL. location/description are '' when the source doesn't
 *  carry them (the Google feed doesn't; Sanity `event` docs do). */
export interface EventDetail {
  id: string;
  dayKey: string;
  title: string;
  typeLabel: string;
  typeAccent: string;
  dateLabel: string;
  timeLabel: string;
  location: string;
  description: string;
  addUrl: string;
}

/** Google Calendar template `dates` value: YYYYMMDD/next for all-day, else UTC
 *  YYYYMMDDTHHMMSSZ/start+end (defaulting a timed event to +1h). */
function gcalDates(e: HubEvent): string {
  if (e.allDay || e.start.length === 10) {
    const startDay = e.start.slice(0, 10).replace(/-/g, '');
    const next = new Date(eventDate(e.start).getTime() + 86_400_000)
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');
    return `${startDay}/${next}`;
  }
  const stamp = (iso: string) =>
    new Date(iso)
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  const end = e.end ?? new Date(new Date(e.start).getTime() + 3_600_000).toISOString();
  return `${stamp(e.start)}/${stamp(end)}`;
}

export function toEventDetail(e: HubEvent): EventDetail {
  const meta = EVENT_TYPE_META[eventType(e.title)];
  const fmtT = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: EVENT_TZ,
    });
  const allDay = e.allDay || e.start.length === 10;
  const sameDayEnd =
    e.end && easternYMD(eventDate(e.end)).join() === easternYMD(eventDate(e.start)).join();
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: gcalDates(e),
    details: e.description ?? '',
    location: e.location ?? '',
  });
  return {
    id: eventId(e),
    dayKey: eventDayKey(e),
    title: deEmDash(e.title),
    typeLabel: meta.label,
    typeAccent: meta.accent,
    dateLabel: eventDate(e.start).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: EVENT_TZ,
    }),
    timeLabel: allDay
      ? 'All day'
      : sameDayEnd
        ? `${fmtT(e.start)} – ${fmtT(e.end!)}`
        : fmtT(e.start),
    location: e.location ? deEmDash(e.location) : '',
    description: e.description ? deEmDash(e.description) : '',
    addUrl: `https://calendar.google.com/calendar/render?${params.toString()}`,
  };
}

/**
 * All events from the Google Calendar feed, sorted soonest-first, NO date
 * filter. Rides hub-cache's long stale-while-revalidate window (12h fresh, then
 * up to 24h serve-stale-and-refresh-behind-the-response), so visitors never
 * wait on the 1.5-3s Apps Script execution. The window is long because the
 * school calendar is set weeks ahead (and every refresh is a KV write against a
 * near-capped free tier — see CLAUDE.md); an edit still shows within ~12h on the
 * next visit, or immediately after the publish→deploy webhook cold-starts the
 * isolate. Returns null (not []) when the feed is unreachable or empty, so
 * callers know to fall back to Sanity.
 */
async function fetchFeedEvents(feedUrl: string): Promise<HubEvent[] | null> {
  try {
    const raw = await cached(
      `calfeed:${feedUrl}`,
      43_200_000, // 12h fresh — the school calendar is set weeks ahead; ~2 KV writes/day
      async () => {
        const res = await fetch(feedUrl, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) throw new Error(`feed ${res.status}`);
        return (await res.json()) as HubEvent[];
      },
      { swrMs: 86_400_000 }, // +24h stale — 36h horizon, survives a quiet weekend
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
        end: d.endDate,
        allDay: d.allDay,
        location: eventPlace(d),
        description: d.description,
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
