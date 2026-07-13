import { defineType, defineField, defineArrayMember } from 'sanity';
import { bandFields, iconField } from '../objects/_shared';

// =============================================================================
// Self-contained sections — no new document types needed
// =============================================================================
// video, map, accordion, quick facts, pull-quote, countdown. All brand-locked
// (labels + content only). The video/map embeds are CLICK-TO-LOAD in the
// renderers, so no third-party iframe (Google/YouTube) loads until a visitor
// asks for it — keeps every page private + fast.
// =============================================================================

export const videoSection = defineType({
  name: 'videoSection',
  title: 'Video',
  type: 'object',
  fields: [
    defineField({ name: 'header', title: 'Heading (optional)', type: 'sectionHeader' }),
    defineField({
      name: 'videoUrl',
      title: 'Video link',
      type: 'url',
      description: 'Paste a YouTube or Vimeo link.',
      validation: (R) =>
        R.required()
          .uri({ scheme: ['http', 'https'] })
          .error('Paste a full YouTube or Vimeo link (starting with https://).'),
    }),
    defineField({
      name: 'thumbnail',
      title: 'Cover image (optional)',
      type: 'figureImage',
      description: 'Shown before the video plays. YouTube links use their own thumbnail if blank.',
    }),
    defineField({ name: 'caption', title: 'Caption (optional)', type: 'string' }),
    ...bandFields('white'),
  ],
  preview: {
    select: { title: 'header.title' },
    prepare({ title }) {
      return { title: title || 'Video', subtitle: 'Video' };
    },
  },
});

export const mapSection = defineType({
  name: 'mapSection',
  title: 'Map & directions',
  type: 'object',
  fields: [
    defineField({ name: 'header', title: 'Heading (optional)', type: 'sectionHeader' }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'text',
      rows: 2,
      description: 'The address to show and to power the "Get directions" button.',
      validation: (R) => R.required().error('Enter the address the map should show.'),
    }),
    ...bandFields('white'),
  ],
  preview: {
    select: { title: 'header.title', address: 'address' },
    prepare({ title, address }) {
      return { title: title || 'Map & directions', subtitle: address };
    },
  },
});

export const accordionSection = defineType({
  name: 'accordionSection',
  title: 'Accordion',
  type: 'object',
  description: 'Collapsible rows — good for policies or long lists.',
  fields: [
    defineField({ name: 'header', title: 'Heading (optional)', type: 'sectionHeader' }),
    defineField({
      name: 'items',
      title: 'Rows',
      type: 'array',
      description: 'Each row is a label people click to expand, with content underneath.',
      validation: (R) => R.min(1).error('Add at least one row, or remove this section.'),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'row',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              description: 'The line people click to open the row.',
              validation: (R) => R.required().error('Give the row a label.'),
            }),
            defineField({ name: 'body', title: 'Content', type: 'inlineText' }),
          ],
          preview: { select: { title: 'label' } },
        }),
      ],
    }),
    ...bandFields('white'),
  ],
  preview: {
    select: { title: 'header.title', items: 'items' },
    prepare({ title, items }) {
      const n = Array.isArray(items) ? items.length : 0;
      return { title: title || 'Accordion', subtitle: `${n} row${n === 1 ? '' : 's'}` };
    },
  },
});

export const quickFactsSection = defineType({
  name: 'quickFactsSection',
  title: 'Quick facts',
  type: 'object',
  description: 'A row of key facts (hours, ages, ratios…).',
  fields: [
    defineField({ name: 'header', title: 'Heading (optional)', type: 'sectionHeader' }),
    defineField({
      name: 'facts',
      title: 'Facts',
      type: 'array',
      description: 'Add 1 to 6 quick facts, each with an icon, a value, and a label.',
      validation: (R) =>
        R.min(1)
          .error('Add at least one fact, or remove this section.')
          .max(6)
          .error('Keep it to six facts so the row stays tidy.'),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'fact',
          fields: [
            iconField('icon'),
            defineField({
              name: 'value',
              title: 'Value',
              type: 'string',
              description: 'e.g. "9am – 12pm" or "1:8".',
              validation: (R) => R.required().error('Every fact needs a value.'),
            }),
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              description: 'e.g. "Class hours" or "Teacher ratio".',
              validation: (R) => R.required().error('Every fact needs a label.'),
            }),
          ],
          preview: {
            select: { title: 'value', subtitle: 'label' },
          },
        }),
      ],
    }),
    ...bandFields('grey'),
  ],
  preview: {
    select: { title: 'header.title', facts: 'facts' },
    prepare({ title, facts }) {
      const n = Array.isArray(facts) ? facts.length : 0;
      return { title: title || 'Quick facts', subtitle: `${n} fact${n === 1 ? '' : 's'}` };
    },
  },
});

export const pullQuoteSection = defineType({
  name: 'pullQuoteSection',
  title: 'Big statement',
  type: 'object',
  description: 'One large quote or statement (e.g. your philosophy).',
  fields: [
    defineField({
      name: 'quote',
      title: 'Statement',
      type: 'text',
      rows: 3,
      description: 'The big line, e.g. your philosophy in one sentence.',
      validation: (R) => R.required().error('Write the statement to feature.'),
    }),
    defineField({ name: 'attribution', title: 'Attribution (optional)', type: 'string' }),
    ...bandFields('cream'),
  ],
  preview: {
    select: { quote: 'quote' },
    prepare({ quote }) {
      return { title: 'Big statement', subtitle: quote };
    },
  },
});

export const countdownSection = defineType({
  name: 'countdownSection',
  title: 'Countdown',
  type: 'object',
  description: 'A live countdown to a date (open house, enrollment deadline…).',
  fields: [
    defineField({ name: 'header', title: 'Heading (optional)', type: 'sectionHeader' }),
    defineField({
      name: 'targetDate',
      title: 'Counting down to',
      type: 'datetime',
      description: 'The date and time the countdown ends.',
      validation: (R) => R.required().error('Pick the date to count down to.'),
    }),
    defineField({
      name: 'completedMessage',
      title: 'Message once it arrives',
      type: 'string',
      initialValue: "It's here!",
    }),
    ...bandFields('navy'),
  ],
  preview: {
    select: { title: 'header.title', date: 'targetDate' },
    prepare({ title, date }) {
      const when = date ? new Date(date).toLocaleDateString('en-US', { timeZone: 'UTC' }) : '';
      return { title: title || 'Countdown', subtitle: when };
    },
  },
});
