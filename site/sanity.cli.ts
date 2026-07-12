import { defineCliConfig } from 'sanity/cli';
import { projectId, dataset } from './src/sanity/env';

// =============================================================================
// Sanity CLI config — used by `sanity dataset`, `sanity cors`, etc.
// =============================================================================
// There is ONE canonical Studio: the one embedded at /studio on the live site
// (https://wcp-website.nathanjnixon86.workers.dev/studio/). It rebuilds on every deploy, so
// its schema is always current and can't drift.
//
// DO NOT run `npx sanity deploy`. That publishes a SEPARATE standalone Studio to
// <studioHost>.sanity.studio, which only updates when someone re-runs `sanity deploy` by
// hand — nothing automates it, so it silently falls behind the embedded Studio (missing
// newer types/fields) while pointing at the same production data. The previously-deployed
// hosted Studio has been taken down (`npx sanity undeploy`), and there is deliberately no
// studioHost/deployment here so a stray `sanity deploy` can't silently recreate the split.
// See docs/SANITY.md → "The Studio".
// =============================================================================
export default defineCliConfig({
  api: { projectId, dataset },
});
