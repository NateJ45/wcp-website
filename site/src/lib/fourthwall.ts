// =============================================================================
// fourthwall.ts — live merch store data for the Family Hub
// =============================================================================
// Two reads, both server-only (the credentials are Worker secrets — see the
// SECURITY note) and both cached through hub-cache (SWR), so a visitor never
// waits on Fourthwall and the store changes ride a warm cache:
//
//   getStoreProducts() — Storefront API (public, read-only token): the live
//     catalog for the hub store card (name, price, image, product link). Auto-
//     updates as the Board adds/changes products, so no more hand-curation.
//
//   getMerchStats()    — Open API (super-admin basic auth): AGGREGATE order
//     totals only (gross sales + donations + order count) for a "supporting our
//     co-op" line. NEVER returns customer data — the API includes emails, so we
//     read only sums/counts and drop everything else. Fourthwall's API does not
//     expose WCP's profit, so this is gross sales, not a "raised" figure.
//
// SECURITY: FOURTHWALL_API_USER / _PASSWORD are shop super-admin credentials —
// they live only as Worker secrets (.dev.vars locally, `wrangler secret put`
// in prod), never client-side, never committed (this repo is public). The
// storefront token is read-only but is also kept server-side. Any failure or
// missing secret degrades to empty/null — the store card falls back to its
// Board-curated tiles and hides the stat.
// =============================================================================
import { env } from 'cloudflare:workers';
import { cached } from '@/lib/hub-cache';

const STOREFRONT = 'https://storefront-api.fourthwall.com/v1';
const OPEN_API = 'https://api.fourthwall.com/open-api/v1.0';
const STORE_URL = 'https://store.westchesterpreschool.org';

const decodeEntities = (s: string): string =>
  String(s || '')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const money = (value: number, currency: string): string =>
  `${currency === 'USD' ? '$' : ''}${Number(value).toFixed(2)}`;

export interface StoreProduct {
  slug: string;
  title: string;
  price: string;
  url: string;
  image: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toProduct(p: any): StoreProduct | null {
  const variants: any[] = Array.isArray(p?.variants) ? p.variants : []; // eslint-disable-line @typescript-eslint/no-explicit-any
  const prices = variants
    .map((v) => v?.unitPrice?.value)
    .filter((x): x is number => typeof x === 'number');
  const currency = variants[0]?.unitPrice?.currency ?? 'USD';
  const image = (Array.isArray(p?.images) ? p.images : [])[0] ?? {};
  const slug = typeof p?.slug === 'string' ? p.slug : '';
  const img = image.url ?? image.transformedUrl ?? '';
  if (!slug || !img) return null;
  return {
    slug,
    title: decodeEntities(p?.name ?? 'Product'),
    price: prices.length ? money(Math.min(...prices), currency) : '',
    url: `${STORE_URL}/products/${slug}`,
    image: img,
  };
}

/** The live catalog for the store card. Empty on any failure/missing token. */
export async function getStoreProducts(collection = 'all', max = 8): Promise<StoreProduct[]> {
  const token = env.FOURTHWALL_STOREFRONT_TOKEN;
  if (!token) return [];
  try {
    return await cached(
      `fw:products:${collection}`,
      86_400_000, // 24h fresh — the store changes every few months; keeps KV writes low
      async () => {
        const res = await fetch(
          `${STOREFRONT}/collections/${encodeURIComponent(collection)}/products?storefront_token=${token}`,
          { signal: AbortSignal.timeout(8000) },
        );
        if (!res.ok) throw new Error(`fw storefront ${res.status}`);
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: any[] = Array.isArray(data?.results) ? data.results : [];
        return items
          .map(toProduct)
          .filter((p): p is StoreProduct => p !== null)
          .slice(0, max);
      },
      { swrMs: 259_200_000 }, // serve stale up to 3 days while refreshing
    );
  } catch {
    return [];
  }
}

export interface StoreCollection {
  slug: string;
  title: string;
}

/** The store's collections (categories), for the hub store card's tab row.
 *  Empty on any failure/missing token — the card then shows a single rail. */
export async function getStoreCollections(max = 4): Promise<StoreCollection[]> {
  const token = env.FOURTHWALL_STOREFRONT_TOKEN;
  if (!token) return [];
  try {
    return await cached(
      'fw:collections',
      86_400_000, // 24h fresh — the store changes every few months; keeps KV writes low
      async () => {
        const res = await fetch(`${STOREFRONT}/collections?storefront_token=${token}`, {
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) throw new Error(`fw collections ${res.status}`);
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: any[] = Array.isArray(data?.results) ? data.results : [];
        return items
          .map((c) => ({ slug: String(c?.slug ?? ''), title: decodeEntities(c?.name ?? '') }))
          .filter((c) => c.slug && c.title)
          .slice(0, max);
      },
      { swrMs: 259_200_000 }, // serve stale up to 3 days while refreshing
    );
  } catch {
    return [];
  }
}

export interface MerchStats {
  grossSales: number;
  donations: number;
  orderCount: number;
  currency: string;
}

/** Aggregate store totals for the co-op support line. Null if unavailable.
 *  Sums only — no customer data is read out of the order objects. */
export async function getMerchStats(): Promise<MerchStats | null> {
  const user = env.FOURTHWALL_API_USER;
  const pw = env.FOURTHWALL_API_PASSWORD;
  if (!user || !pw) return null;
  try {
    return await cached(
      'fw:merch-stats',
      86_400_000, // 24h fresh — aggregate totals, keeps KV writes low
      async () => {
        const auth = `Basic ${btoa(`${user}:${pw}`)}`;
        let page = 0;
        let totalPages = 1;
        let grossSales = 0;
        let donations = 0;
        let orderCount = 0;
        let currency = 'USD';
        const MAX_PAGES = 25; // safety cap (25 * 100 = 2500 orders)
        while (page < totalPages && page < MAX_PAGES) {
          const res = await fetch(`${OPEN_API}/order?page=${page}&size=100`, {
            headers: { Authorization: auth },
            signal: AbortSignal.timeout(8000),
          });
          if (!res.ok) throw new Error(`fw open-api ${res.status}`);
          const d = await res.json();
          totalPages = typeof d?.totalPages === 'number' ? d.totalPages : 1;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const o of Array.isArray(d?.results) ? (d.results as any[]) : []) {
            if (o?.status === 'CANCELLED') continue;
            const a = o?.amounts ?? {};
            if (typeof a.total?.value === 'number') {
              grossSales += a.total.value;
              currency = a.total.currency ?? currency;
            }
            if (typeof a.donation?.value === 'number') donations += a.donation.value;
            orderCount += 1;
          }
          page += 1;
        }
        return {
          grossSales: Math.round(grossSales),
          donations: Math.round(donations),
          orderCount,
          currency,
        };
      },
      { swrMs: 259_200_000 }, // 3-day stale window
    );
  } catch {
    return null;
  }
}
