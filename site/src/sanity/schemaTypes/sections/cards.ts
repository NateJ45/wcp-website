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
      validation: (R) => R.min(1),
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
      title: 'Accessible label',
      type: 'string',
      description: 'A short name for screen readers, e.g. "West Chester Preschool by the numbers".',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'stats',
      title: 'Stats',
      type: 'array',
      validation: (R) => R.min(1).max(4),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'stat',
          fields: [
            { name: 'value', title: 'Number', type: 'string', validation: (R) => R.required() },
            { name: 'prefix', title: 'Prefix (e.g. $)', type: 'string' },
            { name: 'suffix', title: 'Suffix (e.g. +)', type: 'string' },
            { name: 'label', title: 'Label', type: 'string', validation: (R) => R.required() },
            { name: 'note', title: 'Note under it', type: 'string' },
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
