// =============================================================================
// Navigation resolver — Sanity "Menus" doc → the shapes Header/Footer expect
// =============================================================================
// Turns the fetched navigation document (links carry a resolved `pageSlug` or
// `url`) into the NavItem / NavGroup / footer / legal structures that
// src/data/nav.ts already exports. Falls back to that static file whenever the
// Studio has no menus, so the site never loses its navigation.
// =============================================================================
import {
  mainNav as mainNavFallback,
  footerNav as footerNavFallback,
  legalNav as legalNavFallback,
  type NavItem,
  type NavLink,
  type NavGroup,
} from '@/data/nav';

export interface SiteNavigation {
  mainNav: NavItem[];
  footerNav: NavGroup[];
  legalNav: NavLink[];
}

interface RawLink {
  label?: string;
  linkType?: 'page' | 'url';
  pageSlug?: string;
  url?: string;
}
interface RawItem extends RawLink {
  _type?: string;
  children?: RawLink[];
}
interface RawNavDoc {
  mainNav?: RawItem[];
  footerColumns?: { label?: string; links?: RawLink[] }[];
  legalNav?: RawLink[];
}

function hrefOf(link: RawLink): string {
  if (link.linkType === 'url') return link.url ?? '#';
  const slug = link.pageSlug;
  return !slug || slug === 'home' ? '/' : `/${slug}`;
}
function toLink(link: RawLink): NavLink {
  const href = hrefOf(link);
  const external = /^https?:\/\//.test(href);
  return { label: link.label ?? '', href, ...(external ? { external: true } : {}) };
}

export function resolveNavigation(doc: unknown): SiteNavigation {
  // ==========================================================================
  // STOPGAP (2026-07-17 IA redesign): the code doctrine in src/data/nav.ts is
  // served UNCONDITIONALLY and the Sanity Menus doc is bypassed. The header
  // nav was restructured into the five-item funnel (a design decision, like
  // the computed seams) while Sanity writes are quota-frozen, so the stored
  // Menus doc is stale and must not override it. Reconcile path is registered
  // in docs/PENDING.md: either patch the Menus doc to the doctrine and restore
  // the resolution below, or retire the Menus editing surface entirely (a
  // Nathan decision). The in-Studio "Edit the menus" guide carries a matching
  // note so a volunteer editing menus knows why nothing changes.
  // ==========================================================================
  void doc;
  return {
    mainNav: mainNavFallback,
    footerNav: footerNavFallback,
    legalNav: legalNavFallback,
  };
}

/** The original Sanity-doc resolution, kept for the reconcile (see above). */
export function resolveNavigationFromDoc(doc: unknown): SiteNavigation {
  const nav = doc as RawNavDoc | null;
  if (!nav || !Array.isArray(nav.mainNav) || nav.mainNav.length === 0) {
    return {
      mainNav: mainNavFallback,
      footerNav: footerNavFallback,
      legalNav: legalNavFallback,
    };
  }
  return {
    mainNav: nav.mainNav.map((item) =>
      item._type === 'navGroup'
        ? ({ label: item.label ?? '', children: (item.children ?? []).map(toLink) } as NavGroup)
        : toLink(item),
    ),
    footerNav: (nav.footerColumns ?? []).map((col) => ({
      label: col.label ?? '',
      children: (col.links ?? []).map(toLink),
    })),
    legalNav: (nav.legalNav ?? []).map(toLink),
  };
}
