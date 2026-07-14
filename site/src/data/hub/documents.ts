// =============================================================================
// Family Hub — Documents & Forms (fallback list)
// =============================================================================
// The Documents page reads its list from Sanity first (hubDocument docs); this
// array is only the fallback used when Sanity is empty/unreachable.
//
// SECURITY (2026-07-14): the literal file URLs were REDACTED. They are "anyone
// with the link" Google Drive / Canva files (state forms, the WCP Safety Plan,
// bylaws, the proposed budget). This repo is PUBLIC, so hardcoding them here
// disclosed working links to anyone reading the source. The board manages the
// real links in the Studio (Family Hub -> Documents & Forms); never paste a
// share-by-link URL back into a tracked file. Entries with an empty href are
// filtered out at render time (see documents.astro), so they never appear as
// dead links. See CLAUDE.md "Secrets never get committed".
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

// Titles/metas describe what the board should link in the Studio; hrefs are
// intentionally empty here (see the security note above).
export const documentGroups: HubDocGroup[] = [
  {
    key: 'required',
    label: 'Required Forms',
    action: 'Open form',
    intro:
      'Ohio state licensing requires these four on file before your child’s first day. New families, start here.',
    docs: [
      { name: 'Health & Immunization Record', icon: 'heart-pulse', href: '' },
      { name: 'Emergency Contact Form', icon: 'phone', href: '' },
      { name: 'Medical Authorization Form', icon: 'file-check', href: '' },
      { name: 'Photo & Media Release Form', icon: 'camera', href: '' },
    ],
  },
  {
    key: 'handbook',
    label: 'Handbooks & Policies',
    action: 'Open document',
    docs: [
      { name: 'Family Handbook 2026-27', icon: 'book-open', href: '' },
      { name: 'WCP Bylaws', meta: 'Governing documents', icon: 'scale', href: '' },
      {
        name: 'Super Helper Guide',
        meta: 'Classroom helper certification process',
        icon: 'shield-check',
        href: '',
      },
      {
        name: 'WCP Safety Plan',
        meta: 'Required by Ohio licensing',
        icon: 'shield-check',
        href: '',
      },
      {
        name: 'Co-op Structure Org Chart',
        meta: '2026-27 roles and reporting',
        icon: 'clipboard-list',
        href: '',
      },
      { name: 'Proposed Budget 2026-27', meta: 'For board transparency', icon: 'coins', href: '' },
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
        href: '',
      },
      { name: 'Orientation Slide Deck', meta: '2025-26 version (current)', icon: 'graduation-cap', href: '' },
    ],
  },
];

/** The shared Google Drive folder that holds everything (linked from the page).
 *  Board-managed in the Studio; keep '#' here so nothing is hardcoded. */
export const driveFolderUrl = '#';
