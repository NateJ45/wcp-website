import { defineType, defineField } from 'sanity';

// =============================================================================
// post — a blog / news article
// =============================================================================
// The public News feed (/news). A volunteer writes a post like a document:
// title, cover photo, a short summary, and a rich body with headings, lists,
// links, and inline images. Posts are ordered by publishedAt; schedule one to
// go live later with the Publish menu (see the "Schedule" guide).
//
// Slug is Sanity's slug type (single URL segment, "Generate" button) — posts
// live at /news/<slug>, so no slashes are needed. "page" is reserved to avoid
// colliding with the /news/page/<n> pagination routes.
// =============================================================================
export const POST_CATEGORIES = [
  { title: 'News', value: 'news' },
  { title: 'Announcements', value: 'announcements' },
  { title: 'Events', value: 'events' },
  { title: 'Learning', value: 'learning' },
];

export const post = defineType({
  name: 'post',
  title: 'News post',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'Search & sharing' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (R) => R.required().error('Give the post a title before publishing.'),
    }),
    defineField({
      name: 'slug',
      title: 'Web address (slug)',
      type: 'slug',
      group: 'content',
      options: { source: 'title', maxLength: 96 },
      description: 'The web address piece after /news/. Click Generate.',
      validation: (R) =>
        R.required()
          .error('Click Generate to give this post a web address.')
          .custom((value) =>
            value?.current === 'page' ? '"page" is reserved — pick another slug.' : true,
          ),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Publish date',
      type: 'datetime',
      group: 'content',
      initialValue: () => new Date().toISOString(),
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      group: 'content',
      options: { list: POST_CATEGORIES, layout: 'radio' },
      initialValue: 'news',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      group: 'content',
      to: [{ type: 'staff' }],
      description: 'Optional — who wrote it. Pulls from Staff.',
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'figureImage',
      group: 'content',
    }),
    defineField({
      name: 'excerpt',
      title: 'Summary',
      type: 'text',
      rows: 3,
      group: 'content',
      description: 'One or two sentences shown on the News list and when shared.',
      validation: (R) => R.max(300),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'postBody',
      group: 'content',
    }),
    defineField({
      name: 'featured',
      title: 'Feature on the homepage?',
      type: 'boolean',
      group: 'content',
      initialValue: false,
    }),
    defineField({
      name: 'seoTitle',
      title: 'Browser tab / search title (optional)',
      type: 'string',
      group: 'seo',
      description: 'Overrides the browser-tab / search title. Defaults to the post title.',
      validation: (R) => R.max(65).warning('Titles over ~65 characters get cut off in Google.'),
    }),
    defineField({
      name: 'seoDescription',
      title: 'Search description (optional)',
      type: 'text',
      rows: 2,
      group: 'seo',
      description: 'Overrides the search / share description. Defaults to the summary.',
      validation: (R) =>
        R.max(160).warning('Descriptions over ~160 characters get cut off in search results.'),
    }),
    defineField({
      name: 'ogImage',
      title: 'Social share image (optional)',
      type: 'figureImage',
      group: 'seo',
      description: 'Overrides the cover image when the post is shared on social media.',
    }),
  ],
  orderings: [
    {
      title: 'Newest first',
      name: 'publishedDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: { title: 'title', category: 'category', media: 'coverImage' },
    prepare({ title, category, media }) {
      return {
        title,
        subtitle: POST_CATEGORIES.find((c) => c.value === category)?.title ?? category,
        media,
      };
    },
  },
});
