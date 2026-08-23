// =============================================================================
// patch-hub-nav-celebrations.mjs — link the Celebrations page in the hub menu
// =============================================================================
// One-shot, idempotent. /family-hub/celebrations rendered fine but nothing
// linked to it (docs/PENDING.md, resolved 2026-08-23). This appends a
// builtinLink row for it to the hubNavMenu doc's "Community" group. The code
// fallback (src/data/hub-nav.ts) gained the same link, which also makes it a
// choice in the Studio's menu editor dropdown.
//
//   node scripts/patch-hub-nav-celebrations.mjs            # dry run
//   node scripts/patch-hub-nav-celebrations.mjs --commit   # apply
// =============================================================================
import { client, apply, done } from './patch-lib.mjs';

const TARGET = '/family-hub/celebrations';

const doc = await client.fetch('*[_id == "hubNavMenu"][0]{ groups }');
let n = 0;

if (!doc?.groups?.length) {
  console.log('hubNavMenu has no groups (menu runs on the code fallback) — nothing to patch.');
} else {
  const already = doc.groups.some((g) => (g.links ?? []).some((l) => l.target === TARGET));
  const groupIndex = doc.groups.findIndex((g) => (g.label ?? '').toLowerCase() === 'community');
  if (already) {
    console.log('Celebrations is already in the menu — nothing to do.');
  } else if (groupIndex === -1) {
    console.log('No "Community" group found — add the link by hand in the Studio.');
  } else {
    n += 1;
    await apply(`hubNavMenu → Community: append builtinLink ${TARGET}`, async () => {
      await client
        .patch('hubNavMenu')
        .append(`groups[${groupIndex}].links`, [
          { _type: 'builtinLink', _key: `celebrations-${Date.now().toString(36)}`, target: TARGET },
        ])
        .commit();
    });
  }
}

done(n);
