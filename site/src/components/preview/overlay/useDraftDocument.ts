// =============================================================================
// useDraftDocument — read the draft the preview frame already holds (2026-08-28)
// =============================================================================
// The preview island is public code in a public bundle. It has no Sanity token
// and no write client, and it must never grow one.
//
// It does not need one to READ. `useDocuments()` from
// @sanity/visual-editing/react hands back the OPTIMISTIC DOCUMENT for an id: an
// in-memory copy the Studio keeps up to date over the comlink. `useInstantText`
// diffs that copy against the last one it saw, so this hook is the only door it
// needs.
//
// IT DOES NOT NEED ONE TO WRITE EITHER (2026-08-28, card 28). `doc.patch()`
// sends the mutation over the comlink to the parent Studio window, which applies
// it with the editor's own session, exactly as if they had typed in the form.
// That is why every write from an in-canvas control lands in the DRAFT, shows up
// in the Studio's unpublished-changes badge, is covered by the Studio's own
// undo, and still needs Publish.
//
// The hook is only meaningful inside the <VisualEditing> tree with the
// optimistic actor running, which is precisely when overlay components exist.
// The underlying calls THROW outside it, and again before the document has
// streamed in. Both are caught here and reported as "not now" rather than
// crashing the preview page.
//
// The patch shape is @sanity/mutate's NodePatch: a path of segments and one
// operation. It is typed locally rather than imported, so the island depends on
// nothing that is not already in package.json.
// =============================================================================
import { useCallback } from 'react';
import { useDocuments } from '@sanity/visual-editing/react';
import { valueAtPath, type PathSegment } from '@/lib/sanity-path';

/** The three operations these controls need. */
export type PatchOp =
  { type: 'set'; value: unknown } | { type: 'setIfMissing'; value: unknown } | { type: 'unset' };

/** One patch: where, and what. */
export interface DraftPatch {
  path: PathSegment[];
  op: PatchOp;
}

/** Set a value. */
export function setAt(path: PathSegment[], value: unknown): DraftPatch[] {
  return [{ path, op: { type: 'set', value } }];
}

/**
 * Set a value inside an object that may not exist yet. The band card needs this
 * for `header.headingAccent` on a section whose header has never been opened.
 */
export function setInside(container: PathSegment[], key: string, value: unknown): DraftPatch[] {
  return [
    { path: container, op: { type: 'setIfMissing', value: {} } },
    { path: [...container, key], op: { type: 'set', value } },
  ];
}

/** Remove a value. Used for "no underlined word" and for an emptied rich twin. */
export function unsetAt(path: PathSegment[]): DraftPatch[] {
  return [{ path, op: { type: 'unset' } }];
}

export interface DraftDocument {
  /**
   * The current draft snapshot, or null when it cannot be read yet.
   *
   * ONE attempt, and no console warning. This runs on every edit, so a retry
   * with a sleep would put a stall and a log line in a hot path. There is also
   * nothing to recover: the next edit brings another chance a moment later.
   */
  readNow: () => Promise<Record<string, unknown> | null>;
  /**
   * The same snapshot, with ONE retry and a warning when it still fails. For
   * callers that run when an editor points at something rather than on every
   * keystroke: the document is normally already there, and "normally" is not
   * "always" on a cold frame. Without the retry a control would not appear until
   * the next hover.
   */
  read: () => Promise<Record<string, unknown> | null>;
  /** The value at a path in the current draft, or undefined. */
  readAt: (path: PathSegment[]) => Promise<unknown>;
  /** Apply patches to the draft and commit. Resolves false when it could not. */
  write: (patches: DraftPatch[]) => Promise<boolean>;
}

export function useDraftDocument(documentId: string): DraftDocument {
  const { getDocument } = useDocuments();

  const readNow = useCallback(async () => {
    try {
      const doc = getDocument<Record<string, unknown>>(documentId);
      return (await doc.getSnapshot()) as Record<string, unknown> | null;
    } catch {
      return null;
    }
  }, [getDocument, documentId]);

  const read = useCallback(async () => {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const doc = getDocument<Record<string, unknown>>(documentId);
        return (await doc.getSnapshot()) as Record<string, unknown> | null;
      } catch (err) {
        if (attempt === 1) {
          console.warn('[overlay] could not read', documentId, err);
          return null;
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
    return null;
  }, [getDocument, documentId]);

  const readAt = useCallback(
    async (path: PathSegment[]) => valueAtPath(await read(), path),
    [read],
  );

  const write = useCallback(
    async (patches: DraftPatch[]) => {
      if (!patches.length) return false;
      try {
        const doc = getDocument<Record<string, unknown>>(documentId);
        // The cast is the price of not importing @sanity/mutate for its types.
        // DraftPatch is structurally its NodePatch.
        doc.patch(patches as never);
        return true;
      } catch (err) {
        console.warn('[overlay] could not write', documentId, err);
        return false;
      }
    },
    [getDocument, documentId],
  );

  return { readNow, read, readAt, write };
}
