// =============================================================================
// hub-nav-doc — resolving the Board-editable Family Hub menu
// =============================================================================
// The rail's GROUPS and LINKS are now a Sanity singleton (`hubNavMenu`), the
// same treatment the public header/footer got long ago (`navigation`): rename
// or reorder groups, reorder or relabel the built-in links, move one between
// groups, hide one, add Board-created pages or external links — all in the
// Studio. src/data/hub-nav.ts remains the committed fallback, so a missing or
// emptied document renders today's menu rather than nothing.
//
// The guardrails carry the design decisions:
//   - The HOME group is pinned in code and is not part of the document at all.
//     A menu edit can rearrange the hub; it cannot orphan the front door.
//   - Accents come from a fixed, AA-checked set (the label sits on navy).
//     An unknown accent falls back to sky rather than rendering unreadably.
//   - Built-in links are stored by ROUTE, picked from a dropdown, so a link
//     can be renamed or hidden but never pointed at nowhere.
//
// Pure — no Sanity client, no Astro — so every rule is unit-tested directly.
// =============================================================================

import { hubNav, type HubGroup, type HubLink } from '@/data/hub-nav';
import { isUsableHubSlug } from '@/lib/hub-pages';

/**
 * The bright-tint hexes that hold >= 4.5:1 as small bold label text on the
 * rail's navy (#01457e) — measured in hub-nav.ts. The Studio offers exactly
 * these; anything else falling out of a stale document resolves to sky.
 */
export const HUB_ACCENTS: Record<string, string> = {
  sky: '#7dd3fc',
  amber: '#ffa334',
  green: '#4ade80',
  orange: '#fdba74',
};

/** Every built-in link, keyed by route — the dropdown the Studio offers. */
export const BUILTIN_HUB_LINKS: readonly HubLink[] = hubNav
  .slice(1) // group 0 is Home, pinned in code and not menu-editable
  .flatMap((g) => g.links);

const builtinByHref = new Map(BUILTIN_HUB_LINKS.map((l) => [l.href, l]));

/** One link row as the hubNavMenu document stores it. */
export interface NavDocLink {
  _type?: string;
  /** builtinLink: the route it points at (the stable key). */
  target?: string | null;
  /** Optional label override (builtin + page links); required for external. */
  label?: string | null;
  /** builtinLink: temporarily removed from the menu without losing its row. */
  hidden?: boolean | null;
  /** pageLink: the dereferenced Board page. */
  page?: {
    title?: string | null;
    heading?: string | null;
    slug?: string | null;
    navIcon?: string | null;
  } | null;
  /** externalLink. */
  url?: string | null;
  icon?: string | null;
}

export interface NavDocGroup {
  label?: string | null;
  accent?: string | null;
  links?: NavDocLink[] | null;
}

export interface HubNavDoc {
  groups?: NavDocGroup[] | null;
}

/** Resolve one stored link row to a renderable rail link, or null to drop it. */
function resolveLink(row: NavDocLink): HubLink | null {
  switch (row?._type) {
    case 'builtinLink': {
      const base = row.target ? builtinByHref.get(row.target) : undefined;
      // A target that matches no built-in route (a route renamed years later,
      // or a stale row) is dropped rather than rendered as a dead link.
      if (!base || row.hidden) return null;
      return { ...base, label: row.label?.trim() || base.label };
    }
    case 'pageLink': {
      const slug = row.page?.slug ?? null;
      // The reference dereferenced to nothing (page deleted, draft-only, or
      // its slug is unusable) — drop the link, never render a 404.
      if (!isUsableHubSlug(slug)) return null;
      return {
        label: row.label?.trim() || row.page?.title?.trim() || row.page?.heading?.trim() || slug!,
        href: `/family-hub/${slug!.trim()}`,
        icon: row.page?.navIcon?.trim() || 'file-text',
      };
    }
    case 'externalLink': {
      const url = row.url?.trim();
      const label = row.label?.trim();
      if (!url || !label) return null;
      return { label, href: url, icon: row.icon?.trim() || 'external-link', external: true };
    }
    default:
      return null;
  }
}

/**
 * The rail's nav: the pinned Home group, then the document's groups.
 *
 * Falls back to the COMMITTED nav whenever the document yields nothing — no
 * document, no groups, or every group empty after resolution. Partial content
 * is honoured as-is: a Board that deliberately trims the menu to two groups
 * gets two groups, not two plus a fallback.
 */
export function resolveHubNav(doc?: HubNavDoc | null): HubGroup[] {
  const homeGroup = hubNav[0];

  const groups: HubGroup[] = (doc?.groups ?? [])
    .map((g) => ({
      label: g?.label?.trim() ?? '',
      accent: HUB_ACCENTS[g?.accent ?? ''] ?? HUB_ACCENTS.sky,
      links: (g?.links ?? []).map(resolveLink).filter((l): l is HubLink => l !== null),
    }))
    // A group with no label or no surviving links renders as an empty heading
    // or a dangling label — drop it instead.
    .filter((g) => g.label && g.links.length > 0);

  if (groups.length === 0) return hubNav;
  return [homeGroup, ...groups];
}
