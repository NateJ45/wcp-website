// =============================================================================
// patch-hub-settings.mjs — copy the hub-only fields out of Site Settings
// =============================================================================
// One-shot, idempotent. Eight hub-only fields moved from the siteSettings
// singleton to the new `hubSettings` singleton (Family Hub workspace,
// 2026-08-23): familyHandbook, coopHoursGoal, familyCount,
// pastFundraisingTotals, budgetSheetId, calendarFeedUrl, googleCalendarId,
// showDirectoryMap. This script copies the current values over. It never
// writes a field hubSettings already has, so a re-run changes nothing.
//
//   node scripts/patch-hub-settings.mjs            # dry run
//   node scripts/patch-hub-settings.mjs --commit   # apply
// =============================================================================
import { client, apply, done } from './patch-lib.mjs';

const FIELDS = [
  'familyHandbook',
  'coopHoursGoal',
  'familyCount',
  'pastFundraisingTotals',
  'budgetSheetId',
  'calendarFeedUrl',
  'googleCalendarId',
  'showDirectoryMap',
];

const settings = await client.fetch(`*[_type == "siteSettings"][0]{ ${FIELDS.join(', ')} }`);
const existing = await client.fetch('*[_id == "hubSettings"][0]');

let n = 0;

if (!settings) {
  console.log('No siteSettings document found — nothing to copy.');
} else {
  const fields = {};
  for (const key of FIELDS) {
    const value = settings[key];
    const already = existing?.[key];
    if (value != null && already == null) fields[key] = value;
  }
  if (Object.keys(fields).length === 0) {
    console.log('hubSettings already carries the values — nothing to do.');
  } else {
    n += 1;
    await apply(`hubSettings ← ${Object.keys(fields).join(', ')} (from siteSettings)`, async () => {
      await client.createIfNotExists({ _id: 'hubSettings', _type: 'hubSettings' });
      await client.patch('hubSettings').setIfMissing(fields).commit();
    });
  }
}

done(n);
