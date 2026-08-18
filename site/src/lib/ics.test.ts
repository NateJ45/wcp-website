import { describe, expect, test } from 'vitest';
import { buildIcs } from './ics';

// =============================================================================
// Unit tests for the .ics builder (/api/event-ics). Pure and hermetic.
// =============================================================================

const NOW = new Date('2026-08-17T12:00:00Z');

describe('buildIcs', () => {
  test('a timed event carries UTC stamps and defaults the end to +1 hour', () => {
    const ics = buildIcs(
      { _id: 'evt1', title: 'Open House', startDate: '2026-10-03T22:00:00Z' },
      '',
      NOW,
    );
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('UID:evt1@westchesterpreschool');
    expect(ics).toContain('DTSTART:20261003T220000Z');
    expect(ics).toContain('DTEND:20261003T230000Z');
    expect(ics).toContain('SUMMARY:Open House');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  test('an all-day event uses VALUE=DATE with an exclusive end date', () => {
    // Date-only strings anchor to noon UTC, so the date never shifts a day.
    const ics = buildIcs(
      {
        _id: 'evt2',
        title: 'No school',
        startDate: '2026-11-26',
        endDate: '2026-11-27',
        allDay: true,
      },
      '',
      NOW,
    );
    expect(ics).toContain('DTSTART;VALUE=DATE:20261126');
    expect(ics).toContain('DTEND;VALUE=DATE:20261128');
  });

  test('a one-day all-day event ends the next day', () => {
    const ics = buildIcs(
      { _id: 'evt3', title: 'Picture day', startDate: '2026-09-15', allDay: true },
      '',
      NOW,
    );
    expect(ics).toContain('DTSTART;VALUE=DATE:20260915');
    expect(ics).toContain('DTEND;VALUE=DATE:20260916');
  });

  test('reserved characters and newlines are escaped', () => {
    const ics = buildIcs(
      {
        _id: 'evt4',
        title: 'Party; bring snacks, please',
        startDate: '2026-10-03T22:00:00Z',
        description: 'Line one\nLine two',
        location: 'Room A, Building B',
      },
      '',
      NOW,
    );
    expect(ics).toContain('SUMMARY:Party\\; bring snacks\\, please');
    expect(ics).toContain('DESCRIPTION:Line one\\nLine two');
    expect(ics).toContain('LOCATION:Room A\\, Building B');
  });

  test('the venue address wins over the typed location', () => {
    const ics = buildIcs(
      {
        _id: 'evt5',
        title: 'Field trip',
        startDate: '2026-10-03T22:00:00Z',
        location: 'typed place',
        venue: { name: 'The Farm', address: '123 Farm Lane' },
      },
      '',
      NOW,
    );
    expect(ics).toContain('LOCATION:123 Farm Lane');
  });

  test('long lines fold at 74 characters with a space continuation', () => {
    const ics = buildIcs(
      { _id: 'evt6', title: 'X'.repeat(120), startDate: '2026-10-03T22:00:00Z' },
      '',
      NOW,
    );
    const folded = ics.split('\r\n').find((l) => l.startsWith('SUMMARY'));
    expect(folded?.length).toBeLessThanOrEqual(74);
    expect(ics).toContain('\r\n X');
  });
});
