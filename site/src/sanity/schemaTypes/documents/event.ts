import { defineType, defineField } from 'sanity';

// =============================================================================
// event — a dated happening on the public Events page (/events)
// =============================================================================
// Open houses, tour days, community events, closures — anything families should
// see on a calendar. Distinct from `schoolYearEvent` (the month-by-month co-op
// timeline) and from the Family Hub's Google Calendar (private, gated).
// The Events page shows upcoming events (startDate in the future) newest-first.
// =============================================================================
export const EVENT_CATEGORIES = [
  { title: 'Open house / tour', value: 'openHouse' },
  { title: 'Community event', value: 'community' },
  { title: 'Fundraiser', value: 'fundraiser' },
  { title: 'Closure / no school', value: 'closure' },
  { title: 'Other', value: 'other' },
];

export const event = defineType({
  name: 'event',
  title: 'Event',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'startDate',
      title: 'Starts',
      type: 'datetime',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'Ends (optional)',
      type: 'datetime',
    }),
    defineField({
      name: 'allDay',
      title: 'All-day event?',
      type: 'boolean',
      description: 'Turn on to hide the time and show only the date.',
      initialValue: false,
    }),
    defineField({
      name: 'location',
      title: 'Location (optional)',
      type: 'string',
      description: 'Leave blank to use the school address.',
    }),
    defineField({
      name: 'category',
      title: 'Type',
      type: 'string',
      options: { list: EVENT_CATEGORIES, layout: 'radio' },
      initialValue: 'community',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description (optional)',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'ctaLabel',
      title: 'Button label (optional)',
      type: 'string',
      description: 'e.g. "RSVP" or "Details". Needs a link below to show.',
    }),
    defineField({
      name: 'ctaUrl',
      title: 'Button link (optional)',
      type: 'url',
      validation: (R) => R.uri({ scheme: ['http', 'https', 'mailto', 'tel'], allowRelative: true }),
    }),
  ],
  orderings: [
    { title: 'Soonest first', name: 'startAsc', by: [{ field: 'startDate', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'title', date: 'startDate', category: 'category' },
    prepare({ title, date, category }) {
      const when = date
        ? new Date(date).toLocaleDateString('en-US', { timeZone: 'UTC' })
        : 'No date';
      return { title, subtitle: `${when}${category ? ` · ${category}` : ''}` };
    },
  },
});
