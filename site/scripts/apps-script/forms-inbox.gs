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

// One tab per submission kind, created on first use.
const SHEETS = {
  contact: ['When', 'Topic', 'Name', 'Email', 'Phone', 'Message', 'From page'],
  newsletter: ['When', 'Name', 'Email', 'From page'],
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

  const kind = data.kind === 'newsletter' ? 'newsletter' : 'contact';
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

  // 2. Email the board (skip newsletter signups — they'd be noisy; they're in
  //    the Sheet and in Sanity/Mailchimp already).
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
