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
      validation: (R) => R.required().error('Add some text, or remove this section.'),
    }),
    defineField({
      name: 'callout',
      title: 'Callout below (optional)',
      type: 'callout',
      group: 'content',
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
  description: 'A bold band with a headline and a button or two (e.g. "Ready to enroll?").',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'The headline, e.g. "Come see us in person".',
      validation: (R) => R.required().error('The banner needs a headline.'),
    }),
    defineField({
      name: 'lead',
      title: 'Intro line',
      type: 'text',
      rows: 2,
      description: 'An optional sentence under the headline.',
    }),
    defineField({
      name: 'tone',
      title: 'Band color',
      type: 'string',
      options: {
        list: [
          { title: 'Navy (dark band)', value: 'navy' },
          { title: 'Warm cream', value: 'cream' },
        ],
        layout: 'radio',
      },
      initialValue: 'navy',
    }),
    // (`seam` removed 2026-08-23 — SectionRenderer computes the seam from
    // the neighbouring band colours and overwrote this toggle on every
    // render; docs/FIELD_AUDIT.md. Same reasoning as bandFields, which shed
    // its seam toggle earlier.)
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
      description: 'The short line shown in the strip.',
      validation: (R) => R.required().error('Write the message this strip shows.'),
    }),
    defineField({
      name: 'linkLabel',
      title: 'Link text (optional)',
      type: 'string',
      description: 'Leave blank for no link. If you fill this in, set where it goes below.',
      validation: (R) =>
        R.custom((label, context) => {
          const parent = context.parent as
            { linkType?: string; page?: unknown; url?: string } | undefined;
          if (!label) return true;
          const hasDest = parent?.linkType === 'url' ? !!parent?.url : !!parent?.page;
          return hasDest
            ? true
            : 'You added link text but no destination. Pick a page or web address below.';
        }).warning(),
    }),
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
      title: 'Web address / email',
      type: 'string',
      description: 'A full https:// link, or mailto:someone@example.org.',
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
      description: 'Heading over the phone/email column.',
      initialValue: 'Reach us',
    }),
    defineField({
      name: 'visitHeading',
      title: 'Right heading',
      type: 'string',
      group: 'content',
      description: 'Heading over the address/parking column.',
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
