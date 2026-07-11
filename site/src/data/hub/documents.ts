// =============================================================================
// Family Hub — Documents & Forms (interim data, mirrors the current live hub)
// =============================================================================
// Interim source for the Documents page until this moves to Sanity (so the
// board can update links without code). Links point to the school's shared
// Google Drive / Canva files — gated content, not public. No PII here.
// =============================================================================

export interface HubDoc {
  name: string;
  /** Optional one-line context shown under the title. */
  meta?: string;
  icon: string;
  href: string;
}
export interface HubDocGroup {
  key: string;
  label: string;
  /** What the action button says for this group. */
  action: string;
  intro?: string;
  docs: HubDoc[];
}

export const documentGroups: HubDocGroup[] = [
  {
    key: 'required',
    label: 'Required Forms',
    action: 'Open form',
    intro:
      'Ohio state licensing requires these four on file before your child’s first day. New families, start here.',
    docs: [
      {
        name: 'Health & Immunization Record',
        icon: 'heart-pulse',
        href: 'https://drive.google.com/file/d/***REMOVED***/view',
      },
      {
        name: 'Emergency Contact Form',
        icon: 'phone',
        href: 'https://drive.google.com/file/d/***REMOVED***/view',
      },
      {
        name: 'Medical Authorization Form',
        icon: 'file-check',
        href: 'https://drive.google.com/file/d/***REMOVED***/view',
      },
      {
        name: 'Photo & Media Release Form',
        icon: 'camera',
        href: 'https://drive.google.com/file/d/***REMOVED***/view',
      },
    ],
  },
  {
    key: 'handbook',
    label: 'Handbooks & Policies',
    action: 'Open document',
    docs: [
      {
        name: 'Family Handbook 2026-27',
        icon: 'book-open',
        href: 'https://canva.link/***REMOVED***',
      },
      {
        name: 'WCP Bylaws',
        meta: 'Governing documents',
        icon: 'scale',
        href: 'https://drive.google.com/file/d/***REMOVED***/view',
      },
      {
        name: 'Super Helper Guide',
        meta: 'Classroom helper certification process',
        icon: 'shield-check',
        href: 'https://drive.google.com/file/d/***REMOVED***/view',
      },
      {
        name: 'WCP Safety Plan',
        meta: 'Required by Ohio licensing',
        icon: 'shield-check',
        href: 'https://drive.google.com/file/d/***REMOVED***/view',
      },
      {
        name: 'Co-op Structure Org Chart',
        meta: '2026-27 roles and reporting',
        icon: 'clipboard-list',
        href: 'https://drive.google.com/file/d/***REMOVED***/view',
      },
      {
        name: 'Proposed Budget 2026-27',
        meta: 'For board transparency',
        icon: 'coins',
        href: 'https://drive.google.com/file/d/***REMOVED***/view',
      },
    ],
  },
  {
    key: 'orient',
    label: 'Orientation Materials',
    action: 'View',
    docs: [
      {
        name: 'May Gathering Slide Deck',
        meta: '2026-27 welcome meeting (May 11, 2026)',
        icon: 'party-popper',
        href: 'https://docs.google.com/presentation/d/***REMOVED***/edit?usp=sharing',
      },
      {
        name: 'Orientation Slide Deck',
        meta: '2025-26 version (current)',
        icon: 'graduation-cap',
        href: 'https://canva.link/***REMOVED***',
      },
    ],
  },
];

/** The shared Google Drive folder that holds everything (linked from the page). */
export const driveFolderUrl = '#'; // SETUP(nathan): paste the shared WCP Drive folder link
