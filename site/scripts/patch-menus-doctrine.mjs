// =============================================================================
// patch-menus-doctrine.mjs — sync the Sanity Menus doc to the code nav doctrine
// (docs/PENDING.md queue; dry-run by default)
// =============================================================================
// The IA redesign made the nav code-owned (resolveNavigation bypasses the
// Menus doc). This script is reconcile option (a): write the five-item funnel
// doctrine INTO the navigation singleton so the doc matches the site, after
// which src/lib/nav.ts can swap back to resolveNavigationFromDoc and volunteer
// menu editing can resume (also remove the paused-note from the in-Studio
// guide). Mirrors src/data/nav.ts EXACTLY — if the doctrine changed there,
// update this script before running.
//   node scripts/patch-menus-doctrine.mjs            # dry run
//   node scripts/patch-menus-doctrine.mjs --commit
// =============================================================================
import { client, apply, done, COMMIT } from './patch-lib.mjs';

let k = 0;
const key = () => `nav${(k++).toString(36).padStart(3, '0')}`;
const page = (label, slug) => ({
  _key: key(),
  _type: 'navLink',
  label,
  linkType: 'page',
  pageSlug: slug,
});
const url = (label, u) => ({ _key: key(), _type: 'navLink', label, linkType: 'url', url: u });
const group = (label, children) => ({ _key: key(), _type: 'navGroup', label, children });

const mainNav = [
  group('Classes', [
    page('Twos Class', 'classes/twos'),
    page('Threes Class', 'classes/threes'),
    page('Pre-K Class', 'classes/pre-k'),
    page('A Day at WCP', 'a-day-at-wcp'),
  ]),
  group('Why WCP', [
    page('Why Families Choose Us', 'why-wcp'),
    page('Co-op Life', 'co-op-life'),
    page('Safety & Wellness', 'safety'),
    page('What Families Say', 'reviews'),
  ]),
  page('Tuition', 'tuition'),
  page('Visit', 'virtual-tour'),
  page('Enroll', 'enroll'),
];

const footerColumns = [
  {
    _key: key(),
    label: 'Classes',
    links: [
      page('Twos Class', 'classes/twos'),
      page('Threes Class', 'classes/threes'),
      page('Pre-K Class', 'classes/pre-k'),
      page('A Day at WCP', 'a-day-at-wcp'),
      page('Co-op Life', 'co-op-life'),
    ],
  },
  {
    _key: key(),
    label: 'About',
    links: [
      // NOTE: drop "Our Story" here after the /about merge runs.
      page('Our Story', 'about'),
      page('Why WCP?', 'why-wcp'),
      page('Safety & Wellness', 'safety'),
      page('What Families Say', 'reviews'),
      page('FAQ', 'faq'),
      page('News', 'news'),
      page('Events', 'events'),
    ],
  },
  {
    _key: key(),
    label: 'Get Started',
    links: [
      page('Tuition & Fees', 'tuition'),
      url('Schedule a Tour', '/virtual-tour#sec-pp-tour-form'),
      page('Virtual Tour', 'virtual-tour'),
      page('Enroll', 'enroll'),
      // NOTE: retarget to virtual-tour after the /contact merge runs.
      page('Contact', 'contact'),
    ],
  },
  {
    _key: key(),
    label: 'Community',
    links: [
      url('Enrolled Families', '/family-hub'),
      page('Work With Us', 'work-with-us'),
      page('Donate', 'donate'),
      page('Newsletter', 'newsletter'),
      url('Store', 'https://store.westchesterpreschool.org'),
    ],
  },
];

const legalNav = [
  page('Accessibility', 'accessibility'),
  page('Privacy', 'privacy'),
  page('Terms of Use', 'terms'),
];

const existing = await client.fetch(`*[_type == "navigation"][0]{_id, "n": count(mainNav)}`);
if (!existing?._id) throw new Error('navigation singleton not found');
await apply(
  `overwrite navigation ${existing._id} (currently ${existing.n} top-level items) with the 5-item funnel doctrine`,
  () => client.patch(existing._id).set({ mainNav, footerColumns, legalNav }).commit(),
);
done(1);
if (COMMIT)
  console.log(
    'NOW: swap resolveNavigation back to resolveNavigationFromDoc (src/lib/nav.ts), remove the paused-note from the menus guide, and delete this PENDING row.',
  );
