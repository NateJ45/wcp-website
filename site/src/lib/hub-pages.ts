// =============================================================================
// hub-pages — the rules that let the Board add a Family Hub page themselves
// =============================================================================
// Until now every hub page was a hand-written .astro route, a fixed `hubKey` in
// the schema, and a hardcoded link in src/data/hub-nav.ts. Adding one meant a
// developer, which made the hub the one part of the site a future board could
// not grow. A gated catch-all route (family-hub/[...slug].astro) now serves
// Board-created pages, and this module holds the pure rules around it:
//
//   - which slugs are RESERVED (the built-in routes), so a new page can never
//     shadow the calendar or the directory;
//   - whether a slug is well-formed;
//   - how Board pages merge into the code-owned rail nav.
//
// Pure on purpose — no Sanity client, no Astro — so every rule below is
// unit-tested directly, and so importing it never drags in `cloudflare:workers`.
// =============================================================================

import { hubNav, type HubGroup, type HubLink } from '@/data/hub-nav';

/**
 * Slugs a Board page may NOT take, because a real route already owns them.
 *
 * Astro matches static routes before a catch-all, so a colliding page would not
 * break the site — it would simply never appear, which is worse: silent, and
 * baffling to whoever created it. The Studio rejects these up front instead.
 *
 * Derived by hand from src/pages/family-hub/*.astro. Adding a hub route means
 * adding it here — the test in hub-pages.test.ts asserts this list matches the
 * routes on disk, so a missing entry fails CI rather than shipping a trap.
 */
export const RESERVED_HUB_SLUGS: readonly string[] = [
  'api',
  'calendar',
  'celebrations',
  'coop-jobs',
  'directory',
  'documents',
  'fundraising',
  'getting-started',
  'health',
  'hours',
  'index',
  'login',
  'photos',
  'pre-k',
  'pre-k-am',
  'pre-k-pm',
  'sign-ups',
  'super-helper',
  'threes',
  'tuition',
  'twos',
  'twos-threes',
  'updates',
];

/** Lowercase words joined by single hyphens. */
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type SlugProblem = 'empty' | 'malformed' | 'reserved';

/**
 * Why a slug can't be used, or null when it is fine. Returning the REASON
 * rather than a boolean lets the Studio and the route give different messages
 * for the same rule.
 */
export function slugProblem(slug?: string | null): SlugProblem | null {
  const s = slug?.trim();
  if (!s) return 'empty';
  if (!SLUG_RE.test(s)) return 'malformed';
  if (RESERVED_HUB_SLUGS.includes(s)) return 'reserved';
  return null;
}

export const isUsableHubSlug = (slug?: string | null): boolean => slugProblem(slug) === null;

/** A Board-created hub page, as the nav needs to see it. */
export interface BoardHubPage {
  title?: string | null;
  slug?: string | null;
  navGroup?: string | null;
  navIcon?: string | null;
  navOrder?: number | null;
}

/**
 * Merge Board-created pages into the code-owned rail.
 *
 * Rules, in the order they matter:
 *  1. A page with no usable slug is dropped. It cannot be linked to anything.
 *  2. A page with no `navGroup` is dropped from the NAV only — the page still
 *     works at its address. That is the "still writing it" state, and it needs
 *     to be possible without publishing a half-finished link to families.
 *  3. Built-in links keep their positions. Board pages sort after them by
 *     `navOrder`, then alphabetically, so an unordered page lands predictably
 *     instead of wherever the query happened to return it.
 *  4. A group named in `navGroup` that does not exist in the rail is IGNORED
 *     rather than created. The rail's groups carry AA-checked accent colours
 *     (see hub-nav.ts); inventing one would render an uncoloured group.
 *
 * The code nav is never mutated — a fresh structure comes back each call.
 */
export function mergeHubNav(nav: HubGroup[], pages?: BoardHubPage[] | null): HubGroup[] {
  const usable = (pages ?? []).filter((p) => isUsableHubSlug(p?.slug) && p?.navGroup?.trim());

  const byGroup = new Map<string, BoardHubPage[]>();
  for (const page of usable) {
    const key = page.navGroup!.trim();
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key)!.push(page);
  }

  return nav.map((group) => {
    const extras = byGroup.get(group.label);
    if (!extras?.length) return group;

    const sorted = [...extras].sort((a, b) => {
      // Unordered pages sort last, not as 0 — otherwise a blank field would
      // jump a page to the top of the group, which is not what "leave it empty"
      // reads like to a volunteer.
      const ao = typeof a.navOrder === 'number' ? a.navOrder : Number.POSITIVE_INFINITY;
      const bo = typeof b.navOrder === 'number' ? b.navOrder : Number.POSITIVE_INFINITY;
      if (ao !== bo) return ao - bo;
      return (a.title ?? '').localeCompare(b.title ?? '');
    });

    const links: HubLink[] = sorted.map((p) => ({
      label: p.title?.trim() || p.slug!.trim(),
      href: `/family-hub/${p.slug!.trim()}`,
      icon: p.navIcon?.trim() || 'file-text',
    }));

    return { ...group, links: [...group.links, ...links] };
  });
}

/** `mergeHubNav` against the committed rail — what the shell actually renders. */
export const hubNavWith = (pages?: BoardHubPage[] | null): HubGroup[] => mergeHubNav(hubNav, pages);
