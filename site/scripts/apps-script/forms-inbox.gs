/**
 * WCP Forms Inbox — Google Apps Script web app
 * =============================================================================
 * Receives every website form submission (enroll / tour / contact / teaching /
 * newsletter) from the Cloudflare Worker (/api/contact and /api/subscribe) and:
 *   1. Appends a row to the submissions Google Sheet (one tab per kind).
 *   2. Emails the board's Gmail with reply-to set to the family, so staff
 *      just hit Reply in Gmail to answer them.
 *
 * SETUP (once, ~5 minutes — see site/docs/FORMS.md for the full walkthrough):
 *   1. Create a Google Sheet named "WCP Website Submissions" in the school
 *      Workspace.
 *   2. In that Sheet: Extensions → Apps Script → paste this whole file.
 *   3. Fill in the two settings below (NOTIFY_EMAIL + SHARED_TOKEN).
 *   4. Deploy → New deployment → type "Web app" →
 *        Execute as: Me · Who has access: Anyone
 *      → copy the web app URL.
 *   5. Give the Worker the URL + token:
 *        cd site
 *        npx wrangler secret put FORMS_WEBHOOK_URL     (paste the URL)
 *        npx wrangler secret put FORMS_WEBHOOK_TOKEN   (paste the token)
 *      and add both to .dev.vars for local dev. Redeploy the site.
 *
 * Quotas: Workspace accounts may send ~1,500 emails/day via MailApp — far
 * beyond what a preschool's forms will ever see.
 */

// ── Settings ─────────────────────────────────────────────────────────────────
const NOTIFY_EMAIL = 'contact@westchesterpreschool.org'; // where submissions land
const SHARED_TOKEN = 'CHANGE-ME-to-a-long-random-string'; // must match FORMS_WEBHOOK_TOKEN

// Weekly digest (optional): where the Monday-morning family digest goes —
// usually the all-families Google Group. To turn it on, set these and add a
// time-driven trigger: Apps Script editor → Triggers (clock icon) →
// Add Trigger → weeklyDigest → Time-driven → Week timer → Monday, 7-8am.
const DIGEST_TO = ''; // e.g. 'families@westchesterpreschool.org' — blank = off
const SITE_URL = 'https://wcp-website.nathanjnixon86.workers.dev'; // no trailing slash

// One tab per submission kind, created on first use. `hours` and `photo` are
// FYI/backup rows from the hub (the source of truth is Sanity — hoursLog and
// photoSubmission docs); without these entries they were silently coerced
// into the contact tab (2026-07-17 docs audit).
const SHEETS = {
  contact: ['When', 'Topic', 'Name', 'Email', 'Phone', 'Message', 'From page'],
  newsletter: ['When', 'Name', 'Email', 'From page'],
  signup: ['When', 'Sheet', 'Slot', 'Name', 'Note'],
  hours: ['When', 'Family', 'Hours', 'Category', 'Activity', 'Date'],
  photo: ['When', 'Family', 'Caption'],
};

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return respond({ ok: false, error: 'bad json' });
  }
  if (!SHARED_TOKEN || data.token !== SHARED_TOKEN) {
    return respond({ ok: false, error: 'bad token' });
  }

  const kind = SHEETS[data.kind] ? data.kind : 'contact';
  const when = data.submittedAt || new Date().toISOString();

  // 1. Append to the Sheet.
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(kind);
    if (!sheet) {
      sheet = ss.insertSheet(kind);
      sheet.appendRow(SHEETS[kind]);
      sheet.setFrozenRows(1);
    }
    if (kind === 'newsletter') {
      sheet.appendRow([when, data.name || '', data.email || '', data.pageUrl || '']);
    } else if (kind === 'signup') {
      // A Family Hub sign-up / RSVP (see site/src/pages/family-hub/api/signup.ts).
      sheet.appendRow([
        when,
        data.sheetTitle || '',
        data.slot || '',
        data.name || '',
        data.note || '',
      ]);
    } else if (kind === 'hours') {
      // Co-op hours FYI (site/src/pages/family-hub/api/log-hours.ts).
      sheet.appendRow([
        when,
        data.name || '',
        data.hours || '',
        data.category || '',
        data.activity || '',
        data.date || '',
      ]);
    } else if (kind === 'photo') {
      // Photo-wall moderation nudge (site/src/pages/family-hub/api/photo-submit.ts).
      sheet.appendRow([when, data.name || '', data.caption || '']);
    } else {
      sheet.appendRow([
        when,
        data.topic || '',
        data.name || '',
        data.email || '',
        data.phone || '',
        data.message || '',
        data.pageUrl || '',
      ]);
    }
  } catch (err) {
    console.error('sheet append failed: ' + err);
  }

  // 2. Email the board. Newsletter signups skip email (they'd be noisy);
  //    hub sign-ups/RSVPs send a short FYI note (no reply expected).
  if (kind === 'signup') {
    try {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: '[WCP hub] ' + (data.sheetTitle || 'Sign-up') + ' — ' + (data.name || 'Someone'),
        body:
          'A family responded on the hub sign-ups page:\n\n' +
          'Sheet: ' +
          (data.sheetTitle || '-') +
          '\n' +
          'Slot:  ' +
          (data.slot || '-') +
          '\n' +
          'Name:  ' +
          (data.name || '-') +
          '\n' +
          (data.note ? 'Note:  ' + data.note + '\n' : '') +
          'When:  ' +
          when +
          '\n\n' +
          'All responses: the "signup" tab of this Sheet, or the Studio inbox\n' +
          '(Family Hub -> Sign-up responses).',
      });
    } catch (err) {
      console.error('mail failed: ' + err);
    }
  }
  if (kind === 'photo') {
    // A moderation nudge: a photo is sitting in the Studio queue. Hours rows
    // stay email-silent on purpose (one per logged hour would be noisy; the
    // tab is the backup).
    try {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: '[WCP hub] Photo waiting for review — ' + (data.name || 'a family'),
        body:
          'A family submitted a photo for the hub photo wall:\n\n' +
          'From:    ' +
          (data.name || '-') +
          '\n' +
          (data.caption ? 'Caption: ' + data.caption + '\n' : '') +
          'When:    ' +
          when +
          '\n\n' +
          'Review it in the Studio: Family Hub -> Photo submissions.',
      });
    } catch (err) {
      console.error('mail failed: ' + err);
    }
  }
  if (kind === 'contact') {
    try {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        replyTo: data.email || NOTIFY_EMAIL,
        subject: '[WCP website] ' + (data.topic || 'Contact') + ' — ' + (data.name || 'Unknown'),
        body:
          'New submission from the website form:\n\n' +
          'Name:  ' +
          (data.name || '-') +
          '\n' +
          'Email: ' +
          (data.email || '-') +
          '\n' +
          'Phone: ' +
          (data.phone || '-') +
          '\n' +
          'Page:  ' +
          (data.pageUrl || '-') +
          '\n' +
          'When:  ' +
          when +
          '\n\n' +
          (data.message || '(no message)') +
          '\n\n' +
          '— Reply to this email to answer them directly.',
      });
    } catch (err) {
      console.error('mail failed: ' + err);
    }
  }

  return respond({ ok: true });
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

// ── Weekly family digest ─────────────────────────────────────────────────────
// Runs on a weekly time-driven trigger (see the Settings note above). Pulls
// the week's hub announcements + the next two weeks of events from the
// website (/api/digest, token-protected) and emails one tidy note to
// DIGEST_TO. Sends nothing when there's nothing new.
function weeklyDigest() {
  if (!DIGEST_TO) return;
  let data;
  try {
    const res = UrlFetchApp.fetch(
      SITE_URL + '/api/digest?token=' + encodeURIComponent(SHARED_TOKEN),
      { muteHttpExceptions: true },
    );
    if (res.getResponseCode() !== 200) {
      console.error('digest fetch failed: ' + res.getResponseCode());
      return;
    }
    data = JSON.parse(res.getContentText());
  } catch (err) {
    console.error('digest fetch failed: ' + err);
    return;
  }

  const announcements = data.announcements || [];
  const events = data.events || [];
  if (announcements.length === 0 && events.length === 0) return; // quiet week

  let body = 'Hi WCP families! Here is what is happening this week.\n';
  if (announcements.length) {
    body += '\nNEW THIS WEEK\n';
    for (const a of announcements) {
      body +=
        '\n• ' +
        a.title +
        (a.excerpt ? '\n  ' + a.excerpt : '') +
        (a.url ? '\n  ' + a.url : '') +
        '\n';
    }
  }
  if (events.length) {
    body += '\nCOMING UP\n';
    for (const e of events) {
      body += '\n• ' + e.when + ' — ' + e.title + (e.location ? ' (' + e.location + ')' : '');
    }
    body += '\n';
  }
  body += '\nEverything lives on the Family Hub: ' + SITE_URL + '/family-hub\n';

  try {
    MailApp.sendEmail({
      to: DIGEST_TO,
      subject: '[WCP] This week at preschool',
      body: body,
    });
  } catch (err) {
    console.error('digest mail failed: ' + err);
  }
}
