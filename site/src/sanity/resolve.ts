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
    { route: '/preview', filter: '_type == "page" && slug.current == "home"' },
    { route: '/preview/news/:slug', filter: '_type == "post" && slug.current == $slug' },
    {
      route: '/preview/classes/:slug',
      filter: '_type == "page" && slug.current == "classes/" + $slug',
    },
    { route: '/preview/:slug', filter: '_type == "page" && slug.current == $slug' },
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
