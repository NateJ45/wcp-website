import { describe, expect, it } from 'vitest';
import { internalHref } from './portable-text';

describe('internalHref', () => {
  it('answers undefined before the map is primed (links degrade to text)', () => {
    expect(internalHref('page-home')).toBeUndefined();
    expect(internalHref(undefined)).toBeUndefined();
  });
});
