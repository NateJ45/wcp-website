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

/** Resolve the Sanity Menus doc into the header/footer nav structures. The
 *  2026-07-17 code-doctrine bypass is gone: patch-menus-doctrine.mjs wrote the
 *  five-item funnel INTO the Menus doc (2026-08-04), so the Studio is the
 *  source of truth again and src/data/nav.ts is only the empty-doc fallback. */
export function resolveNavigation(doc: unknown): SiteNavigation {
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
