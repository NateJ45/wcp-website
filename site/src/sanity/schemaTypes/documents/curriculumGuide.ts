import { defineType, defineField, defineArrayMember } from 'sanity';

// =============================================================================
// curriculumGuide — the class Curriculum Guide PDFs, Board-editable
// =============================================================================
// The branded PDFs on the hub class pages ("Curriculum guide (PDF)"). Their
// content lived only inside scripts/generate-curriculum.mjs, so a curriculum
// tweak needed a developer. One document per class now holds the words; the
// script reads them at build time and falls back to its committed content for
// any missing document or field. Design (fonts, colours, layout) stays code.
//
// The PDFs regenerate when the site next builds — a publish here triggers the
// deploy webhook, so an edit is live within a few minutes.
// =============================================================================
export const curriculumGuide = defineType({
  name: 'curriculumGuide',
  title: 'Curriculum guide (PDF)',
  type: 'document',
  icon: () => '📚',
  fields: [
    defineField({
      name: 'class',
      title: 'Which class',
      type: 'string',
      options: {
        list: [
          { title: 'Twos', value: 'twos' },
          { title: 'Threes', value: 'threes' },
          { title: 'Pre-K (both classes)', value: 'pre-k' },
        ],
      },
      validation: (R) => R.required().error('Pick the class this guide belongs to.'),
    }),
    defineField({
      name: 'kicker',
      title: 'Small line above the title',
      type: 'string',
      description: 'e.g. "Toddler Class · Age 2".',
    }),
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({
      name: 'intro',
      title: 'Opening paragraph',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'sections',
      title: 'Objective sections',
      type: 'array',
      description: 'One card per subject area, each with its list of objectives.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'icon',
              title: 'Emoji',
              type: 'string',
              description: 'One emoji for the card, e.g. 📖.',
            }),
            defineField({
              name: 'title',
              title: 'Section title',
              type: 'string',
              validation: (R) => R.required(),
            }),
            defineField({
              name: 'items',
              title: 'Objectives',
              type: 'array',
              of: [defineArrayMember({ type: 'string' })],
              description:
                'Plain bullet list. Leave empty when the section uses labelled lists below.',
            }),
            defineField({
              name: 'groups',
              title: 'Labelled lists (instead of plain objectives)',
              type: 'array',
              description:
                'Some sections group their objectives under labels. Use either this or the plain list, not both.',
              of: [
                defineArrayMember({
                  type: 'object',
                  fields: [
                    defineField({ name: 'label', title: 'Label', type: 'string' }),
                    defineField({
                      name: 'items',
                      title: 'Items',
                      type: 'array',
                      of: [defineArrayMember({ type: 'string' })],
                    }),
                  ],
                  preview: { select: { title: 'label' } },
                }),
              ],
            }),
          ],
          preview: {
            select: { title: 'title', items: 'items' },
            prepare({ title, items }) {
              const n = Array.isArray(items) ? items.length : 0;
              return {
                title: title || 'Untitled',
                subtitle: `${n} objective${n === 1 ? '' : 's'}`,
              };
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'conceptual',
      title: 'Conceptual areas (optional closing block)',
      type: 'object',
      description: 'The "areas introduced during the year" block, shown as labelled pill groups.',
      fields: [
        defineField({ name: 'heading', title: 'Heading', type: 'string' }),
        defineField({
          name: 'groups',
          title: 'Groups',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              fields: [
                defineField({ name: 'icon', title: 'Emoji', type: 'string' }),
                defineField({
                  name: 'title',
                  title: 'Group title',
                  type: 'string',
                  validation: (R) => R.required(),
                }),
                defineField({ name: 'note', title: 'Note under the group', type: 'string' }),
                defineField({
                  name: 'subgroups',
                  title: 'Labelled lists',
                  type: 'array',
                  of: [
                    defineArrayMember({
                      type: 'object',
                      fields: [
                        defineField({ name: 'label', title: 'Label', type: 'string' }),
                        defineField({
                          name: 'items',
                          title: 'Items',
                          type: 'array',
                          of: [defineArrayMember({ type: 'string' })],
                        }),
                      ],
                      preview: { select: { title: 'label' } },
                    }),
                  ],
                }),
              ],
              preview: { select: { title: 'title' } },
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: { cls: 'class', title: 'title' },
    prepare({ cls, title }) {
      const names: Record<string, string> = { twos: 'Twos', threes: 'Threes', 'pre-k': 'Pre-K' };
      return { title: title || 'Curriculum guide', subtitle: names[cls ?? ''] ?? cls };
    },
  },
});
