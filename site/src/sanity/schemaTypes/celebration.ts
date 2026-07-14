import { defineType, defineField } from 'sanity';

// =============================================================================
// celebration — a warm little note on the Family Hub (birthdays, kudos, welcomes)
// =============================================================================
// Board-posted, shown on the gated Family Hub "Celebrations" page (read at
// request time behind the family gate). Keeps the hub feeling like a community,
// not just a document dump. Recent ones show first; old ones can be deleted.
// =============================================================================
export const celebration = defineType({
  name: 'celebration',
  title: 'Celebration',
  type: 'document',
  icon: () => '🎉',
  fields: [
    defineField({
      name: 'kind',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Birthday', value: 'birthday' },
          { title: 'Shout-out / kudos', value: 'kudos' },
          { title: 'Welcome', value: 'welcome' },
          { title: 'Milestone', value: 'milestone' },
        ],
        layout: 'radio',
      },
      initialValue: 'kudos',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      description:
        'The short, happy line, e.g. "Happy birthday, Mateo!" or "Thank you, Nixon family!"',
      validation: (R) => R.required().error('Write the celebration headline.'),
    }),
    defineField({
      name: 'note',
      title: 'A little more (optional)',
      type: 'text',
      rows: 2,
      description: 'An optional sentence of detail.',
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      description: 'When it happened (or the birthday). Used to sort, newest first.',
      initialValue: () => new Date().toISOString().slice(0, 10),
    }),
  ],
  orderings: [
    { title: 'Newest first', name: 'newest', by: [{ field: 'date', direction: 'desc' }] },
  ],
  preview: {
    select: { headline: 'headline', kind: 'kind', date: 'date' },
    prepare({ headline, kind, date }) {
      const icon: Record<string, string> = {
        birthday: '🎂',
        kudos: '👏',
        welcome: '👋',
        milestone: '⭐',
      };
      const when = date ? new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US') : '';
      return { title: `${icon[kind] ?? '🎉'} ${headline || 'Celebration'}`, subtitle: when };
    },
  },
});
