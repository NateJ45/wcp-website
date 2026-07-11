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
    location: e.location || fallbackLocation,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
