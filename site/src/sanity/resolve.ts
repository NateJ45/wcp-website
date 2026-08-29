import {
  defineDocuments,
  defineLocations,
  type PresentationPluginOptions,
} from 'sanity/presentation';

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
//  - `locations` (document -> URL): the reverse, so opening a document from the
//    Studio nav points the preview at the right page. Every `page` document is a
//    full page-builder doc with its own /preview/[...slug] route, so `page`
//    resolves generically from the slug. Reference doc types (testimonial/class/
//    staff/faqItem) can be pulled into many pages at once — they map to the page
//    where they most prominently live as a sensible landing spot.
// =============================================================================

// Turn a page slug into its /preview href ("home" is the site root).
const previewHref = (slug?: string) => (slug === 'home' ? '/preview' : `/preview/${slug}`);

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
  locations: {
    page: defineLocations({
      select: { title: 'title', slug: 'slug' },
      resolve: (doc) => {
        const slug = doc?.slug;
        if (!slug) return { locations: [], message: 'Give this page a slug to preview it.' };
        return { locations: [{ title: doc?.title ?? slug, href: previewHref(slug) }] };
      },
    }),
    // Hub pages preview their EDITABLE surface (heading/intro/sections) on
    // the gated /preview/family-hub route — the hub chrome and widgets are
    // code-owned and don't render there.
    hubPage: defineLocations({
      select: { title: 'title', heading: 'heading', hubKey: 'hubKey', slug: 'slug' },
      resolve: (doc) => {
        const key = doc?.hubKey || doc?.slug;
        if (!key)
          return { locations: [], message: 'Give this hub page a key or slug to preview it.' };
        return {
          locations: [
            { title: doc?.heading || doc?.title || key, href: `/preview/family-hub/${key}` },
          ],
        };
      },
    }),
    post: defineLocations({
      select: { title: 'title', slug: 'slug.current' },
      resolve: (doc) => {
        const slug = doc?.slug;
        if (!slug) return { locations: [], message: 'Give this post a slug to preview it.' };
        return { locations: [{ title: doc?.title ?? slug, href: `/preview/news/${slug}` }] };
      },
    }),
    siteSettings: {
      locations: [{ title: 'Site Settings', href: '/preview' }],
    },
    navigation: {
      locations: [{ title: 'Menus (header & footer)', href: '/preview' }],
    },
    testimonial: {
      // Testimonials are pulled into several pages (home, co-op-life, why-wcp,
      // classes/*); the homepage carries the featured wall, so land there.
      locations: [{ title: 'Home', href: '/preview' }],
    },
    class: defineLocations({
      select: { name: 'name' },
      resolve: (doc) => ({
        locations: [{ title: doc?.name ?? 'Class', href: '/preview/tuition' }],
      }),
    }),
    feeSchedule: {
      locations: [{ title: 'Tuition & Fees', href: '/preview/tuition' }],
    },
    staff: defineLocations({
      select: { name: 'name' },
      resolve: (doc) => ({
        locations: [{ title: doc?.name ?? 'Staff member', href: '/preview/about' }],
      }),
    }),
    faqItem: {
      locations: [{ title: 'FAQ', href: '/preview/faq' }],
    },
  },
};
