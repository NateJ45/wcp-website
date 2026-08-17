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
    { name: 'steps', title: 'Step wording' },
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
      name: 'version',
      title: 'Version stamp',
      type: 'string',
      group: 'settings',
      description:
        'The tour opens once per version, per device. Change this text (e.g. "2027-28") and every family sees the tour one more time. Do this when the hub changes a lot.',
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
    ...stepFields('search', 'Step 5: Search', ''),
    ...stepFields('help', 'Step 6: Where to get help', ''),
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
