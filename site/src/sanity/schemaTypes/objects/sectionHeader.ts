import { defineType, defineField } from 'sanity';

// =============================================================================
// sectionHeader — eyebrow + title + optional lead
// =============================================================================
// The standard heading block that opens most sections (→ SectionHeader.astro).
// `eyebrowTone` is intentionally NOT here: the renderer derives it from the
// band background (amber on navy, sky elsewhere) so headers always read
// correctly — one less way to get it wrong.
// =============================================================================
export const sectionHeader = defineType({
  name: 'sectionHeader',
  title: 'Heading',
  type: 'object',
  options: { collapsible: false },
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Small label above the title',
      type: 'string',
      description: 'An optional short line above the heading, e.g. "Our classes".',
    }),
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({
      name: 'lead',
      title: 'Intro line (optional)',
      type: 'text',
      rows: 2,
      description: 'A sentence under the heading.',
    }),
    defineField({
      name: 'align',
      title: 'Alignment',
      type: 'string',
      options: {
        list: [
          { title: 'Centered', value: 'center' },
          { title: 'Left', value: 'left' },
        ],
        layout: 'radio',
      },
      initialValue: 'center',
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'eyebrow' },
    prepare({ title, subtitle }) {
      return { title: title || '(no title)', subtitle };
    },
  },
});
