import { defineType, defineField } from 'sanity';
import { iconField } from './_shared';

// Reusable "icon + title + short text" card. Used by the many card grids across
// the site (class "what they learn", reasons, facilities, etc.) and by the
// page-builder cardGridSection. `chip` (icon tint) and `statValue` (a big
// number above the body, for "facilities"-style cards) are optional extras the
// grids use; class "what they learn" just leaves them blank.
export const iconCard = defineType({
  name: 'iconCard',
  title: 'Card',
  type: 'object',
  fields: [
    iconField('icon', { description: 'Pick an icon (optional).' }),
    defineField({
      name: 'chip',
      title: 'Icon colour',
      type: 'string',
      options: {
        list: [
          { title: 'Sky', value: 'sky' },
          { title: 'Orange', value: 'orange' },
          { title: 'Amber', value: 'amber' },
          { title: 'Green', value: 'green' },
          { title: 'Navy', value: 'navy' },
        ],
        layout: 'dropdown',
      },
      initialValue: 'sky',
    }),
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (R) => R.required() }),
    defineField({
      name: 'statValue',
      title: 'Big number/label (optional)',
      type: 'string',
      description:
        'Shows a large number above the text, e.g. "2" on a "Dedicated classrooms" card.',
    }),
    defineField({ name: 'body', title: 'Text', type: 'text', rows: 3 }),
    defineField({
      name: 'href',
      title: 'Link (optional)',
      type: 'url',
      description:
        'Make the card link out, e.g. a Google Photos album or a ClassDojo invite. A small "→" link shows under the text.',
      validation: (R) => R.uri({ scheme: ['http', 'https', 'mailto', 'tel'] }),
    }),
    defineField({
      name: 'linkLabel',
      title: 'Link text (optional)',
      type: 'string',
      description: 'The words on the link, e.g. "Open the album". Defaults to "Open".',
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'body' },
  },
});
