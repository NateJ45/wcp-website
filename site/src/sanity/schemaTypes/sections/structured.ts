import { defineType, defineField, defineArrayMember } from 'sanity';
import { bandFields } from '../objects/_shared';

// =============================================================================
// Structured sections: schedule timeline, step list, compare table, gallery,
// split media rows.
// =============================================================================

export const scheduleSection = defineType({
  name: 'scheduleSection',
  title: 'Daily schedule',
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
      name: 'intro',
      title: 'Intro line (optional)',
      type: 'text',
      rows: 2,
      group: 'content',
    }),
    defineField({
      name: 'entries',
      title: 'Schedule',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'entry',
          fields: [
            { name: 'time', title: 'Time', type: 'string' },
            {
              name: 'title',
              title: 'What happens',
              type: 'string',
              validation: (R) => R.required(),
            },
            { name: 'description', title: 'Details', type: 'text', rows: 2 },
          ],
          preview: { select: { title: 'title', subtitle: 'time' } },
        }),
      ],
      validation: (R) => R.min(1),
    }),
    ...bandFields('white'),
  ],
  preview: {
    select: { title: 'header.title', entries: 'entries' },
    prepare({ title, entries }) {
      const n = Array.isArray(entries) ? entries.length : 0;
      return { title: title || 'Daily schedule', subtitle: `${n} step${n === 1 ? '' : 's'}` };
    },
  },
});

export const stepListSection = defineType({
  name: 'stepListSection',
  title: 'Numbered steps',
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
      name: 'steps',
      title: 'Steps',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'step',
          fields: [
            { name: 'title', title: 'Title', type: 'string', validation: (R) => R.required() },
            { name: 'body', title: 'Text', type: 'text', rows: 3 },
            { name: 'note', title: 'Note (optional)', type: 'string' },
          ],
          preview: { select: { title: 'title' } },
        }),
      ],
      validation: (R) => R.min(1),
    }),
    defineField({
      name: 'footnote',
      title: 'Footnote (optional)',
      type: 'string',
      group: 'content',
    }),
    ...bandFields('white'),
  ],
  preview: {
    select: { title: 'header.title', steps: 'steps' },
    prepare({ title, steps }) {
      const n = Array.isArray(steps) ? steps.length : 0;
      return { title: title || 'Numbered steps', subtitle: `${n} step${n === 1 ? '' : 's'}` };
    },
  },
});

export const compareSection = defineType({
  name: 'compareSection',
  title: 'Comparison table',
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
      name: 'wcpLabel',
      title: 'Our column heading',
      type: 'string',
      group: 'content',
      initialValue: 'WCP',
    }),
    defineField({
      name: 'typicalLabel',
      title: 'Other column heading',
      type: 'string',
      group: 'content',
      initialValue: 'Typical preschool',
    }),
    defineField({
      name: 'rows',
      title: 'Rows',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'row',
          fields: [
            { name: 'feature', title: 'Feature', type: 'string', validation: (R) => R.required() },
            { name: 'wcp', title: 'Us', type: 'string' },
            { name: 'typical', title: 'Them', type: 'string' },
          ],
          preview: { select: { title: 'feature' } },
        }),
      ],
      validation: (R) => R.min(1),
    }),
    ...bandFields('white'),
  ],
  preview: {
    select: { title: 'header.title', rows: 'rows' },
    prepare({ title, rows }) {
      const n = Array.isArray(rows) ? rows.length : 0;
      return { title: title || 'Comparison table', subtitle: `${n} row${n === 1 ? '' : 's'}` };
    },
  },
});

export const gallerySection = defineType({
  name: 'gallerySection',
  title: 'Photo gallery',
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
      name: 'photos',
      title: 'Photos',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({ type: 'figureImage' })],
      validation: (R) => R.min(1),
    }),
    ...bandFields('white'),
  ],
  preview: {
    select: { photos: 'photos', title: 'header.title' },
    prepare({ photos, title }) {
      const n = Array.isArray(photos) ? photos.length : 0;
      return { title: title || 'Photo gallery', subtitle: `${n} photo${n === 1 ? '' : 's'}` };
    },
  },
});

export const splitMediaSection = defineType({
  name: 'splitMediaSection',
  title: 'Image + text rows',
  type: 'object',
  description: 'Alternating photo-and-text rows (e.g. the virtual-tour rooms and teachers).',
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
      name: 'rows',
      title: 'Rows',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'row',
          fields: [
            {
              name: 'image',
              title: 'Photo',
              type: 'image',
              options: { hotspot: true },
              validation: (R) => R.required(),
            },
            {
              name: 'alt',
              title: 'Photo alt text',
              type: 'string',
              validation: (R) => R.required(),
            },
            { name: 'eyebrow', title: 'Small label (optional)', type: 'string' },
            { name: 'title', title: 'Title', type: 'string', validation: (R) => R.required() },
            { name: 'body', title: 'Text', type: 'text', rows: 3 },
            { name: 'linkLabel', title: 'Link text (optional)', type: 'string' },
            { name: 'linkUrl', title: 'Link URL / anchor (optional)', type: 'string' },
          ],
          preview: { select: { title: 'title', media: 'image' } },
        }),
      ],
      validation: (R) => R.min(1),
    }),
    ...bandFields('white'),
  ],
  preview: {
    select: { title: 'header.title', rows: 'rows' },
    prepare({ title, rows }) {
      const n = Array.isArray(rows) ? rows.length : 0;
      return { title: title || 'Image + text rows', subtitle: `${n} row${n === 1 ? '' : 's'}` };
    },
  },
});
