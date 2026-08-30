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
// EventSource reconnects on its own (`retry:` below).
//
// THREE ROADS OUT, and all three must abort the upstream fetch (2026-08-28).
// Every preview iframe reload opens a fresh listen through here, so an upstream
// that outlives its client is a Worker invocation pinned open for nobody — pile
// enough up and the account starts refusing connections.
//
//   1. `cancel()` — Workers cancels the response stream when the client goes
//      away. This was the only road that aborted; it is still the usual one.
//   2. `request.signal` — the request is aborted. Wired explicitly rather than
//      trusted to reach us as a cancel: it is the platform's own statement that
//      the client is gone, and it fires even while we are parked in
//      `reader.read()` waiting for a Sanity event that will never come.
//   3. `send()` throwing — the client went away MID-WRITE, so `enqueue` throws
//      instead of `cancel` firing. That case used to set `open = false` and
//      leave the read loop below spinning on a live upstream connection forever.
//      That was the leak. It now closes and aborts like the others.
// =============================================================================
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { perspectiveCookieName } from '@sanity/preview-url-secret/constants';
import { projectId, dataset, apiVersion } from '@/sanity/env';

// "Anything that could appear on this page" — the previewed doc itself, or any
// shared/content doc. Excluded on purpose (2026-08-30): machine/inbox types
// that FAMILIES generate at any hour (sign-ups, photo submissions, hours logs,
// form submissions, subscribers) and the platform's own system docs. None of
// them render on a preview page, but each one used to fire a change signal
// that made every open preview re-render its whole page — on the hub, whose
// real pages became the preview surface today, that meant full-dashboard SSRs
// piling up until the Worker hit Error 1102 while an editor just sat idle.
const LISTEN_QUERY = `*[_id in [$pageId, $draftId] || !(
  _type in ["page", "legalPage",
    "trashedItem", "submission", "testimonialSubmission", "subscriber",
    "signupEntry", "photoSubmission", "hoursLog", "linkHealth"]
  || _type match "sanity.*"
)]`;

export const GET: APIRoute = async ({ cookies, url, request }) => {
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
  // DO NOT change this to "transaction" to make the preview feel faster.
  // "query" means Sanity waits until the change is visible to a QUERY before it
  // signals, which is precisely what the overlay does next: it refetches this
  // page from the server. A "transaction" event fires earlier, and the refetch
  // it triggered would return data that is still stale — re-rendering the page
  // with the OLD words. Worse, the overlay's instant-text path
  // (src/components/preview/overlay/useInstantText.ts) has usually already put
  // the NEW words on the page by then, so the early refresh would visibly undo
  // them. The earlier signal already reaches the frame by a different road: the
  // Studio relays its own transaction-visibility listen over the comlink, and
  // that is what instant text listens to. This one stays slow on purpose.
  upstream.searchParams.set('visibility', 'query');
  upstream.searchParams.set('tag', 'wcp.preview-live');

  const encoder = new TextEncoder();
  const abort = new AbortController();
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
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
      const send = (text: string) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          // Client went away mid-write (road 3 above). Take the upstream with
          // us: the read loop below is otherwise happy to hold a Sanity listen
          // open for a browser that is no longer there.
          close();
          abort.abort();
        }
      };

      // Road 2. The listener is removed by `close()`'s own path going quiet —
      // this stream and this request live and die together, so there is nothing
      // to unregister that outlives them.
      request.signal.addEventListener('abort', () => {
        close();
        abort.abort();
      });

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
