import { describe as suite, expect, it, vi } from 'vitest';

// hub-air-quality imports the SWR cache, which pulls in `cloudflare:workers`
// and can't initialise in the vitest env. describeAqi is a pure breakpoint
// lookup that never touches it, so stub the module out to keep the import
// clean (same pattern as hub-calendar.test.ts).
vi.mock('@/lib/hub-cache', () => ({ cached: vi.fn() }));

import { describeAqi } from './hub-air-quality';

// The EPA tier boundaries ARE the contract: AQI 51 is Moderate, not Good, and
// shipping "Good outdoor air today" over a 53 reading is exactly the bug these
// cases exist to prevent. Test the edges, not the comfortable middles.
suite('describeAqi', () => {
  it('calls 0-50 good air, safe for outside play', () => {
    for (const aqi of [0, 25, 50]) {
      expect(describeAqi(aqi)).toEqual({ icon: 'leaf', line: 'Great air for outside play!' });
    }
  });

  it('flips to Moderate copy at 51, not 55 or 60', () => {
    // The original bug: 51-100 is EPA Moderate, but the chip said "Good".
    expect(describeAqi(51).line).toBe('Decent air, fine for outside play');
    expect(describeAqi(51).line).not.toMatch(/good/i);
    for (const aqi of [51, 53, 59, 100]) {
      expect(describeAqi(aqi)).toEqual({ icon: 'wind', line: 'Decent air, fine for outside play' });
    }
  });

  it('warns for sensitive kids across 101-150', () => {
    for (const aqi of [101, 125, 150]) {
      expect(describeAqi(aqi)).toEqual({
        icon: 'triangle-alert',
        line: 'Sensitive kiddos: shorter outdoor time',
      });
    }
  });

  it('calls an indoor day above 150', () => {
    for (const aqi of [151, 200, 500]) {
      expect(describeAqi(aqi)).toEqual({
        icon: 'triangle-alert',
        line: 'Indoor play day — air quality is poor',
      });
    }
  });

  it('never labels a non-Good reading with Good-tier copy', () => {
    const good = describeAqi(0).line;
    for (let aqi = 51; aqi <= 300; aqi++) {
      expect(describeAqi(aqi).line).not.toBe(good);
    }
  });
});
