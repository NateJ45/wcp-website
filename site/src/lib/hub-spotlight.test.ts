import { describe, it, expect } from 'vitest';
import {
  isInWindow,
  isLive,
  liveSpotlights,
  spotlightLink,
  spotlightsQuery,
  toneBorder,
  MAX_RENDERED_SPOTLIGHTS,
  SPOTLIGHT_SEEN_KEY,
  type Spotlight,
} from './hub-spotlight';

const NOW = Date.parse('2026-09-15T12:00:00Z');

function make(over: Partial<Spotlight> = {}): Spotlight {
  return {
    _id: 'a',
    active: true,
    version: 'v1',
    heading: 'Supply lists are ready',
    ...over,
  };
}

describe('isInWindow', () => {
  it('is open when both bounds are blank', () => {
    expect(isInWindow(NOW)).toBe(true);
    expect(isInWindow(NOW, null, null)).toBe(true);
  });

  it('respects a start date', () => {
    expect(isInWindow(NOW, '2026-10-01T00:00:00Z')).toBe(false);
    expect(isInWindow(NOW, '2026-09-01T00:00:00Z')).toBe(true);
  });

  it('respects an end date', () => {
    expect(isInWindow(NOW, null, '2026-09-01T00:00:00Z')).toBe(false);
    expect(isInWindow(NOW, null, '2026-10-01T00:00:00Z')).toBe(true);
  });

  it('treats an unparseable date as no bound rather than hiding the pop-up', () => {
    expect(isInWindow(NOW, 'not a date', 'nonsense')).toBe(true);
  });
});

describe('isLive', () => {
  it('accepts a switched-on, stamped, headed spotlight', () => {
    expect(isLive(make(), NOW)).toBe(true);
  });

  it('rejects the master switch being off', () => {
    expect(isLive(make({ active: false }), NOW)).toBe(false);
  });

  it('rejects a missing version stamp — nothing to remember a dismissal against', () => {
    expect(isLive(make({ version: '' }), NOW)).toBe(false);
    expect(isLive(make({ version: '   ' }), NOW)).toBe(false);
  });

  it('rejects a blank heading', () => {
    expect(isLive(make({ heading: '' }), NOW)).toBe(false);
  });

  it('rejects one outside its window', () => {
    expect(isLive(make({ showUntil: '2026-09-01T00:00:00Z' }), NOW)).toBe(false);
  });
});

describe('liveSpotlights', () => {
  it('keeps the query order and drops what is not live', () => {
    const list = [
      make({ _id: 'off', active: false }),
      make({ _id: 'first' }),
      make({ _id: 'second' }),
    ];
    expect(liveSpotlights(list, NOW).map((s) => s._id)).toEqual(['first', 'second']);
  });

  it('caps how many the page ships', () => {
    const list = Array.from({ length: 8 }, (_, i) => make({ _id: `s${i}` }));
    expect(liveSpotlights(list, NOW)).toHaveLength(MAX_RENDERED_SPOTLIGHTS);
  });

  it('survives a missing list', () => {
    expect(liveSpotlights(null, NOW)).toEqual([]);
    expect(liveSpotlights(undefined, NOW)).toEqual([]);
  });
});

describe('spotlightLink', () => {
  it('returns null with no button label', () => {
    expect(spotlightLink(make({ linkKind: 'url', url: 'https://x.test' }))).toBeNull();
  });

  it('builds a built-in hub route', () => {
    const link = spotlightLink(
      make({ linkLabel: 'Open it', linkKind: 'builtin', builtinHref: '/family-hub/tuition' }),
    );
    expect(link).toEqual({ label: 'Open it', href: '/family-hub/tuition', external: false });
  });

  it('drops a built-in route that is no longer a hub route', () => {
    expect(
      spotlightLink(make({ linkLabel: 'Go', linkKind: 'builtin', builtinHref: '/about' })),
    ).toBeNull();
  });

  it('builds a Board-made hub page link from its slug', () => {
    expect(
      spotlightLink(make({ linkLabel: 'Read', linkKind: 'hubPage', pageSlug: 'auction' })),
    ).toEqual({ label: 'Read', href: '/family-hub/auction', external: false });
  });

  it('drops a hub page whose reference resolved to nothing', () => {
    expect(
      spotlightLink(make({ linkLabel: 'Read', linkKind: 'hubPage', pageSlug: null })),
    ).toBeNull();
  });

  it('builds an update link on the updates route', () => {
    expect(
      spotlightLink(make({ linkLabel: 'See it', linkKind: 'update', updateSlug: 'snow-day' })),
    ).toEqual({ label: 'See it', href: '/family-hub/updates/snow-day', external: false });
  });

  it('marks an outside link external and demands a real scheme', () => {
    expect(
      spotlightLink(make({ linkLabel: 'Sign up', linkKind: 'url', url: 'https://x.test' })),
    ).toEqual({ label: 'Sign up', href: 'https://x.test', external: true });
    expect(
      spotlightLink(make({ linkLabel: 'Sign up', linkKind: 'url', url: 'javascript:alert(1)' })),
    ).toBeNull();
  });

  it('uses the store address for a store button, and drops it when unset', () => {
    expect(
      spotlightLink(make({ linkLabel: 'Shop', linkKind: 'store', storeUrl: 'https://shop.test' })),
    ).toEqual({ label: 'Shop', href: 'https://shop.test', external: true });
    expect(spotlightLink(make({ linkLabel: 'Shop', linkKind: 'store', storeUrl: '' }))).toBeNull();
  });

  it('returns null for an unknown link kind', () => {
    expect(spotlightLink(make({ linkLabel: 'Go', linkKind: 'mystery' }))).toBeNull();
  });
});

describe('tone and query', () => {
  it('answers a validated border for each tone, and info for anything else', () => {
    expect(toneBorder('good')).toBe('border-green');
    expect(toneBorder('warning')).toBe('border-amber');
    expect(toneBorder(undefined)).toBe('border-navy');
    expect(toneBorder('hotpink')).toBe('border-navy');
  });

  it('reads only switched-on spotlights, in drag order, with the body projection', () => {
    const q = spotlightsQuery('body[]{...}');
    expect(q).toContain('_type == "hubSpotlight" && active == true');
    expect(q).toContain('order(orderRank)');
    expect(q).toContain('"body": body[]{...}');
    expect(q).toContain('*[_type == "hubStore"][0].storeUrl');
  });

  it('keeps one storage key for every dismissal', () => {
    expect(SPOTLIGHT_SEEN_KEY).toBe('wcp-spotlights-seen');
  });
});
