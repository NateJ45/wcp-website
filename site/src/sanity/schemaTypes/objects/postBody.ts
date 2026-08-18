import { defineType, defineArrayMember } from 'sanity';

// =============================================================================
// postBody — long-form rich text for blog/news posts
// =============================================================================
// Like richProse (h2/h3, quote, lists, bold/italic/link) but also allows
// inline images, file attachments, click-to-load videos, and small photo
// galleries inside the flow of a post. Used by News posts, newsletter issues,
// and hub Updates. Still no raw HTML, colours, or fonts. Renders through
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
    defineArrayMember({
      type: 'object',
      name: 'videoEmbed',
      title: 'Video',
      fields: [
        {
          name: 'url',
          type: 'url',
          title: 'YouTube or Vimeo link',
          description: 'Paste the video page link. It loads only when a family taps play.',
          validation: (R) => R.required().error('Paste the video link.'),
        },
        { name: 'title', type: 'string', title: 'Title (for screen readers)' },
      ],
      preview: {
        select: { title: 'title', subtitle: 'url' },
        prepare({ title, subtitle }) {
          return { title: title || 'Video', subtitle };
        },
      },
    }),
    defineArrayMember({
      type: 'object',
      name: 'postGallery',
      title: 'Photo gallery',
      fields: [
        {
          name: 'images',
          type: 'array',
          title: 'Photos',
          of: [
            {
              type: 'image',
              options: { hotspot: true },
              fields: [
                {
                  name: 'alt',
                  type: 'string',
                  title: 'Alt text',
                  validation: (R) => R.required(),
                },
                { name: 'caption', type: 'string', title: 'Caption (optional)' },
              ],
            },
          ],
          validation: (R) =>
            R.min(2).error('A gallery needs at least two photos — use Image for one.'),
        },
      ],
      preview: {
        select: { images: 'images' },
        prepare({ images }) {
          const n = Array.isArray(images) ? images.length : 0;
          return { title: 'Photo gallery', subtitle: `${n} photo${n === 1 ? '' : 's'}` };
        },
      },
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
