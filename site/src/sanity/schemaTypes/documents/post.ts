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
    { name: 'seo', title: 'SEO & sharing' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      group: 'content',
      options: { source: 'title', maxLength: 96 },
      validation: (R) =>
        R.required().custom((value) =>
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
      title: 'SEO title (optional)',
      type: 'string',
      group: 'seo',
      description: 'Overrides the browser-tab / search title. Defaults to the post title.',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO description (optional)',
      type: 'text',
      rows: 2,
      group: 'seo',
      description: 'Overrides the search / share description. Defaults to the summary.',
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
    select: { title: 'title', subtitle: 'category', media: 'coverImage' },
  },
});
