// =============================================================================
// Site identity — single source of truth
// =============================================================================
// CODE, but safe to edit these values. Every component that shows the school's
// name, address, phone, or email imports from here — never hardcode those
// strings in a component. (Anything a board member changes often — tuition,
// dates, staff bios, FAQ — will live in Sanity instead; this file holds the
// stable identity facts that rarely change.)
// =============================================================================

export const site = {
  name: 'West Chester Preschool',
  shortName: 'WCP',
  founded: 1969,
  tagline: 'A parent-run cooperative preschool in West Chester, Ohio.',

  // Canonical URL — keep in sync with `site` in astro.config.mjs.
  url: 'https://www.westchesterpreschool.org',

  // Location — inside Crestview Presbyterian Church (no religious affiliation).
  address: {
    street: '9463 Cincinnati Columbus Rd',
    city: 'West Chester',
    state: 'OH',
    zip: '45069',
  },

  phone: '(513) 202-6187',

  email: {
    general: 'president@westchesterpreschool.org',
    admin: 'admin@westchesterpreschool.org',
    contact: 'contact@westchesterpreschool.org',
    treasurer: 'treasurer@westchesterpreschool.org', // donations / tax questions
  },

  teachers: {
    lisa: 'lisa@westchesterpreschool.org', // Mrs. Lisa Cortez, Pre-K
    erin: 'erin@westchesterpreschool.org', // Mrs. Erin Schmerr, Threes/Twos
  },

  // Ohio license. Regulated by ODJFS (Ohio Dept. of Job & Family Services)
  // under Day Care Licensing Code 5101:2-12. Secular, non-discriminatory.
  // (Confirmed against the live site's FAQ, 2026-07.)
  license: 'Ohio Day Care Licensing Code 5101:2-12',
  licenseAuthority: 'ODJFS',

  // School year follows the Lakota Local School District calendar (Sept–May).
  calendar: 'Follows the Lakota Local School District calendar (September–May).',

  // Social links (fallback). The real source is Sanity Site Settings → Social,
  // which the header/footer read via getSiteSettings; these are the build-time
  // fallback so the icons still render if that read ever fails. The header/footer
  // icon row only renders an icon when its URL is set, so no dead/fake links.
  social: {
    facebook: 'https://www.facebook.com/westchesterpreschool',
    instagram: 'https://www.instagram.com/westchesterpreschool',
  },
} as const;

// The Family Handbook PDF (2026/2027), uploaded to Sanity's asset CDN. This is
// a school-wide document families reference all year, so it lives here as a
// stable site constant — linked from the hub topbar and the hub-home handbook
// widget. (A Sanity CDN file, NOT a Google share-by-link resource, so it's fine
// to commit; if the handbook is re-uploaded, update this one URL.)
export const familyHandbookUrl =
  'https://cdn.sanity.io/files/niemhgev/production/0817c54b835d67dd03f395e534f11879a02cca65.pdf';
