# Who can edit what — Sanity roles & access

This is a **do-it-yourself admin task** for the project owner (Nathan). Changing who
has access is an account-security action, so it is done by you in your Sanity dashboard,
not in code. This doc is the how-to.

## The honest version first — and it depends on your plan

Sanity's built-in roles are **coarse** (not per-field), and **which roles you even get
depends on your plan**:

| Role              | Can do                                                                         | Plan           |
| ----------------- | ------------------------------------------------------------------------------ | -------------- |
| **Administrator** | Everything, including managing members, billing, and API tokens.               | Free + up      |
| **Viewer**        | Read-only. Can open the Studio and look, but not change anything.              | Free + up      |
| **Editor**        | Create, edit, publish, delete **all** content, but not manage members/billing. | **Growth+**    |
| Custom roles      | "This person may edit News but not tuition" (per-document/field).              | **Enterprise** |

> **The catch on the free plan:** there is **no Editor role** — only **Administrator**
> and **Viewer**. So a volunteer who needs to _edit_ anything has to be an **Administrator**
> (which also lets them manage members and see billing), or they're a read-only **Viewer**.
> There's no middle tier without upgrading to Growth ($15/editor seat/mo). _Verify the exact
> roles offered on your project's **Members** screen, since Sanity's plans change._

**So the practical setup for a volunteer board on the free plan:**

- **Administrator** — you, and the small number of trusted volunteers who actually edit
  content. On free this is the only way to give edit access, so keep the circle tight and
  lean hard on the guardrails below.
- **Viewer** — anyone who should only look (a new board member getting oriented, or someone
  you don't want editing).
- **Want a true "can edit content but not touch members/billing/tuition-with-care" tier?**
  That's the **Editor** role (Growth) or **custom roles** (Enterprise) — the reason to
  consider paying.

Because everyone with edit access is effectively an Administrator on free, the
money-sensitive fields (tuition, PayPal button IDs) are protected by **convention, not
permission**: the in-Studio Help & Guide flags them with "check with Nathan first," and
the "never click Remove field" rule is spelled out there too. For a small, trusted board
this is usually the right amount of friction. If you ever need _hard_ enforcement, that's
the moment to weigh Growth (Editor role) or Enterprise (custom roles).

## How to add or change a member

1. Go to **[manage.sanity.io](https://manage.sanity.io)** → project **West Chester
   Preschool** (`niemhgev`) → **Members**.
2. **Invite** with their email, and pick a role. On the free plan that's
   **Administrator** for anyone who will edit content, or **Viewer** for read-only. (On
   Growth you'd pick **Editor** for a helper instead of Administrator.) They accept by
   email and log in at `/studio` on the site.
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
