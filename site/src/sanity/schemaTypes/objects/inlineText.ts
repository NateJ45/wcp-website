import { defineType, defineArrayMember } from 'sanity';

// =============================================================================
// inlineText — one-line-ish rich text (bold / italic / link only)
// =============================================================================
// For callouts, notice bars and CTA notes: a sentence or two that may carry a
// link, but no headings, lists, or block styles. Mirrors blockContent's
// constrained-marks philosophy.
// =============================================================================
export const inlineText = defineType({
  name: 'inlineText',
  title: 'Text',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [{ title: 'Normal', value: 'normal' }],
      lists: [],
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
