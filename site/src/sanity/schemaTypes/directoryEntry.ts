import { defineType, defineField } from 'sanity';

// =============================================================================
// Family Directory entry — CONTAINS PII
// =============================================================================
// Real family names, contacts, children, and photos. This is exactly why the
// dataset is PRIVATE and reads are server-side behind the gate. Only entries
// with "Show in directory" enabled are ever rendered. Never expose on the
// public site or via the public CDN.
// =============================================================================
export const directoryEntry = defineType({
  name: 'directoryEntry',
  title: 'Directory — Family',
  type: 'document',
  icon: () => '👪',
  fields: [
    defineField({
      name: 'familyName',
      title: 'Family name',
      type: 'string',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'optedIn',
      title: 'Show in directory',
      description: 'Only families who opt in appear in the directory.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'parents',
      title: 'Parents / guardians',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'children',
      title: 'Children',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'name', title: 'Name', type: 'string' },
            {
              name: 'class',
              title: 'Class',
              type: 'string',
              options: {
                list: [
                  { title: 'Twos', value: 'twos' },
                  { title: 'Threes', value: 'threes' },
                  { title: 'Pre-K AM', value: 'pre-k-am' },
                  { title: 'Pre-K PM', value: 'pre-k-pm' },
                ],
              },
            },
          ],
          preview: { select: { title: 'name', subtitle: 'class' } },
        },
      ],
    }),
    defineField({ name: 'email', title: 'Email', type: 'string' }),
    defineField({ name: 'phone', title: 'Phone', type: 'string' }),
    defineField({
      name: 'photo',
      title: 'Family photo',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({ name: 'notes', title: 'Notes', type: 'text', rows: 2 }),
  ],
  orderings: [
    { title: 'Family name', name: 'name', by: [{ field: 'familyName', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'familyName', media: 'photo', optedIn: 'optedIn' },
    prepare({ title, media, optedIn }) {
      return { title, subtitle: optedIn ? 'Shown in directory' : 'Hidden (not opted in)', media };
    },
  },
});
