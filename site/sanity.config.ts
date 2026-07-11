import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { presentationTool } from 'sanity/presentation';
import { media } from 'sanity-plugin-media';
import DocumentsPane from 'sanity-plugin-documents-pane';
import { SeoPreviewPane } from './src/sanity/components/SeoPreviewPane';
import { schemaTypes, SINGLETON_TYPES } from './src/sanity/schemaTypes';
import { structure } from './src/sanity/structure';
import { resolve } from './src/sanity/resolve';
import { wcpStudioTheme } from './src/sanity/theme';
import { projectId, dataset } from './src/sanity/env';

// =============================================================================
// Sanity Studio configuration
// =============================================================================
// Powers both the embedded studio (mounted at /studio by @sanity/astro) and the
// hosted studio (`npx sanity deploy` → <host>.sanity.studio). Board members log
// in with their own Sanity accounts; the family gate is separate.
//
// - theme: brand-matched navy/orange chrome (see src/sanity/theme.ts).
// - structure: the volunteer-friendly left nav (see src/sanity/structure.ts).
// - presentationTool: click-to-edit live preview against the Studio-only
//   /preview/* routes (never the real public pages — see src/sanity/resolve.ts
//   and src/pages/preview/). previewMode only sets `enable`: `disable` is a
//   documented no-op in this Sanity version ("not yet implemented"), so
//   exiting preview is a plain link to /api/draft-mode/disable instead
//   (see src/layouts/PreviewLayout.astro).
// - document.actions / newDocumentOptions: enforce singletons — one Site
//   Settings, one Tuition & Fees, with no duplicate/delete so nobody can create
//   a confusing second copy.
// - scheduledDrafts.enabled: true — per-document scheduling, so a volunteer can
//   set a page or (soon) a blog post to publish at a future date/time, like
//   Squarespace/WordPress. Sanity publishes it on schedule server-side, which
//   fires the same publish webhook and rebuilds the static site at that time.
// - releases.enabled: false — the newer "Content Releases" bundle tool is more
//   than the board needs (it groups many docs into one scheduled release);
//   per-document scheduling above is the simpler fit, so we keep Releases off.
// =============================================================================
export default defineConfig({
  name: 'wcp',
  title: 'West Chester Preschool',
  projectId,
  dataset,
  theme: wcpStudioTheme,
  releases: { enabled: false },
  scheduledDrafts: { enabled: true },
  plugins: [
    structureTool({
      structure,
      // Extra document tabs, added by type:
      //  - page / post / legal: a read-only SEO + social-share preview.
      //  - shared docs (class/staff/quote/FAQ): a "Used on" panel listing the
      //    pages and posts that reference this one (answers "is it safe to
      //    change/delete?"). Both are free — no plan gating.
      defaultDocumentNode: (S, { schemaType }) => {
        if (['page', 'post', 'legalPage'].includes(schemaType)) {
          return S.document().views([
            S.view.form(),
            S.view
              .component(SeoPreviewPane)
              .title('SEO preview')
              .icon(() => '🔎'),
          ]);
        }
        if (['class', 'staff', 'testimonial', 'faqItem'].includes(schemaType)) {
          return S.document().views([
            S.view.form(),
            S.view
              .component(DocumentsPane)
              .options({
                query: `*[references($id)]{ _id, _type, title, name }`,
                params: { id: `_id` },
                options: { perspective: 'previewDrafts' },
              })
              .title('Used on')
              .icon(() => '🔗'),
          ]);
        }
        return S.document().views([S.view.form()]);
      },
    }),
    presentationTool({
      resolve,
      previewUrl: {
        initial: '/preview',
        previewMode: { enable: '/api/draft-mode/enable' },
      },
    }),
    // Media library — a WordPress/Squarespace-style asset manager. Adds a
    // "Media" tool to the Studio nav (grid browse, search, tags, edit alt/
    // title, see where each image is used) and a browse option in every image
    // picker. Self-contained; no external provisioning.
    media(),
  ],
  schema: { types: schemaTypes },
  document: {
    // Singletons keep only their editing actions (no unpublish/delete/duplicate).
    actions: (prev, { schemaType }) =>
      SINGLETON_TYPES.has(schemaType)
        ? prev.filter(({ action }) => !['unpublish', 'delete', 'duplicate'].includes(action || ''))
        : prev,
    // Remove singletons from the global "create new document" menu.
    newDocumentOptions: (prev, { creationContext }) =>
      creationContext.type === 'global'
        ? prev.filter((option) => !SINGLETON_TYPES.has(option.templateId))
        : prev,
  },
});
