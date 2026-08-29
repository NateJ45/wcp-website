import { describe, it, expect } from 'vitest';
import {
  buildClassrooms,
  hubPathKind,
  classLookup,
  classTiles,
  classroomAddresses,
  classroomOf,
  joinClassNames,
  matchClassroom,
  teacherNoteKeys,
  type ClassroomPage,
  type HubClass,
} from './hub-classrooms';

const cls = (slug: string, over: Partial<HubClass> = {}): HubClass => ({
  slug,
  name: slug.toUpperCase(),
  icon: 'blocks',
  color: 'sky',
  ...over,
});

// The four classes the site shipped with, in their drag order.
const TWOS = cls('twos', { name: 'Twos', color: 'amber', icon: 'blocks' });
const THREES = cls('threes', { name: 'Threes', color: 'green', icon: 'sprout' });
const PREK_AM = cls('pre-k-am', { name: 'Pre-K AM', color: 'orange', icon: 'sun' });
const PREK_PM = cls('pre-k-pm', { name: 'Pre-K PM', color: 'sky', icon: 'moon' });
const SHIPPED = [TWOS, THREES, PREK_AM, PREK_PM];

const page = (
  key: string,
  classSlugs: string[],
  over: Partial<ClassroomPage> = {},
): ClassroomPage => ({
  key,
  classSlugs,
  ...over,
});
const SHIPPED_PAGES = [
  page('twos-threes', ['twos', 'threes'], { heading: 'Twos & Threes Classroom' }),
  page('pre-k', ['pre-k-am', 'pre-k-pm'], { heading: 'Pre-K Classroom' }),
];

describe('buildClassrooms', () => {
  it('reproduces the two pages the site shipped with, at their own addresses', () => {
    // The URLs families have bookmarked. If this ever changes, it is a break.
    const rooms = buildClassrooms(SHIPPED, SHIPPED_PAGES);
    expect(rooms.map((r) => r.route)).toEqual(['/family-hub/twos-threes', '/family-hub/pre-k']);
    expect(rooms[0].classes.map((c) => c.slug)).toEqual(['twos', 'threes']);
    expect(rooms[1].classes.map((c) => c.slug)).toEqual(['pre-k-am', 'pre-k-pm']);
  });

  it('gives a class NO page names its own classroom — the whole point', () => {
    const rooms = buildClassrooms([...SHIPPED, cls('summer', { name: 'Summer' })], SHIPPED_PAGES);
    const summer = rooms.find((r) => r.key === 'summer');
    expect(summer).toBeDefined();
    expect(summer!.route).toBe('/family-hub/summer');
    expect(summer!.label).toBe('Summer');
    expect(summer!.page).toBeNull();
    expect(summer!.classes).toHaveLength(1);
  });

  it('keeps the classes in the order they were given', () => {
    const rooms = buildClassrooms([PREK_AM, TWOS, THREES, PREK_PM], SHIPPED_PAGES);
    expect(rooms.map((r) => r.key)).toEqual(['pre-k', 'twos-threes']);
    // Members follow class order too, not the order the page listed them.
    expect(rooms[0].classes.map((c) => c.slug)).toEqual(['pre-k-am', 'pre-k-pm']);
  });

  it('takes its accent and icon from the first class on the page', () => {
    const rooms = buildClassrooms(SHIPPED, SHIPPED_PAGES);
    expect(rooms[0].color).toBe('amber');
    expect(rooms[0].icon).toBe('blocks');
    expect(rooms[1].color).toBe('orange');
  });

  it('lets the page override the icon', () => {
    const rooms = buildClassrooms(SHIPPED, [
      page('twos-threes', ['twos', 'threes'], { navIcon: 'flower' }),
    ]);
    expect(rooms[0].icon).toBe('flower');
  });

  it('names an untitled shared page after its classes', () => {
    const rooms = buildClassrooms([TWOS, THREES], [page('twos-threes', ['twos', 'threes'])]);
    expect(rooms[0].label).toBe('Twos & Threes');
  });

  it('ignores a page at an unusable address', () => {
    // No address means no route; the classes fall back to their own pages
    // rather than disappearing into a page nothing can reach.
    const rooms = buildClassrooms([TWOS, THREES], [page('  ', ['twos', 'threes'])]);
    expect(rooms.map((r) => r.key)).toEqual(['twos', 'threes']);
  });

  it('ignores class names on a page that no longer exist', () => {
    const rooms = buildClassrooms([TWOS], [page('twos-threes', ['twos', 'gone'])]);
    expect(rooms[0].classes.map((c) => c.slug)).toEqual(['twos']);
  });

  it('gives a class claimed by two pages to the FIRST page', () => {
    // Stable rather than arbitrary; the Studio rejects the second claim too.
    const rooms = buildClassrooms([TWOS], [page('first', ['twos']), page('second', ['twos'])]);
    expect(rooms).toHaveLength(1);
    expect(rooms[0].key).toBe('first');
  });

  it('returns nothing when there are no classes', () => {
    expect(buildClassrooms([], SHIPPED_PAGES)).toEqual([]);
  });
});

describe('matchClassroom', () => {
  const rooms = buildClassrooms(SHIPPED, SHIPPED_PAGES);

  it('renders a classroom at its own address', () => {
    expect(matchClassroom(rooms, 'twos-threes')).toEqual({ kind: 'render', classroom: rooms[0] });
    expect(matchClassroom(rooms, 'pre-k')).toEqual({ kind: 'render', classroom: rooms[1] });
  });

  it('redirects the old per-class addresses to the page that covers them', () => {
    // /family-hub/twos and /family-hub/pre-k-am were real routes once and are
    // in families' bookmarks. They must keep landing somewhere useful.
    expect(matchClassroom(rooms, 'twos')).toEqual({
      kind: 'redirect',
      to: '/family-hub/twos-threes',
    });
    expect(matchClassroom(rooms, 'threes')).toEqual({
      kind: 'redirect',
      to: '/family-hub/twos-threes',
    });
    expect(matchClassroom(rooms, 'pre-k-am')).toEqual({
      kind: 'redirect',
      to: '/family-hub/pre-k',
    });
    expect(matchClassroom(rooms, 'pre-k-pm')).toEqual({
      kind: 'redirect',
      to: '/family-hub/pre-k',
    });
  });

  it('renders a one-class classroom rather than redirecting to itself', () => {
    const solo = buildClassrooms([cls('summer', { name: 'Summer' })]);
    expect(matchClassroom(solo, 'summer')).toEqual({ kind: 'render', classroom: solo[0] });
  });

  it('matches nothing for a Board page address, so the route falls through', () => {
    expect(matchClassroom(rooms, 'playground-committee')).toBeNull();
    expect(matchClassroom(rooms, '')).toBeNull();
    expect(matchClassroom(rooms, undefined)).toBeNull();
  });
});

describe('classroomAddresses', () => {
  it('lists every address a classroom answers on', () => {
    // The Studio checks a Board page's web address against this list, because
    // the route resolves a classroom FIRST and the page would never appear.
    expect(classroomAddresses(buildClassrooms(SHIPPED, SHIPPED_PAGES)).sort()).toEqual(
      ['pre-k', 'pre-k-am', 'pre-k-pm', 'threes', 'twos', 'twos-threes'].sort(),
    );
  });
});

describe('teacherNoteKeys', () => {
  it('tries the page address first, then each class', () => {
    // The shipped Pre-K note is filed under "pre-k" (the page), the Twos &
    // Threes note under "twos" (a class). Both have to be findable.
    const rooms = buildClassrooms(SHIPPED, SHIPPED_PAGES);
    expect(teacherNoteKeys(rooms[0])).toEqual(['twos-threes', 'twos', 'threes']);
    expect(teacherNoteKeys(rooms[1])).toEqual(['pre-k', 'pre-k-am', 'pre-k-pm']);
  });

  it('does not repeat the key of a one-class classroom', () => {
    const solo = buildClassrooms([cls('summer')]);
    expect(teacherNoteKeys(solo[0])).toEqual(['summer']);
  });
});

describe('classTiles', () => {
  it('gives one tile per class, pointing at the page it lives on', () => {
    const tiles = classTiles(buildClassrooms(SHIPPED, SHIPPED_PAGES));
    expect(tiles.map((t) => [t.slug, t.page])).toEqual([
      ['twos', '/family-hub/twos-threes'],
      ['threes', '/family-hub/twos-threes'],
      ['pre-k-am', '/family-hub/pre-k'],
      ['pre-k-pm', '/family-hub/pre-k'],
    ]);
    expect(tiles[0].color).toBe('amber');
  });
});

describe('classLookup', () => {
  const look = classLookup(buildClassrooms(SHIPPED, SHIPPED_PAGES));

  it('uses the class document name and colour', () => {
    expect(look.label('pre-k-am')).toBe('Pre-K AM');
    expect(look.color('pre-k-am')).toBe('orange');
  });

  it('titleizes a slug no class matches, instead of showing the raw value', () => {
    expect(look.label('summer-camp')).toBe('Summer Camp');
    expect(look.color('summer-camp')).toBe('sky');
  });
});

describe('classroomOf / joinClassNames', () => {
  it('finds the classroom a class lives on', () => {
    const rooms = buildClassrooms(SHIPPED, SHIPPED_PAGES);
    expect(classroomOf(rooms, 'threes')?.key).toBe('twos-threes');
    expect(classroomOf(rooms, 'nope')).toBeNull();
  });

  it('joins names the way a person would say them', () => {
    expect(joinClassNames([])).toBe('Classroom');
    expect(joinClassNames(['Twos'])).toBe('Twos');
    expect(joinClassNames(['Twos', 'Threes'])).toBe('Twos & Threes');
    expect(joinClassNames(['Twos', 'Threes', 'Fours'])).toBe('Twos, Threes & Fours');
  });
});

describe('hubPathKind — the precedence rule', () => {
  const rooms = buildClassrooms(SHIPPED, SHIPPED_PAGES);

  it('gives a classroom the address even when a Board page claims it', () => {
    // This is the decision: a class page's address is DERIVED from the class,
    // so it outranks a page someone typed the same address into. Without it a
    // Board page could silently hide a class page from every family in it.
    expect(hubPathKind(rooms, 'twos-threes', true)).toBe('classroom');
    expect(hubPathKind(rooms, 'twos-threes', false)).toBe('classroom');
  });

  it('redirects a shared class address before considering a Board page', () => {
    expect(hubPathKind(rooms, 'pre-k-am', true)).toBe('redirect');
  });

  it('serves a Board page at any address no classroom owns', () => {
    expect(hubPathKind(rooms, 'playground-committee', true)).toBe('board');
  });

  it('404s an address nothing owns', () => {
    expect(hubPathKind(rooms, 'playground-committee', false)).toBe('none');
    expect(hubPathKind(rooms, '', false)).toBe('none');
  });
});
