// =============================================================================
// Org chart holders — who fills each co-op role this school year
// =============================================================================
// Powers the Co-op Jobs page's org chart (src/components/hub/OrgChart.astro),
// carried over from the old site's chart.
//
// THIS IS NO LONGER WHERE NAMES ARE UPDATED. Who holds each seat is now
// Board-editable in the Studio (Family Hub → "Who's who this year", the
// `roleHolder` documents), merged over this list at request time by
// src/lib/hub-org.ts. The names below are the FALLBACK that renders if Sanity
// is unreachable, and a Studio document always wins — including an empty one,
// so clearing a role there really does vacate the seat.
//
// What this file still owns is the chart's SHAPE: the tiers, the two cabinet
// branches, the icons, and the committee labels and sizes. That is layout, and
// the brand-lock rule keeps layout out of the Studio. Role DESCRIPTIONS are
// separate again and Board-editable (`coopRole` docs / coop-roles.ts).
// Names render behind the gate only, like the old site.
// =============================================================================

import type { ImageMetadata } from 'astro';
import erinPhoto from '@/assets/org/ErinTwoThrees.jpg';
import lexiePhoto from '@/assets/org/LexieAdmin.jpg';
import lisaPhoto from '@/assets/org/LisaPreK.jpg';
import nathanPhoto from '@/assets/org/NathanPublicity.jpg';
import nicolePhoto from '@/assets/org/NicoleFundraising.jpg';
import rachelPhoto from '@/assets/org/RachelPresident.jpg';

export interface OrgPerson {
  /** Role label shown on the card, e.g. "President". */
  role: string;
  /**
   * Join key for the Studio's `roleHolder` document, when the displayed label
   * is ambiguous. Both teachers show as "Teacher" on the chart but need their
   * own documents, so they carry a key; everything else joins on `role`.
   */
  key?: string;
  /** Lucide icon for the role chip. */
  icon: string;
  /** Holder's name. Omit while the role is unfilled. */
  name?: string;
  /** Role mailbox (shown as a mail icon link). */
  email?: string;
  /** Headshot (src/assets/org/); the card falls back to initials without one. */
  photo?: ImageMetadata;
}

export interface OrgTeam {
  /** Committee/team fed by a chair, e.g. "Publicity Assistants". */
  label: string;
  /** Member-count blurb, e.g. "4 members". */
  size: string;
}

export interface ChairStack {
  chair: OrgPerson;
  teams?: OrgTeam[];
}

/** 2026-27 Executive Board. */
export const president: OrgPerson = {
  role: 'President',
  icon: 'award',
  name: 'Rachel Gumpert',
  photo: rachelPhoto,
  email: 'president@westchesterpreschool.org',
};

export const officers: OrgPerson[] = [
  {
    role: 'Vice President',
    icon: 'shield-check',
    name: 'Joy Rasfeld',
    email: 'vicepresident@westchesterpreschool.org',
  },
  {
    role: 'Treasurer',
    icon: 'piggy-bank',
    name: 'Kate Carnahan',
    email: 'treasurer@westchesterpreschool.org',
  },
  {
    role: 'Secretary',
    icon: 'notebook-pen',
    name: 'Margot Hisle',
    email: 'contact@westchesterpreschool.org',
  },
];

/** Paid staff (the only non-volunteer roles). */
export const paidStaff: OrgPerson[] = [
  {
    role: 'Teacher',
    key: 'Teacher — Pre-K',
    icon: 'book-open',
    name: 'Mrs. Lisa Cortez',
    photo: lisaPhoto,
    email: 'lisa@westchesterpreschool.org',
  },
  {
    role: 'Teacher',
    key: 'Teacher — Twos & Threes',
    icon: 'book-open',
    name: 'Mrs. Erin Schmerr',
    photo: erinPhoto,
    email: 'erin@westchesterpreschool.org',
  },
  {
    role: 'Administrator',
    icon: 'building-2',
    name: 'Mrs. Lexie Lenavitt',
    photo: lexiePhoto,
    email: 'admin@westchesterpreschool.org',
  },
];

/** The Secretary's cabinet (left branch of the old chart). */
export const secretaryBranch: ChairStack[] = [
  {
    chair: {
      role: 'Publicity Chair',
      icon: 'megaphone',
      name: 'Nathan Nixon',
      photo: nathanPhoto,
      email: 'publicity@westchesterpreschool.org',
    },
    teams: [{ label: 'Publicity Assistants', size: '4 members' }],
  },
  {
    chair: {
      role: 'Enrichment Coordinator',
      icon: 'sparkles',
      name: 'Daniel Hagedorn',
      email: 'coach@westchesterpreschool.org',
    },
  },
  {
    chair: { role: 'Copy Room Helper', icon: 'file-text' },
    teams: [{ label: 'Copy Room', size: '1-2 members' }],
  },
];

/**
 * One rep per class (green tier). Names set each fall, from the Board's
 * enrollment list (the "CLASS REP" rows in its Job column). One rep per class,
 * so a rep who shares the job with a spouse is still listed as the single named
 * contact. No email: there is no class-rep role mailbox, and a volunteer's
 * personal address must never land in this (public) repo — families reach a rep
 * through the Directory. See the share-link/privacy rules in CLAUDE.md.
 */
export const classReps: OrgPerson[] = [
  { role: 'Twos Rep', icon: 'blocks', name: 'Laura Gilbert' },
  { role: 'Threes Rep', icon: 'sprout', name: 'Jordyn Frasier' },
  { role: 'Pre-K AM Rep', icon: 'sun', name: 'Megan Waid' },
  { role: 'Pre-K PM Rep', icon: 'moon', name: "Melissa O'Brien" },
];

/** The VP's cabinet (right branch of the old chart). */
export const vpBranch: ChairStack[] = [
  {
    chair: { role: 'Facilities Chair', icon: 'building-2' },
    teams: [
      { label: 'Playground Committee', size: '3 members' },
      { label: 'Laundry', size: '1-2 members' },
    ],
  },
  {
    chair: { role: 'Family Activities Chair', icon: 'party-popper' },
    teams: [{ label: 'Activities Committee', size: '4-6 members' }],
  },
  {
    chair: {
      role: 'Fundraising Chair',
      icon: 'hand-heart',
      name: 'Nicole Hagedorn',
      photo: nicolePhoto,
      email: 'fundraising@westchesterpreschool.org',
    },
    teams: [{ label: 'Fundraising Committee', size: '2 members' }],
  },
];
