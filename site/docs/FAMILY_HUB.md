# Family Hub — how the gate works & how to run it

The Family Hub (`/family-hub/**`) is the private, enrolled-families-only area. Unlike
the marketing pages (which are static HTML built ahead of time), every hub page is
**server-rendered on each request** so it can (a) check you're signed in and (b) read
private content that must never sit in the public site or in git.

## How the gate works

1. **Middleware** (`src/middleware.ts`) runs on every request to a `/family-hub/*` page.
   If you have no valid session it redirects you to `/family-hub/login`, remembering
   where you were headed (`?to=…`) so you land there after signing in.
2. **Login** (`/family-hub/login`) takes the one shared family password and POSTs it to
   `/api/hub-login`, which compares it (constant-time) to the `FAMILY_HUB_PASSWORD`
   secret. On a match it sets a signed, `HttpOnly` session cookie and sends you on.
3. **Sign out** posts to `/api/hub-logout`, which destroys the session.

The password is a **single shared password for the whole school**, rotated each year —
not a per-family login. That matches the old Squarespace hub and keeps it simple for a
volunteer board.

## One-time setup (before the first deploy)

Run these from the `site/` folder. You only do this once.

```sh
# 1. Create the KV namespace that stores sessions, then paste the printed id
#    into wrangler.jsonc under kv_namespaces → "id".
npx wrangler kv namespace create SESSION

# 2. Set this year's family password as a Cloudflare secret (you'll be prompted
#    to type it — it is never stored in git).
npx wrangler secret put FAMILY_HUB_PASSWORD
```

That's it for the gate. Deploy as usual with `npm run deploy`.

## Rotating the password (each school year)

```sh
npx wrangler secret put FAMILY_HUB_PASSWORD   # type the new one
```

Existing sessions keep working until they expire or the person signs out; new sign-ins
require the new password. Email the new password to families in the welcome message.

## Local development

- `.dev.vars` (git-ignored) holds a throwaway dev password: `FAMILY_HUB_PASSWORD="wcp-test-2026"`.
- `npm run dev`, then visit http://localhost:4321/family-hub — you'll be bounced to the
  login page; sign in with the dev password to get through.
- `.dev.vars.example` is the committed template showing what to put in `.dev.vars`.

## Where the private content lives

Hub page content (calendar, documents, directory, health, finances, per-class info) is
**not** in this repo. It lives in **Sanity**, read at request time behind this gate with
a server-only token. That keeps real family names, addresses, health and financial
details out of the public GitHub repo entirely.

## Section pages — current status

All twelve section pages are **built with their real layouts and static content** from the
current live hub (tuition rates + pay buttons, the document library, class facts, co-op
role descriptions, health/illness policy, event-type legend, and so on). Where a section's
real data is live or private, it shows a designed empty-state that names its source:

| Section                                                | Live data source (to wire)                                                         |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Calendar                                               | Google Calendar (set `googleCalendarId` in Site Settings; click-to-load embed)     |
| Fundraising                                            | Sanity `campaign` docs (Treasurer updates raised amount in the Studio) — **wired** |
| Updates, Documents, Tuition, Classes, Co-op assignment | Sanity                                                                             |
| Directory, Health (per-child)                          | Sanity — opt-in PII, gated only                                                    |

Interim content lives in typed data files under `src/data/hub/` and `src/data/classes.ts`,
so moving a section to Sanity is a change of data source, not a page rewrite. Nothing in
those files is PII (no family or board-member names, addresses, phones, or finances).

## Updates / meeting blog

The **Updates** section is the meeting blog, migrated in full from the old Squarespace
`/blog` ("School Updates"). Each post is a Sanity `update` doc with `title`, `slug`,
`excerpt`, optional `image` (a flyer/graphic), `publishedAt`, `audience`, and a full
`blockContent` `body` (rich text preserved as Portable Text). The index
(`/family-hub/updates`) lists posts as cards; each links to its own gated page
(`/family-hub/updates/[slug].astro`, SSR) that renders the body in full via
`renderPortableText`.

Re-run the one-time import any time with `node scripts/migrate-hub-updates.mjs` — it reads
the Squarespace JSON view (`/blog?format=json`), converts each post's HTML body to Portable
Text, uploads inline flyer images, and `createOrReplace`s `hubUpdate-<slug>` docs
(idempotent). Going forward the Board just adds `update` docs in the Studio.

## Directory & map

The **Directory** reads opted-in `directoryEntry` docs (PII, gated). It has a **List /
Map toggle**: the map is Leaflet + OpenStreetMap (no API key, no third-party tracker),
plotting each family's home pin relative to the school (the ★). The whole map is behind
the gate, so plotting home locations is fine here — it never touches the public site.

A family's pin comes from its `location` (a geopoint). Volunteers just type the home
`address`; running `node scripts/geocode-directory.mjs` geocodes any address that has no
pin yet (via free Nominatim, rate-limited to 1/sec) and writes back the `location`. It's
idempotent, so it only touches new/changed addresses; it could also be a scheduled GitHub
Action. The school's own pin is a fixed constant in `DirectoryMap.astro`.

---

See also: [CLAUDE.md](../CLAUDE.md) (project overview and the two content paths) ·
[SANITY.md](SANITY.md) (the CMS and secrets) ·
[PAGE_BUILDER.md](PAGE_BUILDER.md) (the public-site page builder).
