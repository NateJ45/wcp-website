// =============================================================================
// patch-interest-list.mjs — the low-commitment rung (docs/PENDING.md queue;
// dry-run by default)
// =============================================================================
// The 2026-07-14 spec's interest-list CTA never shipped: a July browser who is
// not ready to tour has only a form or a phone call. Adds a minimal
// newsletterSignupSection ("Not ready to visit yet?") to home and /tuition,
// right before each page's closing CTA. Uses the existing /api/subscribe
// plumbing — no new code needed.
//   node scripts/patch-interest-list.mjs            # dry run
//   node scripts/patch-interest-list.mjs --commit
// =============================================================================
import { client, apply, done } from './patch-lib.mjs';

const rung = (key) => ({
  _type: 'newsletterSignupSection',
  _key: key,
  background: 'cream',
  header: {
    title: 'Not ready to visit yet?',
    lead: 'Join our interest list and we will keep you posted on open houses and enrollment.',
  },
});

let n = 0;
for (const [pageId, beforeKey, key] of [
  ['page-home', 'k15', 'seed-interest-home'],
  ['page-tuition', 'k67', 'seed-interest-tuition'],
]) {
  const doc = await client.getDocument(pageId);
  if (!doc) {
    console.log(`skip: ${pageId} not found`);
    continue;
  }
  if ((doc.sections ?? []).some((s) => s._key === key)) continue; // idempotent
  const anchorExists = (doc.sections ?? []).some((s) => s._key === beforeKey);
  n++;
  await apply(
    `${pageId}: insert interest-list rung ${anchorExists ? `before ${beforeKey}` : 'at end'}`,
    () =>
      anchorExists
        ? client
            .patch(pageId)
            .insert('before', `sections[_key=="${beforeKey}"]`, [rung(key)])
            .commit()
        : client
            .patch(pageId)
            .append('sections', [rung(key)])
            .commit(),
  );
}
done(n);
