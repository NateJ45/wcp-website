// =============================================================================
// studio-thumbs.mjs — the picture for each section in the Studio "+ Add" menu
// =============================================================================
// The page builder's insert menu has a GRID view (see sectionInsertMenu() in
// src/sanity/schemaTypes/sections/index.ts). The grid asks for one image per
// section type at /studio-thumbs/<sectionType>.jpg. This script makes those
// images from the REAL built site, so a volunteer picks a section by look.
//
// How it works:
//   1. It reads the built pages in dist/client. Each public section carries a
//      `data-stype="<sectionType>"` wrapper (the Act II grammar layer), so the
//      built HTML alone says which page shows which section type. No Sanity
//      read and no token are needed.
//   2. It serves dist/client from a small static server in this process. There
//      is no child process, so nothing can stay alive and lock dist/ later.
//   3. Playwright opens each page, settles it (fonts, no animation, reveals
//      shown — the same steps as tests/helpers.ts), measures the section box,
//      and captures it. sharp scales the shot to 600px wide JPEG.
//   4. A section type with no instance on the live site gets a plain brand
//      placeholder, so the grid never shows a broken image.
//
// Run it after you add a section type, or when the site design changes:
//   npm run build && npm run studio-thumbs
// =============================================================================
import { createServer } from 'node:http';
import { readdir, readFile, writeFile, mkdir, rm, stat } from 'node:fs/promises';
import { join, dirname, relative, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const SITE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(SITE_DIR, 'dist', 'client');
const SCHEMA_DIR = join(SITE_DIR, 'src', 'sanity', 'schemaTypes', 'sections');
const OUT_DIR = join(SITE_DIR, 'public', 'studio-thumbs');

const PORT = 4399;
const VIEWPORT = { width: 1280, height: 900 };
const THUMB_WIDTH = 600;
const JPEG_QUALITY = 80;
// A section band can be very tall (a long FAQ, a photo wall). The top of the
// band is the part that identifies it, so the capture stops after this height.
const MAX_CAPTURE_HEIGHT = 760;

const NAVY = '#01457e';
const CREAM = '#fff4e0';

// ── The section types, and their volunteer-facing titles ────────────────────
// The schema is TypeScript, so this script reads the `name` / `title` pairs out
// of the source instead of importing it. Only types whose name ends in
// "Section" are body sections; the hero is a page field, not a menu item.
async function sectionTypes() {
  const types = [];
  for (const file of await readdir(SCHEMA_DIR)) {
    if (!file.endsWith('.ts')) continue;
    const src = await readFile(join(SCHEMA_DIR, file), 'utf8');
    const re = /name:\s*'([A-Za-z]+Section)',\s*\n\s*title:\s*'([^']+)'/g;
    let m;
    while ((m = re.exec(src))) types.push({ name: m[1], title: m[2] });
  }
  return types.sort((a, b) => a.name.localeCompare(b.name));
}

// ── Which built page shows each section type ────────────────────────────────
async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(path);
    else if (entry.name === 'index.html') yield path;
  }
}

async function findSectionPages() {
  const pages = new Map(); // sectionType -> url path
  const files = [];
  for await (const file of htmlFiles(DIST)) files.push(file);
  files.sort(); // deterministic: the same page wins on every run
  for (const file of files) {
    const html = await readFile(file, 'utf8');
    const dir = relative(DIST, dirname(file)).split(sep).filter(Boolean).join('/');
    const url = dir ? `/${dir}/` : '/';
    for (const m of html.matchAll(/data-stype="([A-Za-z]+)"/g)) {
      if (!pages.has(m[1])) pages.set(m[1], url);
    }
  }
  return pages;
}

// ── A small static server for dist/client ───────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ico': 'image/x-icon',
};

function startServer() {
  const server = createServer(async (req, res) => {
    try {
      const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      let file = join(DIST, path);
      if (path.endsWith('/')) file = join(file, 'index.html');
      else {
        const info = await stat(file).catch(() => null);
        if (info?.isDirectory()) file = join(file, 'index.html');
      }
      const body = await readFile(file);
      res.writeHead(200, {
        'content-type': MIME[extname(file)] ?? 'application/octet-stream',
        'cache-control': 'no-store',
      });
      res.end(body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('not found');
    }
  });
  return new Promise((resolve) => server.listen(PORT, '127.0.0.1', () => resolve(server)));
}

// ── Page preparation (mirrors settle() in tests/helpers.ts) ─────────────────
async function settle(page) {
  await page.evaluate(() =>
    Promise.race([
      document.fonts.ready.then(() => true),
      new Promise((resolve) => setTimeout(() => resolve(true), 5000)),
    ]),
  );
  await page.addStyleTag({
    content: '*,*::before,*::after{transition:none!important;animation:none!important}',
  });
  await page.evaluate(() =>
    document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible')),
  );
}

/** The page box of a section wrapper. The wrapper is `display: contents`, so it
 *  has no box of its own — the box is the union of its child elements. */
function sectionBox(page, type) {
  return page.evaluate((sectionType) => {
    const wrapper = document.querySelector(`[data-stype="${sectionType}"]`);
    if (!wrapper) return null;
    const kids = [...wrapper.children];
    if (kids.length === 0) return null;
    const rects = kids.map((el) => el.getBoundingClientRect());
    const top = Math.min(...rects.map((r) => r.top)) + window.scrollY;
    const bottom = Math.max(...rects.map((r) => r.bottom)) + window.scrollY;
    const left = Math.min(...rects.map((r) => r.left)) + window.scrollX;
    const right = Math.max(...rects.map((r) => r.right)) + window.scrollX;
    return { x: left, y: top, width: right - left, height: bottom - top };
  }, type);
}

async function toThumb(buffer, file) {
  const out = await sharp(buffer)
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
  await writeFile(file, out);
  return out.length;
}

/** The fallback picture for a section type the live site does not use yet. */
async function placeholder(page, type, file) {
  const safe = (s) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(`<!doctype html><html><body style="margin:0">
    <div style="width:1200px;height:630px;background:${CREAM};display:flex;
                align-items:center;justify-content:center;text-align:center;
                font-family:system-ui,sans-serif;box-sizing:border-box;padding:64px">
      <div>
        <div style="font-size:64px;font-weight:700;color:${NAVY};line-height:1.15">
          ${safe(type.title)}
        </div>
        <div style="margin-top:24px;font-size:30px;color:${NAVY};opacity:.7">
          No example on the site yet
        </div>
      </div>
    </div>
  </body></html>`);
  const shot = await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 630 } });
  await page.setViewportSize(VIEWPORT);
  return toThumb(shot, file);
}

// ── Main ────────────────────────────────────────────────────────────────────
const distExists = await stat(join(DIST, 'index.html')).catch(() => null);
if (!distExists) {
  console.error('dist/client is missing. Run `npm run build` first.');
  process.exit(1);
}

const types = await sectionTypes();
const pages = await findSectionPages();
await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });

const server = await startServer();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });

const captured = [];
const placeheld = [];
let bytes = 0;

try {
  for (const type of types) {
    const file = join(OUT_DIR, `${type.name}.jpg`);
    const path = pages.get(type.name);
    let box = null;
    if (path) {
      await page.goto(`http://127.0.0.1:${PORT}${path}`, { waitUntil: 'load' });
      await settle(page);
      box = await sectionBox(page, type.name);
    }
    if (box && box.width > 0 && box.height > 0) {
      const shot = await page.screenshot({
        fullPage: true,
        clip: { ...box, height: Math.min(box.height, MAX_CAPTURE_HEIGHT) },
      });
      bytes += await toThumb(shot, file);
      captured.push(type.name);
      console.log(`  ${type.name} <- ${path}`);
    } else {
      bytes += await placeholder(page, type, file);
      placeheld.push(type.name);
      console.log(`  ${type.name} <- placeholder`);
    }
  }
} finally {
  await browser.close();
  server.close();
}

console.log(
  `\nstudio-thumbs: ${captured.length} from the site, ${placeheld.length} placeholders, ` +
    `${(bytes / 1024).toFixed(0)} KB total -> public/studio-thumbs/`,
);
if (placeheld.length > 0) console.log(`placeholders: ${placeheld.join(', ')}`);
