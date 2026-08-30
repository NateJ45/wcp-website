import { defineType, defineField } from 'sanity';
import { ClassroomPickInput } from '../components/ClassSelectInput';

// =============================================================================
// teacherNote — the teacher's welcome letter modal on a class hub page
// =============================================================================
// One per class PAGE: the same first-visit letter pattern as the President's
// note, but shown on that class's Family Hub page. Classes that share a page
// (Twos & Threes; Pre-K AM & PM) share one letter. Closing it remembers the
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
    // The list reads the LIVE class pages (see ClassroomPickInput), so a class
    // the Board adds can be given a welcome note the same day. It used to be a
    // hardcoded list of three, which made that impossible.
    defineField({
      name: 'class',
      title: 'Class page',
      type: 'string',
      group: 'showing',
      components: { input: ClassroomPickInput },
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
      title: 'Show the letter again to everyone',
      type: 'string',
      group: 'showing',
      description:
        'Families see the letter once, then it stays closed. When you rewrite it for a new year, type anything new here (e.g. "2027-28-welcome") and everyone sees the new letter once.',
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
      name: 'signoff',
      title: 'Sign-off',
      type: 'string',
      description: 'The line above the signature. Empty keeps “With warmth,”.',
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
