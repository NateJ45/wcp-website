import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  HUB_WIDGETS_BY_KEY,
  hiddenWidgetSet,
  shows,
  widgetOptionsFor,
  widgetTextFor,
} from './hub-widgets';
import { mergeSuperHelper } from './hub-super-helper';
import { superHelperFallback } from '../data/hub/super-helper';

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

describe('widgetTextFor', () => {
  it('missing storage overrides nothing', () => {
    expect(widgetTextFor(undefined, 'weather')).toEqual({});
    expect(widgetTextFor([], 'weather')).toEqual({});
  });

  it('returns the row for the widget, empty boxes reading as unset', () => {
    const stored = [{ widget: 'weather', title: 'The week', blurb: '  ' }];
    expect(widgetTextFor(stored, 'weather')).toEqual({ title: 'The week', blurb: undefined });
    expect(widgetTextFor(stored, 'events')).toEqual({});
  });

  it('matches a stega-encoded widget key', () => {
    const stored = [{ widget: 'weather​‌‍﻿', title: 'The week' }];
    expect(widgetTextFor(stored, 'weather').title).toBe('The week');
  });
});

describe('mergeSuperHelper', () => {
  it('an untouched dataset renders the shipped program exactly', () => {
    expect(mergeSuperHelper(undefined)).toEqual(superHelperFallback);
    expect(mergeSuperHelper({})).toEqual(superHelperFallback);
  });

  it('a rename keeps the shipped requirements', () => {
    const out = mergeSuperHelper({ name: 'Classroom Champion' });
    expect(out.name).toBe('Classroom Champion');
    expect(out.requirements).toEqual(superHelperFallback.requirements);
  });

  it('a written list REPLACES the shipped one wholesale', () => {
    const out = mergeSuperHelper({
      requirements: [{ title: 'One step', detail: 'Easy.', icon: 'star' }],
    });
    expect(out.requirements).toEqual([
      { icon: 'star', title: 'One step', detail: 'Easy.', url: undefined },
    ]);
  });

  it('rows without a title are dropped; all-empty falls back', () => {
    const out = mergeSuperHelper({ requirements: [{ detail: 'no name' }, {}] });
    expect(out.requirements).toEqual(superHelperFallback.requirements);
  });
});
