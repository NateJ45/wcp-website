import { defineType, defineField } from 'sanity';
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list';

// =============================================================================
// Testimonial — a parent/family quote
// =============================================================================
// Add quotes here once; pages pull them by tag or "featured" so the same quote
// never has to be re-typed on multiple pages.
// =============================================================================
export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  icon: () => '💬',
  fields: [
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 4,
      validation: (R) => R.required().error('Paste or type the quote itself.'),
    }),
    defineField({
      name: 'author',
      title: 'Who said it',
      type: 'string',
      description: 'e.g. "Sarah M." or a full name if they’re comfortable.',
    }),
    defineField({
      name: 'role',
      title: 'Their connection',
      type: 'string',
      description: 'e.g. "Twos parent" or "Alumni family".',
    }),
    defineField({
      name: 'photo',
      title: 'Family photo',
      type: 'image',
      description:
        'Optional. A photo of the family, shown as a small print clipped to the quote. Square crops look best.',
      options: { hotspot: true },
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Twos', value: 'twos' },
          { title: 'Threes', value: 'threes' },
          { title: 'Pre-K', value: 'prek' },
          { title: 'Alumni', value: 'alumni' },
        ],
      },
      description:
        'Which page(s) this quote fits. Lets us show the right quotes in the right place.',
    }),
    defineField({
      name: 'rating',
      title: 'Stars',
      type: 'number',
      description: 'How many stars this review gave (1–5). Empty means five.',
      validation: (R) => R.min(1).max(5).error('Between 1 and 5.'),
    }),
    defineField({
      name: 'featured',
      title: 'Feature this one?',
      type: 'boolean',
      initialValue: false,
      description: 'Featured quotes appear on the homepage and top of the reviews wall.',
    }),
    // Legacy manual sort — superseded by drag-to-reorder (orderRank). Hidden so
    // volunteers use the drag handles in the Testimonials list instead.
    defineField({
      name: 'order',
      title: 'Sort order',
      type: 'number',
      initialValue: 0,
      hidden: true,
    }),
    orderRankField({ type: 'testimonial' }),
  ],
  orderings: [orderRankOrdering],
  preview: {
    select: { quote: 'quote', author: 'author', role: 'role', featured: 'featured' },
    prepare({ quote, author, role, featured }) {
      const who = [author, role].filter(Boolean).join(' · ');
      return {
        title: `${featured ? '⭐ ' : ''}${(quote || '').slice(0, 60)}${quote && quote.length > 60 ? '…' : ''}`,
        subtitle: who,
      };
    },
  },
});
