import { defineType, defineArrayMember } from 'sanity';

// =============================================================================
// blockContent — constrained rich text
// =============================================================================
// Board members get bold/italic/links/lists and a couple of heading levels —
// deliberately NO raw HTML, no color/font controls, no custom styles. This is
// the "expose typed content, not code" rule: editors can't break the design.
// =============================================================================
export const blockContent = defineType({
  name: 'blockContent',
  title: 'Content',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'Heading', value: 'h3' },
        { title: 'Subheading', value: 'h4' },
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
                validation: (Rule) =>
                  Rule.uri({ scheme: ['http', 'https', 'mailto', 'tel'] }).required(),
              },
            ],
          },
        ],
      },
    }),
  ],
});
