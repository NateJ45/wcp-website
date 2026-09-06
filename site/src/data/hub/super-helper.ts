// =============================================================================
// Super Helper program — the committed fallback (P2, 2026-08-31)
// =============================================================================
// ONE source feeds BOTH the hub-home band and the /family-hub/super-helper
// page header: Hub settings → Super Helper program, falling back to this file
// field by field (src/lib/hub-super-helper.ts merges them). When the co-op
// renames the program, changes a requirement, or adds a fourth, the Board
// edits one list and every surface follows. This file only exists so a failed
// read — or a dataset that has never touched the fields — renders exactly the
// program the site shipped with.
// =============================================================================

export interface SuperHelperRequirement {
  /** Lucide icon name (see src/lib/lucide-icons.ts). */
  icon: string;
  title: string;
  /** The one-liner under the title. */
  detail: string;
  /** Where to start, when the step has an obvious link (P4). */
  url?: string;
}

export interface SuperHelperProgram {
  /** The program's name, e.g. "Super Helper". */
  name: string;
  /** The band's one-paragraph pitch. */
  blurb: string;
  requirements: SuperHelperRequirement[];
  /** The small reassurance line under the requirement cards. */
  footnote: string;
}

export const superHelperFallback: SuperHelperProgram = {
  name: 'Super Helper',
  blurb:
    'Certified parents can be counted in the classroom and help lead the day. It is a one-time certification, and it takes three things.',
  requirements: [
    { icon: 'monitor', title: 'Online training', detail: 'About 8 hours, free, from home.' },
    { icon: 'heart-pulse', title: 'CPR & First Aid', detail: 'One in-person class near you.' },
    {
      icon: 'graduation-cap',
      title: 'Proof of education',
      detail: 'Send a transcript or diploma.',
    },
  ],
  footnote: 'Already a Super Helper? The background check renewal steps live on the same page.',
};
