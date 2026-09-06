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
            name: 'internalLink',
            type: 'object',
            title: 'Page link',
            // A REFERENCE, not a pasted URL: rename the target page and every
            // link written this way keeps working (resolved at render by
            // src/lib/portable-text.ts). Prefer this over the raw-URL link
            // for anything on this site.
            fields: [
              {
                name: 'reference',
                type: 'reference',
                title: 'Page',
                to: [{ type: 'page' }, { type: 'post' }, { type: 'hubPage' }],
                validation: (R) => R.required(),
              },
            ],
          },
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
