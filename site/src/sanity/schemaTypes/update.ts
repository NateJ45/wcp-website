import { defineType, defineField } from 'sanity';

// School Updates — Board/Administrator announcements shown on the hub.
export const update = defineType({
  name: 'update',
  title: 'Update / Announcement',
  type: 'document',
  icon: () => '📣',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'audience', title: 'Audience & timing' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (R) => R.required().error('Give the update a title before publishing.'),
    }),
    defineField({
      name: 'slug',
      title: 'Web address (slug)',
      type: 'slug',
      group: 'content',
      options: { source: 'title', maxLength: 96 },
      description: 'Gives this post its own page. Click Generate.',
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 2,
      group: 'content',
      description: 'Short summary shown in the Updates list (optional).',
    }),
    defineField({
      name: 'image',
      title: 'Image (optional)',
      type: 'image',
      options: { hotspot: true },
      group: 'content',
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
      description: 'A flyer or photo shown with the post (e.g. a newsletter graphic).',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published',
      type: 'datetime',
      group: 'audience',
      initialValue: () => new Date().toISOString(),
      validation: (R) => R.required().error('Pick a publish date (it starts as right now).'),
    }),
    defineField({
      name: 'pinned',
      title: 'Pin to hub home',
      description: 'Pinned updates surface at the top of the Family Hub home.',
      type: 'boolean',
      group: 'audience',
      initialValue: false,
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      group: 'audience',
      options: {
        list: [
          { title: 'Announcement', value: 'announcement' },
          { title: 'Meeting minutes', value: 'minutes' },
        ],
        layout: 'radio',
      },
      initialValue: 'announcement',
      description:
        'Announcements show in the hub home’s Announcements widget; meeting minutes show in its Meeting Minutes widget. Both appear on the Updates page.',
    }),
    defineField({
      name: 'audience',
      title: 'Who is this for?',
      type: 'string',
      group: 'audience',
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
    defineField({ name: 'body', title: 'Body', type: 'blockContent', group: 'content' }),
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
