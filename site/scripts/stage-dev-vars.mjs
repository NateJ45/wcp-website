#!/usr/bin/env node
// =============================================================================
// stage-dev-vars.mjs — give the preview worker its secrets
// =============================================================================
// `wrangler dev -c dist/server/wrangler.json` resolves `.dev.vars` RELATIVE TO
// THE CONFIG, so it looks in dist/server/ and never sees site/.dev.vars. Without
// this step the preview worker boots with no FAMILY_HUB_PASSWORD, no
// SANITY_TOKEN and no CALENDAR_FEED_URL: the gate rejects the correct password
// and every hub test fails for a reason that has nothing to do with the code.
//
// It worked locally on 2026-09-07 only because the file had been copied there BY
// HAND. That is not a thing a CI runner or the next person will do, so it is a
// script now.
//
// Two sources, in order:
//   1. site/.dev.vars  — the developer's own file, copied verbatim.
//   2. process.env     — CI, where .dev.vars is gitignored and absent and the
//                        values arrive as GitHub secrets.
//
// dist/ is gitignored in full, so the written file cannot be committed.
// =============================================================================
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = dirname(dirname(fileURLToPath(import.meta.url)));
const SOURCE = join(SITE, '.dev.vars');
const TARGET = join(SITE, 'dist', 'server', '.dev.vars');

/**
 * Everything the worker reads at runtime. A name missing from the environment is
 * skipped rather than written empty: `FAMILY_HUB_PASSWORD=` would make the gate
 * compare against the empty string, which is a worse failure than an absent key.
 */
const RUNTIME_VARS = [
  'FAMILY_HUB_PASSWORD',
  'FAMILY_HUB_ADMIN_PASSWORD',
  'SANITY_TOKEN',
  'FORMS_WEBHOOK_TOKEN',
  'FOURTHWALL_STOREFRONT_TOKEN',
  'FOURTHWALL_API_USER',
  'FOURTHWALL_API_PASSWORD',
  'CALENDAR_FEED_URL',
  'AIRNOW_API_KEY',
];

if (!existsSync(dirname(TARGET))) {
  console.error(`stage-dev-vars: ${dirname(TARGET)} is missing — run \`npm run build\` first.`);
  process.exit(1);
}

if (existsSync(SOURCE)) {
  copyFileSync(SOURCE, TARGET);
  console.log('stage-dev-vars: copied site/.dev.vars → dist/server/.dev.vars');
} else {
  const present = RUNTIME_VARS.filter((name) => process.env[name]?.trim());
  const lines = present.map((name) => `${name}="${process.env[name].trim()}"`);
  mkdirSync(dirname(TARGET), { recursive: true });
  writeFileSync(TARGET, `${lines.join('\n')}\n`, 'utf8');
  // Names only. Never the values — this output lands in a public CI log.
  console.log(
    `stage-dev-vars: wrote dist/server/.dev.vars from the environment (${present.join(', ') || 'nothing'})`,
  );

  // The two gate passwords are the ones whose absence produces a confusing
  // failure: the suite signs in with the right password and is refused, and the
  // error reads like a broken login page rather than a missing secret.
  const missing = ['FAMILY_HUB_PASSWORD', 'FAMILY_HUB_ADMIN_PASSWORD'].filter(
    (name) => !process.env[name]?.trim(),
  );
  if (missing.length) {
    console.error(
      `stage-dev-vars: ${missing.join(' and ')} not set, and there is no site/.dev.vars.\n` +
        'The hub suite cannot sign in without it. Set it in .dev.vars locally, or as a ' +
        'repository secret in CI.',
    );
    process.exit(1);
  }
}
