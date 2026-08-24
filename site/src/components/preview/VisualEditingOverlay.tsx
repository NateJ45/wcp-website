import { VisualEditing } from '@sanity/visual-editing/react';
import type { HistoryAdapter, HistoryRefresh } from '@sanity/visual-editing';
import { useCallback, useEffect, useRef } from 'react';

// Studio-driven navigation (the navigator side panel, document locations, the
// preview URL bar) reaches the iframe through this adapter. The DEFAULT is
// SPA-style: history.pushState and assume the app re-renders — but every
// preview page here is its own server-rendered document, so the URL changed
// while the page never did (bit the hub navigator on day one, 2026-08-24).
// An MPA adapter instead: any push/replace to a different URL is a REAL load.
// Module-level so the overlay never resubscribes on re-render.
const mpaHistory: HistoryAdapter = {
  subscribe: (navigate) => {
    // Report where the iframe actually is after each full document load, so
    // Presentation's URL bar and document resolution stay in sync.
    navigate({ type: 'replace', url: window.location.pathname + window.location.search });
    return () => {};
  },
  update: (update) => {
    const current = window.location.pathname + window.location.search;
    if (update.type === 'push' || update.type === 'replace') {
      if (update.url !== current) window.location.assign(update.url);
    } else if (update.type === 'pop') {
      window.history.back();
    }
  },
};

// =============================================================================
// VisualEditingOverlay — click-to-edit overlay + refresh for the preview
// =============================================================================
// Two jobs, both only ever active in the Studio's Presentation preview (this is
// rendered from PreviewLayout with client:only when draftMode is true, so it
// never ships to a public page):
//
//  1. `<VisualEditing>` draws the click-to-edit overlay and opens the comlink
//     to the parent Studio window.
//  2. Refresh: the section content is server-rendered Astro, so we can't
//     re-render it on the client the way a React app would. Instead we soft-
//     refetch THIS preview URL and swap in the fresh <main> — no full reload, no
//     scroll jump, and click-to-edit keeps working because the swapped-in HTML
//     is draft-fetched with stega too. Triggers, in order of relevance:
//
//     a. AUTO: an EventSource on /preview/live (see src/pages/preview/live.ts).
//        The Worker holds the Sanity token and proxies the listen API's
//        mutation events — already filtered to docs that can affect this page —
//        into tiny "change" signals; each one soft-refreshes. Event-driven on
//        purpose: one long-lived request per preview session instead of the
//        1.5s /preview/refresh-signal poll this replaced (2026-07-14, commit
//        719650f), which burned thousands of uncached Sanity API requests per
//        editing session. Never reintroduce an interval poll here.
//     b. MANUAL: the comlink `refresh` handler — the preview's Refresh (⟳)
//        button (`source: 'manual'`), kept as the fallback if the stream is
//        down, and the `source: 'mutation'` edit event IF the Studio ever
//        sends it again (deprecated, silent in Sanity 6.x).
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

  // Auto-refresh: subscribe to the Worker's change stream WHILE THIS PREVIEW TAB
  // IS VISIBLE. Relevance filtering (this page vs. some other page) already
  // happened server-side in the GROQ listen filter, so every "change" event means
  // "refetch now". softRefresh's 250ms debounce coalesces the burst an autosave
  // produces. On error we do nothing: EventSource reconnects by itself, and the
  // manual ⟳ still works.
  //
  // The Page Visibility gate matters for cost, not correctness: a Studio tab left
  // open in the background would otherwise hold this listen connection open and,
  // because Cloudflare rotates streaming responses, keep reconnecting — and each
  // reconnect is a fresh non-CDN Sanity listen request on the small free-plan API
  // quota (a real contributor to the July 2026 quota exhaustion). Hidden → close
  // the connection so a forgotten tab costs nothing; visible again → reopen and
  // do ONE catch-up refetch for anything that changed while we were disconnected.
  useEffect(() => {
    let es: EventSource | null = null;
    let wasHidden = false;
    const onChange = () => void softRefresh();

    const open = () => {
      if (es) return;
      es = new EventSource(`/preview/live?page=${encodeURIComponent(pageId)}`);
      es.addEventListener('change', onChange);
    };
    const close = () => {
      if (!es) return;
      es.removeEventListener('change', onChange);
      es.close();
      es = null;
    };

    const sync = () => {
      if (document.visibilityState === 'hidden') {
        wasHidden = true;
        close();
        return;
      }
      // Becoming visible: reopen, and catch up on edits missed while hidden.
      // Skip the catch-up on the very first mount (the page was just SSR'd, so a
      // refetch would only spend another draft read for identical HTML).
      const reopening = !es && wasHidden;
      open();
      if (reopening) void softRefresh();
    };

    sync();
    document.addEventListener('visibilitychange', sync);
    return () => {
      document.removeEventListener('visibilitychange', sync);
      close();
    };
  }, [pageId, softRefresh]);

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

  return <VisualEditing portal refresh={refresh} history={mpaHistory} />;
}
