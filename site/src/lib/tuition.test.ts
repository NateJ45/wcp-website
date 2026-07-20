import { describe, expect, it } from 'vitest';
import { SCHOOL_YEAR_MONTHS, annualTuition, formatMoney, parseMoney, yearCost } from './tuition';

describe('parseMoney', () => {
  it.each([
    ['$70', 70],
    ['$1,350', 1350],
    ['150', 150],
    ['$45.50', 45.5],
  ])('parses %s', (input, expected) => {
    expect(parseMoney(input)).toBe(expected);
  });

  it('passes numbers straight through', () => {
    expect(parseMoney(200)).toBe(200);
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['empty', ''],
    ['non-numeric', 'ask us'],
  ])('returns 0 for %s', (_label, input) => {
    expect(parseMoney(input)).toBe(0);
  });

  // Sanity injects invisible stega marker characters into display strings in
  // the /preview path. Stripping to digits has to survive them.
  it('tolerates stega-encoded strings', () => {
    const stega = '$150​‌‍﻿';
    expect(parseMoney(stega)).toBe(150);
  });
});

describe('formatMoney', () => {
  it.each([
    [630, '$630'],
    [1350, '$1,350'],
    [0, '$0'],
  ])('formats %d as %s', (input, expected) => {
    expect(formatMoney(input)).toBe(expected);
  });

  it('rounds to whole dollars', () => {
    expect(formatMoney(1349.6)).toBe('$1,350');
  });
});

describe('annualTuition', () => {
  // These four pairs are the school's OWN published figures. If this test ever
  // fails, either the school year length changed or a price did.
  it.each([
    ['Twos', '$70', 630],
    ['Threes', '$150', 1350],
    ['Pre-K AM', '$200', 1800],
    ['Pre-K PM', '$175', 1575],
  ])('%s: %s/mo is $%d for the year', (_name, monthly, expected) => {
    expect(annualTuition(monthly)).toBe(expected);
  });

  it('is monthly x the school year length', () => {
    expect(annualTuition('$100')).toBe(100 * SCHOOL_YEAR_MONTHS);
  });

  it('returns 0 rather than NaN for a missing price', () => {
    expect(annualTuition(undefined)).toBe(0);
  });
});

describe('yearCost', () => {
  // A Threes family: $150/mo, $45 student fee, $100 registration, $100 deposit.
  const threes = { monthly: 150, studentFee: 45, registration: 100, deposit: 100 };

  it('totals tuition plus every fee', () => {
    expect(yearCost(threes)).toMatchObject({ tuition: 1350, total: 1595 });
  });

  it('reports the deposit as refundable and nets it out', () => {
    const c = yearCost(threes);
    expect(c.refundable).toBe(100);
    expect(c.net).toBe(1495);
    expect(c.total - c.refundable).toBe(c.net);
  });

  it('handles a family enrolled in two classes (summed monthly)', () => {
    // Registration and the deposit are per family, charged once, so the caller
    // passes them once — only tuition and student fees stack.
    const c = yearCost({ monthly: 150 + 70, studentFee: 45 + 45, registration: 100, deposit: 100 });
    expect(c.tuition).toBe(1980);
    expect(c.total).toBe(2270);
    expect(c.net).toBe(2170);
  });

  it('is all zeroes when nothing is selected', () => {
    expect(yearCost({ monthly: 0, studentFee: 0, registration: 0, deposit: 0 })).toEqual({
      tuition: 0,
      total: 0,
      refundable: 0,
      net: 0,
    });
  });

  it('still totals correctly when there is no deposit configured', () => {
    const c = yearCost({ monthly: 150, studentFee: 45, registration: 100, deposit: 0 });
    expect(c.total).toBe(1495);
    expect(c.net).toBe(1495);
  });
});
