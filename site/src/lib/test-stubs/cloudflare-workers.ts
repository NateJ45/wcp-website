// =============================================================================
// `cloudflare:workers` stub — VITEST ONLY
// =============================================================================
// The Worker runtime supplies this module. Vitest runs in plain Node and cannot
// resolve it, so vitest.config.ts aliases the module id here. The stub gives a
// module the two things hub code reads from it: an `env` with no bindings (so a
// KV read is a clean miss) and no `waitUntil` (so hub-cache falls back to its
// fire-and-forget path). Nothing imports this file at build time.
// =============================================================================
export const env: Record<string, unknown> = {};
