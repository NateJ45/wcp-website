import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  RESERVED_HUB_SLUGS,
  slugProblem,
  isUsableHubSlug,
  mergeHubNav,
  hubNavWith,
  type BoardHubPage,
} from './hub-pages';
import type { HubGroup } from '@/data/hub-nav';

// A miniature rail, so the merge rules are tested against a fixture rather than
// whatever the real nav happens to contain this year.
const NAV: HubGroup[] = [
  { label: 'Hub', links: [{ label: 'Home', href: '/family-hub', icon: 'house' }] },
  {
    label: 'Resources',
    accent: '#ffa334',
    links: [{ label: 'Documents', href: '/family-hub/documents', icon: 'folder-open' }],
  },
  { label: 'Money', accent: '#4ade80', links: [] },
];

const page = (over: Partial<BoardHubPage> = {}): BoardHubPage => ({
  title: 'Playground Committee',
  slug: 'playground-committee',
  navGroup: 'Resources',
  navIcon: 'trees',
  ...over,
});

describe('RESERVED_HUB_SLUGS', () => {
  // The whole point of the list is that a Board page can never shadow a real
  // route. If someone adds a hub route and forgets this list, that protection
  // silently lapses — so the list is checked against the filesystem.
  it('covers every route file actually in src/pages/family-hub', () => {
    const dir = resolve(__dirname, '../pages/family-hub');
    const onDisk = readdirSync(dir, { withFileTypes: true })
      .map((e) => (e.isDirectory() ? e.name : e.name.replace(/\.astro$/, '')))
      .filter((n) => !n.startsWith('[')); // the catch-all itself is not reserved

    const missing = onDisk.filter((n) => !RESERVED_HUB_SLUGS.includes(n));
    expect(missing, `add these to RESERVED_HUB_SLUGS in src/lib/hub-pages.ts: ${missing}`).toEqual(
      [],
    );
  });

  it('lists nothing that no longer exists', () => {
    const dir = resolve(__dirname, '../pages/family-hub');
    const onDisk = new Set(
      readdirSync(dir, { withFileTypes: true }).map((e) =>
        e.isDirectory() ? e.name : e.name.replace(/\.astro$/, ''),
      ),
    );
    const stale = RESERVED_HUB_SLUGS.filter((s) => !onDisk.has(s));
    expect(stale, `these are reserved but have no route: ${stale}`).toEqual([]);
  });
});

describe('slugProblem', () => {
  it('accepts the shapes a volunteer would reasonably type', () => {
    for (const s of ['playground-committee', 'kindergarten-readiness', 'faq2', 'a']) {
      expect(slugProblem(s), s).toBeNull();
    }
  });

  it('rejects an empty or missing slug', () => {
    expect(slugProblem(undefined)).toBe('empty');
    expect(slugProblem(null)).toBe('empty');
    expect(slugProblem('   ')).toBe('empty');
  });

  it('rejects the ways a slug is usually mistyped', () => {
    for (const s of [
      'Playground Committee', // spaces + capitals
      'playground_committee', // underscore
      '-leading',
      'trailing-',
      'double--hyphen',
      'slash/inside',
      'accented-café',
      'has.dot',
    ]) {
      expect(slugProblem(s), s).toBe('malformed');
    }
  });

  it('rejects a slug that would be shadowed by a built-in page', () => {
    // Astro matches the static route first, so this page would silently never
    // appear. Catching it in the Studio is the whole point.
    expect(slugProblem('calendar')).toBe('reserved');
    expect(slugProblem('directory')).toBe('reserved');
    expect(slugProblem('tuition')).toBe('reserved');
    expect(isUsableHubSlug('calendar')).toBe(false);
  });

  it('tolerates surrounding whitespace', () => {
    expect(slugProblem('  playground-committee  ')).toBeNull();
  });
});

describe('mergeHubNav', () => {
  it('appends a Board page after the built-in links of its group', () => {
    const out = mergeHubNav(NAV, [page()]);
    const resources = out.find((g) => g.label === 'Resources')!;
    expect(resources.links.map((l) => l.label)).toEqual(['Documents', 'Playground Committee']);
    expect(resources.links[1]).toMatchObject({
      href: '/family-hub/playground-committee',
      icon: 'trees',
    });
  });

  it('fills an empty group', () => {
    const out = mergeHubNav(NAV, [page({ navGroup: 'Money', title: 'Grants' })]);
    expect(out.find((g) => g.label === 'Money')!.links.map((l) => l.label)).toEqual(['Grants']);
  });

  it('leaves the committed nav untouched', () => {
    const before = JSON.stringify(NAV);
    mergeHubNav(NAV, [page()]);
    expect(JSON.stringify(NAV)).toBe(before);
  });

  it('omits a page with no menu group — the "still writing it" state', () => {
    // The page must still exist at its address; it just has no link yet.
    const out = mergeHubNav(NAV, [page({ navGroup: null })]);
    expect(out.find((g) => g.label === 'Resources')!.links).toHaveLength(1);
  });

  it('omits a page whose slug is unusable', () => {
    const out = mergeHubNav(NAV, [
      page({ slug: 'calendar' }),
      page({ slug: 'Bad Slug' }),
      page({ slug: '' }),
    ]);
    expect(out.find((g) => g.label === 'Resources')!.links).toHaveLength(1);
  });

  it('ignores a group the rail does not have, rather than inventing one', () => {
    // Rail groups carry AA-checked accent colours; an invented group would
    // render an uncoloured label on navy.
    const out = mergeHubNav(NAV, [page({ navGroup: 'Made Up' })]);
    expect(out.map((g) => g.label)).toEqual(['Hub', 'Resources', 'Money']);
    expect(out.flatMap((g) => g.links)).toHaveLength(2);
  });

  it('sorts by navOrder, then alphabetically', () => {
    const out = mergeHubNav(NAV, [
      page({ title: 'Zebra', slug: 'zebra', navOrder: 2 }),
      page({ title: 'Apple', slug: 'apple', navOrder: 1 }),
      page({ title: 'Mango', slug: 'mango', navOrder: 1 }),
    ]);
    expect(out.find((g) => g.label === 'Resources')!.links.map((l) => l.label)).toEqual([
      'Documents',
      'Apple',
      'Mango',
      'Zebra',
    ]);
  });

  it('sorts unordered pages LAST, not first', () => {
    // A blank "position" field should read as "wherever", not "top".
    const out = mergeHubNav(NAV, [
      page({ title: 'No order', slug: 'no-order' }),
      page({ title: 'Ordered', slug: 'ordered', navOrder: 5 }),
    ]);
    expect(out.find((g) => g.label === 'Resources')!.links.map((l) => l.label)).toEqual([
      'Documents',
      'Ordered',
      'No order',
    ]);
  });

  it('falls back to the slug when a page has no title, and to a default icon', () => {
    const out = mergeHubNav(NAV, [page({ title: '', navIcon: '' })]);
    expect(out.find((g) => g.label === 'Resources')!.links[1]).toMatchObject({
      label: 'playground-committee',
      icon: 'file-text',
    });
  });

  it('survives an empty or missing page list', () => {
    expect(mergeHubNav(NAV, [])).toEqual(NAV);
    expect(mergeHubNav(NAV, null)).toEqual(NAV);
    expect(mergeHubNav(NAV, undefined)).toEqual(NAV);
  });

  it('handles a decade of pages without dropping or duplicating any', () => {
    // The school will not add 60 pages, but the merge should not care.
    const many = Array.from({ length: 60 }, (_, i) =>
      page({ title: `Page ${i}`, slug: `page-${i}`, navOrder: 60 - i }),
    );
    const out = mergeHubNav(NAV, many);
    const links = out.find((g) => g.label === 'Resources')!.links;
    expect(links).toHaveLength(61);
    expect(new Set(links.map((l) => l.href)).size).toBe(61);
    expect(links[1].label).toBe('Page 59'); // navOrder 1
  });
});

describe('hubNavWith', () => {
  it('merges against the real committed rail', () => {
    const out = hubNavWith([page({ navGroup: 'Community', title: 'Carpool' })]);
    const community = out.find((g) => g.label === 'Community')!;
    expect(community.links.at(-1)).toMatchObject({ label: 'Carpool' });
    // The built-in Community links are all still there.
    expect(community.links.length).toBeGreaterThan(1);
  });

  it('returns the rail unchanged when there are no Board pages', () => {
    expect(hubNavWith([])).toEqual(hubNavWith(null));
  });
});
