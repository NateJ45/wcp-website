import { defineType, defineField, defineArrayMember } from 'sanity';

// =============================================================================
// operatingBudget — the member-approved operating budget, line by line
// =============================================================================
// Shown on the Family Hub's Budget & Fundraising page. This used to live only in
// src/data/hub/budget.ts, which meant the ONE person who could update the
// school's own approved budget each year was a developer — not the Treasurer who
// wrote it. Now she edits it here.
//
// NOTHING here is a total. Group subtotals, target revenue, total expenses and
// the net are all ADDED UP from the lines when the page renders, so the summary
// can never disagree with the table under it. Type the lines; the maths follows.
// =============================================================================

const budgetLine = defineArrayMember({
  type: 'object',
  name: 'budgetLine',
  fields: [
    defineField({
      name: 'label',
      title: 'Line item',
      type: 'string',
      description: 'e.g. "Tuition", "Insurance", "Classroom supplies".',
      validation: (R) => R.required().error('Every line needs a name.'),
    }),
    defineField({
      name: 'now',
      title: 'This year',
      type: 'number',
      description: 'Whole dollars, no $ sign and no commas — e.g. 54810.',
      validation: (R) => R.required().min(0).error('Use a number of dollars, 0 or more.'),
    }),
    defineField({
      name: 'was',
      title: 'Last year',
      type: 'number',
      description:
        'Last year’s budgeted figure, for the comparison column. Leave blank if this line is new.',
      validation: (R) => R.min(0),
    }),
    defineField({
      name: 'note',
      title: 'Note',
      type: 'string',
      description:
        'Optional one-liner shown under the figure — what it covers, or what the number assumes.',
    }),
  ],
  preview: {
    select: { title: 'label', now: 'now', note: 'note' },
    prepare({ title, now, note }) {
      const amount = typeof now === 'number' ? `$${now.toLocaleString('en-US')}` : 'no amount';
      return {
        title: title || 'Untitled line',
        subtitle: [amount, note].filter(Boolean).join(' — '),
      };
    },
  },
});

export const operatingBudget = defineType({
  name: 'operatingBudget',
  title: 'Operating budget',
  type: 'document',
  icon: () => '📊',
  groups: [
    { name: 'year', title: 'Which year', default: true },
    { name: 'lines', title: 'The budget' },
  ],
  fields: [
    defineField({
      name: 'year',
      title: 'Budget year',
      type: 'string',
      group: 'year',
      description: 'e.g. "2026-27". Shown in the heading.',
      validation: (R) => R.required(),
    }),
    // (`priorYear` removed 2026-08-23 — never rendered; docs/FIELD_AUDIT.md.)
    defineField({
      name: 'enrollment',
      title: 'Enrolment assumption',
      type: 'string',
      group: 'year',
      description:
        'The enrolment this budget assumes, e.g. "39 students projected, of 43 seats". Shown under the heading.',
    }),
    defineField({
      name: 'netNote',
      title: 'Note on the bottom line',
      type: 'string',
      group: 'year',
      description:
        'One line explaining the surplus or shortfall, e.g. "At 39 students; a surplus at 40 or more".',
    }),
    defineField({
      name: 'source',
      title: 'Where this came from',
      type: 'string',
      group: 'year',
      description: 'e.g. "Member-approved operating budget". Shown as the source line.',
    }),
    defineField({
      name: 'groups',
      title: 'Sections',
      type: 'array',
      group: 'lines',
      description:
        'One section per part of the budget — money coming in, then money going out. Drag to reorder; the page follows this order.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'budgetGroup',
          fields: [
            defineField({
              name: 'label',
              title: 'Section name',
              type: 'string',
              description: 'e.g. "Tuition & fees", "Operating costs".',
              validation: (R) => R.required().error('Every section needs a name.'),
            }),
            defineField({
              name: 'kind',
              title: 'Money in or out?',
              type: 'string',
              description:
                'Income sections tint green and count toward revenue; cost sections tint navy and count toward expenses.',
              options: {
                list: [
                  { title: 'Money coming in (income)', value: 'revenue' },
                  { title: 'Money going out (cost)', value: 'expense' },
                ],
                layout: 'radio',
              },
              initialValue: 'expense',
              validation: (R) => R.required().error('Pick income or cost.'),
            }),
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'string',
              // Hidden 2026-08-23 (field audit): decoration on a financial
              // table; the income/cost kind already carries the meaning.
              hidden: true,
              description: 'Small icon on the section header.',
              options: {
                list: [
                  { title: 'Dollar sign', value: 'circle-dollar-sign' },
                  { title: 'Piggy bank', value: 'piggy-bank' },
                  { title: 'Hand & heart (fundraising)', value: 'hand-heart' },
                  { title: 'Building (operating)', value: 'building-2' },
                  { title: 'Books (programs)', value: 'book-open' },
                  { title: 'Coins', value: 'coins' },
                ],
              },
              initialValue: 'circle-dollar-sign',
            }),
            defineField({
              name: 'lines',
              title: 'Lines',
              type: 'array',
              of: [budgetLine],
              validation: (R) => R.min(1).error('A section needs at least one line.'),
            }),
          ],
          preview: {
            select: { title: 'label', kind: 'kind', lines: 'lines' },
            prepare({ title, kind, lines }) {
              const count = Array.isArray(lines) ? lines.length : 0;
              const total = (Array.isArray(lines) ? lines : []).reduce(
                (sum, l) => sum + (typeof l?.now === 'number' ? l.now : 0),
                0,
              );
              return {
                title: title || 'Untitled section',
                subtitle: `${kind === 'revenue' ? 'Income' : 'Cost'} · ${count} line${
                  count === 1 ? '' : 's'
                } · $${total.toLocaleString('en-US')}`,
              };
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { year: 'year', source: 'source' },
    prepare({ year, source }) {
      return { title: `Operating budget ${year || ''}`.trim(), subtitle: source };
    },
  },
});
