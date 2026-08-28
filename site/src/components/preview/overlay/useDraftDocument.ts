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
// SMALLER THAN THE PRESACADEMY ORIGINAL, on purpose. That repo also draws
// in-canvas controls (swatches, an accent-word picker) that WRITE through
// `doc.patch()`, so its copy carries `read`, `readAt` and `write` as well. This
// repo has no in-canvas controls, so it takes the one method it uses. Add the
// others back from presacademy if this site ever grows them; do not invent a
// second way to reach the same actor.
//
// The underlying call THROWS before the document has streamed in, and again
// outside the <VisualEditing> tree. Both are caught here and reported as "not
// now" rather than crashing the preview page.
// =============================================================================
import { useCallback } from 'react';
import { useDocuments } from '@sanity/visual-editing/react';

export interface DraftDocument {
  /**
   * The current draft snapshot, or null when it cannot be read yet.
   *
   * ONE attempt, and no console warning. This runs on every edit, so a retry
   * with a sleep would put a stall and a log line in a hot path. There is also
   * nothing to recover: the next edit brings another chance a moment later.
   */
  readNow: () => Promise<Record<string, unknown> | null>;
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

  return { readNow };
}
