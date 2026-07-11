import { defineType, defineField } from 'sanity';

// Per-class notes — teacher/rep updates shown on each class's hub page.
export const classNote = defineType({
  name: 'classNote',
  title: 'Class Note',
  type: 'document',
  icon: () => '🧸',
  fields: [
    defineField({
      name: 'class',
      title: 'Class',
      type: 'string',
      options: {
        list: [
          { title: 'Twos', value: 'twos' },
          { title: 'Threes', value: 'threes' },
          { title: 'Pre-K AM', value: 'pre-k-am' },
          { title: 'Pre-K PM', value: 'pre-k-pm' },
        ],
        layout: 'dropdown',
      },
      validation: (R) => R.required(),
    }),
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (R) => R.required() }),
    defineField({
      name: 'publishedAt',
      title: 'Published',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (R) => R.required(),
    }),
    defineField({ name: 'body', title: 'Body', type: 'blockContent' }),
  ],
  orderings: [
    { title: 'Newest first', name: 'newest', by: [{ field: 'publishedAt', direction: 'desc' }] },
  ],
  preview: {
    select: { title: 'title', subtitle: 'class' },
  },
});
