import { defineType, defineField } from 'sanity';

// =============================================================================
// roleHolder — WHO fills each co-op role this school year
// =============================================================================
// The SEATS are `coopRole` documents (Studio → Co-op roles): what each job is,
// where it sits on the chart, and who it reports to. These documents are the
// PEOPLE, so the post-election update is a short list of names rather than a
// change to the structure.
//
// The seat is a REFERENCE, not a typed-in label. That is the whole point: rename
// "Publicity Chair" to "Communications Chair" and the person holding it follows,
// where the old text field would have quietly orphaned her.
//
// Leave `person` blank for a seat nobody has taken yet: the chart draws it as an
// open role, which is the honest thing to show and is how a vacancy gets
// noticed. Deleting the document does the same thing.
//
// CLASS REPS: the Class Rep seat is one document marked "one of these for every
// class", so pick that seat and then the class. A new class needs no new seat.
// =============================================================================

export const roleHolder = defineType({
  name: 'roleHolder',
  title: 'Who’s who this year',
  type: 'document',
  icon: () => '🪪',
  groups: [
    { name: 'who', title: 'Who holds it', default: true },
    { name: 'contact', title: 'How families reach them' },
  ],
  fields: [
    defineField({
      name: 'seat',
      title: 'Role',
      type: 'reference',
      group: 'who',
      to: [{ type: 'coopRole' }],
      description:
        'Which co-op role this person holds. Every role in the Co-op roles list is here — add a role there and it appears in this list straight away.',
      validation: (R) => R.required().error('Pick which role this is.'),
    }),
    defineField({
      name: 'forClass',
      title: 'Which class',
      type: 'reference',
      group: 'who',
      to: [{ type: 'class' }],
      description:
        'Only for the Class Rep role: which class this rep looks after. Every other role leaves this blank.',
      // A `hidden` callback cannot follow a reference, so the field is always
      // shown and the VALIDATION does the coaching instead: it reads the chosen
      // seat and says, in words, whether this question applies. That keeps the
      // rule in one place and needs no mirrored copy of the seat's flag.
      validation: (R) =>
        R.custom(async (value, ctx) => {
          const ref = (ctx.document?.seat as { _ref?: string } | undefined)?._ref;
          if (!ref) return true;
          const perClass = await ctx
            .getClient({ apiVersion: '2025-01-01' })
            .fetch<boolean>('*[_id == $id][0].perClass == true', { id: ref });
          if (perClass && !value) return 'Say which class this rep looks after.';
          if (!perClass && value)
            return 'This role is not a per-class one — leave the class blank.';
          return true;
        }),
    }),
    defineField({
      name: 'person',
      title: 'Who holds it',
      type: 'string',
      group: 'who',
      description:
        'Their name as families should see it, e.g. "Rachel Gumpert". Leave BLANK if nobody has taken this role yet — the chart will show it as an open role.',
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      group: 'who',
      options: { hotspot: true },
      description:
        'Optional headshot. Without one the card shows their initials or a role icon, which looks perfectly fine — never feel obliged to chase a photo.',
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
    }),
    defineField({
      name: 'email',
      title: 'Role email address',
      type: 'string',
      group: 'contact',
      description:
        'The role’s OWN mailbox where there is one, e.g. president@westchesterpreschool.org. Leave blank for a role with no mailbox — for a class rep, use the Directory link below instead so her details are only ever typed in one place.',
    }),
    defineField({
      name: 'contactFrom',
      title: 'Their family in the Directory',
      type: 'reference',
      group: 'contact',
      to: [{ type: 'directoryEntry' }],
      description:
        'Link a class rep to her Directory entry and her card picks up the email and phone already stored there, so you never type them twice. It uses the adult whose name matches "Who holds it". A family who has opted out of the Directory is skipped, and the card simply shows no contact links.',
    }),
    defineField({
      name: 'note',
      title: 'Note to the Board (not shown to families)',
      type: 'string',
      group: 'who',
      description: 'Optional reminder for whoever updates this next year.',
    }),
    // The role LABEL this document stored before the seats became documents.
    // Hidden, never edited, and still READ: it is the second join key, so a
    // holder the migration could not match (a draft, a hand-made document) keeps
    // working from its label. See toHolderMap in src/lib/hub-org.ts.
    defineField({ name: 'role', title: 'Role (old text)', type: 'string', hidden: true }),
  ],
  orderings: [
    { title: 'Who holds it', name: 'person', by: [{ field: 'person', direction: 'asc' }] },
  ],
  preview: {
    select: {
      seat: 'seat.name',
      legacy: 'role',
      cls: 'forClass.name',
      person: 'person',
      media: 'photo',
    },
    prepare({ seat, legacy, cls, person, media }) {
      const role = seat || legacy || 'Untitled role';
      return {
        title: cls ? `${cls} ${role}` : role,
        subtitle: person || 'Open role — nobody assigned yet',
        media,
      };
    },
  },
});
