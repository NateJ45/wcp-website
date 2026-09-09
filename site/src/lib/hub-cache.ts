// =============================================================================
// hub-cache — two-tier TTL cache with stale-while-revalidate
// =============================================================================
// WHY: hub pages render per request, and the Google round-trips they lean on
// are slow — the Apps Script calendar feed runs 1.5-3s per hit and a gviz
// sheet read ~0.5-1.5s. Results are cached in two tiers:
//
//   L1 — module-scope Map. Free and instant, but lives only as long as the
//        Worker isolate (recycled on deploys and idle spells).
//   L2 — the CACHE KV namespace (wrangler.jsonc). Durable across isolates,
//        so the FIRST visitor after a deploy or a quiet morning gets a ~5ms
//        KV read instead of the Google fan-out. Local dev/preview gets a
//        miniflare-simulated KV automatically; if the binding is absent the
//        cache silently degrades to L1-only.
//
// OPT OUT OF L2 with `{ kv: false }`. Every KV write counts against the free
// tier's ~1k writes/day cap (account-wide — see the KV write-budget gotcha in
// CLAUDE.md), and L2 only earns that cost when the origin is SLOW enough that a
// first-visitor-after-recycle read would hurt (the 1.5-3s Apps Script calendar,
// the gviz sheets). For a FAST origin like Sanity's authenticated CDN
// (~100-300ms), the durability isn't worth a write: kv:false keeps the L1 Map
// (repeat navigations still skip the round-trip) but never touches KV, so
// board content costs ZERO writes. Freshness is unchanged — the TTL just
// governs how often a warm isolate re-reads the fast origin.
//
// FRESHNESS MODEL (per call site): `ttlMs` is the fresh window; an optional
// `swrMs` extends it as a stale-while-revalidate window. Within ttl → serve.
// Within ttl+swr → serve the stale value INSTANTLY and refresh in the
// background (waitUntil keeps the refresh alive past the response; without
// it we still fire-and-forget — a cancelled refresh just means the next
// request tries again). Past both → blocking fetch. The school calendar
// changes at most ~daily, so it rides a long swr window: visitors never wait
// on Google, yet an edit still shows within minutes of the next visit.
//
// Values are stored as {v, at} envelopes (age drives the swr decision) under
// a versioned key prefix, so a shape change never chokes on old entries.
// In-flight dedupe: concurrent renders share ONE fetch. Failures are never
// cached, and a failed background refresh keeps serving the stale value.
// =============================================================================
import * as cfw from 'cloudflare:workers';

const env = cfw.env;
// waitUntil keeps background refreshes alive after the response is sent.
// Guarded: not every runtime version exports it (miniflare/dev quirks).
const keepAlive = (p: Promise<unknown>): void => {
  const wu = (cfw as { waitUntil?: (p: Promise<unknown>) => void }).waitUntil;
  if (typeof wu === 'function') wu(p.catch(() => {}));
  else void p.catch(() => {});
};

interface Envelope {
  v: unknown;
  at: number;
}

const store = new Map<string, Envelope>();
const inflight = new Map<string, Promise<unknown>>();

// NEGATIVE READINGS EXPIRE FAST (2026-08-30). The cache stores the raw
// reading, and "this document does not exist" is a reading — which meant a
// just-created board page kept 404ing for the whole fresh window, and a new
// classroom page for up to ~5 minutes. A null/undefined value now stays fresh
// for at most this long and never rides the stale-while-revalidate window, so
// a page appears within ~30s of publishing while the quota cost stays
// negligible (misses are rare, and the in-flight dedupe still holds).
// Deliberately null/undefined ONLY: an empty ARRAY is usually a legitimate
// long-lived answer (no events this week, no photos yet) and keeps full TTL.
const MISS_TTL_MS = 30_000;
const isMiss = (v: unknown): boolean => v === null || v === undefined;

async function refresh<T>(
  key: string,
  horizonMs: number,
  fn: () => Promise<T>,
  writeKv: boolean,
): Promise<T> {
  const running = inflight.get(key);
  if (running) return running as Promise<T>;
  const p = fn()
    .then(async (v) => {
      const envl: Envelope = { v, at: Date.now() };
      store.set(key, envl);
      if (writeKv) {
        try {
          // KV expiry = the swr horizon: anything readable is servable.
          await env.CACHE?.put(`hub2:${key}`, JSON.stringify(envl), {
            expirationTtl: Math.max(60, Math.round(horizonMs / 1000)),
          });
        } catch {
          /* cache write failure is not an error */
        }
      }
      return v;
    })
    .finally(() => {
      inflight.delete(key);
    });
  inflight.set(key, p);
  return p;
}

// -----------------------------------------------------------------------------
// The wait budget (2026-09-09)
// -----------------------------------------------------------------------------
// The tiers above make a WARM read instant. They do nothing for a COLD one: the
// first request after a deploy or a quiet spell still ran the origin and waited
// for it. On the hub that wait sat in the page chrome (HubTopBar) and the home
// hero (HubGreeting), so it delayed the first byte of HTML, and a failure is
// never cached — a broken origin therefore cost its full timeout on EVERY
// request. Two slow origins in series (the 8s Apps Script calendar, the 8s gviz
// sheet) is a browser that spins for 16 seconds and then shows a page.
//
// `cachedWithin` puts a ceiling on that wait. The origin still runs, and the
// result still lands in the cache for the next visitor, but the caller gets
// `undefined` once the budget is spent. Use it wherever the value DECORATES a
// page (the topbar's "Next: ..." link, the greeting's weather chip): a missing
// decoration for one request is much better than a page nobody can open.
// Do NOT use it where the value IS the page — the calendar page waits for the
// calendar — or in a server island, which no longer blocks the HTML anyway.
//
// A budget large enough to cover a healthy origin (gviz answers in 0.5-1.5s)
// keeps the common cold read complete; only a genuinely slow or dead origin
// falls back to nothing.
export const FIRST_PAINT_WAIT_MS = 1200;

/**
 * Run `fn` at most once per fresh window. `ttlMs` = serve-as-fresh window;
 * `opts.swrMs` extends it as serve-stale-and-refresh-in-background.
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
  opts: { swrMs?: number; kv?: boolean } = {},
): Promise<T> {
  return read(key, ttlMs, fn, opts) as Promise<T>;
}

/**
 * `cached()` with a ceiling on how long a visitor waits for a COLD read.
 * Returns `undefined` when the budget runs out before the origin answers; the
 * fetch continues behind the response, so the next request finds it cached.
 * A warm (fresh or stale) value returns immediately, exactly as `cached` does.
 */
export async function cachedWithin<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
  opts: { swrMs?: number; kv?: boolean; maxWaitMs?: number } = {},
): Promise<T | undefined> {
  return read(key, ttlMs, fn, { maxWaitMs: FIRST_PAINT_WAIT_MS, ...opts });
}

/** The shared body of `cached` and `cachedWithin`. */
async function read<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
  opts: { swrMs?: number; kv?: boolean; maxWaitMs?: number },
): Promise<T | undefined> {
  const horizon = ttlMs + (opts.swrMs ?? 0);
  const useKv = opts.kv !== false; // default on; kv:false = L1-only, zero writes

  let hit = store.get(key);
  if (!hit && useKv) {
    // L2: KV survives isolate recycling (skipped for L1-only callers).
    try {
      const kvHit = await env.CACHE?.get(`hub2:${key}`, 'text');
      if (kvHit != null) {
        hit = JSON.parse(kvHit) as Envelope;
        store.set(key, hit);
      }
    } catch {
      /* KV unavailable → treat as a miss */
    }
  }

  if (hit) {
    const age = Date.now() - hit.at;
    const freshMs = isMiss(hit.v) ? Math.min(ttlMs, MISS_TTL_MS) : ttlMs;
    if (age < freshMs) return hit.v as T;
    if (!isMiss(hit.v) && age < horizon) {
      // Stale but servable: answer now, refresh behind the response.
      keepAlive(refresh(key, horizon, fn, useKv));
      return hit.v as T;
    }
  }

  const pending = refresh(key, horizon, fn, useKv);
  if (opts.maxWaitMs === undefined) return pending;
  return waitAtMost(pending, opts.maxWaitMs);
}

/**
 * Resolve with `pending`, or with `undefined` after `ms`. The loser is never
 * abandoned: a pending fetch that misses its budget rides `waitUntil` so it
 * still finishes and still fills the cache. A REJECTION is swallowed here for
 * the same reason — an unhandled rejection would otherwise escape the moment
 * the budget expired — and reads as "no value", which is what every caller of
 * a budgeted read already handles.
 */
function waitAtMost<T>(pending: Promise<T>, ms: number): Promise<T | undefined> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const guarded = pending.catch(() => undefined);
  const budget = new Promise<undefined>((resolve) => {
    timer = setTimeout(() => resolve(undefined), ms);
  });
  return Promise.race([guarded, budget]).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
    keepAlive(guarded);
  });
}
