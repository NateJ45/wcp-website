import { defineLocations, type PresentationPluginOptions } from 'sanity/presentation';

// =============================================================================
// Presentation Tool location resolver
// =============================================================================
// Maps each document type to the /preview/* route(s) it shows up on, so
// clicking a document in the Studio's Presentation pane navigates the preview
// iframe to the right page. Every `page` document is now a full page-builder
// doc with its own /preview/[...slug] route, so `page` resolves generically
// from the slug. Reference doc types (testimonial/class/staff/faqItem) can be
// pulled into many pages at once — they map to the page where they most
// prominently live as a sensible landing spot.
// =============================================================================

// Turn a page slug into its /preview href ("home" is the site root).
const previewHref = (slug?: string) => (slug === 'home' ? '/preview' : `/preview/${slug}`);

export const resolve: PresentationPluginOptions['resolve'] = {
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
