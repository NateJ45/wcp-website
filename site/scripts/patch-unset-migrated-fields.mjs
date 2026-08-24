// =============================================================================
// patch-unset-migrated-fields.mjs — clear the "Unknown fields found" warnings
// =============================================================================
// The 2026-08 field audit MOVED fields (siteSettings → hubStore/hubSettings)
// and REMOVED dead ones (post.featured, operatingBudget.priorYear,
// ctaSection.seam) from the schemas — but left the old stored values in the
// documents, which the Studio surfaces as "Unknown fields found" warnings.
// This unsets the orphaned data. SAFETY: it refuses to touch siteSettings
// until it has verified the migrated values really exist in hubStore and
// hubSettings. Patches drafts too, so a stale draft can't resurrect a value
// on its next publish. Idempotent.
//
//   node scripts/patch-unset-migrated-fields.mjs            # dry run
//   node scripts/patch-unset-migrated-fields.mjs --commit   # apply
// =============================================================================
import { client, apply, done } from './patch-lib.mjs';

let n = 0;

/** Unset fields on a doc id and its draft twin, skipping missing docs. */
async function unsetOn(id, fields, label) {
  for (const docId of [id, `drafts.${id}`]) {
    const doc = await client.fetch('*[_id == $id][0]', { id: docId });
    if (!doc) continue;
    const present = fields.filter((f) => doc[f] !== undefined);
    if (present.length === 0) continue;
    n += 1;
    await apply(`${label} (${docId}): unset ${present.join(', ')}`, async () => {
      await client.patch(docId).unset(present).commit();
    });
  }
}

// --- siteSettings: only after proving the new homes hold the values --------
const [hubStore, hubSettings, settings] = await Promise.all([
  client.fetch('*[_id == "hubStore"][0]'),
  client.fetch('*[_id == "hubSettings"][0]'),
  client.fetch('*[_type == "siteSettings"][0]{ _id }'),
]);

const storeOk = hubStore?.storeUrl && hubStore?.storeHeadline && hubStore?.storeProducts?.length;
const hubOk = hubSettings?.budgetSheetId && hubSettings?.calendarFeedUrl;
if (!storeOk || !hubOk) {
  console.log('REFUSING siteSettings cleanup: the migrated values are not all in place.');
  console.log(`  hubStore ok: ${!!storeOk} · hubSettings ok: ${!!hubOk}`);
} else if (settings?._id) {
  await unsetOn(
    settings._id,
    [
      // moved to hubStore (2026-08-23)
      'storeUrl',
      'storeHeadline',
      'storeTagline',
      'storeProducts',
      // moved to hubSettings (2026-08-23)
      'budgetSheetId',
      'calendarFeedUrl',
      'googleCalendarId',
      'familyHandbook',
      'familyCount',
      'coopHoursGoal',
      'pastFundraisingTotals',
      'showDirectoryMap',
    ],
    'siteSettings',
  );
}

// --- operatingBudget.priorYear (field removed, never rendered) -------------
const budget = await client.fetch('*[_type == "operatingBudget"][0]{ _id }');
if (budget?._id) await unsetOn(budget._id, ['priorYear'], 'operatingBudget');

// --- post.featured (field removed; initialValue had stamped it on docs) ----
const posts = await client.fetch('*[_type == "post" && defined(featured)]{ _id }', {});
for (const p of posts) {
  // unsetOn also covers the draft twin of each published id; draft-only ids
  // come back from the query directly and unsetOn skips their missing twin.
  await unsetOn(p._id.replace(/^drafts\./, ''), ['featured'], 'post');
}

// --- ctaSection.seam inside page/hubPage sections (field removed) ----------
const withSeam = await client.fetch(
  '*[_type in ["page", "hubPage"] && count(sections[_type == "ctaSection" && defined(seam)]) > 0]{ _id }',
);
for (const d of withSeam) {
  const id = d._id;
  n += 1;
  await apply(`${id}: unset seam on its ctaSection(s)`, async () => {
    await client.patch(id).unset(['sections[_type == "ctaSection"].seam']).commit();
  });
}

done(n);
