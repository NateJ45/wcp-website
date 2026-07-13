import { defineType, defineField } from 'sanity';

// =============================================================================
// redirect — an old path → new path forward (board-editable)
// =============================================================================
// When a page is renamed or moved, old links (bookmarks, Google results, other
// sites) would 404. A redirect sends them to the right new place. These are
// applied at REQUEST time by src/middleware.ts, so a new redirect takes effect
// within about a minute of publishing — no code change, no rebuild. (The
// launch-migration redirects from the Squarespace move still live in
// astro.config.mjs; see docs/REDIRECTS.md.)
// =============================================================================
export const redirect = defineType({
  name: 'redirect',
  title: 'Redirect',
  type: 'document',
  icon: () => '↪️',
  fields: [
    defineField({
      name: 'from',
      title: 'Old address (that should forward)',
      type: 'string',
      description:
        'The path people are still using, starting with a slash, e.g. "/old-page". Just the part after the domain, no https://.',
      validation: (R) =>
        R.required()
          .custom((value) => {
            if (typeof value !== 'string') return 'Required';
            if (!value.startsWith('/')) return 'Start with a slash, e.g. "/old-page".';
            if (/\s/.test(value)) return 'No spaces — use hyphens, e.g. "/open-house".';
            return true;
          })
          .error('Enter the old path, starting with a slash.'),
    }),
    defineField({
      name: 'to',
      title: 'Send them to',
      type: 'string',
      description:
        'Where to forward: a page on this site like "/enroll", or a full web address like "https://example.org".',
      validation: (R) =>
        R.required()
          .custom((value, context) => {
            if (typeof value !== 'string') return 'Required';
            const ok = value.startsWith('/') || /^https?:\/\//.test(value);
            if (!ok) return 'Use a path like "/enroll" or a full https:// link.';
            const from = (context.document as { from?: string } | undefined)?.from;
            if (from && from === value) return 'The old and new addresses are the same.';
            return true;
          })
          .error('Enter where to send people (a page path or full link).'),
    }),
    defineField({
      name: 'permanent',
      title: 'Permanent move?',
      type: 'boolean',
      initialValue: true,
      description:
        'On (recommended): tells Google the page moved for good, so it carries the ranking over. Turn off only for a temporary forward.',
    }),
    defineField({
      name: 'note',
      title: 'Note (optional)',
      type: 'string',
      description: 'A reminder to yourself of why this redirect exists.',
    }),
  ],
  preview: {
    select: { from: 'from', to: 'to', permanent: 'permanent' },
    prepare({ from, to, permanent }) {
      return {
        title: `${from || '(no old path)'}  →  ${to || '(no target)'}`,
        subtitle: permanent === false ? 'Temporary' : 'Permanent',
      };
    },
  },
});
