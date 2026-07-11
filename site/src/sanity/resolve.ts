import { defineLocations, type PresentationPluginOptions } from 'sanity/presentation';

// =============================================================================
// Presentation Tool location resolver
// =============================================================================
// Maps each document type to the /preview/* route(s) it shows up on, so
// clicking a document in the Studio's Presentation pane navigates the preview
// iframe to the right page. Only maps types that have a real /preview route
// today (index, tuition, about, faq, contact) — schoolYearEvent and legalPage
// are a follow-up once those preview pages exist; mapping them early would
// send editors to a 404.
// =============================================================================
export const resolve: PresentationPluginOptions['resolve'] = {
  locations: {
    page: defineLocations({
      select: { slug: 'slug' },
      resolve: (doc) => ({
        locations: [
          {
            title: doc?.slug ?? 'Untitled page',
            href: doc?.slug === 'home' ? '/preview' : `/preview/${doc?.slug ?? ''}`,
          },
        ],
      }),
    }),
    siteSettings: {
      locations: [{ title: 'Site Settings', href: '/preview' }],
    },
    testimonial: {
      // Testimonials appear on several public pages (co-op-life, why-wcp,
      // classes/*), but only the homepage is in the wave-1 preview set —
      // extend this list as more preview pages ship.
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
