import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { presentationTool } from 'sanity/presentation';
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
// =============================================================================
export default defineConfig({
  name: 'wcp',
  title: 'West Chester Preschool',
  projectId,
  dataset,
  theme: wcpStudioTheme,
  plugins: [
    structureTool({ structure }),
    visionTool(),
    presentationTool({
      resolve,
      previewUrl: {
        initial: '/preview',
        previewMode: { enable: '/api/draft-mode/enable' },
      },
    }),
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
