import { defineType, defineField } from 'sanity';

// =============================================================================
// teacherNote — the teacher's welcome letter modal on a class hub page
// =============================================================================
// One per class: the same first-visit letter pattern as the President's note,
// but shown on that class's Family Hub page. Closing it remembers the
// dismissal on that device; bumping the "version stamp" (e.g. for a new
// school year's letter) shows it once more for everyone in that class.
// =============================================================================
export const teacherNote = defineType({
  name: 'teacherNote',
  title: "Teacher's welcome note",
  type: 'document',
  groups: [
    { name: 'letter', title: 'The letter', default: true },
    { name: 'showing', title: 'When it shows' },
  ],
  fields: [
    defineField({
      name: 'class',
      title: 'Class',
      type: 'string',
      group: 'showing',
      options: {
        list: [
          { title: 'Twos', value: 'twos' },
          { title: 'Threes', value: 'threes' },
          { title: 'Pre-K (AM + PM)', value: 'pre-k' },
        ],
        layout: 'dropdown',
      },
      description: 'Which class page shows this letter.',
      validation: (R) => R.required().error('Pick which class page shows this letter.'),
    }),
    defineField({
      name: 'active',
      title: 'Show the note?',
      type: 'boolean',
      group: 'showing',
      initialValue: false,
      description: 'On: families see the letter once (per version). Off: never shows.',
    }),
    defineField({
      name: 'version',
      title: 'Version stamp',
      type: 'string',
      group: 'showing',
      description:
        'Change this (e.g. "2027-28-welcome") whenever the letter is rewritten, so families who dismissed the old one see the new one.',
      validation: (R) =>
        R.required().error('Give the letter a version stamp, e.g. "2026-27-welcome".'),
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      group: 'letter',
      description: 'e.g. "Welcome to Twos!"',
      validation: (R) => R.required().error('The letter needs a heading.'),
    }),
    defineField({
      name: 'dateLabel',
      title: 'Date line',
      type: 'string',
      group: 'letter',
      description: 'Shown under the heading, e.g. "May 2026".',
    }),
    defineField({
      name: 'salutation',
      title: 'Salutation',
      type: 'string',
      group: 'letter',
      description: 'e.g. "Dear Twos Families,"',
    }),
    defineField({
      name: 'body',
      title: 'Letter',
      type: 'blockContent',
      group: 'letter',
      validation: (R) => R.required().error('The letter itself can’t be blank.'),
    }),
    defineField({
      name: 'signName',
      title: 'Signed by',
      type: 'string',
      group: 'letter',
      description: 'e.g. "Erin Schmerr".',
      validation: (R) => R.required().error('Add the signer’s name.'),
    }),
    defineField({
      name: 'signRole',
      title: 'Signer role',
      type: 'string',
      group: 'letter',
      description: 'e.g. "Twos Teacher, 2026-27".',
    }),
    defineField({
      name: 'email',
      title: 'Contact email (optional)',
      type: 'string',
      group: 'letter',
      description: 'Shown as a button on the class page, e.g. erin@westchesterpreschool.org.',
    }),
    defineField({
      name: 'phone',
      title: 'Contact phone (optional)',
      type: 'string',
      group: 'letter',
      description:
        'Shown as a "Call or text" button beside the email, e.g. 513-543-4824. Digits, spaces, or dashes are all fine.',
    }),
    defineField({
      name: 'photo',
      title: 'Photo (optional)',
      type: 'image',
      options: { hotspot: true },
      group: 'letter',
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
      description: 'A friendly headshot. Shows as a circle beside the letter.',
    }),
  ],
  preview: {
    select: { active: 'active', heading: 'heading', version: 'version', cls: 'class' },
    prepare({ active, heading, version, cls }) {
      return {
        title: `${active ? '🟢' : '⚪'} ${heading || "Teacher's note"} (${cls ?? 'no class'})`,
        subtitle: version ? `version: ${version}` : 'no version stamp',
      };
    },
  },
});
