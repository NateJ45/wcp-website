// =============================================================================
// bake-splodges.mjs — render the hub-canvas finger-paint splodges to WebP
// =============================================================================
// The hub canvas wants soft brand-color paint blobs that read like finger-paint
// marks a kid pressed onto paper: mottled, broken-edged, textured — NOT smooth
// glow gradients (which is what the pure-CSS radial-gradient version looked
// like). That texture needs an SVG turbulence+displacement filter, but a LIVE
// filter re-rasterizes on scroll and stutters on phones, so we BAKE each tile to
// a WebP once (rendered in real Chromium via Playwright so the raster matches).
// The page then blits a plain bitmap — smooth on mobile.
//
// Two large coprime tiles (1600 + 1180) so the pattern's repeat period is long.
// Run: `node scripts/bake-splodges.mjs` -> writes public/hub/splodge-*.webp
// Re-run whenever the marks/opacities change; keep in sync with globals.css.
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

// Rough, mottled paint edge: warp the shape (displacement), then knock holes in
// it with a second "tooth" turbulence composited as alpha, so the fill breaks up
// like paint dragged by a finger instead of a clean gradient.
const FILTER = `<filter id='p' x='-25%' y='-25%' width='150%' height='150%' color-interpolation-filters='sRGB'>
<feTurbulence type='fractalNoise' baseFrequency='0.012 0.017' numOctaves='2' seed='4' result='warp'/>
<feDisplacementMap in='SourceGraphic' in2='warp' scale='34' result='rough'/>
<feTurbulence type='fractalNoise' baseFrequency='0.09' numOctaves='3' seed='9' result='tooth'/>
<feColorMatrix in='tooth' type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.85 0.15' result='toothA'/>
<feComposite in='rough' in2='toothA' operator='in'/>
</filter>`;

function svg(size, marks, o) {
  const op = (a) => (a * o).toFixed(3);
  const body = marks
    .map(
      (m) =>
        `<ellipse cx='${m.cx}' cy='${m.cy}' rx='${m.rx}' ry='${m.ry}' fill='${m.c}' fill-opacity='${op(m.a)}'/>`,
    )
    .join('');
  return `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><defs>${FILTER}</defs><g filter='url(#p)'>${body}</g></svg>`;
}

// Finger-paint blobs (no line strokes), scattered so the tile has no empty band.
const A = (navy) => [
  { cx: 330, cy: 300, rx: 150, ry: 122, c: ORANGE, a: 0.34 },
  { cx: 1210, cy: 540, rx: 130, ry: 162, c: SKY, a: 0.3 },
  { cx: 650, cy: 1010, rx: 168, ry: 132, c: AMBER, a: 0.32 },
  { cx: 1330, cy: 1220, rx: 122, ry: 106, c: navy, a: 0.26 },
  { cx: 210, cy: 1300, rx: 128, ry: 150, c: SKY, a: 0.26 },
];
const B = (navy) => [
  { cx: 270, cy: 350, rx: 142, ry: 120, c: navy, a: 0.28 },
  { cx: 910, cy: 300, rx: 130, ry: 160, c: AMBER, a: 0.3 },
  { cx: 610, cy: 900, rx: 160, ry: 130, c: ORANGE, a: 0.33 },
  { cx: 1010, cy: 1010, rx: 118, ry: 100, c: SKY, a: 0.26 },
];

// Opacity multiplier (light 0.72 / dark 0.55; dark swaps navy -> sky).
const tiles = [
  { name: 'splodge-a', size: 1600, svg: svg(1600, A(NAVY), 0.72) },
  { name: 'splodge-b', size: 1180, svg: svg(1180, B(NAVY), 0.72) },
  { name: 'splodge-a-dark', size: 1600, svg: svg(1600, A(SKY), 0.55) },
  { name: 'splodge-b-dark', size: 1180, svg: svg(1180, B(SKY), 0.55) },
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
  const png = await el.screenshot({ omitBackground: true });
  const info = await sharp(png)
    .webp({ quality: 80, alphaQuality: 90, effort: 6 })
    .toFile(resolve(OUT, `${t.name}.webp`));
  console.log(`${t.name}.webp  ${info.width}x${info.height}  ${Math.round(info.size / 1024)}KB`);
}
await browser.close();
console.log('done ->', OUT);
