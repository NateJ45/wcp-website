# If Nathan disappears — the one-page handoff note

For the Board. You do not need to be technical to use this page. It says what
the website runs on, what keeps working on its own, and what to do when
something needs a person. Print it. Keep a copy in the school's records.

## What the school owns (the five accounts)

Everything below should be reachable by at least TWO current board members.
If any row is only reachable by Nathan, fixing that is the most important
website task the Board has.

| Account                                           | What it holds                                                                                                          | Why it matters                                                                |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **GitHub** (repo `NateJ45/wcp-website`)           | All the code, this documentation, the nightly content backups, the robots that publish scheduled posts and check links | Losing it loses the code's home, but NOT the site (it keeps serving)          |
| **Cloudflare** (account under nathanjnixon86)     | The running website (`wcp-website` Worker), the family-hub password and other secrets, the domain's DNS after cutover  | This is the live site. Losing it takes the site offline                       |
| **Sanity** (project `niemhgev`)                   | Every word, photo, page, and the Family Hub content — plus who can log into the Studio                                 | This is the content. It is backed up nightly (see below)                      |
| **Google** (several — see [GOOGLE.md](GOOGLE.md)) | The calendar, the forms inbox, the budget sheet, the photo albums, the mailer scripts                                  | Each piece is owned by a PERSON's account; GOOGLE.md maps who and what breaks |
| **Fourthwall**                                    | The merch store and its API keys                                                                                       | Only the store card breaks without it                                         |

## What runs by itself (no person needed)

- The website keeps serving even if nobody touches anything for years.
- Board edits in the Studio (`/studio`) go live on their own after Publish.
- Every night, the whole content database is exported, **encrypted**, and kept
  on GitHub for 90 days (Actions → "Sanity dataset backup"). The unlock
  phrase is in the school records — keep it with this page; without it a
  backup cannot be opened. Restore steps are in [SANITY.md](SANITY.md) —
  and read the warning there before practicing one.
- Every 30 minutes a robot publishes any page or post scheduled with "Publish
  automatically at". Every Monday another one checks the Google links and
  writes the "Link health" report in the Studio. Every hour a third one
  checks that the site answers, and shows a red X on GitHub if it does not.
- The Studio's **Checkup** tool answers "does anything need attention?".

## What DOES need a person, eventually

- **Free-plan changes.** The site costs $0/year because Cloudflare, Sanity,
  and GitHub have free tiers. If one of them ends or limits its free tier,
  someone must notice (an email to the account owner) and act. The content
  always exports; nothing is locked in.
- **Expiring keys.** The Instagram token renews itself via a GitHub robot;
  the Sanity and Fourthwall keys are long-lived. If a widget goes quiet,
  Checkup and the empty card will say so — a developer fixes it in minutes.
- **The yearly password.** Rotate the Family Hub password each fall:
  a Cloudflare secret named `FAMILY_HUB_PASSWORD` (steps in
  [FAMILY_HUB.md](FAMILY_HUB.md)).

## If something breaks and no one knows why

1. Open the Studio's **Checkup** tool. It names most problems in plain words.
2. Look at GitHub → Actions. A red X on "Deploy" or "CI" points at the cause.
3. Still stuck? Hire any web developer for an hour or two — or sit a
   technical parent down with an AI assistant. Tell them: _"Read
   `site/CLAUDE.md` in the repo first. Everything is documented from there."_
   This stack is ordinary, popular technology (Astro, Sanity, Cloudflare);
   any working developer can pick it up from the docs.

## The worst case, in one paragraph

If every account were lost tomorrow, the school still holds: the public code
(anyone can clone it), a nightly export of every word and photo, and this
documentation. A developer can stand the whole site up again on fresh
accounts in a day: clone the repo, create a Sanity project, import the
backup, set the secrets from `.dev.vars.example`, run `npm run deploy`.
Nothing about this website lives only in one person's head.

## The successor's first four tasks

1. Get owner access to the five accounts above; add a second admin to each.
2. Confirm the nightly Backup action is green on GitHub.
3. Read [GOOGLE.md](GOOGLE.md) and claim each Google piece for a school-owned
   account.
4. Skim [CLAUDE.md](../CLAUDE.md) — it is the map to everything else.
