import { defineType, defineField } from 'sanity';
import { bandFields } from '../objects/_shared';

// =============================================================================
// Display sections for the future-proofing document types
// =============================================================================
// Config-only in Sanity; each bridge fetches its documents at build time (like
// the News/Events sections) and hides itself when there's nothing to show.
// =============================================================================

export const programCardsSection = defineType({
  name: 'programCardsSection',
  title: 'Programs',
  type: 'object',
  fields: [
    defineField({ name: 'header', title: 'Heading (optional)', type: 'sectionHeader' }),
    ...bandFields('white'),
  ],
  preview: {
    select: { title: 'header.title' },
    prepare({ title }) {
      return { title: title || 'Programs', subtitle: 'Pulls Program documents' };
    },
  },
});

export const boardMembersSection = defineType({
  name: 'boardMembersSection',
  title: 'Board / leadership',
  type: 'object',
  fields: [
    defineField({ name: 'header', title: 'Heading (optional)', type: 'sectionHeader' }),
    ...bandFields('white'),
  ],
  preview: {
    select: { title: 'header.title' },
    prepare({ title }) {
      return { title: title || 'Board / leadership', subtitle: 'Pulls Board documents' };
    },
  },
});

export const logoStripSection = defineType({
  name: 'logoStripSection',
  title: 'Logo strip',
  type: 'object',
  description: 'A row of logos — partners/sponsors or accreditation badges.',
  fields: [
    defineField({ name: 'header', title: 'Heading (optional)', type: 'sectionHeader' }),
    defineField({
      name: 'source',
      title: 'Show',
      type: 'string',
      options: {
        list: [
          { title: 'Partners / sponsors', value: 'partners' },
          { title: 'Accreditations / licenses', value: 'credentials' },
        ],
        layout: 'radio',
      },
      initialValue: 'partners',
    }),
    ...bandFields('grey'),
  ],
  preview: {
    select: { title: 'header.title', source: 'source' },
    prepare({ title, source }) {
      return {
        title: title || 'Logo strip',
        subtitle: source === 'credentials' ? 'Accreditations' : 'Partners',
      };
    },
  },
});

export const campaignSection = defineType({
  name: 'campaignSection',
  title: 'Fundraising progress',
  type: 'object',
  description: 'Shows the current campaign with a progress bar. Hides when none is running.',
  fields: [
    defineField({ name: 'header', title: 'Heading (optional)', type: 'sectionHeader' }),
    ...bandFields('cream'),
  ],
  preview: {
    select: { title: 'header.title' },
    prepare({ title }) {
      return { title: title || 'Fundraising progress', subtitle: 'Pulls the active campaign' };
    },
  },
});

export const jobsSection = defineType({
  name: 'jobsSection',
  title: 'Open positions',
  type: 'object',
  fields: [
    defineField({ name: 'header', title: 'Heading (optional)', type: 'sectionHeader' }),
    defineField({
      name: 'emptyMessage',
      title: 'Message when there are no openings',
      type: 'string',
      initialValue: 'No open positions right now — check back soon.',
    }),
    ...bandFields('white'),
  ],
  preview: {
    select: { title: 'header.title' },
    prepare({ title }) {
      return { title: title || 'Open positions', subtitle: 'Pulls open Job postings' };
    },
  },
});

export const downloadsSection = defineType({
  name: 'downloadsSection',
  title: 'Downloads & resources',
  type: 'object',
  fields: [
    defineField({ name: 'header', title: 'Heading (optional)', type: 'sectionHeader' }),
    defineField({
      name: 'category',
      title: 'Show',
      type: 'string',
      options: {
        list: [
          { title: 'All resources', value: 'all' },
          { title: 'Handbook & policies', value: 'handbook' },
          { title: 'Calendar', value: 'calendar' },
          { title: 'Enrollment & forms', value: 'forms' },
          { title: 'Other', value: 'other' },
        ],
        layout: 'dropdown',
      },
      initialValue: 'all',
    }),
    ...bandFields('white'),
  ],
  preview: {
    select: { title: 'header.title', category: 'category' },
    prepare({ title, category }) {
      return { title: title || 'Downloads & resources', subtitle: category || 'all' };
    },
  },
});

export const albumSection = defineType({
  name: 'albumSection',
  title: 'Photo album',
  type: 'object',
  fields: [
    defineField({ name: 'header', title: 'Heading (optional)', type: 'sectionHeader' }),
    defineField({
      name: 'album',
      title: 'Album',
      type: 'reference',
      to: [{ type: 'photoAlbum' }],
      validation: (R) => R.required(),
    }),
    ...bandFields('white'),
  ],
  preview: {
    select: { title: 'header.title', album: 'album.title' },
    prepare({ title, album }) {
      return { title: title || album || 'Photo album', subtitle: 'Photo album' };
    },
  },
});
