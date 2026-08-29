// =============================================================================
// Org chart — the committed FALLBACK for the co-op's structure
// =============================================================================
// The Co-op Jobs page's org chart (src/components/hub/OrgChart.astro) is
// DERIVED from documents now: `coopRole` documents are the seats (name, icon,
// section, who they report to, team size, stipend, description) and `roleHolder`
// documents are the people. A volunteer renames a role, adds one, retires one,
// or re-points a whole branch from the Studio, with no developer and no deploy.
//
// THIS FILE IS NO LONGER WHERE ANY OF THAT IS EDITED. It is the per-field
// fallback that renders if Sanity is unreachable — the same role src/data/
// classes.ts plays for the four classes the site shipped with. Sanity always
// wins, INCLUDING an empty answer for a seat, so clearing a role in the Studio
// really does vacate it.
//
// Never add a new seat here. Add it in the Studio; this list stays a snapshot of
// the structure the site shipped with, so the chart is never blank.
//
// The ids match the live `coopRole` document ids so a mixed state (seats from
// code, people from Sanity) still joins. Names render behind the gate only, like
// the old site. Photos live ONLY in the Studio — no committed headshots.
// =============================================================================

import type { OrgSeat, Holder } from '@/lib/hub-org';

/** A committed seat, plus whoever held it when this snapshot was taken. */
export interface FallbackSeat extends OrgSeat {
  /** The holder as of the last code change. The Studio overrides it. */
  holder?: { person?: string; email?: string };
}

export const orgSeats: FallbackSeat[] = [
  // ── Executive Board ──────────────────────────────────────────────────────
  {
    id: 'coop-0',
    name: 'President',
    tier: 'board',
    icon: 'award',
    stipend: '$450 stipend',
    holder: { person: 'Rachel Gumpert', email: 'president@westchesterpreschool.org' },
  },
  {
    id: 'coop-1',
    name: 'Vice President',
    tier: 'board',
    icon: 'shield-check',
    reportsTo: 'coop-0',
    stipend: '$150 stipend',
    holder: { person: 'Joy Rasfeld', email: 'vicepresident@westchesterpreschool.org' },
  },
  {
    id: 'coop-2',
    name: 'Treasurer',
    tier: 'board',
    icon: 'piggy-bank',
    reportsTo: 'coop-0',
    stipend: '$150 stipend',
    holder: { person: 'Kate Carnahan', email: 'treasurer@westchesterpreschool.org' },
  },
  {
    id: 'coop-3',
    name: 'Secretary',
    tier: 'board',
    icon: 'notebook-pen',
    reportsTo: 'coop-0',
    stipend: '$150 stipend',
    holder: { person: 'Margot Hisle', email: 'contact@westchesterpreschool.org' },
  },

  // ── Paid staff ── the only non-volunteer seats. They are on the chart but
  // not in the co-op job list: they are not jobs a family signs up for.
  {
    id: 'coop-staff-teacher-pre-k',
    name: 'Teacher — Pre-K',
    tier: 'staff',
    icon: 'book-open',
    holder: { person: 'Mrs. Lisa Cortez', email: 'lisa@westchesterpreschool.org' },
  },
  {
    id: 'coop-staff-teacher-twos-threes',
    name: 'Teacher — Twos & Threes',
    tier: 'staff',
    icon: 'book-open',
    holder: { person: 'Mrs. Erin Schmerr', email: 'erin@westchesterpreschool.org' },
  },
  {
    id: 'coop-staff-administrator',
    name: 'Administrator',
    tier: 'staff',
    icon: 'building-2',
    holder: { person: 'Mrs. Lexie Lenavitt', email: 'admin@westchesterpreschool.org' },
  },

  // ── Cabinet chairs ───────────────────────────────────────────────────────
  {
    id: 'coop-4',
    name: 'Facilities Chair',
    tier: 'chairs',
    icon: 'building-2',
    reportsTo: 'coop-1',
  },
  {
    id: 'coop-5',
    name: 'Family Activities Chair',
    tier: 'chairs',
    icon: 'party-popper',
    reportsTo: 'coop-1',
  },
  {
    id: 'coop-6',
    name: 'Fundraising Chair',
    tier: 'chairs',
    icon: 'hand-heart',
    reportsTo: 'coop-1',
    holder: { person: 'Nicole Hagedorn', email: 'fundraising@westchesterpreschool.org' },
  },
  {
    id: 'coop-7',
    name: 'Publicity Chair',
    tier: 'chairs',
    icon: 'megaphone',
    reportsTo: 'coop-3',
    holder: { person: 'Nathan Nixon', email: 'publicity@westchesterpreschool.org' },
  },
  {
    id: 'coop-8',
    name: 'Enrichment Coordinator',
    tier: 'chairs',
    icon: 'sparkles',
    reportsTo: 'coop-3',
    holder: { person: 'Daniel Hagedorn', email: 'coach@westchesterpreschool.org' },
  },

  // ── Class reps ── ONE seat, expanded to one card per live class. This is
  // what gives a class the Board adds a rep card on its page the same day.
  {
    id: 'coop-9',
    name: 'Class Rep',
    tier: 'reps',
    icon: 'users',
    reportsTo: 'coop-3',
    team: 'One per class',
    perClass: true,
  },

  // ── Committees ── drawn as pills under whichever seat they report to.
  {
    id: 'coop-10',
    name: 'Teacher’s Aide',
    tier: 'committee',
    icon: 'graduation-cap',
    reportsTo: 'coop-3',
    team: '2–4 members',
  },
  {
    id: 'coop-11',
    name: 'Publicity Assistant',
    tier: 'committee',
    icon: 'camera',
    reportsTo: 'coop-7',
    team: '4 members',
  },
  {
    id: 'coop-12',
    name: 'Copy Room Helper',
    tier: 'committee',
    icon: 'file-text',
    reportsTo: 'coop-3',
    team: '1–2 members',
  },
  {
    id: 'coop-13',
    name: 'Playground Committee',
    tier: 'committee',
    icon: 'trees',
    reportsTo: 'coop-4',
    team: '3 members',
  },
  {
    id: 'coop-14',
    name: 'Laundry',
    tier: 'committee',
    icon: 'house',
    reportsTo: 'coop-4',
    team: '1–2 members',
  },
  {
    id: 'coop-15',
    name: 'Family Activities Committee',
    tier: 'committee',
    icon: 'gift',
    reportsTo: 'coop-5',
    team: '4–6 members',
  },
  {
    id: 'coop-16',
    name: 'Fundraising Committee',
    tier: 'committee',
    icon: 'coins',
    reportsTo: 'coop-6',
    team: '2 members',
  },
];

/**
 * The people from the snapshot above, in the shape the chart merges.
 *
 * Used ONLY when the Studio's "Who's who" read fails: without it an unreachable
 * Sanity would draw every seat as an open role, which reads as "the whole board
 * resigned" rather than "the CMS is down". Keyed by role LABEL, which is the
 * fallback join (there are no Sanity ids in a code-only render).
 */
export const fallbackHolders: Map<string, Holder> = new Map(
  orgSeats
    .filter((s) => s.holder)
    .map((s) => [s.name, { name: s.holder?.person, email: s.holder?.email }]),
);
