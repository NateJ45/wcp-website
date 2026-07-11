import { defineType, defineField } from 'sanity';

// =============================================================================
// submission — a message sent through a website form
// =============================================================================
// These arrive from visitors (they are not authored in the Studio), so the
// board reads them here as an inbox. They can contain a prospective family's
// name, email, and phone, so treat them as private contact info. The website's
// /api/contact endpoint creates these with the server token; nobody types them.
// =============================================================================
export const submission = defineType({
  name: 'submission',
  title: 'Form submission',
  type: 'document',
  // Read-only inbox: no "create" from the Studio (they come from the website).
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', readOnly: true }),
    defineField({ name: 'email', title: 'Email', type: 'string', readOnly: true }),
    defineField({ name: 'phone', title: 'Phone', type: 'string', readOnly: true }),
    defineField({
      name: 'topic',
      title: 'Topic',
      type: 'string',
      readOnly: true,
      description: 'Which form it came from (e.g. "Tour request").',
    }),
    defineField({ name: 'message', title: 'Message', type: 'text', readOnly: true }),
    defineField({ name: 'pageUrl', title: 'From page', type: 'string', readOnly: true }),
    defineField({ name: 'submittedAt', title: 'Received', type: 'datetime', readOnly: true }),
    defineField({
      name: 'handled',
      title: 'Handled?',
      type: 'boolean',
      description: 'Check this once someone has replied. (You can edit this.)',
      initialValue: false,
    }),
  ],
  orderings: [
    { title: 'Newest first', name: 'newest', by: [{ field: 'submittedAt', direction: 'desc' }] },
  ],
  preview: {
    select: { name: 'name', topic: 'topic', at: 'submittedAt', handled: 'handled' },
    prepare({ name, topic, at, handled }) {
      const when = at ? new Date(at).toLocaleDateString('en-US', { timeZone: 'UTC' }) : '';
      return {
        title: `${handled ? '✓ ' : ''}${name ?? 'Someone'}`,
        subtitle: [topic, when].filter(Boolean).join(' · '),
      };
    },
  },
});
