# Website forms — how submissions flow, and the one-time Google setup

Any page can carry a form: in the page builder add a **Contact form** section, set its
_topic_, and pick its **Form fields** variant. The variants reproduce the old Squarespace
forms field-for-field (see the VARIANTS map in
[`ContactForm.astro`](../src/components/ContactForm.astro)):

| Variant   | Used on       | Asks for                                                                |
| --------- | ------------- | ----------------------------------------------------------------------- |
| `general` | /contact      | First + last name, email, subject, message                              |
| `enroll`  | /enroll       | Parent + child name, child's birthdate, phone, class checkboxes, extras |
| `tour`    | /virtual-tour | Child info, class checkboxes, preferred dates/times                     |
| `teach`   | /work-with-us | Experience, age groups, ECE certification, about-you                    |

The **Newsletter sign-up** section (first name, last name, email) posts to
[`/api/subscribe`](../src/pages/api/subscribe.ts); everything else posts to
[`/api/contact`](../src/pages/api/contact.ts). With JavaScript the form submits in the
background and shows an inline thank-you; without JS it posts natively and lands on
`/thank-you`. A hidden honeypot drops obvious bots first.

## How a submission fans out

Each step is independent — one failure never loses a message:

1. **Sanity (always on, zero config)** — stored as a `submission` / `subscriber` doc.
   Studio → **Form submissions** / **Newsletter subscribers**. The safety net.
2. **The Google forms inbox (free — the recommended one to turn on)** — a Google Apps
   Script web app on the school Workspace that appends a row to a Google Sheet AND emails
   the board's Gmail with **reply-to set to the family**, so staff answer by just hitting
   Reply in Gmail.
3. **Resend / newsletter provider (optional)** — legacy email path (`RESEND_API_KEY`) and
   list-provider push (Buttondown/Mailchimp secrets, see below). Redundant once the
   Google inbox is live.

## Turning on the Google inbox (once, ~5 minutes)

1. In the school Google Workspace, create a Sheet named **WCP Website Submissions**.
2. In that Sheet: **Extensions → Apps Script**, delete the placeholder, and paste the
   whole of [`scripts/apps-script/forms-inbox.gs`](../scripts/apps-script/forms-inbox.gs).
3. At the top of the script set:
   - `NOTIFY_EMAIL` — the Gmail address submissions should land in
     (e.g. `contact@westchesterpreschool.org`).
   - `SHARED_TOKEN` — any long random string (stops strangers who find the URL from
     injecting fake submissions).
4. **Deploy → New deployment → Web app** · _Execute as: Me_ · _Who has access: Anyone_ →
   **Deploy** → copy the web app URL.
5. Hand both values to the Worker:

   ```sh
   cd site
   npx wrangler secret put FORMS_WEBHOOK_URL     # paste the web app URL
   npx wrangler secret put FORMS_WEBHOOK_TOKEN   # paste the same token
   ```

   Add the same two lines to `site/.dev.vars` for local dev, then redeploy
   (`npm run deploy`).

From then on every inquiry emails the board (reply-to the family) and lands as a row in
the Sheet — `contact`, `newsletter`, and `signup` tabs are created automatically.
Newsletter signups go to the Sheet only (no email — they'd be noisy); hub sign-ups and
RSVPs (`/family-hub/sign-ups`, kind `signup`) send a short FYI email plus their Sheet
row. Quota is ~1,500 emails/day on Workspace; the forms will never come close.

## The weekly family digest (optional)

The same script can email families a Monday-morning digest — the week's hub
announcements plus the next two weeks of calendar events, pulled from the site's
token-protected `/api/digest` endpoint (it 404s without the matching
`FORMS_WEBHOOK_TOKEN`, so hub content stays private). To turn it on, in the Apps
Script editor:

1. Set `DIGEST_TO` (usually the all-families Google Group) and check `SITE_URL`.
2. **Triggers (clock icon) → Add Trigger** → function `weeklyDigest` → Time-driven →
   Week timer → Monday, 7–8am.

Quiet weeks (nothing new, nothing coming up) send nothing. It runs on the Google side
on purpose: Workers can't send email on the free tier, and the Apps Script already
holds the mailer, the token, and the recipients.

**Updating the script later:** edit in the Sheet's Apps Script editor, then
**Deploy → Manage deployments → edit (pencil) → Version: New version → Deploy**. The URL
stays the same. (Do NOT "New deployment" — that mints a new URL and needs a new
`FORMS_WEBHOOK_URL`.)

## Optional extras

- **Resend email** (`RESEND_API_KEY`, optional `CONTACT_TO` / `CONTACT_FROM`): the older
  notification path; needs a verified sending domain for a branded From address.
- **Newsletter list provider**: `NEWSLETTER_PROVIDER=buttondown` + `BUTTONDOWN_API_KEY`,
  or `NEWSLETTER_PROVIDER=mailchimp` + `MAILCHIMP_API_KEY` + `MAILCHIMP_LIST_ID` +
  `MAILCHIMP_SERVER_PREFIX`. Until set, signups are store-only (export from the Studio).

## Spam

The honeypot blocks basic bots with zero friction. If real spam ever gets through, the
next step is Cloudflare **Turnstile** (free, privacy-friendly) — a site key + secret and
a token check in `/api/contact`. Not needed for a low-traffic site.

## Notes

- Astro's CSRF protection (`security.checkOrigin`) requires a same-origin `Origin` header
  on the POST, so the forms only accept submissions from the site itself.
- Submissions contain a prospective family's contact details (and a child's name and
  birthdate on the enroll form) — treat the submissions inbox, the notification Gmail,
  and the Google Sheet as private contact info.
