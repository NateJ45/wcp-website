import { describe, expect, it } from 'vitest';
import { twosCurriculumMonths } from './hub-stopgaps';

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
