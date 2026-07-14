// =============================================================================
// Trash — pure helpers for the soft-delete / "Recently deleted" system
// =============================================================================
// Deleting content in the Studio doesn't destroy it: the Archive action snapshots
// the whole document into a `trashedItem` (its JSON in `payload`) and removes the
// original, so it leaves both the Studio lists and the public site. Restore
// rebuilds the original from that JSON. These helpers are the pure, framework-
// free core (JSON in/out, title extraction, system-field stripping) so the round
// trip is unit-tested independently of Sanity. See src/sanity/actions/archive.tsx.
// =============================================================================

// System fields Sanity manages itself — never restored, it assigns fresh ones.
// `_id` and `_type` ARE kept (we restore to the same id so references re-resolve).
const SYSTEM_STRIP = ['_rev', '_createdAt', '_updatedAt'] as const;

// Fields we look at, in order, for a human-friendly label in the trash list.
const TITLE_FIELDS = ['title', 'name', 'heading', 'headline', 'question', 'familyName'] as const;

/** A readable name for a document, for the Recently-deleted list. */
export function trashTitle(doc: Record<string, unknown> | null | undefined): string {
  if (!doc) return 'Untitled';
  for (const key of TITLE_FIELDS) {
    const v = doc[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  const slug = doc.slug;
  if (slug && typeof slug === 'object') {
    const cur = (slug as { current?: unknown }).current;
    if (typeof cur === 'string' && cur.trim()) return cur.trim();
  }
  return 'Untitled';
}

/** Snapshot a document to the JSON string stored on the trashedItem. Always
 *  pins the id to the PUBLISHED id so a restore comes back live, not as a draft. */
export function serializeForTrash(doc: Record<string, unknown>): string {
  const publishedId = String(doc._id ?? '').replace(/^drafts\./, '');
  return JSON.stringify({ ...doc, _id: publishedId });
}

export type RestorableDoc = { _id: string; _type: string } & Record<string, unknown>;

/** Rebuild the document to restore from a stored payload. Strips the system
 *  fields Sanity owns and normalizes the id to published. Returns null if the
 *  payload is unparseable or isn't a real document (missing _id / _type). */
export function deserializeFromTrash(payload: string): RestorableDoc | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const doc = parsed as Record<string, unknown>;
  if (typeof doc._id !== 'string' || typeof doc._type !== 'string') return null;

  const clean: Record<string, unknown> = { ...doc };
  for (const key of SYSTEM_STRIP) delete clean[key];
  clean._id = doc._id.replace(/^drafts\./, '');
  return clean as RestorableDoc;
}
