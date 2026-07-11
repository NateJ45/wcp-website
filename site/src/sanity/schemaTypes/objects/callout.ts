import { defineType, defineField } from 'sanity';

// =============================================================================
// callout — a tinted notice box (→ Callout.astro)
// =============================================================================
// Reused as an optional TRAILING element on content sections (it sits inside
// the same band as the grid/table above it today, so it is not its own band).
// =============================================================================
export const callout = defineType({
  name: 'callout',
  title: 'Callout box',
  type: 'object',
  fields: [
    defineField({
      name: 'tone',
      title: 'Tone',
      type: 'string',
      options: {
        list: [
          { title: 'Sky (informational)', value: 'sky' },
          { title: 'Warm (friendly note)', value: 'warm' },
        ],
        layout: 'radio',
      },
      initialValue: 'warm',
    }),
    defineField({
      name: 'body',
      title: 'Text',
      type: 'inlineText',
      validation: (R) => R.required(),
    }),
  ],
  preview: {
    select: { tone: 'tone' },
    prepare({ tone }) {
      return { title: 'Callout', subtitle: tone };
    },
  },
});
