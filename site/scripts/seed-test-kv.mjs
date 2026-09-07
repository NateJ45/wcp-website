#!/usr/bin/env node
// =============================================================================
// seed-test-kv.mjs — put fixture data in the LOCAL KV the test server reads
// =============================================================================
// `wrangler dev` uses local (miniflare) KV, which starts empty. The board admin
// then renders an empty directory, and an a11y sweep over an empty table proves
// nothing — the exact "green by absence" failure the sweep exists to close.
// tests/hub-a11y.spec.ts asserts there is at least one family to edit, so this
// is what makes that assertion satisfiable.
//
// The fixtures are OBVIOUSLY fake (example.invalid, 555-01xx) and committed on
// purpose: seeding from the real directory would put families' contact details
// into a public repo, which is the mistake this whole area was rebuilt to undo.
//
// "Committed on purpose" was WRONG when first written — .gitignore ignores
// `directory.json` and `teacher-phones.json` at any depth (that is what the
// migration scripts emit, holding real family data), so it silently swallowed
// these two as well. CI would have had nothing to seed. Both are negated back in
// now, and tests/fixtures.test.ts fails the build if either ever grows something
// that looks like a real address, phone number or email — a negated PII rule
// should not be load-bearing on its own.
//
// LOCAL ONLY. Never pass --remote here.
// =============================================================================
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const CONFIG = 'dist/server/wrangler.json';
if (!existsSync(CONFIG)) {
  console.error(`seed-test-kv: ${CONFIG} missing — run \`npm run build\` first.`);
  process.exit(1);
}

const put = (key, file) => {
  const r = spawnSync(
    'npx',
    [
      'wrangler',
      'kv',
      'key',
      'put',
      key,
      `--path=${file}`,
      '--binding=DIRECTORY',
      '--local',
      '-c',
      CONFIG,
    ],
    { encoding: 'utf8', shell: process.platform === 'win32' },
  );
  if (r.status !== 0) {
    console.error(`seed-test-kv: failed to seed ${key}`);
    console.error((r.stdout || '') + (r.stderr || ''));
    process.exit(1);
  }
  console.log(`seed-test-kv: ${key} seeded from ${file}`);
};

put('directory:v1', 'tests/fixtures/directory.json');
put('teacher-phones:v1', 'tests/fixtures/teacher-phones.json');
