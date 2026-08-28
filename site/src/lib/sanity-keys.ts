// =============================================================================
// sanity-keys — fresh `_key`s for anything copied inside the dataset
// =============================================================================
// Every member of a Sanity array carries a `_key` that must be unique within
// that array. Copying a value (duplicating a page, saving a section as a preset,
// dropping a preset onto a page) therefore has to re-key it at EVERY depth, or
// the Studio shows a "duplicate keys" error on the array it landed in and the
// form refuses to edit it.
//
// Pure and dependency-free so it can be unit tested and shared by the navigator
// and the document actions.
// =============================================================================

/** A short random key, in the shape Sanity uses for array members. */
export const newKey = (): string => crypto.randomUUID().replace(/-/g, '').slice(0, 12);

/**
 * Deep-copy a value, replacing every `_key` with a new one. Non-objects come
 * back as they are, so this is safe to call on a whole document or a single
 * section.
 */
export function regenerateKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(regenerateKeys);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = k === '_key' ? newKey() : regenerateKeys(v);
    }
    return out;
  }
  return value;
}
