// =============================================================================
// generate-supplies.mjs — branded School Supply List (print PDF + social slides)
// =============================================================================
// Rebuilds the yearly supply-list assets in public/supplies/ from the LISTS
// data below — the SOURCE OF TRUTH. Each fall: update YEAR + the items, then
// `node scripts/generate-supplies.mjs` (or `npm run gen:supplies`).
//
// Two renditions from one content set:
//   supply-list.pdf     — a Letter one-pager for printing/photocopying and the
//                         "Supply list (PDF)" pills on the hub class pages.
//                         The filename is deliberately YEAR-LESS so those links
//                         never rot; the year label lives inside the document.
//   social/NN-*.png     — a 1080x1350 (4:5) carousel set for Facebook and
//                         Instagram: cover, one slide per class, wish list.
//
// The original was a plain Google Doc. This re-typesets the same content in the
// WCP design system: Captain Comic headings, Quicksand body, the sun/cloud
// emblem, and each class in ITS OWN brand color (Twos amber, Threes green,
// Pre-K AM orange, Pre-K PM sky — the class-colors.ts map). Self-contained by
// construction: fonts + emblem are inlined as data URIs, so Chromium renders
// the exact brand type with no network. Mirrors generate-curriculum.mjs.
// =============================================================================
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(__dirname, '..');
// `--dist` (postbuild): write into the built site so a Studio edit plus the
// publish-webhook deploy regenerates the assets. Plain runs keep public/.
const DIST = process.argv.includes('--dist');
const OUT_DIR = resolve(SITE, DIST ? 'dist/client/supplies' : 'public/supplies');
const SOCIAL_DIR = resolve(OUT_DIR, 'social');

// ---- Brand assets, inlined -------------------------------------------------
const dataUri = (path, mime) =>
  `data:${mime};base64,${readFileSync(resolve(SITE, path)).toString('base64')}`;

const FONT = {
  comic: dataUri('public/fonts/captain-comic-regular.woff2', 'font/woff2'),
  comicBold: dataUri('public/fonts/captain-comic-bold.woff2', 'font/woff2'),
  quicksand: dataUri(
    'node_modules/@fontsource-variable/quicksand/files/quicksand-latin-wght-normal.woff2',
    'font/woff2',
  ),
  // The site's handwritten-annotation script (margin notes on the public site).
  vibes: dataUri(
    'node_modules/@fontsource/great-vibes/files/great-vibes-latin-400-normal.woff2',
    'font/woff2',
  ),
};
const EMBLEM = dataUri('src/assets/brand/wcp-emblem-sm.webp', 'image/webp');

// ---- Brand palette (class-colors.ts + globals.css; print-safe ink tier) -----
const NAVY = '#01457e';
const CREAM = '#fff4e0';
const THEMES = {
  amber: { bright: '#ffa334', ink: '#9e5c0a', tint: '#fff4e0', ring: '#f7d9a8' },
  green: { bright: '#22c55e', ink: '#0e7b2e', tint: '#e7f6ec', ring: '#bfe6cb' },
  orange: { bright: '#ff8c00', ink: '#a85300', tint: '#fff1e0', ring: '#f8d3ad' },
  sky: { bright: '#40aaed', ink: '#166fa8', tint: '#e8f3fc', ring: '#bddef4' },
  // The fifth `class.color` value, so a class the Board tints navy still gets
  // a card instead of failing on a missing theme.
  navy: { bright: '#01457e', ink: '#01457e', tint: '#e6eef6', ring: '#b3c9dd' },
};

// ---------------------------------------------------------------------------
// CONTENT — the 2026-27 list, transcribed from the teachers' Google Doc.
// `optional` renders as a marked note under the class's items.
// ---------------------------------------------------------------------------
export let YEAR = '2026–27';
export let BACKPACK_NOTE =
  'Please provide your child with a backpack large enough to fit a regular size folder or an art project.';
export let DUE_NOTE = 'All items are due at orientation.';
export let WATER_NOTE =
  'Optional: one disposable bottle of water to keep in your child’s cubby, in case a refillable water bottle is forgotten at snack time.';

export let LISTS = [
  {
    slug: 'twos',
    name: 'Twos',
    color: 'amber',
    icon: '🧸',
    items: [
      '1 pack of baby wipes',
      '1 paper towel roll',
      '1 take-home folder',
      '1 glue stick',
      '1 box of tissues',
      '1 container of Lysol wipes',
      '1 set of summer backup clothing',
      '1 set of winter backup clothing',
    ],
    optional: WATER_NOTE,
  },
  {
    slug: 'threes',
    name: 'Threes',
    color: 'green',
    icon: '🖍️',
    items: [
      '1 pack of baby wipes',
      '1 box of tissues',
      '1 paper towel roll',
      '1 take-home folder',
      '1 glue stick',
      '1 box of gallon-size Ziploc bags',
      '1 set of summer backup clothing',
      '1 set of winter backup clothing',
    ],
    optional: WATER_NOTE,
  },
  {
    slug: 'pre-k-am',
    name: 'Pre-K AM',
    color: 'orange',
    icon: '☀️',
    items: [
      '1&quot; three-ring binder',
      '1 pack of baby wipes',
      '1 paper towel roll',
      '1 box of tissues',
      '1 pack of Lysol wipes',
      '2 glue sticks (Elmer’s disappearing purple preferred)',
      '1 box of quart-size Ziploc bags',
    ],
  },
  {
    slug: 'pre-k-pm',
    name: 'Pre-K PM',
    color: 'sky',
    icon: '⭐',
    items: [
      '1&quot; three-ring binder',
      '1 pack of baby wipes',
      '1 paper towel roll',
      '1 box of tissues',
      '2 glue sticks (Elmer’s disappearing purple preferred)',
      '1 box of gallon-size Ziploc bags',
    ],
  },
];

export let WISH_LIST = {
  heading: 'Classroom wish list',
  note: 'Optional extras for every class. Pre-opened items from your craft closet are welcome!',
  items: [
    'Shaving cream',
    'Pipe cleaners',
    'Colorful tissue paper',
    'Washable markers',
    'Large beads',
    'Sequins',
    'Elmer’s glue',
    'Stickers',
    'Stamp markers',
    'Colored pencils',
    'Envelopes',
    'Feathers',
    'Pom-poms',
    'Colorful sand',
    'Buttons',
    'Yarn',
    'Clay',
    'Construction paper',
    'Any fun art or craft supplies!',
  ],
};

// ---- Shared HTML bits ------------------------------------------------------
// Items are authored trusted above (some carry entities like &quot;), so they
// pass through as-is; only structural helpers escape.
const FONT_FACES = `
  @font-face{font-family:'Captain Comic';src:url('${FONT.comic}') format('woff2');font-weight:400;font-display:block}
  @font-face{font-family:'Captain Comic';src:url('${FONT.comicBold}') format('woff2');font-weight:700;font-display:block}
  @font-face{font-family:'Quicksand';src:url('${FONT.quicksand}') format('woff2');font-weight:400 700;font-display:block}
  @font-face{font-family:'Great Vibes';src:url('${FONT.vibes}') format('woff2');font-weight:400;font-display:block}`;

// ---------------------------------------------------------------------------
// Rendition 1 — the Letter one-pager (print / hub pill / photocopier-safe)
// ---------------------------------------------------------------------------
export function pdfHtml() {
  const classCard = (c) => {
    const t = THEMES[c.color];
    return `
      <section class="card" style="--bright:${t.bright};--ink:${t.ink};--tint:${t.tint};--ring:${t.ring}">
        <div class="card-head">
          <span class="chip">${c.icon}</span>
          <span class="badge">${c.name}</span>
        </div>
        <ul class="list">${c.items.map((i) => `<li>${i}</li>`).join('')}</ul>
        ${c.optional ? `<p class="opt">${c.optional}</p>` : ''}
      </section>`;
  };
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
    ${FONT_FACES}
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Quicksand',system-ui,sans-serif;color:#1a1a1a;font-size:10.6px;line-height:1.45;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    h1,h2,.wordmark,.badge{font-family:'Captain Comic',system-ui,sans-serif}

    .masthead{display:flex;align-items:center;gap:14px;padding-bottom:11px;border-bottom:3px solid #ffa334;margin-bottom:12px}
    .emblem{width:60px;height:60px;flex:0 0 auto;border-radius:50%}
    .brand{flex:1;min-width:0}
    .wordmark{color:${NAVY};font-size:19px;font-weight:700;line-height:1}
    .brand .sub{color:#5f6573;font-size:9.5px;font-weight:600;margin-top:3px}
    .eyebrow{display:inline-block;background:${NAVY};color:#fff;font-weight:700;font-size:8.5px;letter-spacing:1.3px;text-transform:uppercase;padding:3px 9px;border-radius:20px}

    .titlerow{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:10px}
    h1{color:${NAVY};font-size:27px;line-height:1.02}
    .kicker{color:#a85300;font-weight:700;font-size:10.5px;text-transform:uppercase;letter-spacing:.6px;margin-bottom:3px}

    /* The doc's highlighter-yellow line, promoted to a proper brand callout. */
    .backpack{display:flex;gap:9px;align-items:center;background:${CREAM};border:1.5px solid #f7d9a8;border-radius:11px;padding:9px 12px;margin-bottom:11px}
    .backpack .b{font-size:17px;line-height:1}
    .backpack p{font-size:10.6px;font-weight:600;color:#2b2f38;line-height:1.4}
    .backpack strong{color:#a85300}

    .grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
    .card{background:#fff;border:1px solid #e7e3da;border-radius:11px;padding:10px 12px 11px;box-shadow:0 1px 0 rgba(1,69,126,.04);border-top:3px solid var(--bright)}
    .card-head{display:flex;align-items:center;gap:8px;margin-bottom:7px}
    .chip{width:23px;height:23px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;font-size:13px;background:var(--tint);border-radius:7px}
    .badge{display:inline-block;background:var(--ink);color:#fff;font-size:11.5px;font-weight:700;letter-spacing:.4px;padding:3px 11px;border-radius:20px}
    .card-head::after{content:"";flex:1;height:2px;border-radius:2px;background:linear-gradient(90deg,var(--ring),transparent)}
    .list{list-style:none}
    .list li{position:relative;padding-left:12px;margin-bottom:3.5px}
    .list li::before{content:"";position:absolute;left:0;top:6px;width:5px;height:5px;border-radius:50%;background:var(--bright)}
    .opt{margin-top:6px;padding-top:6px;border-top:1px dashed var(--ring);color:#3a3f49;font-size:9.3px;font-style:italic;line-height:1.4}

    .wish{margin-top:10px;background:${CREAM};border:1px solid #f7d9a8;border-radius:13px;padding:11px 13px 12px}
    .wish-head{display:flex;align-items:center;gap:8px;margin-bottom:4px}
    .wish-head h2{color:${NAVY};font-size:13.5px;font-weight:700}
    .wish-head .star{font-size:14px}
    .wish .note{color:#3a3f49;font-size:9.3px;font-style:italic;margin-bottom:7px}
    .tags{display:flex;flex-wrap:wrap;gap:4px}
    .tag{background:#fff;border:1px solid #f7d9a8;color:#2b2f38;font-size:9px;font-weight:600;padding:2.5px 8px;border-radius:20px;line-height:1.3}
  </style></head><body><div class="page">
    <header class="masthead">
      <img class="emblem" src="${EMBLEM}" alt="">
      <div class="brand">
        <div class="wordmark">West Chester Preschool</div>
        <div class="sub">A parent cooperative preschool in West Chester, Ohio</div>
      </div>
      <span class="eyebrow">Supply List</span>
    </header>
    <div class="titlerow">
      <div>
        <div class="kicker">${YEAR} school year</div>
        <h1>School Supply List</h1>
      </div>
    </div>
    <div class="backpack">
      <span class="b">🎒</span>
      <p>${BACKPACK_NOTE} <strong>${DUE_NOTE}</strong></p>
    </div>
    <div class="grid">${LISTS.map(classCard).join('')}</div>
    <div class="wish">
      <div class="wish-head"><span class="star">🎨</span><h2>${WISH_LIST.heading}</h2></div>
      <p class="note">${WISH_LIST.note}</p>
      <div class="tags">${WISH_LIST.items.map((i) => `<span class="tag">${i}</span>`).join('')}</div>
    </div>
  </div></body></html>`;
}

// ---------------------------------------------------------------------------
// Rendition 2 — the 1080x1350 social carousel (Facebook / Instagram)
// ---------------------------------------------------------------------------
// Shared chrome for every slide: brand type, the paper-tape detail (the
// Construction Paper system's taped-chip made image-sized), a top brand row
// and a bottom wordmark bar.
const SOCIAL_BASE = `
  ${FONT_FACES}
  *{box-sizing:border-box;margin:0;padding:0}
  body{width:1080px;height:1350px;overflow:hidden;font-family:'Quicksand',system-ui,sans-serif;color:#1a1a1a;-webkit-font-smoothing:antialiased}
  h1,h2,.wordmark,.badge{font-family:'Captain Comic',system-ui,sans-serif}
  .frame{position:relative;width:1080px;height:1350px;display:flex;flex-direction:column;padding:64px 72px 56px}
  .topline{display:flex;align-items:center;gap:18px;margin-bottom:36px}
  .topline img{width:84px;height:84px;border-radius:50%}
  .topline .t{font-weight:700;font-size:26px;color:${NAVY};letter-spacing:.4px}
  .topline .t small{display:block;font-size:20px;font-weight:600;color:#5f6573;letter-spacing:.2px;margin-top:4px}
  .bottombar{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:16px;font-weight:700;font-size:23px;color:${NAVY}}
  .bottombar .muted{font-weight:600;color:#5f6573;font-size:21px}
  .tape{position:absolute;top:-20px;left:50%;width:190px;height:44px;background:rgba(250,238,205,.88);border:1px solid rgba(200,170,110,.35);transform:translateX(-50%) rotate(-2deg);box-shadow:0 1px 3px rgba(0,0,0,.08)}
  .annot{font-family:'Great Vibes',cursive;color:#166fa8}`;

function socialCoverHtml() {
  const chips = LISTS.map((c) => {
    const t = THEMES[c.color];
    return `<span class="cchip" style="background:${t.ink}">${c.icon}&nbsp; ${c.name}</span>`;
  }).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
    ${SOCIAL_BASE}
    .frame{background:linear-gradient(170deg,#fffdf8 8%,${CREAM} 92%);align-items:center;text-align:center;padding:56px 72px 52px}
    .emblem{width:220px;height:220px;border-radius:50%;margin:26px 0 28px}
    .kicker{display:inline-block;background:${NAVY};color:#fff;font-weight:700;font-size:26px;letter-spacing:3.5px;text-transform:uppercase;padding:12px 30px;border-radius:40px}
    h1{color:${NAVY};font-size:100px;line-height:1.04;margin:24px 0 14px;font-weight:700}
    .year{color:#a85300;font-weight:700;font-size:33px;text-transform:uppercase;letter-spacing:2px}
    .backpack{position:relative;background:#fff;border:2px solid #f7d9a8;border-radius:24px;padding:40px 44px 34px;margin:52px 0 0;max-width:830px;box-shadow:0 6px 24px rgba(1,69,126,.07);transform:rotate(-.7deg)}
    .backpack .b{font-size:46px;line-height:1;display:block;margin-bottom:12px}
    .backpack p{font-size:29px;font-weight:600;color:#2b2f38;line-height:1.45}
    .backpack strong{color:#a85300}
    .when{display:inline-flex;align-items:center;gap:12px;background:${NAVY};color:#fff;font-weight:700;font-size:29px;padding:14px 34px;border-radius:44px;margin-top:22px}
    .annot{font-size:42px;transform:rotate(-3deg);margin-top:22px}
    .chips{display:flex;flex-wrap:wrap;gap:13px;justify-content:center;margin-top:auto;padding-top:24px}
    .cchip{color:#fff;font-weight:700;font-size:24px;padding:11px 24px;border-radius:40px}
    .swipe{font-weight:700;font-size:27px;color:${NAVY};margin-top:22px}
  </style></head><body><div class="frame">
    <span class="kicker">West Chester Preschool</span>
    <img class="emblem" src="${EMBLEM}" alt="">
    <h1>School Supply<br>List</h1>
    <div class="year">${YEAR} school year</div>
    <div class="backpack">
      <span class="tape"></span>
      <span class="b">🎒</span>
      <p>${BACKPACK_NOTE} <strong>${DUE_NOTE}</strong></p>
      <div class="when">📅&nbsp; Orientation is September 3rd</div>
    </div>
    <div class="annot">see you at orientation!</div>
    <div class="chips">${chips}</div>
    <div class="swipe">Swipe for your class&rsquo;s list &nbsp;&rarr;</div>
  </div></body></html>`;
}

function socialClassHtml(c) {
  const t = THEMES[c.color];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
    ${SOCIAL_BASE}
    .frame{background:linear-gradient(170deg,#fff 0%,${t.tint} 100%)}
    .badge{display:inline-block;background:${t.ink};color:#fff;font-size:40px;font-weight:700;letter-spacing:1px;padding:14px 40px;border-radius:60px}
    h1{color:${NAVY};font-size:96px;line-height:1.02;margin:22px 0 8px}
    .card{position:relative;background:#fff;border:2px solid ${t.ring};border-top:10px solid ${t.bright};border-radius:26px;padding:56px 58px 48px;margin-top:58px;box-shadow:0 8px 28px rgba(1,69,126,.08);transform:rotate(-.5deg)}
    .list{list-style:none}
    .list li{position:relative;padding-left:44px;margin-bottom:22px;font-size:33px;font-weight:600;color:#2b2f38;line-height:1.3}
    .list li::before{content:"";position:absolute;left:6px;top:14px;width:16px;height:16px;border-radius:50%;background:${t.bright}}
    .opt{margin-top:26px;padding-top:26px;border-top:2px dashed ${t.ring};color:#3a3f49;font-size:25px;font-style:italic;line-height:1.4}
    .due{margin-top:auto;display:flex;align-items:center;gap:14px;font-weight:700;font-size:29px;color:${NAVY}}
    .due .b{font-size:38px}
  </style></head><body><div class="frame">
    <div class="topline">
      <img src="${EMBLEM}" alt="">
      <div class="t">West Chester Preschool<small>School Supply List · ${YEAR}</small></div>
    </div>
    <div><span class="badge">${c.icon}&nbsp; ${c.name}</span></div>
    <h1>What to bring</h1>
    <div class="card">
      <span class="tape"></span>
      <ul class="list">${c.items.map((i) => `<li>${i}</li>`).join('')}</ul>
      ${c.optional ? `<p class="opt">${c.optional}</p>` : ''}
    </div>
    <div class="due"><span class="b">🎒</span>${DUE_NOTE}</div>
  </div></body></html>`;
}

function socialWishHtml() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
    ${SOCIAL_BASE}
    .frame{background:linear-gradient(170deg,#fffdf8 8%,${CREAM} 92%)}
    h1{color:${NAVY};font-size:76px;line-height:1.05;margin:8px 0 14px}
    .star{font-size:56px;line-height:1;display:block;margin-bottom:8px}
    .note{color:#3a3f49;font-size:29px;font-weight:600;line-height:1.45;max-width:850px}
    .card{position:relative;background:#fff;border:2px solid #f7d9a8;border-radius:26px;padding:46px 46px 40px;margin-top:44px;box-shadow:0 8px 28px rgba(1,69,126,.08);transform:rotate(.5deg)}
    .tags{display:flex;flex-wrap:wrap;gap:14px}
    .tag{background:${CREAM};border:2px solid #f7d9a8;color:#2b2f38;font-size:27px;font-weight:600;padding:10px 24px;border-radius:50px;line-height:1.3}
    .annot{font-size:40px;transform:rotate(-2.5deg);margin-top:26px;text-align:right}
  </style></head><body><div class="frame">
    <div class="topline">
      <img src="${EMBLEM}" alt="">
      <div class="t">West Chester Preschool<small>School Supply List · ${YEAR}</small></div>
    </div>
    <span class="star">🎨</span>
    <h1>${WISH_LIST.heading}</h1>
    <p class="note">${WISH_LIST.note}</p>
    <div class="card">
      <span class="tape"></span>
      <div class="tags">${WISH_LIST.items.map((i) => `<span class="tag">${i}</span>`).join('')}</div>
    </div>
    <div class="annot">thank you for helping us create!</div>
    <div class="bottombar"><span>westchesterpreschool.org</span><span class="muted">${YEAR}</span></div>
  </div></body></html>`;
}

// ---- Render ----------------------------------------------------------------
const SLIDES = [
  { file: '01-cover.png', html: socialCoverHtml() },
  ...LISTS.map((c, i) => ({ file: `0${i + 2}-${c.slug}.png`, html: socialClassHtml(c) })),
  { file: '06-wish-list.png', html: socialWishHtml() },
];

const footer = `
  <div style="width:100%;font-family:Arial,sans-serif;font-size:7.5px;color:#8a8f99;
    padding:0 0.55in;display:flex;justify-content:space-between;align-items:center;">
    <span>West Chester Preschool &middot; School Supply List ${YEAR}</span>
    <span>westchesterpreschool.org</span>
  </div>`;

// ---- Studio content --------------------------------------------------------
// Board edits live in the `supplyList` singleton — the same shape as the
// committed lists (design stays code-owned). Missing doc/fields fall back.
async function fetchStudioSupplies() {
  const token =
    process.env.SANITY_TOKEN ??
    (() => {
      for (const file of ['.dev.vars', '.env']) {
        try {
          const m = readFileSync(resolve(SITE, file), 'utf8').match(/SANITY_TOKEN="?([^"\n]+)"?/);
          if (m) return m[1];
        } catch {
          /* keep looking */
        }
      }
      return null;
    })();
  if (!token) return null;
  // The classes ride along: a card for a class the Board added needs that
  // class's NAME and COLOUR, and this file only knows the four the site shipped
  // with. Same reason the hub reads them (src/lib/hub-classrooms.ts).
  const query = encodeURIComponent(`{
    "doc": *[_type == "supplyList"][0]{ year, backpackNote, dueNote, waterNote, lists, wishList },
    "classes": *[_type == "class" && defined(slug.current)] | order(orderRank){
      "slug": slug.current, name, color
    }
  }`);
  const res = await fetch(
    `https://niemhgev.api.sanity.io/v2025-01-01/data/query/production?query=${query}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return null;
  return (await res.json()).result ?? null;
}

/**
 * The committed values, overlaid with the Studio document where set — PLUS a
 * card for any class the Board added.
 *
 * The committed LISTS know only the four classes the site shipped with, so a
 * fifth class used to be missing from the printed list entirely, with nothing
 * to say so. A Studio row whose class has no committed twin now becomes its own
 * card, in that class's own colour and icon.
 */
function mergedContent(result) {
  const doc = result?.doc ?? null;
  const classes = result?.classes ?? [];
  const known = new Set(LISTS.map((l) => l.slug));
  const lists = doc?.lists?.length
    ? LISTS.map((base) => {
        const row = doc.lists.find((l) => l.slug === base.slug);
        if (!row) return base;
        return { ...base, items: row.items?.length ? row.items : base.items };
      })
    : LISTS;
  for (const row of doc?.lists ?? []) {
    if (!row?.slug || known.has(row.slug) || !row.items?.length) continue;
    const cls = classes.find((c) => c.slug === row.slug);
    lists.push({
      slug: row.slug,
      name: cls?.name ?? row.slug,
      color: THEMES[cls?.color] ? cls.color : 'sky',
      // The card icons here are EMOJI, not the lucide names the site uses, so
      // a derived card takes a neutral school emoji rather than the class's
      // own icon name (which would print as the word "graduation-cap").
      icon: '🎒',
      items: row.items,
    });
  }
  return {
    year: doc?.year ?? YEAR,
    backpackNote: doc?.backpackNote ?? BACKPACK_NOTE,
    dueNote: doc?.dueNote ?? DUE_NOTE,
    waterNote: doc?.waterNote ?? WATER_NOTE,
    lists,
    // Merge each part on its own: a Studio heading or note applies even
    // when the item list is left to the committed default (field audit
    // 2026-08-23 — the old items-only gate silently ignored both).
    wishList: doc?.wishList
      ? {
          heading: doc.wishList.heading || WISH_LIST.heading,
          note: doc.wishList.note || WISH_LIST.note,
          items: doc.wishList.items?.length ? doc.wishList.items : WISH_LIST.items,
        }
      : WISH_LIST,
  };
}

async function main() {
  // One read: the supply-list document AND the classes (see fetchStudioSupplies).
  const studio = await fetchStudioSupplies();
  if (studio) {
    const merged = mergedContent(studio);
    ({
      year: YEAR,
      backpackNote: BACKPACK_NOTE,
      dueNote: DUE_NOTE,
      waterNote: WATER_NOTE,
    } = merged);
    LISTS = merged.lists.map((l) =>
      l.optional !== undefined ? { ...l, optional: merged.waterNote } : l,
    );
    WISH_LIST = merged.wishList;
  }
  console.log(studio ? 'Supply content: Studio' : 'Supply content: committed fallback');
  mkdirSync(SOCIAL_DIR, { recursive: true });
  const browser = await chromium.launch();
  try {
    // The print one-pager.
    const page = await browser.newPage();
    await page.setContent(pdfHtml(), { waitUntil: 'networkidle' });
    await page.emulateMedia({ media: 'print' });
    await page.pdf({
      path: resolve(OUT_DIR, 'supply-list.pdf'),
      format: 'Letter',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: footer,
      margin: { top: '0.45in', bottom: '0.6in', left: '0.55in', right: '0.55in' },
    });
    await page.close();
    console.log('  ✓ supply-list.pdf');

    // The social carousel.
    for (const slide of SLIDES) {
      const p = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
      await p.setContent(slide.html, { waitUntil: 'networkidle' });
      await p.screenshot({ path: resolve(SOCIAL_DIR, slide.file), type: 'png' });
      await p.close();
      console.log(`  ✓ social/${slide.file}`);
    }
  } finally {
    await browser.close();
  }
  console.log(`Supply-list assets written to ${OUT_DIR}`);
}

// Only render when run directly, so the templates/data can be imported without
// side effects (mirrors generate-curriculum.mjs).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    if (DIST) {
      // The postbuild path must never fail the deploy: the dist keeps the
      // committed public/ assets the build already copied.
      console.warn(`[supplies] skipped (${err?.message ?? err}) — shipping the committed assets`);
      process.exit(0);
    }
    console.error(err);
    process.exit(1);
  });
}
