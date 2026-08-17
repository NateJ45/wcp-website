import { defineType, defineArrayMember } from 'sanity';

// =============================================================================
// postBody — long-form rich text for blog/news posts
// =============================================================================
// Like richProse (h2/h3, quote, lists, bold/italic/link) but also allows
// inline images and file attachments inside the flow of a post. Used by News
// posts, newsletter issues, and hub Updates. Still no raw HTML, colours, or
// fonts. Renders through renderPostBody() in src/lib/portable-text.ts.
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
    defineArrayMember({
      type: 'object',
      name: 'fileAttachment',
      title: 'Attachment',
      fields: [
        {
          name: 'file',
          type: 'file',
          title: 'File',
          description: 'A PDF, a form, a flyer. Families download it with one tap.',
          validation: (R) => R.required(),
        },
        {
          name: 'title',
          type: 'string',
          title: 'Shown as',
          description: 'e.g. "Field trip permission form (PDF)".',
          validation: (R) =>
            R.required().error('Name the attachment so families know what they tap.'),
        },
      ],
      preview: {
        select: { title: 'title' },
        prepare({ title }: { title?: string }) {
          return { title: title || 'Attachment', subtitle: 'File download' };
        },
      },
    }),
  ],
});
