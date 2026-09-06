// =============================================================================
// hub-preview — the real hub pages ARE the Studio preview (2026-08-30)
// =============================================================================
// The hub preview used to be a stub route that rendered only the editable
// text, so Presentation showed a page families never see. Now Presentation's
// iframe loads /family-hub/* itself: each hub route calls `hubDraftMode` and,
// when the request carries the Studio-issued preview cookie, reads its hubPage
// draft-aware (stega on → click-to-edit) and mounts the visual-editing overlay
// (HubShell's `previewDocId`). Families see nothing different — without the
// cookie every branch below is exactly the pre-2026-08-30 behavior.
//
// The cookie is a CREDENTIAL, not a flag: its value is a fingerprint of the
// server-side Sanity token, verified by src/lib/preview-auth.ts, and an empty
// server secret FAILS CLOSED. src/middleware.ts accepts it as an alternative
// to the family session for exactly the /family-hub prefix.
//
// Never import this from a prerendered page — preview-auth reads the Worker
// runtime env.
// =============================================================================
import { perspectiveCookieName } from '@sanity/preview-url-secret/constants';
import type { AstroCookies } from 'astro';
import { isStudioPreview } from '@/lib/preview-auth';
import { previewFetch } from '@/lib/cms-preview';
import { sanityFetch, BOARD_CONTENT_CACHE } from '@/lib/sanity';
import { docEditAttr } from '@/lib/preview-edit-attr';

/** True when this request comes from the Studio's Presentation iframe. */
export async function hubDraftMode(cookies: AstroCookies): Promise<boolean> {
  return isStudioPreview(cookies.get(perspectiveCookieName)?.value);
}

/**
 * The hubPage read every hub route makes, draft-aware. A draft read goes
 * through the preview client (drafts perspective, stega on) and NEVER through
 * the shared board-content cache — a draft cached there would show unpublished
 * words to families for the cache's whole TTL.
 */
export async function readHubPageDoc<T>(
  draftMode: boolean,
  query: string,
  params: Record<string, unknown>,
): Promise<T | null> {
  if (draftMode) return previewFetch<T | null>(true, query, params);
  return sanityFetch<T | null>(query, params, { cache: BOARD_CONTENT_CACHE });
}

/** The overlay + /preview/live key on the PUBLISHED id; the drafts perspective
 *  hands back the `drafts.` twin's. */
export const publishedId = (id: string | undefined): string | undefined =>
  id?.replace(/^drafts\./, '');

/**
 * A widget's `data-sanity` value — but only in the Studio preview, and only
 * when the owning document's id is actually known. Families always get
 * undefined (the attribute is simply absent). Wrapping a widget in this is
 * what makes it SELECTABLE in Presentation: a click outlines it and opens the
 * named document at the named field, so an editor learns where each widget's
 * content really lives instead of finding it unclickable.
 */
export function hubEditAttr(
  locals: App.Locals,
  id: string | null | undefined,
  type: string,
  path: string,
): string | undefined {
  if (!locals.hubPreview || !id) return undefined;
  return docEditAttr(publishedId(id ?? undefined)!, type, path);
}
