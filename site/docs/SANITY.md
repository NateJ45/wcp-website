# Sanity — the content system behind the Family Hub

Sanity is where the hub's private content lives (announcements, documents, per-class
notes, and the family directory). The website reads it **server-side, with a token,
behind the family gate** — the dataset is private, so PII never touches the public site
or git. Content that stays on Google (Calendar, Fundraising) is **not** in Sanity.

- **Project ID:** `niemhgev`  ·  **Dataset:** `production` (private)
- **Studio config:** [sanity.config.ts](../sanity.config.ts) · schemas in [src/sanity/schemaTypes/](../src/sanity/schemaTypes/)
- **Read client:** [src/lib/sanity.ts](../src/lib/sanity.ts) (server-only, token, `useCdn: false`)

## Content types (what board members can edit)

| Type | What it feeds |
| --- | --- |
| **Update** | School Updates feed (pin to surface on the hub home; target a class or all) |
| **Document / Form** | Documents & Forms (link or uploaded file, grouped by category incl. meeting minutes) |
| **Class Note** | Per-class notes on each class hub page |
| **Directory — Family** | Family Directory (**PII**; only entries marked "Show in directory" appear) |

Editors get bold/italic/links/lists and a couple of headings — no raw HTML, no color or
font controls. They can't break the design.

## The Studio

The Studio is embedded at **`/studio`** on the site (ships with the normal deploy) and
can also be deployed to a hosted URL. It's already built and working — it just needs two
one-time **admin** actions that your Editor token can't do (they require your own login):

### 1. Add CORS origins (required — the Studio can't talk to Sanity without this)

Easiest: open the deployed `/studio`, and on the *"Connect this Studio to your project"*
screen click **Add CORS origin** — it pre-fills the current URL. Do this for each origin
you'll use. Or add them in one place at
**manage.sanity.io → project `niemhgev` → API → CORS Origins** (check *Allow credentials*):

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

- **`SANITY_TOKEN`** (Editor token) is a **server-only secret**. It lives in `.dev.vars`
  (gitignored) for local dev; for production set it as a Cloudflare secret:
  ```sh
  npx wrangler secret put SANITY_TOKEN
  ```
- `projectId` / `dataset` are **not** secret (the Studio bundles them) — they're in
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
   - *(If you'd rather use a fine-grained token: scope it to just `wcp-website` with
     **Contents: Read and write** — GitHub's docs don't explicitly confirm this works
     for this endpoint, so try it and fall back to the classic token above if the
     webhook gets a 403.)*
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
