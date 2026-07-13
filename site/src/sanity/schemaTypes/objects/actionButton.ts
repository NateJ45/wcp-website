import { defineType, defineField } from 'sanity';

// =============================================================================
// actionButton — a labelled button/link (→ Button.astro)
// =============================================================================
// Used in hero + CTA action rows. Link is either an internal page (pick from
// the list — the URL is always correct even if a slug changes) or a manual URL
// / tel / mailto. `style` maps to Button.astro's variants; size is fixed by
// the renderer per context (large in heroes/CTAs).
// =============================================================================
export const actionButton = defineType({
  name: 'actionButton',
  title: 'Button',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Button text',
      type: 'string',
      description: 'What the button says, e.g. "Schedule a tour".',
      validation: (R) => R.required().error('Give the button some text.'),
    }),
    defineField({
      name: 'style',
      title: 'Style',
      type: 'string',
      options: {
        list: [
          { title: 'Solid orange (primary action)', value: 'accent' },
          { title: 'Outline on photo (white border)', value: 'outline-white' },
          { title: 'Solid navy', value: 'primary' },
          { title: 'Outline navy', value: 'outline' },
        ],
        layout: 'dropdown',
      },
      initialValue: 'accent',
    }),
    defineField({
      name: 'linkType',
      title: 'Links to',
      type: 'string',
      options: {
        list: [
          { title: 'A page on this site', value: 'page' },
          { title: 'A web address / email / phone', value: 'url' },
        ],
        layout: 'radio',
      },
      initialValue: 'page',
    }),
    defineField({
      name: 'page',
      title: 'Page',
      type: 'reference',
      to: [{ type: 'page' }],
      hidden: ({ parent }) => parent?.linkType === 'url',
    }),
    defineField({
      name: 'url',
      title: 'URL / email / phone',
      type: 'string',
      description:
        'e.g. https://…, mailto:someone@…, tel:+1…, or an on-page anchor like #tuition-table.',
      hidden: ({ parent }) => parent?.linkType !== 'url',
    }),
  ],
  preview: {
    select: { title: 'label', style: 'style' },
    prepare({ title, style }) {
      const labels: Record<string, string> = {
        accent: 'Solid orange',
        'outline-white': 'Outline (on photo)',
        primary: 'Solid navy',
        outline: 'Outline navy',
      };
      return { title: title || '(button)', subtitle: labels[style] ?? style };
    },
  },
});
