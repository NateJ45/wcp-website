// =============================================================================
// redirects — the pure path arithmetic behind the board's Redirects manager
// =============================================================================
// Two things use this file, and they must agree exactly:
//
//   1. astro.config.mjs (BUILD time) turns the published `redirect` documents
//      into Astro's `redirects` map, which the Cloudflare adapter emits as real
//      301/302s. That is where redirects are actually SERVED — see the note at
//      the bottom of this comment.
//   2. src/sanity/actions/slugRedirect.tsx (STUDIO) works out the old and new
//      paths when a board member renames a page, so it can file the redirect
//      automatically instead of relying on them to remember.
//
// Everything here is pure string work — no Sanity client, no Astro imports —
// so it is unit-testable (src/lib/redirects.test.ts) and safe to import from
// the Astro config, the Studio bundle, or a script.
//
// WHY NOT A RUNTIME LOOKUP? An earlier sketch of this feature checked Sanity on
// every 404. It was dropped on purpose: the site is `output: 'static'`, so the
// 404 route is prerendered and middleware never runs for it at request time —
// making it SSR just to read a redirect list would put a Worker invocation and
// a KV read in front of the one route that exists to be cheap, and this
// account's KV is already near its free-tier daily WRITE cap (see CLAUDE.md).
// The build-time map costs nothing per request and is already a real 301.
// Publishing a redirect fires the deploy webhook, so a new entry is live in the
// same 1-2 minutes as any other content edit.
// =============================================================================

/** One published `redirect` document, as the build-time query returns it. */
export interface RedirectDoc {
  from?: string | null;
  to?: string | null;
  permanent?: boolean | null;
}

/** What Astro's `redirects` map wants for a non-default status. */
export interface RedirectTarget {
  status: 301 | 302;
  destination: string;
}

/** True for an off-site target ("https://example.org"), which is left alone. */
export function isExternalTarget(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

/**
 * Put a board-typed path into the one canonical shape the map is keyed by:
 * leading slash, no trailing slash, no query string or hash, no doubled
 * slashes. Returns null for anything that isn't a usable path.
 *
 * "/old-page/"        → "/old-page"
 * "old-page"          → "/old-page"
 * " /a//b?x=1#frag "  → "/a/b"
 * "/" or "" or "///"  → "/"
 *
 * External targets are returned untouched (they are not ours to normalize).
 */
export function normalizeRedirectPath(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isExternalTarget(trimmed)) return trimmed;

  // Drop the query string / fragment: matching is on the path alone. A visitor
  // arriving with "?utm_source=…" still matches, and the adapter carries the
  // query through to the destination.
  const pathOnly = trimmed.split(/[?#]/)[0];
  if (!pathOnly) return '/';

  const collapsed = `/${pathOnly}`.replace(/\/{2,}/g, '/');
  const withoutTrailing = collapsed.replace(/\/+$/, '');
  return withoutTrailing || '/';
}

/**
 * The public URL of a builder `page` from its slug. "home" is the front page;
 * nested slugs ("classes/twos") keep their slashes. Null when there is no slug.
 */
export function pathForPageSlug(slug: unknown): string | null {
  if (typeof slug !== 'string') return null;
  const trimmed = slug.trim().replace(/^\/+|\/+$/g, '');
  if (!trimmed) return null;
  if (trimmed === 'home') return '/';
  return normalizeRedirectPath(trimmed);
}

/** The public URL of a news `post` from its slug ("/news/<slug>"). */
export function pathForPostSlug(slug: unknown): string | null {
  if (typeof slug !== 'string') return null;
  const trimmed = slug.trim().replace(/^\/+|\/+$/g, '');
  if (!trimmed) return null;
  return normalizeRedirectPath(`/news/${trimmed}`);
}

/** The public URL for a renamable document type, or null if it has none. */
export function pathForDocSlug(type: string, slug: unknown): string | null {
  if (type === 'page') return pathForPageSlug(slug);
  if (type === 'post') return pathForPostSlug(slug);
  return null;
}

/**
 * Turn the published `redirect` docs into Astro's `redirects` map.
 *
 * Rules, all of them there to stop a board typo becoming a broken site:
 *   - both sides normalized (so "/old-page/" and "/old-page" are one key);
 *   - a redirect to itself is dropped (it would be an infinite loop);
 *   - a missing side is dropped;
 *   - later entries win for the same `from`, so callers control precedence by
 *     spread order (the launch map first, the board's entries last).
 *
 * No chain following: a direct match only. If /a → /b and /b → /c both exist,
 * the browser simply follows two hops, which is correct and cheap.
 */
export function buildRedirectMap(docs: readonly RedirectDoc[]): Record<string, RedirectTarget> {
  const map: Record<string, RedirectTarget> = {};
  for (const doc of docs ?? []) {
    const from = normalizeRedirectPath(doc?.from);
    const to = normalizeRedirectPath(doc?.to);
    if (!from || !to) continue;
    // A path may only redirect somewhere else, and only a real path may be the
    // source (an "https://…" left side would never match a request).
    if (isExternalTarget(from)) continue;
    if (from === to) continue;
    map[from] = { status: doc?.permanent === false ? 302 : 301, destination: to };
  }
  return map;
}
