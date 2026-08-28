import { defineType, defineField, defineArrayMember } from 'sanity';
import { BODY_SECTION_TYPE_NAMES, sectionInsertMenu } from '../sections';

// =============================================================================
// sectionPreset — a saved section, ready to drop onto another page
// =============================================================================
// THE PROBLEM. A board member spends twenty minutes getting a "Book a tour"
// banner right, then wants the same banner on four more pages and rebuilds it
// by hand each time (or duplicates a whole page to get at one band of it).
//
// THE SHAPE. `section` is an ARRAY of every body section type, capped at one.
// A single-object field would need a union type Sanity has no syntax for, and a
// per-type field would mean forty fields. The array gets us three things for
// free: the same grouped "+ Add" picker the page builder uses, the normal
// section FORM (so a saved section can be edited in place, not just replayed),
// and the ordinary preview of whichever type it holds.
//
// `sectionType` is the type name copied out of that array when the preset is
// captured. It is read-only and exists so the list and the navigator can label
// a preset without opening it.
//
// HOW ONE IS MADE. Usually not here: open a page and use "Save a section as
// preset…" in the publish menu (src/sanity/actions/saveSectionPreset.tsx).
// Creating one from scratch in this list works too.
//
// HOW ONE IS USED. The "Saved sections" group at the bottom of the page list
// beside the live preview (src/sanity/components/PreviewNavigator.tsx) adds it
// to the page you are looking at. The "+ Add section" picker inside a page
// cannot list documents, which is why the insert surface lives there.
//
// A preset is a COPY, not a link. Editing a preset never changes the pages it
// was already added to, and editing one of those pages never changes the preset.
// =============================================================================
export const sectionPreset = defineType({
  name: 'sectionPreset',
  title: 'Saved section',
  type: 'document',
  icon: () => '🧩',
  fields: [
    defineField({
      name: 'title',
      title: 'Name',
      type: 'string',
      description: 'Name this saved section so you can find it again.',
      validation: (R) => R.required().error('Give it a name so you can find it again.'),
    }),
    defineField({
      name: 'sectionType',
      title: 'Kind of section',
      type: 'string',
      readOnly: true,
      description: 'Filled in for you when the section is saved.',
    }),
    defineField({
      name: 'section',
      title: 'The section',
      type: 'array',
      of: BODY_SECTION_TYPE_NAMES.map((name) => defineArrayMember({ type: name })),
      options: sectionInsertMenu(BODY_SECTION_TYPE_NAMES),
      description:
        'The saved section itself. Change it here and the next page you add it to gets the new version; pages that already have it are not touched.',
      validation: (R) => R.max(1).error('A saved section holds one section. Remove the extra one.'),
    }),
    defineField({
      name: 'note',
      title: 'Note (optional)',
      type: 'text',
      rows: 2,
      description: 'A reminder for whoever finds this later, e.g. "use on class pages only".',
    }),
  ],
  preview: {
    select: { title: 'title', sectionType: 'sectionType', note: 'note' },
    prepare({ title, sectionType, note }) {
      return {
        title: title || '(unnamed saved section)',
        subtitle: [sectionType ? prettySectionType(sectionType) : null, note]
          .filter(Boolean)
          .join(' · '),
      };
    },
  },
});

/** `splitMediaSection` → "Split media". Same rule as src/lib/page-checks.ts. */
function prettySectionType(type: string): string {
  const words = type.replace(/Section$/, '').replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
}
