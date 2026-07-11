import { defineType, defineField } from 'sanity';
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list';

// A co-op job/role (shown on the Family Hub co-op jobs page, grouped by tier).
export const coopRole = defineType({
  name: 'coopRole',
  title: 'Co-op Role',
  type: 'document',
  icon: () => '🤝',
  fields: [
    defineField({
      name: 'name',
      title: 'Role',
      type: 'string',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'tier',
      title: 'Group',
      type: 'string',
      options: {
        list: [
          { title: 'Executive Board', value: 'board' },
          { title: 'Cabinet Chairs', value: 'chairs' },
          { title: 'Class Representatives', value: 'reps' },
          { title: 'Committee Members', value: 'committee' },
        ],
        layout: 'dropdown',
      },
      validation: (R) => R.required(),
    }),
    defineField({ name: 'icon', title: 'Icon', type: 'string' }),
    defineField({
      name: 'team',
      title: 'Team size',
      type: 'string',
      description: 'e.g. "4 members" or "One per class". Optional.',
    }),
    defineField({
      name: 'reportsTo',
      title: 'Reports to',
      type: 'string',
      description: 'e.g. "Reports to VP". Optional.',
    }),
    defineField({
      name: 'stipend',
      title: 'Stipend',
      type: 'string',
      description: 'e.g. "$150 stipend". Only for Board roles.',
    }),
    defineField({ name: 'body', title: 'What they do', type: 'text', rows: 3 }),
    // Legacy manual sort — superseded by drag-to-reorder (orderRank), hidden.
    // Note: roles are grouped by tier on the page, so dragging reorders WITHIN
    // a tier; the tier is shown in the list so that's clear.
    defineField({
      name: 'order',
      title: 'Sort order',
      type: 'number',
      initialValue: 0,
      hidden: true,
    }),
    orderRankField({ type: 'coopRole' }),
  ],
  orderings: [orderRankOrdering],
  preview: { select: { title: 'name', subtitle: 'tier' } },
});
