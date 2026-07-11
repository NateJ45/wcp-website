// =============================================================================
// Sanity project constants (non-secret)
// =============================================================================
// projectId + dataset are NOT secrets — the Studio bundles them client-side.
// The only secret is SANITY_TOKEN (server-only, read from the Worker env).
// The dataset is PRIVATE, so all reads happen server-side with the token,
// behind the Family Hub gate — never the public CDN.
// =============================================================================

export const projectId = 'niemhgev';
export const dataset = 'production';

// Pin the API version to a date so query behavior can't shift under us.
export const apiVersion = '2025-01-01';
