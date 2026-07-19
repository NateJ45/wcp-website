import { describe as suite, expect, it } from 'vitest';
import { aqiFromPm25, describeAqi } from './aqi-scale';

// Regression anchor for the 2026-07-19 incident: the hub reported AQI 61 and
// told families it was "fine for outside play" while EPA monitors in Cincinnati
// reported 153, Unhealthy. These tests pin the two things that made that
// possible: the concentration→AQI math the model bypassed, and copy that
// asserted safety on a tier that cannot support it.
suite('aqiFromPm25 — EPA 2024 breakpoints', () => {
  it('pins each Good/Moderate boundary', () => {
    expect(aqiFromPm25(0)).toBe(0);
    expect(aqiFromPm25(9.0)).toBe(50);
    // 9.1 is the first Moderate concentration under the 2024 revision (it was
    // 12.1 before; using the old table here would under-read every reading in
    // the 9-12 band by a whole category).
    expect(aqiFromPm25(9.1)).toBe(51);
    expect(aqiFromPm25(35.4)).toBe(100);
  });

  it('pins the Unhealthy-for-Sensitive and Unhealthy boundaries', () => {
    expect(aqiFromPm25(35.5)).toBe(101);
    expect(aqiFromPm25(55.4)).toBe(150);
    expect(aqiFromPm25(55.5)).toBe(151);
    expect(aqiFromPm25(125.4)).toBe(200);
  });

  it('reads the incident concentration as Moderate-high, not 61', () => {
    // Open-Meteo reported pm2_5 = 28.4 µg/m³ alongside us_aqi = 61 on the day.
    // Its own concentration already implied ~87: the model's AQI was internally
    // inconsistent with the model's own particulates.
    const aqi = aqiFromPm25(28.4)!;
    expect(aqi).toBeGreaterThan(80);
    expect(aqi).toBeLessThanOrEqual(100);
  });

  it('caps off-scale-high rather than extrapolating', () => {
    expect(aqiFromPm25(400)).toBe(500);
  });

  it('returns null for junk instead of inventing a number', () => {
    expect(aqiFromPm25(NaN)).toBeNull();
    expect(aqiFromPm25(-1)).toBeNull();
  });
});

suite('describeAqi', () => {
  it('calls 0-50 good air, safe for outside play', () => {
    for (const aqi of [0, 1, 25, 50]) {
      expect(describeAqi(aqi)).toEqual({ icon: 'leaf', line: 'Great air for outside play!' });
    }
  });

  it('flips out of Good at 51, not 55 or 60', () => {
    expect(describeAqi(50).line).toMatch(/great/i);
    expect(describeAqi(51).line).not.toMatch(/great/i);
    for (const aqi of [51, 61, 99, 100]) {
      expect(describeAqi(aqi).icon).toBe('wind');
    }
  });

  it('never tells families a Moderate day is fine for outside play', () => {
    // The exact sentence that shipped over an Unhealthy reading. No tier above
    // Good may authorise the decision; it reports, an adult decides.
    for (const aqi of [51, 61, 87, 100]) {
      expect(describeAqi(aqi).line).not.toMatch(/fine for outside play/i);
    }
  });

  it('warns from 101 and calls an indoor day above 150', () => {
    expect(describeAqi(101).icon).toBe('triangle-alert');
    expect(describeAqi(150).line).toMatch(/shorter outdoor time/i);
    expect(describeAqi(151).line).toMatch(/indoor play day/i);
    expect(describeAqi(153).line).toMatch(/indoor play day/i);
  });

  // Ported from the retired hub-air-quality.test.ts, which this file replaces.
  it('never labels a non-Good reading with Good-tier copy', () => {
    const good = describeAqi(0).line;
    for (let aqi = 51; aqi <= 300; aqi++) {
      expect(describeAqi(aqi).line).not.toBe(good);
    }
  });

  // The retired copy read "Indoor play day — air quality is poor". Visitor-
  // facing text takes no em-dashes (CLAUDE.md copy voice); the chip renders in
  // the hub, which families read, so the rule applies.
  it('uses no em-dashes in any tier', () => {
    for (const aqi of [0, 51, 101, 151, 300]) {
      expect(describeAqi(aqi).line).not.toMatch(/—/);
    }
  });
});
