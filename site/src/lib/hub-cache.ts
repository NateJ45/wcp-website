// =============================================================================
// hub-cache — two-tier TTL cache for the hub's slow external fetches
// =============================================================================
// WHY: hub pages render per request, and the Google round-trips they lean on
// are slow — the Apps Script calendar feed runs 1.5-3s per hit and a gviz
// sheet read ~0.5-1.5s. Neither source changes minute-to-minute, so results
// are cached for TTL ms in two tiers:
//
//   L1 — module-scope Map. Free and instant, but lives only as long as the
//        Worker isolate (recycled on deploys and idle spells).
//   L2 — the CACHE KV namespace (wrangler.jsonc). Durable across isolates,
//        so the FIRST visitor after a deploy or a quiet morning gets a ~5ms
//        KV read instead of the 3-5s Google fan-out. Local dev/preview gets
//        a miniflare-simulated KV automatically; if the binding is absent
//        the cache silently degrades to L1-only.
//
// Flow: L1 hit → return. Else L2 hit → warm L1, return. Else run fn() and
// populate both. In-flight dedupe means concurrent renders of the same page
// share ONE fetch instead of stampeding Google. Failures are never cached.
//
// KV budget note: writes happen only on a full miss (both tiers), so the
// write rate is bounded by real visits per TTL window across a handful of
// keys — nowhere near the free tier's daily write cap for this site.
// =============================================================================
import { env } from 'cloudflare:workers';

interface Slot {
  value: unknown;
  expires: number;
}

const store = new Map<string, Slot>();
const inflight = new Map<string, Promise<unknown>>();

/** Run `fn` at most once per `ttlMs` (per edge, via KV), keyed by `key`. */
export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;

  const running = inflight.get(key);
  if (running) return running as Promise<T>;

  const p = (async () => {
    // L2: KV survives isolate recycling. Its own expiry (expirationTtl) makes
    // entries vanish server-side, so anything readable is fresh by definition.
    try {
      const kvHit = await env.CACHE?.get(`hub:${key}`, 'text');
      if (kvHit != null) {
        const value = JSON.parse(kvHit) as T;
        store.set(key, { value, expires: Date.now() + ttlMs });
        return value;
      }
    } catch {
      /* KV unavailable → behave as a miss */
    }

    const value = await fn();
    store.set(key, { value, expires: Date.now() + ttlMs });
    try {
      // KV requires expirationTtl >= 60s; our TTLs are minutes, but clamp
      // anyway so a future short-TTL caller can't make every put throw.
      await env.CACHE?.put(`hub:${key}`, JSON.stringify(value), {
        expirationTtl: Math.max(60, Math.round(ttlMs / 1000)),
      });
    } catch {
      /* cache write failure is not an error — next isolate just refetches */
    }
    return value;
  })().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, p);
  return p;
}
