import { describe, expect, it } from 'vitest';
import { CONSENT_VERSION, isValidAdsId, parseConsent, serializeConsent } from './consent-state';

describe('parseConsent', () => {
  it('round-trips a serialized decision', () => {
    const raw = serializeConsent('granted', new Date('2026-07-17T12:00:00Z'));
    expect(parseConsent(raw)).toEqual({
      v: CONSENT_VERSION,
      ads: 'granted',
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

  it('returns null for an unknown schema version (re-asks after a bump)', () => {
    expect(parseConsent(JSON.stringify({ v: 0, ads: 'granted', at: '' }))).toBeNull();
    expect(parseConsent(JSON.stringify({ v: 2, ads: 'granted', at: '' }))).toBeNull();
  });

  it('returns null for a tampered ads value', () => {
    expect(parseConsent(JSON.stringify({ v: CONSENT_VERSION, ads: 'yes', at: '' }))).toBeNull();
    expect(parseConsent(JSON.stringify({ v: CONSENT_VERSION, at: '' }))).toBeNull();
  });

  it('tolerates a missing timestamp', () => {
    const parsed = parseConsent(JSON.stringify({ v: CONSENT_VERSION, ads: 'denied' }));
    expect(parsed).toEqual({ v: CONSENT_VERSION, ads: 'denied', at: '' });
  });
});

describe('isValidAdsId', () => {
  it('accepts the Google Ads AW-shape', () => {
    expect(isValidAdsId('AW-16817798038')).toBe(true);
    expect(isValidAdsId('G-ABC123XYZ')).toBe(true);
  });

  it('rejects anything unsafe to interpolate into a script', () => {
    expect(isValidAdsId('')).toBe(false);
    expect(isValidAdsId('AW-')).toBe(false);
    expect(isValidAdsId("AW-1'};alert(1);//")).toBe(false);
    expect(isValidAdsId('https://evil.example')).toBe(false);
  });
});
