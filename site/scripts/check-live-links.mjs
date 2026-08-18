// =============================================================================
// check-live-links.mjs — weekly health check for the Board's share links
// =============================================================================
// The hub leans on "anyone with the link" Google resources: the helper-schedule
// Sheets, the class photo albums, the budget Sheet, the calendar feed, and the
// Documents page's Drive/Canva links. When one dies, a confused parent finds it
// first. This script pings each one and writes the result to the `linkHealth`
// document, which the Studio shows (Family Hub → Link health).
//
// SECURITY: the repo and its Actions logs are PUBLIC. The console output and
// the workflow summary carry labels and statuses only — never the URLs. The
// full URLs go only into the Sanity document, which is private.
//
// Runs weekly from .github/workflows/link-health.yml, or by hand:
//   node scripts/check-live-links.mjs
// Exits 1 when any link fails, so the workflow run shows red and GitHub mails
// the owner.
// =============================================================================
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const SITE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const token =
  process.env.SANITY_TOKEN ??
  (() => {
    for (const file of ['.dev.vars', '.env']) {
      try {
        const m = readFileSync(resolve(SITE_DIR, file), 'utf8').match(/SANITY_TOKEN="?([^"\n]+)"?/);
        if (m) return m[1];
      } catch {
        /* keep looking */
      }
    }
    return null;
  })();
if (!token) throw new Error('no SANITY_TOKEN available');
const client = createClient({
  projectId: 'niemhgev',
  dataset: 'production',
  apiVersion: '2025-01-01',
  token,
  useCdn: false,
});

// ---- Collect every Board-entered link ---------------------------------------
const [classes, settings, documents] = await Promise.all([
  client.fetch(`*[_type == "class"]{ name, helperScheduleUrl, photoAlbumUrl }`),
  client.fetch(`*[_type == "siteSettings"][0]{ budgetSheetId, calendarFeedUrl }`),
  client.fetch(`*[_type == "hubDocument" && defined(link)]{ title, link }`),
]);

const targets = [];
for (const c of classes ?? []) {
  if (c.helperScheduleUrl)
    targets.push({ label: `${c.name} helper schedule`, url: c.helperScheduleUrl, kind: 'sheet' });
  if (c.photoAlbumUrl)
    targets.push({ label: `${c.name} photo album`, url: c.photoAlbumUrl, kind: 'album' });
}
if (settings?.budgetSheetId)
  targets.push({
    label: 'Budget Sheet (gviz)',
    url: `https://docs.google.com/spreadsheets/d/${settings.budgetSheetId}/gviz/tq?tqx=out:json&sheet=Budget`,
    kind: 'gviz',
  });
if (settings?.calendarFeedUrl)
  targets.push({
    label: 'Calendar feed (Apps Script)',
    url: settings.calendarFeedUrl,
    kind: 'json',
  });
for (const d of documents ?? []) {
  if (d.link) targets.push({ label: `Document: ${d.title}`, url: d.link, kind: 'page' });
}

// ---- Check each one ---------------------------------------------------------
// A Google share link that DIED often still answers 200: it redirects to a
// sign-in page instead. So a landing on accounts.google.com counts as dead,
// and a gviz response must really carry the gviz payload.
async function check(t) {
  try {
    const res = await fetch(t.url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
      headers: { 'user-agent': 'wcp-link-health/1.0' },
    });
    if (res.status >= 400) return { ok: false, note: `HTTP ${res.status}` };
    if (res.url.includes('accounts.google.com')) return { ok: false, note: 'asks for sign-in' };
    if (t.kind === 'gviz') {
      const body = await res.text();
      if (!body.includes('google.visualization')) return { ok: false, note: 'not a data reply' };
    }
    if (t.kind === 'json') {
      const body = await res.text();
      try {
        JSON.parse(body);
      } catch {
        return { ok: false, note: 'not JSON' };
      }
    }
    return { ok: true, note: `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, note: err?.name === 'TimeoutError' ? 'timed out (15s)' : 'unreachable' };
  }
}

const results = [];
for (const t of targets) {
  const r = await check(t);
  results.push({ label: t.label, url: t.url, ...r });
  // Labels and statuses only — the log is public.
  console.log(`${r.ok ? 'ok  ' : 'FAIL'}  ${t.label}  (${r.note})`);
}

const failures = results.filter((r) => !r.ok);
const now = new Date().toISOString();
const summary =
  failures.length === 0
    ? `All ${results.length} links healthy`
    : `${failures.length} of ${results.length} links FAILING: ${failures.map((f) => f.label).join(', ')}`;

// ---- Write the Studio-visible record ----------------------------------------
try {
  await client.createOrReplace({
    _id: 'linkHealth',
    _type: 'linkHealth',
    checkedAt: now,
    allOk: failures.length === 0,
    summary,
    results: results.map((r, i) => ({
      _type: 'object',
      _key: `r-${i}`,
      label: r.label,
      url: r.url,
      ok: r.ok,
      note: r.note,
    })),
  });
  console.log('Result written to the Studio (Family Hub → Link health).');
} catch (err) {
  console.warn(`Could not write the Studio record: ${err?.message ?? err}`);
}

console.log(summary);
if (failures.length > 0) process.exit(1);
