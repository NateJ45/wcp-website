# Redirects (moving off Squarespace)

When the real domain is pointed at this site, **old Squarespace URLs will 404** unless we
redirect them. Search engines and anyone who bookmarked or linked an old page should land
on the right new page, and Google should carry the ranking over.

**Status: the mechanism is live in production** — the launch map in `astro.config.mjs`,
the board-editable `redirect` docs, and the designed 404 all ship today; what remains for
cutover is the per-post `/blog/<slug>` sweep (see the launch checklist).

## Already done (pulled from the old sitemap, 2026-07)

The old public URLs were read straight from `westchesterpreschool.org/sitemap.xml`, and the
`redirects` map in [`astro.config.mjs`](../astro.config.mjs) now covers every path that
**changed**:

| Old Squarespace URL | New URL           |
| ------------------- | ----------------- |
| `/home`             | `/`               |
| `/twos-class`       | `/classes/twos`   |
| `/threes-class`     | `/classes/threes` |
| `/pre-k-class`      | `/classes/pre-k`  |
| `/coop-life`        | `/co-op-life`     |
| `/tour`             | `/virtual-tour`   |
| `/families`         | `/family-hub`     |

**Family hub dashboards** — on Squarespace these were top-level pages behind the shared
password; they map 1:1 onto the new gated hub:

| Old Squarespace URL   | New URL                   |
| --------------------- | ------------------------- |
| `/blog`               | `/family-hub/updates`     |
| `/calendar`           | `/family-hub/calendar`    |
| `/coop-jobs`          | `/family-hub/coop-jobs`   |
| `/documents`          | `/family-hub/documents`   |
| `/directory`          | `/family-hub/directory`   |
| `/fundraising`        | `/family-hub/fundraising` |
| `/health`             | `/family-hub/health`      |
| `/tuition-payments`   | `/family-hub/tuition`     |
| `/twos-classroom`     | `/family-hub/twos`        |
| `/threes-classroom`   | `/family-hub/threes`      |
| `/pre-k-am-classroom` | `/family-hub/pre-k-am`    |
| `/pre-k-pm-classroom` | `/family-hub/pre-k-pm`    |

Pages whose path did **not** change (`/tuition`, `/faq`, `/enroll`, `/donate`,
`/newsletter`, `/work-with-us`, `/why-wcp`, `/a-day-at-wcp`) resolve directly and need no
redirect. `/about` and `/contact` DID exist on the new site until the 2026-08-04 page
merges (about → Why WCP?, contact → Visit Us); both now 301 via the static map in
`astro.config.mjs` plus matching Board-editable redirect docs in the Studio. `/families` was the old password-protected families area (returns
401, so it wasn't in the sitemap — found via the site nav); it and its dashboards map to
the new `/family-hub/*` (see the table above). Note `/blog` and `/calendar` were the hub's
gated meeting blog and calendar, so they point into the hub — not the public `/news` / `/events`.

There should be nothing left to do here for the current set of pages. The rest of this doc
is for adding more later.

## Renaming a page: the redirect files itself

**A slug rename no longer breaks links, and nobody has to remember anything.** When a board
member changes the **Web address (slug)** of an already-published `page` or `post` and hits
Publish, the Studio creates the matching `redirect` document first (old path → new path,
permanent), then publishes as normal. A toast confirms it: _"Old link kept working."_

- **Where it lives:** [`src/sanity/actions/slugRedirect.tsx`](../src/sanity/actions/slugRedirect.tsx),
  a thin wrapper around the stock Publish action, applied in `sanity.config.ts` to the types
  in `SLUG_REDIRECT_TYPES` (`page`, `post`). It is purely additive — same button, same
  shortcut, same states.
- **Exactly when it fires:** on Publish, and only when the document already has a **published**
  version whose slug differs from the one going live. A first publish, a draft rename that was
  never live, and an ordinary content edit all do nothing.
- **It never blocks publishing.** If the redirect write fails, the board gets a warning toast
  telling them to add one by hand, and the page publishes anyway.
- **No duplicates, no chains.** If a redirect already covers that old path, the existing one
  wins (the board may have corrected it). And renaming twice (A→B, then B→C) repoints the old
  A→B entry straight at C, so visitors take one hop.
- **Paths are normalized** by [`src/lib/redirects.ts`](../src/lib/redirects.ts), the same
  module the build uses, so `/old-page` and `/old-page/` can never disagree. `home` maps to
  `/`; posts map to `/news/<slug>`.

## How to add a redirect by hand

Still needed for an address that never existed on this site — an old Squarespace URL, a
printed flyer, a typo someone linked. **The board can do this themselves** — no code change. In the Studio, in the
**Public website** workspace → **Site setup** → **Redirects** → **＋** and fill in the old path
and where it should go. On Publish, the next rebuild (which the publish itself triggers)
turns it into a real 301 (or a 302, if the board unchecks the doc's "permanent" box). `astro.config.mjs` reads these `redirect` documents at build via
`fetchCmsRedirects()` and folds them into the `redirects` map alongside the launch ones
below. Fully fail-safe: if Sanity is unreachable at build the CMS redirects are skipped and
the build still succeeds on the static launch redirects.

**Why build time and not per-request?** The public site is `output: 'static'`, so the 404
route is prerendered and middleware never runs for it. Serving redirects at request time
would mean making that route SSR and reading a list on every miss — a Worker invocation and a
cache read in front of the one route that exists to be cheap, on an account whose KV is
already near its free daily write cap. The build-time map costs nothing per request, is a
real 301, and is live 1-2 minutes after publish. See the header comment in `src/lib/redirects.ts`.

The developer-edited launch redirects (below) stay in code because they're SEO-critical and
one-time. Anything the board adds later goes in the Studio.

### Developer: the launch redirects

Edit the `redirects` map in [`astro.config.mjs`](../astro.config.mjs) — one line per old
path:

```js
redirects: {
  '/blog': '/news',
  '/our-classes': '/classes/twos',
  '/about-us': '/about',
  // ...one per old URL
},
```

Left side = the **old** path, right side = the **new** one. These become real **301
(permanent)** redirects via the Cloudflare adapter, which is what search engines want.
Rebuild/redeploy and they take effect.

## Getting the full old-URL list

Before cutover, grab every old URL from the current Squarespace site:

1. Visit `https://<old-site>/sitemap.xml` and copy the list of URLs, **or**
2. In Google Search Console (if connected), export the indexed pages.

Then map each old path to its closest new page. Anything with no good match can point at
the homepage (`'/old-thing': '/'`) so it never 404s.

## Notes

- Redirect only **paths that changed**. If an old URL is identical to a new one (e.g.
  `/about`), you don't need a redirect.
- The **launch** redirects here are developer-edited because they're a one-time SEO-critical
  task. **Ongoing** renames are self-service in the Studio (see "How to add redirects" above),
  so the board never has to send an old URL list to the developer again. A board entry for the
  same `from` path wins over a launch one (the CMS map is spread last), so a launch mistake
  can be corrected without a code change.
