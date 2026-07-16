// =============================================================================
// Org chart holders — who fills each co-op role this school year
// =============================================================================
// Powers the Co-op Jobs page's org chart (src/components/hub/OrgChart.astro),
// carried over from the old site's chart. UPDATE EACH FALL after elections:
// swap names/emails here (leave `name` off for a role that's still open —
// the chart shows it as an open role). Role DESCRIPTIONS are separate and
// Board-editable (Sanity `coopRole` docs / coop-roles.ts); this file is only
// the who's-who. Names render behind the gate only, like the old site.
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
    icon: 'book-open',
    name: 'Mrs. Lisa Cortez',
    photo: lisaPhoto,
    email: 'lisa@westchesterpreschool.org',
  },
  {
    role: 'Teacher',
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

/** One rep per class (green tier). Names set each fall. */
export const classReps: OrgPerson[] = [
  { role: 'Twos Rep', icon: 'blocks' },
  { role: 'Threes Rep', icon: 'sprout' },
  { role: 'Pre-K AM Rep', icon: 'sun' },
  { role: 'Pre-K PM Rep', icon: 'moon' },
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
