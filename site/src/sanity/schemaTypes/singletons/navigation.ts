import { defineType, defineField, defineArrayMember } from 'sanity';

// =============================================================================
// navigation — the site's menus (singleton)
// =============================================================================
// The header menu, footer columns, and legal row. Lets a volunteer add a new
// page to the menus with no code change. getNavigation() (src/lib/cms.ts)
// reads this and falls back to src/data/nav.ts if it is empty, so the site
// never loses its menu.
// =============================================================================
export const navigation = defineType({
  name: 'navigation',
  title: 'Menus',
  type: 'document',
  icon: () => '🧭',
  groups: [
    { name: 'header', title: 'Header menu', default: true },
    { name: 'footer', title: 'Footer' },
  ],
  fields: [
    defineField({
      name: 'mainNav',
      title: 'Header menu',
      type: 'array',
      group: 'header',
      of: [defineArrayMember({ type: 'navLink' }), defineArrayMember({ type: 'navGroup' })],
    }),
    // The one button in the header (the tour ask). The code owns the default
    // wording and the tour-form link. These fields only OVERRIDE it, so an
    // empty object renders exactly what the site rendered before.
    defineField({
      name: 'headerCta',
      title: 'Header button',
      type: 'object',
      group: 'header',
      description:
        'The button at the top right of every page. Leave it alone to keep the "Schedule a Tour" button as it is.',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: 'show',
          title: 'Show the button',
          type: 'boolean',
          description: 'Turn this off to remove the button from the header. It is on by default.',
        }),
        defineField({
          name: 'label',
          title: 'Button wording',
          type: 'string',
          description: 'Leave blank to keep the wording the site ships with. Keep it short.',
        }),
        defineField({
          name: 'linkType',
          title: 'Button goes to',
          type: 'string',
          options: {
            list: [
              { title: 'A page on this site', value: 'page' },
              { title: 'A web address', value: 'url' },
            ],
            layout: 'radio',
          },
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
          description:
            'A full https:// address, or a path on this site like /enroll. Leave blank to keep the tour form link.',
          validation: (R) => R.uri({ scheme: ['http', 'https'], allowRelative: true }),
          hidden: ({ parent }) => parent?.linkType !== 'url',
        }),
      ],
    }),
    defineField({
      name: 'footerColumns',
      title: 'Footer columns',
      type: 'array',
      group: 'footer',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'footerColumn',
          title: 'Column',
          fields: [
            { name: 'label', title: 'Column heading', type: 'string' },
            { name: 'links', title: 'Links', type: 'array', of: [{ type: 'navLink' }] },
          ],
          preview: {
            select: { title: 'label', links: 'links' },
            prepare({ title, links }) {
              const n = Array.isArray(links) ? links.length : 0;
              return { title: title || '(column)', subtitle: `${n} link${n === 1 ? '' : 's'}` };
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'legalNav',
      title: 'Legal row (bottom of footer)',
      type: 'array',
      group: 'footer',
      of: [defineArrayMember({ type: 'navLink' })],
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Menus' };
    },
  },
});
