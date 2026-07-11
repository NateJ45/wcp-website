# Sanity — the content system behind the whole site

Sanity is the CMS behind **both** halves of the site:

1. **The public marketing site** is a full **page builder** — every page is a Sanity
   document a volunteer composes from a palette of sections. These are read at **build
   time** and prerendered to static HTML. See [PAGE_BUILDER.md](PAGE_BUILDER.md).
2. **The Family Hub** private content (announcements, documents, per-class notes, the
   family directory) is read **server-side, with a token, behind the family gate** —
   the dataset is private, so PII never touches the public site or git.

Content that stays on Google (Calendar, Fundraising) is **not** in Sanity.

- **Project ID:** `niemhgev` · **Dataset:** `production` (private) · **API version:** `2025-01-01`
- **Studio config:** [sanity.config.ts](../sanity.config.ts) · schemas in [src/sanity/schemaTypes/](../src/sanity/schemaTypes/)
- **Studio plugins:** `structureTool`, `presentationTool` (click-to-edit), and `sanity-plugin-media` (the "Media" library tool — grid browse, tags, alt editing, usage)
- **Read clients:** [src/lib/cms.ts](../src/lib/cms.ts) (public build-time reads),
  [src/lib/sanity.ts](../src/lib/sanity.ts) (gated hub, request-time),
  [src/lib/cms-preview.ts](../src/lib/cms-preview.ts) (Studio draft preview, stega on)

## Content types (what board members can edit)

**Public site (built into static pages):**

| Type                  | What it feeds                                                                   |
| --------------------- | ------------------------------------------------------------------------------- |
| **Page**              | Every public page, as a hero + a stack of sections (the page builder)           |
| **News post**         | The News/blog feed (/news) — title, cover, summary, rich body, category         |
| **Event**             | The public Events page (/events) — dated open houses, tours, closures           |
| **Menus**             | The header and footer navigation (singleton)                                    |
| **Class**             | Each class's schedule, ages, tuition — used on its page, the tuition table, hub |
| **Staff**             | Teacher names and bios (one source, shown everywhere they appear)               |
| **Tuition & Fees**    | Registration / participation fees and payment info (singleton)                  |
| **FAQ**               | The FAQ page, grouped by category                                               |
| **Testimonial**       | Parent quotes (feature one for the homepage wall)                               |
| **School-Year Event** | The school-year timeline                                                        |
| **Legal page**        | Privacy / Terms / Accessibility long-form bodies                                |
| **Site Settings**     | Phone, email, address, social, current school year (singleton, used everywhere) |

**Family Hub (read live behind the gate):**

| Type                      | What it feeds                                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| **Update**                | School Updates feed (pin to surface on the hub home; target a class or all)                   |
| **Document / Form**       | Documents & Forms (link or uploaded file, grouped by category incl. meeting minutes)          |
| **Class Note**            | Per-class notes on each class hub page                                                        |
| **Directory — Family**    | Family Directory (**PII**; only entries marked "Show in directory" appear)                    |
| **Form submission**       | Messages sent through website contact forms (**PII**; created by the site, read-only)         |
| **Newsletter subscriber** | Newsletter sign-ups (**PII**; created by the site; also pushed to your email provider if set) |

Editors get bold/italic/links/lists and a couple of headings — no raw HTML, no color or
font controls, and (in the page builder) no spacing or layout knobs. They can't break the
design. See [PAGE_BUILDER.md](PAGE_BUILDER.md) for why that brand-lock is deliberate.

## The Studio

The Studio is embedded at **`/studio`** on the site (ships with the normal deploy) and
can also be deployed to a hosted URL. It's already built and working — it just needs two
one-time **admin** actions that your Editor token can't do (they require your own login):

### 1. Add CORS origins (required — the Studio can't talk to Sanity without this)

Easiest: open the deployed `/studio`, and on the _"Connect this Studio to your project"_
screen click **Add CORS origin** — it pre-fills the current URL. Do this for each origin
you'll use. Or add them in one place at
**manage.sanity.io → project `niemhgev` → API → CORS Origins** (check _Allow credentials_):

- your live site origin, e.g. `https://www.westchesterpreschool.org`
- `https://westchesterpreschool.sanity.studio` (if you deploy the hosted Studio, below)
- `http://localhost:3333` (only if you run the Studio locally via `npx sanity dev`)

Or from the terminal after `npx sanity login`:

```sh
npx sanity cors add https://www.westchesterpreschool.org --credentials
```

### 2. (Optional) Deploy the hosted Studio

Gives you a stable `westchesterpreschool.sanity.studio` URL, independent of the website.
Requires your login (the Editor token lacks the deploy grant):

```sh
npx sanity login      # opens the browser; log in as the project owner
npx sanity deploy      # publishes to westchesterpreschool.sanity.studio
```

If `westchesterpreschool` is taken, change `studioHost` in [sanity.cli.ts](../sanity.cli.ts).

## Secrets & config

**`SANITY_TOKEN`** (Editor token) is a **server-only secret**, never committed. It is read
in two different contexts, so it lives in a few places:

| Where                         | Why                                                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------------------------- |
| `.env` (gitignored)           | Local **build** — `cms.ts` reads public page content via `import.meta.env` at build time             |
| `.dev.vars` (gitignored)      | Local **Worker runtime** — the gated hub reads via `cloudflare:workers` env under `wrangler`/preview |
| GitHub `secrets.SANITY_TOKEN` | CI, Lighthouse, and Deploy builds (all three pass it — a tokenless build emits an empty site)        |
| Cloudflare secret             | The deployed Worker's runtime (gated hub) — set with `npx wrangler secret put SANITY_TOKEN`          |

`projectId` / `dataset` are **not** secret (the Studio bundles them) — they're in
`astro.config.mjs`, `sanity.config.ts`, and `src/sanity/env.ts`.

## Auto-deploy on publish (Sanity → GitHub Actions → Cloudflare)

Publishing a change in the Studio does **not** update the live site by itself — the
public pages are static HTML, built once. `.github/workflows/deploy.yml` closes that
gap: it rebuilds and redeploys automatically, either when code is pushed to `main` or
when Sanity tells it a document was published.

**One-time setup (two credentials only you should create — see below for why):**

1. **Cloudflare API token**, so GitHub Actions can run `wrangler deploy`.
   - Cloudflare dashboard → **My Profile → API Tokens → Create Token** → use the
     **"Edit Cloudflare Workers"** template → scope it to your account.
   - Then, in your own terminal (not shared with anyone, including Claude):
     ```sh
     gh secret set CLOUDFLARE_API_TOKEN --repo NateJ45/wcp-website
     ```
     Paste the token when prompted.

2. **A GitHub personal access token**, so Sanity's webhook can trigger the workflow.
   The endpoint it calls (`POST /repos/.../dispatches`) is documented as needing a
   **classic** token with the `repo` scope:
   - github.com/settings/tokens → **Generate new token (classic)** → check the
     **`repo`** scope box → generate.
   - _(If you'd rather use a fine-grained token: scope it to just `wcp-website` with
     **Contents: Read and write** — GitHub's docs don't explicitly confirm this works
     for this endpoint, so try it and fall back to the classic token above if the
     webhook gets a 403.)_
   - Copy it — you'll paste it directly into Sanity's webhook config in step 3, not
     anywhere else.

3. **Create the Sanity webhook**: manage.sanity.io → project `niemhgev` → **API →
   Webhooks → Create webhook**.
   - **Name:** `Trigger site deploy`
   - **URL:** `https://api.github.com/repos/NateJ45/wcp-website/dispatches`
   - **Dataset:** `production`
   - **Trigger on:** Create, Update, Delete
   - **HTTP method:** `POST`
   - **HTTP Headers:** add two —
     - `Authorization` → `Bearer <the GitHub token from step 2>`
     - `Accept` → `application/vnd.github+json`
   - **Projection** (this becomes the request body Sanity sends — it's GROQ, but a
     plain object literal works fine as a static payload):
     ```
     {"event_type": "sanity-publish"}
     ```
   - **Filter** — skip the document types that only feed Family Hub pages. Every
     Family Hub route has `prerender = false` (session-gated, reads Sanity live on
     every request — see `src/pages/family-hub/*.astro`), so publishing a `coopRole`,
     `update`, `hubDocument`, `directoryEntry`, or `classNote` document already shows
     up immediately with no rebuild. Everything else (`testimonial`, `siteSettings`,
     `page`, `schoolYearEvent`, `faqItem`, `class`, `legalPage`, `feeSchedule`) is
     baked into the static public pages at build time and DOES need a redeploy:
     ```
     !(_type in ["coopRole", "update", "hubDocument", "directoryEntry", "classNote"])
     ```
     If a new document type is added later, decide which bucket it belongs to by
     checking whether the page(s) that read it have `prerender = false`.
   - Save. Sanity will now ping GitHub on every publish of a type that isn't
     filtered out, and the `Deploy` workflow picks it up within a minute or two.

**Why these two are on you:** creating account credentials (API tokens, PATs) is
something Claude won't do on your behalf, even when asked — they're typed directly by
you into Cloudflare's/GitHub's own screens (or your own terminal), and never pass
through the assistant. Everything else — the workflow file, the deploy logic, testing
it — is already done.

**To test it:** publish any small edit in the Studio (e.g. toggle something in Site
Settings and publish), then check the **Actions** tab on GitHub — a "Deploy" run
should start within moments, and the live site updates a minute or two after it
finishes.

## Notes

- **Local dev Studio:** `/studio` under `npm run dev` shows blank because this project's
  folder path contains spaces (`West Chester Preschool Website`), which breaks Vite's
  dev-time module loading for the Studio component. This is **dev-only** — the production
  build (and the hosted Studio) work fine. To edit locally, use the deployed Studio or run
  `npx sanity dev` (separate port).
- The website reading content does **not** depend on CORS or the Studio deploy — that path
  uses the token server-side and already works (the Updates page is live-wired as the proof).
