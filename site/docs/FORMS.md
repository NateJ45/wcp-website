# Website forms — how submissions flow, and the one-time Google setup

> Two Apps Scripts live in `scripts/apps-script/`: **`forms-inbox.gs`** (this doc — the
> submissions Sheet, board emails, weekly digest) and **`calendar-feed.gs`** (a separate
> project + deployment serving the calendar JSON feed; see [GOOGLE.md](GOOGLE.md)).
> "The script" below always means forms-inbox; each has its own /exec URL and its own
> update procedure. If the checked-in copy here gains features (e.g. the `hours`/`photo`
> tabs added 2026-07-17), the DEPLOYED script must be re-pasted per "Updating the script
> later" below to pick them up.

Any page can carry a form: in the page builder add a **Contact form** section, set its
_topic_, and pick its **Form fields** variant. The variants reproduce the old Squarespace
forms field-for-field (see the VARIANTS map in
[`ContactForm.astro`](../src/components/ContactForm.astro)):

| Variant    | Used on       | Asks for                                                                |
| ---------- | ------------- | ----------------------------------------------------------------------- |
| `general`  | /contact      | First + last name, email, subject, message                              |
| `enroll`   | /enroll       | Parent + child name, child's birthdate, phone, class checkboxes, extras |
| `tour`     | /virtual-tour | Child info, class checkboxes, preferred dates/times                     |
| `teach`    | /work-with-us | Experience, age groups, ECE certification, about-you                    |
| `waitlist` | waitlist CTAs | Child name + birthdate, hoped-for class, preferred start                |

The **Newsletter sign-up** section (first name, last name, email) posts to
[`/api/subscribe`](../src/pages/api/subscribe.ts); everything else posts to
[`/api/contact`](../src/pages/api/contact.ts). With JavaScript the form submits in the
background and shows an inline thank-you; without JS it posts natively and lands on
`/thank-you`. A hidden honeypot drops obvious bots first.

## How a submission fans out

Each step is independent — one failure never loses a message:

1. **Sanity (always on, zero config)** — stored as a `submission` / `subscriber` doc.
   Studio → **Form submissions** / **Newsletter subscribers**. The safety net. The
   submissions inbox is foldered: **Needs a reply** (not yet marked Handled), then one
   folder per form `topic` (built live from the data, so a new form auto-appears), then
   **All messages**.
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
row. Co-op hours a family logs on `/family-hub/hours` forward as kind `hours` (family
name, hours, category, activity, date) — the source of truth is the `hoursLog` doc in
Sanity, so the webhook here is just an optional FYI/backup and the tracker works without
it. A photo a family submits on `/family-hub/photos` forwards a kind `photo` nudge
(family name + caption, no image) so the board knows one is waiting to be reviewed; the
photo itself is a moderated `photoSubmission` in Sanity (see
[FAMILY_HUB.md](FAMILY_HUB.md)). Quota is ~1,500 emails/day on Workspace; the forms will
never come close.

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

## The newsletter (compose in the Studio, archive on the web, optional send)

The board composes a **Newsletter issue** in the Studio (Everyday edits → **Newsletter
issues**) like a News post: a title, a cover, a short summary, and a rich body.
Publishing it gives the issue a permanent public page at `/newsletter/<slug>` and a card
in the `/newsletter/archive` list — so every issue is readable and shareable on the web,
whether or not it's ever emailed. (The `/newsletter` page itself stays the sign-up
landing.)

**Sending is separate and optional**, and reuses the same Apps Script mailer as the
digest, because Workers can't send email on the free tier. The site exposes a
token-protected feed at `/api/newsletter?token=…` (matches `FORMS_WEBHOOK_TOKEN`; 404s
without it) that returns the latest published issue as a compact teaser — subject,
summary, cover image, and the public URL. To enable sending, add a `sendNewsletter()`
function to the Apps Script (NOT yet in the checked-in `forms-inbox.gs` — write it when
the board first wants this) that
fetches that, emails the subscriber/families list a short "new issue is up" note linking
to the page, and the board runs it (or adds a trigger) when an issue is ready. Pass
`&slug=<slug>` to send a specific older issue instead of the latest. After sending, the
board can note the date in the issue's **Date emailed to families** field for their own
records (it doesn't send anything). No issue published yet → the feed returns
`{ issue: null }` so the mailer cleanly skips.

## Daily board reminders (optional)

A token-protected `/api/reminders?token=…` feed (matches `FORMS_WEBHOOK_TOKEN`; 404s
without it) returns the board's current to-do and heads-up list: things left on or
overdue (the alert banner still on, announcements past their end date, week-old
unanswered messages, unpublished drafts) and things coming up in the next two weeks
(the enrollment deadline, events, and sign-up sheets closing). The logic lives in
`src/lib/reminders.ts` (unit-tested) and is shared with the Studio **Checkup** tool's
"Coming up" section, so the emailed list and the in-Studio view never drift.

To email it, add a `boardReminders()` function + daily trigger to the Apps Script (same
mailer/token as the digest; NOT yet in the checked-in `forms-inbox.gs` — write it when
the board first wants this): fetch the feed, and if `reminders` is non-empty, email the
board a short bulleted list. Set a **Time-driven → Day timer → 7–8am** trigger. Nothing due → nothing
sent. Sending runs on the Google side because Workers can't send email on the free tier;
a Cloudflare cron would still have to hand off to the same mailer, so the Apps Script
trigger is the whole mechanism.

## Optional extras

- **Resend email** (`RESEND_API_KEY`, optional `CONTACT_TO` / `CONTACT_FROM`): the older
  notification path; needs a verified sending domain for a branded From address.
- **Newsletter list provider**: `NEWSLETTER_PROVIDER=buttondown` + `BUTTONDOWN_API_KEY`,
  or `NEWSLETTER_PROVIDER=mailchimp` + `MAILCHIMP_API_KEY` + `MAILCHIMP_LIST_ID` +
  `MAILCHIMP_SERVER_PREFIX`. Until set, signups are store-only — download them as a CSV any
  time with the **Export** tool (Everything workspace → **Export** in the top nav), which
  also exports form submissions and the family directory. No developer or CLI needed.

## Spam

The honeypot blocks basic bots with zero friction. Cloudflare **Turnstile** (free,
privacy-friendly) is wired but **dormant**: the day real spam appears, create a
Turnstile widget in the Cloudflare dash, then set

```sh
# site/.env (and the deploy env): renders the widget on every contact form
PUBLIC_TURNSTILE_SITE_KEY=...
# Worker secret: makes /api/contact reject submissions that fail verification
npx wrangler secret put TURNSTILE_SECRET_KEY
```

and redeploy. Until both are set there is no widget, no third-party script, and no
behavior change. (If Cloudflare's verify service is ever unreachable, submissions pass
through rather than losing a real family's message.)

## Notes

- Astro's CSRF protection (`security.checkOrigin`) requires a same-origin `Origin` header
  on the POST, so the forms only accept submissions from the site itself.
- Submissions contain a prospective family's contact details (and a child's name and
  birthdate on the enroll form) — treat the submissions inbox, the notification Gmail,
  and the Google Sheet as private contact info.
