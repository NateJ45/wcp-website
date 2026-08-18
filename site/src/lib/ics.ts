// =============================================================================
// ICS builder — the "Download .ics" file for one event
// =============================================================================
// Builds an RFC 5545 calendar file. ICS is the calendar-file format that
// Apple, Outlook, and Google all import. The /api/event-ics route serves the
// result; the post-body event card links to it next to the Google Calendar
// link, so families on any calendar app can save an event.
//
// Site rule: a date-only string ("YYYY-MM-DD") anchors to NOON UTC before any
// date math, so an all-day event never shifts a day in Eastern time.
// =============================================================================
import { eventAddress, type EventDoc } from '@/lib/events';

// Escape the four characters RFC 5545 reserves in text values.
function icsEscape(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// "YYYYMMDD" for all-day values. `addDays` shifts the date (DTEND is
// exclusive, so an all-day end needs +1 day).
function dateStamp(iso: string, addDays = 0): string {
  const d = DATE_ONLY.test(iso) ? new Date(`${iso}T12:00:00Z`) : new Date(iso);
  d.setUTCDate(d.getUTCDate() + addDays);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

// "YYYYMMDDTHHMMSSZ" for timed values.
function utcStamp(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

// RFC 5545 folds content lines longer than 75 octets. We fold at 74
// characters and continue with one leading space. Our content is almost all
// ASCII, so the character count is a safe stand-in for octets.
function fold(line: string): string {
  if (line.length <= 74) return line;
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    parts.push(rest.slice(0, 74));
    rest = ' ' + rest.slice(74);
  }
  parts.push(rest);
  return parts.join('\r\n');
}

/**
 * The full .ics file for one event. `now` is injectable for tests (DTSTAMP
 * is a required field that records when the file was made).
 */
export function buildIcs(e: EventDoc, fallbackLocation = '', now: Date = new Date()): string {
  const allDay = Boolean(e.allDay);
  const start = e.startDate ?? '';
  // A calendar entry needs an end; default a timed event to +1 hour and an
  // all-day event to the next day (DTEND is exclusive).
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//West Chester Preschool//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
  ];
  lines.push(`UID:${icsEscape(e._id ?? 'event')}@westchesterpreschool`);
  lines.push(`DTSTAMP:${utcStamp(now.toISOString())}`);
  if (allDay) {
    lines.push(`DTSTART;VALUE=DATE:${dateStamp(start)}`);
    lines.push(`DTEND;VALUE=DATE:${dateStamp(e.endDate ?? start, 1)}`);
  } else {
    const end = e.endDate ?? new Date(new Date(start).getTime() + 3_600_000).toISOString();
    lines.push(`DTSTART:${utcStamp(start)}`);
    lines.push(`DTEND:${utcStamp(end)}`);
  }
  lines.push(`SUMMARY:${icsEscape(e.title ?? 'Event')}`);
  const where = eventAddress(e, fallbackLocation);
  if (where) lines.push(`LOCATION:${icsEscape(where)}`);
  if (e.description) lines.push(`DESCRIPTION:${icsEscape(e.description)}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
