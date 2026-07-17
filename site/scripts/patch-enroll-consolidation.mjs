// =============================================================================
// patch-enroll-consolidation.mjs — one mental model on /enroll
// (docs/PENDING.md queue; dry-run by default)
// =============================================================================
// The audit's /enroll P1: the page teaches TWO conflicting 3-step models
// (cardGrid k219 "Enrolling takes three steps" near the top AND stepList
// seed-enroll-steps "How enrolling works" at the bottom), duplicates the full
// tuition table (pp-enroll-tuition), and hides its form ~6 screens down with
// no anchor. This script:
//   1. Deletes the k219 cardGrid (the stepList version is richer; keep ONE).
//   2. Moves seed-enroll-steps to the FRONT so the canonical Tour → Choose →
//      Register story opens the page.
//   3. Replaces the duplicated tuition table (pp-enroll-tuition) with a short
//      prose pointer to /tuition.
//   4. Adds a third hero action "Send an inquiry" → #sec-pp-enroll-form.
//   node scripts/patch-enroll-consolidation.mjs            # dry run
//   node scripts/patch-enroll-consolidation.mjs --commit
// =============================================================================
import { client, apply, done } from './patch-lib.mjs';

const doc = await client.getDocument('page-enroll');
if (!doc) throw new Error('page-enroll not found');
let n = 0;
let sections = doc.sections ?? [];

// 1 + 2 + 3 build ONE new sections array, applied in a single set().
const hasDup = sections.some((s) => s._key === 'k219');
const steps = sections.find((s) => s._key === 'seed-enroll-steps');
const tuitionIdx = sections.findIndex((s) => s._key === 'pp-enroll-tuition');
if (hasDup || tuitionIdx >= 0 || sections[0]?._key !== 'seed-enroll-steps') {
  n++;
  let next = sections.filter((s) => s._key !== 'k219' && s._key !== 'seed-enroll-steps');
  if (steps) next = [steps, ...next];
  const ti = next.findIndex((s) => s._key === 'pp-enroll-tuition');
  if (ti >= 0) {
    next[ti] = {
      _type: 'proseSection',
      _key: 'seed-enroll-tuition-pointer',
      background: 'white',
      header: {
        title: 'Clear, affordable pricing',
        lead: 'Tuition runs $70 to $200 a month depending on the class, with every fee published.',
      },
      body: [
        {
          _type: 'block',
          _key: 'b1',
          style: 'normal',
          markDefs: [{ _type: 'link', _key: 'l1', linkType: 'page', pageSlug: 'tuition' }],
          children: [
            { _type: 'span', _key: 's1', text: 'See the full breakdown on the ' },
            { _type: 'span', _key: 's2', marks: ['l1'], text: 'tuition page' },
            { _type: 'span', _key: 's3', text: '.' },
          ],
        },
      ],
    };
  }
  await apply(
    'enroll sections: drop dup steps (k219), hoist seed-enroll-steps first, tuition table → pointer',
    () => client.patch('page-enroll').set({ sections: next }).commit(),
  );
}

// 4. Hero: third action anchoring to the on-page form.
const actions = doc.hero?.actions ?? [];
if (!actions.some((a) => (a.url ?? '').includes('sec-pp-enroll-form'))) {
  n++;
  await apply('hero: add "Send an inquiry" → #sec-pp-enroll-form', () =>
    client
      .patch('page-enroll')
      .append('hero.actions', [
        {
          _key: 'seed-inquiry-anchor',
          label: 'Send an inquiry',
          style: 'outline-white',
          linkType: 'url',
          url: '#sec-pp-enroll-form',
        },
      ])
      .commit(),
  );
}

done(n);
