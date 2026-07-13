import { describe, it, expect } from 'vitest';
import { expandRecurring, type EventDoc } from './events';

// A fixed "now" so the tests are deterministic (no Date.now()).
const NOW = new Date('2026-03-01T12:00:00Z');

describe('expandRecurring', () => {
  it('passes one-time events through unchanged', () => {
    const events: EventDoc[] = [
      { _id: 'a', title: 'Open house', startDate: '2026-03-10T18:00:00Z' },
      { _id: 'b', title: 'Tour', startDate: '2026-03-05T15:00:00Z', recurrence: 'none' },
    ];
    const out = expandRecurring(events, NOW);
    expect(out).toHaveLength(2);
    expect(out.map((e) => e._id)).toEqual(['b', 'a']); // sorted soonest-first
    expect(out[1].startDate).toBe('2026-03-10T18:00:00Z');
  });

  it('expands a weekly event into upcoming occurrences and stops at the end date', () => {
    const events: EventDoc[] = [
      {
        _id: 'w',
        title: 'Story time',
        startDate: '2026-03-04T14:00:00Z',
        endDate: '2026-03-04T15:00:00Z',
        recurrence: 'weekly',
        recurrenceEnd: '2026-03-25',
      },
    ];
    const out = expandRecurring(events, NOW);
    // Mar 4, 11, 18, 25 — all within the window and after NOW.
    expect(out.map((e) => e.startDate)).toEqual([
      '2026-03-04T14:00:00.000Z',
      '2026-03-11T14:00:00.000Z',
      '2026-03-18T14:00:00.000Z',
      '2026-03-25T14:00:00.000Z',
    ]);
    // Occurrences render as plain one-time events with unique ids.
    expect(out.every((e) => e.recurrence === 'none')).toBe(true);
    expect(new Set(out.map((e) => e._id)).size).toBe(4);
    // Duration is preserved (1 hour).
    expect(out[0].endDate).toBe('2026-03-04T15:00:00.000Z');
  });

  it('skips occurrences already in the past (weekly event that started earlier)', () => {
    const events: EventDoc[] = [
      {
        _id: 'w',
        title: 'Weekly',
        startDate: '2026-02-01T14:00:00Z', // a month before NOW
        recurrence: 'weekly',
        recurrenceEnd: '2026-03-31',
      },
    ];
    const out = expandRecurring(events, NOW);
    // Every surfaced occurrence is on/after NOW.
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((e) => new Date(e.startDate!).getTime() >= NOW.getTime())).toBe(true);
  });

  it('caps the number of surfaced occurrences even with no end date', () => {
    const events: EventDoc[] = [
      { _id: 'w', title: 'Forever', startDate: '2026-03-02T14:00:00Z', recurrence: 'weekly' },
    ];
    const out = expandRecurring(events, NOW);
    expect(out.length).toBeLessThanOrEqual(8);
    expect(out.length).toBeGreaterThan(0);
  });

  it('steps monthly by calendar month', () => {
    const events: EventDoc[] = [
      {
        _id: 'm',
        title: 'Monthly meeting',
        startDate: '2026-03-15T18:00:00Z',
        recurrence: 'monthly',
        recurrenceEnd: '2026-05-31',
      },
    ];
    const out = expandRecurring(events, NOW);
    expect(out.map((e) => e.startDate)).toEqual([
      '2026-03-15T18:00:00.000Z',
      '2026-04-15T18:00:00.000Z',
      '2026-05-15T18:00:00.000Z',
    ]);
  });
});
