// =============================================================================
// patch-merge-contact-into-visit.mjs — IA merge: /contact + /virtual-tour →
// one "Visit Us" page (docs/PENDING.md queue; dry-run by default)
// =============================================================================
// Persists what the code doctrine (src/lib/page-doctrine.ts) already renders,
// then finishes the merge:
//   1. page-virtual-tour: retitle "Visit Us"; hero title/lead → the visit ask;
//      move the pp-tour-form section FIRST; append /contact's contactDetails
//      (k82) and FAQ (pp-contact-faq) sections before the closing CTA.
//   2. Create a redirect doc /contact → /virtual-tour.
//   3. Delete page-contact.
// Idempotent: each step checks current state first. AFTER COMMITTING, do the
// code close-outs listed in docs/PENDING.md (delete the virtual-tour entries
// from HERO_OVERRIDES / SECTION_HOIST / SECTION_APPEND, drop /contact from
// tests/routes.ts + the footer nav, add /contact to the astro.config redirect
// map as belt-and-suspenders).
//   node scripts/patch-merge-contact-into-visit.mjs            # dry run
//   node scripts/patch-merge-contact-into-visit.mjs --commit
// =============================================================================
import { client, apply, done, COMMIT } from './patch-lib.mjs';

const vt = await client.getDocument('page-virtual-tour');
const contact = await client.getDocument('page-contact');
if (!vt) throw new Error('page-virtual-tour not found');
let n = 0;

// -- 1a. Title + hero ---------------------------------------------------------
if (vt.title !== 'Visit Us') {
  n++;
  await apply(`page title "${vt.title}" → "Visit Us" (+ hero visit ask)`, () =>
    client
      .patch('page-virtual-tour')
      .set({
        title: 'Visit Us',
        'hero.title': 'Come see a morning.',
        'hero.accentWord': 'see',
        'hero.lead':
          'Tours are casual and low-pressure, and kids are welcome. Walk the classrooms, meet the teachers, and ask us anything.',
      })
      .commit(),
  );
}

// -- 1b. Tour form first ------------------------------------------------------
const sections = vt.sections ?? [];
const formIdx = sections.findIndex((s) => s._key === 'pp-tour-form');
if (formIdx > 0) {
  n++;
  const reordered = [sections[formIdx], ...sections.filter((s) => s._key !== 'pp-tour-form')];
  await apply(`move pp-tour-form from position ${formIdx} to 0`, () =>
    client.patch('page-virtual-tour').set({ sections: reordered }).commit(),
  );
}

// -- 1c. Absorb contact's details + FAQ sections ------------------------------
const hasContactDetails = sections.some((s) => s._type === 'contactDetailsSection');
if (!hasContactDetails && contact) {
  const absorb = (contact.sections ?? []).filter((s) =>
    ['contactDetailsSection', 'faqSection'].includes(s._type),
  );
  if (absorb.length > 0) {
    n++;
    await apply(`append ${absorb.length} section(s) from /contact before the closing CTA`, () =>
      client.patch('page-virtual-tour').insert('before', 'sections[_key=="k272"]', absorb).commit(),
    );
  }
}

// -- 2. Redirect doc ----------------------------------------------------------
const redirect = await client.fetch(`*[_type == "redirect" && from == "/contact"][0]._id`);
if (!redirect) {
  n++;
  await apply('create redirect /contact → /virtual-tour', () =>
    client.create({ _type: 'redirect', permanent: true, from: '/contact', to: '/virtual-tour' }),
  );
}

// -- 3. Delete the contact page ----------------------------------------------
if (contact) {
  n++;
  await apply('delete page-contact', () => client.delete('page-contact'));
}

done(n);
if (COMMIT) console.log('NOW do the code close-outs listed in docs/PENDING.md for this script.');
