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
      name: 'variant',
      title: 'Form fields',
      type: 'string',
      options: {
        list: [
          { title: 'General (subject + message)', value: 'general' },
          { title: 'Enrollment inquiry (child details + classes)', value: 'enroll' },
          { title: 'Waitlist / interest (child + class + start)', value: 'waitlist' },
          { title: 'Tour request (child + preferred dates)', value: 'tour' },
          { title: 'Teaching application (experience + certification)', value: 'teach' },
        ],
        layout: 'radio',
      },
      initialValue: 'general',
      description: 'Which set of questions the form asks (matches the forms families know).',
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

// =============================================================================
// newsletterSignupSection — an email sign-up form
// =============================================================================
// Just an email (and optionally a name). Stores subscribers in Sanity and, if a
// provider key is set, pushes to the email service. Renders through
// NewsletterSection.astro → NewsletterSignup.astro.
// =============================================================================
export const newsletterSignupSection = defineType({
  name: 'newsletterSignupSection',
  title: 'Newsletter sign-up',
  type: 'object',
  fields: [
    defineField({ name: 'header', title: 'Heading (optional)', type: 'sectionHeader' }),
    defineField({
      name: 'askName',
      title: 'Ask for a name too?',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'buttonLabel',
      title: 'Button label',
      type: 'string',
      initialValue: 'Subscribe',
    }),
    defineField({
      name: 'successMessage',
      title: 'Thank-you message',
      type: 'text',
      rows: 2,
      initialValue: "You're on the list! Watch your inbox for our next update.",
    }),
    ...bandFields('cream'),
  ],
  preview: {
    select: { title: 'header.title' },
    prepare({ title }) {
      return { title: title || 'Newsletter sign-up', subtitle: 'Email capture' };
    },
  },
});

// =============================================================================
// reviewFormSection — "share your story" (a parent-submitted review)
// =============================================================================
// A form families fill in to leave a review. It doesn't go public on its own:
// it lands in the Studio (Review submissions) and the board approves the good
// ones into Testimonials with one click. Posts to /api/testimonial.
// =============================================================================
export const reviewFormSection = defineType({
  name: 'reviewFormSection',
  title: 'Leave a review form',
  type: 'object',
  description:
    'A form where families share a review. Submissions go to "Review submissions" for you to approve into Testimonials, so nothing appears on the site without your OK.',
  fields: [
    defineField({ name: 'header', title: 'Heading (optional)', type: 'sectionHeader' }),
    defineField({
      name: 'buttonLabel',
      title: 'Button label',
      type: 'string',
      initialValue: 'Share your review',
    }),
    ...bandFields('cream'),
  ],
  preview: {
    select: { title: 'header.title' },
    prepare({ title }) {
      return { title: title || 'Leave a review', subtitle: 'Parent reviews (you approve them)' };
    },
  },
});
