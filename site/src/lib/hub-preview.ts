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
