// =============================================================================
// generate-og.mjs — branded Open Graph share cards, generated after each build
// =============================================================================
// Runs from the `postbuild` npm hook (like Pagefind). It scans every built
// HTML page in dist/client for an og:image that points at /og/<name>.png and
// renders exactly those cards (plus the sitewide default) with satori + resvg:
// navy card, sun glow, white logo, the page's headline in Captain Comic, and
// a cream footer strip. Because the set of cards is derived from what the
// pages actually reference, `npm run check:links` proves none are missing.
//
// This is a build SCRIPT (not an Astro endpoint) on purpose: resvg ships a
// native .node binary the Cloudflare adapter's bundler chokes on — out here
// plain Node loads it and nothing OG-related ever nears the Worker bundle.
// =============================================================================
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import wawoff2 from 'wawoff2';

const SITE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(SITE_DIR, 'dist', 'client');

// Brand constants (mirror globals.css tokens; they never change).
const NAVY = '#01457e';
const CREAM = '#fff4e0';
const AMBER = '#ffa334';
const SKY = '#40aaed';
const ORANGE = '#ff8c00';
const GREEN = '#22c55e';
const SITE_NAME = 'West Chester Preschool';
const TAGLINE = 'A parent-run cooperative preschool in West Chester, Ohio.';

// ── Collect the cards the built pages actually reference ────────────────────
async function* htmlFiles(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* htmlFiles(p);
    else if (e.name.endsWith('.html')) yield p;
  }
}

const cards = new Map(); // og-path (e.g. "home") -> title
cards.set('default', SITE_NAME);
for await (const file of htmlFiles(DIST)) {
  const html = await readFile(file, 'utf8');
  const img = html.match(/property="og:image" content="[^"]*\/og\/([^"]+)\.png"/)?.[1];
  if (!img || cards.has(img)) continue;
  const raw = html.match(/property="og:title" content="([^"]*)"/)?.[1] ?? SITE_NAME;
  // The card wants the bare headline; og:title carries the "— site" suffix.
  const title = raw
    .replace(/\s*[—|–-]\s*West Chester Preschool\s*$/, '')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, '’')
    .replace(/&quot;/g, '"');
  cards.set(img, title || SITE_NAME);
}

// ── Assets: Captain Comic (woff2 → ttf for satori) + the white logo ──────────
const [regular, bold] = await Promise.all(
  ['captain-comic-regular.woff2', 'captain-comic-bold.woff2'].map(async (f) => {
    const ttf = await wawoff2.decompress(await readFile(join(SITE_DIR, 'public', 'fonts', f)));
    return ttf.buffer.slice(ttf.byteOffset, ttf.byteOffset + ttf.byteLength);
  }),
);
const logoPng = await readFile(join(SITE_DIR, 'src', 'assets', 'brand', 'wcp-logo-white.png'));
const logo = `data:image/png;base64,${logoPng.toString('base64')}`;

// ── The card (satori consumes React-ish {type, props} objects) ───────────────
const el = (type, style, children) => ({ type, props: { style, children } });

function card(title) {
  const size = title.length > 60 ? 54 : title.length > 34 ? 66 : 82;
  return el(
    'div',
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: NAVY,
      fontFamily: 'Captain Comic',
      position: 'relative',
    },
    [
      // Soft glow off the top-right corner. Solid lighter-navy tints on
      // purpose: satori flattens opacity-over-navy into muddy olive.
      el('div', {
        position: 'absolute',
        top: -220,
        right: -220,
        width: 560,
        height: 560,
        borderRadius: 280,
        backgroundColor: '#0d5591',
      }),
      el('div', {
        position: 'absolute',
        top: -140,
        right: -140,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: '#1866a6',
      }),
      el('div', {
        position: 'absolute',
        top: -60,
        right: -60,
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: AMBER,
      }),
      el(
        'div',
        {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '52px 72px 36px',
        },
        [
          {
            type: 'img',
            props: {
              src: logo,
              height: 92,
              style: { objectFit: 'contain', alignSelf: 'flex-start' },
            },
          },
          el(
            'div',
            {
              color: 'white',
              fontSize: size,
              fontWeight: 700,
              lineHeight: 1.15,
              maxWidth: 1000,
              display: 'flex',
            },
            title,
          ),
          el(
            'div',
            { display: 'flex', gap: 14 },
            [ORANGE, SKY, GREEN, AMBER].map((c) =>
              el('div', { width: 22, height: 22, borderRadius: 11, backgroundColor: c }),
            ),
          ),
        ],
      ),
      el(
        'div',
        {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: CREAM,
          color: NAVY,
          padding: '24px 72px',
          fontSize: 20,
        },
        [
          el('div', { display: 'flex' }, TAGLINE.replace(/\.$/, '')),
          el('div', { display: 'flex', fontWeight: 700 }, 'westchesterpreschool.org'),
        ],
      ),
    ],
  );
}

// ── Render ────────────────────────────────────────────────────────────────────
let n = 0;
for (const [name, title] of cards) {
  const svg = await satori(card(title), {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Captain Comic', data: regular, weight: 400, style: 'normal' },
      { name: 'Captain Comic', data: bold, weight: 700, style: 'normal' },
    ],
  });
  const png = new Resvg(svg).render().asPng();
  const out = join(DIST, 'og', `${name}.png`);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, png);
  n++;
}
console.log(`[og] ${n} share cards → dist/client/og/`);
