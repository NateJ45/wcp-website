// =============================================================================
// Photo registry — build-time candid-photo pool for "picture areas" everywhere
// =============================================================================
// The boldness pass (2026-07) wants real classroom photography on far more
// pages than carry it today, but Sanity WRITES are quota-frozen. This registry
// routes around that: at BUILD time (CDN reads work) it pulls the photo pool
// the site already publishes — the A Day page's gallery sections, complete with
// the Board's own alt text — and hands components deterministic per-slot picks.
// Reusing only ALREADY-PUBLIC images keeps the photo-consent surface unchanged
// (nothing appears here that isn't already on the public site).
//
// Deterministic like generate-og's pickPhoto: the same slot name yields the
// same photos every build (no Math.random, so screenshot diffs and caches stay
// stable), and slots draw from disjoint windows of the shuffled pool so the
// same shot doesn't front two different pages.
// =============================================================================
import { cmsFetch } from '@/lib/cms';

export interface RegistryPhoto {
  /** Sanity image object — feed to imageUrl()/imageSrcSet(). */
  image: unknown;
  alt: string;
  caption?: string;
}

const ADAY_GALLERY_QUERY = `*[_type == "page" && slug == "a-day-at-wcp"][0]
  .sections[_type == "gallerySection"].photos[]{ image, "alt": alt, caption }`;

let poolPromise: Promise<RegistryPhoto[]> | null = null;

/** The full already-public photo pool (A Day gallery). [] on any failure. */
export function getPhotoPool(): Promise<RegistryPhoto[]> {
  poolPromise ??= cmsFetch<RegistryPhoto[]>(ADAY_GALLERY_QUERY, {}, []).then((photos) =>
    (photos ?? []).filter((p) => p && p.image && p.alt),
  );
  return poolPromise;
}

// Same tiny string hash generate-og.mjs uses — stable across builds.
function hash(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * `count` photos for a named slot (e.g. "tuition-strip"). Deterministic: the
 * slot name hashes to a starting offset and the pick walks forward with a
 * stride, so different slots land on different shots. Returns fewer (or none)
 * when the pool is small or unavailable — callers must render nothing then,
 * never a broken frame.
 */
export async function photosFor(slot: string, count: number): Promise<RegistryPhoto[]> {
  const pool = await getPhotoPool();
  if (pool.length === 0) return [];
  const start = hash(slot) % pool.length;
  // A stride coprime-ish to the pool size spreads picks; 7 works well for ~80.
  const stride = 7;
  const picks: RegistryPhoto[] = [];
  const seen = new Set<number>();
  for (let i = 0; picks.length < count && seen.size < pool.length; i++) {
    const idx = (start + i * stride) % pool.length;
    if (seen.has(idx)) continue;
    seen.add(idx);
    picks.push(pool[idx]);
  }
  return picks;
}
