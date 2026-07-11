import { defineType, defineField, defineArrayMember } from 'sanity';
import { bandFields } from '../objects/_shared';

// =============================================================================
// Basic sections: prose, CTA banner, notice bar, contact details
// =============================================================================

export const proseSection = defineType({
  name: 'proseSection',
  title: 'Text section',
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
      name: 'body',
      title: 'Text',
      type: 'richProse',
      group: 'content',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'narrow',
      title: 'Narrow column (centered)',
      type: 'boolean',
      group: 'appearance',
      description: 'Constrain the text to a readable centered column (for story/intro copy).',
      initialValue: true,
    }),
    ...bandFields('white'),
  ],
  preview: {
    select: { title: 'header.title' },
    prepare({ title }) {
      return { title: title || 'Text section', subtitle: 'Prose' };
    },
  },
});

export const ctaSection = defineType({
  name: 'ctaSection',
  title: 'Call-to-action banner',
  type: 'object',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'lead', title: 'Intro line', type: 'text', rows: 2 }),
    defineField({
      name: 'tone',
      title: 'Style',
      type: 'string',
      options: {
        list: [
          { title: 'Navy band', value: 'navy' },
          { title: 'Cream band', value: 'cream' },
        ],
        layout: 'radio',
      },
      initialValue: 'navy',
    }),
    defineField({
      name: 'seam',
      title: 'Cloud seam at top',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'actions',
      title: 'Buttons',
      type: 'array',
      of: [defineArrayMember({ type: 'actionButton' })],
      validation: (R) => R.max(2).warning('Two buttons is the clean maximum.'),
    }),
    defineField({ name: 'note', title: 'Note under the buttons (optional)', type: 'inlineText' }),
  ],
  preview: {
    select: { title: 'title' },
    prepare({ title }) {
      return { title: title || 'Call to action', subtitle: 'CTA banner' };
    },
  },
});

export const noticeBarSection = defineType({
  name: 'noticeBarSection',
  title: 'Announcement strip',
  type: 'object',
  description:
    'A slim cream bar with a short message and one link (e.g. the homepage playdates notice).',
  fields: [
    defineField({
      name: 'text',
      title: 'Message',
      type: 'string',
      validation: (R) => R.required(),
    }),
    defineField({ name: 'linkLabel', title: 'Link text (optional)', type: 'string' }),
    defineField({
      name: 'linkType',
      title: 'Link goes to',
      type: 'string',
      options: {
        list: [
          { title: 'A page on this site', value: 'page' },
          { title: 'A web address / email', value: 'url' },
        ],
        layout: 'radio',
      },
      initialValue: 'page',
      hidden: ({ parent }) => !parent?.linkLabel,
    }),
    defineField({
      name: 'page',
      title: 'Page',
      type: 'reference',
      to: [{ type: 'page' }],
      hidden: ({ parent }) => !parent?.linkLabel || parent?.linkType === 'url',
    }),
    defineField({
      name: 'url',
      title: 'URL / email',
      type: 'string',
      hidden: ({ parent }) => !parent?.linkLabel || parent?.linkType !== 'url',
    }),
  ],
  preview: {
    select: { title: 'text' },
    prepare({ title }) {
      return { title: title || 'Announcement', subtitle: 'Announcement strip' };
    },
  },
});

export const contactDetailsSection = defineType({
  name: 'contactDetailsSection',
  title: 'Contact details block',
  type: 'object',
  description:
    'Phone / email / address / parking, pulled from Site Settings. Add this to the contact page.',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'appearance', title: 'Appearance' },
  ],
  fields: [
    defineField({
      name: 'reachHeading',
      title: 'Left heading',
      type: 'string',
      group: 'content',
      initialValue: 'Reach us',
    }),
    defineField({
      name: 'visitHeading',
      title: 'Right heading',
      type: 'string',
      group: 'content',
      initialValue: 'Visit',
    }),
    defineField({
      name: 'showParking',
      title: 'Show the parking / entry callout',
      type: 'boolean',
      group: 'content',
      initialValue: true,
    }),
    ...bandFields('grey'),
  ],
  preview: {
    prepare() {
      return { title: 'Contact details', subtitle: 'Phone / email / address (from Site Settings)' };
    },
  },
});
