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
  description: 'A row of program cards, pulled from your Program documents. Hides when none exist.',
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
  description:
    'A people grid, pulled from your Board / leadership documents. Hides when none exist.',
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
  description:
    'Shows a progress bar for each active fundraising campaign (one, or several side by side). Hides when none is running.',
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
      const labels: Record<string, string> = {
        all: 'All resources',
        handbook: 'Handbook & policies',
        calendar: 'Calendar',
        forms: 'Enrollment & forms',
        other: 'Other',
      };
      return {
        title: title || 'Downloads & resources',
        subtitle: labels[category] ?? 'All resources',
      };
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
      description: 'Pick a Photo album to show here.',
      validation: (R) => R.required().error('Pick which album to show, or remove this section.'),
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

export const instagramSection = defineType({
  name: 'instagramSection',
  title: 'Instagram — "Life inside WCP"',
  type: 'object',
  description:
    'The bulletin-board social gallery. Shows the live Instagram feed when the site has an Instagram token; otherwise shows the fallback album below.',
  fields: [
    defineField({ name: 'header', title: 'Heading (optional)', type: 'sectionHeader' }),
    defineField({
      name: 'fallbackAlbum',
      title: 'Fallback album',
      type: 'reference',
      to: [{ type: 'photoAlbum' }],
      description:
        'Photos shown until the live Instagram feed is connected (or if it is ever unavailable).',
    }),
    ...bandFields('navy'),
  ],
  preview: {
    select: { title: 'header.title' },
    prepare({ title }) {
      return { title: title || 'Life inside WCP', subtitle: 'Instagram gallery' };
    },
  },
});
