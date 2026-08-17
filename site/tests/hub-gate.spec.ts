import { expect, test } from '@playwright/test';

// =============================================================================
// The gate itself. Runs with NO stored session (see the `gate` project in
// playwright.hub.config.ts) — every request here is an anonymous stranger.
// =============================================================================
// This exists because the hub shipped fully open: src/middleware.ts carried a
// `HUB_OPEN = true` preview bypass that was never flipped back, exposing the
// family directory, the children's photo wall and the health page. Nothing
// failed, because nothing tested it. These specs are that missing alarm.
//
// The middleware is the ONLY gate — no hub page or endpoint checks auth itself
// — so a route missing from these lists is a route with no coverage at all.
// Add every new hub surface here.
// =============================================================================

/** Every gated hub page. Keep in sync with src/pages/family-hub/. */
const HUB_PAGES = [
  '/family-hub',
  '/family-hub/calendar',
  '/family-hub/documents',
  '/family-hub/directory', // family PII: names, addresses, phone numbers, map pins
  '/family-hub/health', // health details
  '/family-hub/photos', // photos of children
  '/family-hub/tuition',
  '/family-hub/fundraising',
  '/family-hub/coop-jobs',
  '/family-hub/updates',
  '/family-hub/updates/any-slug',
  '/family-hub/getting-started',
  '/family-hub/super-helper',
  '/family-hub/sign-ups',
  '/family-hub/hours',
  '/family-hub/celebrations',
  '/family-hub/twos-threes',
  '/family-hub/pre-k',
  '/family-hub/twos',
  '/family-hub/threes',
  '/family-hub/pre-k-am',
  '/family-hub/pre-k-pm',
  // Board-created pages (the gated catch-all). Both an EXISTING page and a
  // made-up address: the catch-all must send a signed-out visitor to the login
  // page either way. If it ever 404'd before the gate ran, the 404 itself would
  // leak which hub pages exist.
  '/family-hub/example-committee',
  '/family-hub/no-such-page-exists',
];

/** Hub API endpoints. None of these do their own auth check. */
const HUB_GET_ENDPOINTS = ['/family-hub/api/search-index'];
const HUB_POST_ENDPOINTS = [
  '/family-hub/api/signup',
  '/family-hub/api/log-hours',
  '/family-hub/api/photo-submit',
];

test.describe('anonymous visitors are locked out', () => {
  for (const path of HUB_PAGES) {
    test(`${path} redirects to the sign-in page`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/family-hub\/login/);
      // The form is really there — not a hub page that merely looks redirected.
      await expect(page.getByLabel('Family password')).toBeVisible();
    });
  }

  // These assert the EXACT status, not merely "not 200". An earlier draft used
  // `.not.toBe(200)`, which a plain 404 also satisfies — so the tests passed
  // when they leaked into the static public suite, where /family-hub does not
  // exist at all. "Not 200" is not evidence of a working gate; "302 to the
  // login page" is.
  for (const path of HUB_GET_ENDPOINTS) {
    test(`GET ${path} redirects to sign-in`, async ({ request }) => {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status()).toBe(302);
      expect(res.headers()['location']).toContain('/family-hub/login');
    });
  }

  for (const path of HUB_POST_ENDPOINTS) {
    test(`POST ${path} redirects to sign-in`, async ({ request, baseURL }) => {
      // The Origin header is required: without it Astro's CSRF check rejects
      // the POST with a 403 before the middleware is ever consulted, so the
      // test would pass while proving nothing about the GATE. Sending a valid
      // origin gets the request through CSRF so the auth check is what answers.
      // (CSRF remains a genuine second layer here, just not what this asserts.)
      const res = await request.post(path, {
        maxRedirects: 0,
        failOnStatusCode: false,
        headers: { Origin: baseURL ?? 'http://localhost:4321' },
        form: {},
      });
      expect(res.status()).toBe(302);
      expect(res.headers()['location']).toContain('/family-hub/login');
    });
  }

  test('hub POST endpoints also reject a cross-origin request (CSRF layer)', async ({
    request,
  }) => {
    const res = await request.post('/family-hub/api/signup', {
      maxRedirects: 0,
      failOnStatusCode: false,
      headers: { Origin: 'https://evil.example' },
      form: {},
    });
    expect(res.status()).toBe(403);
  });

  test('server islands are refused with 401, not a redirect', async ({ request }) => {
    // An island fetch cannot follow a login redirect, so the middleware refuses
    // it outright. A 200 here would mean hub widget content leaking.
    const res = await request.get('/_server-islands/UpcomingEvents', {
      maxRedirects: 0,
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(401);
  });

  test('the search index does not leak hub content', async ({ request }) => {
    // This endpoint returns ~61KB of full-text hub content when open, so check
    // the BODY as well as the status.
    const res = await request.get('/family-hub/api/search-index', {
      maxRedirects: 0,
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(302);
    const body = await res.text();
    expect(body).not.toContain('family-hub/directory');
    expect(body.length).toBeLessThan(2000);
  });

  test('a forged session cookie does not get in', async ({ context, page }) => {
    // The session value is a password fingerprint checked server-side, so a
    // guessed cookie is worthless — but prove it rather than assume it.
    await context.addCookies([
      {
        name: 'astro-session',
        value: 'not-a-real-session-id',
        domain: 'localhost',
        path: '/',
      },
    ]);
    await page.goto('/family-hub/directory');
    await expect(page).toHaveURL(/\/family-hub\/login/);
  });
});

test.describe('the sign-in page itself stays reachable', () => {
  test('/family-hub/login renders the form', async ({ page }) => {
    await page.goto('/family-hub/login');
    await expect(page).toHaveURL(/\/family-hub\/login/);
    await expect(page.getByLabel('Family password')).toBeVisible();
  });

  test('a wrong password is rejected and does not grant access', async ({ page }) => {
    await page.goto('/family-hub/login');
    await page.getByLabel('Family password').fill('definitely-not-the-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/family-hub\/login/);

    await page.goto('/family-hub/directory');
    await expect(page).toHaveURL(/\/family-hub\/login/);
  });

  test('the requested destination survives the redirect', async ({ page }) => {
    await page.goto('/family-hub/calendar');
    await expect(page).toHaveURL(/to=%2Ffamily-hub%2Fcalendar/);
  });
});

test.describe('public pages are untouched by the gate', () => {
  for (const path of ['/', '/tuition', '/enroll']) {
    test(`${path} still renders for anonymous visitors`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page).not.toHaveURL(/\/family-hub\/login/);
    });
  }
});
