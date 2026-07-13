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
      validation: (R) => R.required().error('Give the event a name, e.g. "Fall Open House".'),
    }),
    defineField({
      name: 'startDate',
      title: 'Starts',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (R) => R.required().error('Pick the date (and time) the event starts.'),
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
      name: 'recurrence',
      title: 'Does it repeat?',
      type: 'string',
      options: {
        list: [
          { title: 'One time only', value: 'none' },
          { title: 'Every week', value: 'weekly' },
          { title: 'Every month', value: 'monthly' },
        ],
        layout: 'radio',
      },
      initialValue: 'none',
      description:
        'For a repeating event, set the FIRST date above, then pick how often it repeats.',
    }),
    defineField({
      name: 'recurrenceEnd',
      title: 'Repeat until',
      type: 'date',
      description: 'The last date it should repeat. Leave blank and it repeats for about a year.',
      hidden: ({ parent }) => !parent?.recurrence || parent?.recurrence === 'none',
    }),
    defineField({
      name: 'venue',
      title: 'Saved location (optional)',
      type: 'reference',
      to: [{ type: 'venue' }],
      description:
        'Pick a saved place (a second campus, a field-trip spot). Leave blank to type an address below or use the school.',
    }),
    defineField({
      name: 'location',
      title: 'Or type a location (optional)',
      type: 'string',
      description:
        'Used when no saved location is picked. Leave both blank to use the school address.',
      hidden: ({ parent }) => Boolean(parent?.venue),
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
      description: 'A page path like /contact, or a full https:// link.',
      validation: (R) =>
        R.uri({ scheme: ['http', 'https', 'mailto', 'tel'], allowRelative: true }).error(
          'That doesn’t look like a link. Try a page path like /contact or a full https:// address.',
        ),
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
      const label = EVENT_CATEGORIES.find((c) => c.value === category)?.title ?? category;
      return { title, subtitle: `${when}${label ? ` · ${label}` : ''}` };
    },
  },
});
