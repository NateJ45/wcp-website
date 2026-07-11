# Contact forms

Any page can have a **contact / tour-request / inquiry form**: in the page builder add a
**Contact form** section, set its _topic_ (e.g. "Tour request") and labels. The fields are
fixed (name, email, optional phone, message) so it stays on-brand and simple.

## How a submission flows

1. A visitor submits. With JavaScript the form posts in the background and shows an inline
   thank-you; without JS it posts natively and lands on `/thank-you`.
2. [`/api/contact`](../src/pages/api/contact.ts) (SSR) runs in the Worker: it drops obvious
   spam (a hidden **honeypot** field), validates, and then:
   - **Always** stores the message as a `submission` document in Sanity → the board reads
     it in the Studio under **Form submissions** (mark "Handled" when replied). Nothing is
     ever lost, even if email isn't configured.
   - **If a Resend key is set**, also emails the office so someone is notified in real time.

So the form works the moment it's on a page — the email step is an optional upgrade.

## Enabling email notifications (Resend) — the one setup step

Email is off until you add a [Resend](https://resend.com) key (free tier: 3,000
emails/month, 100/day). Steps:

1. Create a Resend account and **verify your sending domain** (e.g.
   `westchesterpreschool.org`) in the Resend dashboard. (You can test first with their
   `onboarding@resend.dev` sender and skip domain verification.)
2. Create an **API key** in Resend.
3. Add it as a secret to the deployed Worker **and** to GitHub (so builds have it):

   ```sh
   # From site/ , with wrangler logged in:
   npx wrangler secret put RESEND_API_KEY
   # optional overrides (defaults: CONTACT_TO = site general email,
   # CONTACT_FROM = onboarding@resend.dev):
   npx wrangler secret put CONTACT_TO       # e.g. president@westchesterpreschool.org
   npx wrangler secret put CONTACT_FROM      # e.g. "WCP Website <hello@westchesterpreschool.org>"
   ```

   For local testing, put the same keys in `site/.dev.vars`.

That's it — new submissions will email `CONTACT_TO` (with the visitor's address as
reply-to) and continue to be saved in the Studio.

## Spam

A honeypot field blocks basic bots with zero friction (no CAPTCHA). If spam ever becomes a
problem, the next step is Cloudflare **Turnstile** (a free, privacy-friendly CAPTCHA) — a
site key + secret and a check in `/api/contact`. Not needed for a low-traffic site.

## Notes

- Astro's CSRF protection (`security.checkOrigin`) requires a same-origin `Origin` header
  on the POST, so the form only accepts submissions from the site itself.
- Submissions can contain a prospective family's name, email, and phone — treat the
  **Form submissions** inbox as private contact info.
