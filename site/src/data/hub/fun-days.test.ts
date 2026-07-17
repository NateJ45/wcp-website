import { describe, expect, it } from 'vitest';
import { todaysFunDay } from './fun-days';
import { todaysGiggle } from './giggles';

describe('todaysFunDay', () => {
  it('returns the observance for a matching day (Eastern)', () => {
    // Noon Eastern on 2026-07-16.
    expect(todaysFunDay(new Date('2026-07-16T16:00:00Z'))).toBe('National Ice Cream Day');
  });

  it('returns null on a day with no entry', () => {
    expect(todaysFunDay(new Date('2026-07-15T16:00:00Z'))).toBeNull();
  });

  it('keys off the EASTERN date, not UTC', () => {
    // 2026-07-17T02:00:00Z is still July 16, 10pm Eastern → the 07-16 entry.
    expect(todaysFunDay(new Date('2026-07-17T02:00:00Z'))).toBe('National Ice Cream Day');
  });
});

describe('todaysGiggle', () => {
  it('is deterministic for a given day', () => {
    const a = todaysGiggle(new Date('2026-07-16T16:00:00Z'));
    const b = todaysGiggle(new Date('2026-07-16T20:00:00Z'));
    expect(a).toEqual(b);
  });

  it('returns a complete setup + punchline', () => {
    const g = todaysGiggle(new Date('2026-03-03T16:00:00Z'));
    expect(g.setup.length).toBeGreaterThan(0);
    expect(g.punchline.length).toBeGreaterThan(0);
  });
});
