// =============================================================================
// seed-operating-budget.mjs — move the operating budget into the Studio
// =============================================================================
// Transcribes the committed 2026-27 budget (src/data/hub/budget.ts) into the
// `operatingBudget` singleton, so the Treasurer can edit her own approved budget
// in Studio → Money & payments → Operating budget instead of asking a developer.
//
// The three headline figures are NOT copied. They are derived from the lines at
// render time (src/lib/budget.ts), which is what stops the summary drifting away
// from the table. This script checks its own arithmetic against the figures the
// data file used to state, and refuses to write if they disagree.
//
// Idempotent: writes a fixed document id, and by default will NOT overwrite a
// budget that already has lines (so a Treasurer's edits are never clobbered).
//   node scripts/seed-operating-budget.mjs
//   node scripts/seed-operating-budget.mjs --force   (replace what's there)
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
const ID = 'operatingBudget';

// Imported straight from the TS data file (Node strips the types), rather than
// parsed out of the source text. A regex over the file dropped three lines and
// the arithmetic check below caught it — importing the real values cannot.
const { budgetGroups, budgetMeta } = await import('../src/data/hub/budget.ts');

const ICONS = {
  revenue: 'circle-dollar-sign',
  fundraising: 'hand-heart',
  operating: 'building-2',
  programs: 'book-open',
};

const groups = budgetGroups.map((g) => ({
  _type: 'budgetGroup',
  _key: g.key,
  label: g.label,
  kind: g.kind,
  icon: ICONS[g.key] ?? 'circle-dollar-sign',
  lines: g.lines.map((l, i) => ({
    _type: 'budgetLine',
    _key: `${g.key}-${i}`,
    label: l.label,
    now: l.now,
    ...(typeof l.was === 'number' ? { was: l.was } : {}),
    ...(l.note ? { note: l.note } : {}),
  })),
}));

const meta = {
  year: budgetMeta.year,
  priorYear: budgetMeta.priorYear,
  enrollment: budgetMeta.enrollment,
  netNote: budgetMeta.netNote,
  source: budgetMeta.source,
};

// Prove the derivation before writing: the sums must reproduce the figures the
// data file stated, or the parse dropped a line and the budget would be wrong.
const sum = (g) => g.lines.reduce((t, l) => t + l.now, 0);
const revenue = groups.filter((g) => g.kind === 'revenue').reduce((t, g) => t + sum(g), 0);
const expenses = groups.filter((g) => g.kind !== 'revenue').reduce((t, g) => t + sum(g), 0);
const stated = {
  targetRevenue: budgetMeta.targetRevenue,
  totalExpenses: budgetMeta.totalExpenses,
  net: budgetMeta.net,
};

const lineCount = groups.reduce((t, g) => t + g.lines.length, 0);
console.log(`Parsed ${groups.length} sections, ${lineCount} lines.`);
console.log(
  `  derived   revenue ${revenue.toLocaleString()} · expenses ${expenses.toLocaleString()} · net ${(revenue - expenses).toLocaleString()}`,
);
console.log(
  `  data file revenue ${stated.targetRevenue.toLocaleString()} · expenses ${stated.totalExpenses.toLocaleString()} · net ${stated.net.toLocaleString()}`,
);
if (
  revenue !== stated.targetRevenue ||
  expenses !== stated.totalExpenses ||
  revenue - expenses !== stated.net
) {
  throw new Error('derived totals do not match the data file — parse is wrong, refusing to write');
}

const existing = await client.getDocument(ID);
if (existing?.groups?.length && !FORCE) {
  console.log('Budget already has sections in the Studio. Nothing written (use --force).');
  process.exit(0);
}

await client.createOrReplace({ _type: 'operatingBudget', _id: ID, ...meta, groups });
console.log(
  `✓ ${ID}: ${meta.year} budget seeded, ${lineCount} lines across ${groups.length} sections.`,
);
