import { defineType, defineField } from 'sanity';

// School-year calendar highlight (shown on Co-op Life + Why WCP as a timeline).
export const schoolYearEvent = defineType({
  name: 'schoolYearEvent',
  title: 'School-Year Event',
  type: 'document',
  icon: () => '📅',
  fields: [
    defineField({
      name: 'title',
      title: 'Event',
      type: 'string',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'month',
      title: 'Month / when',
      type: 'string',
      description: 'e.g. "September" or "May".',
    }),
    defineField({ name: 'body', title: 'Description', type: 'text', rows: 3 }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      description: 'Icon name, e.g. "cake", "gift".',
    }),
    defineField({
      name: 'accent',
      title: 'Accent color',
      type: 'string',
      options: {
        list: ['amber', 'green', 'orange', 'sky', 'navy'],
        layout: 'dropdown',
      },
      initialValue: 'sky',
    }),
    defineField({
      name: 'order',
      title: 'Sort order',
      type: 'number',
      initialValue: 0,
      description: 'Chronological order through the year (lower shows first).',
    }),
  ],
  orderings: [{ title: 'Sort order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'title', subtitle: 'month' } },
});
