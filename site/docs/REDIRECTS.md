# Redirects (moving off Squarespace)

When the real domain is pointed at this site, **old Squarespace URLs will 404** unless we
redirect them. Search engines and anyone who bookmarked or linked an old page should land
on the right new page, and Google should carry the ranking over. This is a one-time task
done at cutover.

## How to add redirects

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

- A couple of friendly aliases are already in place (`/blog` → `/news`,
  `/calendar` → `/events`) so those common guesses work regardless.
- Redirect only **paths that changed**. If an old URL is identical to a new one (e.g.
  `/about`), you don't need a redirect.
- This is developer-edited (not in the Studio), because it's a one-time launch task and
  getting a 301 wrong can hurt SEO. Send the old URL list to whoever maintains the code.
