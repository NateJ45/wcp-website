import { describe, expect, it } from 'vitest';
import { normalizeAuthor, photoFor } from './testimonial-photos';
import { testimonials } from '@/data/testimonials';

describe('normalizeAuthor', () => {
  it('lowercases and collapses whitespace', () => {
    expect(normalizeAuthor('  Alison   Blankenship ')).toBe('alison blankenship');
  });

  it('drops punctuation so "Lisa T." matches "Lisa T"', () => {
    expect(normalizeAuthor('Lisa T.')).toBe(normalizeAuthor('Lisa T'));
  });
});

describe('photoFor', () => {
  it('resolves a known author', () => {
    expect(photoFor('Alison Blankenship')).toBeDefined();
  });

  it('is insensitive to case and spacing', () => {
    expect(photoFor('alison  blankenship')).toBe(photoFor('Alison Blankenship'));
  });

  it('resolves the trailing-period author', () => {
    expect(photoFor('Lisa T.')).toBeDefined();
  });

  it('returns undefined for an unknown author', () => {
    expect(photoFor('Nobody Atall')).toBeUndefined();
  });

  it('returns undefined for empty input', () => {
    expect(photoFor(undefined)).toBeUndefined();
    expect(photoFor('')).toBeUndefined();
  });

  // Regression guard: the old site had a photo for every quote. If someone adds
  // a testimonial to data/testimonials.ts without a photo this fails loudly,
  // which is the prompt to either supply one or accept the no-photo note.
  it('has a photo for every testimonial author in the data file', () => {
    const missing = testimonials.filter((t) => !photoFor(t.author)).map((t) => t.author);
    expect(missing).toEqual([]);
  });
});
