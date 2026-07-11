import { defineType, defineField } from 'sanity';
import { bandFields } from '../objects/_shared';

// =============================================================================
// formSection — a contact / tour-request / inquiry form
// =============================================================================
// Fixed fields (name, email, optional phone, message) so it stays on-brand and
// simple — no arbitrary form builder. The `topic` tags the submission and the
// notification email so the board knows which form it came from. Submissions
// are stored in Sanity (Form submissions) and, if a Resend key is set, emailed
// to the office. Renders through FormSection.astro → ContactForm.astro.
// =============================================================================
export const formSection = defineType({
  name: 'formSection',
  title: 'Contact form',
  type: 'object',
  fields: [
    defineField({ name: 'header', title: 'Heading (optional)', type: 'sectionHeader' }),
    defineField({
      name: 'topic',
      title: 'Topic',
      type: 'string',
      description: 'Labels the message in your inbox and email, e.g. "Tour request".',
      initialValue: 'Contact us',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'showPhone',
      title: 'Ask for a phone number?',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'buttonLabel',
      title: 'Button label',
      type: 'string',
      initialValue: 'Send message',
    }),
    defineField({
      name: 'successMessage',
      title: 'Thank-you message',
      type: 'text',
      rows: 2,
      initialValue: 'Thank you! We have your message and will be in touch soon.',
    }),
    ...bandFields('grey'),
  ],
  preview: {
    select: { title: 'header.title', topic: 'topic' },
    prepare({ title, topic }) {
      return { title: title || 'Contact form', subtitle: topic ? `Topic: ${topic}` : 'Form' };
    },
  },
});
