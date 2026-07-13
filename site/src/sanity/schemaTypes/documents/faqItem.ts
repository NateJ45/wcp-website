import { defineType, defineField } from 'sanity';
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list';

const FAQ_CATEGORIES = [
  { title: 'Co-op & Community', value: 'coop' },
  { title: 'Classes & Schedules', value: 'classes' },
  { title: 'Enrollment & Fees', value: 'enrollment' },
  { title: 'About WCP', value: 'about' },
  { title: 'Donations', value: 'donation' },
];

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
      validation: (R) => R.required().error('Write the question as a family would ask it.'),
    }),
    defineField({
      name: 'answer',
      title: 'Answer',
      type: 'blockContent',
      validation: (R) => R.required().error('The answer can’t be blank.'),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: FAQ_CATEGORIES,
        layout: 'dropdown',
      },
      validation: (R) => R.required().error('Pick which FAQ section this belongs in.'),
    }),
    // Legacy manual sort — superseded by drag-to-reorder (orderRank), hidden.
    // The FAQ page groups by category, so dragging reorders WITHIN a category;
    // the category shows in the list so that's clear.
    defineField({
      name: 'order',
      title: 'Sort order',
      type: 'number',
      initialValue: 0,
      hidden: true,
    }),
    orderRankField({ type: 'faqItem' }),
  ],
  orderings: [orderRankOrdering],
  preview: {
    select: { title: 'question', category: 'category' },
    prepare({ title, category }) {
      return {
        title,
        subtitle: FAQ_CATEGORIES.find((c) => c.value === category)?.title ?? category,
      };
    },
  },
});
