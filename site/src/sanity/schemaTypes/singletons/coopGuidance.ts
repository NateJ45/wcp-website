import { defineType, defineField, defineArrayMember } from 'sanity';
import { iconField } from '../objects/_shared';

// =============================================================================
// coopGuidance — the two explainer blocks about how the co-op actually works
// =============================================================================
// Both were hardcoded prose in src/data/hub/coop-roles.ts and ClassAskGuide, so
// changing the co-op commitment ("2-3 times a month") or moving a topic between
// the teacher and the class rep meant a developer and a deploy. They are small,
// but they are the rules families live by, and the Board should be able to
// correct them the day they change.
//
// One document for both because they answer the same question from two angles —
// how the co-op works, and who to ask about what — and a volunteer editing one
// usually wants to check the other.
//
// The LAYOUT (a four-card row on Co-op Jobs, a two-column box on the class
// pages) stays in code, per the brand-lock rule. Only the words are here.
// =============================================================================
export const coopGuidance = defineType({
  name: 'coopGuidance',
  title: 'How the co-op works (guidance)',
  type: 'document',
  icon: () => '🧭',
  groups: [
    { name: 'principles', title: 'The four rules', default: true },
    { name: 'asks', title: 'Who to ask about what' },
  ],
  fields: [
    defineField({
      name: 'principles',
      title: 'The four rules',
      type: 'array',
      group: 'principles',
      description:
        'The cards at the top of the Co-op Jobs page — the commitment every family signs up to. Four works best; the row is built for it.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'principle',
          fields: [
            iconField('icon', { description: 'The little picture on the card.' }),
            defineField({
              name: 'title',
              title: 'Heading',
              type: 'string',
              description: 'Short, e.g. "One per family".',
              validation: (R) => R.required().error('Every card needs a heading.'),
            }),
            defineField({
              name: 'body',
              title: 'Explanation',
              type: 'text',
              rows: 3,
              validation: (R) => R.required().error('Every card needs an explanation.'),
            }),
          ],
          preview: { select: { title: 'title', subtitle: 'body' } },
        }),
      ],
      validation: (R) => R.max(6).warning('More than six makes the row wrap awkwardly.'),
    }),
    defineField({
      name: 'teacherAsks',
      title: 'Ask your TEACHER about',
      type: 'array',
      group: 'asks',
      description:
        'One line per topic, shown on both class pages. Keep them short — this is a scan-and-go list, not prose.',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({
      name: 'repAsks',
      title: 'Ask your CLASS REP about',
      type: 'array',
      group: 'asks',
      description:
        'The same, for the parent rep. Moving a topic between the two lists is the point.',
      of: [defineArrayMember({ type: 'string' })],
    }),
  ],
  preview: {
    prepare() {
      return { title: 'How the co-op works', subtitle: 'The four rules + who to ask about what' };
    },
  },
});
