import { defineType, defineField, defineArrayMember } from 'sanity';

// =============================================================================
// hubDelights — the small daily treats on the hub home, Board-extendable
// =============================================================================
// The greeting's "Today is National Kazoo Day" line and the giggle at the foot
// of the dashboard. Both ship with committed, kid-safe lists (fun-days.ts and
// giggles.ts) that stay as the floor; this document lets the Board ADD to them
// without a deploy. Board fun days override a committed one on the same date.
// Curated on purpose — never a live "national day" or joke API, which carry
// entries that have no place on a preschool site.
// =============================================================================
export const hubDelights = defineType({
  name: 'hubDelights',
  title: 'Little delights',
  type: 'document',
  icon: () => '🎉',
  fields: [
    defineField({
      name: 'funDays',
      title: 'Fun days',
      type: 'array',
      description:
        'Extra "Today is ..." days for the hub greeting. The site already knows a few dozen; yours are added on top, and yours wins when both name the same date.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'date',
              title: 'Date (MM-DD)',
              type: 'string',
              description: 'Month and day, e.g. 02-14. The year repeats on its own.',
              validation: (R) =>
                R.required()
                  .regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)
                  .error('Use MM-DD, e.g. 02-14 or 10-05.'),
            }),
            defineField({
              name: 'label',
              title: 'The day',
              type: 'string',
              description: 'e.g. "National Pancake Day".',
              validation: (R) => R.required().error('Name the day.'),
            }),
          ],
          preview: { select: { title: 'label', subtitle: 'date' } },
        }),
      ],
    }),
    defineField({
      name: 'giggles',
      title: 'Giggles',
      type: 'array',
      description:
        'Extra kid-safe jokes for the "giggle of the day". They join the built-in set and spread across the calendar on their own.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'setup',
              title: 'Setup',
              type: 'string',
              validation: (R) => R.required().error('Write the question.'),
            }),
            defineField({
              name: 'punchline',
              title: 'Punchline',
              type: 'string',
              validation: (R) => R.required().error('Write the punchline.'),
            }),
          ],
          preview: { select: { title: 'setup', subtitle: 'punchline' } },
        }),
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Little delights', subtitle: 'Fun days + giggle of the day' };
    },
  },
});
