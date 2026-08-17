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
//   - whether a slug is well-formed.
//
// (How pages appear in the rail lives in src/lib/hub-nav-doc.ts — the menu is
// its own Board-editable document, like the public site's.)
//
// Pure on purpose — no Sanity client, no Astro — so every rule below is
// unit-tested directly, and so importing it never drags in `cloudflare:workers`.
// =============================================================================

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
