// =============================================================================
// seed-super-helper-page.mjs — the certification PROCEDURE becomes Board data
// =============================================================================
// Creates `hubPage-super-helper` (hubKey "super-helper") holding the
// step-by-step certification and background-check-renewal sections that used
// to live only in code: OCCRRA course names and numbers, the fingerprinting
// fee and locations, the program number — the fastest-staling facts on the
// hub. Once this document exists, the page renders ITS sections and the Board
// edits fees and course codes in the Studio; the committed copy in
// super-helper.astro remains the never-blank fallback.
//
// The intro + "What it takes" grid are NOT seeded: they stay derived from Hub
// settings → Super Helper program (P2), so the requirement list keeps one
// source for the band and the page.
//
// Idempotent: skips when the doc already exists (never overwrites Board
// edits). Dry-run by default; pass --apply to write.
//   node scripts/seed-super-helper-page.mjs --apply
// =============================================================================
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const SITE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const token = (readFileSync(`${SITE_DIR}/.dev.vars`, 'utf8').match(/SANITY_TOKEN="([^"]+)"/) ||
  [])[1];
if (!token) throw new Error('no SANITY_TOKEN in .dev.vars');
const client = createClient({
  projectId: 'niemhgev',
  dataset: 'production',
  apiVersion: '2025-01-01',
  token,
  useCdn: false,
});

const APPLY = process.argv.includes('--apply');
const ID = 'hubPage-super-helper';
// The address every ADMIN mention points at — Site settings' emailAdmin is
// what the PAGE uses for its fallback copy; the seeded text names the address
// visibly so the Board sees (and can edit) exactly what families read.
const ADMIN = 'admin@westchesterpreschool.org';

const doc = {
  _id: ID,
  _type: 'hubPage',
  title: 'Become a Super Helper',
  hubKey: 'super-helper',
  heading: '',
  sections: [
    {
      _type: 'stepListSection',
      _key: 'sh-online',
      background: 'white',
      header: {
        _type: 'sectionHeader',
        title: 'Online training, step by step',
        lead: 'Both courses live in your OCCRRA account and are free.',
        align: 'center',
      },
      steps: [
        {
          _key: 'sh-o1',
          title: 'Log into OCCRRA',
          body: 'Sign into your OCCRRA account and choose the "Training Search" tab on the left.',
        },
        {
          _key: 'sh-o2',
          title: 'Add the Orientation training',
          body: 'Search "DCY Child Care Staff Orientation Training" and pick the free, online (no date or time), 7.00 contact-hour class (course AT144793, section ST10163195). Add it to your cart and check out.',
        },
        {
          _key: 'sh-o3',
          title: 'Add the Child Abuse training',
          body: 'Do the same for "DCY Child Abuse and Neglect Recognition and Mandated Reporting Requirements".',
        },
        {
          _key: 'sh-o4',
          title: 'Complete both courses',
          body: 'Find each class under your "Professional Development" tab. The link to the training itself is in the class details.',
        },
        {
          _key: 'sh-o5',
          title: 'Tell the Administrator',
          body: `Once both are done, send a quick note to ${ADMIN}.`,
        },
      ],
    },
    {
      _type: 'stepListSection',
      _key: 'sh-cpr',
      background: 'white',
      header: {
        _type: 'sectionHeader',
        title: 'CPR & First Aid, step by step',
        lead: 'This part is in person, so give yourself a little lead time to book a class.',
        align: 'center',
      },
      steps: [
        {
          _key: 'sh-c1',
          title: 'Book an in-person class',
          body: 'You need both Adult and Pediatric CPR and First Aid, in person, certified by the State of Ohio. An "Online plus Classroom" combo is fine as long as it includes the in-person portion.',
        },
        {
          _key: 'sh-c2',
          title: 'We recommend Red Cross',
          body: 'Go to redcross.org/take-a-class, choose CPR, and enter your zip code. Filter Class Focus to "Adult And Pediatric CPR/AED" (for example, "Adult And Pediatric First Aid/CPR/AED"). Many classes have an online part to finish before the in-person session.',
          note: 'Register and pay directly with the provider.',
        },
        {
          _key: 'sh-c3',
          title: 'Send your certificate',
          body: `Forward an electronic copy of your 8.5x11 completion certificate to ${ADMIN}.`,
        },
        {
          _key: 'sh-c4',
          title: 'Log it in OCCRRA',
          body: 'Under "Professional Development", click "+ Add Training", enter the class title (copy it from your certificate) and the date completed, and upload your certificate PDF.',
        },
      ],
    },
    {
      _type: 'cardGridSection',
      _key: 'sh-proof',
      background: 'white',
      columns: 1,
      header: { _type: 'sectionHeader', title: 'Proof of education', align: 'center' },
      cards: [
        {
          _key: 'sh-proof-c',
          icon: 'graduation-cap',
          chip: 'green',
          title: 'The last step',
          body: `Submit an official transcript or diploma showing you finished high school or college to ${ADMIN}. Once your CPR certificate and proof of education are in and both online courses are done, you are a certified Super Helper. Welcome to the classroom!`,
        },
      ],
    },
    {
      _type: 'stepListSection',
      _key: 'sh-renew',
      background: 'grey',
      header: {
        _type: 'sectionHeader',
        title: 'Already a Super Helper? Renew your background check',
        lead: 'Ohio requires a new background check at least every five years, and our insurance requires one every two. If you have not worked in the classroom for six months or more, you also need a new Employee Medical Statement.',
        align: 'center',
      },
      steps: [
        {
          _key: 'sh-r1',
          title: 'Get fingerprinted',
          body: 'Request BOTH state and federal checks (codes 5104.013 for BCI and CCDBGA for FBI). Bring these instructions, your completed WebCheck application, and a photo ID. It is $65. Locations include the Butler County Sheriff (Hamilton) and the Warren County Sheriff (Lebanon or the Deerfield Township post in Mason). Call ahead, since hours vary and some require appointments.',
          note: `Email ${ADMIN} once you are fingerprinted.`,
        },
        {
          _key: 'sh-r2',
          title: 'Request the check in OCCRRA within 7 days',
          body: 'Log in, then Account, then "Request Background Check". Role: Employee. Reason: Five Year Renewal (choose this even if it has been less than five years). Start date: September 1 of the school year. When prompted for the program, enter "West Chester Co-op" or number 204552. If you have had a check in the last five years and worked in the last six months, add the note: "I obtained FBI/BCI results within the past five years but would like to renew early for insurance purposes." Sign, submit, and save the confirmation number.',
        },
        {
          _key: 'sh-r3',
          title: 'Notify the Administrator',
          body: `Email ${ADMIN} once all steps are done. Results usually arrive within about two weeks, and the school gets a copy too.`,
        },
      ],
    },
    {
      _type: 'ctaSection',
      _key: 'sh-cta',
      title: 'Questions about any of this?',
      lead: 'The Administrator is our paperwork wizard and is always happy to walk you through a step.',
      tone: 'navy',
      actions: [
        {
          _key: 'sh-cta-a',
          label: 'Email the Administrator',
          style: 'accent',
          linkType: 'url',
          url: `mailto:${ADMIN}`,
        },
      ],
    },
  ],
};

const existing = await client.fetch('*[_id in [$id, "drafts." + $id]][0]._id', { id: ID });
if (existing) {
  console.log(`✓ ${existing} already exists — leaving the Board's copy alone.`);
} else if (!APPLY) {
  console.log(
    `DRY RUN: would create ${ID} with ${doc.sections.length} sections. Re-run with --apply.`,
  );
} else {
  await client.createIfNotExists(doc);
  console.log(`✓ created ${ID} — the certification procedure is Board-editable now.`);
}
