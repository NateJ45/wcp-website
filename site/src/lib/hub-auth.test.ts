import { describe, expect, it } from 'vitest';
import { HUB_SESSION_KEY, isFamilyAuthed, passwordFingerprint, safeEqual } from './hub-auth';

describe('passwordFingerprint', () => {
  it('is stable for the same password', async () => {
    expect(await passwordFingerprint('open-sesame')).toBe(await passwordFingerprint('open-sesame'));
  });

  it('is a 64-char hex sha-256 digest', async () => {
    expect(await passwordFingerprint('open-sesame')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('differs for different passwords', async () => {
    expect(await passwordFingerprint('spring-2026')).not.toBe(
      await passwordFingerprint('spring-2027'),
    );
  });

  it('ignores surrounding whitespace, matching the login handler', async () => {
    // hub-login.ts trims both sides because secrets pasted into a dashboard
    // routinely pick up a trailing newline.
    expect(await passwordFingerprint('  open-sesame\n')).toBe(
      await passwordFingerprint('open-sesame'),
    );
  });

  it('never returns the password itself', async () => {
    expect(await passwordFingerprint('open-sesame')).not.toContain('open-sesame');
  });
});

describe('isFamilyAuthed', () => {
  it('accepts a session fingerprint matching the current password', async () => {
    const stored = await passwordFingerprint('open-sesame');
    expect(await isFamilyAuthed(stored, 'open-sesame')).toBe(true);
  });

  it('tolerates whitespace drift between stored and configured secret', async () => {
    const stored = await passwordFingerprint('open-sesame');
    expect(await isFamilyAuthed(stored, ' open-sesame ')).toBe(true);
  });

  // THE requirement: rotating the password must sign everyone out.
  it('rejects a session issued under a previous password', async () => {
    const issuedLastYear = await passwordFingerprint('spring-2026');
    expect(await isFamilyAuthed(issuedLastYear, 'spring-2027')).toBe(false);
  });

  // Fail closed. A misconfigured deploy must lock the hub, never open it.
  it.each([
    ['undefined', undefined],
    ['empty', ''],
    ['whitespace only', '   '],
  ])('rejects everyone when the secret is %s', async (_label, secret) => {
    const stored = await passwordFingerprint('open-sesame');
    expect(await isFamilyAuthed(stored, secret)).toBe(false);
  });

  // Sessions created before this change stored the boolean `true`. They must be
  // rejected (forcing a fresh sign-in), not crash and not be treated as valid.
  it.each([
    ['legacy boolean true', true],
    ['legacy boolean false', false],
    ['missing', undefined],
    ['null', null],
    ['empty string', ''],
    ['a number', 1],
    ['an object', { familyAuthed: true }],
  ])('rejects a %s session value', async (_label, stored) => {
    expect(await isFamilyAuthed(stored, 'open-sesame')).toBe(false);
  });

  it('rejects a fingerprint-shaped value that is not the right digest', async () => {
    expect(await isFamilyAuthed('a'.repeat(64), 'open-sesame')).toBe(false);
  });
});

describe('safeEqual', () => {
  it('matches identical strings', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
  });

  it('rejects different strings of equal length', () => {
    expect(safeEqual('abc', 'abd')).toBe(false);
  });

  it('rejects different lengths', () => {
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });

  it('rejects empty against non-empty', () => {
    expect(safeEqual('', 'abc')).toBe(false);
  });
});

describe('HUB_SESSION_KEY', () => {
  // The middleware, the login handler and the login page must agree on this.
  it('is the key all three call sites share', () => {
    expect(HUB_SESSION_KEY).toBe('familyAuthed');
  });
});
