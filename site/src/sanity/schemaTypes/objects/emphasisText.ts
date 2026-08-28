import { defineType, defineArrayMember, defineField } from 'sanity';
import { hasEmphasis } from '@/lib/emphasis';

// =============================================================================
// emphasisText — bold / italic only, for a body line an editor wants to stress
// =============================================================================
// The narrowest rich text in the schema. One block style (Normal), no lists,
// no headings, no links: ONLY bold and italic. It exists so a volunteer can
// stress a word inside body copy that used to be a plain string.
//
// It is never offered for a HEADLINE. Display faces on this site carry their
// own weight, and a faux-bold word inside them reads as a mistake. A heading
// gets its stress from `headingAccent` (the crayon underline) instead.
//
// Renders through emphasisHtml() in src/lib/emphasis.ts.
// =============================================================================
export const emphasisText = defineType({
  name: 'emphasisText',
  title: 'Text',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [{ title: 'Normal', value: 'normal' }],
      lists: [],
      marks: {
        decorators: [
          { title: 'Bold', value: 'strong' },
          { title: 'Italic', value: 'em' },
        ],
        annotations: [],
      },
    }),
  ],
});

/**
 * A curated body field's RICH TWIN: the same line, with bold and italic.
 *
 * The pairing rule, used at every twin below:
 *  - The twin is optional and starts empty, so nothing about a stored page
 *    changes until an editor types in it.
 *  - The legacy plain field hides itself once the twin holds text
 *    (`hiddenWhenRich`), so an editor is never looking at two copies of the
 *    same sentence.
 *  - The renderer prefers the twin and otherwise renders the plain string
 *    exactly as it always did.
 */
export function richTwin(
  name: string,
  opts: { title: string; description?: string; group?: string },
) {
  return defineField({
    name,
    title: opts.title,
    type: 'emphasisText',
    group: opts.group,
    description:
      opts.description ??
      'You can bold or italicize here. Fill this in only when you want that, and the plain box above hides itself.',
  });
}

/**
 * The `hidden` callback for the plain field a twin replaces. `parent` is the
 * enclosing object (a section, a card, an array row), which is where the twin
 * lives too.
 */
export function hiddenWhenRich(twinName: string) {
  return ({ parent }: { parent?: Record<string, unknown> }): boolean =>
    hasEmphasis(parent?.[twinName]);
}
