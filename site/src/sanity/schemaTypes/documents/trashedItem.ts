import { defineType, defineField } from 'sanity';
import { typeLabel } from '../../typeLabels';

// =============================================================================
// trashedItem — one soft-deleted document, held for restore ("Recently deleted")
// =============================================================================
// Created ONLY by the Archive action (src/sanity/actions/archive.tsx): it stores
// a full JSON snapshot of a deleted document in `payload`, so nothing is truly
// gone until the board empties it. Restore rebuilds the original from `payload`;
// "Delete forever" removes this record. Never authored by hand, never read by the
// public site. All fields are read-only — it's a receipt, not a form.
// =============================================================================
export const trashedItem = defineType({
  name: 'trashedItem',
  title: 'Deleted item',
  type: 'document',
  icon: () => '🗑️',
  fields: [
    defineField({ name: 'title', title: 'What it was', type: 'string', readOnly: true }),
    defineField({ name: 'originalType', title: 'Kind', type: 'string', readOnly: true }),
    defineField({ name: 'deletedAt', title: 'Deleted', type: 'datetime', readOnly: true }),
    defineField({ name: 'originalId', title: 'Original ID', type: 'string', readOnly: true }),
    // The full document JSON. Hidden — it's machine data used only by Restore.
    defineField({ name: 'payload', title: 'Snapshot', type: 'text', readOnly: true, hidden: true }),
  ],
  orderings: [
    {
      title: 'Most recently deleted',
      name: 'newest',
      by: [{ field: 'deletedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: { title: 'title', type: 'originalType', at: 'deletedAt' },
    prepare({ title, type, at }) {
      const when = at ? new Date(at).toLocaleDateString('en-US', { timeZone: 'UTC' }) : '';
      return {
        title: title || 'Untitled',
        subtitle: [typeLabel(type), when ? `deleted ${when}` : ''].filter(Boolean).join(' · '),
      };
    },
  },
});
