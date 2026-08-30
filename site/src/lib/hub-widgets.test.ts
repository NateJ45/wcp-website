import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { HUB_WIDGETS_BY_KEY, hiddenWidgetSet, shows, widgetOptionsFor } from './hub-widgets';

describe('widgetOptionsFor', () => {
  it('hands the home page its switches and unknown pages none', () => {
    expect(widgetOptionsFor('home').length).toBeGreaterThan(0);
    expect(widgetOptionsFor('directory')).toEqual([]);
    expect(widgetOptionsFor(undefined)).toEqual([]);
  });
});

describe('hiddenWidgetSet / shows', () => {
  it('missing or empty storage hides nothing', () => {
    expect(shows(hiddenWidgetSet(undefined), 'events')).toBe(true);
    expect(shows(hiddenWidgetSet([]), 'events')).toBe(true);
  });

  it('a stored value hides exactly that widget', () => {
    const hidden = hiddenWidgetSet(['store', 'weather']);
    expect(shows(hidden, 'store')).toBe(false);
    expect(shows(hidden, 'weather')).toBe(false);
    expect(shows(hidden, 'events')).toBe(true);
  });

  it('strips stega markers, so a draft-read value still matches', () => {
    const encoded = 'weather​‌‍﻿';
    expect(shows(hiddenWidgetSet([encoded]), 'weather')).toBe(false);
  });

  it('ignores non-string junk without throwing', () => {
    expect(shows(hiddenWidgetSet([1, null, 'store'] as unknown[]), 'store')).toBe(false);
    expect(shows(hiddenWidgetSet('store' as unknown), 'store')).toBe(true);
  });
});

// Drift gate: every registered home widget must actually be honored by the
// page source — a value listed here but never checked would render a Studio
// switch that does nothing, which is worse than no switch.
describe('the home page honors every registered switch', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'pages', 'family-hub', 'index.astro'),
    'utf-8',
  );
  for (const opt of HUB_WIDGETS_BY_KEY.home) {
    it(`gates '${opt.value}'`, () => {
      expect(source).toContain(`shows(hidden, '${opt.value}')`);
    });
  }
});
