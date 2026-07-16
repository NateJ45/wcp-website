// =============================================================================
// bake-crayon.mjs — render the hub-canvas crayon tiles to static WebP
// =============================================================================
// The crayon/paint background is authored as an SVG with a live turbulence +
// displacement filter (the hand-drawn texture). As a CSS background that filter
// is fine on desktop, but on mobile the browser re-rasterizes it while scrolling
// and it gets choppy. This script BAKES each tile to a WebP once — in real
// Chromium (via Playwright), so the raster matches the live look exactly — so
// the page ships a plain bitmap the GPU can cheaply blit while scrolling.
//
// Run: `node scripts/bake-crayon.mjs`  → writes public/hub/crayon-*.webp
// Re-run whenever the marks/opacities change. Keep in sync with the tile look in
// src/styles/globals.css.
// =============================================================================
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const NAVY = '#01457e',
  ORANGE = '#ff8c00',
  SKY = '#40aaed',
  AMBER = '#ffa334';

const FILTER = `<filter id='c' x='-14%' y='-14%' width='128%' height='128%' color-interpolation-filters='sRGB'>
<feTurbulence type='fractalNoise' baseFrequency='0.011 0.018' numOctaves='2' seed='7' result='warp'/>
<feDisplacementMap in='SourceGraphic' in2='warp' scale='16' result='rough'/>
<feTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='2' seed='11' result='tooth'/>
<feColorMatrix in='tooth' type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.6 0.34' result='toothA'/>
<feComposite in='rough' in2='toothA' operator='in'/>
</filter>`;

function svg(size, marks, o) {
  const op = (a) => (a * o).toFixed(3);
  const body = marks
    .map((m) => {
      if (m.d) {
        const p1 = `<path d='${m.d}' stroke='${m.c}' stroke-width='${m.w}' stroke-opacity='${op(m.a)}'/>`;
        const p2 = `<path d='${m.d}' stroke='${m.c}' stroke-width='${m.w - 2}' stroke-opacity='${op(m.a * 0.5)}' transform='translate(6 5)'/>`;
        return p1 + p2;
      }
      return `<ellipse cx='${m.cx}' cy='${m.cy}' rx='${m.rx}' ry='${m.ry}' fill='${m.c}' fill-opacity='${op(m.a)}'/>`;
    })
    .join('');
  return `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' fill='none'><defs>${FILTER}</defs><g filter='url(#c)' stroke-linecap='round' stroke-linejoin='round'>${body}</g></svg>`;
}

const A = (navy) => [
  {
    d: 'M-40 360 C 260 210 520 210 780 350 C 1000 470 1090 340 1230 400',
    c: ORANGE,
    w: 18,
    a: 0.2,
  },
  { d: 'M-40 950 C 260 860 520 1040 800 920 C 1000 835 1120 980 1240 900', c: SKY, w: 17, a: 0.18 },
  { cx: 250, cy: 710, rx: 66, ry: 48, c: AMBER, a: 0.16 },
  { cx: 980, cy: 210, rx: 52, ry: 42, c: navy, a: 0.15 },
];
const B = (navy) => [
  { d: 'M-40 250 C 200 150 440 350 680 260 C 840 205 920 300 990 380', c: navy, w: 16, a: 0.17 },
  { d: 'M-40 660 C 220 560 460 740 720 610 C 860 545 940 640 1010 690', c: AMBER, w: 16, a: 0.18 },
  { cx: 650, cy: 660, rx: 60, ry: 46, c: ORANGE, a: 0.16 },
];

// Opacities match globals.css (light 0.72 / dark 0.55, dark swaps navy -> sky).
const tiles = [
  { name: 'crayon-a', size: 1200, svg: svg(1200, A(NAVY), 0.72) },
  { name: 'crayon-b', size: 820, svg: svg(820, B(NAVY), 0.72) },
  { name: 'crayon-a-dark', size: 1200, svg: svg(1200, A(SKY), 0.55) },
  { name: 'crayon-b-dark', size: 820, svg: svg(820, B(SKY), 0.55) },
];

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'hub');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
for (const t of tiles) {
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(
    `<!doctype html><html><head><style>html,body{margin:0;padding:0;background:transparent}svg{display:block}</style></head><body>${t.svg}</body></html>`,
  );
  const el = await page.$('svg');
  const png = await el.screenshot({ omitBackground: true }); // transparent bg preserved
  const info = await sharp(png)
    .webp({ quality: 80, alphaQuality: 90, effort: 6 })
    .toFile(resolve(OUT, `${t.name}.webp`));
  console.log(`${t.name}.webp  ${info.width}x${info.height}  ${Math.round(info.size / 1024)}KB`);
}
await browser.close();
console.log('done ->', OUT);
