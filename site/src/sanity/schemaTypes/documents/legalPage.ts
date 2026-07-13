import { defineType, defineField } from 'sanity';

// Accessibility / Privacy / Terms — long-form policy pages.
export const legalPage = defineType({
  name: 'legalPage',
  title: 'Legal Page',
  type: 'document',
  icon: () => '📜',
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
