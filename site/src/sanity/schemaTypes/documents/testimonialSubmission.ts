import { defineType, defineField } from 'sanity';

// =============================================================================
// testimonialSubmission — a parent-submitted review, awaiting board approval
// =============================================================================
// Created by the public "share your story" form (/api/testimonial), never typed
// in the Studio. The board reviews it and clicks "Approve into Testimonials"
// (a document action) to turn it into a real, public Testimonial. Read-only
// fields — it's an inbox, not editable content.
// =============================================================================
export const testimonialSubmission = defineType({
  name: 'testimonialSubmission',
  title: 'Review submission',
  type: 'document',
  icon: () => '💬',
  fields: [
    defineField({ name: 'quote', title: 'Quote', type: 'text', rows: 4, readOnly: true }),
    defineField({ name: 'authorName', title: 'Name', type: 'string', readOnly: true }),
    defineField({ name: 'connection', title: 'Their connection', type: 'string', readOnly: true }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      readOnly: true,
      description: 'For following up. Not published.',
    }),
    defineField({
      name: 'permission',
      title: 'Gave permission to share',
      type: 'boolean',
      readOnly: true,
    }),
    defineField({ name: 'submittedAt', title: 'Received', type: 'datetime', readOnly: true }),
    defineField({
      name: 'handled',
      title: 'Handled?',
      type: 'boolean',
      description: 'Set automatically when you approve it. You can also check it to dismiss.',
      initialValue: false,
    }),
  ],
  orderings: [
    { title: 'Newest first', name: 'newest', by: [{ field: 'submittedAt', direction: 'desc' }] },
  ],
  preview: {
    select: { quote: 'quote', author: 'authorName', handled: 'handled', at: 'submittedAt' },
    prepare({ quote, author, handled, at }) {
      const when = at ? new Date(at).toLocaleDateString('en-US', { timeZone: 'UTC' }) : '';
      return {
        title: `${handled ? '✓ ' : ''}${(quote || '').slice(0, 50)}${quote && quote.length > 50 ? '…' : ''}`,
        subtitle: [author, when].filter(Boolean).join(' · '),
      };
    },
  },
});
