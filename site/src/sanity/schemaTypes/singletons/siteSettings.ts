import { defineType, defineField, defineArrayMember } from 'sanity';

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
    // Set-once plumbing (Google codes and feeds) lives apart from the
    // fields volunteers touch every year, so "School year" stays approachable.
    { name: 'services', title: 'Connected services' },
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
      validation: (R) =>
        R.required().error('The school name appears everywhere — it can’t be blank.'),
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
      description: 'Shown where families are pointed to the administrator.',
    }),
    defineField({
      name: 'emailTreasurer',
      title: 'Treasurer email',
      type: 'string',
      group: 'contact',
      description: 'Shown on tuition and payment pages for money questions.',
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
      name: 'enrollmentMode',
      title: 'Enrollment mode',
      type: 'string',
      group: 'year',
      options: {
        list: [
          { title: 'Open — accepting new families', value: 'open' },
          { title: 'Waitlist — full, taking waitlist names', value: 'waitlist' },
          { title: 'Closed — between enrollment seasons', value: 'closed' },
        ],
        layout: 'radio',
      },
      initialValue: 'open',
      description:
        'Flip this and every "Enrollment status" banner you added to a page changes its wording and button to match (Apply now / Join the waitlist / Opens soon).',
    }),
    defineField({
      name: 'enrollmentDeadline',
      title: 'Enrollment deadline (optional)',
      type: 'date',
      group: 'year',
      description:
        'Shown in the enrollment banner while enrollment is open, e.g. "Apply by March 1".',
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
      title: 'Family Hub calendar — Google Calendar code',
      type: 'string',
      group: 'services',
      description:
        'The code that connects the school’s Google Calendar (it looks like abc123@group.calendar.google.com, from Google Calendar’s settings). Make the calendar public in Google Calendar first, then paste the code here and it appears on the Family Hub Calendar page. Leave blank to hide the calendar. Set once — check with Nathan before changing.',
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
      name: 'coopHoursGoal',
      title: 'Co-op hours per family (per year)',
      type: 'number',
      group: 'year',
      validation: (R) => R.min(0).error('Use 0 or more.'),
      description:
        'How many volunteer hours each family is asked to give this school year. Drives the progress bar on the Family Hub "My Co-op Hours" page. Leave blank or 0 to hide the hours tracker.',
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
      title: 'Budget spreadsheet code (Google Sheets)',
      type: 'string',
      group: 'services',
      description:
        'The long code from the treasurer’s Budget Google Sheet link (the part between /d/ and /edit in the link). Powers the Budget Snapshot and Fundraising numbers on the Family Hub. The sheet needs "Anyone with the link can view". Set once — check with Nathan before changing.',
    }),
    defineField({
      name: 'availabilitySheetId',
      title: 'Class availability spreadsheet code (Google Sheets)',
      type: 'string',
      group: 'services',
      description:
        'Powers the "Spots open / Waitlist" badges on the public class cards. Make a Sheet with a tab named "Availability", two columns: class (twos, threes, pre-k-am, pre-k-pm) and status (open, few, waitlist, full). Share it "Anyone with the link can view" and paste the long code from its link (between /d/ and /edit). Leave blank to hide the badges.',
    }),
    defineField({
      name: 'calendarFeedUrl',
      title: 'Calendar feed link',
      type: 'url',
      group: 'services',
      description:
        'The special Google link that feeds the Upcoming Events list on the Family Hub. Set up once by Nathan — check with him before changing it.',
    }),
    defineField({
      name: 'showDirectoryMap',
      title: 'Show the family directory map',
      type: 'boolean',
      group: 'services',
      initialValue: false,
      description:
        'When on, the Family Hub Directory adds a Map tab that plots each family who shared a home address (on OpenStreetMap). Off (the default) shows just the List.',
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
    defineField({
      name: 'facebook',
      title: 'Facebook link',
      type: 'url',
      group: 'social',
      description: 'The full link to the school’s Facebook page.',
    }),
    defineField({
      name: 'instagram',
      title: 'Instagram link',
      type: 'url',
      group: 'social',
      description: 'The full link to the school’s Instagram profile.',
    }),
    // The star line under every hero's Schedule a Tour button. It goes stale on
    // its own as families leave reviews, so it cannot be code-owned.
    defineField({
      name: 'googleRating',
      title: 'Google rating',
      type: 'string',
      group: 'social',
      description:
        'The star rating on the school’s Google listing, e.g. "4.8". Shown under the Schedule a Tour button on every page, so keep it honest — check the listing before you change it.',
    }),
    defineField({
      name: 'googleReviews',
      title: 'Number of Google reviews',
      type: 'number',
      group: 'social',
      description: 'How many reviews that rating is based on, e.g. 19.',
      validation: (R) => R.min(0),
    }),
    defineField({
      name: 'googleUrl',
      title: 'Google listing link',
      type: 'url',
      group: 'social',
      description: 'The public Google Maps link families click to read or leave a review.',
    }),
    defineField({
      name: 'storeUrl',
      title: 'Merch store link',
      type: 'url',
      group: 'social',
      description: 'The online store link (opens in a new tab).',
    }),
    defineField({
      name: 'storeHeadline',
      title: 'Store card headline',
      type: 'string',
      group: 'social',
      description: 'The big line on the store card at the bottom of the Family Hub home.',
    }),
    defineField({
      name: 'storeTagline',
      title: 'Store card blurb',
      type: 'text',
      rows: 2,
      group: 'social',
      description: 'The supporting sentence under the headline.',
    }),
    defineField({
      name: 'storeProducts',
      title: 'Featured merch',
      type: 'array',
      group: 'social',
      description:
        'A few items to show as clickable tiles on the Family Hub store card. Add, remove, and drag to reorder. Leave empty to show just the card.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'title', title: 'Name', type: 'string' }),
            defineField({
              name: 'price',
              title: 'Price',
              type: 'string',
              description: 'e.g. "$24.99".',
            }),
            defineField({ name: 'url', title: 'Product link', type: 'url' }),
            defineField({
              name: 'image',
              title: 'Image URL',
              type: 'url',
              description: 'A direct link to the product photo (from the store).',
            }),
          ],
          preview: { select: { title: 'title', subtitle: 'price', imageUrl: 'image' } },
        }),
      ],
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
