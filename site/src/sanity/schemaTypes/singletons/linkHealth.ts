import { defineType, defineField, defineArrayMember } from 'sanity';

// =============================================================================
// linkHealth — the weekly share-link check, as a Studio-readable record
// =============================================================================
// scripts/check-live-links.mjs writes this every Monday (the link-health
// workflow). It pings every Board-entered Google link: helper schedules, photo
// albums, the budget Sheet, the calendar feed, and the Documents page links.
// A dead link shows here with a plain-English note, so the Board fixes it
// before a parent finds it. Every field is read-only — a report, not a form.
// =============================================================================
export const linkHealth = defineType({
  name: 'linkHealth',
  title: 'Link health',
  type: 'document',
  icon: () => '🩺',
  fields: [
    defineField({ name: 'checkedAt', title: 'Last checked', type: 'datetime', readOnly: true }),
    defineField({
      name: 'allOk',
      title: 'Everything healthy?',
      type: 'boolean',
      readOnly: true,
    }),
    defineField({ name: 'summary', title: 'Summary', type: 'string', readOnly: true }),
    defineField({
      name: 'results',
      title: 'Every link, one row each',
      type: 'array',
      readOnly: true,
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'What it is', type: 'string', readOnly: true }),
            defineField({ name: 'ok', title: 'Working?', type: 'boolean', readOnly: true }),
            defineField({ name: 'note', title: 'Status', type: 'string', readOnly: true }),
            defineField({ name: 'url', title: 'The link', type: 'url', readOnly: true }),
          ],
          preview: {
            select: { label: 'label', ok: 'ok', note: 'note' },
            prepare({ label, ok, note }) {
              return { title: `${ok ? '✅' : '🔴'} ${label}`, subtitle: note };
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { ok: 'allOk', summary: 'summary', at: 'checkedAt' },
    prepare({ ok, summary, at }) {
      const when = at ? new Date(at).toLocaleDateString('en-US', { timeZone: 'UTC' }) : 'never';
      return {
        title: `${ok === false ? '🔴 ' : ''}Link health`,
        subtitle: `${summary ?? ''} · ${when}`,
      };
    },
  },
});
