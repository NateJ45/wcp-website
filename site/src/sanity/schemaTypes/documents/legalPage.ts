import { defineType, defineField } from 'sanity';

// RETIRED (2026-08-23, field audit): the policy pages (Accessibility /
// Privacy / Terms) are page-builder `page` docs now, and nothing renders this
// type. It stays registered ONLY so the three orphan documents in the dataset
// remain openable (Studio search) until someone empties them; it is out of
// the left-nav, the create menu, and every query. See docs/FIELD_AUDIT.md.
export const legalPage = defineType({
  name: 'legalPage',
  title: 'Legal Page (old, unused)',
  type: 'document',
  icon: () => '📜',
  deprecated: { reason: 'Policy pages moved into the page builder; this type renders nowhere.' },
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Which page',
      type: 'string',
      options: {
        list: [
          { title: 'Accessibility', value: 'accessibility' },
          { title: 'Privacy', value: 'privacy' },
          { title: 'Terms', value: 'terms' },
        ],
        layout: 'radio',
      },
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow (small label above the title)',
      type: 'string',
      description: 'e.g. "Our policies". Optional.',
    }),
    defineField({
      name: 'lead',
      title: 'Intro line',
      type: 'text',
      rows: 2,
      description: 'The sentence under the title. Optional.',
    }),
    defineField({ name: 'body', title: 'Policy body', type: 'blockContent' }),
    defineField({
      name: 'lastUpdated',
      title: 'Last updated',
      type: 'date',
      description: 'Shown at the top of the policy.',
    }),
  ],
  preview: {
    select: { title: 'title', slug: 'slug' },
    prepare({ title, slug }) {
      const labels: Record<string, string> = {
        accessibility: 'Accessibility page',
        privacy: 'Privacy page',
        terms: 'Terms page',
      };
      return { title, subtitle: labels[slug] ?? slug };
    },
  },
});
