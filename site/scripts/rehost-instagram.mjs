// =============================================================================
// rehost-instagram.mjs — re-host the baked Instagram tiles, after each build
// =============================================================================
// Runs from the `postbuild` npm hook, after Pagefind and the OG cards. The
// "Life inside WCP" grid (InstagramSection.astro) bakes <img> tags whose src
// is a SIGNED scontent-*.cdninstagram.com URL fetched at build time — and
// Instagram's signatures expire within days, so a static page that outlives
// its build shows a band of broken tiles. This script makes the build
// self-contained: it scans dist/client for those URLs, downloads each unique
// image into dist/client/ig/, and rewrites the HTML to reference the local
// copy. Visitors never touch Instagram's CDN, and the tiles live exactly as
// long as the deploy does (the weekly scheduled rebuild in deploy.yml keeps
// them at most 7 days behind the real feed).
//
// Failure posture: a tile is never worth a broken deploy. Any per-image
// problem (timeout, 403 on an already-expired signature, disk error) keeps
// that img's ORIGINAL CDN URL in place and moves on — the band degrades one
// tile at a time instead of failing the build. check:links is unaffected
// either way: it skips external URLs entirely, and the local /ig/ files it
// can reach are the ones this script just wrote.
//
// Filenames hash the URL *path* only: the host shard (scontent-iad3-1, ...)
// and the signature query params rotate between feed fetches, but the path IS
// the media file — so the same photo keeps the same /ig/<hash> name across
// rebuilds and browser caches stay warm.
// =============================================================================
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(SITE_DIR, 'dist', 'client');
const IG_DIR = join(DIST, 'ig');

// A full signed CDN URL as it appears in the HTML. Attribute values
// entity-encode `&` as `&amp;`, so we keep the RAW slice for the rewrite and
// decode a copy for the fetch. Stopping at quotes/whitespace/commas splits
// srcset candidates naturally (IG URLs themselves never contain commas), and
// requiring a real path segment skips origin-only preconnect-style hrefs.
const IG_URL = /https:\/\/[^"'\s,]+\.cdninstagram\.com\/[^"'\s,]+/g;
const decode = (s) => s.replace(/&amp;/g, '&');

// A <link rel="preconnect"|"dns-prefetch"> for the IG CDN — removed only from
// pages left with zero cdninstagram references, where the early connection
// would be pure waste. (None exist in BaseLayout today; this is insurance.)
const IG_HINT = /[ \t]*<link[^>]+rel="(?:preconnect|dns-prefetch)"[^>]*cdninstagram[^>]*>\n?/gi;

async function* htmlFiles(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* htmlFiles(p);
    else if (e.name.endsWith('.html')) yield p;
  }
}

// ── Collect every page that bakes an IG CDN URL ──────────────────────────────
const pages = []; // { file, html, urls: Set<raw-as-it-appears-in-html> }
for await (const file of htmlFiles(DIST)) {
  const html = await readFile(file, 'utf8');
  const urls = new Set(html.match(IG_URL) ?? []);
  if (urls.size > 0) pages.push({ file, html, urls });
}
if (pages.length === 0) {
  // No token at build time (feed fell back to the curated Sanity album) or no
  // Instagram section on any page — nothing to do, and that is fine.
  console.log('[ig] no Instagram CDN URLs in the build — nothing to re-host');
  process.exit(0);
}

// ── Dedupe: raw HTML slice → local filename, grouped by target file ─────────
// Two raw slices can name the same media file (same path, different signature
// or host shard), so downloads group by the hashed filename — one fetch per
// actual image, however many pages or srcset entries reference it.
const byName = new Map(); // name -> { fetchUrl, raws: Set<raw> }
for (const page of pages) {
  for (const raw of page.urls) {
    try {
      const fetchUrl = decode(raw);
      const path = new URL(fetchUrl).pathname;
      const hash = createHash('sha256').update(path).digest('hex').slice(0, 16);
      const ext = path.match(/\.(jpe?g|png|webp|gif|avif|mp4)$/i)?.[1]?.toLowerCase() ?? 'jpg';
      const name = `${hash}.${ext}`;
      if (!byName.has(name)) byName.set(name, { fetchUrl, raws: new Set() });
      byName.get(name).raws.add(raw);
    } catch {
      // Unparseable URL — leave it alone; the rewrite below only touches
      // slices that made it into the map.
    }
  }
}

// ── Download (10s cap each; a failure keeps the original URL in place) ──────
await mkdir(IG_DIR, { recursive: true });
const rehosted = new Map(); // raw -> "/ig/<name>" (successes only)
let downloaded = 0;
let failed = 0;
await Promise.all(
  [...byName].map(async ([name, { fetchUrl, raws }]) => {
    try {
      const res = await fetch(fetchUrl, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length === 0) throw new Error('empty body');
      await writeFile(join(IG_DIR, name), buf);
      downloaded++;
      for (const raw of raws) rehosted.set(raw, `/ig/${name}`);
    } catch (err) {
      failed++;
      console.warn(`[ig] keeping original URL (${err?.message ?? err}): ${fetchUrl.slice(0, 96)}`);
    }
  }),
);

// ── Rewrite the HTML in place ────────────────────────────────────────────────
let rewritten = 0;
let pagesTouched = 0;
for (const page of pages) {
  let html = page.html;
  let n = 0;
  for (const raw of page.urls) {
    const local = rehosted.get(raw);
    if (!local) continue; // download failed — original URL stays
    n += html.split(raw).length - 1;
    html = html.replaceAll(raw, local);
  }
  if (n === 0) continue;
  // Fully clean page → drop any IG CDN preconnect/dns-prefetch hints. (The
  // hint tag itself contains "cdninstagram", so test the stripped copy.)
  const stripped = html.replace(IG_HINT, '');
  if (!stripped.includes('cdninstagram')) html = stripped;
  await writeFile(page.file, html);
  rewritten += n;
  pagesTouched++;
}

console.log(
  `[ig] ${downloaded} images re-hosted → dist/client/ig/ ` +
    `(${rewritten} refs rewritten across ${pagesTouched} pages, ${failed} failed → original URLs kept)`,
);
