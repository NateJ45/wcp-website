// =============================================================================
// patch-merge-about-into-why-wcp.mjs — IA merge: /about → /why-wcp
// (docs/PENDING.md queue; dry-run by default)
// =============================================================================
// /about and /why-wcp overlap heavily; the IA doctrine keeps ONE belief page.
// Moves about's unique sections into why-wcp, redirects, deletes:
//   1. why-wcp gains, after the seed-signature band: the 55-years story prose
//      (k26), the teachers section (k31), and the facilities grid (k39).
//      (about's beliefs grid k30 duplicates why-wcp's six reasons; its
//      splitMedia pp-about-grad and CTA k41 are dropped as duplicates too.)
//   2. Create a redirect doc /about → /why-wcp.
//   3. Delete page-about.
// AFTER COMMITTING: code close-outs in docs/PENDING.md (drop /about from
// tests/routes.ts + the footer "Our Story" link, add the astro.config
// redirect).
//   node scripts/patch-merge-about-into-why-wcp.mjs            # dry run
//   node scripts/patch-merge-about-into-why-wcp.mjs --commit
// =============================================================================
import { client, apply, done, COMMIT } from './patch-lib.mjs';

const why = await client.getDocument('page-why-wcp');
const about = await client.getDocument('page-about');
if (!why) throw new Error('page-why-wcp not found');
let n = 0;

const KEEP_KEYS = ['k26', 'k31', 'k39'];
const already = (why.sections ?? []).some((s) => KEEP_KEYS.includes(s._key));
if (!already && about) {
  const moved = (about.sections ?? []).filter((s) => KEEP_KEYS.includes(s._key));
  if (moved.length > 0) {
    n++;
    await apply(
      `insert ${moved.length} about-section(s) (${moved.map((s) => s._key).join(', ')}) after seed-signature on why-wcp`,
      () =>
        client
          .patch('page-why-wcp')
          .insert('after', 'sections[_key=="seed-signature"]', moved)
          .commit(),
    );
  }
}

const redirect = await client.fetch(`*[_type == "redirect" && from == "/about"][0]._id`);
if (!redirect) {
  n++;
  await apply('create redirect /about → /why-wcp', () =>
    client.create({ _type: 'redirect', permanent: true, from: '/about', to: '/why-wcp' }),
  );
}

if (about) {
  n++;
  await apply('delete page-about', () => client.delete('page-about'));
}

done(n);
if (COMMIT) console.log('NOW do the code close-outs listed in docs/PENDING.md for this script.');
