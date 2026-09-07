#!/usr/bin/env node
// =============================================================================
// post-deploy-check.mjs — assert the LIVE site, after it is live
// =============================================================================
// Everything else in this repo tests a build. These three things can only be
// wrong in production, and each has a way of being wrong quietly:
//
//   1. SECURITY HEADERS. public/_headers is applied by Cloudflare, not by the
//      build, so nothing in CI proves it took effect. A typo in that file, a
//      route that answers before it, or a Cloudflare-side change drops HSTS or
//      the CSP with a perfectly green pipeline behind it.
//
//   2. THE GATE, IN PRODUCTION. tests/hub-gate.spec.ts asserts a stranger is
//      locked out of a LOCAL preview worker. That is not the same claim as the
//      deployed one: the session cookie, the middleware matcher and the KV
//      binding all differ between the two. Families' names, children, phone
//      numbers and home addresses sit behind this, so it gets checked where it
//      actually matters.
//
//   3. CONTENT. The directory lives in KV, edited by board members through
//      /family-hub/admin — outside the repo entirely, so no commit and no CI
//      run will ever notice it going empty. It has been empty in production
//      once already: on 2026-09-06 I purged the old Sanity source while the
//      deployed worker still read from it, and the hub served an empty
//      directory for about an hour. Staging looked perfect throughout.
//
// This deliberately does NOT skip when something is unconfigured. uptime.yml
// warns and exits 0 without SITE_URL, and SITE_URL was never set — so the
// hourly check reported success while testing nothing from 2026-08-27 to
// 2026-09-07. A check that cannot run is a failure, not a pass.
// =============================================================================
import { spawnSync } from 'node:child_process';

const ORIGIN = (process.env.SITE_URL || 'https://wcp-website.nathanjnixon86.workers.dev').replace(
  /\/$/,
  '',
);
const KV_NAMESPACE_ID = process.env.DIRECTORY_KV_ID || '6b7d362da417420c80c2dca2cba5b5f4';

const failures = [];
const fail = (msg) => failures.push(msg);
const ok = (msg) => console.log(`  ok  ${msg}`);

// -- 1. Security headers ------------------------------------------------------
// Values are matched loosely (a substring that carries the security property)
// so tightening a policy does not fail the gate, while dropping one does.
const REQUIRED_HEADERS = [
  ['strict-transport-security', 'max-age=', 'HSTS'],
  ['content-security-policy', "object-src 'none'", 'CSP object-src'],
  ['content-security-policy', "base-uri 'self'", 'CSP base-uri'],
  ['content-security-policy', 'frame-ancestors', 'CSP frame-ancestors (clickjacking)'],
  ['x-content-type-options', 'nosniff', 'X-Content-Type-Options'],
  ['referrer-policy', 'strict-origin', 'Referrer-Policy'],
  ['cross-origin-opener-policy', 'same-origin', 'COOP'],
];

console.log(`\nSecurity headers — ${ORIGIN}/`);
try {
  const res = await fetch(`${ORIGIN}/`, { redirect: 'follow' });
  if (!res.ok) fail(`GET ${ORIGIN}/ answered ${res.status}`);
  for (const [header, needle, label] of REQUIRED_HEADERS) {
    const value = res.headers.get(header) ?? '';
    if (value.toLowerCase().includes(needle.toLowerCase())) ok(label);
    else fail(`${label}: expected ${header} to contain "${needle}", got "${value || '(absent)'}"`);
  }
} catch (error) {
  fail(`could not reach ${ORIGIN}/ — ${error.message}`);
}

// -- 2. The gate is closed to a stranger --------------------------------------
// No cookie is sent, so 200 means the page rendered for the public. A redirect
// to the login page, a 401 or a 403 are all correct answers.
const GATED = [
  '/family-hub/',
  '/family-hub/directory/',
  '/family-hub/admin/',
  '/family-hub/photos/',
];

console.log(`\nGate closed to a stranger`);
for (const path of GATED) {
  try {
    const res = await fetch(`${ORIGIN}${path}`, { redirect: 'manual' });
    // Only a redirect to the login page, a 401 or a 403 is a CLOSED gate. 200 is
    // the leak this check exists for; anything else — a 404, a 500 — means the
    // route is not there to be gated, which is its own failure and must not be
    // mistaken for security. "Nothing answered" is not the same as "refused".
    if (res.status === 200) {
      fail(`${path} returned 200 with NO session — the gate is open to the public`);
    } else if ([301, 302, 303, 307, 308, 401, 403].includes(res.status)) {
      ok(`${path} → ${res.status}`);
    } else {
      fail(`${path} → ${res.status}; expected a redirect to the login page, or 401/403`);
    }
  } catch (error) {
    fail(`could not reach ${path} — ${error.message}`);
  }
}

// -- 3. The directory still has content ---------------------------------------
// Read through wrangler rather than the site: the whole point of KV is that
// there is no public read surface, so an HTTP check cannot see this at all.
// Needs CLOUDFLARE_API_TOKEN in the environment.
console.log(`\nDirectory content in KV`);
function kvGet(key) {
  const res = spawnSync(
    'npx',
    ['wrangler', 'kv', 'key', 'get', key, '--namespace-id', KV_NAMESPACE_ID, '--remote'],
    { encoding: 'utf8', shell: process.platform === 'win32' },
  );
  if (res.status !== 0) {
    // Report the whole tail, not the last line. The last line wrangler writes is
    // "Logs were written to …", which names a file on the runner that no longer
    // exists by the time anyone reads the CI output — it says nothing about
    // what went wrong.
    const detail = (res.stderr || res.stdout || '(no output)')
      .trim()
      .split('\n')
      .filter((line) => !/^npm notice/.test(line))
      .slice(-6)
      .join(' | ');
    throw new Error(`wrangler exited ${res.status}: ${detail}`);
  }
  return res.stdout;
}

// Only counts and shapes are printed. The values are families' home addresses
// and children's names, and this output is a public CI log.
const EXPECTED = [
  ['directory:v1', 'entries', 30],
  ['teacher-phones:v1', null, 1],
  ['rep-links:v1', null, 1],
];

// No CLOUDFLARE_API_TOKEN precondition: wrangler authenticates from that token
// in CI and from the developer's own `wrangler login` locally, and testing for
// the variable would refuse to run in the second case. A failed read reports
// itself below either way.
for (const [key, arrayField, minimum] of EXPECTED) {
  try {
    const parsed = JSON.parse(kvGet(key));
    const items = arrayField ? parsed?.[arrayField] : parsed;
    const count = Array.isArray(items) ? items.length : Object.keys(items ?? {}).length;
    if (count >= minimum) ok(`${key}: ${count} records`);
    else
      fail(
        `${key}: ${count} records, expected at least ${minimum} — the hub is serving an empty page`,
      );
  } catch (error) {
    fail(`${key}: could not read or parse — ${error.message}`);
  }
}

// -----------------------------------------------------------------------------
if (failures.length) {
  console.error(`\n${failures.length} post-deploy check(s) FAILED:`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log('\nAll post-deploy checks passed.');
