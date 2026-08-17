import { describe, it, expect } from 'vitest';
import { deriveStudentFeeBands, bandLabel } from './student-fees';

// The real 2026-27 shape: two Pre-Ks at $50, Twos and Threes at $45.
const CLASSES = [
  { slug: 'twos', name: 'Twos', studentFee: '$45', studentFeePayId: 'TWOTHREE' },
  { slug: 'threes', name: 'Threes', studentFee: '$45', studentFeePayId: 'TWOTHREE' },
  { slug: 'pre-k-am', name: 'Pre-K AM', studentFee: '$50', studentFeePayId: 'PREK' },
  { slug: 'pre-k-pm', name: 'Pre-K PM', studentFee: '$50', studentFeePayId: 'PREK' },
];

describe('bandLabel', () => {
  it('joins two class names the way the school writes them', () => {
    expect(bandLabel(['Twos', 'Threes'])).toBe('Twos & Threes');
  });

  it('collapses a repeated program name', () => {
    // "Pre-K AM & Pre-K PM" is not how anyone says it.
    expect(bandLabel(['Pre-K AM', 'Pre-K PM'])).toBe('Pre-K AM & PM');
  });

  it('handles three or more', () => {
    expect(bandLabel(['Twos', 'Threes', 'Pre-K AM'])).toBe('Twos, Threes & Pre-K AM');
  });

  it('passes a single name through', () => {
    expect(bandLabel(['Twos'])).toBe('Twos');
  });

  it('survives empties', () => {
    expect(bandLabel([])).toBe('');
    expect(bandLabel(['  ', 'Twos'])).toBe('Twos');
  });
});

describe('deriveStudentFeeBands', () => {
  it('reproduces the two real bands from the class documents', () => {
    expect(deriveStudentFeeBands(CLASSES)).toEqual([
      { label: 'Twos & Threes', amount: '$45', payId: 'TWOTHREE' },
      { label: 'Pre-K AM & PM', amount: '$50', payId: 'PREK' },
    ]);
  });

  it('follows a fee change on ONE class — the whole point', () => {
    // Raise the Threes only: it splits out of the shared band instead of
    // silently leaving the tuition page disagreeing with the class page.
    const changed = CLASSES.map((c) =>
      c.slug === 'threes' ? { ...c, studentFee: '$55', studentFeePayId: 'NEW' } : c,
    );
    expect(deriveStudentFeeBands(changed)).toEqual([
      { label: 'Twos', amount: '$45', payId: 'TWOTHREE' },
      { label: 'Threes', amount: '$55', payId: 'NEW' },
      { label: 'Pre-K AM & PM', amount: '$50', payId: 'PREK' },
    ]);
  });

  it('keeps same-amount classes apart when they bill through different buttons', () => {
    const split = [
      { slug: 'a', name: 'Twos', studentFee: '$45', studentFeePayId: 'ONE' },
      { slug: 'b', name: 'Threes', studentFee: '$45', studentFeePayId: 'TWO' },
    ];
    expect(deriveStudentFeeBands(split)).toHaveLength(2);
  });

  it('skips a class with no fee set — missing is not free', () => {
    const partial = [
      { slug: 'twos', name: 'Twos', studentFee: '$45', studentFeePayId: 'X' },
      { slug: 'threes', name: 'Threes' },
    ];
    expect(deriveStudentFeeBands(partial)).toEqual([{ label: 'Twos', amount: '$45', payId: 'X' }]);
  });

  it('groups classes that share an amount with no pay link yet', () => {
    const noLinks = [
      { slug: 'twos', name: 'Twos', studentFee: '$45' },
      { slug: 'threes', name: 'Threes', studentFee: '$45' },
    ];
    expect(deriveStudentFeeBands(noLinks)).toEqual([
      { label: 'Twos & Threes', amount: '$45', payId: '' },
    ]);
  });

  it('survives an empty or missing class list', () => {
    expect(deriveStudentFeeBands([])).toEqual([]);
    expect(deriveStudentFeeBands(null)).toEqual([]);
    expect(deriveStudentFeeBands(undefined)).toEqual([]);
  });
});
