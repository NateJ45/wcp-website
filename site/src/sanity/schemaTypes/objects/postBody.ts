import { defineType, defineArrayMember } from 'sanity';

// =============================================================================
// postBody — long-form rich text for blog/news posts
// =============================================================================
// Like richProse (h2/h3, quote, lists, bold/italic/link) but also allows
// inline images inside the flow of a post — the one place a volunteer writes
// a full article. Still no raw HTML, colours, or fonts. Renders through
// renderPostBody() in src/lib/portable-text.ts.
// =============================================================================
export const postBody = defineType({
  name: 'postBody',
  title: 'Post body',
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
    defineArrayMember({
      type: 'image',
      title: 'Image',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt text',
          description: 'A short description of the photo, for screen readers.',
          validation: (R) => R.required(),
        },
        { name: 'caption', type: 'string', title: 'Caption (optional)' },
      ],
    }),
  ],
});
