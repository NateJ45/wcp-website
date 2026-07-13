import { defineType, defineField, defineArrayMember } from 'sanity';
import { bandFields } from '../objects/_shared';

// =============================================================================
// tabsSection — tabbed content (page-builder section)
// =============================================================================
// A set of labelled tabs, each holding a bit of rich text. Brand-locked: the
// tab styling is fixed; a volunteer only writes the labels and content. Renders
// through TabsSection.astro as an accessible ARIA tab widget (keyboard-navigable,
// and all content stays readable if JavaScript is off).
// =============================================================================
export const tabsSection = defineType({
  name: 'tabsSection',
  title: 'Tabs',
  type: 'object',
  fields: [
    defineField({ name: 'header', title: 'Heading (optional)', type: 'sectionHeader' }),
    defineField({
      name: 'tabs',
      title: 'Tabs',
      type: 'array',
      description: 'Add 2 to 6 tabs. Each has a short label and its own content.',
      validation: (R) =>
        R.min(2)
          .error('A tabs section needs at least two tabs.')
          .max(6)
          .error('Keep it to six tabs so the row fits.'),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'tab',
          fields: [
            defineField({
              name: 'label',
              title: 'Tab label',
              type: 'string',
              description: 'The short word on the tab, e.g. "Morning".',
              validation: (R) => R.required().error('Give the tab a label.'),
            }),
            defineField({ name: 'body', title: 'Content', type: 'inlineText' }),
          ],
          preview: {
            select: { title: 'label' },
            prepare({ title }) {
              return { title: title || 'Tab' };
            },
          },
        }),
      ],
    }),
    ...bandFields('white'),
  ],
  preview: {
    select: { title: 'header.title', tabs: 'tabs' },
    prepare({ title, tabs }) {
      const n = Array.isArray(tabs) ? tabs.length : 0;
      return { title: title || 'Tabs', subtitle: `${n} tab${n === 1 ? '' : 's'}` };
    },
  },
});
