import { describe, it, expect } from 'vitest';
import {
  STATS_DAYS,
  barFractions,
  bucketDay,
  dayWindow,
  shapeStats,
  utcDay,
  type StatsRow,
} from './site-stats';

const NOW = new Date('2026-08-28T15:20:00Z');

describe('utcDay', () => {
  it('takes the UTC calendar day, not the local one', () => {
    // 00:30 UTC is still the previous evening in Pennsylvania; the bucket is
    // deliberately UTC so the endpoint and the tool never disagree.
    expect(utcDay(new Date('2026-08-28T00:30:00Z'))).toBe('2026-08-28');
    expect(utcDay(new Date('2026-08-28T23:59:59Z'))).toBe('2026-08-28');
  });
});

describe('dayWindow', () => {
  it('ends on today and runs oldest first', () => {
    const w = dayWindow(NOW, 28);
    expect(w).toHaveLength(28);
    expect(w[27]).toBe('2026-08-28');
    expect(w[0]).toBe('2026-08-01');
  });

  it('crosses a month boundary correctly', () => {
    expect(dayWindow(new Date('2026-03-02T09:00:00Z'), 4)).toEqual([
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
      '2026-03-02',
    ]);
  });

  it('defaults to the panel window', () => {
    expect(dayWindow(NOW)).toHaveLength(STATS_DAYS);
  });
});

describe('bucketDay', () => {
  it('reads the date dimension', () => {
    expect(bucketDay({ dimensions: { date: '2026-08-20' } })).toBe('2026-08-20');
  });

  it('reads the hourly fallback dimension down to its day', () => {
    expect(bucketDay({ dimensions: { datetimeHour: '2026-08-20T13:00:00Z' } })).toBe('2026-08-20');
  });

  it('returns null for a row with no usable time', () => {
    expect(bucketDay({})).toBeNull();
    expect(bucketDay({ dimensions: null })).toBeNull();
    expect(bucketDay({ dimensions: { date: 'yesterday' } })).toBeNull();
  });
});

describe('shapeStats', () => {
  const shape = (rows: StatsRow[], days = 5) =>
    shapeStats(rows, { now: NOW, scriptName: 'wcp-website', days });

  it('fills every day in the window, so a quiet day reads as zero not a gap', () => {
    const out = shape([{ dimensions: { date: '2026-08-26' }, sum: { requests: 40, errors: 1 } }]);
    expect(out.days.map((d) => d.date)).toEqual([
      '2026-08-24',
      '2026-08-25',
      '2026-08-26',
      '2026-08-27',
      '2026-08-28',
    ]);
    expect(out.days.map((d) => d.requests)).toEqual([0, 0, 40, 0, 0]);
    expect(out.since).toBe('2026-08-24');
    expect(out.until).toBe('2026-08-28');
  });

  it('adds several rows that land on the same day (the hourly fallback path)', () => {
    const out = shape([
      { dimensions: { datetimeHour: '2026-08-27T01:00:00Z' }, sum: { requests: 10, errors: 1 } },
      { dimensions: { datetimeHour: '2026-08-27T02:00:00Z' }, sum: { requests: 5, errors: 0 } },
      { dimensions: { datetimeHour: '2026-08-28T00:00:00Z' }, sum: { requests: 7, errors: 2 } },
    ]);
    expect(out.days.find((d) => d.date === '2026-08-27')).toEqual({
      date: '2026-08-27',
      requests: 15,
      errors: 1,
    });
    expect(out.days.find((d) => d.date === '2026-08-28')?.requests).toBe(7);
  });

  it('drops rows outside the window instead of letting them skew the totals', () => {
    const out = shape([
      { dimensions: { date: '2026-08-01' }, sum: { requests: 9999, errors: 0 } },
      { dimensions: { date: '2026-08-25' }, sum: { requests: 3, errors: 0 } },
    ]);
    expect(out.last28.requests).toBe(3);
  });

  it('coerces junk counts to zero rather than rendering NaN', () => {
    const out = shape([
      { dimensions: { date: '2026-08-25' }, sum: { requests: null, errors: undefined } },
      { dimensions: { date: '2026-08-26' }, sum: { requests: -4, errors: 2.6 } },
    ]);
    expect(out.days.find((d) => d.date === '2026-08-25')).toEqual({
      date: '2026-08-25',
      requests: 0,
      errors: 0,
    });
    expect(out.days.find((d) => d.date === '2026-08-26')).toEqual({
      date: '2026-08-26',
      requests: 0,
      errors: 3,
    });
  });

  it('totals the last 7 days separately from the last 28', () => {
    const rows: StatsRow[] = dayWindow(NOW, 28).map((date) => ({
      dimensions: { date },
      sum: { requests: 10, errors: 1 },
    }));
    const out = shapeStats(rows, { now: NOW, scriptName: 'wcp-website' });
    expect(out.last7).toEqual({ days: 7, requests: 70, errors: 7 });
    expect(out.last28).toEqual({ days: 28, requests: 280, errors: 28 });
  });

  it('survives an empty answer from a brand-new site', () => {
    const out = shapeStats([], { now: NOW, scriptName: 'wcp-website' });
    expect(out.days).toHaveLength(28);
    expect(out.last7.requests).toBe(0);
    expect(out.last28.requests).toBe(0);
    expect(out.ok).toBe(true);
  });

  it('records when the numbers were read', () => {
    const out = shapeStats([], {
      now: NOW,
      scriptName: 'wcp-website',
      fetchedAt: new Date('2026-08-28T15:00:00Z'),
    });
    expect(out.fetchedAt).toBe('2026-08-28T15:00:00.000Z');
  });
});

describe('barFractions', () => {
  it('scales every bar against the busiest day', () => {
    const days = [
      { date: 'a', requests: 50, errors: 0 },
      { date: 'b', requests: 100, errors: 0 },
      { date: 'c', requests: 0, errors: 0 },
    ];
    expect(barFractions(days)).toEqual([0.5, 1, 0]);
  });

  it('draws a flat baseline instead of dividing by zero on an all-quiet window', () => {
    const days = [
      { date: 'a', requests: 0, errors: 0 },
      { date: 'b', requests: 0, errors: 0 },
    ];
    expect(barFractions(days)).toEqual([0, 0]);
  });
});
