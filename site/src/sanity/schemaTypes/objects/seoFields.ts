import { defineField, type FieldDefinition } from 'sanity';
import { SeoSnippetInput } from '../../components/SeoSnippetInput';

// =============================================================================
// seoFields — the shared "Search & sharing" panel for a page-like document
// =============================================================================
// One helper builds the whole group, in one order, for every document type that
// can appear in Google. It puts a live snippet preview at the TOP of the group,
// then the four fields that control the snippet.
//
// REUSE, DO NOT RENAME. A document type that already has an SEO field keeps it,
// under its own name, with its own wording. Pass that definition in `reuse` and
// the helper puts it in the right place instead of making a second field. A
// rename would move the data to a new path and lose it.
//
// Current mapping (2026-08-27):
//   page.seoTitle       → reuse.title
//   page.seoDescription → reuse.description
//   page.ogImage        → reuse.image      (the share picture; NOT renamed to
//                                           seoImage, the site reads ogImage)
//   page.hideFromSearch → new, from this helper
//
// hubPage does NOT get this group. Hub pages sit behind the family password, so
// no search engine can read them; SEO fields there would be dead controls.
// =============================================================================

export interface SeoFieldsOptions {
  /** The field group the panel belongs to (must exist on the document type). */
  group: string;
  /** Fields this document ALREADY has. Each one is used in place of the default. */
  reuse?: {
    title?: FieldDefinition;
    description?: FieldDefinition;
    image?: FieldDefinition;
  };
}

/** The "Search & sharing" fields, in display order, for one document type. */
export function seoFields(opts: SeoFieldsOptions): FieldDefinition[] {
  const { group, reuse } = opts;

  // A value-less field: the custom input draws the previews and writes nothing.
  const snippet = defineField({
    name: 'seoPreview',
    title: 'How this page looks',
    type: 'string',
    group,
    readOnly: true,
    components: { input: SeoSnippetInput },
  });

  const title =
    reuse?.title ??
    defineField({
      name: 'seoTitle',
      title: 'Browser tab / search title',
      type: 'string',
      group,
      description: 'What Google and the browser tab show. Leave blank to use the page name.',
      validation: (R) => R.max(65).warning('Titles over ~65 characters get cut off in Google.'),
    });

  const description =
    reuse?.description ??
    defineField({
      name: 'seoDescription',
      title: 'Search description',
      type: 'text',
      rows: 2,
      group,
      description: 'The sentence shown under this page in Google results.',
      validation: (R) =>
        R.max(160).warning('Descriptions over ~160 characters get cut off in search results.'),
    });

  const image =
    reuse?.image ??
    defineField({
      name: 'seoImage',
      title: 'Social share image (optional)',
      type: 'image',
      options: { hotspot: true },
      group,
      description: 'The picture shown when this page is shared. Leave blank for the usual card.',
    });

  const hideFromSearch = defineField({
    name: 'hideFromSearch',
    title: 'Keep this page out of Google',
    type: 'boolean',
    group,
    description:
      'Turn this on to ask search engines to skip this page. The page stays on the site and anyone with the address can still open it.',
  });

  return [snippet, title, description, image, hideFromSearch];
}
