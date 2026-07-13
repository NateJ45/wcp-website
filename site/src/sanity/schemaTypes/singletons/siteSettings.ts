import { defineType, defineField } from 'sanity';

// =============================================================================
// Site Settings (SINGLETON) — the school's facts, in one place
// =============================================================================
// Change your phone number, email, address, or the school-year label here once
// and it updates everywhere it appears (header, footer, contact page, CTAs).
// =============================================================================
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  groups: [
    { name: 'identity', title: 'Identity' },
    { name: 'contact', title: 'Contact' },
    { name: 'location', title: 'Location' },
    { name: 'year', title: 'School year' },
    { name: 'social', title: 'Social & store' },
    { name: 'legal', title: 'Licensing' },
  ],
  fields: [
    // Identity
    defineField({
      name: 'name',
      title: 'School name',
      type: 'string',
      group: 'identity',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'shortName',
      title: 'Short name',
      description: 'The abbreviation, e.g. "WCP".',
      type: 'string',
      group: 'identity',
    }),
    defineField({
      name: 'founded',
      title: 'Year founded',
      type: 'number',
      group: 'identity',
      description: 'Used for the "since 1969 / 55+ years" lines.',
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      description:
        'One short line describing the school. Shows in link previews and search results.',
      type: 'string',
      group: 'identity',
    }),
    defineField({
      name: 'url',
      title: 'Website address',
      type: 'url',
      group: 'identity',
      description: 'The public site URL, e.g. https://www.westchesterpreschool.org',
    }),
    defineField({
      name: 'season',
      title: 'Seasonal touches',
      type: 'string',
      group: 'identity',
      options: {
        list: [
          { title: 'Automatic (follows the calendar)', value: 'auto' },
          { title: 'Fall leaves', value: 'fall' },
          { title: 'Winter snowflakes', value: 'winter' },
          { title: 'Spring flowers', value: 'spring' },
          { title: 'Summer sunshine', value: 'summer' },
          { title: 'Off', value: 'off' },
        ],
        layout: 'radio',
      },
      initialValue: 'auto',
      description:
        'Small hand-drawn decorations in the corner of the public site footer. "Automatic" picks the season from the date; the change shows after the next site rebuild.',
    }),

    // Contact
    defineField({
      name: 'phone',
      title: 'Phone number',
      type: 'string',
      group: 'contact',
      description: 'As you want it shown, e.g. (513) 202-6187.',
    }),
    defineField({
      name: 'emailGeneral',
      title: 'General email',
      type: 'string',
      group: 'contact',
      description: 'The main contact address families are pointed to.',
    }),
    defineField({
      name: 'emailAdmin',
      title: 'Administrator email',
      type: 'string',
      group: 'contact',
    }),
    defineField({
      name: 'emailTreasurer',
      title: 'Treasurer email',
      type: 'string',
      group: 'contact',
    }),

    // Location
    defineField({ name: 'street', title: 'Street address', type: 'string', group: 'location' }),
    defineField({ name: 'city', title: 'City', type: 'string', group: 'location' }),
    defineField({ name: 'state', title: 'State', type: 'string', group: 'location' }),
    defineField({ name: 'zip', title: 'ZIP', type: 'string', group: 'location' }),
    defineField({
      name: 'parkingNote',
      title: 'Parking / entrance note',
      type: 'text',
      rows: 2,
      group: 'location',
      description: 'e.g. the Door 5 parking directions.',
    }),

    // School year
    defineField({
      name: 'schoolYearLabel',
      title: 'Current school year',
      type: 'string',
      group: 'year',
      description: 'e.g. "2026-27". Appears in eyebrows and headings site-wide.',
    }),
    defineField({
      name: 'enrolling',
      title: 'Currently enrolling?',
      type: 'boolean',
      group: 'year',
      initialValue: true,
      description: 'Turns the "Now Enrolling" labels on or off.',
    }),
    defineField({
      name: 'closureStatement',
      title: 'Weather-closure statement',
      type: 'text',
      rows: 2,
      group: 'year',
      description: 'e.g. "WCP follows Lakota Local Schools for weather closures."',
    }),
    defineField({
      name: 'googleCalendarId',
      title: 'Google Calendar ID (Family Hub calendar)',
      type: 'string',
      group: 'year',
      description:
        'The public Google Calendar ID (e.g. abc123@group.calendar.google.com). Make the school calendar public in Google Calendar settings, paste its ID here, and it appears on the Family Hub Calendar page. Leave blank to hide the calendar.',
    }),
    defineField({
      name: 'yearStart',
      title: 'School year start date',
      type: 'date',
      group: 'year',
      description:
        'First day of the school year (drives the progress bar on the Family Hub home). Leave blank to hide the progress bar.',
    }),
    defineField({
      name: 'yearEnd',
      title: 'School year end date',
      type: 'date',
      group: 'year',
      description:
        'Last day of the school year (drives the progress bar on the Family Hub home). Leave blank to hide the progress bar.',
    }),
    defineField({
      name: 'firstDay',
      title: 'First day of school',
      type: 'date',
      group: 'year',
      description:
        'Powers the "N days until school" countdown on the Family Hub home before the year starts. Leave blank to hide it.',
    }),
    defineField({
      name: 'familyCount',
      title: 'Family count (optional override)',
      type: 'number',
      group: 'year',
      description:
        'Shown on the Family Hub home. Leave blank to use a live count of opted-in Directory families instead.',
    }),
    defineField({
      name: 'budgetSheetId',
      title: 'Budget Google Sheet ID',
      type: 'string',
      group: 'year',
      description:
        'The ID from the treasurer’s Budget Google Sheet link (the long code between /d/ and /edit). Powers the Budget Snapshot and Fundraising numbers on the Family Hub. The sheet needs "Anyone with the link can view".',
    }),
    defineField({
      name: 'calendarFeedUrl',
      title: 'Calendar feed link (Apps Script)',
      type: 'url',
      group: 'year',
      description:
        'The Google Apps Script web-app link that serves the school calendar as a feed. Powers the Upcoming Events list on the Family Hub. Ask before changing this one.',
    }),
    defineField({
      name: 'pastFundraisingTotals',
      title: 'Past fundraising totals',
      type: 'array',
      group: 'year',
      description:
        'Grand totals from finished school years, newest first — shown in the "What we’ve raised together" band on the Family Hub Fundraising page. Each fall, add the year that just ended (the treasurer’s final number).',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'yearLabel',
              title: 'School year',
              type: 'string',
              description: 'e.g. "2025-26"',
              validation: (R) => R.required(),
            }),
            defineField({
              name: 'amount',
              title: 'Total raised ($)',
              type: 'number',
              validation: (R) => R.required().min(0),
            }),
          ],
          preview: {
            select: { title: 'yearLabel', amount: 'amount' },
            prepare: ({ title, amount }) => ({
              title: title || 'School year',
              subtitle: typeof amount === 'number' ? `$${amount.toLocaleString('en-US')}` : '',
            }),
          },
        },
      ],
    }),

    // Social & store
    defineField({ name: 'facebook', title: 'Facebook URL', type: 'url', group: 'social' }),
    defineField({ name: 'instagram', title: 'Instagram URL', type: 'url', group: 'social' }),
    defineField({
      name: 'storeUrl',
      title: 'Merch store URL',
      type: 'url',
      group: 'social',
      description: 'The online store link (opens in a new tab).',
    }),

    // Legal
    defineField({
      name: 'license',
      title: 'Licensing statement',
      type: 'string',
      group: 'legal',
      description: 'e.g. "Licensed under Ohio Day Care Licensing Code 5101:2-12".',
    }),
    defineField({
      name: 'licenseAuthority',
      title: 'Licensing authority',
      type: 'string',
      group: 'legal',
      description: 'e.g. "ODJFS".',
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Site Settings' }),
  },
});
