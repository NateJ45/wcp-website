import { defineType, defineField } from 'sanity';
import { HOURS_CATEGORIES } from '../../../lib/coop-hours';

// =============================================================================
// hoursLog — one entry in a family's co-op volunteer-hours ledger
// =============================================================================
// Two ways a row appears:
//   - A family logs their own hours on /family-hub/hours (honor system) — the
//     website creates the doc via /family-hub/api/log-hours with source "self"
//     and verified = false.
//   - The board credits hours directly here in the Studio (source "board");
//     board-authored rows can be marked verified straight away.
// The board reviews the self-logged rows and flips "Verified" once confirmed.
// The hub Hours page reads these live, filtered to the family's own name.
// Contains a family name (private within the co-op), so it stays behind the gate
// and is never baked into the public site — no rebuild on publish.
// =============================================================================
export const hoursLog = defineType({
  name: 'hoursLog',
  title: 'Co-op hours entry',
  type: 'document',
  icon: () => '⏱️',
  fields: [
    defineField({
      name: 'familyName',
      title: 'Family / name',
      type: 'string',
      description: 'The family these hours belong to, exactly as they log in the hub.',
      validation: (R) => R.required().error('Whose hours are these?'),
    }),
    defineField({
      name: 'hours',
      title: 'Hours',
      type: 'number',
      description: 'How many hours, e.g. 2 or 1.5.',
      validation: (R) => R.required().positive().max(999).error('Enter a number of hours.'),
    }),
    defineField({
      name: 'category',
      title: 'What kind of help',
      type: 'string',
      options: {
        list: HOURS_CATEGORIES.map((c) => ({ title: c.title, value: c.value })),
        layout: 'dropdown',
      },
      initialValue: 'classroom',
    }),
    defineField({
      name: 'activity',
      title: 'What they did (optional)',
      type: 'string',
      description: 'A short note, e.g. "Set up for the Fall Festival".',
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      description: 'When the hours were served. Used to sort, newest first.',
      initialValue: () => new Date().toISOString().slice(0, 10),
    }),
    defineField({
      name: 'verified',
      title: 'Verified',
      type: 'boolean',
      initialValue: false,
      description:
        'Turn on once a board member confirms these hours. Self-logged rows arrive unverified.',
    }),
    defineField({
      name: 'source',
      title: 'How it was added',
      type: 'string',
      readOnly: true,
      options: {
        list: [
          { title: 'Family self-logged', value: 'self' },
          { title: 'Board credited', value: 'board' },
        ],
        layout: 'radio',
      },
      initialValue: 'board',
    }),
    defineField({
      name: 'submittedAt',
      title: 'Received',
      type: 'datetime',
      readOnly: true,
      hidden: true,
    }),
  ],
  orderings: [
    { title: 'Newest first', name: 'newest', by: [{ field: 'date', direction: 'desc' }] },
    { title: 'By family', name: 'family', by: [{ field: 'familyName', direction: 'asc' }] },
  ],
  preview: {
    select: {
      family: 'familyName',
      hours: 'hours',
      category: 'category',
      verified: 'verified',
      date: 'date',
    },
    prepare({ family, hours, verified, date }) {
      const when = date ? new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US') : '';
      const h = typeof hours === 'number' ? `${hours} hr${hours === 1 ? '' : 's'}` : '';
      return {
        title: `${verified ? '✅ ' : '⏳ '}${family ?? 'Someone'} — ${h}`,
        subtitle: when,
      };
    },
  },
});
