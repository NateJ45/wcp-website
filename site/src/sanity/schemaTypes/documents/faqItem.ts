import { defineType, defineField } from 'sanity';

// =============================================================================
// FAQ item — one question and answer
// =============================================================================
// Powers the FAQ page (grouped by category) and can be reused elsewhere.
// =============================================================================
export const faqItem = defineType({
  name: 'faqItem',
  title: 'FAQ',
  type: 'document',
  icon: () => '❓',
  fields: [
    defineField({
      name: 'question',
      title: 'Question',
      type: 'string',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'answer',
      title: 'Answer',
      type: 'blockContent',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Co-op & Community', value: 'coop' },
          { title: 'Classes & Schedules', value: 'classes' },
          { title: 'Enrollment & Fees', value: 'enrollment' },
          { title: 'About WCP', value: 'about' },
          { title: 'Donations', value: 'donation' },
        ],
        layout: 'dropdown',
      },
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'order',
      title: 'Sort order',
      type: 'number',
      initialValue: 0,
      description: 'Order within its category (lower shows first).',
    }),
  ],
  orderings: [
    {
      title: 'Category, then order',
      name: 'grouped',
      by: [
        { field: 'category', direction: 'asc' },
        { field: 'order', direction: 'asc' },
      ],
    },
  ],
  preview: {
    select: { title: 'question', subtitle: 'category' },
  },
});
