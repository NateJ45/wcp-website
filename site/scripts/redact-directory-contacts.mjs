#!/usr/bin/env node
// =============================================================================
// redact-directory-contacts.mjs — remove ONE person's contact details from the
// Family Directory. The rest of the family stays.
// =============================================================================
// WHY THIS FILE EXISTS
//
// scripts/remove-directory-families.mjs is the blunt tool. It deletes a whole
// family when the family leaves the school.
//
// This script is the precise tool. It answers the request the board gets more
// often: "do not give out my husband's number". The family stays in the
// directory. One grown-up's email and phone come off the card.
//
// It edits the DIRECTORY KV namespace. See src/lib/hub-directory.ts. KV is the
// only copy of family data since 2026-09-06. This is not a Sanity script.
//
// WARNING: do not put real names in this file. This repository is public. A
// list of people who asked to be unlisted must not be committed. Give the names
// as arguments. The match is case-insensitive on part of the parent's name, so
// a first name is enough when it is unique.
//
// USAGE (from site/)
//   node scripts/redact-directory-contacts.mjs "Jane Smith" "John Smith"
//   node scripts/redact-directory-contacts.mjs "Jane Smith" --commit
//   node scripts/redact-directory-contacts.mjs "Jane Smith" --drop --commit
//
//   (no flag)   Clear the email and the phone. Keep the name on the card.
//   --drop      Remove the person from the list of grown-ups.
//   --commit    Write the change. Without it the script changes nothing.
//
// WARNING: log in to wrangler first (`npx wrangler login`). The script reads and
// writes the REMOTE KV value. It needs the Cloudflare account that owns the
// namespace.
//
// The script writes a temporary file with the name directory.json. That name is
// in .gitignore, because the file holds real family data. The script deletes the
// file at the end.
// =============================================================================
import { spawnSync } from 'node:child_process';
import { existsSync, rmSync, writeFileSync } from 'node:fs';

// These keys must agree with src/lib/hub-directory.ts.
const DIRECTORY_KEY = 'directory:v1';
const REP_LINKS_KEY = 'rep-links:v1';
const SCRATCH = 'directory.json';

// --- arguments ---------------------------------------------------------------
const argv = process.argv.slice(2);
const commit = argv.includes('--commit');
const drop = argv.includes('--drop');
const names = argv.filter((a) => !a.startsWith('--'));

if (!names.length) {
  console.error('Usage: node scripts/redact-directory-contacts.mjs "<Person Name>" [...]');
  console.error('       [--drop] [--commit]');
  process.exit(1);
}

/** Match part of a name, and ignore case. "Jane" finds "Jane Q. Smith". */
const wanted = names.map((n) => n.trim().toLowerCase());
const matches = (personName) => wanted.some((w) => (personName || '').toLowerCase().includes(w));

// --- read the directory from KV ----------------------------------------------
/**
 * Run one wrangler KV command. Return stdout.
 *
 * wrangler prints its banner and its warnings to stderr. stdout holds only the
 * value. The caller still cuts from the first `{`. A later wrangler version can
 * then print to stdout without a break here.
 *
 * @param {string[]} args   The words after `wrangler kv key`.
 * @param {boolean} fatal   True stops the script when the command fails.
 */
function kv(args, fatal = true) {
  const run = spawnSync('npx', ['wrangler', 'kv', 'key', ...args], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (run.status !== 0) {
    if (!fatal) return '';
    console.error(run.stderr || run.stdout || 'wrangler failed and printed nothing');
    process.exit(1);
  }
  return run.stdout ?? '';
}

/** Cut the JSON out of wrangler's stdout. Return null when there is none. */
function parseKv(stdout) {
  const start = stdout.indexOf('{');
  if (start === -1) return null;
  try {
    return { json: JSON.parse(stdout.slice(start)), text: stdout.slice(start) };
  } catch {
    return null;
  }
}

const read = parseKv(kv(['get', DIRECTORY_KEY, '--binding=DIRECTORY', '--remote', '--text']));
if (!read) {
  console.error(`redact: ${DIRECTORY_KEY} is empty or is not JSON. Nothing changed.`);
  process.exit(1);
}

const doc = read.json;
const entries = Array.isArray(doc.entries) ? doc.entries : [];
if (!entries.length) {
  console.error('redact: the directory holds no families. Nothing changed.');
  process.exit(1);
}

// --- find each person, and make the change -----------------------------------
// `changes` feeds the summary on screen. It records WHICH fields the script
// clears. It never records the values. A terminal can be shared or scrolled
// back through. To print a number as proof of its removal defeats the purpose.
const changes = [];

for (const entry of entries) {
  const parents = Array.isArray(entry.parents) ? entry.parents : [];
  const kept = [];

  for (const parent of parents) {
    if (!matches(parent.name)) {
      kept.push(parent);
      continue;
    }

    if (drop) {
      changes.push({
        family: entry.familyName,
        person: parent.name,
        action: 'removed from the family',
      });
      continue; // The script does not keep this person.
    }

    const had = [parent.email ? 'email' : null, parent.phone ? 'phone' : null].filter(Boolean);
    // Delete the keys. Do not set them to ''. The admin form writes no key for
    // an empty field. The stored data then has one shape, and no later code
    // must tell an absent value from an empty one.
    delete parent.email;
    delete parent.phone;
    kept.push(parent);

    changes.push({
      family: entry.familyName,
      person: parent.name,
      action: had.length ? `cleared ${had.join(' + ')}` : 'had no contact details',
    });
  }

  entry.parents = kept;
}

// --- report ------------------------------------------------------------------
const unmatched = names.filter(
  (n) => !changes.some((c) => (c.person || '').toLowerCase().includes(n.trim().toLowerCase())),
);
for (const n of unmatched) console.log(`• ${n}: no person with that name`);

if (!changes.length) {
  console.log('\nNothing to do.');
  process.exit(0);
}

console.log(`\n${commit ? 'Applying' : 'Would apply'} ${changes.length} change(s):\n`);
for (const c of changes) console.log(`  ${c.family} — ${c.person}: ${c.action}`);

// --- warn when a co-op role card uses one of these families ------------------
// fillRoleContacts in hub-directory.ts gives a role holder the email and the
// phone of a linked family. The card loses its Email and Call buttons when the
// script clears those details. That result is correct, but it surprises a board
// member. Print a warning.
const touchedIds = new Set(
  entries.filter((e) => changes.some((c) => c.family === e.familyName)).map((e) => e._id),
);
const links = parseKv(
  kv(['get', REP_LINKS_KEY, '--binding=DIRECTORY', '--remote', '--text'], false),
);
if (links) {
  const affected = Object.entries(links.json).filter(([, familyId]) => touchedIds.has(familyId));
  if (affected.length) {
    console.log('\n! A co-op role card takes its contact details from one of these families.');
    console.log('  The Email and Call buttons on that card disappear with the details.');
    console.log(`  Role holder id(s): ${affected.map(([roleId]) => roleId).join(', ')}`);
  }
}

if (!commit) {
  console.log('\nDry run. Nothing changed. Add --commit to write.');
  process.exit(0);
}

// --- write the new directory -------------------------------------------------
// This script goes around saveDirectory() in the Worker. It therefore repeats
// the same three guards:
//   NEVER EMPTY  — the checks above stop a write that empties the directory.
//   BACKUP FIRST — copy the old value to a key with a timestamp.
//   VERSION BUMP — an admin tab that is open gets a conflict. It cannot save
//                  the old details back over this change.
const stamp = new Date().toISOString().replace(/[:.]/g, '-');

writeFileSync(SCRATCH, read.text);
kv([
  'put',
  `${DIRECTORY_KEY}:backup:${stamp}`,
  `--path=${SCRATCH}`,
  '--binding=DIRECTORY',
  '--remote',
]);
console.log(`\n✓ backed up the old value to ${DIRECTORY_KEY}:backup:${stamp}`);

const next = {
  version: (typeof doc.version === 'number' ? doc.version : 0) + 1,
  updatedAt: new Date().toISOString(),
  entries,
};
writeFileSync(SCRATCH, JSON.stringify(next));
kv(['put', DIRECTORY_KEY, `--path=${SCRATCH}`, '--binding=DIRECTORY', '--remote']);
if (existsSync(SCRATCH)) rmSync(SCRATCH);

console.log(`✓ wrote ${DIRECTORY_KEY} (version ${next.version})`);
console.log('\nDone. The hub shows the change on the next request. It never caches the directory.');
console.log('The Squarespace directory block holds a second copy. Update it too.');
