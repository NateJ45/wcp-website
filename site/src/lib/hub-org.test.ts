import { describe, it, expect } from 'vitest';
import {
  toHolderMap,
  toSeats,
  buildOrgChart,
  classRepPerson,
  repSeatKey,
  telHref,
  type OrgSeat,
} from './hub-org';

const optedIn = (parents: { name: string; email?: string; phone?: string }[]) => ({
  optedIn: true,
  parents,
});

describe('toHolderMap', () => {
  it('keys holders by role', () => {
    const map = toHolderMap([{ role: 'President', person: 'Rachel Gumpert' }]);
    expect(map.get('President')?.name).toBe('Rachel Gumpert');
  });

  it('keys a holder by its seat reference, which is what survives a rename', () => {
    const map = toHolderMap([{ seat: 'coop-0', role: 'President', person: 'Rachel Gumpert' }]);
    expect(map.get('coop-0')?.name).toBe('Rachel Gumpert');
    expect(map.get('President')?.name).toBe('Rachel Gumpert');
  });

  it('keys a class rep by seat AND class, so one seat covers every class', () => {
    const map = toHolderMap([{ seat: 'rep', forClass: 'twos', person: 'Laura Gilbert' }]);
    expect(map.get('rep:twos')?.name).toBe('Laura Gilbert');
    // NOT under the bare seat id: that would give every class the same rep.
    expect(map.has('rep')).toBe(false);
  });

  it('keeps a role with no person so the chart can draw it as an open seat', () => {
    const map = toHolderMap([{ role: 'Facilities Chair', person: '   ' }]);
    expect(map.has('Facilities Chair')).toBe(true);
    expect(map.get('Facilities Chair')?.name).toBeUndefined();
  });

  it('drops a row with no seat and no role — there is nothing to join on', () => {
    expect(toHolderMap([{ person: 'Someone' }]).size).toBe(0);
  });

  it('lets the holder that names its seat win over one that only shares a label', () => {
    const map = toHolderMap([
      { seat: 'coop-0', role: 'President', person: 'Rachel Gumpert' },
      { role: 'President', person: 'A stale duplicate' },
    ]);
    expect(map.get('President')?.name).toBe('Rachel Gumpert');
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

// -----------------------------------------------------------------------------
// The seats, and the chart derived from them
// -----------------------------------------------------------------------------

// The shape the school runs today, written the way the documents store it.
const SEATS: OrgSeat[] = [
  { id: 'p', name: 'President', tier: 'board', icon: 'award' },
  { id: 'vp', name: 'Vice President', tier: 'board', icon: 'shield-check', reportsTo: 'p' },
  { id: 'sec', name: 'Secretary', tier: 'board', icon: 'notebook-pen', reportsTo: 'p' },
  { id: 'tea', name: 'Teacher', tier: 'staff', icon: 'book-open' },
  { id: 'fac', name: 'Facilities Chair', tier: 'chairs', icon: 'building-2', reportsTo: 'vp' },
  { id: 'pub', name: 'Publicity Chair', tier: 'chairs', icon: 'megaphone', reportsTo: 'sec' },
  {
    id: 'play',
    name: 'Playground',
    tier: 'committee',
    icon: 'trees',
    reportsTo: 'fac',
    team: '3 members',
  },
  {
    id: 'aide',
    name: 'Aide',
    tier: 'committee',
    icon: 'graduation-cap',
    reportsTo: 'sec',
    team: '2-4',
  },
  { id: 'rep', name: 'Class Rep', tier: 'reps', icon: 'users', reportsTo: 'sec', perClass: true },
];

const CLASSES = [
  { slug: 'twos', name: 'Twos', icon: 'blocks' },
  { slug: 'threes', name: 'Threes', icon: 'sprout' },
];

const branch = (chart: ReturnType<typeof buildOrgChart>, title: string) =>
  chart.branches.find((b) => b.title === title)!;

describe('toSeats', () => {
  it('drops a row with no name, no id, or an unknown section', () => {
    const seats = toSeats([
      { _id: 'a', name: 'President', tier: 'board' },
      { _id: 'b', name: '  ', tier: 'board' },
      { name: 'No id', tier: 'board' },
      { _id: 'd', name: 'Odd', tier: 'sideways' },
    ]);
    expect(seats.map((s) => s.id)).toEqual(['a']);
  });

  it('clears a "reports to" that names no seat, so the role goes loose not nowhere', () => {
    const seats = toSeats([{ _id: 'a', name: 'Chair', tier: 'chairs', reportsTo: 'deleted' }]);
    expect(seats[0].reportsTo).toBeUndefined();
  });

  it('gives a seat with no icon a usable default', () => {
    expect(toSeats([{ _id: 'a', name: 'Chair', tier: 'chairs' }])[0].icon).toBe('users');
  });
});

describe('buildOrgChart', () => {
  it('puts the board seat that reports to nobody at the top', () => {
    const chart = buildOrgChart(SEATS, null, CLASSES);
    expect(chart.president?.role).toBe('President');
    expect(chart.officers.map((o) => o.role)).toEqual(['Vice President', 'Secretary']);
    expect(chart.staff.map((s) => s.role)).toEqual(['Teacher']);
  });

  it('derives one column per officer who has somebody reporting to her', () => {
    const chart = buildOrgChart(SEATS, null, CLASSES);
    expect(chart.branches.map((b) => b.title)).toEqual([
      'Reports to Vice President',
      'Reports to Secretary',
    ]);
    expect(chart.branches[0].chairs.map((c) => c.chair.role)).toEqual(['Facilities Chair']);
    expect(chart.branches[0].chairs[0].teams).toEqual([{ label: 'Playground', size: '3 members' }]);
    // A committee that reports straight to the officer needs no chair between.
    expect(branch(chart, 'Reports to Secretary').teams).toEqual([{ label: 'Aide', size: '2-4' }]);
  });

  it('gives an officer with nobody under her no column at all', () => {
    // Removing the Secretary's reports must remove her column, not leave an
    // empty box — this is what makes shrinking the board work.
    const trimmed = SEATS.filter((s) => !['pub', 'aide', 'rep'].includes(s.id));
    const chart = buildOrgChart(trimmed, null, CLASSES);
    expect(chart.branches.map((b) => b.title)).toEqual(['Reports to Vice President']);
  });

  it('expands the ONE per-class rep seat into a card per live class', () => {
    const reps = branch(buildOrgChart(SEATS, null, CLASSES), 'Reports to Secretary').reps;
    expect(reps.map((r) => r.role)).toEqual(['Twos Rep', 'Threes Rep']);
    // The rep card wears the class's own icon, not the generic seat icon.
    expect(reps.map((r) => r.icon)).toEqual(['blocks', 'sprout']);
  });

  it('gives a NEWLY added class its rep card with no new document', () => {
    const chart = buildOrgChart(SEATS, null, [...CLASSES, { slug: 'fours', name: 'Fours' }]);
    expect(branch(chart, 'Reports to Secretary').reps.map((r) => r.role)).toContain('Fours Rep');
  });

  it('joins a holder by seat REFERENCE, so renaming the role keeps the person', () => {
    const holders = toHolderMap([{ seat: 'pub', person: 'Nathan Nixon' }]);
    const renamed = SEATS.map((s) => (s.id === 'pub' ? { ...s, name: 'Communications Chair' } : s));
    const chair = branch(buildOrgChart(renamed, holders, CLASSES), 'Reports to Secretary')
      .chairs[0];
    expect(chair.chair.role).toBe('Communications Chair');
    expect(chair.chair.name).toBe('Nathan Nixon');
  });

  it('still joins an unmigrated holder by its old role LABEL', () => {
    const holders = toHolderMap([{ role: 'Facilities Chair', person: 'Sam Reed' }]);
    const chart = buildOrgChart(SEATS, holders, CLASSES);
    expect(chart.branches[0].chairs[0].chair.name).toBe('Sam Reed');
  });

  it('joins a rep by seat AND class', () => {
    const holders = toHolderMap([{ seat: 'rep', forClass: 'threes', person: 'Jordyn Frasier' }]);
    const reps = branch(buildOrgChart(SEATS, holders, CLASSES), 'Reports to Secretary').reps;
    expect(reps.find((r) => r.role === 'Threes Rep')?.name).toBe('Jordyn Frasier');
    expect(reps.find((r) => r.role === 'Twos Rep')?.name).toBeUndefined();
  });

  it('shows an unfilled seat as an open role rather than hiding it', () => {
    const chart = buildOrgChart(SEATS, toHolderMap([{ seat: 'fac', person: '' }]), CLASSES);
    expect(chart.branches[0].chairs[0].chair.name).toBeUndefined();
  });

  it('never loses a role whose officer was deleted — it lands under "Other roles"', () => {
    const orphaned = SEATS.filter((s) => s.id !== 'vp').map((s) =>
      s.reportsTo === 'vp' ? { ...s, reportsTo: undefined } : s,
    );
    const other = branch(buildOrgChart(orphaned, null, CLASSES), 'Other roles');
    expect(other.chairs.map((c) => c.chair.role)).toEqual(['Facilities Chair']);
    // Its own committee travels with it rather than arriving separately.
    expect(other.chairs[0].teams).toEqual([{ label: 'Playground', size: '3 members' }]);
  });

  it('survives an empty co-op without throwing', () => {
    expect(buildOrgChart([], null, [])).toEqual({
      president: null,
      officers: [],
      staff: [],
      branches: [],
    });
  });
});

describe('classRepPerson', () => {
  it('answers a card for every class, filled or not', () => {
    const holders = toHolderMap([{ seat: 'rep', forClass: 'twos', person: 'Laura Gilbert' }]);
    expect(classRepPerson(SEATS, CLASSES[0], holders).name).toBe('Laura Gilbert');
    expect(classRepPerson(SEATS, CLASSES[1], holders).name).toBeUndefined();
  });

  it('works for a class the code has never heard of, with no committed entry', () => {
    // The old card looked the class up in a code list, so a class added later
    // could never be given a rep at all. This is that bug's regression test.
    const holders = toHolderMap([{ seat: 'rep', forClass: 'fours', person: 'Dana Poe' }]);
    const card = classRepPerson(SEATS, { slug: 'fours', name: 'Fours' }, holders);
    expect(card).toMatchObject({ role: 'Fours Rep', name: 'Dana Poe' });
  });

  it('falls back to the label join when no seat document exists yet', () => {
    const holders = toHolderMap([{ role: 'Twos Rep', person: 'Laura Gilbert' }]);
    expect(classRepPerson([], CLASSES[0], holders).name).toBe('Laura Gilbert');
  });
});

describe('repSeatKey', () => {
  it('keys a rep by its seat and its class', () => {
    expect(repSeatKey('rep', 'twos')).toBe('rep:twos');
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
