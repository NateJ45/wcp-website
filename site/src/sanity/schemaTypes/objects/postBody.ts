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
      name: 'calloutBlock',
      title: 'Callout box',
      fields: [
        {
          name: 'tone',
          type: 'string',
          title: 'Look',
          options: {
            list: [
              { title: 'Info (sky)', value: 'sky' },
              { title: 'Important (warm)', value: 'warm' },
            ],
            layout: 'radio',
          },
          initialValue: 'sky',
        },
        {
          name: 'text',
          type: 'text',
          rows: 3,
          title: 'Text',
          validation: (R) => R.required().error('Write the callout text.'),
        },
      ],
      preview: {
        select: { title: 'text', tone: 'tone' },
        prepare({ title, tone }) {
          return { title: title || 'Callout', subtitle: tone === 'warm' ? 'Important' : 'Info' };
        },
      },
    }),
    defineArrayMember({
      type: 'object',
      name: 'buttonBlock',
      title: 'Button',
      fields: [
        {
          name: 'label',
          type: 'string',
          title: 'Button text',
          validation: (R) => R.required().error('Give the button a label.'),
        },
        {
          name: 'url',
          type: 'url',
          title: 'Where it goes',
          description: 'A page on this site (/family-hub/sign-ups) or a full web address.',
          validation: (R) =>
            R.required()
              .uri({ scheme: ['http', 'https', 'mailto', 'tel'], allowRelative: true })
              .error('Give the button a link.'),
        },
      ],
      preview: {
        select: { title: 'label', subtitle: 'url' },
      },
    }),
    defineArrayMember({
      type: 'object',
      name: 'signupCard',
      title: 'Sign-up sheet card',
      fields: [
        {
          name: 'sheet',
          type: 'reference',
          title: 'Which sign-up sheet',
          to: [{ type: 'signupSheet' }],
          validation: (R) => R.required().error('Pick the sheet.'),
        },
      ],
      preview: {
        select: { title: 'sheet.title' },
        prepare({ title }) {
          return { title: title || 'Sign-up sheet card', subtitle: 'Sign-up card' };
        },
      },
    }),
    defineArrayMember({
      type: 'object',
      name: 'eventCard',
      title: 'Event card',
      fields: [
        {
          name: 'event',
          type: 'reference',
          title: 'Which event',
          to: [{ type: 'event' }],
          validation: (R) => R.required().error('Pick the event.'),
        },
      ],
      preview: {
        select: { title: 'event.title' },
        prepare({ title }) {
          return { title: title || 'Event card', subtitle: 'Event card' };
        },
      },
    }),
    defineArrayMember({
      type: 'object',
      name: 'tableBlock',
      title: 'Table',
      fields: [
        {
          name: 'headerRow',
          type: 'boolean',
          title: 'First row is headings',
          initialValue: true,
        },
        {
          name: 'rows',
          type: 'array',
          title: 'Rows',
          of: [
            {
              type: 'object',
              name: 'tableRow',
              fields: [
                {
                  name: 'cells',
                  type: 'array',
                  title: 'Cells',
                  of: [{ type: 'string' }],
                },
              ],
              preview: {
                select: { cells: 'cells' },
                prepare({ cells }: { cells?: string[] }) {
                  return { title: (cells ?? []).join(' · ') || 'Empty row' };
                },
              },
            },
          ],
          validation: (R) => R.min(2).error('A table needs at least two rows.'),
        },
      ],
      preview: {
        select: { rows: 'rows' },
        prepare({ rows }) {
          const n = Array.isArray(rows) ? rows.length : 0;
          return { title: 'Table', subtitle: `${n} row${n === 1 ? '' : 's'}` };
        },
      },
    }),
    defineArrayMember({
      type: 'object',
      name: 'twoColumns',
      title: 'Two columns',
      description: 'Two text columns side by side. Phones stack them.',
      fields: [
        { name: 'left', type: 'blockContent', title: 'Left column' },
        { name: 'right', type: 'blockContent', title: 'Right column' },
      ],
      preview: {
        prepare() {
          return { title: 'Two columns' };
        },
      },
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
