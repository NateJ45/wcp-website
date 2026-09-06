// =============================================================================
// hub-spotlight — the Board's "look at this" pop-ups on the Family Hub
// =============================================================================
// A spotlight is one thing the Board wants every family to notice: the supply
// list in August, the auction in March, a store offer in December. It greets a
// signed-in family ONCE (per browser, per version stamp) on whatever hub page
// they land on. It is the collection sibling of the President's note, which is
// one letter on the hub home only.
//
// This module is PURE — no Sanity client, no Astro — so every rule is unit
// tested. The rules that are easy to get wrong live here:
//   - the show-from / show-until window (blank bounds are open),
//   - which spotlights show, and in what order, when several are live,
//   - what one button points at (five link kinds, one of them the store),
//   - the localStorage key + how a dismissal is compared to a version stamp.
//
// The hub reads this list through BOARD_CONTENT_CACHE (5 min fresh, L1-only,
// ZERO KV writes). CLAUDE.md keeps COLLECTIONS live so lists feel fresh, but
// this one is not a list: it is board-edited chrome on EVERY hub page, which
// is what that cache tier is for. See HubSpotlightModal.astro's header.
// =============================================================================
import { isUsableHubSlug } from '@/lib/hub-pages';
import type { PortableTextBlock } from '@portabletext/types';

/** The five things one spotlight button can point at. */
export type SpotlightLinkKind = 'builtin' | 'hubPage' | 'update' | 'url' | 'store';

/** The five brand tones a spotlight can wear (validated set, never a picker). */
export type SpotlightTone = 'info' | 'good' | 'warning' | 'brand';

/** One spotlight, as HUB_SPOTLIGHTS_QUERY projects it. */
export interface Spotlight {
  _id: string;
  title?: string | null;
  active?: boolean | null;
  version?: string | null;
  heading?: string | null;
  dateLabel?: string | null;
  summary?: string | null;
  body?: PortableTextBlock[] | null;
  tone?: string | null;
  icon?: string | null;
  image?: { asset?: unknown; alt?: string } | null;
  showFrom?: string | null;
  showUntil?: string | null;
  linkLabel?: string | null;
  linkKind?: string | null;
  /** linkKind 'builtin': a route from the hub's own built-in link list. */
  builtinHref?: string | null;
  /** linkKind 'hubPage': the dereferenced Board-made page. */
  pageSlug?: string | null;
  /** linkKind 'update': the dereferenced update's slug. */
  updateSlug?: string | null;
  /** linkKind 'url': a full outside address. */
  url?: string | null;
  /** linkKind 'store': the store address, dereferenced from hubStore. */
  storeUrl?: string | null;
}

/** What the modal actually needs to draw one button. */
export interface SpotlightLink {
  label: string;
  href: string;
  external: boolean;
}

/**
 * The localStorage key holding every "seen" mark, as `{ [id]: version }`.
 *
 * ONE key, not one per spotlight: a school year brings several spotlights and
 * per-id keys would litter a family's browser for years. Same JSON-map shape
 * as `wcp-my-classes`. Device-local, like the whole hub app layer. A spotlight
 * is marked seen when its page is DISPLAYED, so closing the modal after
 * reading 2 of 3 leaves the third to greet the family next visit.
 */
export const SPOTLIGHT_SEEN_KEY = 'wcp-spotlights-seen';

/**
 * How many live spotlights the modal paginates through.
 *
 * The server cannot know what this browser has already seen, so it sends the
 * top few as pages and the script opens at the first unseen one. Three is well
 * past normal (the Board usually runs one at a time) and keeps the page small.
 */
export const MAX_RENDERED_SPOTLIGHTS = 3;

/** Is `now` inside [showFrom, showUntil]? A blank bound is open. */
export function isInWindow(nowMs: number, showFrom?: string | null, showUntil?: string | null) {
  const from = showFrom ? new Date(showFrom).getTime() : -Infinity;
  const until = showUntil ? new Date(showUntil).getTime() : Infinity;
  // An unparseable date must not hide a spotlight the Board switched on.
  const safeFrom = Number.isNaN(from) ? -Infinity : from;
  const safeUntil = Number.isNaN(until) ? Infinity : until;
  return nowMs >= safeFrom && nowMs <= safeUntil;
}

/**
 * Is this spotlight showable right now?
 *
 * It needs the master switch on, a version stamp (the dismissal is compared to
 * it), a heading, and its time window open. Without a version stamp there is
 * nothing to remember a dismissal against, so it would reopen forever.
 */
export function isLive(s: Spotlight, nowMs: number): boolean {
  if (!s.active) return false;
  if (!s.version?.trim()) return false;
  if (!s.heading?.trim()) return false;
  return isInWindow(nowMs, s.showFrom, s.showUntil);
}

/**
 * The live spotlights, in the Board's drag order, capped at
 * MAX_RENDERED_SPOTLIGHTS. They become the modal's pages, first one first.
 *
 * The query already returns them in drag order, so this only filters; it never
 * re-sorts.
 */
export function liveSpotlights(all: Spotlight[] | null | undefined, nowMs: number): Spotlight[] {
  return (all ?? []).filter((s) => isLive(s, nowMs)).slice(0, MAX_RENDERED_SPOTLIGHTS);
}

/**
 * The one button, or null when the Board left the button label blank.
 *
 * A link kind whose target is missing (a deleted page, an empty store address)
 * returns null: the spotlight still shows its words, it just shows no button.
 * A dead button is worse than no button.
 */
export function spotlightLink(s: Spotlight): SpotlightLink | null {
  const label = s.linkLabel?.trim();
  if (!label) return null;

  const outside = (raw?: string | null): SpotlightLink | null => {
    const href = raw?.trim();
    if (!href || !/^https?:\/\//i.test(href)) return null;
    return { label, href, external: true };
  };

  switch (s.linkKind) {
    case 'builtin': {
      const href = s.builtinHref?.trim();
      // Built-in routes are picked from a dropdown of real hub routes, so the
      // only bad value is a route retired after the pick.
      if (!href || !href.startsWith('/family-hub')) return null;
      return { label, href, external: false };
    }
    case 'hubPage': {
      const slug = s.pageSlug?.trim();
      if (!isUsableHubSlug(slug)) return null;
      return { label, href: `/family-hub/${slug}`, external: false };
    }
    case 'update': {
      const slug = s.updateSlug?.trim();
      if (!slug) return null;
      return { label, href: `/family-hub/updates/${slug}`, external: false };
    }
    case 'url':
      return outside(s.url);
    case 'store':
      return outside(s.storeUrl);
    default:
      return null;
  }
}

/** The four validated tones → the modal's edge colour. Never a colour field. */
export const SPOTLIGHT_TONE_BORDER: Record<string, string> = {
  info: 'border-navy',
  good: 'border-green',
  warning: 'border-amber',
  brand: 'border-orange',
};

export const toneBorder = (tone?: string | null): string =>
  SPOTLIGHT_TONE_BORDER[tone ?? 'info'] ?? SPOTLIGHT_TONE_BORDER.info;

/**
 * Every live spotlight the Board is showing, in their drag order.
 *
 * `body` needs the same two references expanded that a post body does, so the
 * caller interpolates POST_BODY_PROJECTION rather than this module owning GROQ
 * it cannot test. The store address is dereferenced from the hubStore
 * singleton so the "Take me to the store" button never needs a pasted link.
 */
export const spotlightsQuery = (bodyProjection: string): string =>
  `*[_type == "hubSpotlight" && active == true] | order(orderRank){
  _id, title, active, version, heading, dateLabel, summary,
  "body": ${bodyProjection},
  tone, icon, image, showFrom, showUntil,
  linkLabel, linkKind, builtinHref,
  "pageSlug": page->slug,
  "updateSlug": update->slug.current,
  url,
  "storeUrl": *[_type == "hubStore"][0].storeUrl
}`;
