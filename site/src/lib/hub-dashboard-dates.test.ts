import { describe, expect, it } from 'vitest';
import {
  daysUntil,
  formatMonthYear,
  formatShortDate,
  greetingForHour,
  nyHour,
  yearProgressPercent,
} from './hub-dashboard-dates';

describe('nyHour', () => {
  it('parses midnight as 0, not NaN', () => {
    // 2026-01-15T05:00:00Z is 2026-01-15T00:00:00 America/New_York (EST, UTC-5)
    expect(nyHour(new Date('2026-01-15T05:00:00Z'))).toBe(0);
  });

  it('parses an afternoon hour correctly', () => {
    // 2026-01-15T20:00:00Z is 2026-01-15T15:00:00 America/New_York
    expect(nyHour(new Date('2026-01-15T20:00:00Z'))).toBe(15);
  });

  it('parses 11pm as 23, not 24', () => {
    // 2026-01-16T04:00:00Z is 2026-01-15T23:00:00 America/New_York
    expect(nyHour(new Date('2026-01-16T04:00:00Z'))).toBe(23);
  });
});

describe('greetingForHour', () => {
  it('says good morning before noon', () => {
    expect(greetingForHour(0)).toBe('Good morning');
    expect(greetingForHour(11)).toBe('Good morning');
  });

  it('says good afternoon from noon to 5pm', () => {
    expect(greetingForHour(12)).toBe('Good afternoon');
    expect(greetingForHour(16)).toBe('Good afternoon');
  });

  it('says good evening from 5pm onward', () => {
    expect(greetingForHour(17)).toBe('Good evening');
    expect(greetingForHour(23)).toBe('Good evening');
  });
});

describe('daysUntil', () => {
  const today = new Date('2026-03-01T12:00:00Z');

  it('returns null when no date given', () => {
    expect(daysUntil(undefined, today)).toBeNull();
  });

  it('counts whole days to a future date', () => {
    expect(daysUntil('2026-03-11', today)).toBe(10);
  });

  it('returns 0 for today', () => {
    expect(daysUntil('2026-03-01', today)).toBe(0);
  });

  it('returns a negative number for a past date', () => {
    expect(daysUntil('2026-02-25', today)).toBe(-4);
  });
});

describe('yearProgressPercent', () => {
  it('returns null when either bound is missing', () => {
    expect(
      yearProgressPercent(undefined, '2026-06-01', new Date('2026-03-01T12:00:00Z')),
    ).toBeNull();
    expect(
      yearProgressPercent('2025-09-01', undefined, new Date('2026-03-01T12:00:00Z')),
    ).toBeNull();
  });

  it('returns null (not NaN) when yearStart equals yearEnd', () => {
    expect(
      yearProgressPercent('2026-06-01', '2026-06-01', new Date('2026-03-01T12:00:00Z')),
    ).toBeNull();
  });

  it('returns null (not NaN or negative) when yearEnd is before yearStart', () => {
    expect(
      yearProgressPercent('2026-06-01', '2025-09-01', new Date('2026-03-01T12:00:00Z')),
    ).toBeNull();
  });

  it('computes a proportional percent for a valid span', () => {
    // Span: 2025-09-01 to 2026-08-31 (364 days). Today 2026-03-01 is 181 days in.
    const pct = yearProgressPercent('2025-09-01', '2026-08-31', new Date('2026-03-01T12:00:00Z'));
    expect(pct).toBe(Math.round((181 / 364) * 100));
  });

  it('clamps to 100 when today is after yearEnd', () => {
    expect(yearProgressPercent('2025-09-01', '2026-06-01', new Date('2027-01-01T12:00:00Z'))).toBe(
      100,
    );
  });

  it('clamps to 0 when today is before yearStart', () => {
    expect(yearProgressPercent('2026-09-01', '2027-06-01', new Date('2026-01-01T12:00:00Z'))).toBe(
      0,
    );
  });
});

describe('formatShortDate', () => {
  it('renders an evening Eastern event on the Eastern day, even when that is the next UTC day', () => {
    // 2026-01-15T23:30:00-05:00 (Eastern) === 2026-01-16T04:30:00Z (UTC, next day)
    expect(formatShortDate('2026-01-16T04:30:00Z', 'America/New_York')).toBe('Jan 15');
  });

  it('renders a plain morning date the same in both zones', () => {
    expect(formatShortDate('2026-01-15T15:00:00Z', 'America/New_York')).toBe('Jan 15');
  });
});

describe('formatMonthYear', () => {
  it('renders "Month YYYY" in Eastern time', () => {
    expect(formatMonthYear('2026-07-15T12:00:00Z')).toBe('July 2026');
  });

  it('uses the Eastern day at a UTC month boundary', () => {
    // 2026-08-01T02:00:00Z is still 2026-07-31 21:00 in Eastern → July, not August.
    expect(formatMonthYear('2026-08-01T02:00:00Z')).toBe('July 2026');
  });

  it('returns "" for missing or invalid input', () => {
    expect(formatMonthYear(undefined)).toBe('');
    expect(formatMonthYear('not-a-date')).toBe('');
  });
});
