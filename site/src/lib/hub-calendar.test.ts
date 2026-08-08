import { describe, it, expect, vi, afterEach } from 'vitest';

// hub-calendar pulls in the Sanity client for its fetch helpers, which can't
// initialise in the vitest env. eventType is a pure string heuristic that never
// touches them, so stub those modules out to keep the import clean.
vi.mock('@/lib/sanity', () => ({ sanityFetch: vi.fn(), BOARD_CONTENT_CACHE: {} }));
vi.mock('@/lib/hub-cache', () => ({ cached: vi.fn() }));

import { cached } from '@/lib/hub-cache';
import {
  eventType,
  eventEndsAt,
  isTourBooking,
  getUpcomingEvents,
  getCalendarEvents,
  type HubEvent,
} from './hub-calendar';

describe('eventType', () => {
  it('types no-school / closure days as "closure", not "event"', () => {
    expect(eventType('No School: Labor Day')).toBe('closure');
    expect(eventType('No School')).toBe('closure');
    expect(eventType('Winter Break')).toBe('closure');
    expect(eventType('Spring Break begins')).toBe('closure');
    expect(eventType('Teacher In-Service')).toBe('closure');
    expect(eventType('School Closed - Election Day')).toBe('closure');
  });

  it('does NOT mistake ordinary events for closures', () => {
    // "\bbreak\b" must not catch "breakfast"; "holiday" is deliberately not a
    // closure keyword (a Holiday Party is an event).
    expect(eventType('Breakfast with Santa')).toBe('event');
    expect(eventType('Holiday Party')).toBe('event');
    expect(eventType('WCP Summer Playdate')).toBe('event');
  });

  it('keeps the existing categories', () => {
    expect(eventType('Board Meeting')).toBe('meeting');
    expect(eventType('Helper Day sign-up')).toBe('volunteer');
    expect(eventType('Last Day of School')).toBe('milestone');
    expect(eventType('Graduation')).toBe('milestone');
  });
});

// -----------------------------------------------------------------------------
// eventEndsAt — when an event stops counting as "upcoming"
// -----------------------------------------------------------------------------
describe('eventEndsAt', () => {
  it('ends a timed event at its end time', () => {
    const e: HubEvent = {
      title: 'WCP Summer Playdate',
      start: '2026-08-08T13:30:00.000Z', // 9:30 AM EDT
      end: '2026-08-08T15:30:00.000Z', // 11:30 AM EDT
    };
    expect(eventEndsAt(e)).toBe(Date.parse('2026-08-08T15:30:00.000Z'));
  });

  it('defaults a timed event with no end to start + 1h (the Add-to-Google default)', () => {
    const e: HubEvent = { title: 'Pickup', start: '2026-08-08T17:00:00.000Z' };
    expect(eventEndsAt(e)).toBe(Date.parse('2026-08-08T18:00:00.000Z'));
  });

  it('keeps an all-day event through the end of its Eastern day, never dropping it early', () => {
    const e: HubEvent = { title: 'Picture Day', start: '2026-08-08', allDay: true };
    // Still on at 11:59 PM EDT (03:59 UTC next day)…
    expect(eventEndsAt(e)).toBeGreaterThanOrEqual(Date.parse('2026-08-09T04:00:00.000Z'));
    // …but gone by 2 AM EDT the next morning (no lingering into the next day).
    expect(eventEndsAt(e)).toBeLessThanOrEqual(Date.parse('2026-08-09T06:00:00.000Z'));
  });

  it('uses the final day of a multi-day all-day span', () => {
    const e: HubEvent = {
      title: 'Book Fair',
      start: '2026-08-08',
      end: '2026-08-10',
      allDay: true,
    };
    expect(eventEndsAt(e)).toBeGreaterThanOrEqual(Date.parse('2026-08-11T04:00:00.000Z'));
  });
});

// -----------------------------------------------------------------------------
// isTourBooking — prospective-family tour bookings never show in the hub
// -----------------------------------------------------------------------------
describe('isTourBooking', () => {
  it('matches the booking-flow "Tour with …" titles', () => {
    expect(isTourBooking('Tour with Keri Lindsey for Lucas (PM PreK)')).toBe(true);
    expect(isTourBooking('Tour with Dena Badawi (Jihad - PM PreK)')).toBe(true);
    expect(isTourBooking('tour with someone')).toBe(true);
  });

  it('leaves school-wide events alone', () => {
    expect(isTourBooking('Virtual Tour Open House')).toBe(false);
    expect(isTourBooking('Fall Festival')).toBe(false);
    expect(isTourBooking('')).toBe(false);
  });
});

// -----------------------------------------------------------------------------
// getUpcomingEvents / getCalendarEvents — the feed filters, end to end
// -----------------------------------------------------------------------------
describe('the calendar feed filters', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.mocked(cached).mockReset();
  });

  const FEED: HubEvent[] = [
    // Ended this morning (9:30–11:30 AM EDT).
    {
      title: 'WCP Summer Playdate',
      start: '2026-08-08T13:30:00.000Z',
      end: '2026-08-08T15:30:00.000Z',
    },
    // Still running right now (3–5 PM EDT).
    { title: 'Open Gym', start: '2026-08-08T19:00:00.000Z', end: '2026-08-08T21:00:00.000Z' },
    // All-day today.
    { title: 'Picture Day', start: '2026-08-08', allDay: true },
    // Future, but a prospective-family tour booking.
    {
      title: 'Tour with Keri Lindsey for Lucas (PM PreK)',
      start: '2026-08-10T18:00:00.000Z',
      end: '2026-08-10T18:30:00.000Z',
    },
    // Ordinary future event.
    { title: 'Board Meeting', start: '2026-08-10T22:00:00.000Z', end: '2026-08-10T23:30:00.000Z' },
  ];

  it('drops finished events but keeps in-progress, all-day-today and future ones', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-08T20:00:00.000Z')); // 4 PM EDT, playdate long over
    vi.mocked(cached).mockResolvedValue(FEED);

    const titles = (await getUpcomingEvents('https://feed.example')).map((e) => e.title);
    expect(titles).not.toContain('WCP Summer Playdate');
    expect(titles).toContain('Open Gym');
    expect(titles).toContain('Picture Day');
    expect(titles).toContain('Board Meeting');
  });

  it('never shows tour bookings, in either the upcoming list or the month grid', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-08T20:00:00.000Z'));
    vi.mocked(cached).mockResolvedValue(FEED);

    const upcoming = (await getUpcomingEvents('https://feed.example')).map((e) => e.title);
    const grid = (await getCalendarEvents('https://feed.example')).map((e) => e.title);
    expect(upcoming.some(isTourBooking)).toBe(false);
    expect(grid.some(isTourBooking)).toBe(false);
    // The month grid still keeps past non-tour events (it renders the whole month).
    expect(grid).toContain('WCP Summer Playdate');
  });
});
