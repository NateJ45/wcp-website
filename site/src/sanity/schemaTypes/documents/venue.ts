import { defineType, defineField } from 'sanity';

// =============================================================================
// venue — a reusable place (a second campus, a field-trip spot, a church hall)
// =============================================================================
// A saved location the school uses more than once, so an event can point at it
// instead of retyping the address every time. Optional everywhere: an event
// with no venue still uses its own typed location or the school address. This
// is also the seed of multi-campus support — if the school ever runs classes at
// a second building, that building is a venue here. (Classes/staff don't
// reference venues yet; that's a later step when a real second campus exists.)
// =============================================================================
export const venue = defineType({
  name: 'venue',
  title: 'Location / venue',
  type: 'document',
  icon: () => '📍',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description:
        'What you call this place, e.g. "Crestview Church hall" or "Voice of America Park".',
      validation: (R) => R.required().error('Give the place a name.'),
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'text',
      rows: 2,
      description: 'The full address, used to show directions.',
    }),
    defineField({
      name: 'note',
      title: 'Note (optional)',
      type: 'string',
      description:
        'A short direction or reminder, e.g. "Enter through Door 5, park in the back lot".',
    }),
    defineField({
      name: 'isPrimary',
      title: 'This is the main school building',
      type: 'boolean',
      // Future-use flag nothing reads yet; hidden until a second campus
      // exists (field audit 2026-08-23).
      hidden: true,
      initialValue: false,
      description: 'Turn on for the school’s own campus. (For future use as the school grows.)',
    }),
  ],
  preview: {
    select: { name: 'name', address: 'address', primary: 'isPrimary' },
    prepare({ name, address, primary }) {
      return {
        title: `${primary ? '🏫 ' : ''}${name || 'Location'}`,
        subtitle: address ? address.split('\n')[0] : undefined,
      };
    },
  },
});
