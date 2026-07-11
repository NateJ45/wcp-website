import { defineType, defineField } from 'sanity';

// =============================================================================
// subscriber — a newsletter sign-up
// =============================================================================
// Captured when someone submits the newsletter form. Stored in Sanity so the
// list is never lost, and (if a provider key is set) also pushed to the email
// service. Contains an email address, so treat as private contact info. Created
// by the website's /api/subscribe endpoint; not authored in the Studio.
// =============================================================================
export const subscriber = defineType({
  name: 'subscriber',
  title: 'Newsletter subscriber',
  type: 'document',
  fields: [
    defineField({ name: 'email', title: 'Email', type: 'string', readOnly: true }),
    defineField({ name: 'name', title: 'Name', type: 'string', readOnly: true }),
    defineField({ name: 'source', title: 'Signed up from', type: 'string', readOnly: true }),
    defineField({ name: 'subscribedAt', title: 'Subscribed', type: 'datetime', readOnly: true }),
  ],
  orderings: [
    { title: 'Newest first', name: 'newest', by: [{ field: 'subscribedAt', direction: 'desc' }] },
  ],
  preview: {
    select: { title: 'email', name: 'name', at: 'subscribedAt' },
    prepare({ title, name, at }) {
      const when = at ? new Date(at).toLocaleDateString('en-US', { timeZone: 'UTC' }) : '';
      return { title: title ?? 'Subscriber', subtitle: [name, when].filter(Boolean).join(' · ') };
    },
  },
});
