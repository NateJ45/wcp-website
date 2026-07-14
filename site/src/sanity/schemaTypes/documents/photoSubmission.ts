import { defineType, defineField } from 'sanity';

// =============================================================================
// photoSubmission — a family-submitted photo, held for board moderation
// =============================================================================
// Created ONLY by the website (/family-hub/api/photo-submit) with the server
// token — never authored in the Studio, and never written directly by the
// browser. A family uploads a photo on the gated hub; it lands here unapproved.
// The board reviews it and flips "Approved" (then Publish) to make it appear in
// the gated /family-hub/photos gallery. Nothing here is ever shown on the public
// site — these are photos of children, families-only by design.
// =============================================================================
export const photoSubmission = defineType({
  name: 'photoSubmission',
  title: 'Family photo',
  type: 'document',
  icon: () => '📷',
  fields: [
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      readOnly: true,
    }),
    defineField({ name: 'caption', title: 'Caption', type: 'string', readOnly: true }),
    defineField({ name: 'submittedBy', title: 'From', type: 'string', readOnly: true }),
    defineField({
      name: 'approved',
      title: 'Approved',
      type: 'boolean',
      initialValue: false,
      description:
        'Turn on (then Publish) to show this photo in the Family Hub gallery. Leave off to keep it hidden. Delete a photo you don’t want to keep.',
    }),
    defineField({
      name: 'submittedAt',
      title: 'Received',
      type: 'datetime',
      readOnly: true,
    }),
  ],
  orderings: [
    { title: 'Newest first', name: 'newest', by: [{ field: 'submittedAt', direction: 'desc' }] },
  ],
  preview: {
    select: {
      caption: 'caption',
      by: 'submittedBy',
      approved: 'approved',
      at: 'submittedAt',
      media: 'photo',
    },
    prepare({ caption, by, approved, at, media }) {
      const when = at ? new Date(at).toLocaleDateString('en-US', { timeZone: 'UTC' }) : '';
      return {
        title: `${approved ? '✅ ' : '⏳ '}${caption || (by ? `From ${by}` : 'Photo')}`,
        subtitle: [by, when].filter(Boolean).join(' · '),
        media,
      };
    },
  },
});
