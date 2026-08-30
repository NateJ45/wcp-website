import { defineType, defineField, defineArrayMember } from 'sanity';
import { iconField } from '../objects/_shared';

// =============================================================================
// Hub settings (SINGLETON) — the Family Hub's own yearly data and Google links
// =============================================================================
// Everything here feeds ONLY the gated Family Hub, so it lives in the Family
// Hub workspace. These eight fields moved out of Site Settings on 2026-08-23
// (scripts/patch-hub-settings.mjs copied the values): the handbook PDF, the
// co-op hours goal, the family-count override, past fundraising totals, the
// three Google connections (budget sheet, calendar feed, calendar code), and
// the directory-map toggle. The shared school-year DATES stay in Site
// Settings — the public enrollment packet prints them too.
// =============================================================================
export const hubSettings = defineType({
  name: 'hubSettings',
  title: 'Hub settings',
  type: 'document',
  icon: () => '🛠️',
  groups: [
    { name: 'year', title: 'Each year', default: true },
    // The Super Helper certification program — ONE source for the hub-home
    // band and the /family-hub/super-helper page header. See
    // src/lib/hub-super-helper.ts for the merge; every field optional, the
    // shipped program is the fallback.
    { name: 'superHelper', title: 'Super Helper' },
    // Set-once plumbing (Google codes and feeds) lives apart from the fields
    // volunteers touch every year, so "Each year" stays approachable.
    { name: 'connections', title: 'Google connections' },
  ],
  fields: [
    // Each year
    defineField({
      name: 'welcomeLine',
      title: 'Hub welcome line',
      type: 'string',
      group: 'year',
      description:
        'The sentence under the big greeting on the hub home, e.g. "Welcome back — happy spring!". Leave empty for "Welcome to the WCP Family Hub!".',
    }),
    defineField({
      name: 'familyHandbook',
      title: 'Family Handbook (PDF)',
      type: 'file',
      group: 'year',
      options: { accept: '.pdf' },
      description:
        'The current Family Handbook. Upload the new one each year and every hub link to it updates by itself (the topbar button and the hub home card).',
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

    // Google connections
    // --- Super Helper program ----------------------------------------------
    defineField({
      name: 'superHelper',
      title: 'Super Helper program',
      type: 'object',
      group: 'superHelper',
      description:
        'The certification program, written once and shown in two places: the big band on the hub home and the top of its own page. Every box is optional — empty means the wording the site shipped with.',
      fields: [
        defineField({
          name: 'name',
          title: 'Program name',
          type: 'string',
          description: 'e.g. "Super Helper". Renames the band and the page heading.',
        }),
        defineField({
          name: 'blurb',
          title: 'One-paragraph pitch',
          type: 'text',
          rows: 3,
          description: 'The sentence or two under the heading on the hub home band.',
        }),
        defineField({
          name: 'requirements',
          title: 'Requirements',
          type: 'array',
          description:
            'The steps to certify, in order. Filling this in REPLACES the shipped three-step list everywhere.',
          of: [
            defineArrayMember({
              type: 'object',
              fields: [
                iconField('icon', { description: 'The little picture on the card.' }),
                defineField({
                  name: 'title',
                  title: 'Step',
                  type: 'string',
                  validation: (R) => R.required().error('Every step needs a name.'),
                }),
                defineField({
                  name: 'detail',
                  title: 'One-liner',
                  type: 'string',
                  description: 'e.g. "About 8 hours, free, from home."',
                }),
                defineField({
                  name: 'url',
                  title: 'Link (optional)',
                  type: 'url',
                  description:
                    'Where to start this step — the training site, the CPR class finder. The card becomes a link when set.',
                }),
              ],
              preview: { select: { title: 'title', subtitle: 'detail' } },
            }),
          ],
        }),
        defineField({
          name: 'footnote',
          title: 'Footnote',
          type: 'string',
          description: 'The small line under the cards, e.g. the renewal reminder.',
        }),
      ],
    }),

    defineField({
      name: 'budgetSheetId',
      title: 'Budget spreadsheet code (Google Sheets)',
      type: 'string',
      group: 'connections',
      description:
        'The long code from the treasurer’s Budget Google Sheet link (the part between /d/ and /edit in the link). Powers the Budget Snapshot and Fundraising numbers on the Family Hub. The sheet needs "Anyone with the link can view". Set once — check with Nathan before changing.',
    }),
    defineField({
      name: 'calendarFeedUrl',
      title: 'Calendar feed link',
      type: 'url',
      group: 'connections',
      description:
        'The special Google link that feeds the Upcoming Events list on the Family Hub. Set up once by Nathan — check with him before changing it.',
    }),
    defineField({
      name: 'googleCalendarId',
      title: 'Family Hub calendar — Google Calendar code',
      type: 'string',
      group: 'connections',
      description:
        'The code that connects the school’s Google Calendar (it looks like abc123@group.calendar.google.com, from Google Calendar’s settings). Make the calendar public in Google Calendar first, then paste the code here and it appears on the Family Hub Calendar page. Leave blank to hide the calendar. Set once — check with Nathan before changing.',
    }),
    defineField({
      name: 'showDirectoryMap',
      title: 'Show the family directory map',
      type: 'boolean',
      group: 'connections',
      initialValue: false,
      description:
        'When on, the Family Hub Directory adds a Map tab that plots each family who shared a home address (on OpenStreetMap). Off (the default) shows just the List.',
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Hub settings', subtitle: 'Yearly data · Google connections' }),
  },
});
