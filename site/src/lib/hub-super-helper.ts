// =============================================================================
// hub-super-helper — merge the Board's program over the committed one (P2)
// =============================================================================
// Hub settings → Super Helper program is optional field by field: an untouched
// dataset renders exactly the shipped program (src/data/hub/super-helper.ts),
// a Board that only renames it keeps the shipped requirements, and a Board
// that rewrites the whole list replaces it wholesale (requirements swap as a
// LIST, never merge by position — a three-item edit over a three-item default
// mixing halves of each would be nonsense).
// =============================================================================
import {
  superHelperFallback,
  type SuperHelperProgram,
  type SuperHelperRequirement,
} from '@/data/hub/super-helper';

/** The Sanity rows, all optional (hubSettings.superHelper). */
export interface SuperHelperDoc {
  name?: string;
  blurb?: string;
  footnote?: string;
  requirements?: Partial<SuperHelperRequirement>[];
}

export function mergeSuperHelper(doc?: SuperHelperDoc | null): SuperHelperProgram {
  const rows = (doc?.requirements ?? [])
    .filter((r): r is Partial<SuperHelperRequirement> => Boolean(r))
    .map((r) => ({
      icon: r.icon?.trim() || 'check',
      title: r.title?.trim() || '',
      detail: r.detail?.trim() || '',
      url: r.url?.trim() || undefined,
    }))
    .filter((r) => r.title !== '');
  return {
    name: doc?.name?.trim() || superHelperFallback.name,
    blurb: doc?.blurb?.trim() || superHelperFallback.blurb,
    footnote: doc?.footnote?.trim() || superHelperFallback.footnote,
    requirements: rows.length > 0 ? rows : superHelperFallback.requirements,
  };
}
