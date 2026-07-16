import { describe, it, expect, vi } from 'vitest';

// hub-calendar pulls in the Sanity client for its fetch helpers, which can't
// initialise in the vitest env. eventType is a pure string heuristic that never
// touches them, so stub those modules out to keep the import clean.
vi.mock('@/lib/sanity', () => ({ sanityFetch: vi.fn(), BOARD_CONTENT_CACHE: {} }));
vi.mock('@/lib/hub-cache', () => ({ cached: vi.fn() }));

import { eventType } from './hub-calendar';

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
