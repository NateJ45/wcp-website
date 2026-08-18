import { defineType, defineField, defineArrayMember } from 'sanity';

// =============================================================================
// hubHints — one-shot feature hints around the Family Hub
// =============================================================================
// Small pointers that appear ONCE per device, the first time a family lands on
// a page with a feature worth noticing: the Directory map, the Calendar
// filters. The first-visit tour covers the big picture; a hint covers the one
// control on the page a visitor might miss. Dismissing a hint stores it on the
// device and it never returns.
//
// The PLACEMENT is code (each page renders its HubHint with a target selector
// and fallback wording). This document is the Board's control: a master
// switch, a per-hint switch, and per-hint wording overrides.
// =============================================================================

// The hints that exist. Adding one means: render <HubHint id="..."> on its
// page AND add the id here so the Board can control it.
const HINT_IDS = [
  { title: 'Directory — the map', value: 'directory-map' },
  { title: 'Calendar — the filters', value: 'calendar-filters' },
];

export const hubHints = defineType({
  name: 'hubHints',
  title: 'Feature hints',
  type: 'document',
  icon: () => '💡',
  fields: [
    defineField({
      name: 'enabled',
      title: 'Show hints to new visitors?',
      type: 'boolean',
      initialValue: true,
      description: 'The master switch. Off means no hints anywhere.',
    }),
    defineField({
      name: 'hints',
      title: 'The hints',
      type: 'array',
      description:
        'One row per hint. Leave the wording blank to keep the standard line. A hint with no row here stays ON with its standard wording.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'id',
              title: 'Which hint',
              type: 'string',
              options: { list: HINT_IDS },
              validation: (R) => R.required(),
            }),
            defineField({
              name: 'enabled',
              title: 'Show this hint?',
              type: 'boolean',
              initialValue: true,
            }),
            defineField({
              name: 'text',
              title: 'Wording (optional override)',
              type: 'string',
              description: 'One short sentence. Blank keeps the standard line.',
            }),
          ],
          preview: {
            select: { id: 'id', enabled: 'enabled', text: 'text' },
            prepare({ id, enabled, text }) {
              const name = HINT_IDS.find((h) => h.value === id)?.title ?? id;
              return { title: `${name}${enabled === false ? ' (off)' : ''}`, subtitle: text };
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { enabled: 'enabled' },
    prepare({ enabled }) {
      return { title: 'Feature hints', subtitle: enabled === false ? 'OFF' : 'On' };
    },
  },
});
