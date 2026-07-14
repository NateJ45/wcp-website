import { describe, it, expect } from 'vitest';
import {
  normalizeHours,
  sumHours,
  summarizeHours,
  categoryLabel,
  isHoursCategory,
} from './coop-hours';

describe('normalizeHours', () => {
  it('passes through a clean value', () => {
    expect(normalizeHours(3)).toBe(3);
    expect(normalizeHours('2.5')).toBe(2.5);
  });

  it('rounds to the nearest quarter hour', () => {
    expect(normalizeHours(1.1)).toBe(1);
    expect(normalizeHours(1.2)).toBe(1.25);
    expect(normalizeHours(0.9)).toBe(1);
  });

  it('rejects zero, negatives, and junk', () => {
    expect(normalizeHours(0)).toBe(0);
    expect(normalizeHours(-4)).toBe(0);
    expect(normalizeHours('abc')).toBe(0);
    expect(normalizeHours(null)).toBe(0);
    expect(normalizeHours(undefined)).toBe(0);
    expect(normalizeHours(NaN)).toBe(0);
    expect(normalizeHours(Infinity)).toBe(0);
  });

  it('caps an absurd value', () => {
    expect(normalizeHours(100000)).toBe(999);
  });
});

describe('sumHours', () => {
  it('adds normalized hours and ignores bad rows', () => {
    expect(sumHours([{ hours: 2 }, { hours: 1.5 }, { hours: -3 }, { hours: null }, {}])).toBe(3.5);
  });

  it('is zero for an empty set', () => {
    expect(sumHours([])).toBe(0);
  });
});

describe('summarizeHours', () => {
  it('splits verified from pending and computes progress', () => {
    const s = summarizeHours(
      [
        { hours: 4, verified: true },
        { hours: 2, verified: true },
        { hours: 3, verified: false },
      ],
      20,
    );
    expect(s.verified).toBe(6);
    expect(s.logged).toBe(9);
    expect(s.pending).toBe(3);
    expect(s.goal).toBe(20);
    expect(s.pct).toBe(45);
    expect(s.remaining).toBe(11);
    expect(s.met).toBe(false);
  });

  it('marks the goal met and never reports negative remaining', () => {
    const s = summarizeHours([{ hours: 25, verified: true }], 20);
    expect(s.met).toBe(true);
    expect(s.remaining).toBe(0);
    expect(s.pct).toBe(100);
  });

  it('never divides by zero or returns NaN when no goal is set', () => {
    const s = summarizeHours([{ hours: 5, verified: true }], 0);
    expect(s.goal).toBe(0);
    expect(s.pct).toBe(0);
    expect(s.remaining).toBe(0);
    expect(s.met).toBe(false);
    expect(Number.isNaN(s.pct)).toBe(false);
  });

  it('handles an empty ledger', () => {
    const s = summarizeHours([], 20);
    expect(s.logged).toBe(0);
    expect(s.pending).toBe(0);
    expect(s.pct).toBe(0);
    expect(s.remaining).toBe(20);
  });
});

describe('categoryLabel / isHoursCategory', () => {
  it('maps known values to titles', () => {
    expect(categoryLabel('classroom')).toBe('Classroom help');
    expect(categoryLabel('event')).toBe('Event or fundraiser');
  });

  it('falls back for unknown or missing values', () => {
    expect(categoryLabel('nope')).toBe('Other');
    expect(categoryLabel(undefined)).toBe('Other');
    expect(categoryLabel(null)).toBe('Other');
  });

  it('guards category membership', () => {
    expect(isHoursCategory('cleaning')).toBe(true);
    expect(isHoursCategory('nope')).toBe(false);
    expect(isHoursCategory(null)).toBe(false);
  });
});
