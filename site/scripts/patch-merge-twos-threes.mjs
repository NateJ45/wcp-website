// =============================================================================
// patch-merge-twos-threes.mjs — one doc for the one Twos & Threes page
// =============================================================================
// The merged /family-hub/twos-threes page always rendered ONLY the
// `hubPage-twos` doc ("identical handbook"), while `hubPage-threes` rendered
// nowhere and silently drifted (14 vs 15 sections). This makes the content
// model match the page model: ONE `hubPage-twos-threes` doc.
//
// TWO PHASES, because the hub reads at request time and the code must switch
// keys between them:
//   --commit    copies hubPage-twos → hubPage-twos-threes (hubKey
//               "twos-threes"). Run BEFORE deploying the code that reads the
//               new key. Idempotent: skips when the new doc exists.
//   --cleanup   AFTER the deploy is live: snapshots hubPage-twos and
//               hubPage-threes into Recently deleted (trashedItem, same shape
//               as the Studio's Archive action, so Restore works) and deletes
//               the originals. Refuses while hubPage-twos-threes is missing.
//
//   node scripts/patch-merge-twos-threes.mjs             # dry run of --commit
// =============================================================================
import { client, COMMIT, apply, done } from './patch-lib.mjs';

const CLEANUP = process.argv.includes('--cleanup');
let n = 0;

if (!CLEANUP) {
  // Phase 1: create the merged doc from the doc that actually renders.
  const existing = await client.fetch('*[_id == "hubPage-twos-threes"][0]{ _id }');
  if (existing) {
    console.log('hubPage-twos-threes already exists — nothing to do.');
  } else {
    const twos = await client.fetch('*[_id == "hubPage-twos"][0]');
    if (!twos) throw new Error('hubPage-twos not found — nothing to copy.');
    n += 1;
    await apply('create hubPage-twos-threes from hubPage-twos', async () => {
      const { _id, _rev, _createdAt, _updatedAt, ...content } = twos;
      await client.create({
        ...content,
        _id: 'hubPage-twos-threes',
        _type: 'hubPage',
        hubKey: 'twos-threes',
        title: 'Twos & Threes classroom',
        heading: 'Twos & Threes Classroom',
      });
    });
  }
} else {
  // Phase 2: retire the old per-class docs into Recently deleted.
  const merged = await client.fetch('*[_id == "hubPage-twos-threes"][0]{ _id }');
  if (!merged) throw new Error('REFUSING cleanup: hubPage-twos-threes does not exist yet.');
  for (const id of ['hubPage-twos', 'hubPage-threes']) {
    const doc = await client.fetch('*[_id == $id][0]', { id });
    if (!doc) {
      console.log(`SKIP ${id}: already gone.`);
      continue;
    }
    const refs = await client.fetch('count(*[references($id)])', { id });
    if (refs > 0) {
      console.log(`SKIP ${id}: still referenced by ${refs} doc(s) — resolve those first.`);
      continue;
    }
    n += 1;
    await apply(`archive + delete ${id}`, async () => {
      const { _rev, _createdAt, _updatedAt, ...snapshot } = doc;
      await client.create({
        _type: 'trashedItem',
        title: `${doc.title ?? id} (pre-merge copy)`,
        originalType: 'hubPage',
        originalId: id,
        deletedAt: new Date().toISOString(),
        payload: JSON.stringify(snapshot),
      });
      await client.delete(id);
      await client.delete(`drafts.${id}`).catch(() => {});
    });
  }
}

done(n);
