// =============================================================================
// Page doctrine — code-owned per-page IA fixes that can't wait for the quota
// =============================================================================
// The IA redesign (2026-07-17) needs content-shaped changes while Sanity
// writes are frozen. This file holds the CODE-side layer: hero overrides,
// section reordering, and synthetic section injection, applied by
// [...slug].astro (hero) and SectionRenderer (sections) for PUBLIC pages only.
// Every entry that duplicates future Sanity content is a STOPGAP with a
// close-out registered in docs/PENDING.md (the matching patch scripts persist
// the same change into the docs, then these entries get deleted).
// =============================================================================
import type { SectionData } from '@/components/sections/section-helpers';

/** Hero field overrides (STOPGAP: content-in-code until the merge patches). */
export const HERO_OVERRIDES: Record<
  string,
  { title?: string; accentWord?: string; lead?: string }
> = {
  // The Visit page doctrine: /virtual-tour is becoming the merged "Visit Us"
  // page; until the content patch lands, the hero leads with the visit ask
  // instead of "take a look around" (the tour form is hoisted to the top by
  // SECTION_HOIST below).
  'virtual-tour': {
    title: 'Come see a morning.',
    accentWord: 'see',
    lead: 'Tours are casual and low-pressure, and kids are welcome. Walk the classrooms, meet the teachers, and ask us anything.',
  },
};

/** Sections (by _key) hoisted to the FRONT of a page, in the given order. */
export const SECTION_HOIST: Record<string, string[]> = {
  // The tour-request form was 7th of 8 sections on the page every tour CTA
  // lands on. Form first; the look-around content sells the visit below it.
  'virtual-tour': ['pp-tour-form'],
  // Money pages front-load the money (Phase 0: the first dollar figure painted
  // in mobile viewport FOUR on /tuition). The fee table rides directly under
  // the "Every fee, published" opener; the co-op explainer sells below it.
  tuition: ['k53'],
  // The tour-first step list leads /enroll (mirrors the queued
  // patch-enroll-consolidation script; see PENDING.md).
  enroll: ['seed-enroll-steps'],
};

/** Sections (by _key, or 'type:<sectionType>') REMOVED from a page's render.
 *  STOPGAPS mirroring queued Sanity patches (rows in docs/PENDING.md): the
 *  content stays untouched in the Studio; these hide it at render time the
 *  same way the fundraising statBand drop works on the hub. */
export const SECTION_DROP: Record<string, string[]> = {
  // /enroll ran TWO contradictory step lists (k219 "Enrolling takes three
  // steps" vs seed-enroll-steps "How enrolling works" — tour-first wins), a
  // full duplicate of the /tuition fee table (the class picker + tuition link
  // cover it), and a post-form "Not sure which class fits?" band that
  // re-routed people backward right after they acted.
  enroll: ['k219', 'pp-enroll-tuition', 'k234'],
  // Home: the stat-box band's numbers all live one band up in the class cards
  // ($70/mo etc.) and the heritage strip now owns that slot (photo-moments).
  // hp-visit goes too: VisitBlock (photo-moments 'visit') replaces it so the
  // visit details get their photo back — a proseSection has no image slot.
  // k20 (Latest from WCP) is OFF the home page by Nathan's call 2026-07-19:
  // two posts is not a news habit yet, and a thin blog teaser between the
  // testimonials and the Instagram wall reads as an unfinished section. The
  // /news routes, the post docs and the RSS feed all stay live and reachable;
  // only the home teaser and the footer nav entry are hidden, so restoring it
  // is deleting this key. Also dropped from the footer nav in src/data/nav.ts.
  home: ['type:statBandSection', 'hp-visit', 'k20'],
  // /why-wcp: the stat band said "$70 tuition from" two scrolls above the
  // compare table's "$175-$200" for a 4-year-old (reads as bait), and "100%
  // Ohio licensed" is a binary dressed as a metric. The compare table is the
  // page's one honest numbers moment.
  'why-wcp': ['type:statBandSection'],
  // /safety: Nathan cut the stat band outright (2026-07-19, reviewing the
  // adjacency fix that had flipped it white under the navy hero) — the 4.8
  // rating already rides the hero proof line and the closer's rating slip,
  // and class size / staffing live in the "Secure, on purpose" list below.
  safety: ['type:statBandSection'],
  // /classes/pre-k ran TWO curriculum bands (13 cards total; "What WCP Pre-K
  // graduates walk in with" restated "What your Pre-K child learns" in shorter
  // form, ~3 phone viewports of it). One curriculum moment per page.
  'classes/pre-k': ['k374'],
  // /a-day-at-wcp: four near-identical 7-step schedule timelines in a row
  // (~5.5 phone viewports). Replaced by the class-cards insert below; the
  // exact schedules live on each class page.
  'a-day-at-wcp': ['k91', 'k98', 'k106', 'k114'],
};

/** Header text overrides by page + section _key (STOPGAP content-in-code,
 *  PENDING.md rows; visitor-facing copy follows the house voice rules). */
export const SECTION_HEADER_OVERRIDES: Record<
  string,
  Record<string, { title?: string; lead?: string; eyebrow?: string }>
> = {
  enroll: {
    // The enroll page's only action was titled "Ask about enrolling" and the
    // actual enrollment mechanism was never stated anywhere (Phase 0).
    'pp-enroll-form': {
      title: 'Start your enrollment',
      lead: 'Send this and we will reach out to set up your tour. You get the enrollment packet there, and we walk you through the rest.',
    },
  },
};

/** Action href overrides, by page → section `_key` → ACTION INDEX (STOPGAP
 *  content-in-code; PENDING.md row).
 *
 *  Indexed rather than matched on the button label, because stega encodes every
 *  display string in the /preview path: `label === 'Schedule a Tour'` is false
 *  there (see the stega gotcha in CLAUDE.md), so a label-keyed override would
 *  silently stop applying inside the Studio preview while working in prod. */
export const SECTION_ACTION_HREFS: Record<string, Record<string, Record<number, string>>> = {
  home: {
    // The home closer's SECOND button says "Schedule a Tour" but was stored
    // pointing at /enroll, so both buttons in the band went to the same page
    // and the tour ask — the site's primary conversion doctrine — was
    // unreachable from the band built to make it.
    //
    // Only this one was wrong because PageHero SYNTHESIZES its tour action in
    // code (PageHero.astro), so every hero was immune; CtaSection passes stored
    // actions straight through. ChooserRows already hardcodes the right URL.
    // patch-tour-links.mjs persists this into Sanity once the quota clears.
    k15: { 1: '/virtual-tour#sec-pp-tour-form' },
  },
};

/** Synthetic sections appended to a page (rendered by the normal bridges). */
export const SECTION_APPEND: Record<string, SectionData[]> = {
  // Visit-page assembly: contact details join the tour page so "how do I
  // reach you" lives where visitors act (the /contact merge persists this).
  'virtual-tour': [
    { _type: 'contactDetailsSection', _key: 'code-visit-contact', background: 'grey' },
  ],
  // /reviews ended by asking CURRENT parents for reviews while giving the
  // prospect who just read every quote no path at all (Phase 0: both CTAs
  // were outbound to Google). A tour closer ends the proof page on the ask
  // that matters; it renders as the amber drench + rating slip (closing-band
  // doctrine).
  reviews: [
    {
      _type: 'ctaSection',
      _key: 'code-reviews-tour',
      tone: 'navy',
      title: 'Come see it for yourself.',
      lead: 'Tours are casual and low-pressure, and kids are welcome.',
      actions: [
        {
          label: 'Schedule a Tour',
          style: 'accent',
          linkType: 'url',
          url: '/virtual-tour#sec-pp-tour-form',
        },
      ],
    } as unknown as SectionData,
  ],
};

/** Synthetic sections spliced in AFTER a named section (by _key), applied
 *  after drops/hoists so the anchor is the final order. */
export const SECTION_INSERT_AFTER: Record<string, Record<string, SectionData[]>> = {
  // /tuition: the interactive estimator sits directly under the published fee
  // table. The tuitionCalculatorSection component already existed but was on NO
  // page (verified against the built HTML) — it needs a Sanity page edit to
  // place, which the quota freeze blocks, so it is injected here instead.
  // It is config-only: every price comes from the Classes + Fee Schedule docs
  // at build time, so this synthetic section carries no numbers of its own.
  tuition: {
    k53: [
      {
        _type: 'tuitionCalculatorSection',
        _key: 'code-tuition-calc',
        background: 'grey',
        header: {
          title: 'What will your year cost?',
          lead: 'Tick the class you are considering. Every fee is in here, including the deposit you get back.',
        },
        note: 'An estimate for planning. Tuition is billed monthly, September through May.',
      } as unknown as SectionData,
    ],
  },
  // /a-day-at-wcp: the four near-identical schedule timelines are replaced by
  // ONE compact answer — the drenched class cards (days, hours, price, link
  // per class), pulled from the class docs at build time. The storyTimeline
  // above carries the day's rhythm; exact schedules live on each class page.
  'a-day-at-wcp': {
    'pp-day-story': [
      {
        _type: 'classCardsSection',
        _key: 'code-day-classes',
        background: 'white',
        pullAll: true,
        header: {
          title: 'When each class meets',
          lead: 'The rhythm is the same for everyone; the days and hours differ by class.',
        },
      } as unknown as SectionData,
    ],
  },
};

// Act II grammar: cardGridSections render as the ruled "sign-up sheet" list by
// default on public pages (the icon-card grid was the site's loudest AI tell,
// 40+ instances). A grid earns REAL cards back only by page + section _key,
// decided during the route walks (e.g. month/tradition grids whose chips and
// colors do compositional work). Applied by SectionRenderer as a data-cards
// attribute the grammar CSS reads.
export const CARDGRID_KEEP_CARDS: Record<string, string[]> = {
  // The "year full of things" month/tradition grids: month chips + per-card
  // color edges do real compositional work (route-walk call, 2026-07-18).
  'why-wcp': ['k198'],
  'co-op-life': ['k157'],
};

// The footer seam fills with the FINAL band's color (the sweep at the footer
// boundary works exactly like every section seam: the band above bulges into
// the footer's photo treatment). Mirrors the renderer's doctrine order and the
// amber-closer rule so the fill always matches what actually rendered last.
import { effectiveBg } from '@/components/sections/section-helpers';

export function finalBandBg(rawSections: SectionData[], pageSlug: string): string {
  let sections = [...rawSections];
  const dropKeys = SECTION_DROP[pageSlug] ?? [];
  if (dropKeys.length > 0) {
    sections = sections.filter(
      (s) => !dropKeys.includes(s._key) && !dropKeys.includes(`type:${s._type}`),
    );
  }
  sections = [...sections, ...(SECTION_APPEND[pageSlug] ?? [])];
  const bands = sections.filter((s) => s._type !== 'noticeBarSection');
  const last = bands[bands.length - 1];
  if (!last) return 'white';
  let bg = effectiveBg(last);
  // Mirror the renderer's navy-adjacency recolor: a non-closer navy band that
  // follows another navy renders white.
  const prev = bands[bands.length - 2];
  if (bg === 'navy' && last._type !== 'ctaSection' && prev && effectiveBg(prev) === 'navy') {
    bg = 'white';
  }
  return bg;
}
