// =============================================================================
// sanity-path — unit tests for the studio-path parser
// =============================================================================
// The parser stands between a hovered element and a document mutation, so its
// one hard rule is worth pinning: a shape it does not recognise returns an EMPTY
// path, never a partial one. A partial path would still be a valid patch target,
// and the in-canvas control would write to the wrong field in silence.
// =============================================================================
import { describe, expect, it } from 'vitest';
import {
  lastProperty,
  parentOf,
  parseSanityPath,
  readSectionPath,
  sectionByKey,
  valueAtPath,
} from './sanity-path';

describe('parseSanityPath', () => {
  it('reads a plain dotted path', () => {
    expect(parseSanityPath('hero.title')).toEqual(['hero', 'title']);
    expect(parseSanityPath('title')).toEqual(['title']);
  });

  it('reads an array member by key', () => {
    expect(parseSanityPath('sections[_key=="a1b2"].header.title')).toEqual([
      'sections',
      { _key: 'a1b2' },
      'header',
      'title',
    ]);
  });

  it('reads a numeric index', () => {
    expect(parseSanityPath('sections[2].title')).toEqual(['sections', 2, 'title']);
  });

  it('reads the deep span path a click on rendered rich text produces', () => {
    expect(
      parseSanityPath(
        'sections[_key=="s"].rows[_key=="r"].bodyRich[_key=="b"].children[_key=="c"].text',
      ),
    ).toEqual([
      'sections',
      { _key: 's' },
      'rows',
      { _key: 'r' },
      'bodyRich',
      { _key: 'b' },
      'children',
      { _key: 'c' },
      'text',
    ]);
  });

  it('tolerates whitespace inside the key predicate', () => {
    expect(parseSanityPath('sections[ _key == "k" ]')).toEqual(['sections', { _key: 'k' }]);
  });

  it('returns nothing at all for a shape it does not know', () => {
    expect(parseSanityPath('sections[title=="x"]')).toEqual([]);
    expect(parseSanityPath('sections[_key=="k"')).toEqual([]);
    expect(parseSanityPath('9lives.title')).toEqual([]);
    expect(parseSanityPath('a-b.c')).toEqual([]);
    expect(parseSanityPath('')).toEqual([]);
    expect(parseSanityPath('   ')).toEqual([]);
    expect(parseSanityPath(undefined)).toEqual([]);
    expect(parseSanityPath(null)).toEqual([]);
  });
});

describe('lastProperty and parentOf', () => {
  it('names the final property, or nothing when the path ends in a member', () => {
    expect(lastProperty(parseSanityPath('sections[_key=="k"].title'))).toBe('title');
    expect(lastProperty(parseSanityPath('sections[_key=="k"]'))).toBe('');
    expect(lastProperty([])).toBe('');
  });

  it('drops the final segment', () => {
    expect(parentOf(['sections', { _key: 'k' }, 'title'])).toEqual(['sections', { _key: 'k' }]);
    expect(parentOf([])).toEqual([]);
  });
});

describe('valueAtPath', () => {
  const doc = {
    hero: { title: 'Where kids belong' },
    sections: [
      { _key: 'a', _type: 'proseSection', header: { title: 'One' } },
      { _key: 'b', _type: 'ctaSection', title: 'Two' },
    ],
  };

  it('walks objects, keyed members and indices', () => {
    expect(valueAtPath(doc, ['hero', 'title'])).toBe('Where kids belong');
    expect(valueAtPath(doc, ['sections', { _key: 'b' }, 'title'])).toBe('Two');
    expect(valueAtPath(doc, ['sections', 0, '_key'])).toBe('a');
  });

  it('finds a member by key, never by position', () => {
    const moved = { sections: [doc.sections[1], doc.sections[0]] };
    expect(valueAtPath(moved, ['sections', { _key: 'a' }, 'header', 'title'])).toBe('One');
  });

  it('returns undefined rather than throwing on a missing step', () => {
    expect(valueAtPath(doc, ['nope', 'title'])).toBeUndefined();
    expect(valueAtPath(doc, ['sections', { _key: 'zz' }, 'title'])).toBeUndefined();
    expect(valueAtPath(doc, ['hero', 'title', 'deeper'])).toBeUndefined();
    expect(valueAtPath(null, ['hero'])).toBeUndefined();
  });
});

describe('readSectionPath', () => {
  it('reads a path pointing inside a section', () => {
    expect(readSectionPath('sections[_key=="k"].header.title')).toEqual({
      key: 'k',
      itemPath: ['sections', { _key: 'k' }],
      rest: ['header', 'title'],
    });
  });

  it('reads the bare section item, with an empty rest', () => {
    expect(readSectionPath('sections[_key=="k"]')).toEqual({
      key: 'k',
      itemPath: ['sections', { _key: 'k' }],
      rest: [],
    });
  });

  it('returns null for anything outside the page-builder array', () => {
    expect(readSectionPath('hero.title')).toBeNull();
    expect(readSectionPath('title')).toBeNull();
    // An index, not a key: the mutation API wants keys, so this is not ours.
    expect(readSectionPath('sections[0].title')).toBeNull();
    // Some other array on the document.
    expect(readSectionPath('mainNav[_key=="n"].label')).toBeNull();
    expect(readSectionPath('')).toBeNull();
    expect(readSectionPath(undefined)).toBeNull();
  });
});

describe('sectionByKey', () => {
  const doc = { sections: [{ _key: 'a' }, { _key: 'b', _type: 'ctaSection' }] };

  it('finds the item', () => {
    expect(sectionByKey(doc, 'b')).toEqual({ _key: 'b', _type: 'ctaSection' });
  });

  it('returns null for a missing key or a missing array', () => {
    expect(sectionByKey(doc, 'zz')).toBeNull();
    expect(sectionByKey({}, 'a')).toBeNull();
    expect(sectionByKey(null, 'a')).toBeNull();
  });
});
