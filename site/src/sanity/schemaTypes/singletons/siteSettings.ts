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
    { name: 'social', title: 'Social & reviews' },
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
    // DEAD (field audit 2026-08-23): no renderer reads it. Hidden.
    defineField({
      name: 'shortName',
      hidden: true,
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
    // An optional replacement for the built-in logo. The code keeps the
    // committed WCP logo files; this field only takes over when it is set, and
    // the header draws it at the same size, so nothing else moves.
    defineField({
      name: 'logoOverride',
      title: 'Logo (optional)',
      type: 'image',
      group: 'identity',
      options: { hotspot: true },
      description:
        'Replaces the WCP logo in the header. Leave it empty to keep the built-in logo. One picture is used on the light bar and on the photo at the top of the page, so pick one that reads on both. A wide picture with a see-through background works best.',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description:
            'What the logo says, for a screen reader. Leave blank to use the school name.',
        }),
      ],
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

    // Chrome toggles. They hide the phone and email links in the header and
    // footer only. The pages that print the address or the contact form keep
    // it. Blank means "show it", so an untouched document does not change.
    defineField({
      name: 'showPhone',
      title: 'Show the phone number in the header and footer',
      type: 'boolean',
      group: 'contact',
      description:
        'Turn this off to remove the call links from the top bar and the footer. The number still shows on the Visit Us page. It is on by default.',
    }),
    defineField({
      name: 'showEmail',
      title: 'Show the email link in the header and footer',
      type: 'boolean',
      group: 'contact',
      description:
        'Turn this off to remove the email icon at the top of the page and the email link in the footer. It is on by default.',
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
    defineField({
      name: 'venueNote',
      title: 'Building note',
      type: 'string',
      group: 'location',
      description:
        'Whose building the school is inside, shown with the address, e.g. "Inside Crestview Presbyterian Church". Update if the school ever moves or the venue renames.',
    }),

    // School year
    defineField({
      name: 'schoolYearLabel',
      title: 'Current school year',
      type: 'string',
      group: 'year',
      description: 'e.g. "2026-27". Appears in eyebrows and headings site-wide.',
    }),
    // DEAD (field audit 2026-08-23): no renderer reads it. Hidden.
    defineField({
      name: 'enrolling',
      hidden: true,
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
    // Feeds the schema.org openingHoursSpecification Google reads. Structured
    // rather than free text: a malformed time silently invalidates the markup,
    // and nothing on the page would look wrong.
    defineField({
      name: 'openingHours',
      title: 'Class hours (for Google)',
      type: 'array',
      group: 'location',
      description:
        'One row per schedule the school runs — e.g. mornings Mon-Thu 9:15-12:00, and the afternoon Pre-K Mon-Wed 12:30-15:15. Google shows these on the school’s listing. Leave empty to use the committed hours.',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'days',
              title: 'Days',
              type: 'array',
              of: [{ type: 'string' }],
              options: {
                list: [
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday',
                  'Sunday',
                ],
              },
              validation: (R) => R.required().min(1).error('Pick at least one day.'),
            },
            {
              name: 'opens',
              title: 'Starts',
              type: 'string',
              description: '24-hour clock, e.g. 09:15.',
              validation: (R) =>
                R.required()
                  .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
                  .error('Use a 24-hour time like 09:15 or 12:30.'),
            },
            {
              name: 'closes',
              title: 'Ends',
              type: 'string',
              description: '24-hour clock, e.g. 12:00.',
              validation: (R) =>
                R.required()
                  .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
                  .error('Use a 24-hour time like 12:00 or 15:15.'),
            },
          ],
          preview: {
            select: { days: 'days', opens: 'opens', closes: 'closes' },
            prepare({ days, opens, closes }) {
              const list = Array.isArray(days) ? days : [];
              const short = list.map((d) => d.slice(0, 3)).join(', ');
              return {
                title: short || 'No days picked',
                subtitle: `${opens || '?'} to ${closes || '?'}`,
              };
            },
          },
        },
      ],
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
      name: 'summerTourNote',
      title: 'Summer tour note',
      type: 'string',
      group: 'year',
      description:
        'The line about off-season visits on the public Visit block, e.g. "Tours by appointment June to August."',
    }),
    // The hub-only fields (family handbook, co-op hours goal, family count,
    // past fundraising totals, budget sheet code, calendar feed, Google
    // Calendar code, directory-map toggle) moved to the `hubSettings`
    // singleton in the Family Hub workspace on 2026-08-23 —
    // scripts/patch-hub-settings.mjs copied the values. The year DATES stay
    // here: the public enrollment packet prints them too.
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
      name: 'availabilitySheetId',
      title: 'Class availability spreadsheet code (Google Sheets)',
      type: 'string',
      group: 'services',
      description:
        'Powers the "Spots open / Waitlist" badges on the public class cards. Make a Sheet with a tab named "Availability", two columns: class (twos, threes, pre-k-am, pre-k-pm) and status (open, few, waitlist, full). Share it "Anyone with the link can view" and paste the long code from its link (between /d/ and /edit). Leave blank to hide the badges.',
    }),
    // Social & reviews
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
    // Same rule as the phone and email toggles above: blank means "show them".
    defineField({
      name: 'showSocials',
      title: 'Show the social icons in the header and footer',
      type: 'boolean',
      group: 'social',
      description:
        'Turn this off to remove the Facebook and Instagram buttons from the top of the page and the footer. The links stay saved above. It is on by default.',
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
    // The store card fields (store link, headline, blurb, featured merch)
    // moved to the `hubStore` singleton in the Family Hub workspace on
    // 2026-08-23 — they only feed the hub home's store card. The old values
    // still sit invisibly in this document; scripts/patch-hub-store.mjs
    // copied them over.

    // Legal
    defineField({
      name: 'license',
      title: 'Licensing statement',
      type: 'string',
      group: 'legal',
      description: 'e.g. "Licensed under Ohio Day Care Licensing Code 5101:2-12".',
    }),
    defineField({
      name: 'secularLine',
      title: 'Secular / non-discrimination statement',
      type: 'text',
      rows: 2,
      group: 'legal',
      description:
        'The one-sentence statement shown on the Visit block and in the footer’s legal line. Empty keeps the shipped wording.',
    }),
    // DEAD (field audit 2026-08-23): no renderer reads it. Hidden.
    defineField({
      name: 'licenseAuthority',
      hidden: true,
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
