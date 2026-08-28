import { defineType, defineField } from 'sanity';
import { richTwin, hiddenWhenRich } from './emphasisText';

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
    // One word or phrase from the title gets the crayon underline the heroes
    // already use. The renderer matches the FIRST occurrence and ignores
    // capitalization, so an editor can type it however they like. Nothing to
    // pick a colour with: the underline is always the brand amber, which is
    // the brand-lock rule (content control, no design control).
    defineField({
      name: 'headingAccent',
      title: 'Word to underline (optional)',
      type: 'string',
      description:
        'Type one word or short phrase from the title above to draw the crayon underline under it, e.g. "belong". Use it on one heading per page.',
      hidden: ({ parent }) => !parent?.title,
    }),
    defineField({
      name: 'lead',
      title: 'Intro line (optional)',
      type: 'text',
      rows: 2,
      description: 'A sentence under the heading.',
      hidden: hiddenWhenRich('leadRich'),
    }),
    richTwin('leadRich', { title: 'Intro line with bold or italic (optional)' }),
    // Hidden 2026-08-23 (field audit): only 14 of 40 section bridges ever
    // honoured it, so the radio silently did nothing on most sections —
    // worse than no control. Centered is the page rhythm; the 3 live
    // left-aligned headers keep rendering where they already worked.
    defineField({
      name: 'align',
      title: 'Alignment',
      type: 'string',
      hidden: true,
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
