# Who can edit what — Sanity roles & access

This is a **do-it-yourself admin task** for the project owner (Nathan). Changing who
has access is an account-security action, so it is done by you in your Sanity dashboard,
not in code. This doc is the how-to.

## The honest version first

Sanity's built-in roles are **coarse**, not per-field:

| Role              | Can do                                                                            |
| ----------------- | --------------------------------------------------------------------------------- |
| **Administrator** | Everything, including managing members, billing, and API tokens.                  |
| **Editor**        | Create, edit, publish, and delete **all** content. Cannot manage members/billing. |
| **Viewer**        | Read-only. Can open the Studio and look, but not change anything.                 |

There is **no built-in way** to say "this volunteer may edit News but not tuition."
Truly granular, per-document or per-field permissions require **custom roles**, which are
a **paid plan** feature (Growth/Enterprise). On the free plan you have the three roles
above.

**So the practical setup for a volunteer board is:**

- **Administrator** — just you (and maybe one backup board officer). Keep this small.
- **Editor** — trusted volunteers who help maintain content (post news, update classes,
  add events). They _can_ technically change tuition, so we lean on the guardrails below.
- **Viewer** — anyone who should only look (a new board member getting oriented).

The money-sensitive fields (tuition, PayPal button IDs) are protected by **convention,
not permission**: the in-Studio Help & Guide flags them with "check with Nathan first,"
and the "never click Remove field" rule is spelled out there too. For a small, trusted
board this is usually the right amount of friction. If you ever need hard enforcement,
that is the moment to consider a paid plan with custom roles.

## How to add or change a member

1. Go to **[manage.sanity.io](https://manage.sanity.io)** → project **West Chester
   Preschool** (`niemhgev`) → **Members**.
2. **Invite** with their email, and pick a role (**Editor** for a helper, **Viewer** for
   read-only). They accept by email and log in at `/studio` on the site.
3. To change someone later, click their name and switch the role. To remove access,
   remove them here. (Existing content they made stays; only their access changes.)

## Good habits

- Keep **Administrators** to one or two people.
- Give new volunteers **Viewer** first; promote to **Editor** once they are comfortable.
- Review the member list once a year (start of the school year is a natural time) and
  remove anyone who has rolled off the board.

See also: [SANITY.md](SANITY.md) (project + Studio), and the in-Studio **Help & Guide**
("Do it yourself vs. ask for help") which is the volunteer-facing version of the
money-sensitive-fields convention.
