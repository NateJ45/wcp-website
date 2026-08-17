import { describe, it, expect } from 'vitest';
import { toHolderMap, applyHolder, applyHolders, telHref } from './hub-org';

const optedIn = (parents: { name: string; email?: string; phone?: string }[]) => ({
  optedIn: true,
  parents,
});

describe('toHolderMap', () => {
  it('keys holders by role', () => {
    const map = toHolderMap([{ role: 'President', person: 'Rachel Gumpert' }]);
    expect(map.get('President')?.name).toBe('Rachel Gumpert');
  });

  it('keeps a role with no person so the chart can draw it as an open seat', () => {
    const map = toHolderMap([{ role: 'Facilities Chair', person: '   ' }]);
    expect(map.has('Facilities Chair')).toBe(true);
    expect(map.get('Facilities Chair')?.name).toBeUndefined();
  });

  it('drops a row with no role — there is nothing to join on', () => {
    expect(toHolderMap([{ person: 'Someone' }]).size).toBe(0);
  });

  it('prefers the role mailbox over the linked family address', () => {
    const map = toHolderMap([
      {
        role: 'President',
        person: 'Rachel Gumpert',
        email: 'president@westchesterpreschool.org',
        contact: optedIn([{ name: 'Rachel Gumpert', email: 'personal@example.com' }]),
      },
    ]);
    expect(map.get('President')?.email).toBe('president@westchesterpreschool.org');
  });

  it('pulls email and phone from the linked Directory entry when there is no role mailbox', () => {
    const map = toHolderMap([
      {
        role: 'Twos Rep',
        person: 'Laura Gilbert',
        contact: optedIn([
          { name: 'Laura Gilbert', email: 'laura@example.com', phone: '(563) 723-1683' },
        ]),
      },
    ]);
    expect(map.get('Twos Rep')).toMatchObject({
      email: 'laura@example.com',
      phone: '(563) 723-1683',
    });
  });

  it('picks the matching adult out of a two-parent family', () => {
    const map = toHolderMap([
      {
        role: 'Pre-K AM Rep',
        person: 'Megan Waid',
        contact: optedIn([
          { name: 'Tanner Waid', email: 'tanner@example.com', phone: '(937) 570-0336' },
          { name: 'Megan Waid', email: 'megan@example.com', phone: '(513) 368-2892' },
        ]),
      },
    ]);
    expect(map.get('Pre-K AM Rep')).toMatchObject({
      email: 'megan@example.com',
      phone: '(513) 368-2892',
    });
  });

  it('respects a family that opted OUT of the Directory', () => {
    const map = toHolderMap([
      {
        role: 'Threes Rep',
        person: 'Jordyn Frasier',
        contact: { optedIn: false, parents: [{ name: 'Jordyn Frasier', email: 'j@example.com' }] },
      },
    ]);
    expect(map.get('Threes Rep')?.email).toBeUndefined();
    expect(map.get('Threes Rep')?.phone).toBeUndefined();
    // The NAME still shows — only the contact details are withheld.
    expect(map.get('Threes Rep')?.name).toBe('Jordyn Frasier');
  });

  it('falls back to the first adult when no name matches', () => {
    const map = toHolderMap([
      {
        role: 'Twos Rep',
        person: 'Laura G.',
        contact: optedIn([{ name: 'Laura Gilbert', email: 'laura@example.com' }]),
      },
    ]);
    expect(map.get('Twos Rep')?.email).toBe('laura@example.com');
  });

  it('ignores a photo field with no uploaded asset', () => {
    const map = toHolderMap([{ role: 'Secretary', person: 'Margot Hisle', photo: { alt: 'x' } }]);
    expect(map.get('Secretary')?.photo).toBeUndefined();
  });
});

describe('applyHolder', () => {
  const code = { role: 'President', icon: 'award', name: 'Old Name', email: 'old@example.com' };

  it('overlays the Studio value onto the code default', () => {
    const map = toHolderMap([
      { role: 'President', person: 'Rachel Gumpert', email: 'president@example.org' },
    ]);
    expect(applyHolder(code, map)).toMatchObject({
      role: 'President',
      icon: 'award',
      name: 'Rachel Gumpert',
      email: 'president@example.org',
    });
  });

  it('CLEARS a code name when the Board empties the role', () => {
    // The point of the whole exercise: a volunteer who steps down must vanish
    // from the chart via the Studio, not linger because code still names them.
    const map = toHolderMap([{ role: 'President', person: '' }]);
    expect(applyHolder(code, map).name).toBeUndefined();
  });

  it('keeps the code values when Sanity has no document for the role', () => {
    expect(applyHolder(code, new Map())).toEqual(code);
    expect(applyHolder(code, null)).toEqual(code);
  });

  it('preserves order and shape across a list', () => {
    const list = [
      { role: 'Treasurer', icon: 'piggy-bank', name: 'A' },
      { role: 'Secretary', icon: 'notebook-pen', name: 'B' },
    ];
    const map = toHolderMap([{ role: 'Secretary', person: 'Margot Hisle' }]);
    const out = applyHolders(list, map);
    expect(out.map((o) => o.role)).toEqual(['Treasurer', 'Secretary']);
    expect(out[0].name).toBe('A');
    expect(out[1].name).toBe('Margot Hisle');
  });
});

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
    expect(telHref('   ')).toBeNull();
    // "N/A" appears in the roster where a family has one parent.
    expect(telHref('N/A')).toBeNull();
  });
});
