// =============================================================================
// generate-og.mjs — photo share cards, generated after each build
// =============================================================================
// Runs from the `postbuild` npm hook (like Pagefind). Each card is a real
// classroom photo (drawn from the public A Day at WCP gallery — already
// public, so no new exposure) under a navy scrim, with the white logo top-left
// and the page title + site name bottom-left. The NCS-portfolio recipe, WCP
// flavor. Which photo a page gets is a deterministic hash of its card name,
// so a page keeps its photo across rebuilds (social caches stay coherent).
//
// Pipeline per card: Sanity CDN crops the photo to 1200x630 server-side →
// satori+resvg render the overlay (scrim gradient + logo + Captain Comic
// text) as a transparent PNG → sharp composites and writes a compact JPEG.
// It scans dist/client HTML for og:image references matching /og/<name>.jpg
// and renders exactly those (plus the sitewide default), so check:links
// proves none are missing. A build SCRIPT, not an Astro endpoint, on purpose:
// resvg's native .node binary can't pass through the Cloudflare bundler.
// =============================================================================
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import wawoff2 from 'wawoff2';
import sharp from 'sharp';

const SITE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(SITE_DIR, 'dist', 'client');

const NAVY = '#01457e';
const AMBER = '#ffa334';
const SITE_NAME = 'westchesterpreschool.org';

// ── Collect cards + the photo pool from the built HTML ──────────────────────
async function* htmlFiles(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* htmlFiles(p);
    else if (e.name.endsWith('.html')) yield p;
  }
}

const cards = new Map(); // og-path (e.g. "home") -> title
cards.set('default', 'West Chester Preschool');
for await (const file of htmlFiles(DIST)) {
  const html = await readFile(file, 'utf8');
  const img = html.match(/property="og:image" content="[^"]*\/og\/([^"]+)\.jpg"/)?.[1];
  if (!img || cards.has(img)) continue;
  const raw = html.match(/property="og:title" content="([^"]*)"/)?.[1] ?? 'West Chester Preschool';
  const title = raw
    .replace(/\s*[—|–-]\s*West Chester Preschool\s*$/, '')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, '’')
    .replace(/&quot;/g, '"');
  cards.set(img, title || 'West Chester Preschool');
}

// The photo pool: every Sanity-hosted gallery photo on the public A Day page
// (the ~80-shot classroom gallery). Base URLs only — the CDN crops on demand.
const adayHtml = await readFile(join(DIST, 'a-day-at-wcp', 'index.html'), 'utf8');
const pool = [
  ...new Set(
    [...adayHtml.matchAll(/https:\/\/cdn\.sanity\.io\/images\/[^"'\s?]+/g)].map((m) => m[0]),
  ),
];
if (pool.length === 0) throw new Error('[og] no gallery photos found on /a-day-at-wcp');

// Deterministic photo pick — same card name, same photo, every build.
function pickPhoto(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return pool[h % pool.length];
}

const photoCache = new Map();
// Transient CDN blips (a dropped TLS socket mid-transfer) have failed real CI
// builds, and the weekly freshness cron builds unattended, so one flaky photo
// download must not kill a deploy: retry twice with a short backoff before
// giving up for real.
async function fetchWithRetry(url, tries = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      if (!r.ok) throw new Error(`photo ${r.status}`);
      return Buffer.from(await r.arrayBuffer());
    } catch (err) {
      if (attempt >= tries) throw err;
      console.warn(`[og] retry ${attempt}/${tries - 1} after: ${err.message ?? err}`);
      await new Promise((res) => setTimeout(res, 1000 * attempt));
    }
  }
}
async function fetchPhoto(baseUrl) {
  if (!photoCache.has(baseUrl)) {
    const url = `${baseUrl}?w=1200&h=630&fit=crop&auto=format&q=80`;
    photoCache.set(baseUrl, fetchWithRetry(url));
  }
  return photoCache.get(baseUrl);
}

// ── Overlay assets: Captain Comic (woff2 → ttf) + the white logo ─────────────
const [regular, bold] = await Promise.all(
  ['captain-comic-regular.woff2', 'captain-comic-bold.woff2'].map(async (f) => {
    const ttf = await wawoff2.decompress(await readFile(join(SITE_DIR, 'public', 'fonts', f)));
    return ttf.buffer.slice(ttf.byteOffset, ttf.byteOffset + ttf.byteLength);
  }),
);
const logoPng = await readFile(join(SITE_DIR, 'src', 'assets', 'brand', 'wcp-logo-white.png'));
const logo = `data:image/png;base64,${logoPng.toString('base64')}`;

// ── The overlay (transparent; satori consumes React-ish objects) ─────────────
const el = (type, style, children) => ({ type, props: { style, children } });

function overlay(title) {
  const size = title.length > 60 ? 52 : title.length > 34 ? 64 : 78;
  return el(
    'div',
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      fontFamily: 'Captain Comic',
      padding: '48px 64px 52px',
      // A gentle full-card tint + a strong bottom scrim keep white text
      // readable over any photo without flattening the picture.
      backgroundImage:
        'linear-gradient(to bottom, rgba(1,38,66,0.38) 0%, rgba(1,38,66,0.18) 40%, rgba(1,26,46,0.82) 100%)',
    },
    [
      {
        type: 'img',
        props: { src: logo, height: 88, style: { objectFit: 'contain', alignSelf: 'flex-start' } },
      },
      el('div', { display: 'flex', flexDirection: 'column', maxWidth: 1020 }, [
        el(
          'div',
          {
            color: 'white',
            fontSize: size,
            fontWeight: 700,
            lineHeight: 1.12,
            display: 'flex',
            textShadow: '0 2px 12px rgba(0,0,0,0.45)',
          },
          title,
        ),
        el(
          'div',
          { marginTop: 14, color: AMBER, fontSize: 27, fontWeight: 700, display: 'flex' },
          SITE_NAME,
        ),
      ]),
    ],
  );
}

// ── Render ────────────────────────────────────────────────────────────────────
let n = 0;
for (const [name, title] of cards) {
  const svg = await satori(overlay(title), {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Captain Comic', data: regular, weight: 400, style: 'normal' },
      { name: 'Captain Comic', data: bold, weight: 700, style: 'normal' },
    ],
  });
  const overlayPng = new Resvg(svg).render().asPng();
  const photo = await fetchPhoto(pickPhoto(name));
  const jpeg = await sharp(photo)
    .resize(1200, 630, { fit: 'cover' }) // belt-and-suspenders; CDN already crops
    .composite([{ input: Buffer.from(overlayPng) }])
    .flatten({ background: NAVY })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  const out = join(DIST, 'og', `${name}.jpg`);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, jpeg);
  n++;
}
console.log(`[og] ${n} photo share cards → dist/client/og/ (pool: ${pool.length} photos)`);
