import { defineType, defineField } from 'sanity';
import { bandFields } from '../objects/_shared';

// =============================================================================
// Dynamic collection sections — auto-pull from the News / Events collections
// =============================================================================

// -----------------------------------------------------------------------------
// latestPostsSection — a row of the most recent News posts
// -----------------------------------------------------------------------------
// Drop this on any page (usually the homepage) to show the latest posts as
// cards with a "read all" link. The posts themselves are pulled automatically
// at build time from the News collection — you only choose the heading and how
// many to show. Renders through LatestPostsSection.astro.
// =============================================================================
export const latestPostsSection = defineType({
  name: 'latestPostsSection',
  title: 'Latest news',
  type: 'object',
  fields: [
    defineField({
      name: 'header',
      title: 'Heading (optional)',
      type: 'sectionHeader',
    }),
    defineField({
      name: 'limit',
      title: 'How many posts to show',
      type: 'number',
      options: {
        list: [
          { title: '2', value: 2 },
          { title: '3', value: 3 },
          { title: '4', value: 4 },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 3,
    }),
    defineField({
      name: 'linkLabel',
      title: 'Link text',
      type: 'string',
      initialValue: 'Read all news',
    }),
    ...bandFields('white'),
  ],
  preview: {
    select: { title: 'header.title' },
    prepare({ title }) {
      return { title: title || 'Latest news', subtitle: 'Pulls the newest News posts' };
    },
  },
});

// -----------------------------------------------------------------------------
// upcomingEventsSection — the next few upcoming Events
// -----------------------------------------------------------------------------
export const upcomingEventsSection = defineType({
  name: 'upcomingEventsSection',
  title: 'Upcoming events',
  type: 'object',
  fields: [
    defineField({ name: 'header', title: 'Heading (optional)', type: 'sectionHeader' }),
    defineField({
      name: 'limit',
      title: 'How many events to show',
      type: 'number',
      options: {
        list: [
          { title: '3', value: 3 },
          { title: '4', value: 4 },
          { title: '6', value: 6 },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 3,
    }),
    defineField({
      name: 'linkLabel',
      title: 'Link text',
      type: 'string',
      initialValue: 'See all events',
    }),
    ...bandFields('white'),
  ],
  preview: {
    select: { title: 'header.title' },
    prepare({ title }) {
      return { title: title || 'Upcoming events', subtitle: 'Pulls the next Events' };
    },
  },
});
