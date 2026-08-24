import { defineType, defineField } from 'sanity';

// =============================================================================
// newsletterIssue — one issue of the family newsletter, with a public web home
// =============================================================================
// The board composes an issue like a News post (title, cover, a short summary,
// a rich body). Publishing it adds a permanent public page at
// /newsletter/<slug> and a card in the /newsletter/archive list, so every issue
// has a shareable link. Sending is separate and optional: the Apps Script mailer
// pulls the latest published issue from the token-protected /api/newsletter feed
// and emails the subscriber list a short teaser linking to that page (Workers
// can't send email on the free tier — see docs/FORMS.md). Reuses the post body
// editor (`postBody`) so the writing experience matches News.
// =============================================================================
export const newsletterIssue = defineType({
  name: 'newsletterIssue',
  title: 'Newsletter issue',
  type: 'document',
  icon: () => '📰',
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
      description: 'e.g. "October Newsletter" or "Fall Festival Recap".',
      validation: (R) => R.required().error('Give the issue a title before publishing.'),
    }),
    defineField({
      name: 'slug',
      title: 'Web address (slug)',
      type: 'slug',
      group: 'content',
      options: { source: 'title', maxLength: 96 },
      description: 'The web address piece after /newsletter/. Click Generate.',
      validation: (R) =>
        R.required()
          .error('Click Generate to give this issue a web address.')
          .custom((value) =>
            value?.current === 'archive' ? '"archive" is reserved — pick another slug.' : true,
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
      name: 'preheader',
      title: 'Summary',
      type: 'text',
      rows: 2,
      group: 'content',
      description:
        'One or two sentences. Shown on the archive card, used as the email teaser, and when the page is shared.',
      validation: (R) => R.max(300),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'figureImage',
      group: 'content',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'postBody',
      group: 'content',
    }),
    defineField({
      name: 'emailedAt',
      title: 'Date emailed to families',
      type: 'datetime',
      group: 'content',
      description:
        'Optional. Set this after you email the issue, so you have a record of when it went out. It does not send anything.',
    }),
    defineField({
      name: 'seoDescription',
      title: 'Search description (optional)',
      type: 'text',
      rows: 2,
      group: 'seo',
      description:
        'Overrides the summary for search and sharing. Usually leave blank — the automatic one is right.',
      validation: (R) =>
        R.max(160).warning('Descriptions over ~160 characters get cut off in search results.'),
    }),
    defineField({
      name: 'ogImage',
      title: 'Social share image (optional)',
      type: 'figureImage',
      group: 'seo',
      description:
        'Overrides the cover image when the page is shared on social media. Usually leave blank — the automatic one is right.',
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
    select: { title: 'title', date: 'publishedAt', media: 'coverImage', emailed: 'emailedAt' },
    prepare({ title, date, media, emailed }) {
      const when = date ? new Date(date).toLocaleDateString('en-US') : 'Draft';
      return {
        title: title || 'Newsletter issue',
        subtitle: `${when}${emailed ? ' · emailed' : ''}`,
        media,
      };
    },
  },
});
