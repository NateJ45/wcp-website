import { defineType, defineField } from 'sanity';

// =============================================================================
// Page — the top-of-page copy for a marketing page
// =============================================================================
// Holds the hero (eyebrow / title / intro) and the browser/search description
// for a page, looked up by its slug (e.g. "home", "about", "tuition"). The
// structured content on each page (classes, staff, fees, testimonials, FAQs)
// comes from its own document type; this covers the page's headline words.
// Leave a box blank to keep the page's built-in wording.
// =============================================================================
export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  icon: () => '📄',
  groups: [
    { name: 'hero', title: 'Hero', default: true },
    { name: 'seo', title: 'Search & sharing' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Page (internal name)',
      type: 'string',
      description: 'Just so you can find it in the list, e.g. "Home" or "About".',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Page key',
      type: 'string',
      description:
        'Which page this is, e.g. "home", "about", "tuition". Do not change existing ones.',
      validation: (R) => R.required(),
    }),
    // Hero
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow (small label above the title)',
      type: 'string',
      group: 'hero',
    }),
    defineField({ name: 'heroTitle', title: 'Headline', type: 'string', group: 'hero' }),
    defineField({ name: 'lead', title: 'Intro line', type: 'text', rows: 3, group: 'hero' }),
    defineField({
      name: 'heroImage',
      title: 'Hero photo',
      type: 'image',
      options: { hotspot: true },
      group: 'hero',
    }),
    // SEO
    defineField({
      name: 'seoTitle',
      title: 'Browser tab / search title',
      type: 'string',
      group: 'seo',
      validation: (R) => R.max(65).warning('Titles over ~65 characters get cut off in Google.'),
    }),
    defineField({
      name: 'seoDescription',
      title: 'Search description',
      type: 'text',
      rows: 2,
      group: 'seo',
      validation: (R) =>
        R.max(160).warning('Descriptions over ~160 characters get cut off in search results.'),
    }),
  ],
  preview: { select: { title: 'title', subtitle: 'slug' } },
});
