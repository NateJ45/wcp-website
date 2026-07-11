import { defineType, defineField } from 'sanity';

// =============================================================================
// Staff member (teacher / administrator)
// =============================================================================
// One entry per person. Classes and pages LINK to this entry, so a teacher's
// name, photo, and bio are written once and stay consistent everywhere.
// =============================================================================
export const staff = defineType({
  name: 'staff',
  title: 'Staff Member',
  type: 'document',
  icon: () => '👩‍🏫',
  groups: [
    { name: 'identity', title: 'Who they are', default: true },
    { name: 'bio', title: 'Bio & quote' },
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      group: 'identity',
      description: 'e.g. "Erin Schmerr" (no title — set the title below).',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'honorific',
      title: 'Title',
      type: 'string',
      group: 'identity',
      description: 'e.g. "Mrs." Optional.',
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      group: 'identity',
      description: 'e.g. "Threes & Twos Teacher" or "Administrator".',
    }),
    defineField({
      name: 'years',
      title: 'Years at WCP',
      type: 'string',
      group: 'identity',
      description: 'Free text, e.g. "10+ years". Optional.',
    }),
    defineField({ name: 'email', title: 'Email', type: 'string', group: 'identity' }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      group: 'identity',
    }),
    defineField({
      name: 'pullQuote',
      title: 'Short quote',
      type: 'text',
      rows: 2,
      group: 'bio',
      description: 'A one-line quote used on the virtual tour and class pages.',
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'blockContent',
      group: 'bio',
      description: 'Their full introduction. Appears on the About and class pages.',
    }),
    defineField({
      name: 'order',
      title: 'Sort order',
      type: 'number',
      initialValue: 0,
      description: 'Lower numbers show first.',
    }),
  ],
  orderings: [{ title: 'Sort order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { name: 'name', honorific: 'honorific', role: 'role', media: 'photo' },
    prepare({ name, honorific, role, media }) {
      return { title: [honorific, name].filter(Boolean).join(' '), subtitle: role, media };
    },
  },
});
