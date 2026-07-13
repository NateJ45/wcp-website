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
      title: 'Parents & other adults',
      type: 'array',
      description:
        'One entry per adult, each with their own email and phone. Set the role — usually "Parent", but also "Grandparent", "Guardian", or a teacher/admin title.',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'name', title: 'Name', type: 'string', validation: (R) => R.required() },
            {
              name: 'role',
              title: 'Role',
              type: 'string',
              initialValue: 'Parent',
              description: 'e.g. Parent, Grandparent, Guardian, or a staff title.',
            },
            { name: 'email', title: 'Email', type: 'string' },
            { name: 'phone', title: 'Phone', type: 'string' },
          ],
          preview: { select: { title: 'name', subtitle: 'role' } },
        },
      ],
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
    defineField({
      name: 'photo',
      title: 'Family photo',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
    }),
    defineField({
      name: 'address',
      title: 'Home address (for the map)',
      type: 'string',
      description:
        'Street address, e.g. "123 Main St, West Chester, OH". Shown only on the gated directory map. After adding or changing it, ask Nathan to refresh the map pins so this one lands in the right spot.',
    }),
    defineField({
      name: 'location',
      title: 'Map pin (auto-filled from the address)',
      type: 'geopoint',
      description:
        'Filled in automatically from the address when the map pins are refreshed. You can also fine-tune it by hand if a pin is off.',
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
