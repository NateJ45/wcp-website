import { defineType, defineField, defineArrayMember } from 'sanity';
import { bandFields } from '../objects/_shared';

// =============================================================================
// Card sections: feature-card grid, stat band
// =============================================================================

export const cardGridSection = defineType({
  name: 'cardGridSection',
  title: 'Card grid',
  type: 'object',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'appearance', title: 'Appearance' },
  ],
  fields: [
    defineField({
      name: 'header',
      title: 'Heading (optional)',
      type: 'sectionHeader',
      group: 'content',
    }),
    defineField({
      name: 'cards',
      title: 'Cards',
      type: 'array',
      of: [defineArrayMember({ type: 'iconCard' })],
      group: 'content',
      description: 'Add one card per point. Each has an icon, a short title, and a line of text.',
      validation: (R) => R.min(1).error('Add at least one card, or remove this section.'),
    }),
    defineField({
      name: 'columns',
      title: 'Columns (on wide screens)',
      type: 'number',
      group: 'appearance',
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
      name: 'layout',
      title: 'Style',
      type: 'string',
      group: 'appearance',
      options: {
        list: [
          { title: 'Cards (tinted icon chips)', value: 'card' },
          { title: 'Compact icon list', value: 'compactIcon' },
        ],
        layout: 'radio',
      },
      initialValue: 'card',
    }),
    defineField({
      name: 'callout',
      title: 'Callout below the grid (optional)',
      type: 'callout',
      group: 'content',
    }),
    ...bandFields('white'),
  ],
  preview: {
    select: { title: 'header.title', cards: 'cards' },
    prepare({ title, cards }) {
      const n = Array.isArray(cards) ? cards.length : 0;
      return { title: title || 'Card grid', subtitle: `${n} card${n === 1 ? '' : 's'}` };
    },
  },
});

export const statBandSection = defineType({
  name: 'statBandSection',
  title: 'Stats band',
  type: 'object',
  description: 'A navy band of big numbers (e.g. "55+ years", "$70 tuition").',
  fields: [
    defineField({
      name: 'ariaLabel',
      title: 'Section label (for screen readers)',
      type: 'string',
      // Optional since 2026-08-23 (field audit): a required screen-reader
      // string is not parent work; the renderer falls back to "By the
      // numbers".
      description:
        'A short name a screen reader announces for this band. Visitors don’t see it. Blank uses "By the numbers".',
      initialValue: 'By the numbers',
    }),
    defineField({
      name: 'stats',
      title: 'Stats',
      type: 'array',
      description: 'Add 1 to 4 big numbers, e.g. "55+ years" or "$70 tuition".',
      validation: (R) =>
        R.min(1)
          .error('Add at least one number, or remove this section.')
          .max(4)
          .error('Keep it to four numbers so the band stays readable.'),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'stat',
          fields: [
            {
              name: 'value',
              title: 'Number',
              type: 'string',
              description: 'The big number itself, e.g. "55" or "70".',
              validation: (R) => R.required().error('Every stat needs a number.'),
            },
            { name: 'prefix', title: 'Prefix (e.g. $)', type: 'string' },
            { name: 'suffix', title: 'Suffix (e.g. +)', type: 'string' },
            {
              name: 'label',
              title: 'Label',
              type: 'string',
              description: 'What the number means, e.g. "years serving families".',
              validation: (R) => R.required().error('Every stat needs a label under the number.'),
            },
            {
              name: 'note',
              title: 'Note under it',
              type: 'string',
              description: 'An optional smaller line under the label.',
            },
          ],
          preview: {
            select: { value: 'value', label: 'label' },
            prepare({ value, label }) {
              return { title: value, subtitle: label };
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { stats: 'stats' },
    prepare({ stats }) {
      const n = Array.isArray(stats) ? stats.length : 0;
      return { title: 'Stats band', subtitle: `${n} stat${n === 1 ? '' : 's'}` };
    },
  },
});
