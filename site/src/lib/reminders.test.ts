import { describe, it, expect } from 'vitest';
import { daysUntil, computeReminders, type ReminderState } from './reminders';

// A fixed "now": 2026-09-01T12:00:00Z.
const NOW = Date.UTC(2026, 8, 1, 12, 0, 0);

const base: ReminderState = {
  now: NOW,
  bannerOn: false,
  expiredAnnouncements: 0,
  expiredSpotlights: 0,
  oldUnanswered: 0,
  drafts: 0,
  enrollmentDeadline: null,
  upcomingEvents: [],
  closingSheets: [],
};

describe('daysUntil', () => {
  it('counts whole days for a date-only string (noon-anchored)', () => {
    expect(daysUntil('2026-09-01', NOW)).toBe(0);
    expect(daysUntil('2026-09-02', NOW)).toBe(1);
    expect(daysUntil('2026-09-08', NOW)).toBe(7);
  });

  it('is negative for a past date', () => {
    expect(daysUntil('2026-08-30', NOW)).toBe(-2);
  });

  it('handles a full datetime', () => {
    expect(daysUntil('2026-09-04T09:00:00Z', NOW)).toBe(3);
  });

  it('returns NaN for junk', () => {
    expect(Number.isNaN(daysUntil('not-a-date', NOW))).toBe(true);
  });
});

describe('computeReminders — attention', () => {
  it('is empty when all is well', () => {
    expect(computeReminders(base)).toEqual([]);
  });

  it('flags the banner, expired announcements, old messages, and drafts', () => {
    const r = computeReminders({
      ...base,
      bannerOn: true,
      expiredAnnouncements: 2,
      oldUnanswered: 1,
      drafts: 3,
    });
    const ids = r.map((x) => x.id);
    expect(ids).toContain('banner-on');
    expect(ids).toContain('expired-announcements');
    expect(ids).toContain('old-messages');
    expect(ids).toContain('drafts');
    expect(r.every((x) => x.kind === 'attention')).toBe(true);
  });

  it('flags a hub spotlight pop-up left on past its end date', () => {
    const r = computeReminders({ ...base, expiredSpotlights: 1 });
    expect(r.map((x) => x.id)).toEqual(['expired-spotlights']);
    expect(r[0].title).toContain('1 spotlight pop-up is');
  });

  it('pluralizes correctly', () => {
    const one = computeReminders({ ...base, oldUnanswered: 1 })[0];
    expect(one.title).toContain('message has');
    const many = computeReminders({ ...base, oldUnanswered: 4 })[0];
    expect(many.title).toContain('messages have');
  });
});

describe('computeReminders — upcoming', () => {
  it('includes a deadline inside the horizon and phrases the day count', () => {
    const today = computeReminders({ ...base, enrollmentDeadline: '2026-09-01' })[0];
    expect(today.title).toContain('today');
    const tomorrow = computeReminders({ ...base, enrollmentDeadline: '2026-09-02' })[0];
    expect(tomorrow.title).toContain('tomorrow');
    const later = computeReminders({ ...base, enrollmentDeadline: '2026-09-06' })[0];
    expect(later.title).toContain('in 5 days');
  });

  it('excludes deadlines beyond the horizon or in the past', () => {
    expect(computeReminders({ ...base, enrollmentDeadline: '2026-10-15' })).toEqual([]);
    expect(computeReminders({ ...base, enrollmentDeadline: '2026-08-01' })).toEqual([]);
  });

  it('respects a custom horizon', () => {
    expect(computeReminders({ ...base, enrollmentDeadline: '2026-09-10' }, 5)).toEqual([]);
    expect(computeReminders({ ...base, enrollmentDeadline: '2026-09-05' }, 5)).toHaveLength(1);
  });

  it('surfaces upcoming events and closing sheets within the horizon', () => {
    const r = computeReminders({
      ...base,
      upcomingEvents: [
        { title: 'Open House', date: '2026-09-05' },
        { title: 'Far Off', date: '2026-12-01' },
      ],
      closingSheets: [{ title: 'Festival helpers', date: '2026-09-03' }],
    });
    const titles = r.map((x) => x.title);
    expect(titles.some((t) => t.includes('Open House'))).toBe(true);
    expect(titles.some((t) => t.includes('Far Off'))).toBe(false);
    expect(titles.some((t) => t.includes('Festival helpers'))).toBe(true);
    expect(r.every((x) => x.kind === 'upcoming')).toBe(true);
  });

  it('ignores an unparseable date rather than throwing', () => {
    expect(computeReminders({ ...base, enrollmentDeadline: 'soon' })).toEqual([]);
  });
});
