# Domain-cutover launch checklist

For the day westchesterpreschool.org moves from Squarespace to this site.
Adapted from GovSoft's [go-for-launch](https://github.com/govsoftusa/go-for-launch)
migration playbook, trimmed to what applies to our Astro + Cloudflare Workers stack.
Nothing here is needed for workers.dev preview deploys — this is for the real cutover.

## 1. Route & redirect inventory (before touching DNS)

- [ ] Crawl the LIVE Squarespace site and export every route (linkinator or Screaming
      Frog against westchesterpreschool.org — include `/blog/*` post slugs).
- [ ] Map every old route to its new home. Known moves so far: `/families` → `/family-hub`,
      `/blog/<slug>` → `/family-hub/updates/<slug>`, `/tuition` (public) stays.
- [ ] Add 301s for every mapped route (Astro redirects config / `_redirects`), and a
      designed 404 for anything intentionally dropped.
- [ ] Re-run `npm run check:links` against the built site with the redirects in place.

## 2. Assets & third parties

- [ ] Hero video files uploaded to their production home (they're gitignored — confirm
      they exist in the deployed asset store, not just locally).
- [ ] All Squarespace-CDN image URLs gone from content (grep the Sanity dataset for
      `squarespace-cdn`); re-upload any stragglers to Sanity.
- [ ] PayPal buttons hit the right account in production (buy a $1 test or verify ids).
- [ ] Google Calendar feed (Apps Script), budget/helper Google Sheets, and Google Photos
      albums all load from the new domain (referrer restrictions, if any).

## 3. Quality gates (all must pass on the release build)

- [ ] `npx astro check` · `npm run lint` · `npm run format:check`
- [ ] `npm run test:unit` · `npm test` · `npm run test:hub` (Chromium + webkit-iphone)
- [ ] Lighthouse: Accessibility 100 (hard gate), Performance/SEO/Best-Practices reviewed
      (CI's lighthouse.yml, or `npx lhci autorun` locally while Actions minutes are out).
- [ ] Manual pass on a real iPhone (Safari) and one Android phone: home, enroll,
      tuition pay buttons, hub login, hub home, one class page.

## 4. The gate & secrets

- [ ] `HUB_OPEN = false` in `src/middleware.ts` (the preview bypass MUST be off before
      real family PII goes in), then verify /family-hub redirects to login.
- [ ] `FAMILY_HUB_PASSWORD` secret set in the production Worker (`wrangler secret put`).
- [ ] `SANITY_TOKEN` secret present in the production Worker.
- [ ] Rotate the shared hub password if the cutover coincides with a new school year.

## 5. DNS cutover

- [ ] Lower the DNS TTL a day ahead.
- [ ] Add the custom domain to the Worker (Cloudflare dashboard → wcp-website →
      Domains) and confirm the cert issues.
- [ ] Point `www` + apex at Cloudflare; keep the Squarespace site reachable at a
      temporary subdomain until confident.
- [ ] Update `site.url` / canonical URLs, re-run the build, redeploy.
- [ ] Submit the new sitemap in Google Search Console; verify the old property 301s.

## 6. Post-launch watch (first week)

- [ ] Search Console: crawl errors / 404 reports → patch redirects.
- [ ] Cloudflare analytics: any high-traffic 404s.
- [ ] A parent smoke-test: ask one non-board family to log into the hub from their
      phone and report anything confusing.
- [ ] Cancel Squarespace only after two clean weeks.
