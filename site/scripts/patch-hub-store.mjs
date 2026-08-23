// =============================================================================
// patch-hub-store.mjs — copy the store card out of Site Settings
// =============================================================================
// One-shot, idempotent. The store card fields (storeUrl, storeHeadline,
// storeTagline, storeProducts) moved from the siteSettings singleton to the
// new `hubStore` singleton (Family Hub workspace, 2026-08-23). This script
// copies the current values into the hubStore document. It never writes a
// field that hubStore already has, so a re-run changes nothing.
//
//   node scripts/patch-hub-store.mjs            # dry run
//   node scripts/patch-hub-store.mjs --commit   # apply
// =============================================================================
import { client, apply, done } from './patch-lib.mjs';

const settings = await client.fetch(
  '*[_type == "siteSettings"][0]{ storeUrl, storeHeadline, storeTagline, storeProducts }',
);
const existing = await client.fetch('*[_id == "hubStore"][0]');

let n = 0;

if (!settings) {
  console.log('No siteSettings document found — nothing to copy.');
} else {
  const fields = {};
  for (const key of ['storeUrl', 'storeHeadline', 'storeTagline', 'storeProducts']) {
    const value = settings[key];
    const already = existing?.[key];
    if (value != null && already == null) fields[key] = value;
  }
  if (Object.keys(fields).length === 0) {
    console.log('hubStore already carries the store card values — nothing to do.');
  } else {
    n += 1;
    await apply(`hubStore ← ${Object.keys(fields).join(', ')} (from siteSettings)`, async () => {
      await client.createIfNotExists({ _id: 'hubStore', _type: 'hubStore' });
      await client.patch('hubStore').setIfMissing(fields).commit();
    });
  }
}

done(n);
