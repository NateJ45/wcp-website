import { defineType, defineField, defineArrayMember } from 'sanity';
import { ICON_NAMES } from '../objects/_shared';
import { BUILTIN_HUB_LINKS } from '../../../lib/hub-nav-doc';

// =============================================================================
// hubNavMenu — the Family Hub menu, Board-editable
// =============================================================================
// The hub-side sibling of the public `navigation` singleton: the groups on the
// rail, what each contains, what order, what it's called. Until now this was
// all hardcoded (src/data/hub-nav.ts, which remains the fallback when this
// document is missing or emptied).
//
// What a volunteer can do here: rename/reorder/add/remove groups, reorder and
// relabel the built-in links, move one to another group, hide one, and add
// links to Board-created pages or outside sites.
//
// What they deliberately cannot do:
//   - Touch the HOME link — pinned in code, so the front door can't be lost.
//   - Type a colour. Accents are a fixed set, each pre-checked for contrast
//     as label text on the rail's navy.
//   - Point a built-in link at a made-up address. Targets are a dropdown of
//     the routes that actually exist.
// =============================================================================

// True when the group a link sits in has "Fill this section with the class
// pages" on. Links in such a group are hidden and ignored by the site - so
// their validation must PASS, whatever they hold. Learned live 2026-08-29: the
// classroom redesign removed the class pages from BUILTIN_HUB_LINKS, the two
// stored links in the Classes group turned invalid, and switching the group to
// automatic HID them while their errors still BLOCKED publishing - a volunteer
// stared at "validation errors" with nothing visible to fix.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function groupIsAutomatic(context: any): boolean {
  const path = context?.path as unknown[] | undefined;
  const doc = context?.document as { groups?: { _key?: string; autoClasses?: boolean }[] };
  const groupKey = (path?.[1] as { _key?: string } | undefined)?._key;
  if (!groupKey || !Array.isArray(doc?.groups)) return false;
  return doc.groups.find((g) => g?._key === groupKey)?.autoClasses === true;
}

export const hubNavMenu = defineType({
  name: 'hubNavMenu',
  title: 'Family Hub menu',
  type: 'document',
  icon: () => '🧭',
  fields: [
    defineField({
      name: 'groups',
      title: 'Menu sections',
      type: 'array',
      description:
        'The sections of the Family Hub menu, in order. Home stays at the top on its own — it is not listed here so it can never be lost. Empty sections are skipped; empty the whole list to go back to the standard menu.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'navGroup',
          fields: [
            defineField({
              name: 'label',
              title: 'Section name',
              type: 'string',
              description: 'e.g. "Resources", "Committees".',
              validation: (R) => R.required().error('Every section needs a name.'),
            }),
            defineField({
              name: 'accent',
              title: 'Section colour',
              type: 'string',
              description:
                'The colour of the section name and its icons. These four are the only choices because each has been checked for readability on the menu’s navy.',
              options: {
                list: [
                  { title: 'Sky blue', value: 'sky' },
                  { title: 'Amber', value: 'amber' },
                  { title: 'Green', value: 'green' },
                  { title: 'Orange', value: 'orange' },
                ],
              },
              initialValue: 'sky',
            }),
            defineField({
              name: 'autoClasses',
              title: 'Fill this section with the class pages',
              type: 'boolean',
              initialValue: false,
              description:
                'On: this section lists every class page by itself, in the order the classes are in, and a class you add later appears here with no menu edit. Any links you add below are ignored while this is on.',
            }),
            defineField({
              name: 'links',
              title: 'Links',
              type: 'array',
              hidden: ({ parent }) => Boolean((parent as { autoClasses?: boolean })?.autoClasses),
              of: [
                // -- A page that came with the site -------------------------
                defineArrayMember({
                  type: 'object',
                  name: 'builtinLink',
                  title: 'Page that came with the site',
                  fields: [
                    defineField({
                      name: 'target',
                      title: 'Which page',
                      type: 'string',
                      options: {
                        list: BUILTIN_HUB_LINKS.map((l) => ({ title: l.label, value: l.href })),
                      },
                      validation: (R) =>
                        R.custom((value, context) => {
                          if (groupIsAutomatic(context)) return true;
                          if (!value) return 'Pick which page this links to.';
                          return BUILTIN_HUB_LINKS.some((l) => l.href === value)
                            ? true
                            : 'This page no longer exists — pick another, or remove this link.';
                        }),
                    }),
                    defineField({
                      name: 'label',
                      title: 'Shown as (optional)',
                      type: 'string',
                      description:
                        'A different name for the menu link. Leave empty for the usual one.',
                    }),
                    defineField({
                      name: 'hidden',
                      title: 'Hide from the menu',
                      type: 'boolean',
                      initialValue: false,
                      description:
                        'Takes it out of the menu without deleting the row. The page itself keeps working at its address.',
                    }),
                  ],
                  preview: {
                    select: { target: 'target', label: 'label', hidden: 'hidden' },
                    prepare({ target, label, hidden }) {
                      const base = BUILTIN_HUB_LINKS.find((l) => l.href === target);
                      return {
                        title:
                          (label || base?.label || target || 'Pick a page') +
                          (hidden ? ' (hidden)' : ''),
                        subtitle: 'Came with the site',
                      };
                    },
                  },
                }),
                // -- A Board-created page -----------------------------------
                defineArrayMember({
                  type: 'object',
                  name: 'pageLink',
                  title: 'Page you made',
                  fields: [
                    defineField({
                      name: 'page',
                      title: 'Which page',
                      type: 'reference',
                      to: [{ type: 'hubPage' }],
                      options: {
                        // Only free-standing Board pages: a built-in page is
                        // linked with the option above, by its real route.
                        filter: 'defined(slug) && !defined(hubKey)',
                      },
                      validation: (R) =>
                        R.custom((value, context) =>
                          groupIsAutomatic(context) || value
                            ? true
                            : 'Pick which page this links to.',
                        ),
                    }),
                    defineField({
                      name: 'label',
                      title: 'Shown as (optional)',
                      type: 'string',
                      description: 'Leave empty to use the page’s own name.',
                    }),
                  ],
                  preview: {
                    select: { title: 'page.title', label: 'label' },
                    prepare({ title, label }) {
                      return { title: label || title || 'Pick a page', subtitle: 'Page you made' };
                    },
                  },
                }),
                // -- An outside link ----------------------------------------
                defineArrayMember({
                  type: 'object',
                  name: 'externalLink',
                  title: 'Outside link',
                  fields: [
                    defineField({
                      name: 'label',
                      title: 'Shown as',
                      type: 'string',
                      validation: (R) =>
                        R.custom((value, context) =>
                          groupIsAutomatic(context) || value ? true : 'Give the link a name.',
                        ),
                    }),
                    defineField({
                      name: 'url',
                      title: 'Address',
                      type: 'url',
                      description: 'e.g. the store, or a sign-up site the school uses.',
                      validation: (R) =>
                        R.uri({ scheme: ['http', 'https'] }).custom((value, context) =>
                          groupIsAutomatic(context) || value ? true : 'Paste a full web address.',
                        ),
                    }),
                    defineField({
                      name: 'icon',
                      title: 'Icon',
                      type: 'string',
                      options: { list: ICON_NAMES.map((v) => ({ title: v, value: v })) },
                      initialValue: 'external-link',
                    }),
                  ],
                  preview: {
                    select: { title: 'label', subtitle: 'url' },
                  },
                }),
              ],
            }),
          ],
          preview: {
            select: { title: 'label', links: 'links' },
            prepare({ title, links }) {
              const n = Array.isArray(links) ? links.length : 0;
              return {
                title: title || 'Untitled section',
                subtitle: `${n} link${n === 1 ? '' : 's'}`,
              };
            },
          },
        }),
      ],
      // The pages a family cannot do without should take a deliberate second
      // look to remove — a warning, not an error, because a redesign might
      // genuinely relocate them.
      validation: (R) =>
        R.custom((groups) => {
          if (!Array.isArray(groups) || groups.length === 0) return true;
          const visible = new Set(
            groups.flatMap((g) =>
              (
                ((g as { links?: { _type?: string; target?: string; hidden?: boolean }[] }).links ??
                  []) as {
                  _type?: string;
                  target?: string;
                  hidden?: boolean;
                }[]
              )
                .filter((l) => l._type === 'builtinLink' && !l.hidden && l.target)
                .map((l) => l.target as string),
            ),
          );
          const missing = ['/family-hub/tuition', '/family-hub/directory'].filter(
            (href) => !visible.has(href),
          );
          if (missing.length === 0) return true;
          return {
            message: `Heads up: the menu no longer shows ${missing
              .map((m) => m.replace('/family-hub/', ''))
              .join(' or ')}. Families rely on those — make sure that is on purpose.`,
          };
        }).warning(),
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Family Hub menu', subtitle: 'Sections and links on the hub’s left rail' };
    },
  },
});
