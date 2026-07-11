import { defineType, defineField } from 'sanity';

// Reusable "icon + title + short text" card. Used by the many card grids across
// the site (class "what they learn", reasons, facilities, etc.).
export const iconCard = defineType({
  name: 'iconCard',
  title: 'Card',
  type: 'object',
  fields: [
    defineField({
      name: 'icon',
      title: 'Icon',
      description:
        'Icon name from our line-icon set (e.g. "star", "book-open", "heart"). Leave blank for no icon. Ask if you need the full list.',
      type: 'string',
    }),
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'body', title: 'Text', type: 'text', rows: 3 }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'body' },
  },
});
