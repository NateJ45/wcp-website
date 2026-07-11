// =============================================================================
// Family Hub — Co-op role descriptions (2026-27)
// =============================================================================
// The POSITIONS families fill and what each does — role definitions only, no
// names. Who currently holds each role is live/assignment data that stays out
// of git and loads from Sanity behind the gate. Descriptions mirror the current
// hub's org chart + job descriptions.
// =============================================================================

export interface CoopRole {
  name: string;
  icon: string;
  /** Team size or count, e.g. "4 members". */
  team?: string;
  reportsTo?: string;
  /** Annual tuition stipend, for the Board officer roles. */
  stipend?: string;
  body: string;
}
export interface CoopTier {
  key: string;
  label: string;
  blurb: string;
  roles: CoopRole[];
}

export const coopPrinciples = [
  {
    icon: 'calendar-days',
    title: 'All year long',
    body: 'You hold your co-op job from September through May. This commitment is part of your enrollment agreement.',
  },
  {
    icon: 'house',
    title: 'One per family',
    body: 'Each enrolled family holds exactly one job. Two-parent families can split the work however suits them.',
  },
  {
    icon: 'hand-heart',
    title: 'Plus classroom helping',
    body: 'Separate from your job, every family helps in the classroom 2–3 times a month on a schedule set by your Class Rep.',
  },
  {
    icon: 'shield-check',
    title: 'Health rules apply',
    body: 'Any adult helping in the classroom must meet Ohio health and background-check requirements first.',
  },
];

export const coopTiers: CoopTier[] = [
  {
    key: 'board',
    label: 'Executive Board',
    blurb:
      'Elected each spring, serving one-year terms. Meets monthly to set policy, manage finances, and oversee school operations.',
    roles: [
      {
        name: 'President',
        icon: 'award',
        stipend: '$450 stipend',
        body: 'Oversees school operations, enrollment, and licensing. Chairs monthly Board meetings, is the main contact for prospective families, coordinates with teachers, and represents WCP externally.',
      },
      {
        name: 'Vice President',
        icon: 'shield-check',
        stipend: '$150 stipend',
        body: 'Oversees the Facilities, Family Activities, and Fundraising chairs. Coordinates the annual raffle, manages officer nominations each spring, and steps in for the President as needed.',
      },
      {
        name: 'Treasurer',
        icon: 'piggy-bank',
        stipend: '$150 stipend',
        body: 'Manages all school finances: tuition, late fees, reimbursements, the annual budget, and payment processing. Provides monthly financial reports to the Board.',
      },
      {
        name: 'Secretary',
        icon: 'notebook-pen',
        stipend: '$150 stipend',
        body: 'Oversees the Class Reps, Publicity, and Enrichment roles plus the Copy Room Helper. Prepares meeting minutes, generates announcements, manages communication and Google Drive, and handles inquiry emails.',
      },
    ],
  },
  {
    key: 'chairs',
    label: 'Cabinet Chairs',
    blurb: 'Each chair leads a small team of co-op members and reports to a Board officer.',
    roles: [
      {
        name: 'Facilities Chair',
        icon: 'building-2',
        reportsTo: 'Reports to VP',
        body: 'Oversees the playground and the school’s physical space. Leads the Playground Committee on maintenance and safety, and coordinates with the Laundry team. Busiest in late summer and spring.',
      },
      {
        name: 'Family Activities Chair',
        icon: 'party-popper',
        reportsTo: 'Reports to VP',
        body: 'Plans and runs family social events that bring WCP families together outside the classroom, with a committee of 4–6 members.',
      },
      {
        name: 'Fundraising Chair',
        icon: 'hand-heart',
        reportsTo: 'Reports to VP',
        body: 'Plans, executes, and reports on all fundraisers (Dine to Donate, Spring Raffle, seasonal sales). Solicits donations and oversees raffle-basket assembly.',
      },
      {
        name: 'Publicity Chair',
        icon: 'megaphone',
        reportsTo: 'Reports to Secretary',
        body: 'Manages the school’s public face: social media, website, ads, and the merchandise store. Coordinates the four Publicity Assistants on content, photos, and outreach.',
      },
      {
        name: 'Enrichment Coordinator',
        icon: 'sparkles',
        reportsTo: 'Reports to Secretary',
        body: 'Brings special programming into the classrooms — visiting performers, themed enrichment days, seasonal activities — coordinating scheduling with teachers and Class Reps.',
      },
    ],
  },
  {
    key: 'reps',
    label: 'Class Representatives',
    blurb: 'One per class — the link between families, the teacher, and the Board.',
    roles: [
      {
        name: 'Class Rep',
        icon: 'users',
        team: 'One per class',
        reportsTo: 'Reports to Secretary',
        body: 'Attends monthly Board meetings as a voting member, communicates updates to class families, schedules the Teacher’s Aides, runs the private class Facebook page, and coordinates Teacher Appreciation Week.',
      },
    ],
  },
  {
    key: 'committee',
    label: 'Committee Members',
    blurb:
      'The hands-on roles that keep everything running — most are light, predictable commitments.',
    roles: [
      {
        name: 'Teacher’s Aide',
        icon: 'graduation-cap',
        team: '2–4 members',
        body: 'Extra support for the teacher on top of regular classroom helping: prep work, supply organization, copying, and other behind-the-scenes tasks.',
      },
      {
        name: 'Publicity Assistant',
        icon: 'camera',
        team: '4 members',
        body: 'Supports the Publicity Chair with social media content, photo and video capture at events, flyer distribution, and word-of-mouth outreach.',
      },
      {
        name: 'Copy Room Helper',
        icon: 'file-text',
        team: '1–2 members',
        body: 'Helps the teachers stay stocked — copies, prep packets, classroom supplies. Light, predictable, in-and-out work.',
      },
      {
        name: 'Playground Committee',
        icon: 'trees',
        team: '3 members',
        body: 'Maintains the playground with the Facilities Chair: mulch, weed spraying, debris pickup, repairs, monthly safety checks, and prep before the school year starts.',
      },
      {
        name: 'Laundry',
        icon: 'house',
        team: '1–2 members',
        body: 'Rotates classroom linens, art smocks, and naptime items through home laundry on a set schedule. Done at home — no in-school time required.',
      },
      {
        name: 'Family Activities Committee',
        icon: 'gift',
        team: '4–6 members',
        body: 'Helps the Family Activities Chair plan and run social events: setup, coordination, day-of support, and making sure every family feels welcome.',
      },
      {
        name: 'Fundraising Committee',
        icon: 'coins',
        team: '2 members',
        body: 'Works with the Fundraising Chair on event setup, donations, raffle baskets, and day-of support.',
      },
    ],
  },
];
