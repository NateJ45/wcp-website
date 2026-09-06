import { describe, it, expect } from 'vitest';
import { pickNote, telHref } from './hub-teacher-note';

describe('pickNote', () => {
  const rows = [
    { key: 'twos', signName: 'Erin' },
    { key: 'twos-threes', signName: 'The page note' },
  ];

  it('honours the key order, so a page note beats a single class note', () => {
    expect(pickNote(rows, ['twos-threes', 'twos', 'threes'])?.signName).toBe('The page note');
  });

  it('falls through to a class note when the page has none', () => {
    expect(pickNote([{ key: 'twos', signName: 'Erin' }], ['twos-threes', 'twos'])?.signName).toBe(
      'Erin',
    );
  });

  it('returns null when nothing matches, so the card renders nothing', () => {
    expect(pickNote(rows, ['summer'])).toBeNull();
    expect(pickNote([], ['twos'])).toBeNull();
    expect(pickNote(null, ['twos'])).toBeNull();
    expect(pickNote(undefined, ['twos'])).toBeNull();
  });
});

describe('telHref', () => {
  it('dials a human-typed number', () => {
    expect(telHref('513-543-4824')).toBe('tel:5135434824');
    expect(telHref('+1 (513) 543 4824')).toBe('tel:+15135434824');
  });

  it('has no href for an empty number', () => {
    expect(telHref('')).toBeNull();
    expect(telHref('   ')).toBeNull();
    expect(telHref(undefined)).toBeNull();
  });
});
