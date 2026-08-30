import { describe, it, expect } from 'vitest';
import {
  isNewlyAdded,
  fundraisingMilestone,
  fundraisingMilestoneTitle,
  mergeBellFeeds,
  BELL_FEED_CAP,
  BELL_MAX_ROWS,
  NEW_WINDOW_DAYS,
  type BellFeedItem,
} from './hub-bell';

const NOW = Date.parse('2026-09-15T12:00:00Z');
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString();

describe('isNewlyAdded', () => {
  it('accepts a date inside the window', () => {
    expect(isNewlyAdded(daysAgo(1), NOW)).toBe(true);
    expect(isNewlyAdded(daysAgo(13), NOW)).toBe(true);
  });

  it('rejects a date outside the window', () => {
    expect(isNewlyAdded(daysAgo(NEW_WINDOW_DAYS + 1), NOW)).toBe(false);
    expect(isNewlyAdded(daysAgo(400), NOW)).toBe(false);
  });

  it('rejects a missing or unreadable date', () => {
    expect(isNewlyAdded(undefined, NOW)).toBe(false);
    expect(isNewlyAdded(null, NOW)).toBe(false);
    expect(isNewlyAdded('', NOW)).toBe(false);
    expect(isNewlyAdded('soon', NOW)).toBe(false);
  });

  it('accepts a future date, so a clock difference hides nothing', () => {
    expect(isNewlyAdded(daysAgo(-2), NOW)).toBe(true);
  });

  it('takes a different window', () => {
    expect(isNewlyAdded(daysAgo(5), NOW, 3)).toBe(false);
    expect(isNewlyAdded(daysAgo(2), NOW, 3)).toBe(true);
  });
});

describe('fundraisingMilestone', () => {
  it('reports the highest threshold that is crossed', () => {
    expect(fundraisingMilestone(2500, 5000)).toBe(50);
    expect(fundraisingMilestone(3800, 5000)).toBe(75);
    expect(fundraisingMilestone(5000, 5000)).toBe(100);
  });

  it('reports nothing below the first threshold', () => {
    expect(fundraisingMilestone(2499, 5000)).toBe(null);
    expect(fundraisingMilestone(0, 5000)).toBe(null);
  });

  it('caps at 100 when the campaign goes over the goal', () => {
    expect(fundraisingMilestone(12_000, 5000)).toBe(100);
  });

  it('answers null for a missing, zero, or negative goal', () => {
    expect(fundraisingMilestone(2500, 0)).toBe(null);
    expect(fundraisingMilestone(2500, undefined)).toBe(null);
    expect(fundraisingMilestone(2500, null)).toBe(null);
    expect(fundraisingMilestone(2500, -100)).toBe(null);
  });

  it('answers null for a missing or broken total', () => {
    expect(fundraisingMilestone(undefined, 5000)).toBe(null);
    expect(fundraisingMilestone(Number.NaN, 5000)).toBe(null);
    expect(fundraisingMilestone(-500, 5000)).toBe(null);
    expect(fundraisingMilestone(2500, Number.POSITIVE_INFINITY)).toBe(null);
  });
});

describe('fundraisingMilestoneTitle', () => {
  it('names the part of the way for 50 and 75', () => {
    expect(fundraisingMilestoneTitle(50)).toBe('Fundraising passed 50% of the goal');
    expect(fundraisingMilestoneTitle(75)).toBe('Fundraising passed 75% of the goal');
  });

  it('says the goal is reached at 100', () => {
    expect(fundraisingMilestoneTitle(100)).toBe('Fundraising reached the goal');
  });
});

describe('mergeBellFeeds', () => {
  const row = (title: string, over: Partial<BellFeedItem> = {}): BellFeedItem => ({
    title,
    href: `/family-hub/${title}`,
    publishedAt: daysAgo(10),
    ...over,
  });

  it('caps each feed before the merge, so no feed starves another', () => {
    const docs = [row('d1'), row('d2'), row('d3'), row('d4')];
    const notes = [row('n1')];
    const out = mergeBellFeeds([{ items: docs }, { items: notes }]);
    expect(out).toHaveLength(BELL_FEED_CAP + 1);
    expect(out.map((i) => i.title)).toContain('n1');
    expect(out.map((i) => i.title)).not.toContain('d3');
  });

  it('honours a per-feed cap the caller sets', () => {
    const out = mergeBellFeeds([{ items: [row('a'), row('b'), row('c')], cap: 3 }]);
    expect(out).toHaveLength(3);
  });

  it('pins highlights first, then sorts newest first', () => {
    const out = mergeBellFeeds([
      { items: [row('old', { publishedAt: daysAgo(30) })] },
      { items: [row('new', { publishedAt: daysAgo(1) })] },
      { items: [row('pinned', { publishedAt: daysAgo(60), highlight: true })] },
    ]);
    expect(out.map((i) => i.title)).toEqual(['pinned', 'new', 'old']);
  });

  it('sends an undated row to the end but keeps it', () => {
    const out = mergeBellFeeds([
      { items: [row('money', { publishedAt: undefined })] },
      { items: [row('dated')] },
    ]);
    expect(out.map((i) => i.title)).toEqual(['dated', 'money']);
  });

  it('keeps two undated rows in a stable order', () => {
    const out = mergeBellFeeds([
      { items: [row('one', { publishedAt: '' }), row('two', { publishedAt: '' })] },
    ]);
    expect(out.map((i) => i.title)).toEqual(['one', 'two']);
  });

  it('shows a row once when two feeds carry it', () => {
    const same = { title: 'Meeting minutes', href: '/family-hub/updates/x' };
    const out = mergeBellFeeds([
      { items: [{ ...same, highlight: true, publishedAt: daysAgo(2) }] },
      { items: [{ ...same, publishedAt: daysAgo(2) }] },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].highlight).toBe(true);
  });

  it('never returns more than the panel holds', () => {
    const feeds = Array.from({ length: 8 }, (_, f) => ({
      items: [row(`f${f}a`), row(`f${f}b`)],
    }));
    expect(mergeBellFeeds(feeds)).toHaveLength(BELL_MAX_ROWS);
  });

  it('handles an empty set of feeds', () => {
    expect(mergeBellFeeds([])).toEqual([]);
    expect(mergeBellFeeds([{ items: [] }])).toEqual([]);
  });
});
