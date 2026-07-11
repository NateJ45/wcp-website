import { VisualEditing } from '@sanity/visual-editing/react';
import type { HistoryRefresh } from '@sanity/visual-editing';
import { useCallback, useRef } from 'react';

// =============================================================================
// VisualEditingOverlay — click-to-edit overlay + auto-refresh for the preview
// =============================================================================
// Two jobs, both only ever active in the Studio's Presentation preview (this is
// rendered from PreviewLayout with client:only when draftMode is true, so it
// never ships to a public page):
//
//  1. `<VisualEditing>` draws the click-to-edit overlay and opens the comlink
//     to the parent Studio window.
//  2. The `refresh` handler makes the preview update on its OWN as you edit.
//     The section content is server-rendered Astro, so we can't re-render it on
//     the client the way a React app would. Instead, when the Studio reports a
//     draft mutation over the comlink, we soft-refetch THIS preview URL and swap
//     in the fresh <main>. Edits then appear ~instantly after you pause typing,
//     with no full-page reload, no scroll jump, and no manual refresh — and
//     click-to-edit keeps working because the swapped-in HTML is draft-fetched
//     with stega too. (For `source: 'mutation'` the library has NO default
//     behavior on purpose, so without this handler nothing happened at all —
//     which is why the preview used to only update on a manual browser reload.)
//
// This deliberately does NOT re-render per keystroke: that would require porting
// the whole Astro section renderer to React, recreating the two-renderers drift
// the page builder exists to avoid. See docs/PAGE_BUILDER.md.
// =============================================================================

interface Props {
  /** The doc id this preview renders, e.g. "page-classes-twos". */
  pageId: string;
}

export default function VisualEditingOverlay({ pageId }: Props) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pending = useRef<Array<() => void>>([]);

  // Coalesce a burst of mutations (autosave fires several in quick succession)
  // into a single refetch, and resolve every awaiting refresh when it lands.
  const softRefresh = useCallback(
    () =>
      new Promise<void>((resolve) => {
        pending.current.push(resolve);
        clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
          const resolvers = pending.current;
          pending.current = [];
          try {
            const res = await fetch(window.location.href, {
              headers: { 'x-preview-soft-refresh': '1' },
            });
            const html = await res.text();
            const next = new DOMParser().parseFromString(html, 'text/html').querySelector('#main');
            const current = document.getElementById('main');
            if (next && current) current.replaceWith(next);
            else window.location.reload();
          } catch {
            window.location.reload();
          } finally {
            resolvers.forEach((r) => r());
          }
        }, 250);
      }),
    [],
  );

  const refresh = useCallback(
    (payload: HistoryRefresh): false | Promise<void> => {
      // The "Refresh" button in Presentation.
      if (payload.source === 'manual') return softRefresh();
      // A document was edited and autosaved. We have no loader, so we own this.
      // Refetch when THIS page changed, or when a shared/referenced doc changed
      // (staff, testimonials, classes, FAQs, settings, tuition — anything that
      // isn't some OTHER page), since those can appear on this page.
      const id = payload.document._id.replace(/^drafts\./, '');
      const isThisPage = id === pageId;
      const isSharedDoc =
        payload.document._type !== 'page' && payload.document._type !== 'legalPage';
      return isThisPage || isSharedDoc ? softRefresh() : false;
    },
    [pageId, softRefresh],
  );

  return <VisualEditing portal refresh={refresh} />;
}
