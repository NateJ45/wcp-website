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
    { name: 'identity', title: 'Who they are' },
    { name: 'bio', title: 'Bio & quote' },
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      group: 'identity',
      description: 'e.g. "Erin Schmerr" (no title — set the title below).',
      validation: (R) => R.required().error('Every staff member needs a name.'),
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
    // DEAD (field audit 2026-08-23): its only query lost all callers. Hidden.
    defineField({
      hidden: true,
      name: 'years',
      title: 'Years at WCP',
      type: 'string',
      group: 'identity',
      description: 'Free text, e.g. "10+ years". Optional.',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      group: 'identity',
      description: 'Shown publicly on their profile. Leave blank to hide it.',
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      group: 'identity',
    }),
    // DEAD (field audit 2026-08-23): its only query lost all callers. Hidden.
    defineField({
      hidden: true,
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
    // Legacy manual sort — staff never renders as an ordered list on the site
    // (pages pick people by hand), so the number did nothing. Hidden, not
    // removed, so old documents keep validating.
    defineField({
      name: 'order',
      title: 'Sort order',
      type: 'number',
      initialValue: 0,
      hidden: true,
    }),
  ],
  orderings: [{ title: 'Name', name: 'name', by: [{ field: 'name', direction: 'asc' }] }],
  preview: {
    select: { name: 'name', honorific: 'honorific', role: 'role', media: 'photo' },
    prepare({ name, honorific, role, media }) {
      return { title: [honorific, name].filter(Boolean).join(' '), subtitle: role, media };
    },
  },
});
