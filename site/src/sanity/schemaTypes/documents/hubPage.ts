import { defineType, defineField, defineArrayMember } from 'sanity';
import { HUB_SECTION_TYPE_NAMES } from '../sections';

// =============================================================================
// hubPage — a Family Hub page, built from sections (GATED, editable)
// =============================================================================
// The gated hub pages read one of these by `hubKey` at request time. Volunteers
// edit the heading, intro, and a stack of sections just like the public pages,
// but from the hub-safe palette (no build-time "pull" sections). Each page also
// renders its fixed widget (calendar embed, PayPal, directory map, live
// campaign bars, class facts) in code — those stay locked; the sections wrap
// around them. If no hubPage doc exists for a key yet, the page shows its
// built-in fallback content, so the hub can never go blank.
// =============================================================================
export const hubPage = defineType({
  name: 'hubPage',
  title: 'Family Hub page',
  type: 'document',
  icon: () => '🔒',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'settings', title: 'Settings' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Page name (internal)',
      type: 'string',
      group: 'settings',
      description: 'Just so you can find it in the list, e.g. "Health" or "Fundraising".',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'hubKey',
      title: 'Which hub page',
      type: 'string',
      group: 'settings',
      description: 'Links this content to a hub page. Set once — do not change it later.',
      options: {
        list: [
          { title: 'Hub home', value: 'home' },
          { title: 'Calendar', value: 'calendar' },
          { title: 'Co-op Jobs', value: 'coop-jobs' },
          { title: 'Documents', value: 'documents' },
          { title: 'Tuition', value: 'tuition' },
          { title: 'Updates', value: 'updates' },
          { title: 'Fundraising', value: 'fundraising' },
          { title: 'Health', value: 'health' },
          { title: 'Directory', value: 'directory' },
          { title: 'Twos classroom', value: 'twos' },
          { title: 'Threes classroom', value: 'threes' },
          { title: 'Pre-K AM classroom', value: 'pre-k-am' },
          { title: 'Pre-K PM classroom', value: 'pre-k-pm' },
        ],
      },
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'heading',
      title: 'Page heading',
      type: 'string',
      group: 'content',
      description: 'The big title at the top of the page.',
    }),
    defineField({
      name: 'intro',
      title: 'Intro line',
      type: 'text',
      rows: 2,
      group: 'content',
      description: 'The sentence under the heading.',
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      group: 'content',
      of: HUB_SECTION_TYPE_NAMES.map((name) => defineArrayMember({ type: name })),
      description: 'The page body. Add, remove, and drag to reorder sections.',
    }),
  ],
  preview: {
    select: { title: 'title', hubKey: 'hubKey' },
    prepare({ title, hubKey }) {
      const labels: Record<string, string> = {
        home: 'Hub home',
        calendar: 'Calendar',
        'coop-jobs': 'Co-op Jobs',
        documents: 'Documents',
        tuition: 'Tuition',
        updates: 'Updates',
        fundraising: 'Fundraising',
        health: 'Health',
        directory: 'Directory',
        twos: 'Twos classroom',
        threes: 'Threes classroom',
        'pre-k-am': 'Pre-K AM classroom',
        'pre-k-pm': 'Pre-K PM classroom',
      };
      return {
        title: title || '(untitled hub page)',
        subtitle: hubKey ? (labels[hubKey] ?? hubKey) : '',
      };
    },
  },
});
