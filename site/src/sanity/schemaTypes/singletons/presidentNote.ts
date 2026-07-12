import { defineType, defineField } from 'sanity';

// =============================================================================
// presidentNote (singleton) — the welcome letter modal on the Family Hub
// =============================================================================
// A friendly note from the Board President that pops up the FIRST time a
// family lands on the hub home each year. Closing it remembers the dismissal
// on that device; bumping the "version stamp" (e.g. for a new school year's
// letter) makes it appear once more for everyone. Turn "active" off to
// retire it entirely. The hub reads this live, so edits show immediately.
// =============================================================================
export const presidentNote = defineType({
  name: 'presidentNote',
  title: "President's note",
  type: 'document',
  fields: [
    defineField({
      name: 'active',
      title: 'Show the note?',
      type: 'boolean',
      initialValue: false,
      description: 'On: families see the letter once (per version). Off: never shows.',
    }),
    defineField({
      name: 'version',
      title: 'Version stamp',
      type: 'string',
      description:
        'Change this (e.g. "2027-28-welcome") whenever the letter is rewritten, so families who dismissed the old one see the new one.',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'e.g. "Welcome to WCP".',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'dateLabel',
      title: 'Date line',
      type: 'string',
      description: 'Shown under the heading, e.g. "May 2026".',
    }),
    defineField({
      name: 'salutation',
      title: 'Salutation',
      type: 'string',
      description: 'e.g. "Hello families!"',
    }),
    defineField({
      name: 'body',
      title: 'Letter',
      type: 'blockContent',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'signName',
      title: 'Signed by',
      type: 'string',
      description: 'e.g. "Rachel Gumpert".',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'signRole',
      title: 'Signer role',
      type: 'string',
      description: 'e.g. "Board President, 2026-27".',
    }),
    defineField({
      name: 'email',
      title: 'Contact email (optional)',
      type: 'string',
      description: 'Shown under the signature, e.g. president@westchesterpreschool.org.',
    }),
    defineField({
      name: 'photo',
      title: 'Photo (optional)',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
      description: 'A friendly headshot. Shows as a circle beside the letter.',
    }),
  ],
  preview: {
    select: { active: 'active', heading: 'heading', version: 'version' },
    prepare({ active, heading, version }) {
      return {
        title: `${active ? '🟢' : '⚪'} ${heading || "President's note"}`,
        subtitle: version ? `version: ${version}` : 'no version stamp',
      };
    },
  },
});
