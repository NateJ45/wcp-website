import { describe, expect, it } from 'vitest';
import { resolveSeason, seasonForMonth } from './season';

describe('seasonForMonth', () => {
  it('maps meteorological seasons', () => {
    expect(seasonForMonth(1)).toBe('winter');
    expect(seasonForMonth(2)).toBe('winter');
    expect(seasonForMonth(3)).toBe('spring');
    expect(seasonForMonth(5)).toBe('spring');
    expect(seasonForMonth(6)).toBe('summer');
    expect(seasonForMonth(8)).toBe('summer');
    expect(seasonForMonth(9)).toBe('fall');
    expect(seasonForMonth(11)).toBe('fall');
    expect(seasonForMonth(12)).toBe('winter');
  });
});

describe('resolveSeason', () => {
  const july = new Date('2026-07-13T12:00:00Z');

  it('off disables the accents', () => {
    expect(resolveSeason('off', july)).toBeNull();
  });

  it('an explicit season wins over the date', () => {
    expect(resolveSeason('winter', july)).toBe('winter');
  });

  it('auto follows the calendar', () => {
    expect(resolveSeason('auto', july)).toBe('summer');
    expect(resolveSeason('auto', new Date('2026-10-15T12:00:00Z'))).toBe('fall');
  });

  it('missing or unknown values behave like auto', () => {
    expect(resolveSeason(null, july)).toBe('summer');
    expect(resolveSeason(undefined, july)).toBe('summer');
    expect(resolveSeason('sparkles', july)).toBe('summer');
  });

  it('reads the month on the Eastern wall clock, not UTC', () => {
    // 03:00 UTC on Dec 1 is still Nov 30 in Ohio — that's fall, not winter.
    expect(resolveSeason('auto', new Date('2026-12-01T03:00:00Z'))).toBe('fall');
  });
});
