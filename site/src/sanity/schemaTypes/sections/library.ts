import { defineType, defineField, defineArrayMember } from 'sanity';
import { bandFields } from '../objects/_shared';

// =============================================================================
// Library sections — pull from the shared document collections (testimonials,
// staff, classes, FAQs, school-year events) OR hold one-off inline content.
// =============================================================================

export const testimonialSection = defineType({
  name: 'testimonialSection',
  title: 'Testimonials',
  type: 'object',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'appearance', title: 'Appearance' },
  ],
  fields: [
    defineField({
      name: 'header',
      title: 'Heading (optional)',
      type: 'sectionHeader',
      group: 'content',
    }),
    defineField({
      name: 'source',
      title: 'Which quotes',
      type: 'string',
      group: 'content',
      options: {
        list: [
          { title: 'Featured quotes', value: 'featured' },
          { title: 'All quotes', value: 'all' },
          { title: 'By class tag', value: 'tag' },
          { title: 'Pick specific ones', value: 'manual' },
        ],
        layout: 'radio',
      },
      initialValue: 'featured',
    }),
    defineField({
      name: 'tag',
      title: 'Class tag',
      type: 'string',
      group: 'content',
      options: {
        list: [
          { title: 'Twos', value: 'twos' },
          { title: 'Threes', value: 'threes' },
          { title: 'Pre-K', value: 'prek' },
          { title: 'Alumni', value: 'alumni' },
        ],
      },
      hidden: ({ parent }) => parent?.source !== 'tag',
    }),
    defineField({
      name: 'limit',
      title: 'How many (max)',
      type: 'number',
      group: 'content',
      initialValue: 3,
      hidden: ({ parent }) => parent?.source === 'manual',
    }),
    defineField({
      name: 'manualItems',
      title: 'Quotes',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'testimonial' }] })],
      hidden: ({ parent }) => parent?.source !== 'manual',
    }),
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      group: 'appearance',
      options: {
        list: [
          { title: 'Row of cards', value: 'grid' },
          { title: 'Full wall', value: 'wall' },
        ],
        layout: 'radio',
      },
      initialValue: 'grid',
    }),
    defineField({
      name: 'confetti',
      title: 'Confetti on the 5-star rating',
      type: 'boolean',
      group: 'appearance',
      initialValue: false,
    }),
    ...bandFields('white'),
  ],
  preview: {
    select: { title: 'header.title', source: 'source' },
    prepare({ title, source }) {
      const labels: Record<string, string> = {
        featured: 'Featured quotes',
        all: 'All quotes',
        tag: 'By class tag',
        manual: 'Hand-picked',
      };
      return { title: title || 'Testimonials', subtitle: labels[source] ?? 'Testimonials' };
    },
  },
});

export const teacherSection = defineType({
  name: 'teacherSection',
  title: 'Teachers',
  type: 'object',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'appearance', title: 'Appearance' },
  ],
  fields: [
    defineField({
      name: 'header',
      title: 'Heading (optional)',
      type: 'sectionHeader',
      group: 'content',
    }),
    // Which teachers the cards show (2026-08-29, same move as the class
    // cards). "all" keeps the whole-staff walls (Why WCP, Visit) current by
    // themselves when someone is hired or leaves. "classTeacher" is for a
    // CLASS page's "Meet the teacher" card: it derives this page's class's
    // teacher through the class doc, so replacing a teacher on the class
    // updates the card with no page edit - the propagation gap found in the
    // 2026-08-29 teacher-replacement walkthrough. Manual still exists for a
    // genuinely curated pick.
    defineField({
      name: 'source',
      title: 'Which teachers?',
      type: 'string',
      group: 'content',
      options: {
        layout: 'radio',
        list: [
          { title: 'All teachers, automatically (updates itself)', value: 'all' },
          { title: "This page's class teacher, automatically", value: 'classTeacher' },
          { title: 'Only the ones I pick below', value: 'manual' },
        ],
      },
      initialValue: 'manual',
    }),
    defineField({
      name: 'staff',
      title: 'Teachers',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'staff' }] })],
      description: 'Pick from Staff — their name, photo, and bio come from there.',
      hidden: ({ parent }) =>
        (parent as { source?: string } | undefined)?.source === 'all' ||
        (parent as { source?: string } | undefined)?.source === 'classTeacher',
      validation: (R) =>
        R.custom((value, context) => {
          const source = (context.parent as { source?: string } | undefined)?.source;
          if (source === 'all' || source === 'classTeacher') return true;
          return Array.isArray(value) && value.length > 0
            ? true
            : 'Pick at least one teacher, switch to an automatic option, or remove this section.';
        }),
    }),
    defineField({
      name: 'callout',
      title: 'Callout below (optional)',
      type: 'callout',
      group: 'content',
    }),
    ...bandFields('white'),
  ],
  preview: {
    select: { title: 'header.title', source: 'source' },
    prepare({ title, source }) {
      const labels: Record<string, string> = {
        all: 'All teachers (automatic)',
        classTeacher: "This class's teacher (automatic)",
      };
      return { title: title || 'Teachers', subtitle: labels[source as string] ?? 'Teacher cards' };
    },
  },
});

export const classCardsSection = defineType({
  name: 'classCardsSection',
  title: 'Class cards',
  type: 'object',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'appearance', title: 'Appearance' },
  ],
  fields: [
    defineField({
      name: 'header',
      title: 'Heading (optional)',
      type: 'sectionHeader',
      group: 'content',
    }),
    // Which classes the row shows (2026-08-29). "all" is the answer to the
    // stale-grid problem found in the add-a-class walkthrough: the featured
    // rows on Home / Enroll / Visit each hand-picked every class, so a new
    // class silently missed all three. In "all" mode the row derives from the
    // Classes list itself (same drag order), and a new class appears the
    // moment it publishes. Manual stays for rows that genuinely curate - the
    // Pre-K page shows only its own two classes.
    defineField({
      name: 'source',
      title: 'Which classes?',
      type: 'string',
      group: 'content',
      options: {
        layout: 'radio',
        list: [
          { title: 'All classes, automatically (updates itself)', value: 'all' },
          { title: 'Only the ones I pick below', value: 'manual' },
        ],
      },
      initialValue: 'manual',
    }),
    defineField({
      name: 'classes',
      title: 'Classes',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'class' }] })],
      description: 'Pick from Classes — schedule, ages, and price come from there.',
      hidden: ({ parent }) => (parent as { source?: string } | undefined)?.source === 'all',
      validation: (R) =>
        R.custom((value, context) => {
          const source = (context.parent as { source?: string } | undefined)?.source;
          if (source === 'all') return true;
          return Array.isArray(value) && value.length > 0
            ? true
            : 'Pick at least one class, switch to "All classes", or remove this section.';
        }),
    }),
    ...bandFields('white'),
  ],
  preview: {
    select: { title: 'header.title' },
    prepare({ title }) {
      return { title: title || 'Class cards', subtitle: 'Class cards' };
    },
  },
});

export const faqSection = defineType({
  name: 'faqSection',
  title: 'FAQ',
  type: 'object',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'appearance', title: 'Appearance' },
  ],
  fields: [
    defineField({
      name: 'header',
      title: 'Heading (optional)',
      type: 'sectionHeader',
      group: 'content',
    }),
    defineField({
      name: 'source',
      title: 'Which questions',
      type: 'string',
      group: 'content',
      options: {
        list: [
          { title: 'A category from the FAQ library', value: 'category' },
          { title: 'Write them here', value: 'inline' },
        ],
        layout: 'radio',
      },
      initialValue: 'category',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      group: 'content',
      options: {
        list: [
          { title: 'About the Co-op', value: 'coop' },
          { title: 'Classes & Schedules', value: 'classes' },
          { title: 'Enrollment & Fees', value: 'enrollment' },
          { title: 'About WCP', value: 'about' },
          { title: 'Donations', value: 'donation' },
        ],
      },
      hidden: ({ parent }) => parent?.source !== 'category',
    }),
    defineField({
      name: 'inlineItems',
      title: 'Questions & answers',
      type: 'array',
      group: 'content',
      hidden: ({ parent }) => parent?.source !== 'inline',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'qa',
          fields: [
            {
              name: 'question',
              title: 'Question',
              type: 'string',
              validation: (R) => R.required().error('Write the question.'),
            },
            { name: 'answer', title: 'Answer', type: 'blockContent' },
          ],
          preview: { select: { title: 'question' } },
        }),
      ],
    }),
    ...bandFields('grey'),
  ],
  preview: {
    select: { title: 'header.title', category: 'category' },
    prepare({ title, category }) {
      const labels: Record<string, string> = {
        coop: 'About the Co-op',
        classes: 'Classes & Schedules',
        enrollment: 'Enrollment & Fees',
        about: 'About WCP',
        donation: 'Donations',
      };
      return {
        title: title || 'FAQ',
        subtitle: category ? (labels[category] ?? category) : 'FAQ',
      };
    },
  },
});

export const schoolYearSection = defineType({
  name: 'schoolYearSection',
  title: 'School-year moments',
  type: 'object',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'appearance', title: 'Appearance' },
  ],
  fields: [
    defineField({
      name: 'header',
      title: 'Heading (optional)',
      type: 'sectionHeader',
      group: 'content',
    }),
    ...bandFields('white'),
  ],
  preview: {
    select: { title: 'header.title' },
    prepare({ title }) {
      return { title: title || 'School-year moments', subtitle: 'From School-Year Events' };
    },
  },
});

export const tuitionTableSection = defineType({
  name: 'tuitionTableSection',
  title: 'Tuition table',
  type: 'object',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'appearance', title: 'Appearance' },
  ],
  fields: [
    defineField({
      name: 'header',
      title: 'Heading (optional)',
      type: 'sectionHeader',
      group: 'content',
    }),
    // Hidden 2026-08-23 (field audit): an invisible screen-reader duplicate
    // of the visible heading; the renderer already has a sensible default.
    defineField({
      name: 'caption',
      title: 'Table caption (for screen readers)',
      type: 'string',
      group: 'content',
      hidden: true,
    }),
    defineField({
      name: 'callout',
      title: 'Callout below (optional)',
      type: 'callout',
      group: 'content',
    }),
    ...bandFields('grey'),
  ],
  preview: {
    select: { title: 'header.title' },
    prepare({ title }) {
      return { title: title || 'Tuition table', subtitle: 'Built from Classes + Tuition & Fees' };
    },
  },
});

export const tuitionCalculatorSection = defineType({
  name: 'tuitionCalculatorSection',
  title: 'Tuition calculator',
  type: 'object',
  description:
    'An interactive "what will it cost?" tool. Visitors pick their class(es) and see the monthly tuition and fees, from your live Classes + Tuition & Fees. Great on the enroll or tuition page.',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'appearance', title: 'Appearance' },
  ],
  fields: [
    defineField({
      name: 'header',
      title: 'Heading (optional)',
      type: 'sectionHeader',
      group: 'content',
    }),
    defineField({
      name: 'note',
      title: 'Small print (optional)',
      type: 'string',
      group: 'content',
      description:
        'A reminder shown under the total, e.g. "Estimate only. Confirm with the office."',
      initialValue: 'This is an estimate. We will confirm exact amounts when you enroll.',
    }),
    ...bandFields('grey'),
  ],
  preview: {
    select: { title: 'header.title' },
    prepare({ title }) {
      return { title: title || 'Tuition calculator', subtitle: 'Interactive cost estimate' };
    },
  },
});

export const enrollmentCtaSection = defineType({
  name: 'enrollmentCtaSection',
  title: 'Enrollment status banner',
  type: 'object',
  description:
    'A call-to-action whose wording and button follow the Enrollment mode in Site Settings (Apply now / Join the waitlist / Opens soon). Flip the mode once and every one of these updates.',
  fields: [
    defineField({
      name: 'linkType',
      title: 'Button goes to',
      type: 'string',
      options: {
        list: [
          { title: 'A page on this site', value: 'page' },
          { title: 'A web address', value: 'url' },
        ],
        layout: 'radio',
      },
      initialValue: 'page',
    }),
    defineField({
      name: 'page',
      title: 'Page',
      type: 'reference',
      to: [{ type: 'page' }],
      description: 'Usually your enroll or contact page.',
      hidden: ({ parent }) => parent?.linkType === 'url',
    }),
    defineField({
      name: 'url',
      title: 'Web address',
      type: 'url',
      hidden: ({ parent }) => parent?.linkType !== 'url',
      validation: (R) => R.uri({ scheme: ['http', 'https'] }),
    }),
    ...bandFields('navy'),
  ],
  preview: {
    prepare() {
      return { title: 'Enrollment status banner', subtitle: 'Follows the Enrollment mode' };
    },
  },
});
