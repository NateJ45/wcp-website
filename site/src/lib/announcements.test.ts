import { describe, it, expect } from 'vitest';
import {
  isInWindow,
  normalizePath,
  matchesPlacement,
  waitlistMessage,
  type Announcement,
} from './announcements';
import type { ClassAvailability } from './gsheets';

const NOW = new Date('2026-03-10T12:00:00Z').getTime();

describe('isInWindow', () => {
  it('is open when both bounds are blank', () => {
    expect(isInWindow(NOW)).toBe(true);
  });
  it('respects a start date', () => {
    expect(isInWindow(NOW, '2026-03-01T00:00:00Z')).toBe(true);
    expect(isInWindow(NOW, '2026-04-01T00:00:00Z')).toBe(false);
  });
  it('respects an end date', () => {
    expect(isInWindow(NOW, undefined, '2026-03-20T00:00:00Z')).toBe(true);
    expect(isInWindow(NOW, undefined, '2026-03-01T00:00:00Z')).toBe(false);
  });
});

describe('normalizePath', () => {
  it('treats home/"" and trailing slashes as root', () => {
    expect(normalizePath('')).toBe('/');
    expect(normalizePath('home')).toBe('/');
    expect(normalizePath('/')).toBe('/');
  });
  it('normalizes leading/trailing slashes and case', () => {
    expect(normalizePath('About/')).toBe('/about');
    expect(normalizePath('/classes/twos/')).toBe('/classes/twos');
  });
});

describe('matchesPlacement', () => {
  const base: Announcement = { _id: 'a' };
  it('all: everywhere', () => {
    expect(matchesPlacement({ ...base, placement: 'all' }, '/anything')).toBe(true);
    expect(matchesPlacement({ ...base }, '/anything')).toBe(true);
  });
  it('only: just the listed pages', () => {
    const a: Announcement = { ...base, placement: 'only', pageSlugs: ['enroll', 'about'] };
    expect(matchesPlacement(a, '/enroll')).toBe(true);
    expect(matchesPlacement(a, '/classes/twos')).toBe(false);
  });
  it('except: everywhere but the listed pages', () => {
    const a: Announcement = { ...base, placement: 'except', pageSlugs: ['enroll'] };
    expect(matchesPlacement(a, '/enroll/')).toBe(false);
    expect(matchesPlacement(a, '/about')).toBe(true);
  });
});

describe('waitlistMessage', () => {
  it('groups classes by status, good news first', () => {
    const items: ClassAvailability[] = [
      { slug: 'twos', status: 'waitlist' },
      { slug: 'threes', status: 'open' },
      { slug: 'pre-k-am', status: 'open' },
    ];
    expect(waitlistMessage(items)).toBe('Now enrolling — Threes & Pre-K AM open, Twos waitlist.');
  });
  it('handles a single class', () => {
    expect(waitlistMessage([{ slug: 'twos', status: 'few' }])).toBe(
      'Now enrolling — Twos a few spots.',
    );
  });
  it('is empty when there is nothing to say', () => {
    expect(waitlistMessage([])).toBe('');
  });
});
