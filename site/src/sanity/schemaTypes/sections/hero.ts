import { defineType, defineField, defineArrayMember } from 'sanity';
import { richTwin, hiddenWhenRich } from '../objects/emphasisText';

// =============================================================================
// heroObject — the top-of-page banner (→ Hero.astro)
// =============================================================================
// A page-level field, NOT a section in the body array: every page has exactly
// one hero at the very top (the desktop overlay header depends on it). Media is
// none / a photo / a muted-loop video (with poster). One word of the title can
// be crayon-underlined for accent, reproducing the current <Underline> touch.
// =============================================================================
export const heroObject = defineType({
  name: 'heroObject',
  title: 'Hero',
  type: 'object',
  options: { collapsible: false },
  groups: [
    { name: 'text', title: 'Text', default: true },
    { name: 'media', title: 'Photo / video' },
  ],
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Small label above the title',
      type: 'string',
      group: 'text',
      description: 'An optional short line above the headline, e.g. "Since 1969".',
    }),
    defineField({
      name: 'title',
      title: 'Headline',
      type: 'text',
      rows: 2,
      group: 'text',
      description: 'The big line at the top of the page.',
      validation: (R) => R.required().error('Every page needs a headline at the top.'),
    }),
    defineField({
      name: 'accentWord',
      title: 'Underlined word (optional)',
      type: 'string',
      group: 'text',
      description:
        'One word (or phrase) from the headline to draw the crayon underline under, e.g. "belong". Must appear in the headline exactly.',
    }),
    defineField({
      name: 'accentColor',
      title: 'Underline colour',
      type: 'string',
      group: 'text',
      options: {
        list: [
          { title: 'Amber', value: 'amber' },
          { title: 'Orange', value: 'orange' },
          { title: 'Sky', value: 'sky' },
          { title: 'Green', value: 'green' },
        ],
        layout: 'dropdown',
      },
      initialValue: 'amber',
      hidden: ({ parent }) => !parent?.accentWord,
    }),
    defineField({
      name: 'lead',
      title: 'Intro line',
      type: 'text',
      rows: 3,
      group: 'text',
      description: 'An optional sentence or two under the headline.',
      hidden: hiddenWhenRich('leadRich'),
    }),
    richTwin('leadRich', {
      title: 'Intro line with bold or italic',
      group: 'text',
    }),
    defineField({
      name: 'actions',
      title: 'Buttons',
      type: 'array',
      of: [defineArrayMember({ type: 'actionButton' })],
      group: 'text',
      description:
        'Heads up: on almost every page the site places "Schedule a Tour" as the main hero button automatically. Your first button here shows as the quieter second button; extra buttons and the style choice are ignored in heroes.',
      validation: (R) => R.max(2).warning('Two buttons is the clean maximum.'),
    }),
    defineField({
      name: 'height',
      title: 'Height',
      type: 'string',
      group: 'text',
      // Video heroes take the framed layout, which sizes itself — the radio
      // is inert there (field audit 2026-08-23).
      hidden: ({ parent }) => parent?.mediaType === 'video',
      options: {
        list: [
          { title: 'Tall (home / landing)', value: 'tall' },
          { title: 'Medium (interior page)', value: 'medium' },
        ],
        layout: 'radio',
      },
      initialValue: 'medium',
    }),

    defineField({
      name: 'mediaType',
      title: 'Background',
      type: 'string',
      group: 'media',
      options: {
        list: [
          { title: 'Navy (no photo)', value: 'none' },
          { title: 'Photo', value: 'image' },
          { title: 'Video (with photo poster)', value: 'video' },
        ],
        layout: 'radio',
      },
      initialValue: 'image',
    }),
    defineField({
      name: 'image',
      title: 'Photo (also the video poster)',
      type: 'image',
      options: { hotspot: true },
      group: 'media',
      hidden: ({ parent }) => parent?.mediaType === 'none',
    }),
    defineField({
      name: 'imageAlt',
      title: 'Photo alt text',
      type: 'string',
      group: 'media',
      description: 'Describe the photo for screen readers.',
      hidden: ({ parent }) => parent?.mediaType === 'none',
      validation: (R) =>
        R.custom((value, ctx) => {
          const p = ctx.parent as { mediaType?: string; image?: unknown } | undefined;
          if (p?.mediaType && p.mediaType !== 'none' && p?.image && !value)
            return 'Please describe the photo.';
          return true;
        }),
    }),
    defineField({
      name: 'videoFile',
      title: 'Video (MP4)',
      type: 'file',
      options: { accept: 'video/mp4' },
      group: 'media',
      hidden: ({ parent }) => parent?.mediaType !== 'video',
    }),
    defineField({
      name: 'videoWebm',
      title: 'Video (WebM, optional, smaller)',
      type: 'file',
      options: { accept: 'video/webm' },
      group: 'media',
      // Hidden 2026-08-23 (field audit): asking a volunteer for a second
      // video ENCODING is developer work; the home hero's existing WebM
      // keeps rendering. A developer can re-show this when needed.
      hidden: true,
    }),
  ],
  preview: {
    select: { title: 'title', media: 'image' },
    prepare({ title, media }) {
      return { title: title || 'Hero', subtitle: 'Top-of-page banner', media };
    },
  },
});
