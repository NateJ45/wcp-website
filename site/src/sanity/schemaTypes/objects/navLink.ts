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
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'The wording shown in the menu.',
      validation: (R) => R.required().error('Give the menu item a label.'),
    }),
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
      title: 'Web address',
      type: 'url',
      description: 'A full https:// address, or a path on this site like /events.',
      // allowRelative: the menus legitimately link code-owned routes that have
      // no page doc behind them (/events, /colophon, /family-hub, and the
      // /virtual-tour#sec-pp-tour-form deep link).
      validation: (R) => R.uri({ scheme: ['http', 'https'], allowRelative: true }),
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
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'The wording shown in the menu.',
      validation: (R) => R.required().error('Give the menu item a label.'),
    }),
    // The self-maintaining Classes dropdown (2026-08-29). With this on, the
    // group starts with one link per class page, derived from the Classes
    // list: each class points at the page whose address is classes/<slug>,
    // in the same drag order as the class list. A class with no page yet is
    // simply absent (never a dead link), and two classes sharing one page -
    // Pre-K AM and PM do - collapse to a single link carrying the PAGE's
    // title. The links below then follow the automatic ones.
    defineField({
      name: 'autoClasses',
      title: 'Start with a link for every class, automatically',
      type: 'boolean',
      description:
        'Adds a link for each class that has its own page, kept up to date by itself. Your links below appear after them.',
      initialValue: false,
    }),
    defineField({
      name: 'children',
      title: 'Links',
      type: 'array',
      of: [{ type: 'navLink' }],
    }),
  ],
  preview: {
    select: { title: 'label', children: 'children', autoClasses: 'autoClasses' },
    prepare({ title, children, autoClasses }) {
      const n = Array.isArray(children) ? children.length : 0;
      const auto = autoClasses ? 'all classes + ' : '';
      return { title: title || '(group)', subtitle: `${auto}${n} link${n === 1 ? '' : 's'}` };
    },
  },
});
