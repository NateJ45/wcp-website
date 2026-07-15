// =============================================================================
// GET /preview/live — server-side SSE proxy for preview auto-refresh
// =============================================================================
// The Presentation preview shows DRAFT content, so listening for edits needs
// the Sanity token — which must never reach the browser. This endpoint holds
// the token server-side: it opens ONE long-lived connection to Sanity's listen
// API (SSE mutation events, GROQ-filtered) and forwards a tiny "change" signal
// to the preview overlay, which soft-refetches the page (VisualEditingOverlay).
//
// Cost model (the reason this exists — see the removed /preview/refresh-signal
// poll, commit 719650f): a listen connection counts as a single Sanity API
// request no matter how long it stays open, and events ride that connection
// for free. Event-driven beats any poll: an idle preview tab costs ~nothing,
// and an edit costs one page refetch. Never reintroduce an interval poll here.
//
// The GROQ filter mirrors the overlay's old comlink `mutation` logic: signal
// when THIS page's doc changes (draft or published id), or when any shared /
// non-page doc changes (staff, classes, FAQs, settings... all can appear on
// any page) — but stay silent for edits to some OTHER page or legalPage.
//
// Connection lifecycle: Sanity ends listen connections periodically and the
// Worker can be recycled; either just closes our stream, and the browser's
// EventSource reconnects on its own (`retry:` below). When the preview tab
// goes away, Workers cancels the response stream, which aborts the upstream
// fetch so no orphaned Sanity connection lingers.
// =============================================================================
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { perspectiveCookieName } from '@sanity/preview-url-secret/constants';
import { projectId, dataset, apiVersion } from '@/sanity/env';

const LISTEN_QUERY = '*[_id in [$pageId, $draftId] || !(_type in ["page", "legalPage"])]';

export const GET: APIRoute = async ({ cookies, url }) => {
  // Same draft-mode gate as the preview pages themselves: only a browser that
  // went through the Presentation Tool's URL-secret handshake has this cookie.
  // No draft content ever flows through here, but there is no reason to let
  // anonymous visitors hold open upstream Sanity connections either.
  if (!cookies.has(perspectiveCookieName)) {
    return new Response('Preview only', { status: 403 });
  }

  // Doc id of the page being previewed (e.g. "page-classes-twos"). Ids are
  // passed to Sanity as JSON-encoded GROQ params (never spliced into the
  // query), the shape check just keeps garbage out of the request.
  const pageId = url.searchParams.get('page') ?? '';
  if (!/^[\w.-]{1,200}$/.test(pageId)) {
    return new Response('Bad page id', { status: 400 });
  }

  const upstream = new URL(
    `https://${projectId}.api.sanity.io/v${apiVersion}/data/listen/${dataset}`,
  );
  upstream.searchParams.set('query', LISTEN_QUERY);
  upstream.searchParams.set('$pageId', JSON.stringify(pageId));
  upstream.searchParams.set('$draftId', JSON.stringify(`drafts.${pageId}`));
  // Signal-only: we tell the overlay THAT something changed, never what.
  upstream.searchParams.set('includeResult', 'false');
  upstream.searchParams.set('includeMutations', 'false');
  upstream.searchParams.set('visibility', 'query');
  upstream.searchParams.set('tag', 'wcp.preview-live');

  const encoder = new TextEncoder();
  const abort = new AbortController();
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const send = (text: string) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          open = false; // client went away mid-write
        }
      };
      const close = () => {
        if (!open) return;
        open = false;
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          /* already closed/cancelled */
        }
      };

      // Client-side reconnect delay when this stream ends (upstream rotation,
      // Worker recycle, or Cloudflare cutting an idle streaming response) —
      // EventSource handles the retry loop for us. Each reconnect opens a fresh
      // non-CDN Sanity listen request (metered on the small free-plan API quota),
      // so this is deliberately unhurried: a 15s gap before reconnecting turns a
      // dropped connection into an occasional request instead of a ~2s reconnect
      // storm. The manual ⟳ button still works during the gap, and the overlay
      // does a catch-up refetch on reconnect, so no edit is lost — see
      // VisualEditingOverlay. (This connection also only stays open while the
      // preview tab is visible; the overlay closes it when the tab is hidden.)
      send('retry: 15000\n\n');
      // Comment heartbeat so proxies/Cloudflare never see an idle connection
      // long enough to cut it. Comments are invisible to EventSource.
      heartbeat = setInterval(() => send(': hb\n\n'), 25_000);

      try {
        const res = await fetch(upstream, {
          headers: { Authorization: `Bearer ${env.SANITY_TOKEN}`, Accept: 'text/event-stream' },
          signal: abort.signal,
        });
        if (!res.ok || !res.body) {
          console.error('[preview-live] upstream refused', res.status);
          close();
          return;
        }

        // Minimal SSE block parser: we only need each event's name. Blocks are
        // separated by a blank line; normalize CRLF on the concatenated buffer
        // so a \r\n split across chunks can't hide a separator.
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        for (;;) {
          // eslint-disable-next-line no-await-in-loop -- an SSE pump is inherently sequential
          const { done, value } = await reader.read();
          if (done) break;
          buf = (buf + decoder.decode(value, { stream: true })).replace(/\r\n/g, '\n');
          let sep;
          while ((sep = buf.indexOf('\n\n')) !== -1) {
            const block = buf.slice(0, sep);
            buf = buf.slice(sep + 2);
            const type = block
              .split('\n')
              .find((l) => l.startsWith('event:'))
              ?.slice('event:'.length)
              .trim();
            // A doc matching the filter changed — that is the whole signal.
            // welcome/reconnect and upstream comments are ours to swallow.
            if (type === 'mutation') send('event: change\ndata: {}\n\n');
            // The listen API's "stop and do not reconnect" order (e.g. dataset
            // gone). Obey by ending; a reconnect would just 403/404 anyway.
            if (type === 'disconnect') {
              close();
              abort.abort();
              return;
            }
          }
        }
      } catch {
        // Upstream dropped or the client cancelled us (abort) — either way
        // the browser's EventSource owns the retry.
      } finally {
        close();
      }
    },
    cancel() {
      // Preview tab closed / navigated away: kill the upstream connection.
      clearInterval(heartbeat);
      abort.abort();
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-store',
      // Mirrors the preview pages — this endpoint is Studio plumbing.
      'x-robots-tag': 'noindex',
    },
  });
};
