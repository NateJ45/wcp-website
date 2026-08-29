import { defineDocuments, type PresentationPluginOptions } from 'sanity/presentation';
import { locations } from './locations';

// =============================================================================
// Presentation Tool location resolver
// =============================================================================
// Two halves:
//
//  - `mainDocuments` (URL -> document): as you click through the preview iframe
//    like a normal website (About, a class, a news post, ...), Presentation
//    opens the matching document in the editor panel automatically — so you're
//    never "stuck" editing whichever page you first opened. Routes are matched
//    against the iframe pathname (which lives under /preview). Order matters:
//    the more specific routes (news, classes) come before the catch-all page
//    route. Nested page slugs like "classes/twos" are rebuilt in the filter.
//
//  - `locations` (document -> URL): the reverse — the "Used on" panel. Lives
//    in ./locations.ts, and since 2026-08-29 it QUERIES the dataset for real
//    usage (direct references, plus the page -> class -> staff hop) instead of
//    naming one hardcoded page per type. The old map sent every staff member
//    to /preview/about, a page that stopped existing on 2026-08-04.
// =============================================================================

export const resolve: PresentationPluginOptions['resolve'] = {
  mainDocuments: defineDocuments([
    // A `page` MATCHES ON `slug`, NOT `slug.current` (fixed 2026-08-29).
    // page.slug is a plain string, deliberately — it has to hold slashes for
    // nested addresses like "classes/twos", which Sanity's slug type cannot.
    // These filters were written against `slug.current` anyway, which is
    // undefined on a string, so every one of them matched nothing and the
    // Studio showed "Missing a main document for /preview" on every page.
    // `post` genuinely IS a slug type, so it keeps `.current` — the difference
    // is real, and section-fields-style drift gates pin it in resolve.test.ts.
    { route: '/preview', filter: '_type == "page" && slug == "home"' },
    // Hub pages (built-in by hubKey, board-created by slug) — before the
    // generic :slug route so "family-hub" never matches as a page slug.
    {
      route: '/preview/family-hub/:key',
      filter: '_type == "hubPage" && (hubKey == $key || slug == $key)',
    },
    { route: '/preview/news/:slug', filter: '_type == "post" && slug.current == $slug' },
    // Any two-segment page address, not just classes/*. The old route hardcoded
    // "classes", so a nested page anywhere else — say "about/history" — fell
    // through to the single-segment route below and matched nothing.
    {
      route: '/preview/:parent/:slug',
      filter: '_type == "page" && slug == $parent + "/" + $slug',
    },
    { route: '/preview/:slug', filter: '_type == "page" && slug == $slug' },
  ]),
  locations,
};
