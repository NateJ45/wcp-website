import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { RESERVED_HUB_SLUGS, slugProblem, isUsableHubSlug } from './hub-pages';

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
