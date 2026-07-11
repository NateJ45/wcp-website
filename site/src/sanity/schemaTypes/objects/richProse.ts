import { defineType, defineArrayMember } from 'sanity';

// =============================================================================
// richProse — heading-capable long-form rich text
// =============================================================================
// For prose sections and the legal pages (Accessibility / Privacy / Terms),
// which need real <h2>/<h3> subheads + lists that plain `blockContent`
// deliberately forbids. Still no raw HTML / colours / fonts. Renders through
// Prose.astro.
// =============================================================================
export const richProse = defineType({
  name: 'richProse',
  title: 'Content',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'Heading', value: 'h2' },
        { title: 'Subheading', value: 'h3' },
        { title: 'Quote', value: 'blockquote' },
      ],
      lists: [
        { title: 'Bulleted', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Bold', value: 'strong' },
          { title: 'Italic', value: 'em' },
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [
              {
                name: 'href',
                type: 'url',
                title: 'URL',
                validation: (R) =>
                  R.uri({
                    scheme: ['http', 'https', 'mailto', 'tel'],
                    allowRelative: true,
                  }).required(),
              },
            ],
          },
        ],
      },
    }),
  ],
});
