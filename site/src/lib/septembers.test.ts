import { describe, expect, it } from 'vitest';
import { countWordTitle, fallYear, septembersOnWall } from './septembers';

describe('fallYear', () => {
  it('prefers the school-year start date the Board set', () => {
    expect(fallYear('2026-09-09', new Date('2026-03-01'))).toBe(2026);
    expect(fallYear('2031-09-02', new Date('2031-08-01'))).toBe(2031);
  });

  it('falls back to the build date: June onward is this fall', () => {
    expect(fallYear(undefined, new Date('2026-08-15'))).toBe(2026);
    expect(fallYear('', new Date('2026-06-01'))).toBe(2026);
  });

  it('before June, the running school year started last fall', () => {
    expect(fallYear(null, new Date('2027-02-01'))).toBe(2026);
  });
});

describe('septembersOnWall', () => {
  it('counts every fall from founding up to (not including) this one', () => {
    expect(septembersOnWall(1969, 2026)).toBe(57);
    expect(septembersOnWall(1969, 1969)).toBe(0);
  });
});

describe('countWordTitle', () => {
  it('spells the heritage numbers', () => {
    expect(countWordTitle(57)).toBe('Fifty-seven');
    expect(countWordTitle(60)).toBe('Sixty');
    expect(countWordTitle(100)).toBe('One hundred');
    expect(countWordTitle(101)).toBe('One hundred one');
    expect(countWordTitle(250)).toBe('250');
  });
});
