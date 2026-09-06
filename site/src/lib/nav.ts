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

/**
 * The header's one button (the tour ask), as the Menus doc can adjust it.
 * Every field is an OVERRIDE: `show` is true unless the Board turned it off,
 * and `label`/`href` are undefined unless the Board typed one. Header.astro
 * keeps the committed wording and link as its own defaults, so an untouched
 * Menus doc renders the same header as before this field existed.
 */
export interface HeaderCta {
  show: boolean;
  label?: string;
  href?: string;
}

export interface SiteNavigation {
  mainNav: NavItem[];
  footerNav: NavGroup[];
  legalNav: NavLink[];
  headerCta: HeaderCta;
}

interface RawLink {
  label?: string;
  linkType?: 'page' | 'url';
  pageSlug?: string;
  /** True when the page this link points at is archived (see queries.ts). */
  pageArchived?: boolean;
  url?: string;
}
interface RawItem extends RawLink {
  _type?: string;
  children?: RawLink[];
  /** The self-maintaining Classes dropdown (see queries.ts): one candidate
      link per class page, deduped below because two classes can share a page. */
  autoClasses?: boolean;
  autoChildren?: RawLink[];
}

/**
 * The links a dropdown opens with. When `autoClasses` is on, the derived
 * class links come first - deduped by page (Pre-K AM and PM share one page,
 * which must read as ONE "Pre-K Class" link) - and the hand-written links
 * follow, skipping any page the automatic list already covers.
 */
export function groupChildren(item: RawItem): RawLink[] {
  if (!item.autoClasses) return item.children ?? [];
  const seen = new Set<string>();
  const merged: RawLink[] = [];
  for (const link of [...(item.autoChildren ?? []), ...(item.children ?? [])]) {
    const key = link.pageSlug ?? link.url ?? link.label ?? '';
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(link);
  }
  return merged;
}
interface RawHeaderCta extends RawLink {
  show?: boolean;
}
interface RawNavDoc {
  mainNav?: RawItem[];
  footerColumns?: { label?: string; links?: RawLink[] }[];
  legalNav?: RawLink[];
  headerCta?: RawHeaderCta;
}

function hrefOf(link: RawLink): string {
  if (link.linkType === 'url') return link.url ?? '#';
  const slug = link.pageSlug;
  // A page link with no slug means the Menus doc's `page` reference is missing
  // or dangling. That once happened to EVERY link at once (2026-08: a patch
  // script wrote literal slugs instead of references) and the whole nav
  // silently pointed home. Degrade to "/" so the build still ships, but say so
  // in the build log where CI and `npm run build` make it visible.
  if (!slug) {
    console.warn(
      `[nav] Menus link "${link.label ?? '(unlabelled)'}" has no page reference — ` +
        'it will point at the home page. Fix it in Studio → Menus.',
    );
  }
  return !slug || slug === 'home' ? '/' : `/${slug}`;
}
/**
 * Keep a menu link only while its page is on the site.
 *
 * Archiving a page removes the page; a menu item still pointing at it would
 * send visitors to a page that is not built. The test is `!== true`, so a link
 * to a page made before the archive field stays in the menu.
 */
function isLive(link: RawLink): boolean {
  return link.pageArchived !== true;
}

function toLink(link: RawLink): NavLink {
  const href = hrefOf(link);
  const external = /^https?:\/\//.test(href);
  return { label: link.label ?? '', href, ...(external ? { external: true } : {}) };
}

/**
 * Read the header-button overrides off the Menus doc.
 *
 * The button is SHOWN unless `show` is exactly false: an untouched document
 * has no value here, and an absent value must never hide the site's one CTA.
 * A link is only reported when the Board actually picked one, so a half-filled
 * object (a linkType radio touched, nothing chosen) keeps the committed tour
 * link instead of pointing the button at "/".
 */
function resolveHeaderCta(raw: RawHeaderCta | undefined): HeaderCta {
  const label = raw?.label?.trim();
  // An archived page is not a link any more; the button falls back to the tour
  // form the code owns, which is the right place for it to land.
  const hasLink =
    raw?.linkType === 'url' ? Boolean(raw.url) : Boolean(raw?.pageSlug) && isLive(raw ?? {});
  return {
    show: raw?.show !== false,
    ...(label ? { label } : {}),
    ...(hasLink ? { href: hrefOf(raw!) } : {}),
  };
}

/** Resolve the Sanity Menus doc into the header/footer nav structures. The
 *  2026-07-17 code-doctrine bypass is gone: patch-menus-doctrine.mjs wrote the
 *  five-item funnel INTO the Menus doc (2026-08-04), so the Studio is the
 *  source of truth again and src/data/nav.ts is only the empty-doc fallback. */
export function resolveNavigation(doc: unknown): SiteNavigation {
  const nav = doc as RawNavDoc | null;
  const headerCta = resolveHeaderCta(nav?.headerCta);
  if (!nav || !Array.isArray(nav.mainNav) || nav.mainNav.length === 0) {
    return {
      mainNav: mainNavFallback,
      footerNav: footerNavFallback,
      legalNav: legalNavFallback,
      headerCta,
    };
  }
  return {
    headerCta,
    mainNav: nav.mainNav
      .filter((item) => item._type === 'navGroup' || isLive(item))
      .map((item) =>
        item._type === 'navGroup'
          ? ({
              label: item.label ?? '',
              children: groupChildren(item).filter(isLive).map(toLink),
            } as NavGroup)
          : toLink(item),
      )
      // A dropdown whose every page was archived has nothing left to open.
      .filter((item) => !('children' in item) || item.children.length > 0),
    footerNav: (nav.footerColumns ?? []).map((col) => ({
      label: col.label ?? '',
      children: (col.links ?? []).filter(isLive).map(toLink),
    })),
    legalNav: (nav.legalNav ?? []).filter(isLive).map(toLink),
  };
}
