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
  ],
  fields: [
    // Basics
    defineField({
      name: 'name',
      title: 'Class name',
      type: 'string',
      group: 'basics',
      description: 'e.g. "Twos" or "Pre-K AM".',
      validation: (R) => R.required().error('Every class needs a name so families can find it.'),
    }),
    defineField({
      name: 'slug',
      title: 'Web address (slug)',
      type: 'slug',
      group: 'basics',
      options: { source: 'name', maxLength: 40 },
      description: 'The web address piece, e.g. "twos". Click Generate.',
      validation: (R) => R.required().error('Click Generate to give this class a web address.'),
    }),
    // DEAD (field audit 2026-08-23): nothing renders a class icon — the hub
    // deliberately reads its icons from src/data/classes.ts. Hidden, not
    // removed, so old documents keep validating. See docs/FIELD_AUDIT.md.
    defineField({ name: 'icon', title: 'Icon', type: 'string', hidden: true }),
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
    // DEAD (field audit 2026-08-23): the hub class page reads its tagline
    // from src/data/classes.ts, and no query projects this. Hidden so old
    // documents keep validating. See docs/FIELD_AUDIT.md.
    defineField({ name: 'tagline', title: 'Tagline', type: 'string', hidden: true }),
    defineField({
      name: 'teacher',
      title: 'Teacher',
      type: 'reference',
      to: [{ type: 'staff' }],
      group: 'basics',
      description: 'The teacher for this class. Pick from Staff — their name/bio come from there.',
    }),
    defineField({
      name: 'helperScheduleUrl',
      title: 'Helper schedule link',
      type: 'url',
      group: 'basics',
      description:
        'The Google Sheet where families sign up to help in this class. Shown on the Family Hub home. Update when the sheet changes each year.',
    }),
    defineField({
      name: 'photoAlbumUrl',
      title: 'Class photo album link',
      type: 'url',
      group: 'basics',
      description:
        'This year’s Google Photos album for the class. Shown on the Family Hub home. Update when the new album is created each year.',
    }),

    // Schedule & ages
    defineField({
      name: 'days',
      title: 'Days',
      type: 'string',
      group: 'schedule',
      description: 'e.g. "Thursdays" or "Mon, Tue, Wed".',
    }),
    // DEAD (field audit 2026-08-23): its only query lost all callers. Hidden.
    defineField({
      name: 'daysCount',
      title: 'Days per week (label)',
      type: 'string',
      hidden: true,
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
    // DEAD (field audit 2026-08-23): its only query lost all callers. Hidden.
    defineField({ name: 'classSizeCap', title: 'Max class size', type: 'number', hidden: true }),
    // DEAD (field audit 2026-08-23): class-page day flow renders through the
    // scheduleSection on the page itself, never from this field. Hidden.
    defineField({
      name: 'dailySchedule',
      title: 'A day in this class',
      type: 'array',
      hidden: true,
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
    defineField({
      name: 'annual',
      title: 'Annual tuition',
      type: 'string',
      group: 'tuition',
      description: 'As shown, e.g. "$630".',
    }),
    defineField({
      name: 'studentFee',
      title: 'Student fee (per year)',
      type: 'string',
      group: 'tuition',
      description:
        'e.g. "$45". This is the ONLY place the student fee is set. The class page, the Tuition page’s pay button, and the enrolment packet all read it from here, and the Tuition page groups classes that charge the same amount into one button by itself.',
    }),
    defineField({
      name: 'payId',
      title: 'PayPal button — tuition',
      type: 'string',
      group: 'tuition',
      description:
        'The payment link from the PayPal button for this class’s tuition — in PayPal, open the button and Copy link (it starts with paypal.com/ncp/payment/). Paste the whole link. Older buttons used a short code instead; a code still works until that button is replaced. Changing this changes where the money goes. Step-by-step help: Help & Guide → "Change tuition or fees".',
    }),
    defineField({
      name: 'studentFeePayId',
      title: 'PayPal button — student fee',
      type: 'string',
      group: 'tuition',
      description:
        'The payment link from the PayPal button for this class’s student fee (Copy link in PayPal; older buttons used a short code, which still works). This is the ONLY place it is set — the Tuition page’s student-fee button reads it from here. Classes sharing an amount AND this link are shown as one button. Changing this changes where the money goes. Step-by-step help: Help & Guide → "Change tuition or fees".',
    }),

    // DEAD (field audit 2026-08-23): the class page's hero and learning cards
    // come from its page-builder doc, not these fields. Hidden (heroImage
    // still feeds the Studio list thumbnail via preview.media).
    defineField({
      name: 'heroImage',
      title: 'Hero photo',
      type: 'image',
      options: { hotspot: true },
      hidden: true,
    }),
    defineField({
      name: 'whatTheyLearn',
      title: 'What they learn',
      type: 'array',
      of: [defineArrayMember({ type: 'iconCard' })],
      hidden: true,
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
