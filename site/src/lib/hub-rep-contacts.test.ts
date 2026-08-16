import { describe, it, expect } from 'vitest';
import { telHref, toContactMap } from './hub-rep-contacts';

describe('telHref', () => {
  it('strips the punctuation the Board types into a dialable href', () => {
    expect(telHref('(513) 338-3053')).toBe('tel:5133383053');
    expect(telHref('513-283-7199')).toBe('tel:5132837199');
    expect(telHref('5637231683')).toBe('tel:5637231683');
  });

  it('keeps a leading + so an international number still dials', () => {
    expect(telHref('+44 20 7946 0958')).toBe('tel:+442079460958');
  });

  it('returns null for nothing usable, so the card omits the link', () => {
    expect(telHref(undefined)).toBeNull();
    expect(telHref(null)).toBeNull();
    expect(telHref('')).toBeNull();
    expect(telHref('   ')).toBeNull();
    // "N/A" appears in the roster where a family has one parent.
    expect(telHref('N/A')).toBeNull();
  });
});

describe('toContactMap', () => {
  it('keys the rows by name', () => {
    const map = toContactMap([
      { name: 'Laura Gilbert', email: 'lkgilbert11@example.com', phone: '(563) 723-1683' },
    ]);
    expect(map.get('Laura Gilbert')).toEqual({
      email: 'lkgilbert11@example.com',
      phone: '(563) 723-1683',
    });
  });

  it('drops blank fields so a card never renders an empty mailto:', () => {
    const map = toContactMap([{ name: 'Megan Waid', email: '  ', phone: '(513) 368-2892' }]);
    expect(map.get('Megan Waid')).toEqual({ email: undefined, phone: '(513) 368-2892' });
  });

  it('skips an adult with no usable details at all', () => {
    const map = toContactMap([{ name: 'Jordyn Frasier', email: '', phone: null }]);
    expect(map.has('Jordyn Frasier')).toBe(false);
  });

  it('ignores nameless rows — the name is the join key', () => {
    const map = toContactMap([{ name: '  ', email: 'someone@example.com' }]);
    expect(map.size).toBe(0);
  });

  it('combines two partial rows for the same adult', () => {
    const map = toContactMap([
      { name: "Melissa O'Brien", email: 'melissa@example.com' },
      { name: "Melissa O'Brien", phone: '(513) 283-7199' },
    ]);
    expect(map.get("Melissa O'Brien")).toEqual({
      email: 'melissa@example.com',
      phone: '(513) 283-7199',
    });
  });

  it('survives an empty or missing response', () => {
    expect(toContactMap([]).size).toBe(0);
    expect(toContactMap(null).size).toBe(0);
    expect(toContactMap(undefined).size).toBe(0);
  });
});
