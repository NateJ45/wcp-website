import { defineType, defineField } from 'sanity';

// =============================================================================
// navLink / navGroup — editable menu items (→ src/data/nav.ts shapes)
// =============================================================================
// A navLink points either at a page on this site (pick from the list) or an
// external URL. A navGroup is a labelled dropdown of navLinks. getNavigation()
// resolves these into the NavItem/NavGroup shapes Header/Footer already expect.
// =============================================================================
export const navLink = defineType({
  name: 'navLink',
  title: 'Link',
  type: 'object',
  fields: [
    defineField({ name: 'label', title: 'Label', type: 'string', validation: (R) => R.required() }),
    defineField({
      name: 'linkType',
      title: 'Links to',
      type: 'string',
      options: {
        list: [
          { title: 'A page on this site', value: 'page' },
          { title: 'An external web address', value: 'url' },
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
      title: 'External URL',
      type: 'url',
      validation: (R) => R.uri({ scheme: ['http', 'https'] }),
      hidden: ({ parent }) => parent?.linkType !== 'url',
    }),
  ],
  preview: {
    select: { title: 'label', pageTitle: 'page.title', url: 'url' },
    prepare({ title, pageTitle, url }) {
      return {
        title: title || pageTitle || '(link)',
        subtitle: pageTitle ? `→ ${pageTitle}` : url,
      };
    },
  },
});

export const navGroup = defineType({
  name: 'navGroup',
  title: 'Dropdown group',
  type: 'object',
  fields: [
    defineField({ name: 'label', title: 'Label', type: 'string', validation: (R) => R.required() }),
    defineField({
      name: 'children',
      title: 'Links',
      type: 'array',
      of: [{ type: 'navLink' }],
    }),
  ],
  preview: {
    select: { title: 'label', children: 'children' },
    prepare({ title, children }) {
      const n = Array.isArray(children) ? children.length : 0;
      return { title: title || '(group)', subtitle: `${n} link${n === 1 ? '' : 's'}` };
    },
  },
});
