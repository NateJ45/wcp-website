import { describe, expect, it } from 'vitest';
import {
  applyHubStopgaps,
  fundraisingDropSuperseded,
  prekSplitPetFromCta,
  twosCurriculumMonths,
} from './hub-stopgaps';

// The stored Twos/Threes curriculum had Easter + food and nutrition in APRIL;
// Erin's sheet puts them in MARCH. These cases pin the corrected split so a
// later edit can't quietly slide them back a month.
const curriculum = () => ({
  _type: 'scheduleSection',
  _key: 'k80',
  entries: [
    { _key: 'k86', time: 'Feb', title: 'Valentine’s Day, dental health, colors, my 5 senses' },
    { _key: 'k87', time: 'Mar', title: 'St. Patrick’s Day, fire safety' },
    {
      _key: 'k88',
      time: 'Apr',
      title: 'Easter, food and nutrition, spring, insects, rocks, weather',
    },
    { _key: 'k89', time: 'May', title: 'Mother’s Day, shells' },
  ],
});
const monthTitle = (sections: ReturnType<typeof curriculum>[], time: string) =>
  sections[0].entries.find((e) => e.time === time)?.title;

describe('twosCurriculumMonths', () => {
  it('moves Easter and food and nutrition from April into March', () => {
    const out = twosCurriculumMonths([curriculum()]) as ReturnType<typeof curriculum>[];
    expect(monthTitle(out, 'Mar')).toBe(
      'St. Patrick’s Day, fire safety, Easter, food and nutrition',
    );
    expect(monthTitle(out, 'Apr')).toBe('Spring, insects, rocks, weather');
  });

  it('leaves April free of March topics and vice versa', () => {
    const out = twosCurriculumMonths([curriculum()]) as ReturnType<typeof curriculum>[];
    expect(monthTitle(out, 'Apr')).not.toMatch(/easter|nutrition/i);
    expect(monthTitle(out, 'Mar')).toMatch(/easter/i);
  });

  it('does not disturb the other months', () => {
    const out = twosCurriculumMonths([curriculum()]) as ReturnType<typeof curriculum>[];
    expect(monthTitle(out, 'Feb')).toBe('Valentine’s Day, dental health, colors, my 5 senses');
    expect(monthTitle(out, 'May')).toBe('Mother’s Day, shells');
  });

  it('is idempotent — a corrected doc passes through untouched', () => {
    const once = twosCurriculumMonths([curriculum()]) as ReturnType<typeof curriculum>[];
    const twice = twosCurriculumMonths(once) as ReturnType<typeof curriculum>[];
    expect(twice).toEqual(once);
  });

  it('leaves the OTHER month-keyed schedule on the page alone (field trips)', () => {
    // The same page carries a field-trip schedule with its own Mar/Apr rows, so
    // matching on months alone would rewrite the wrong section.
    const fieldTrips = {
      _type: 'scheduleSection',
      _key: 'trips',
      entries: [
        { _key: 't1', time: 'Mar', title: 'Local fire station' },
        { _key: 't2', time: 'Apr', title: 'Creeking' },
      ],
    };
    expect(twosCurriculumMonths([fieldTrips])).toEqual([fieldTrips]);
  });

  it('fixes the curriculum even when the field-trip schedule sits alongside it', () => {
    const fieldTrips = {
      _type: 'scheduleSection',
      _key: 'trips',
      entries: [
        { _key: 't1', time: 'Mar', title: 'Local fire station' },
        { _key: 't2', time: 'Apr', title: 'Creeking' },
      ],
    };
    const out = twosCurriculumMonths([fieldTrips, curriculum()]);
    expect(out[0]).toEqual(fieldTrips);
    const cur = out[1] as ReturnType<typeof curriculum>;
    expect(cur.entries.find((e) => e.time === 'Apr')?.title).toBe(
      'Spring, insects, rocks, weather',
    );
  });

  it('ignores a daily-rhythm schedule (clock times, no Mar/Apr rows)', () => {
    const daily = {
      _type: 'scheduleSection',
      _key: 'day',
      entries: [
        { _key: 'd1', time: '9:30', title: 'Arrival routine' },
        { _key: 'd2', time: '10:00', title: 'Circle time' },
      ],
    };
    expect(twosCurriculumMonths([daily])).toEqual([daily]);
  });

  it('no-ops on a page with no schedule at all', () => {
    const other = [{ _type: 'ctaSection', _key: 'c1', title: 'Questions about anything here?' }];
    expect(twosCurriculumMonths(other)).toEqual(other);
  });
});

// The Pre-K closing CTA had been repurposed to carry the class-pet blurb, so
// HubSectionedBody hung Ms. Lisa's sign-off card under pet copy. These pin the
// split, and — more importantly — that it can never fire on a normal CTA.
const STANDARD_TITLE = 'Questions about anything here?';
const prekSections = () => [
  { _type: 'proseSection', _key: 'p1', header: { title: 'Welcome' } },
  {
    _type: 'ctaSection',
    _key: 'cta',
    title: 'Meet our class pet',
    lead: 'The AM class pet is a stuffed dog, and the PM class will name a pup of their own.',
  },
];

describe('prekSplitPetFromCta', () => {
  it('lifts the pet blurb into its own section directly above the CTA', () => {
    const out = prekSplitPetFromCta(prekSections());
    expect(out.map((s) => s._type)).toEqual(['proseSection', 'proseSection', 'ctaSection']);
    const pet = out[1];
    expect(pet._key).toBe('prek-pet-sec');
    expect(pet.header.title).toBe('Meet our class pet');
    expect(pet.body[0].children[0].text).toMatch(/stuffed dog/);
  });

  it('resets the CTA to the standard closing so the sign-off reads right', () => {
    const out = prekSplitPetFromCta(prekSections());
    const cta = out.find((s) => s._type === 'ctaSection');
    expect(cta?.title).toBe(STANDARD_TITLE);
    expect(cta?.lead).toMatch(/reach out anytime/);
    expect(cta?.title).not.toMatch(/class pet/i);
  });

  it('NEVER rewrites a handbook that already closes normally (e.g. Twos)', () => {
    const twos = [
      { _type: 'proseSection', _key: 'p1' },
      { _type: 'ctaSection', _key: 'cta', title: STANDARD_TITLE, lead: 'This handbook is...' },
    ];
    expect(prekSplitPetFromCta(twos)).toEqual(twos);
  });

  it('is idempotent — running twice does not stack pet sections', () => {
    const once = prekSplitPetFromCta(prekSections());
    const twice = prekSplitPetFromCta(once);
    expect(twice).toEqual(once);
    expect(twice.filter((s) => s._key === 'prek-pet-sec')).toHaveLength(1);
  });

  it('only touches the CLOSING CTA, leaving a mid-handbook CTA alone', () => {
    const withMidCta = [
      { _type: 'ctaSection', _key: 'mid', title: 'Sign up to help', lead: 'Pick a shift.' },
      {
        _type: 'ctaSection',
        _key: 'cta',
        title: 'Meet our class pet',
        lead: 'A stuffed dog joins each family for a weekend.',
      },
    ];
    const out = prekSplitPetFromCta(withMidCta);
    expect(out.find((s) => s._key === 'mid')).toEqual(withMidCta[0]);
    expect(out.find((s) => s._key === 'cta')?.title).toBe(STANDARD_TITLE);
  });

  it('no-ops on a page with no CTA at all', () => {
    const none = [{ _type: 'proseSection', _key: 'p1' }];
    expect(prekSplitPetFromCta(none)).toEqual(none);
  });
});

// The fundraising filter used to live inline in fundraising.astro. It moved
// into applyHubStopgaps after the search index deep-linked to a section the
// page drops — anything reading the doc has to trim it the same way.
describe('fundraisingDropSuperseded', () => {
  const sections = () => [
    { _type: 'statBandSection', _key: 'band' },
    { _type: 'proseSection', _key: 'k185', header: { title: 'Where the money goes' } },
    { _type: 'proseSection', _key: 'k9', header: { title: 'The Budget' } },
    { _type: 'proseSection', _key: 'keep', header: { title: 'How fundraisers work' } },
  ];

  it('drops the count-up band and the superseded budget prose', () => {
    const out = fundraisingDropSuperseded(sections());
    expect(out.map((s) => s._key)).toEqual(['keep']);
  });

  it('is reachable through applyHubStopgaps for the fundraising page', () => {
    const out = applyHubStopgaps(sections(), 'fundraising');
    expect(out.map((s) => s._key)).toEqual(['keep']);
  });

  it('leaves other pages alone — only fundraising trims these', () => {
    const out = applyHubStopgaps(sections(), 'health');
    expect(out.map((s) => s._key)).toEqual(['band', 'k185', 'k9', 'keep']);
  });
});
