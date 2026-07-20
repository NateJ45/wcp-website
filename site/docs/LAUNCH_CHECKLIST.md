# Domain-cutover launch checklist

For the day westchesterpreschool.org moves from Squarespace to this site.
Adapted from GovSoft's [go-for-launch](https://github.com/govsoftusa/go-for-launch)
migration playbook, trimmed to what applies to our Astro + Cloudflare Workers stack.
Nothing here is needed for workers.dev preview deploys — this is for the real cutover.

## 1. Route & redirect inventory (before touching DNS)

- [x] ~~Map the old sitemap's routes and add 301s~~ — DONE: the launch map in
      `astro.config.mjs` covers every old-sitemap path, board-editable redirects exist,
      and a designed `404.astro` ships (see [REDIRECTS.md](REDIRECTS.md)). (Note: 301s
      live in the Astro redirects config only — `_redirects` is a Cloudflare Pages
      mechanism and does not apply to this Worker deploy.)
- [ ] Crawl the LIVE Squarespace site for `/blog/*` POST slugs (linkinator or Screaming
      Frog) and add per-post redirects `/blog/<slug>` → `/family-hub/updates/<slug>` —
      the one redirect family not yet mapped.
- [ ] Re-run `npm run check:links` against the built site with the redirects in place.

## 2. Assets & third parties

- [ ] Hero video files uploaded to their production home (they're gitignored — confirm
      they exist in the deployed asset store, not just locally).
- [ ] All Squarespace-CDN image URLs gone from content (grep the Sanity dataset for
      `squarespace-cdn`); re-upload any stragglers to Sanity.
- [ ] PayPal buttons hit the right account in production (buy a $1 test or verify ids).
- [ ] Google Calendar feed (Apps Script), budget/helper Google Sheets, and Google Photos
      albums all load from the new domain (referrer restrictions, if any). The feed was
      redeployed 2026-07-17 under the maintainer's account — ownership map in
      [GOOGLE.md](GOOGLE.md); the Site Settings URL switch is queued in
      [PENDING.md](PENDING.md).
- [ ] Analytics & verification env vars set in production (`PUBLIC_GADS_ID`,
      `PUBLIC_CF_BEACON_TOKEN`, `PUBLIC_GSC_VERIFICATION` — all consumed by
      `src/components/Analytics.astro`), and the Search Console property moved to the
      new domain.

## 3. Quality gates (all must pass on the release build)

- [ ] `npx astro check` · `npm run lint` · `npm run format:check`
- [ ] `npm run test:unit` · `npm test` · `npm run test:hub` (Chromium + webkit-iphone)
- [ ] Lighthouse: Accessibility 100 (hard gate), Performance/SEO/Best-Practices reviewed
      (CI's lighthouse.yml, or `npx lhci autorun` locally while Actions minutes are out).
- [ ] Manual pass on a real iPhone (Safari) and one Android phone: home, enroll,
      tuition pay buttons, hub login, hub home, one class page.

## 4. The gate & secrets

- [x] **Gate closed 2026-07-19.** The `HUB_OPEN` preview bypass is gone from
      `src/middleware.ts` entirely — deleted rather than set to `false`, so it cannot be
      flipped back by accident. `tests/hub-gate.spec.ts` now asserts every hub page, API
      and server island refuses an anonymous request; run `npm run test:hub` to re-verify.
      **This needs a deploy to take effect in production.**
- [ ] `FAMILY_HUB_PASSWORD` secret set in the production Worker (`wrangler secret put`).
- [ ] `SANITY_TOKEN` secret present in the production Worker.
- [ ] Rotate the shared hub password if the cutover coincides with a new school year.

## 5. DNS cutover

- [ ] Lower the DNS TTL a day ahead.
- [ ] Add the custom domain to the Worker (Cloudflare dashboard → wcp-website →
      Domains) and confirm the cert issues.
- [ ] Point `www` + apex at Cloudflare; keep the Squarespace site reachable at a
      temporary subdomain until confident.
- [ ] Confirm apex vs `www` (astro.config.mjs `site` is already
      `https://www.westchesterpreschool.org` with a TODO), fix if needed, re-run the
      build, redeploy.
- [ ] Submit the new sitemap in Google Search Console; verify the old property 301s.

## 6. Post-launch watch (first week)

- [ ] Search Console: crawl errors / 404 reports → patch redirects.
- [ ] Cloudflare analytics: any high-traffic 404s.
- [ ] A parent smoke-test: ask one non-board family to log into the hub from their
      phone and report anything confusing.
- [ ] Cancel Squarespace only after two clean weeks.
