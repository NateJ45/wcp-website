import { defineType, defineField, defineArrayMember } from 'sanity';

// =============================================================================
// signupSheet — a sign-up sheet or event RSVP families fill in on the hub
// =============================================================================
// The board creates these in the Studio (Family Hub → Sign-ups & RSVPs); the
// signed-in families fill them in on /family-hub/sign-ups. Two kinds:
//   - "Sign-up sheet": named slots with optional capacity (helper shifts,
//     snack days, workday jobs). Replaces SignUpGenius.
//   - "Event RSVP": one implicit "we'll be there" slot with a live count.
// Every response arrives as a `signupEntry` document referencing this sheet
// (and, when configured, a row in the board's Google Sheet + a Gmail note via
// the forms inbox — see docs/FORMS.md).
// =============================================================================
export const signupSheet = defineType({
  name: 'signupSheet',
  title: 'Sign-up sheet / RSVP',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'e.g. "Fall Festival helpers" or "May Gathering".',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'description',
      title: 'Details (optional)',
      type: 'text',
      rows: 3,
      description: 'A line or two: what, where, what to bring.',
    }),
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      options: {
        list: [
          { title: 'Sign-up sheet (named slots to fill)', value: 'signup' },
          { title: 'Event RSVP (a "we’ll be there" count)', value: 'rsvp' },
        ],
        layout: 'radio',
      },
      initialValue: 'signup',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'eventDate',
      title: 'Date (optional)',
      type: 'date',
      description: 'Shown on the card and used to sort. Leave blank for ongoing sheets.',
    }),
    defineField({
      name: 'slots',
      title: 'Slots',
      type: 'array',
      description: 'Only for sign-up sheets: the jobs/spots families can take.',
      hidden: ({ parent }) => parent?.kind === 'rsvp',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'slot',
          fields: [
            {
              name: 'label',
              title: 'Slot',
              type: 'string',
              validation: (R) => R.required(),
            },
            { name: 'detail', title: 'Detail (optional)', type: 'string' },
            {
              name: 'capacity',
              title: 'How many needed',
              type: 'number',
              description: 'Leave blank or 0 for unlimited.',
              validation: (R) => R.min(0),
            },
          ],
          preview: {
            select: { title: 'label', subtitle: 'detail' },
          },
        }),
      ],
    }),
    defineField({
      name: 'open',
      title: 'Open for responses?',
      type: 'boolean',
      initialValue: true,
      description: 'Turn off to close the sheet (it disappears from the hub page).',
    }),
  ],
  orderings: [{ title: 'By date', name: 'byDate', by: [{ field: 'eventDate', direction: 'asc' }] }],
  preview: {
    select: { title: 'title', kind: 'kind', open: 'open', date: 'eventDate' },
    prepare({ title, kind, open, date }) {
      return {
        title: `${open ? '' : '(closed) '}${title ?? 'Sign-up sheet'}`,
        subtitle: [kind === 'rsvp' ? 'RSVP' : 'Sign-up sheet', date].filter(Boolean).join(' · '),
      };
    },
  },
});

// =============================================================================
// signupEntry — one family's response to a signupSheet
// =============================================================================
// Created by the website (/family-hub/api/signup) with the server token, never
// authored in the Studio — the board reads them as an inbox (grouped under the
// sheet they answer). Contains a family's name: private contact info.
// =============================================================================
export const signupEntry = defineType({
  name: 'signupEntry',
  title: 'Sign-up response',
  type: 'document',
  fields: [
    defineField({
      name: 'sheet',
      title: 'Sheet',
      type: 'reference',
      to: [{ type: 'signupSheet' }],
      readOnly: true,
    }),
    defineField({
      name: 'slotKey',
      title: 'Slot key',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({ name: 'slotLabel', title: 'Slot', type: 'string', readOnly: true }),
    defineField({ name: 'familyName', title: 'Family / name', type: 'string', readOnly: true }),
    defineField({ name: 'note', title: 'Note', type: 'string', readOnly: true }),
    defineField({ name: 'submittedAt', title: 'Received', type: 'datetime', readOnly: true }),
  ],
  orderings: [
    { title: 'Newest first', name: 'newest', by: [{ field: 'submittedAt', direction: 'desc' }] },
  ],
  preview: {
    select: { name: 'familyName', slot: 'slotLabel', sheet: 'sheet.title', at: 'submittedAt' },
    prepare({ name, slot, sheet, at }) {
      const when = at ? new Date(at).toLocaleDateString('en-US', { timeZone: 'UTC' }) : '';
      return {
        title: name ?? 'Someone',
        subtitle: [sheet, slot, when].filter(Boolean).join(' · '),
      };
    },
  },
});
