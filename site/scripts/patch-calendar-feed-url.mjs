// =============================================================================
// patch-calendar-feed-url.mjs — point the hub at the new calendar-feed web app
// =============================================================================
// The calendar Apps Script was redeployed 2026-07-17 from Nathan's personal
// account (source: scripts/apps-script/calendar-feed.gs) because the original
// lived under the contact@ account he lost access to. This sets
// siteSettings.calendarFeedUrl to the new /exec URL.
//
// The URL itself deliberately lives ONLY in .dev.vars (CALENDAR_FEED_URL) —
// same policy as every share-by-link Google URL: the repo is public and the
// code fallback (src/data/hub/live-links.ts) ships empty on purpose.
//
// Idempotent (skips if already set; patches the draft too so a stale Studio
// draft can't clobber the value on next publish). Run once, after the Sanity
// API quota resets:
//   node scripts/patch-calendar-feed-url.mjs
// =============================================================================
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const SITE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const vars = readFileSync(`${SITE_DIR}/.dev.vars`, 'utf8');
const token = (vars.match(/SANITY_TOKEN="([^"]+)"/) || [])[1];
const feedUrl = (vars.match(/CALENDAR_FEED_URL="([^"]+)"/) || [])[1];
if (!token) throw new Error('no SANITY_TOKEN in .dev.vars');
if (!feedUrl) throw new Error('no CALENDAR_FEED_URL in .dev.vars');
if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(feedUrl))
  throw new Error(`CALENDAR_FEED_URL doesn't look like an Apps Script /exec URL: ${feedUrl}`);

const client = createClient({
  projectId: 'niemhgev',
  dataset: 'production',
  apiVersion: '2025-01-01',
  token,
  useCdn: false,
});

// Prove the new feed answers with the contract before pointing the site at it.
const res = await fetch(feedUrl, { signal: AbortSignal.timeout(15000) });
if (!res.ok) throw new Error(`new feed returned ${res.status} — not patching`);
const events = await res.json();
if (!Array.isArray(events) || (events.length > 0 && !events[0].title))
  throw new Error('new feed did not return the expected event array — not patching');
console.log(`✓ new feed answers: ${events.length} events`);

const docs = await client.fetch(`*[_type == "siteSettings"]{ _id, calendarFeedUrl }`);
if (!docs?.length) throw new Error('no siteSettings document found');
let n = 0;
for (const doc of docs) {
  if (doc.calendarFeedUrl === feedUrl) {
    console.log(`✓ ${doc._id}: already set, skipped`);
    continue;
  }
  await client.patch(doc._id).set({ calendarFeedUrl: feedUrl }).commit();
  console.log(`✓ ${doc._id}: calendarFeedUrl updated (was ${doc.calendarFeedUrl || '(empty)'})`);
  n++;
}
console.log(n ? `Done — ${n} doc(s) patched.` : 'Done — nothing to do.');
