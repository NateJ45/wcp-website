import { describe, it, expect } from 'vitest';
import { formatCount } from './count-format';

describe('formatCount', () => {
  it('renders an integer with no decimals by default', () => {
    expect(formatCount(34)).toBe('34');
    expect(formatCount(0)).toBe('0');
  });

  it('infers one decimal for a fractional value', () => {
    expect(formatCount(4.9)).toBe('4.9');
    expect(formatCount(4.94)).toBe('4.9');
  });

  it('honors an explicit decimals count (so int targets never flash decimals mid-frame)', () => {
    // countup passes decimals:0 for an integer target — an interpolated 12.7
    // must round to a whole number, not show "12.7".
    expect(formatCount(12.7, { decimals: 0 })).toBe('13');
    expect(formatCount(9.2, { decimals: 0 })).toBe('9');
  });

  it('applies prefix and suffix around the number', () => {
    expect(formatCount(42, { suffix: '%' })).toBe('42%');
    expect(formatCount(12500, { prefix: '$', group: true })).toBe('$12,500');
  });

  it('groups thousands only when asked', () => {
    expect(formatCount(12500)).toBe('12500');
    expect(formatCount(12500, { group: true })).toBe('12,500');
    expect(formatCount(1234567.5, { group: true, decimals: 1 })).toBe('1,234,567.5');
  });

  it('falls back to 0 for non-finite input rather than emitting NaN/Infinity', () => {
    expect(formatCount(Number.NaN)).toBe('0');
    expect(formatCount(Number.POSITIVE_INFINITY, { prefix: '$' })).toBe('$0');
  });
});
