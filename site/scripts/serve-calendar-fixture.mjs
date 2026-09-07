#!/usr/bin/env node
// =============================================================================
// serve-calendar-fixture.mjs — a fake school calendar feed, for CI
// =============================================================================
// The hub calendar reads CALENDAR_FEED_URL, normally an Apps Script endpoint on
// script.google.com. CI blocks that host (see the "Gated hub tests" step in
// ci.yml) because from a GitHub runner those connections hang and then reset,
// which cost eleven tests and eight minutes of wall clock.
//
// Blocking is right for every other origin, whose widgets are supposed to
// degrade to empty. The calendar is the exception: hub-hints.spec.ts asserts the
// Calendar hint appears, and that hint anchors to the type-filter nav, which
// calendar.astro only renders when `typesPresent.length > 1`. With no feed there
// are no events, so no types, so no nav, so nothing to anchor to — the same
// shape as the directory fixture that was starving hub-hints earlier today.
// Absence cannot test a filter. This serves content instead.
//
// The dates are GENERATED RELATIVE TO NOW rather than committed as fixed
// timestamps. A file of hard-coded 2026 dates would quietly stop producing
// upcoming events one day and take the test with it, which is precisely the
// class of silent rot this suite has spent the day digging out of.
//
// Types come from the TITLE via eventType() in src/lib/hub-calendar.ts, so the
// titles below are chosen to land in different buckets: "Board Meeting" ->
// meeting, "Fall Festival" -> event, "No School" -> closure. More than one type
// is the whole point.
// =============================================================================
import { createServer } from 'node:http';

const PORT = Number(process.env.CALENDAR_FIXTURE_PORT ?? 8788);

/** ISO for `days` from now, at a fixed local hour so output is stable per run. */
function inDays(days, hour = 18) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

/**
 * Deliberately obviously fake, in the same spirit as tests/fixtures/*.json: if
 * one of these ever shows up on the real site, it should be unmistakable.
 * Shape is HubEvent[] — see fetchFeedEvents in src/lib/hub-calendar.ts.
 */
function events() {
  return [
    {
      title: 'Board Meeting (test fixture)',
      start: inDays(3, 19),
      end: inDays(3, 20),
      location: 'Fellowship Hall',
      description: 'Monthly board meeting. Fixture data.',
    },
    {
      title: 'Fall Festival (test fixture)',
      start: inDays(10, 16),
      end: inDays(10, 18),
      location: 'Playground',
      description: 'All-school festival. Fixture data.',
    },
    {
      title: 'No School — Teacher In-Service (test fixture)',
      start: inDays(17, 0),
      allDay: true,
      description: 'Closure. Fixture data.',
    },
  ];
}

const server = createServer((req, res) => {
  res.writeHead(200, {
    'content-type': 'application/json',
    // The worker caches the raw feed for 12h keyed on the URL; this process
    // lives for one CI step, so caching anything here would only confuse.
    'cache-control': 'no-store',
  });
  res.end(JSON.stringify(events()));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`serve-calendar-fixture: http://127.0.0.1:${PORT}/ (${events().length} events)`);
});
