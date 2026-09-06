import { defineType, defineField } from 'sanity';
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list';
import { iconField } from '../objects/_shared';

// =============================================================================
// coopRole — one SEAT in the co-op: what the job is, and where it sits
// =============================================================================
// This document used to be a job description only; the org chart's SHAPE lived
// in code, so a school that renamed a role, added one, or shrank its board
// needed a developer. Now the chart is DERIVED from these documents
// (src/lib/hub-org.ts): the sections come from "Where it sits", the columns and
// the lines between boxes come from "Reports to", and the order comes from
// dragging the list.
//
// One document per seat. Renaming one is safe: the person holding it points at
// this document by REFERENCE, not by its name.
//
// The CLASS REP seat is special and stays automatic: tick "One of these for
// every class" and the chart draws one rep card per live class, so a class the
// Board adds has a fillable rep card the same day.
// =============================================================================

export const coopRole = defineType({
  name: 'coopRole',
  title: 'Co-op role',
  type: 'document',
  icon: () => '🤝',
  groups: [
    { name: 'job', title: 'The job', default: true },
    { name: 'chart', title: 'Where it sits on the chart' },
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Role',
      type: 'string',
      group: 'job',
      description:
        'What this job is called, e.g. "Treasurer". Rename it whenever the school does — whoever holds it stays attached.',
      validation: (R) => R.required().error('Name the role, e.g. "Treasurer".'),
    }),
    iconField('icon', {
      group: 'job',
      description: 'The little picture shown next to this role (optional).',
    }),
    defineField({
      name: 'body',
      title: 'What they do',
      type: 'text',
      rows: 3,
      group: 'job',
      description: 'A sentence or two for the job list on the Co-op Jobs page.',
    }),
    defineField({
      name: 'stipend',
      title: 'Stipend',
      type: 'string',
      group: 'job',
      description: 'e.g. "$150 stipend". Only for the roles that carry one.',
    }),

    // ── Where it sits ────────────────────────────────────────────────────────
    defineField({
      name: 'tier',
      title: 'Where it sits',
      type: 'string',
      group: 'chart',
      description:
        'Which part of the chart draws this role. These five are fixed — they are the shapes the chart can draw. You choose which one each role uses, and you can rename what each is CALLED under "How the co-op works".',
      options: {
        list: [
          { title: 'Executive Board', value: 'board' },
          { title: 'Paid staff (chart only, not a co-op job)', value: 'staff' },
          { title: 'Cabinet chair', value: 'chairs' },
          { title: 'Class representative', value: 'reps' },
          { title: 'Committee', value: 'committee' },
        ],
        layout: 'dropdown',
      },
      validation: (R) => R.required().error('Pick where this role sits on the chart.'),
    }),
    defineField({
      name: 'reportsTo',
      title: 'Reports to',
      type: 'reference',
      group: 'chart',
      to: [{ type: 'coopRole' }],
      description:
        'The role above this one. The chart builds its columns from these lines: a Board role with people reporting to it gets its own column, and a committee appears as a small tag under whoever it reports to. Leave BLANK for the role at the very top (the President).',
      validation: (R) =>
        R.custom((value, ctx) => {
          const self = ctx.document?._id?.replace(/^drafts\./, '');
          const ref = (value as { _ref?: string } | undefined)?._ref;
          return ref && self && ref === self ? 'A role cannot report to itself.' : true;
        }),
    }),
    defineField({
      name: 'perClass',
      title: 'One of these for every class',
      type: 'boolean',
      group: 'chart',
      initialValue: false,
      description:
        'Tick this on the Class Rep role. The chart then shows one rep card per class automatically — add a class and its rep seat appears by itself. Leave it off for every other role.',
    }),
    defineField({
      name: 'team',
      title: 'How many people',
      type: 'string',
      group: 'chart',
      description: 'e.g. "4 members" or "One per class". Optional — shown on the tag.',
    }),

    // Legacy free-text "Reports to VP". Replaced by the reference above, which
    // is what lets the chart draw the line. Kept hidden so old documents still
    // validate and nothing was thrown away; scripts/patch-org-chart.mjs read it.
    defineField({
      name: 'reportsToLabel',
      title: 'Reports to (old text)',
      type: 'string',
      hidden: true,
    }),
    // Legacy manual sort — superseded by drag-to-reorder (orderRank), hidden.
    defineField({
      name: 'order',
      title: 'Sort order',
      type: 'number',
      initialValue: 0,
      hidden: true,
    }),
    orderRankField({ type: 'coopRole' }),
  ],
  orderings: [orderRankOrdering],
  preview: {
    select: { title: 'name', tier: 'tier', reportsTo: 'reportsTo.name', perClass: 'perClass' },
    prepare({ title, tier, reportsTo, perClass }) {
      const labels: Record<string, string> = {
        board: 'Executive Board',
        staff: 'Paid staff',
        chairs: 'Cabinet chair',
        reps: 'Class representative',
        committee: 'Committee',
      };
      const bits = [labels[tier] ?? tier];
      if (perClass) bits.push('one per class');
      if (reportsTo) bits.push(`reports to ${reportsTo}`);
      return { title, subtitle: bits.join(' · ') };
    },
  },
});
