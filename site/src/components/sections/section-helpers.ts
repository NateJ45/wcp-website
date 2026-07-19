// =============================================================================
// Shared helpers for the section bridge components
// =============================================================================
import { withBase } from '@/lib/utils';

/** Loose shape of a fetched section (fields vary by _type). */
export interface SectionData {
  _type: string;
  _key: string;
  background?: 'white' | 'grey' | 'cream' | 'navy';
  seam?: boolean;
  compact?: boolean;
  header?: { eyebrow?: string; title?: string; lead?: string; align?: 'center' | 'left' };
  [key: string]: unknown;
}

export interface ActionData {
  label: string;
  style?: string;
  linkType?: 'page' | 'url';
  pageSlug?: string;
  url?: string;
}

/** A stable id for a section's heading, wired to <Section labelledby>. */
export function titleIdFor(section: SectionData): string | undefined {
  return section.header?.title ? `sec-${section._key}` : undefined;
}

/**
 * AA-safe Eyebrow tone for a band's RESOLVED background. The Eyebrow default
 * ("sky") is a dark -ink shade designed for light bands and is unreadable on
 * navy; Section.astro's rule is that navy bands must pass eyebrowTone="amber"
 * (4.89:1 on navy — see Eyebrow.astro's measured ratios). Every bridge feeds
 * this the SAME value its <Section bg> resolves to — including the bridge's
 * own default (e.g. countdown/instagram default to navy) — so a volunteer
 * picking the Navy background radio can never ship a contrast failure.
 * Non-navy returns "sky", which matches SectionHeader's own default.
 */
export function eyebrowTone(bg?: string): 'amber' | 'sky' {
  return bg === 'navy' ? 'amber' : 'sky';
}

export function bandSize(section: SectionData): 'compact' | 'default' {
  return section.compact ? 'compact' : 'default';
}

// The per-type default background for the bridges that don't default to white
// (mirror of each bridge's own `section.background ?? '<x>'`). Kept here so the
// renderer can compute a section's effective background without importing every
// bridge. ctaSection is special: it uses `tone`, not `background`.
const BG_DEFAULT: Record<string, 'white' | 'grey' | 'cream' | 'navy'> = {
  countdownSection: 'navy',
  instagramSection: 'navy',
  formSection: 'grey',
  quickFactsSection: 'grey',
  newsletterSignupSection: 'cream',
  reviewFormSection: 'cream',
};

/** A section's rendered background, resolving the per-type default. */
export function effectiveBg(section: SectionData): 'white' | 'grey' | 'cream' | 'navy' {
  if (section._type === 'ctaSection') {
    return (section.tone as 'navy' | 'cream' | undefined) ?? 'navy';
  }
  return section.background ?? BG_DEFAULT[section._type] ?? 'white';
}

/**
 * Whether a band should carry the scallop/trim seam at its top — computed from
 * the adjacent backgrounds, NOT a volunteer toggle (that was a design knob the
 * page-builder shouldn't expose; removed from the schema 2026-07-17). The rule
 * is deliberately sparing so the page never becomes a layer-cake of edges: a
 * seam appears only when entering a STRONG band (cream or navy) whose colour
 * actually differs from the band above. Subtle white↔grey alternations get no
 * seam; navy↔navy (a CTA under a navy section) gets none either.
 */
export function wantsSeam(thisBg: string, prevBg: string | null): boolean {
  // 'hero' = the section directly under the page hero. The old Squarespace
  // site drew its sweep divider at every media→content boundary, and Nathan
  // asked for exactly that (2026-07-19) — so the first band always carries the
  // seam, whatever its color. `null` = a surface with no hero above (hub etc.).
  if (prevBg === 'hero') return true;
  if (prevBg === null) return false;
  return (thisBg === 'cream' || thisBg === 'navy') && thisBg !== prevBg;
}

/** Resolve a page slug to a root-relative href ("home" → "/"). */
export function slugHref(slug: string | undefined, linkBase = ''): string {
  const path = !slug || slug === 'home' ? '/' : `/${slug}`;
  return withBase(path, linkBase);
}

/** Resolve an actionButton / navLink target to an href. */
export function linkHref(
  opts: { linkType?: string; pageSlug?: string; url?: string },
  linkBase = '',
): string {
  if (opts.linkType === 'url') return withBase(opts.url ?? '#', linkBase);
  return slugHref(opts.pageSlug, linkBase);
}

/** Whether an href points off-site (needs target=_blank / rel=noopener). */
export function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href) || href.startsWith('//');
}
