// =============================================================================
// Sanity project constants (non-secret)
// =============================================================================
// projectId + dataset are NOT secrets — the Studio bundles them client-side.
// The only secret is SANITY_TOKEN (server-only, read from the Worker env).
//
// !! THE DATASET IS PUBLIC. This comment used to state it was private, and the
// Family Hub was built on that statement. It was never true: Sanity's free plan
// is "2 datasets (public only)", and on 2026-09-06 an anonymous query with no
// token returned all 414 documents — including 37 directory entries carrying
// children's names and home addresses. Reading server-side behind the hub gate
// protects the PAGE. The Content Lake API is a second door, open to anyone with
// the project id, which ships in every image URL in the page source.
//
// Until the directory moves out of Sanity, treat everything published here as
// world readable. `node scripts/public-data-audit.mjs` checks that for real
// instead of on trust, and fails when personal data comes back.
// =============================================================================

export const projectId = 'niemhgev';
export const dataset = 'production';

// Pin the API version to a date so query behavior can't shift under us.
export const apiVersion = '2025-01-01';
