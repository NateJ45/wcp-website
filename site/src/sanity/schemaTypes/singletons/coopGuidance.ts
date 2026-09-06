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
    { name: 'sections', title: 'Job-list headings' },
  ],
  fields: [
    // The five headings the Co-op Jobs page groups the job list under. The
    // GROUPS themselves are fixed (they are the shapes the org chart can draw —
    // see ORG_TIERS in src/lib/hub-org.ts), but what each is CALLED, and the
    // sentence under it, are the school's words. A school that calls its chairs
    // "Programme Leads" says so here instead of asking for a code change.
    defineField({
      name: 'sections',
      title: 'Job-list headings',
      type: 'array',
      group: 'sections',
      description:
        'What each group of roles is called on the Co-op Jobs page. Leave a heading out and the standard wording is used.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'orgSection',
          fields: [
            defineField({
              name: 'key',
              title: 'Group',
              type: 'string',
              options: {
                list: [
                  { title: 'Executive Board', value: 'board' },
                  { title: 'Paid staff', value: 'staff' },
                  { title: 'Cabinet chairs', value: 'chairs' },
                  { title: 'Class representatives', value: 'reps' },
                  { title: 'Committees', value: 'committee' },
                ],
                layout: 'dropdown',
              },
              validation: (R) => R.required().error('Pick which group this heading is for.'),
            }),
            defineField({
              name: 'label',
              title: 'Heading',
              type: 'string',
              description: 'e.g. "Executive Board".',
              validation: (R) => R.required().error('Give the group a heading.'),
            }),
            defineField({
              name: 'blurb',
              title: 'Sentence under the heading',
              type: 'text',
              rows: 2,
            }),
          ],
          preview: { select: { title: 'label', subtitle: 'blurb' } },
        }),
      ],
      validation: (R) => R.max(5).warning('There are only five groups.'),
    }),
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
