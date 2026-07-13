import { defineType, defineField } from 'sanity';
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list';
import { iconField } from '../objects/_shared';

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
      validation: (R) => R.required().error('Name the event, e.g. "Fall Festival".'),
    }),
    defineField({
      name: 'month',
      title: 'Month / when',
      type: 'string',
      description: 'e.g. "September" or "May".',
    }),
    defineField({ name: 'body', title: 'Description', type: 'text', rows: 3 }),
    iconField('icon', {
      description: 'The little picture shown on the timeline (optional).',
    }),
    defineField({
      name: 'accent',
      title: 'Accent color',
      type: 'string',
      options: {
        list: [
          { title: 'Amber', value: 'amber' },
          { title: 'Green', value: 'green' },
          { title: 'Orange', value: 'orange' },
          { title: 'Sky', value: 'sky' },
          { title: 'Navy', value: 'navy' },
        ],
        layout: 'dropdown',
      },
      initialValue: 'sky',
    }),
    // Legacy manual sort — superseded by drag-to-reorder (orderRank), hidden.
    defineField({
      name: 'order',
      title: 'Sort order',
      type: 'number',
      initialValue: 0,
      hidden: true,
    }),
    orderRankField({ type: 'schoolYearEvent' }),
  ],
  orderings: [orderRankOrdering],
  preview: { select: { title: 'title', subtitle: 'month' } },
});
