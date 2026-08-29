import { defineType, defineField } from 'sanity';
import { makeRoleSelectInput } from '../../components/ClassSelectInput';

// =============================================================================
// roleHolder — WHO fills each co-op role this school year
// =============================================================================
// The org chart on the Family Hub's Co-op Jobs page, and the class-rep cards on
// the class pages, are drawn from code (tiers, branches, icons, committee sizes
// — that is layout, and the brand-lock rule keeps layout out of the Studio).
// The PEOPLE are these documents, so the Board can do the post-election update
// itself instead of asking a developer for a code change and a deploy.
//
// One document per seat. `role` is the join key and must match a role label the
// chart knows (src/data/hub/org-holders.ts lists them, and the field's
// description spells them out) — anything else is simply ignored, so a typo
// cannot break the page.
//
// Leave `person` blank for a seat nobody has taken yet: the chart draws it as
// an open role, which is the honest thing to show and is how a vacancy gets
// noticed. Deleting the document does the same thing.
// =============================================================================

// The roles the chart draws, in chart order. Keep in sync with
// src/data/hub/org-holders.ts — the seed script (scripts/seed-role-holders.mjs)
// creates one document per entry here.
//
// The CLASS REP seats below are the four classes the site shipped with. The
// dropdown adds one "<Class name> Rep" per live class on top of this list (see
// makeRoleSelectInput), so a class the Board adds can be given its rep the same
// day instead of showing "To be announced" for ever.
const ROLES = [
  'President',
  'Vice President',
  'Treasurer',
  'Secretary',
  'Teacher — Pre-K',
  'Teacher — Twos & Threes',
  'Administrator',
  'Publicity Chair',
  'Enrichment Coordinator',
  'Copy Room Helper',
  'Facilities Chair',
  'Family Activities Chair',
  'Fundraising Chair',
  'Twos Rep',
  'Threes Rep',
  'Pre-K AM Rep',
  'Pre-K PM Rep',
];

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
      name: 'role',
      title: 'Role',
      type: 'string',
      group: 'who',
      description:
        'Which seat on the org chart this is. Pick from the list — the chart matches on this exactly. Every class gets a "<Class name> Rep" seat automatically.',
      components: { input: makeRoleSelectInput(ROLES) },
      validation: (R) => R.required().error('Pick which role this is.'),
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
  ],
  orderings: [{ title: 'Role', name: 'role', by: [{ field: 'role', direction: 'asc' }] }],
  preview: {
    select: { role: 'role', person: 'person', media: 'photo' },
    prepare({ role, person, media }) {
      return {
        title: role || 'Untitled role',
        subtitle: person || 'Open role — nobody assigned yet',
        media,
      };
    },
  },
});
