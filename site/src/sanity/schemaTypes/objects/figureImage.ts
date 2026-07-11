import { defineType, defineField } from 'sanity';

// =============================================================================
// figureImage — an uploaded photo with required alt text
// =============================================================================
// The single image primitive used everywhere in the builder (gallery photos,
// split-media rows, etc.). Hotspot on for smart cropping; alt REQUIRED so the
// accessibility gate can never regress.
// =============================================================================
export const figureImage = defineType({
  name: 'figureImage',
  title: 'Photo',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'alt',
      title: 'Alt text (describe the photo)',
      type: 'string',
      description:
        'A short description for screen readers and when the image fails to load. Required.',
      validation: (R) => R.required(),
    }),
    defineField({ name: 'caption', title: 'Caption (optional)', type: 'string' }),
  ],
  preview: {
    select: { media: 'image', title: 'alt', subtitle: 'caption' },
  },
});
