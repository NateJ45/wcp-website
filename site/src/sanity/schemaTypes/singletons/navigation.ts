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
