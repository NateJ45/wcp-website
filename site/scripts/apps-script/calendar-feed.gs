/**
 * WCP calendar feed — serves the school Google Calendar as JSON for the hub,
 * plus a daily watchdog and a weekly Drive backup.
 * =============================================================================
 * The Family Hub reads this web app's URL (Sanity: Site Settings → Calendar
 * feed link) server-side, behind the family gate. The contract it must keep
 * (consumed by site/src/lib/hub-calendar.ts):
 *
 *   [ { "title": "Board Meeting",
 *       "start": "2026-08-10T22:00:00.000Z",   // ISO datetime, OR
 *                "2026-08-10",                  // date-only for all-day events
 *       "end": "2026-08-10T23:30:00.000Z",     // optional, timed events only
 *       "allDay": false,
 *       "location": "...",                      // optional
 *       "description": "...",                   // optional, plain text
 *       "created": "2026-08-20T14:03:00.000Z" }, ... ]  // optional, see below
 *
 * covering roughly a rolling 12 months. Date-only strings MUST be the event's
 * EASTERN calendar day (the site anchors them to noon UTC before formatting).
 * `end` + `description` light up existing hub UI: the event dialog shows the
 * time range and details, and both prefill the "Add to my calendar" link.
 * `created` is when the event was PUT ON the calendar, not when it happens:
 * the hub's what's-new bell announces an event added in the last 14 days.
 * The site treats it as optional, so a deployment older than 2026-08-29 just
 * announces no events. Redeploy this script to switch that on.
 * NOTE: the calendar is public (embed + ICS), so event descriptions are
 * public content — never put private info in them.
 *
 * Setup (any Google account that can SEE the calendar — read-only is enough):
 *   1. In Google Calendar, subscribe to the school calendar:
 *      "Other calendars" → + → "Subscribe to calendar" → enter CALENDAR_ID.
 *   2. script.google.com → New project → paste this file → save.
 *   3. Run listUpcoming once from the editor and grant the permissions
 *      (Calendar + Drive + Mail, used by the feed/backup/watchdog).
 *   4. Deploy → New deployment → Web app → Execute as: Me → Access: Anyone.
 *      (Updating later: Deploy → MANAGE deployments → edit → new version, so
 *      the /exec URL the site points at never changes.)
 *   5. Open the /exec URL in a browser and check a JSON array of events shows.
 *   6. Paste the /exec URL into Studio → Site Settings → Calendar feed link.
 *   7. Run setupTriggers once: installs the daily watchdog (emails you if the
 *      calendar becomes unreachable/empty) and the weekly Drive backup.
 *
 * When the school migrates to a co-op-owned calendar, only CALENDAR_ID and the
 * Studio "Google Calendar ID" setting need to change — and the latest backup
 * file in Drive ("WCP Calendar Backups") can seed the new calendar.
 * =============================================================================
 */

var CALENDAR_ID = 'contact@westchesterpreschool.org';
var TZ = 'America/New_York';
var BACKUP_FOLDER = 'WCP Calendar Backups';
var BACKUPS_TO_KEEP = 12;

// ---------------------------------------------------------------------------
// The feed (web app)
// ---------------------------------------------------------------------------

function doGet() {
  var cal = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!cal) {
    // Not subscribed (or access revoked): serve an empty array so the hub
    // falls back to Sanity events instead of erroring. The daily watchdog
    // emails about this state so it never stays silent.
    return ContentService.createTextOutput('[]').setMimeType(ContentService.MimeType.JSON);
  }
  var now = new Date();
  var windowStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  var windowEnd = new Date(now.getFullYear() + 1, now.getMonth(), 1);
  // Prospective-family tour bookings ("Tour with <parent> ...") land on this
  // calendar from the tour booking flow and carry visitor/child names — never
  // serve them (the site filters them too, but keeping the names out of the
  // feed entirely means they never leave Google). The weekly Drive backup
  // still includes them: it is a private full-calendar backup.
  var events = cal
    .getEvents(windowStart, windowEnd)
    .filter(function (e) {
      return !/^\s*tour with\b/i.test(e.getTitle() || '');
    })
    .map(eventToJson_);
  return ContentService.createTextOutput(JSON.stringify(events)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/** One calendar event → the feed's JSON shape. */
function eventToJson_(e) {
  var allDay = e.isAllDayEvent();
  var out = {
    title: e.getTitle(),
    // All-day events: the Eastern calendar day, never a UTC datetime (a UTC
    // midnight would render as the previous day on the site).
    start: allDay
      ? Utilities.formatDate(e.getAllDayStartDate(), TZ, 'yyyy-MM-dd')
      : e.getStartTime().toISOString(),
    allDay: allDay,
  };
  // End time for timed events only — the site shows "6:00 – 7:30 PM" ranges
  // and builds accurate Add-to-Google links from it. All-day events skip it
  // (the site labels them "All day").
  if (!allDay) out.end = e.getEndTime().toISOString();
  var loc = e.getLocation();
  if (loc) out.location = loc;
  var desc = cleanDescription_(e.getDescription());
  if (desc) out.description = desc;
  // When the event was ADDED to the calendar. The hub's what's-new bell shows
  // "Added to the calendar: ..." for the last 14 days. Guarded: a recurring
  // event instance can refuse getDateCreated, and one bad event must not empty
  // the whole feed. Without the field the site simply announces nothing.
  try {
    var made = e.getDateCreated();
    if (made) out.created = made.toISOString();
  } catch (err) {
    // no created date for this event; the site handles the gap
  }
  return out;
}

/** Google Calendar descriptions can carry HTML; the hub renders plain text.
 *  Strip tags, decode the common entities, collapse whitespace, cap length. */
function cleanDescription_(html) {
  if (!html) return '';
  var text = String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
  return text.length > 600 ? text.slice(0, 597) + '…' : text;
}

// ---------------------------------------------------------------------------
// Watchdog (daily trigger): the hub SILENTLY falls back to Sanity events when
// this feed goes blank (e.g. the calendar owner flips it private and the
// subscription dies), so convert that silent failure into a same-day email.
// ---------------------------------------------------------------------------

function watchdog() {
  var problem = null;
  var cal = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!cal) {
    problem =
      'CalendarApp cannot see "' +
      CALENDAR_ID +
      '" any more. Most likely the calendar was made private or the ' +
      'subscription was removed. The hub is now showing its Sanity fallback ' +
      'events instead of the live calendar.';
  } else {
    var upcoming = cal.getEvents(new Date(), new Date(Date.now() + 60 * 24 * 3600 * 1000));
    if (upcoming.length === 0) {
      problem =
        'The calendar is reachable but has ZERO events in the next 60 days. ' +
        'If that is not expected (summer aside), events may have been deleted.';
    }
  }
  if (!problem) return;
  MailApp.sendEmail(
    Session.getEffectiveUser().getEmail(),
    '⚠ WCP calendar feed problem',
    problem +
      '\n\nChecks:\n' +
      '1. Google Calendar → is "' +
      CALENDAR_ID +
      '" still in your calendar list?\n' +
      '2. Open the feed URL (Apps Script → Deploy → Manage deployments) — does it return events?\n' +
      '3. If the calendar went private, ask the owner to re-share it (or restore public access).\n\n' +
      '(Sent daily by the calendar-feed Apps Script watchdog while the problem persists.)',
  );
}

// ---------------------------------------------------------------------------
// Backup (weekly trigger): a JSON snapshot of every event (past 12 months to
// +18 months, full details) into Drive. If the calendar's owner account is
// ever deleted, the newest file rebuilds a co-op-owned calendar in minutes.
// ---------------------------------------------------------------------------

function weeklyBackup() {
  var cal = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!cal) return; // watchdog reports this state; nothing to back up
  var now = new Date();
  var events = cal
    .getEvents(
      new Date(now.getFullYear() - 1, now.getMonth(), 1),
      new Date(now.getFullYear() + 1, now.getMonth() + 6, 1),
    )
    .map(eventToJson_);

  var folder = getOrCreateFolder_(BACKUP_FOLDER);
  var name = 'wcp-calendar-backup-' + Utilities.formatDate(now, TZ, 'yyyy-MM-dd') + '.json';
  folder.createFile(name, JSON.stringify(events, null, 2), 'application/json');

  // Prune: keep the newest BACKUPS_TO_KEEP files (names sort by date).
  var files = [];
  var it = folder.getFiles();
  while (it.hasNext()) {
    var f = it.next();
    if (/^wcp-calendar-backup-\d{4}-\d{2}-\d{2}\.json$/.test(f.getName())) files.push(f);
  }
  files.sort(function (a, b) {
    return a.getName() < b.getName() ? 1 : -1; // newest first
  });
  files.slice(BACKUPS_TO_KEEP).forEach(function (f) {
    f.setTrashed(true);
  });
}

function getOrCreateFolder_(name) {
  var it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

// ---------------------------------------------------------------------------
// One-time helpers (run from the editor)
// ---------------------------------------------------------------------------

/** Installs the two clock triggers (idempotent: clears this project's old
 *  triggers for the same functions first). Run once after deploying. */
function setupTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var fn = t.getHandlerFunction();
    if (fn === 'watchdog' || fn === 'weeklyBackup') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('watchdog').timeBased().everyDays(1).atHour(7).create();
  ScriptApp.newTrigger('weeklyBackup')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(6)
    .create();
  Logger.log('Installed: watchdog (daily ~7am), weeklyBackup (Sundays ~6am).');
}

/** Editor-run helper: triggers the permission prompts and logs a sample, so
 *  you can confirm calendar access before deploying. */
function listUpcoming() {
  var cal = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!cal) {
    Logger.log('Calendar not found — subscribe to ' + CALENDAR_ID + ' first.');
    return;
  }
  var events = cal.getEvents(new Date(), new Date(Date.now() + 90 * 24 * 3600 * 1000));
  Logger.log(events.length + ' events in the next 90 days:');
  events.slice(0, 10).forEach(function (e) {
    Logger.log(' - ' + e.getTitle() + ' @ ' + e.getStartTime());
  });
}
