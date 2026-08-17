// =============================================================================
// seed-hub-nav-menu.mjs — the Family Hub menu into the Studio
// =============================================================================
// Fills the `hubNavMenu` singleton with the menu exactly as the committed
// fallback (src/data/hub-nav.ts) renders it today, so the Board opens the real
// menu and edits from there — rename a section, reorder links, move one, hide
// one, add their own pages — instead of rebuilding it from memory into a blank
// form.
//
// Home is NOT seeded: it is pinned in code and not part of the document.
//
// Idempotent: will not overwrite a document that already has sections.
//   node scripts/seed-hub-nav-menu.mjs
//   node scripts/seed-hub-nav-menu.mjs --force
// =============================================================================
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const SITE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const token = (readFileSync(`${SITE_DIR}/.dev.vars`, 'utf8').match(/SANITY_TOKEN="([^"]+)"/) ||
  [])[1];
if (!token) throw new Error('no SANITY_TOKEN in .dev.vars');
const client = createClient({
  projectId: 'niemhgev',
  dataset: 'production',
  apiVersion: '2025-01-01',
  token,
  useCdn: false,
});
const FORCE = process.argv.includes('--force');
const ID = 'hubNavMenu';

// Imported, not retyped — the seed can't drift from what the rail renders.
const { hubNav } = await import('../src/data/hub-nav.ts');

// Map the committed hexes back to the schema's accent names.
const ACCENT_NAME = {
  '#7dd3fc': 'sky',
  '#ffa334': 'amber',
  '#4ade80': 'green',
  '#fdba74': 'orange',
};

const keyify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const groups = hubNav.slice(1).map((g) => ({
  _type: 'navGroup',
  _key: keyify(g.label),
  label: g.label,
  accent: ACCENT_NAME[g.accent] ?? 'sky',
  links: g.links.map((l) =>
    l.external
      ? {
          _type: 'externalLink',
          _key: keyify(`${g.label}-${l.label}`),
          label: l.label,
          url: l.href,
          icon: l.icon,
        }
      : {
          _type: 'builtinLink',
          _key: keyify(`${g.label}-${l.label}`),
          target: l.href,
          hidden: false,
        },
  ),
}));

const existing = await client.getDocument(ID);
if (existing?.groups?.length && !FORCE) {
  console.log('Menu already has sections in the Studio. Nothing written (use --force).');
  process.exit(0);
}

await client.createOrReplace({ _type: 'hubNavMenu', _id: ID, groups });
const linkCount = groups.reduce((t, g) => t + g.links.length, 0);
console.log(`✓ ${ID}: ${groups.length} sections, ${linkCount} links (Home stays pinned in code).`);
