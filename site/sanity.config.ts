import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes, SINGLETON_TYPES } from './src/sanity/schemaTypes';
import { structure } from './src/sanity/structure';
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
  plugins: [structureTool({ structure }), visionTool()],
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
