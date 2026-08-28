// =============================================================================
// preview-edit-attr — explicit `data-sanity` targets for whole SECTIONS
// =============================================================================
// Stega markers give click-to-edit on TEXT. A whole section (its band, its
// images, its empty space) has no text of its own to click, so the Presentation
// overlay cannot draw section-level controls from stega alone. An explicit
// `data-sanity` attribute on each section wrapper fixes that: the overlay
// outlines the section as ONE array item and shows the array controls (move,
// duplicate, delete, insert) right in the preview — the Squarespace feel.
//
// Preview surfaces only. The live site never renders these attributes: the
// public route and the hub route pass no `editDoc`, so the attribute is absent
// there (and stega is off anyway).
// =============================================================================
import { createDataAttribute } from '@sanity/visual-editing/create-data-attribute';

export interface EditDoc {
  /** The PUBLISHED document id (no `drafts.` prefix). */
  id: string;
  /** The document _type, e.g. "page" or "hubPage". */
  type: string;
}

/** The `data-sanity` value that targets `sections[_key=="<key>"]` on a doc. */
export function sectionEditAttr(doc: EditDoc, key: string): string {
  return createDataAttribute({
    id: doc.id.replace(/^drafts\./, ''),
    type: doc.type,
    baseUrl: '/studio',
  })(`sections[_key=="${key}"]`).toString();
}

/**
 * The `data-sanity` value that targets a field on ANY document — the
 * WordPress-template-part gesture (2026-08-28). PreviewLayout wraps the shared
 * Header and Footer in this attribute (header → the navigation doc's mainNav,
 * footer → siteSettings), so in Edit mode the chrome outlines as an editable
 * surface and a click switches the edit panel to the owning document.
 */
export function docEditAttr(id: string, type: string, path: string): string {
  return createDataAttribute({
    id: id.replace(/^drafts\./, ''),
    type,
    baseUrl: '/studio',
  })(path).toString();
}
