# The Google side — every external Google dependency, and who owns it

The site leans on Google for live data (calendar, sheets, photos) and email
(Apps Script mailers). None of it is code; all of it is ACCOUNT-OWNED, and a
board transition can silently orphan a piece (that's how the calendar feed was
lost in 2026-07 — see the story below). This file is the map: what each piece
is, which account owns it, and what breaks if that account goes away.

**The standing rule:** share-by-link URLs (sheets, albums, feed URLs, docs) are
the access control, so they live ONLY in Sanity or `.dev.vars`, never in this
public repo. This file names the pieces, never the links.

## Inventory

| Piece                          | What it is                                                                                                                                             | Owner account                                                     | If the owner vanishes                                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **School calendar**            | The public Google Calendar (events, closures, meetings)                                                                                                | `contact@westchesterpreschool.org`                                | Calendar deleted with the account; hub falls back to Sanity `event` docs. Weekly JSON backups in the maintainer's Drive can rebuild it. |
| **Calendar feed web app**      | Apps Script serving the calendar as JSON ([source](../scripts/apps-script/calendar-feed.gs)); skips "Tour with …" booking events (visitor/child names) | Maintainer's personal account (redeployed 2026-07-17)             | Redeploy from the committed source under any account that can see the calendar; update Hub settings → Calendar feed link.               |
| **Calendar watchdog + backup** | Daily reachability check (emails on failure) + Sunday JSON snapshot to Drive, triggers in the same script                                              | Same as feed                                                      | Same as feed.                                                                                                                           |
| **Forms inbox**                | Google Sheet + [forms-inbox.gs](../scripts/apps-script/forms-inbox.gs): receives form submissions, sends mail, `weeklyDigest()`, `boardReminders()`    | "The school's Google account" — **verify which** (see PENDING.md) | Redeploy from the committed source; re-create the Sheet + triggers; update `FORMS_WEBHOOK_TOKEN` wiring per [FORMS.md](FORMS.md).       |
| **Budget Sheet**               | Budget + Fundraising + Availability tabs, read via gviz (`src/lib/gsheets.ts`)                                                                         | Treasurer's / school account                                      | Hub money widgets show designed empties; re-point Hub settings → Budget spreadsheet code at a copy.                                     |
| **Helper-schedule Sheets**     | One per class, linked from class docs                                                                                                                  | Class reps / school account                                       | Links 404; update each `class` doc's Helper schedule link.                                                                              |
| **Class photo albums**         | Google Photos shared albums, linked from class docs                                                                                                    | Teachers / school account                                         | Links 404; update each `class` doc's album link.                                                                                        |
| **Drive / Canva documents**    | Handbook, bylaws, forms on the Documents page                                                                                                          | Various board members                                             | Links 404; re-upload and update the `hubDocument` docs.                                                                                 |

## How the calendar pipeline works (post-2026-07-17)

```
Google Calendar (contact@, public)
  └─ read by → calendar-feed.gs web app (maintainer's account, /exec URL)
       └─ fetched by → Worker SSR (src/lib/hub-calendar.ts, cached 12h + 24h SWR)
            └─ renders → hub home widget, /family-hub/calendar, /api/digest
```

- The feed serves `{ title, start, end?, allDay, location?, description? }`;
  the site renders time ranges and dialog details from the richer fields.
- The web app needs only READ access: any account that subscribes to the
  public calendar can host it. Editing events is separate and needs the
  calendar OWNER to share edit rights.
- The /exec URL lives in `.dev.vars` (`CALENDAR_FEED_URL`) and in Sanity
  (Hub settings → Calendar feed link). Changing the URL is
  `scripts/patch-calendar-feed-url.mjs` (queued — see [PENDING.md](PENDING.md)).
- The public-site subscribe buttons (Add to Google / Apple / Outlook) are
  built from Site Settings → **Google Calendar ID** instead — a different
  setting, pointing at the calendar itself, not the feed.

## The lesson (why this file exists)

Access to `contact@westchesterpreschool.org` was lost in a board transition,
taking the original calendar-feed script with it. The feed was rebuilt from
the site's consumer contract because the script source wasn't committed
anywhere. Hence the rules now:

1. **Every Apps Script's source gets committed** to `scripts/apps-script/` the
   day it's deployed, so any account can redeploy it.
2. **Prefer a co-op-owned account** (credentials handed over each year) over
   any personal or role account for new Google-side pieces. Migrating the
   calendar itself to one is the open long-term item.
3. **Watchdogs over silence**: external dependencies degrade gracefully by
   design, which also means they fail silently. Pair each with an alert (the
   calendar has one; the sheets rely on someone noticing the empty states).
