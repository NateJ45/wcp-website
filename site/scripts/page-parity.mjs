#!/usr/bin/env node
// PORTED from the ncs-astro-sanity-starter parity harness (a PATTERN, not an
// identical-canonical file: every site accrues its own normalizer rules, so
// this copy is deliberately NOT sync-check marked. WCP-local rules: 5-7.)
//
// WCP GOTCHA (2026-08-27): compare ONLY against a plain `npm run build` dist.
// `npm test` rebuilds dist through Playwright's webServer, which injects fake
// tracker ids (PUBLIC_GA_ID etc.) so the consent card renders; that build adds
// the footer "Cookie choices" button and DIFFs every page. Not nondeterminism,
// an env divergence. Rebuild plain before comparing.
/**
 * page-parity.mjs - rendered-HTML parity harness. Back-ported from the
 * presacademy repo 2026-08-27 and adapted to this build.
 *
 * WHY THIS EXISTS
 * The whole public site is a Sanity page-builder. Refactors move markup between
 * layouts, section bridges and shared components all the time, and the promise
 * is always "same pixels". This script is the machine that holds us to it:
 * capture each page's rendered HTML BEFORE a refactor, then diff the render
 * after it. Zero diff, or the refactor is not done.
 *
 * NEITHER MODE RUNS THE BUILD. Both read an existing dist/client. The caller
 * builds. That keeps the script fast to re-run, keeps build noise out of the
 * diff output, and lets capture and compare read the exact same artifacts when
 * you are debugging the normalizer itself.
 *
 * WARNING: build with `npm run build`, never bare `astro build`. The postbuild
 * hook (Pagefind, OG cards, Instagram re-host) REWRITES dist/client HTML. A
 * baseline captured from a bare `astro build` diffs against every real build.
 *
 *   # from PowerShell, in site/
 *   npm run build                          # you build
 *   node scripts/page-parity.mjs capture   # snapshot every prerendered route
 *   ...refactor...
 *   npm run build                          # you build again
 *   node scripts/page-parity.mjs compare   # PASS/DIFF per page, exit 1 on any diff
 *   node scripts/page-parity.mjs compare tuition   # limit to one page
 *
 * If dist/client is missing, both modes fail with instructions. If its build is
 * older than an hour, they print a staleness warning and keep going (you may
 * genuinely be re-comparing an old build on purpose).
 *
 * ---------------------------------------------------------------------------
 * WHAT THE NORMALIZER STRIPS, AND WHY
 * ---------------------------------------------------------------------------
 * The goal is a snapshot that is stable across two identical rebuilds but still
 * catches real markup drift. Everything not listed here is left byte-faithful.
 *
 * Rules 1-4 come from the source repo. Rules 5-7 were added here on 2026-08-27
 * for this repo's postbuild steps (Pagefind, OG cards, Instagram re-host).
 *
 * Rule 7 is the one that carries the work today: a build-capture-rebuild-compare
 * run gives 27/27 PASS with it, and the Instagram grid is the only genuinely
 * live payload in the static output. Rules 5 and 6 do NOT fire on a healthy
 * build, because every re-hosted URL sits inside the grid rule 7 already
 * removed. They are kept as narrow guards for the PARTIAL-failure build:
 * rehost-instagram.mjs keeps the original signed CDN URL for any image it
 * cannot download, and a future IG surface outside the grid would carry the
 * same values. Both rules are no-ops on the current output.
 *
 *   1. Content hashes in /_astro/ asset references.
 *      /_astro/BaseLayout.BQUbAod2.css -> /_astro/BaseLayout.HASH.css
 *      Rollup/Vite rehash a bundle whenever its content changes, and the image
 *      pipeline appends a second per-variant hash. Neither is markup drift.
 *      Only the LAST dot-segment before the extension is treated as the hash,
 *      so names that contain dots of their own survive intact.
 *   2. Astro's scoped-style / build-id hash VALUES: data-astro-cid-xxxxxx,
 *      astro-cid-xxxxxx and data-astro-transition-scope. A scoped-style id is
 *      derived from the component's file path, so moving markup into a section
 *      component legitimately changes it while the render is identical. The
 *      attribute NAME is kept (its presence or absence is real drift).
 *   3. The render-order counter in an island's hydration prefix,
 *      prefix="r1" -> prefix="rN". Astro numbers each island by its position in
 *      the render order and uses the value only to namespace that island's
 *      hydration variables. The <astro-island> tag, its component-url and its
 *      serialized props are all still compared.
 *   4. Whitespace runs BETWEEN tags (>   < becomes ><), trailing whitespace on
 *      every line, and CRLF -> LF. Astro's indentation shifts when markup nests
 *      one level deeper. Whitespace INSIDE a text node is left alone, because
 *      that is content.
 *
 *   -- WCP-specific, added 2026-08-27 --
 *
 *   5. Re-hosted Instagram images: /ig/<hex>.<ext> -> /ig/IGHASH.<ext>.
 *      scripts/rehost-instagram.mjs (a postbuild step) downloads every baked
 *      cdninstagram.com image and names the local copy after a sha256 of the
 *      CDN URL PATH. Instagram rotates that signed path, so the same photo gets
 *      a new local filename on a later build with no site change at all.
 *   6. Live Instagram CDN URLs that the re-host step could not download. A
 *      failed download leaves the original signed cdninstagram.com URL in the
 *      HTML, and those URLs carry per-request signature query parameters that
 *      differ every build. Collapsed to CDNINSTAGRAM_URL.
 *   7. The CONTENT of the Instagram tile grid (the ONE element with class
 *      wcp-ig-grid, InstagramSection.astro) is excluded, replaced by a single
 *      IG-FEED-CONTENT marker. The feed is live third-party data read at build
 *      time: photos, captions (which become alt text and aria-labels) and
 *      permalinks all change when the school posts. This is the one
 *      irreducibly nondeterministic fragment on the site. The rule is
 *      deliberately narrow: it removes ONLY the inside of the tile grid, so the
 *      section wrapper, its heading, its CTA, the lightbox dialog and every
 *      other section on the page still compare byte-for-byte. A page with no
 *      Instagram section is untouched.
 *
 * Deliberately NOT stripped: data-sanity attributes (they appear only in the
 * SSR preview build, which this harness never reads), inline styles, class
 * lists, ids, aria-*, JSON-LD payloads, the Pagefind script tags, the generated
 * /og/*.jpg share-card references, and every scrap of text. Those are exactly
 * what a refactor must not disturb.
 *
 * Snapshots live in scripts/.parity/*.html and ARE COMMITTED. They are the
 * baseline; git history is the record of when one legitimately changed.
 * Re-capture only when you intend to move the baseline, and say so in the
 * commit message.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist', 'client');
const SNAP_DIR = join(ROOT, 'scripts', '.parity');
const ROUTES_FILE = join(ROOT, 'tests', 'routes.ts');
const STALE_MS = 60 * 60 * 1000; // 1 hour

// --------------------------------------------------------------------------
// The page list — tests/routes.ts is the single source of truth
// --------------------------------------------------------------------------

/**
 * Read the prerendered public routes from tests/routes.ts.
 *
 * We try a real ESM import first. Node strips TypeScript types natively from
 * 22.18 on, so on a current runtime this IS an import and can never drift.
 * Older supported runtimes (package.json allows Node 22.12) need a flag for
 * that, so we fall back to reading the array out of the file text. Either way
 * there is ONE list of routes in this repo.
 */
async function loadRoutes() {
  try {
    const mod = await import(new URL('../tests/routes.ts', import.meta.url).href);
    if (Array.isArray(mod.routes) && mod.routes.length) return mod.routes;
  } catch {
    // Type stripping unavailable on this Node — fall through to the text read.
  }
  const src = readFileSync(ROUTES_FILE, 'utf8');
  const block = src.match(/export const routes\s*=\s*\[([\s\S]*?)\]/);
  if (!block) fail(`Could not read the routes array out of ${ROUTES_FILE}.`);
  const routes = [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  if (!routes.length) fail('tests/routes.ts parsed but held no routes.');
  return routes;
}

/** '/' -> 'home' ; '/classes/twos' -> 'classes__twos' (a flat, safe filename). */
function pageName(route) {
  return route === '/' ? 'home' : route.replace(/^\/|\/$/g, '').replace(/\//g, '__');
}

/** '/' -> 'index.html' ; '/tuition' -> 'tuition/index.html' (directory format). */
function pageFile(route) {
  return route === '/' ? 'index.html' : `${route.replace(/^\/|\/$/g, '')}/index.html`;
}

// --------------------------------------------------------------------------
// Normalizer
// --------------------------------------------------------------------------

/** Rule 1: hashed asset references under /_astro/. */
function stripAssetHashes(html) {
  return html.replace(
    /\/_astro\/([A-Za-z0-9._@-]+)\.([A-Za-z0-9_-]{6,})\.([a-z0-9]+)\b/g,
    '/_astro/$1.HASH.$3',
  );
}

/** Rule 2: generated hashes inside astro's own attribute names/values. */
function stripAstroCids(html) {
  return html
    .replace(/data-astro-cid-[a-z0-9]+/g, 'data-astro-cid-CID')
    .replace(/astro-cid-[a-z0-9]{6,}/g, 'astro-cid-CID')
    .replace(/data-astro-transition-scope="[^"]*"/g, 'data-astro-transition-scope="SCOPE"');
}

/** Rule 3: the render-order counter in an island's hydration prefix. */
function stripIslandPrefixes(html) {
  return html.replace(/(<astro-island\b[^>]*?)\sprefix="r\d+"/g, '$1 prefix="rN"');
}

/** Rule 5: the sha256-of-CDN-path filename of a re-hosted Instagram image. */
function stripRehostedIgNames(html) {
  return html.replace(/\/ig\/[0-9a-f]{8,}\.([a-z0-9]+)\b/g, '/ig/IGHASH.$1');
}

/** Rule 6: a live, signed Instagram CDN URL the re-host step could not fetch. */
function stripIgCdnUrls(html) {
  return html.replace(/https?:\/\/[^"'\s<>]*cdninstagram\.com[^"'\s<>]*/g, 'CDNINSTAGRAM_URL');
}

/**
 * Rule 7: replace the CONTENT of the Instagram tile grid (class wcp-ig-grid).
 *
 * Narrow on purpose. It finds each opening tag that carries the marker class,
 * then walks the raw HTML counting that tag name until the matching close, so
 * only the live third-party payload is dropped. The open and close tags
 * themselves stay in the snapshot, which means losing or renaming the grid is
 * still a DIFF.
 */
function stripIgFeedContent(html) {
  const opens = [...html.matchAll(/<([a-zA-Z][\w-]*)\b[^>]*\bwcp-ig-grid\b[^>]*>/g)];
  if (opens.length === 0) return html;

  let out = '';
  let cursor = 0;
  for (const open of opens) {
    if (open.index < cursor) continue; // already inside a replaced region
    const tag = open[1];
    const contentStart = open.index + open[0].length;
    // Walk nested same-name tags to find this element's own closing tag.
    const rest = html.slice(contentStart);
    const marks = [...rest.matchAll(new RegExp(`<${tag}\\b|</${tag}\\s*>`, 'gi'))];
    let depth = 1;
    let closeStart = -1;
    for (const mark of marks) {
      if (mark[0][1] === '/') {
        depth--;
        if (depth === 0) {
          closeStart = contentStart + mark.index;
          break;
        }
      } else {
        depth++;
      }
    }
    if (closeStart === -1) continue; // unbalanced — leave this element alone
    out += html.slice(cursor, contentStart) + 'IG-FEED-CONTENT';
    cursor = closeStart;
  }
  return cursor === 0 ? html : out + html.slice(cursor);
}

/** Rule 4: whitespace that only reflects source indentation. */
function collapseWhitespace(html) {
  return html
    .replace(/\r\n/g, '\n')
    .replace(/>[ \t\r\n]+</g, '><')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

export function normalize(html) {
  let out = html;
  out = stripAssetHashes(out);
  out = stripAstroCids(out);
  out = stripIslandPrefixes(out);
  out = stripIgFeedContent(out);
  out = stripRehostedIgNames(out);
  out = stripIgCdnUrls(out);
  out = collapseWhitespace(out);
  return out;
}

// --------------------------------------------------------------------------
// dist/client access
// --------------------------------------------------------------------------

function requireDist() {
  if (!existsSync(DIST)) {
    fail(
      'dist/client not found.\n' +
        'This script never builds. Run the build first, then re-run:\n' +
        '  npm run build\n' +
        '  node scripts/page-parity.mjs ' +
        (process.argv[2] ?? 'capture'),
    );
  }
  const marker = join(DIST, 'index.html');
  if (!existsSync(marker)) {
    fail(
      'dist/client exists but has no index.html. The build did not finish. Re-run npm run build.',
    );
  }
  const age = Date.now() - statSync(marker).mtimeMs;
  if (age > STALE_MS) {
    const hours = (age / 3600000).toFixed(1);
    console.warn(
      `WARNING: dist/client was built ${hours}h ago. It may not reflect your working tree.`,
    );
  }
}

function readPage(file) {
  const path = join(DIST, file);
  if (!existsSync(path)) return null;
  return normalize(readFileSync(path, 'utf8'));
}

// --------------------------------------------------------------------------
// Diffing
// --------------------------------------------------------------------------

/**
 * Split normalized HTML into pseudo-lines at tag boundaries.
 * The snapshot on disk stays one long stream per source line (byte-faithful);
 * this split exists only so a diff points at a tag rather than at "line 12".
 */
function toDiffLines(text) {
  return text
    .split('\n')
    .flatMap((line) => line.split(/(?<=>)(?=<)/))
    .filter((l) => l !== '');
}

/** Minimal LCS-backed unified diff, trimmed to the changed region. */
function unifiedDiff(oldText, newText, maxLines) {
  const a = toDiffLines(oldText);
  const b = toDiffLines(newText);

  // Trim common prefix/suffix so the DP table only covers the changed middle.
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }
  const midA = a.slice(start, endA);
  const midB = b.slice(start, endB);

  const CAP = 3000;
  if (midA.length > CAP || midB.length > CAP) {
    // Too big to LCS cheaply. Report the raw changed window instead.
    const out = [
      `@@ changed region is large (${midA.length} old / ${midB.length} new lines), showing head @@`,
    ];
    for (const line of midA.slice(0, Math.floor(maxLines / 2))) out.push('- ' + line);
    for (const line of midB.slice(0, Math.floor(maxLines / 2))) out.push('+ ' + line);
    return out;
  }

  // Classic LCS length table.
  const n = midA.length;
  const m = midB.length;
  const lcs = new Int32Array((n + 1) * (m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i * (m + 1) + j] =
        midA[i] === midB[j]
          ? lcs[(i + 1) * (m + 1) + (j + 1)] + 1
          : Math.max(lcs[(i + 1) * (m + 1) + j], lcs[i * (m + 1) + (j + 1)]);
    }
  }

  const out = [`@@ first change at tag #${start + 1} @@`];
  let i = 0;
  let j = 0;
  while (i < n && j < m && out.length <= maxLines) {
    if (midA[i] === midB[j]) {
      out.push('  ' + midA[i]);
      i++;
      j++;
    } else if (lcs[(i + 1) * (m + 1) + j] >= lcs[i * (m + 1) + (j + 1)]) {
      out.push('- ' + midA[i]);
      i++;
    } else {
      out.push('+ ' + midB[j]);
      j++;
    }
  }
  while (i < n && out.length <= maxLines) out.push('- ' + midA[i++]);
  while (j < m && out.length <= maxLines) out.push('+ ' + midB[j++]);
  if (i < n || j < m) out.push(`... ${n - i + (m - j)} more changed lines suppressed ...`);
  return out;
}

/** Shorten a diff line so one runaway tag cannot flood the terminal. */
function clip(line, width = 200) {
  return line.length > width ? line.slice(0, width) + ' ...' : line;
}

// --------------------------------------------------------------------------
// Modes
// --------------------------------------------------------------------------

function capture(pages, only) {
  requireDist();
  mkdirSync(SNAP_DIR, { recursive: true });
  let written = 0;
  let missing = 0;
  for (const [name, file] of pages) {
    if (only && only !== name) continue;
    const html = readPage(file);
    if (html === null) {
      console.log(`  MISS  ${name.padEnd(24)} dist/client/${file} not found`);
      missing++;
      continue;
    }
    writeFileSync(join(SNAP_DIR, `${name}.html`), html + '\n', 'utf8');
    const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
    console.log(`  SAVE  ${name.padEnd(24)} ${kb.padStart(7)} KB  -> scripts/.parity/${name}.html`);
    written++;
  }
  console.log(
    `\n${written} snapshot(s) written${missing ? `, ${missing} page(s) missing from dist` : ''}.`,
  );
  console.log('Commit scripts/.parity/*.html: they are the parity baseline.');
  if (missing) process.exit(1);
}

function compare(pages, only) {
  requireDist();
  if (!existsSync(SNAP_DIR) || readdirSync(SNAP_DIR).length === 0) {
    fail('No snapshots in scripts/.parity/. Run: node scripts/page-parity.mjs capture');
  }
  let pass = 0;
  let diff = 0;
  const diffs = [];
  for (const [name, file] of pages) {
    if (only && only !== name) continue;
    const snapPath = join(SNAP_DIR, `${name}.html`);
    if (!existsSync(snapPath)) {
      console.log(`  SKIP  ${name.padEnd(24)} no baseline snapshot`);
      continue;
    }
    // Snapshots are committed, so a git checkout may have given them CRLF.
    // Normalize the same way readPage does before comparing.
    const baseline = readFileSync(snapPath, 'utf8').replace(/\r\n/g, '\n').replace(/\n$/, '');
    const current = readPage(file);
    if (current === null) {
      console.log(`  DIFF  ${name.padEnd(24)} dist/client/${file} not found (page gone?)`);
      diff++;
      continue;
    }
    if (current === baseline) {
      console.log(`  PASS  ${name}`);
      pass++;
    } else {
      console.log(`  DIFF  ${name}`);
      diff++;
      diffs.push([name, unifiedDiff(baseline, current, 40)]);
    }
  }

  for (const [name, lines] of diffs) {
    console.log(`\n--- baseline/${name}\n+++ current/${name}`);
    for (const line of lines) console.log(clip(line));
  }

  console.log(`\n${pass}/${pass + diff} PASS`);
  if (diff) {
    console.log('Parity broken. Either the change altered rendered markup, or the');
    console.log('normalizer needs a new rule for a genuinely build-varying value.');
    process.exit(1);
  }
}

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

const routes = await loadRoutes();
const PAGES = routes.map((route) => [pageName(route), pageFile(route)]);

const mode = process.argv[2];
const only = process.argv[3];
if (only && !PAGES.some(([n]) => n === only)) {
  fail(`Unknown page "${only}". Known: ${PAGES.map(([n]) => n).join(', ')}`);
}
if (mode === 'capture') capture(PAGES, only);
else if (mode === 'compare') compare(PAGES, only);
else {
  console.log('Usage (build first, this script never builds):');
  console.log('  npm run build');
  console.log('  node scripts/page-parity.mjs capture [page]');
  console.log('  node scripts/page-parity.mjs compare [page]');
  console.log(`\nPages: ${PAGES.map(([n]) => n).join(', ')}`);
  process.exit(mode ? 1 : 0);
}
