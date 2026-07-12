import { defineType, defineField } from 'sanity';

// School Updates — Board/Administrator announcements shown on the hub.
export const update = defineType({
  name: 'update',
  title: 'Update / Announcement',
  type: 'document',
  icon: () => '📣',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (R) => R.required() }),
    defineField({
      name: 'slug',
      title: 'Link (slug)',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      description: 'Gives this post its own page. Click Generate.',
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 2,
      description: 'Short summary shown in the Updates list (optional).',
    }),
    defineField({
      name: 'image',
      title: 'Image (optional)',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
      description: 'A flyer or photo shown with the post (e.g. a newsletter graphic).',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'pinned',
      title: 'Pin to hub home',
      description: 'Pinned updates surface at the top of the Family Hub home.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'audience',
      title: 'Who is this for?',
      type: 'string',
      options: {
        list: [
          { title: 'All families', value: 'all' },
          { title: 'Twos', value: 'twos' },
          { title: 'Threes', value: 'threes' },
          { title: 'Pre-K AM', value: 'pre-k-am' },
          { title: 'Pre-K PM', value: 'pre-k-pm' },
        ],
        layout: 'dropdown',
      },
      initialValue: 'all',
    }),
    defineField({ name: 'body', title: 'Body', type: 'blockContent' }),
  ],
  orderings: [
    { title: 'Newest first', name: 'newest', by: [{ field: 'publishedAt', direction: 'desc' }] },
  ],
  preview: {
    select: { title: 'title', subtitle: 'publishedAt', pinned: 'pinned' },
    prepare({ title, subtitle, pinned }) {
      const date = subtitle ? new Date(subtitle).toLocaleDateString() : '';
      return { title: `${pinned ? '📌 ' : ''}${title}`, subtitle: date };
    },
  },
});
