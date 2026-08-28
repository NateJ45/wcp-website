// =============================================================================
// urls — document type + slug → the page's address on the live site
// =============================================================================
// THE ADAPTATION POINT for the shared share-draft-link feature. The ported
// components/shareDraftLink.tsx is a byte-identical copy of the starter's
// canonical file (see PORTS.md in ncs-astro-sanity-starter); it calls
// `pathForDoc` from this module and turns the answer into a /preview path.
// Every site in the family writes its own version of this file, because every
// site routes its documents differently.
//
// The path arithmetic itself is NOT repeated here. src/lib/redirects.ts already
// owns it (the Redirects manager and the safe-rename action both depend on it,
// and it is unit-tested in src/lib/redirects.test.ts), so this module only
// reads the slug off a document and hands it over. One mapping, three callers.
//
// WHY hubPage IS ABSENT, on purpose
// A share link works by minting a Sanity preview secret and letting
// /api/draft-mode/enable exchange it for the Studio preview cookie. That cookie
// is exactly what src/pages/preview/family-hub/[...key].astro accepts as proof
// of Studio provenance (src/lib/preview-auth.ts). The family password is NOT
// part of that check: src/middleware.ts guards /family-hub, not
// /preview/family-hub. So a hub share link would show gated family content to
// anyone who received the link, for an hour, with no password. The hub holds
// the directory, health details and the children's photo wall, so there is no
// wording that makes that acceptable. hubPage therefore gets NO share action
// and NO share button in the hub page list. Say "I can send you a screenshot"
// instead. Do not add it here.
// =============================================================================
import { pathForDocSlug } from '../lib/redirects';

/**
 * Live-site path for a document, or null when the type has no page of its own.
 *
 * `page` keeps a plain string slug (slashes are meaningful: "classes/twos");
 * `post` uses Sanity's slug object. Both shapes are read here so the caller
 * never has to know which is which.
 */
export function pathForDoc(schemaType: string, doc: unknown): string | null {
  const value = (doc as { slug?: unknown } | null | undefined)?.slug;
  const slug =
    value && typeof value === 'object'
      ? (value as { current?: unknown }).current
      : (value ?? undefined);
  return pathForDocSlug(schemaType, slug);
}
