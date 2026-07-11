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
      validation: (R) => R.min(2).max(6),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'tab',
          fields: [
            defineField({
              name: 'label',
              title: 'Tab label',
              type: 'string',
              validation: (R) => R.required(),
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
