import { defineType, defineField, defineArrayMember } from 'sanity';
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list';

// =============================================================================
// Class / Program
// =============================================================================
// One entry per class (Twos, Threes, Pre-K AM/PM — add more any time, e.g. a
// Summer class). This is the SINGLE SOURCE for a class's schedule, ages, and
// tuition: the public class page, the tuition table, and the Family Hub all read
// from here. Change a time or price once and it updates everywhere.
// =============================================================================
export const classType = defineType({
  name: 'class',
  title: 'Class',
  type: 'document',
  icon: () => '🎒',
  groups: [
    { name: 'basics', title: 'Basics' },
    { name: 'schedule', title: 'Schedule & ages' },
    { name: 'tuition', title: 'Tuition & payment' },
    { name: 'details', title: 'Page details' },
  ],
  fields: [
    // Basics
    defineField({
      name: 'name',
      title: 'Class name',
      type: 'string',
      group: 'basics',
      description: 'e.g. "Twos" or "Pre-K AM".',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      group: 'basics',
      options: { source: 'name', maxLength: 40 },
      description: 'The web address piece, e.g. "twos". Click Generate.',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      group: 'basics',
      description: 'Icon name, e.g. "star", "sprout", "sun", "moon".',
    }),
    defineField({
      name: 'color',
      title: 'Class color',
      type: 'string',
      group: 'basics',
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
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      group: 'basics',
      description: 'A short positioning line, e.g. "A gentle first taste of school".',
    }),
    defineField({
      name: 'teacher',
      title: 'Teacher',
      type: 'reference',
      to: [{ type: 'staff' }],
      group: 'basics',
      description: 'The teacher for this class. Pick from Staff — their name/bio come from there.',
    }),

    // Schedule & ages
    defineField({
      name: 'days',
      title: 'Days',
      type: 'string',
      group: 'schedule',
      description: 'e.g. "Thursdays" or "Mon, Tue, Wed".',
    }),
    defineField({
      name: 'daysCount',
      title: 'Days per week (label)',
      type: 'string',
      group: 'schedule',
      description: 'e.g. "1 day per week".',
    }),
    defineField({
      name: 'time',
      title: 'Time',
      type: 'string',
      group: 'schedule',
      description: 'e.g. "9:30 am – 12:00 pm".',
    }),
    defineField({
      name: 'age',
      title: 'Age requirement',
      type: 'string',
      group: 'schedule',
      description: 'e.g. "Age 2 by Sept 30".',
    }),
    defineField({
      name: 'classSizeCap',
      title: 'Max class size',
      type: 'number',
      group: 'schedule',
      description: 'The largest number of children in this class.',
    }),
    defineField({
      name: 'dailySchedule',
      title: 'A day in this class',
      type: 'array',
      group: 'schedule',
      description: 'The daily flow shown on the class page (optional).',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            { name: 'time', title: 'Time', type: 'string' },
            { name: 'title', title: 'What happens', type: 'string' },
            { name: 'description', title: 'Details', type: 'text', rows: 2 },
          ],
          preview: { select: { title: 'title', subtitle: 'time' } },
        }),
      ],
    }),

    // Tuition & payment
    defineField({
      name: 'monthly',
      title: 'Monthly tuition',
      type: 'string',
      group: 'tuition',
      description: 'As shown, e.g. "$70".',
    }),
    defineField({ name: 'annual', title: 'Annual tuition', type: 'string', group: 'tuition' }),
    defineField({
      name: 'studentFee',
      title: 'Student fee (per year)',
      type: 'string',
      group: 'tuition',
      description: 'e.g. "$45".',
    }),
    defineField({
      name: 'payId',
      title: 'PayPal button ID — tuition',
      type: 'string',
      group: 'tuition',
      description: 'The PayPal hosted-button ID for paying this class’s tuition. Ask if unsure.',
    }),
    defineField({
      name: 'studentFeePayId',
      title: 'PayPal button ID — student fee',
      type: 'string',
      group: 'tuition',
    }),

    // Page details
    defineField({
      name: 'heroImage',
      title: 'Hero photo',
      type: 'image',
      options: { hotspot: true },
      group: 'details',
    }),
    defineField({
      name: 'whatTheyLearn',
      title: 'What they learn',
      type: 'array',
      of: [defineArrayMember({ type: 'iconCard' })],
      group: 'details',
      description: 'The learning-focus cards shown on the class page.',
    }),
    // Legacy manual sort — superseded by drag-to-reorder (orderRank), hidden.
    defineField({
      name: 'order',
      title: 'Sort order',
      type: 'number',
      initialValue: 0,
      hidden: true,
    }),
    orderRankField({ type: 'class' }),
  ],
  orderings: [orderRankOrdering],
  preview: {
    select: { name: 'name', time: 'time', monthly: 'monthly', media: 'heroImage' },
    prepare({ name, time, monthly, media }) {
      return { title: name, subtitle: [time, monthly].filter(Boolean).join(' · '), media };
    },
  },
});
