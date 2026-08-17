import { defineType, defineField, defineArrayMember } from 'sanity';

// =============================================================================
// supplyList — the yearly School Supply List, Board-editable
// =============================================================================
// The branded one-pager (print PDF + the social carousel) that
// scripts/generate-supplies.mjs renders. Its content lived only in that
// script, so the yearly refresh needed a developer. This document holds the
// words; the script reads them at build time and falls back to its committed
// content for any missing field. Design (colours, fonts, layout) stays code.
//
// The assets regenerate when the site next builds — a publish here triggers
// the deploy webhook, so an edit is live within a few minutes.
// =============================================================================
export const supplyList = defineType({
  name: 'supplyList',
  title: 'School supply list',
  type: 'document',
  icon: () => '🎒',
  fields: [
    defineField({
      name: 'year',
      title: 'School year',
      type: 'string',
      description: 'e.g. "2027–28". Shown on the cover.',
    }),
    defineField({
      name: 'backpackNote',
      title: 'Top note',
      type: 'text',
      rows: 2,
      description: 'The line above the lists (the backpack reminder).',
    }),
    defineField({
      name: 'dueNote',
      title: 'Due line',
      type: 'string',
      description: 'e.g. "All items are due at orientation."',
    }),
    defineField({
      name: 'waterNote',
      title: 'Optional-item note (Twos & Threes)',
      type: 'string',
      description: 'The optional line under the Twos and Threes cards.',
    }),
    defineField({
      name: 'lists',
      title: 'Per-class lists',
      type: 'array',
      description: 'The items for each class. The class colours and icons stay fixed.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'slug',
              title: 'Class',
              type: 'string',
              options: {
                list: [
                  { title: 'Twos', value: 'twos' },
                  { title: 'Threes', value: 'threes' },
                  { title: 'Pre-K AM', value: 'pre-k-am' },
                  { title: 'Pre-K PM', value: 'pre-k-pm' },
                ],
              },
              validation: (R) => R.required().error('Pick which class this list is for.'),
            }),
            defineField({
              name: 'items',
              title: 'Items',
              type: 'array',
              of: [defineArrayMember({ type: 'string' })],
              validation: (R) => R.min(1).error('Add at least one item.'),
            }),
          ],
          preview: {
            select: { slug: 'slug', items: 'items' },
            prepare({ slug, items }) {
              const names: Record<string, string> = {
                twos: 'Twos',
                threes: 'Threes',
                'pre-k-am': 'Pre-K AM',
                'pre-k-pm': 'Pre-K PM',
              };
              const n = Array.isArray(items) ? items.length : 0;
              return {
                title: names[slug ?? ''] ?? slug,
                subtitle: `${n} item${n === 1 ? '' : 's'}`,
              };
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'wishList',
      title: 'Classroom wish list',
      type: 'object',
      fields: [
        defineField({ name: 'heading', title: 'Heading', type: 'string' }),
        defineField({ name: 'note', title: 'Note', type: 'string' }),
        defineField({
          name: 'items',
          title: 'Items',
          type: 'array',
          of: [defineArrayMember({ type: 'string' })],
        }),
      ],
    }),
  ],
  preview: {
    select: { year: 'year' },
    prepare({ year }) {
      return { title: 'School supply list', subtitle: year ? `${year} school year` : '' };
    },
  },
});
