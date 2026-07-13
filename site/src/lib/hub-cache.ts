// =============================================================================
// hub-cache — tiny in-isolate TTL cache for the hub's slow external fetches
// =============================================================================
// WHY: hub pages render per request, and the two Google round-trips they lean
// on are slow — the Apps Script calendar feed runs 1.5-3s per hit and a gviz
// sheet read ~0.5-1.5s. That made every hub navigation feel like 3-6s. Neither
// source changes minute-to-minute, so the first visitor pays once and everyone
// (including the same visitor's next navigation) reuses the result for TTL ms.
//
// This is a MODULE-SCOPE Map: it lives exactly as long as the Worker isolate.
// Cloudflare keeps warm isolates around between requests, so in practice the
// hit rate is high; when the isolate recycles, the cache simply starts empty
// (correct, just cold). No KV/Cache API on purpose — the Cache API is a no-op
// on *.workers.dev, and KV would add a read to every request to save nothing.
//
// In-flight dedupe: concurrent renders of the same page (or several widgets
// asking for the same sheet) share ONE fetch instead of stampeding Google.
// Failures are never cached — a fn that throws leaves the slot empty so the
// next request retries.
// =============================================================================

interface Slot {
  value: unknown;
  expires: number;
}

const store = new Map<string, Slot>();
const inflight = new Map<string, Promise<unknown>>();

/** Run `fn` at most once per `ttlMs` per isolate, keyed by `key`. */
export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;

  const running = inflight.get(key);
  if (running) return running as Promise<T>;

  const p = fn()
    .then((value) => {
      store.set(key, { value, expires: Date.now() + ttlMs });
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });
  inflight.set(key, p);
  return p;
}
