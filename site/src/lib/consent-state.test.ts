import { describe, expect, it } from 'vitest';
import {
  CONSENT_VERSION,
  isValidGtagId,
  isValidMetaPixelId,
  parseConsent,
  serializeConsent,
} from './consent-state';

describe('parseConsent', () => {
  it('round-trips a serialized decision', () => {
    const raw = serializeConsent(
      { analytics: 'granted', marketing: 'denied' },
      new Date('2026-07-17T12:00:00Z'),
    );
    expect(parseConsent(raw)).toEqual({
      v: CONSENT_VERSION,
      analytics: 'granted',
      marketing: 'denied',
      at: '2026-07-17T12:00:00.000Z',
    });
  });

  it('returns null for absent or empty storage', () => {
    expect(parseConsent(null)).toBeNull();
    expect(parseConsent('')).toBeNull();
  });

  it('returns null for malformed JSON (never throws)', () => {
    expect(parseConsent('{oops')).toBeNull();
    expect(parseConsent('42')).toBeNull();
    expect(parseConsent('"granted"')).toBeNull();
  });

  it('rejects the v1 single-ads shape (inventory grew, so re-ask)', () => {
    expect(parseConsent(JSON.stringify({ v: 1, ads: 'granted', at: '' }))).toBeNull();
  });

  it('returns null for an unknown schema version', () => {
    expect(
      parseConsent(JSON.stringify({ v: 3, analytics: 'granted', marketing: 'granted', at: '' })),
    ).toBeNull();
  });

  it('returns null when either category is missing or tampered', () => {
    expect(
      parseConsent(JSON.stringify({ v: CONSENT_VERSION, analytics: 'granted', at: '' })),
    ).toBeNull();
    expect(
      parseConsent(
        JSON.stringify({ v: CONSENT_VERSION, analytics: 'yes', marketing: 'denied', at: '' }),
      ),
    ).toBeNull();
  });

  it('tolerates a missing timestamp', () => {
    const parsed = parseConsent(
      JSON.stringify({ v: CONSENT_VERSION, analytics: 'denied', marketing: 'denied' }),
    );
    expect(parsed).toEqual({
      v: CONSENT_VERSION,
      analytics: 'denied',
      marketing: 'denied',
      at: '',
    });
  });
});

describe('isValidGtagId', () => {
  it('accepts the gtag.js family shapes', () => {
    expect(isValidGtagId('AW-16817798038')).toBe(true);
    expect(isValidGtagId('G-ABC123XYZ')).toBe(true);
  });

  it('rejects anything unsafe to interpolate into a script', () => {
    expect(isValidGtagId('')).toBe(false);
    expect(isValidGtagId('AW-')).toBe(false);
    expect(isValidGtagId("AW-1'};alert(1);//")).toBe(false);
    expect(isValidGtagId('https://evil.example')).toBe(false);
  });
});

describe('isValidMetaPixelId', () => {
  it('accepts a numeric pixel id', () => {
    expect(isValidMetaPixelId('1234567890123456')).toBe(true);
  });

  it('rejects non-numeric or unsafe values', () => {
    expect(isValidMetaPixelId('')).toBe(false);
    expect(isValidMetaPixelId('abc123')).toBe(false);
    expect(isValidMetaPixelId("1');alert(1);//")).toBe(false);
  });
});
