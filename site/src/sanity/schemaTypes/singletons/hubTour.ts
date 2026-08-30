import { defineType, defineField } from 'sanity';

// =============================================================================
// hubTour — the first-visit tour of the Family Hub
// =============================================================================
// A short guided walkthrough that opens once per family, on the hub home. It
// opens after the President's welcome note closes. It opens directly when no
// note is active. The STRUCTURE is code (src/components/hub/HubTourModal.astro):
// six fixed steps, the class-picker chips, and the phone/desktop wayfinding
// text. This document holds the Board-editable parts: the step WORDING, an
// on/off switch, and the version stamp that re-shows the tour.
//
// Every text field is optional. A blank field falls back to the wording
// committed in the component, so clearing a field restores the default.
// =============================================================================

const stepFields = (key: string, title: string, hint: string) => [
  defineField({
    name: `${key}Title`,
    title: `${title} — heading`,
    type: 'string',
    group: 'steps',
    description: hint,
  }),
  defineField({
    name: `${key}Body`,
    title: `${title} — text`,
    type: 'text',
    rows: 3,
    group: 'steps',
  }),
];

export const hubTour = defineType({
  name: 'hubTour',
  title: 'First-visit tour',
  type: 'document',
  icon: () => '🎈',
  groups: [
    { name: 'settings', title: 'On/off & version', default: true },
    { name: 'steps', title: 'Step wording (optional — blank uses the built-in words)' },
  ],
  fields: [
    defineField({
      name: 'enabled',
      title: 'Show the tour to new visitors?',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
      description: 'Turn this off and the tour never opens. Families can still find everything.',
    }),
    defineField({
      name: 'hiddenSteps',
      title: 'Steps to skip',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'settings',
      options: {
        list: [
          { title: 'Welcome', value: 'welcome' },
          { title: 'Finding your way (menu)', value: 'navigate' },
          { title: 'Tell us your class', value: 'classes' },
          { title: 'Helper schedule', value: 'helper' },
          { title: 'Updates', value: 'updates' },
          { title: 'Money & tuition', value: 'money' },
          { title: 'Search', value: 'search' },
          { title: 'Where to get help', value: 'help' },
        ],
      },
      description:
        'Tick a step to leave it out of the first-visit tour. The welcome and wording of the rest stay as set below.',
    }),
    defineField({
      name: 'version',
      title: 'Show the tour again to everyone',
      type: 'string',
      group: 'settings',
      description:
        'Families see the tour once, then it stays closed. To show it one more time to everyone (after the hub changes a lot), type anything new here — the new school year, e.g. "2027-28", works well.',
      initialValue: '2026-27-v1',
      validation: (R) => R.required().error('The tour needs a version stamp.'),
    }),

    ...stepFields('welcome', 'Step 1: Welcome', 'The first thing a new family reads.'),
    ...stepFields(
      'navigate',
      'Step 2: Find your way',
      'The phone/desktop menu hints are fixed; this wording sits above them.',
    ),
    ...stepFields(
      'classes',
      'Step 3: Pick your class',
      'The class buttons are fixed; this wording sits above them.',
    ),
    ...stepFields('helper', 'Step 4: Helping & calendar', ''),
    ...stepFields('updates', 'Step 5: What’s new', 'The bell and the Updates page.'),
    ...stepFields('money', 'Step 6: Tuition', ''),
    ...stepFields('search', 'Step 7: Search', ''),
    ...stepFields('help', 'Step 8: Where to get help', ''),
  ],
  preview: {
    select: { enabled: 'enabled', version: 'version' },
    prepare({ enabled, version }) {
      return {
        title: 'First-visit tour',
        subtitle: `${enabled === false ? 'OFF' : 'On'} · version ${version ?? '—'}`,
      };
    },
  },
});
