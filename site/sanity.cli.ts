import { defineCliConfig } from 'sanity/cli';
import { projectId, dataset } from './src/sanity/env';

// =============================================================================
// Sanity CLI config — used by `npx sanity deploy` / `sanity dataset` etc.
// =============================================================================
// studioHost sets the hosted studio subdomain: <studioHost>.sanity.studio.
// Change it here if the name is taken.
// =============================================================================
export default defineCliConfig({
  api: { projectId, dataset },
  studioHost: 'westchesterpreschool',
  // appId pins this deployed studio so future `sanity deploy` runs don't prompt.
  deployment: { autoUpdates: true, appId: 'sfrtgkpqfli0iwfo1338kedf' },
});
