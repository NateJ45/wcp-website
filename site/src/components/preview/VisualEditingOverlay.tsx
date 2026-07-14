import { VisualEditing } from '@sanity/visual-editing/react';
import type { HistoryRefresh } from '@sanity/visual-editing';
import { useCallback, useEffect, useRef } from 'react';

// =============================================================================
// VisualEditingOverlay — click-to-edit overlay + auto-refresh for the preview
// =============================================================================
// Two jobs, both only ever active in the Studio's Presentation preview (this is
// rendered from PreviewLayout with client:only when draftMode is true, so it
// never ships to a public page):
//
//  1. `<VisualEditing>` draws the click-to-edit overlay and opens the comlink
//     to the parent Studio window.
//  2. Auto-refresh: the section content is server-rendered Astro, so we can't
//     re-render it on the client the way a React app would. Instead we soft-
//     refetch THIS preview URL and swap in the fresh <main> — no full reload, no
//     scroll jump, and click-to-edit keeps working because the swapped-in HTML
//     is draft-fetched with stega too.
//
//     Two things TRIGGER that soft refresh:
//       a. The comlink `refresh` handler — the manual "Refresh" button
//          (`source: 'manual'`), and the `source: 'mutation'` edit event IF the
//          Studio still sends it.
//       b. A POLL of /preview/refresh-signal every ~1.5s. This is the reliable
//          path: the `mutation` refresh event is DEPRECATED and no longer fires
//          in current Studio versions (Sanity 6.x), so edits used to only appear
//          on a manual Refresh. The poll watches the newest draft-edit timestamp
//          and fires the SAME soft refresh when it moves. (Confirmed 2026-07-14:
//          manual Refresh worked, auto did not — because the event was gone.)
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

  // Poll the newest draft-edit timestamp; soft-refresh whenever it moves. This
  // is what actually makes edits appear on their own now that the comlink's
  // `mutation` event is gone. Only runs while the tab is visible (the preview
  // sits in a Studio panel that can be backgrounded). The first read just sets
  // the baseline so we don't refetch on mount.
  useEffect(() => {
    let lastRev: string | null = null;
    let disposed = false;

    const tick = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await fetch('/preview/refresh-signal', { cache: 'no-store' });
        const data = (await res.json()) as { rev?: string };
        if (disposed || typeof data.rev !== 'string') return;
        if (lastRev === null) {
          lastRev = data.rev;
        } else if (data.rev !== lastRev) {
          lastRev = data.rev;
          void softRefresh();
        }
      } catch {
        /* transient network blip — try again next tick */
      }
    };

    const id = window.setInterval(tick, 1500);
    return () => {
      disposed = true;
      window.clearInterval(id);
    };
  }, [softRefresh]);

  return <VisualEditing portal refresh={refresh} />;
}
